import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import prettyMilliseconds from 'pretty-ms';
import { format } from 'util';
import { CommandError } from '../common/command-error.js';
import { logger } from '../common/logger.js';

/** Twenty minutes in milliseconds */
const TWENTY_MINUTES = 1_200_000;

@Discord()
export class PurgeCommand {
    private isPurgeRunning = false;

    getRandomItems<T = unknown>(array: T[], count: number = 30): T[] {
        return array.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    @Slash('purge', {
        description: 'Purge members'
    })
    async purgeMembers(
        @SlashOption('dry-run', { type: 'BOOLEAN', description: 'Should this be a dry-run?', required: false }) dryRun: boolean = true,
        interaction: CommandInteraction
    ) {
        try {
            if (this.isPurgeRunning) throw new CommandError('A purge is already running, please wait for that to finish first.');

            // Ensure we're running this in a guild
            if (!interaction.guild) throw new CommandError('This must be used in a guild.');
    
            // If the guild everyone role is missing then fetch it
            if (!interaction.guild?.roles.everyone) await interaction.guild?.roles.fetch();
    
            // Make sure to fetch all current members
            await interaction.guild.members.fetch();

            this.isPurgeRunning = true;
      
            const totalMembers = interaction.guild.members.cache.filter(member => {
                // false - Member is a bot
                if (member.user.bot) return false;
                if (member.roles.cache.find(role => role.name.toLowerCase().includes('bot')) !== undefined) return false;
                
                // false - Member is verified
                if (member.roles.cache.find(role => role.name.toLowerCase().includes('verified')) !== undefined) return false;

                // false - Member has SFW verification
                if (member.roles.cache.find(role => role.name.toLowerCase().includes('[sfw only]')) !== undefined) return false;
                
                // false - Member is trusted
                if (member.roles.cache.find(role => role.name.toLowerCase().includes('trusted')) !== undefined) return false;
                
                // false - Member joined less than 20 mins ago
                if (Date.now() - (member.joinedTimestamp ?? 0) < TWENTY_MINUTES) return false;

                // true - Member has no roles
                if (member.roles.cache.size === 1) return true;

                // true - Member hasn't accepted the rules
                if (member.roles.cache.find(role => role.name.toLowerCase().startsWith('just joined')) !== undefined) return true;

                // true - Member has no level role
                if (member.roles.cache.find(role => role.name.toLowerCase().startsWith('level')) === undefined) return true;

                // true - Member's level is high enough to verify yet they haven't
                if (member.roles.cache.find(role => {
                    const roleName = role.name.toLowerCase();
                    const levelRole = roleName.startsWith('level');
                    if (!levelRole) return false;
                    const level = Number(roleName.split('level ')[1]);
                    return level >= 1;
                }) !== undefined) return true;

                // false - member didn't meet any of the criteria
                return false;
            });
            const purgeableMembers = this.getRandomItems([...totalMembers.values()], 50);
            await interaction.reply(`${dryRun ? '[DRY-RUN] ' : ''}Kicking ${purgeableMembers.length}/${totalMembers.size} members, please stand by…`);
            await Promise.allSettled(purgeableMembers.map(async member => {
                logger.debug(`${dryRun ? '[DRY-RUN] ' : ''}Kicking ${member.displayName} - ${prettyMilliseconds(Date.now() - (member.joinedTimestamp ?? 0))} - ${member.roles.cache.map(role => role.name).join(', ')}`);        
                if (!dryRun) await member.kick();
                logger.debug(`${dryRun ? '[DRY-RUN] ' : ''}Kicked ${member.displayName} - ${prettyMilliseconds(Date.now() - (member.joinedTimestamp ?? 0))} - ${member.roles.cache.map(role => role.name).join(', ')}`);    
            }));
            await interaction.editReply(`${dryRun ? '[DRY-RUN] ' : ''}Kicked ${purgeableMembers.length}/${totalMembers.size} members. :white_check_mark:`);
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
        } finally {
            this.isPurgeRunning = false;
        }
    }
}
