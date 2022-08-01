import { Discord, On } from 'discordx';
import type { ArgsOf } from 'discordx';
import { logger } from '../common/logger.js';
import { GuildEmoji, Message, PartialMessage, PartialUser, ReactionEmoji, User } from 'discord.js';

@Discord()
export class Pin {
    @On('messageCreate')
    async messageCreate([message]: ArgsOf<'messageCreate'>) {
        // Remove message saying we pinned the item
        if (message.author.bot && message.type === 'CHANNEL_PINNED_MESSAGE') await message.delete();
    }

    async hasPermission(message: Message<boolean> | PartialMessage, emoji: GuildEmoji | ReactionEmoji, user: User | PartialUser) {
        // Must be in a guild
        if (!message.guild?.id) return false;

        // Must be in a thread
        if (!message.channel || !message.channel.isThread()) return false;

        // Must be a pin reaction
        if (emoji.name !== '📌') return false;

        // This must be the owner of the thread or someone who has permission to pin messages
        const firstMessage = await message.channel.messages.fetch({
            after: '1',
            limit: 1
        }).then(messages => messages.first());

        const isThreadOwner = firstMessage?.author.id === user.id;
        const hasPermissions = message.guild?.members.resolve(user.id)?.permissions.has('MANAGE_MESSAGES');
        if (!isThreadOwner && !hasPermissions) return false;

        return true;
    }

    @On('messageReactionAdd')
    async messageReactionAdd([{ message, emoji }, user]: ArgsOf<'messageReactionAdd'>): Promise<void> {
        if (!this.hasPermission(message, emoji, user)) return;

        // Pin message
        try {
            await message.pin();
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error('Unknown Error ' + error);
            logger.error('Failed to pin %s for %s in %s', message.id, user.id, message.channel.id);
            logger.error(error.message);
        }
    }

    @On('messageReactionRemove')
    async messageReactionRemove([{ message, emoji }, user]: ArgsOf<'messageReactionRemove'>): Promise<void> {
        if (!this.hasPermission(message, emoji, user)) return;

        // Unpin message
        try {
            await message.unpin();
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error('Unknown Error ' + error);
            logger.error('Failed to unpin %s for %s in %s', message.id, user.id, message.channel.id);
            logger.error(error.message);
        }
    }
}
