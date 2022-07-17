import { format } from 'util';
import { AutocompleteInteraction, CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { UserModel } from '../models/user.js';
import { CommandError } from '../common/command-error.js';
import { ItemModel } from '../models/items.js';
import { PriceHistoryModel } from '../models/price-history.js';
import { VM } from 'vm2';
import { randomUUID } from 'crypto';
import YAML from 'yaml';

const createMetadataVm = () => {
    const vm = new VM();
    vm.freeze({
        get randomUUID() {
            return randomUUID();
        },
        getRandomNumber(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        randomItem(array: any[]) {
            return array[Math.floor(Math.random() * array.length)];
        }
    }, 'utils');
    return vm;
};

const isAutocompleteInteraction = (interaction: CommandInteraction | AutocompleteInteraction): interaction is AutocompleteInteraction => interaction.isAutocomplete();

@Discord()
@SlashGroup({ name: 'store', description: 'The server\'s store' })
export class StoreCommands {
    @Slash('view', {
        description: 'Show the items in the server\'s store'
    })
    @SlashGroup('store')
    async view(
        interaction: CommandInteraction
    ) {
        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Fetch or create the store
            const items = await ItemModel.find({ guildId, userId: undefined });

            // Send user a list of items in the store
            await interaction.reply({
                embeds: [new MessageEmbed({
                    description: 'Here are the items in the store\n' + items.map(item => {
                        return `**${item.name}** - ${item.description} (x${items.filter(({ itemId }) => item.itemId === itemId).length}) [$${item.price}]`
                    }).join('\n')
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
        description: 'Inspect a single item in the server\'s store'
    })
    @SlashGroup('store')
    async inspect(
        @SlashOption('item', {
            type: 'STRING',
            description: 'The item you want to inspect',
            required: true,
            autocomplete: true
        }) itemUUIDOrSearchTerm: string,
        interaction: CommandInteraction | AutocompleteInteraction
    ) {
        if (isAutocompleteInteraction(interaction)) {
            try {
                const { guildId } = interaction;

                // Ensure this is only run in guilds
                if (!guildId) throw new CommandError('This command can only be run in a guild');

                // Get server's items
                const items = await ItemModel.find({ guildId, userId: undefined });

                // Respond with a list of items
                await interaction.respond(items.filter(item => item.name.toLowerCase().startsWith(itemUUIDOrSearchTerm)).slice(0, 10).map(item => ({ name: item.name, value: item.uuid })));
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
                throw error;
            }

            return;
        }

        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild.');

            // Show the bot thinking...
            await interaction.deferReply({ ephemeral: true });

            // Fetch item for this server
            const item = await ItemModel.findOne({
                uuid: itemUUIDOrSearchTerm
            });

            // Check if the item exists in the user's inventory
            if (!item) throw new CommandError('Couldn\'t find that item in the store.');

            // Get the highest price this item has ever been sold for
            const highestPrice = await PriceHistoryModel.mostExpensiveSale(guildId, item.itemId);

            // Reply with the item
            await interaction.editReply({
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

    @Slash('add', {
        description: 'Add a new item to the server\'s store'
    })
    @SlashGroup('store')
    async add(
        @SlashOption('name', { type: 'STRING', description: 'The item\'s name', required: true }) name: string,
        @SlashOption('description', { type: 'STRING', description: 'The item\'s description', required: true }) description: string,
        @SlashOption('price', { type: 'NUMBER', description: 'The item\'s current price', required: true }) price: number,
        @SlashOption('metadata', { type: 'STRING', description: 'The item\'s metadata generator', required: false }) metadata: string = '',
        @SlashOption('count', { type: 'NUMBER', minValue: 1, description: 'How many of the item to add to the store? (default=1)', required: false }) count: number = 1,
        interaction: CommandInteraction
    ) {
        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Defer the reply for when we finish
            await interaction.deferReply({ ephemeral: true });

            // Resolve the metadata
            // If it's a URL fetch the URL contents
            const metadataCode = metadata.startsWith('http') ? await fetch(metadata, { method: 'GET' }).then(response => response.text()) : metadata;

            // Generate the item ID
            const itemId = randomUUID();
            
            // Add $count items to the store
            for (let index = 0; index < count; index++) {
                // Add item to the store
                await ItemModel.create({
                    guildId,
                    userId: undefined,
                    itemId,
                    name,
                    description,
                    price,
                    metadata: JSON.stringify(createMetadataVm().run(`(${metadataCode})`))
                });
            }

            // Tell the user the item was added to the store
            await interaction.editReply({
                content: `**${name}** - "${description}" has been added to the store for $${price}`
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            if (error instanceof CommandError) return interaction.reply({
                content: error.message,
                ephemeral: true
            });
            return interaction.editReply({
                content: format('Failed running command with "%s"', error.message)
            });
        }
    }

    @Slash('buy', {
        description: 'Buys an new item from the server\'s store'
    })
    @SlashGroup('store')
    async buy(
        @SlashOption('item', {
            type: 'STRING',
            description: 'The item you want to buy',
            required: true,
            autocomplete: true
        }) itemIdOrSearchTerm: string,
        interaction: CommandInteraction | AutocompleteInteraction
    ) {
        if (isAutocompleteInteraction(interaction)) {
            try {
                const { guildId } = interaction;

                // Ensure this is only run in guilds
                if (!guildId) throw new CommandError('This command can only be run in a guild');

                // Get server's items
                const items = await ItemModel.find({ guildId, userId: undefined });

                // Respond with a list of items
                await interaction.respond(items.filter(item => item.name.toLowerCase().startsWith(itemIdOrSearchTerm)).slice(0, 10).map(item => ({ name: item.name, value: item.itemId })));
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
                throw error;
            }

            return;
        }

        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild.');

            // Fetch item for this server
            const item = await ItemModel.findOne({
                guildId,
                userId: undefined,
                itemId: itemIdOrSearchTerm
            });

            // Check if the item exists in the store
            if (!item) throw new CommandError('Couldn\'t find that item in the store.');

            // Fetch or create the user
            const user = await UserModel.findOne(guildId, userId) ?? await UserModel.create(guildId, userId);
            if (!user) throw new CommandError('Failed to fetch or create a user');

            // Check if user has enough money
            if (user.balance < item.price) throw new CommandError('You don\'t have enough money in your wallet to buy this item.');

            // Remove money from the user
            user.balance -= item.price;

            // Save the user
            await UserModel.update(guildId, userId, user);

            // Change the item's owner
            await ItemModel.update({
                guildId,
                userId: undefined,
                itemId: itemIdOrSearchTerm,
                uuid: item.uuid
            }, {
                userId
            });

            // Add this purchase to the item's price history
            await PriceHistoryModel.create({
                guildId,
                itemId: itemIdOrSearchTerm,
                buyer: `member:${interaction.user.id}`,
                date: new Date(),
                price: item.price,
                seller: `guild:${guildId}`
            });

            // Tell the user the item was purchased
            await interaction.reply({
                content: `Purchased **${item.name}** - "${item.description}" for $${item.price}`
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
