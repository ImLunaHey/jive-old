import { Discord, On } from 'discordx';
import type { ArgsOf } from 'discordx';
import { store } from '../store.js';

@Discord()
export class ChatRevival {
    @On('messageCreate')
    async messageCreate([_message]: ArgsOf<'messageCreate'>): Promise<void> {
        store.lastMessage = new Date();
    }
}
