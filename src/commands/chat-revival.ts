import { CommandInteraction } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { logger } from '../common/logger.js';
import { createRandomTopicMessage } from '../common/topics.js';

@Discord()
export class ChatRevival {
    @Slash('revive-chat', {
        description: 'Try to revive chat with a new topic'
    })
    async topic(
        interaction: CommandInteraction
    ) {
        try {
            await interaction.reply(createRandomTopicMessage());
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error('Unknown Error: ' + error);
            logger.error('Failed to get topic', error);
            await interaction.reply({
                content: 'Failed to get topic, please let a member of staff know.',
                ephemeral: true,
            });
        }
    }
}
