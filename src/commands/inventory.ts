import { format } from 'util';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';
import { InventoryModel } from '../models/inventory.js';
import { CommandError } from '../common/command-error.js';

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
                embeds: [new MessageEmbed({
                    description: 'Here are the items in your inventory\n' + JSON.stringify(user.items)
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
    async inspect(interaction: CommandInteraction) {
        try {
            await interaction.reply({ content: 'hi' });
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
