import { Intents } from 'discord.js';
import { createDiscordClient } from './common/discord-client.js';
import { name } from '../package.json' assert { type: 'json' };

export const client = createDiscordClient(name, {
    intents: [
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    prefix: `$${name}`
});
