import { format } from 'util';
import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { StoreModel } from '../models/store.js';
import { randomUUID } from 'crypto';

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
            if (!guildId) throw new Error('This command can only be run in a guild');

            // Fetch or create the store
            const store = await StoreModel.findOne(guildId) ?? await StoreModel.create(guildId);
            if (!store) throw new Error('Failed to fetch or create a the guild\'s store');

            // Send user a list of items in the store
            await interaction.reply({
                content: 'Here are the items in the store\n' + store.items.map(item => `**${item.name}** - ${item.description} [$${item.price}]`).join('\n')
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            await interaction.reply({
                content: format('Failed running command with "%s"', error.message)
            });
        }
    }

    @Slash('inspect', {
        description: 'Inspect a single item in the server\'s store'
    })
    @SlashGroup('store')
    async inspect(interaction: CommandInteraction) {
        await interaction.reply({ content: 'hi' });
    }

    @Slash('add', {
        description: 'Add a new item to the server\'s store'
    })
    @SlashGroup('store')
    async add(
        @SlashOption('name', { type: 'STRING', description: 'The item\'s name', required: true }) name: string,
        @SlashOption('description', { type: 'STRING', description: 'The item\'s description', required: true }) description: string,
        @SlashOption('price', { type: 'STRING', description: 'The item\'s current price', required: true }) price: number,
        interaction: CommandInteraction
    ) {
        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new Error('This command can only be run in a guild');

            // Fetch or create the store
            const store = await StoreModel.findOne(guildId) ?? await StoreModel.create(guildId);
            if (!store) throw new Error('Failed to fetch or create a the guild\'s store');

            // Add item to the store
            store.items.push({
                name,
                description,
                uuid: randomUUID(),
                priceHistory: [],
                price
            });

            // Save the store
            await StoreModel.update(guildId, store);

            // Tell the user the item was added to the store
            await interaction.reply({
                content: `**${name}** - "${description}" has been added to the store for $${price}`
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            await interaction.reply({
                content: format('Failed running command with "%s"', error.message)
            });
        }
    }
}
