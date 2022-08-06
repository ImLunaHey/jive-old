import { Cron, Expression } from '@reflet/cron';
import { MessageEmbed } from 'discord.js';
import { client } from '../client.js';
import { getRandomTopic } from '../common/topics.js';
import { store } from '../store.js';

const ONE_HOUR = 60 * 60 * 1000;

export class ChatRevival {
    @Cron.PreventOverlap
    @Cron.RunOnInit
    @Cron(Expression.EVERY_5_MINUTES)
    async reviveChat() {
        // Check if it's been at least 1 hour since a message has been sent
        if (new Date().getTime() - store.lastMessage.getTime() >= ONE_HOUR) {
            const guild = client.guilds.resolve('927461441051701280');
            if (!guild) return;
            const channel = guild.channels.resolve('957109896313184316');
            if (!channel?.isText()) return;
            await channel.send({
                content: '<@1005378317563736105>',
                embeds: [new MessageEmbed({
                    description: `If you don't know what to talk about, here's a random topic. To generate these manually use \`/topic\`.\n**__${getRandomTopic()}__**`
                })]
            });
        }
    }
}
