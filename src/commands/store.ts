import { format } from 'util';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { StoreModel } from '../models/store.js';
import { randomUUID } from '../common/random-uuid.js';
import { InventoryModel } from '../models/inventory.js';
import { UserModel } from '../models/user.js';
import { CommandError } from '../common/command-error.js';

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
            const store = await StoreModel.findOne(guildId) ?? await StoreModel.create(guildId);
            if (!store) throw new CommandError('Failed to fetch or create a the guild\'s store');

            // Send user a list of items in the store
            await interaction.reply({
                embeds: [new MessageEmbed({
                    description: 'Here are the items in the store\n' + store.items.map(item => {
                        return `\`[${item.uuid}]\` **${item.name}** - ${item.description} [$${item.price}]`
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
    async inspect(interaction: CommandInteraction) {
        await interaction.reply({ content: 'hi' });
    }

    @Slash('add', {
        description: 'Add a new item to the server\'s store'
    })
    @SlashGroup('store')
    async add(
        @SlashOption('name', { type: 'STRING', description: 'The item\'s name', required: true }) name: string,
        @SlashOption('emote', { type: 'STRING', description: 'The item\'s emote', required: true }) emote: string,
        @SlashOption('description', { type: 'STRING', description: 'The item\'s description', required: true }) description: string,
        @SlashOption('price', { type: 'STRING', description: 'The item\'s current price', required: true }) price: number,
        interaction: CommandInteraction
    ) {
        try {
            const { guildId } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Fetch or create the store
            const store = await StoreModel.findOne(guildId) ?? await StoreModel.create(guildId);
            if (!store) throw new CommandError('Failed to fetch or create a the guild\'s store');

            // Add item to the store
            store.items.push({
                name,
                emote,
                description,
                uuid: randomUUID(),
                priceHistory: [],
                price
            });

            // Save the store
            await StoreModel.update(guildId, store);

            // Tell the user the item was added to the store
            await interaction.reply({
                content: `**${name}** - "${description}" has been added to the store for $${price}`,
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

    @Slash('buy', {
        description: 'Buys an new item from the server\'s store'
    })
    @SlashGroup('store')
    async buy(
        @SlashOption('uuid', { type: 'STRING', description: 'The item\'s uuid', required: true }) uuid: string,
        interaction: CommandInteraction
    ) {
        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Fetch or create the store
            const store = await StoreModel.findOne(guildId) ?? await StoreModel.create(guildId);
            if (!store) throw new CommandError('Failed to fetch or create a the guild\'s store');

            // Check if the item exists in the store
            const item = store.items.find(item => item.uuid === uuid);
            if (!item) throw new CommandError('Invalid UUID, no item found in the store');

            // Fetch or create the user
            const user = await UserModel.findOne(guildId, userId) ?? await UserModel.create(guildId, userId);
            if (!user) throw new CommandError('Failed to fetch or create a user');

            // Check if user has enough money
            if (user.balance < item.price) throw new CommandError('You don\'t have enough money in your wallet to buy this item.');

            // Remove money from the user
            user.balance -= item.price;

            // Save the user
            await UserModel.update(guildId, userId, user);

            // Remove item from the store
            store.items = store.items.splice(store.items.indexOf(item), 1);

            // Save the store
            await StoreModel.update(guildId, store);

            // Add this purchase to the item's price history
            item.priceHistory.unshift({
                buyer: `member:${interaction.user.id}`,
                date: new Date(),
                price: item.price,
                seller: `guild:${guildId}`
            });
            
            // Fetch or create the user's inventory
            const inventory = await InventoryModel.findOne(guildId, userId) ?? await InventoryModel.create(guildId, userId);
            if (!inventory) throw new CommandError('Failed to fetch or create a user\'s inventory');

            // Add the item to the user's inventory
            inventory.items.push(item);

            // Save the inventory
            await InventoryModel.update(guildId, userId, inventory);

            // Tell the user the item was purchased
            await interaction.reply({
                content: `**${item.name}** - "${item.description}" has been purchased for $${item.price}`,
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
}
