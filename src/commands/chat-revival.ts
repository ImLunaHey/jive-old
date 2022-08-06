import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { logger } from '../common/logger.js';
import { getRandomTopic } from '../common/topics.js';

@Discord()
export class ChatRevival {
    @Slash('chat-revial', {
        description: 'Try to revive chat with a new topic'
    })
    async topic(
        interaction: CommandInteraction
    ) {
        try {
            await interaction.reply({
                content: '<@&1005378317563736105>',
                embeds: [new MessageEmbed({
                    description: `If you don't know what to talk about, here's a random topic. To generate these manually use \`/topic\`.\n**__${getRandomTopic()}__**`
                })]
            });
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
