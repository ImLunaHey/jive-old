import { format } from 'util';
import YAML from 'yaml';
import { AutocompleteInteraction, CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { CommandError } from '../common/command-error.js';
import { ItemModel } from '../models/items.js';
import { PriceHistoryModel } from '../models/price-history.js';

const isAutocompleteInteraction = (interaction: CommandInteraction | AutocompleteInteraction): interaction is AutocompleteInteraction => interaction.isAutocomplete();

@Discord()
@SlashGroup({ name: 'inventory', description: 'User\'s inventory' })
export class InventoryCommand {
    @Slash('view', {
        description: 'Shows the items in your inventory'
    })
    @SlashGroup('inventory')
    async view(
        interaction: CommandInteraction
    ) {
        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new Error('This command can only be run in a guild');

            // Fetch user's items
            const items = await ItemModel.find({ guildId, userId });

            // Send user their wallet balance
            await interaction.reply({
                embeds: [new MessageEmbed({
                    description: 'Here are the items in your inventory\n' + items.map(item => {
                        return `**${item.name}** - ${item.description} [$${item.price}]`
                    }).join('\n') + `\nTotal value: $${items.reduce((value, { price }) => value + price, 0)}`
                })],
                ephemeral: true
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            if (error instanceof CommandError) return interaction.reply({
                content: error.message,
                ephemeral: true
            });
            return interaction.reply({
                content: format('Failed running command with "%s"', error.message),
                ephemeral: true
            });
        }
    }

    @Slash('inspect', {
        description: 'Inspects a single item from your inventory'
    })
    @SlashGroup('inventory')
    async inspect(
        @SlashOption('item', {
            type: 'STRING',
            description: 'Which item do you want to inspect?',
            required: true,
            autocomplete: true
        }) itemUUIDOrSearchTerm: string,
        interaction: CommandInteraction | AutocompleteInteraction
    ) {
        if (isAutocompleteInteraction(interaction)) {
            try {
                const { guildId, user: { id: userId } } = interaction;

                // Ensure this is only run in guilds
                if (!guildId) throw new CommandError('This command can only be run in a guild');

                // Get the user's items
                const items = await ItemModel.find({ guildId, userId });

                // Respond with a list of items
                await interaction.respond(items.filter(item => item.name.toLowerCase().startsWith(itemUUIDOrSearchTerm)).slice(0, 10).map((item, index) => {
                    return { name: `[${index}] ${item.name} - ${item.description}`.slice(0, 100), value: item.uuid };
                }));
                return;
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
                throw error;
            }
        }

        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild.');

            // Fetch item for this server
            const item = await ItemModel.findOne({
                uuid: itemUUIDOrSearchTerm
            });

            // Check if the item exists in the user's inventory
            if (!item) throw new CommandError('Couldn\'t find that item in your inventory.');

            // Get the highest price this item has ever been sold for
            const highestPrice = await PriceHistoryModel.mostExpensiveSale(guildId, item.itemId);

            // Reply with the item
            await interaction.reply({
                // @todo include a chart of price history
                // github: svg2img@next
                // npm: svg-line-chart
                embeds: [new MessageEmbed({
                    color: 233424,
                    title: item.name,
                    fields: [{
                        name: 'Description',
                        value: item.description
                    }, {
                        name: 'Purchase price',
                        value: `${item.price}`
                    }, {
                        name: 'Highest known price',
                        value: `${highestPrice}`
                    }, {
                        name: 'Metadata',
                        value: '```\n' + YAML.stringify(JSON.parse(item.metadata)) + '\n```'
                    }]
                })]
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            if (error instanceof CommandError) return interaction.reply({
                content: error.message,
                ephemeral: true
            });
            return interaction.reply({
                content: format('Failed running command with "%s"', error.message),
                ephemeral: true
            });
        }
    }
}
