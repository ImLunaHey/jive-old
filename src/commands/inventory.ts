import { format } from 'util';
import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';
import { InventoryModel } from '../models/inventory.js';

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

            // Fetch or create the user's inventory
            const user = await InventoryModel.findOne(guildId, userId) ?? await InventoryModel.create(guildId, userId);
            if (!user) throw new Error('Failed to fetch or create a user\'s inventory');

            // Send user their wallet balance
            await interaction.reply({
                content: 'Here are the items in your inventory'
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            await interaction.reply({
                content: format('Failed running command "wallet" with "%s"', error.message)
            });
        }
    }

    @Slash('inspect', {
        description: 'Inspects a single item from your inventory'
    })
    @SlashGroup('inventory')
    async inspect(interaction: CommandInteraction) {
        await interaction.reply({ content: 'hi' });
    }
}
