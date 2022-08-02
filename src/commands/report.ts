import { GuildMember, CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { logger } from '../common/logger.js';

@Discord()
export class ReportCommands {
    @Slash('report', {
        description: 'Report an issue to staff'
    })
    async reportAMember(
        @SlashOption('member', { type: 'USER', description: 'Who to report?', required: true }) reportedMember: GuildMember,
        @SlashOption('reason', { type: 'STRING', description: 'What to report?', required: true }) reason: string,
        interaction: CommandInteraction
    ) {
        // Make sure we have a reports channel
        const reportsChannel = interaction.guild?.channels.cache.find(channel => channel.name.includes('reports'));
        if (!reportsChannel || !reportsChannel.isText()) return interaction.reply({
            content: 'Please ask a member of staff to create the reports channel first.',
            ephemeral: true,
        });

        // Send report to mods
        try {
            await reportsChannel.send({
                content: '@here a user has reported an issue',
                embeds: [new MessageEmbed({
                    title: 'User report',
                    description: `${interaction.user} is reporting ${reportedMember} for: \n${'```'}${reason}${'```'}`,
                    color: 'RED'
                })]
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error('Unknown Error: ' + error);
            logger.error('Failed to send report', error);
            await interaction.reply({
                content: 'Failed to send report, please let a member of staff know.',
                ephemeral: true,
            });
        }
    }
}
