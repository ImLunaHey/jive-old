import { Discord, On } from 'discordx';
import type { ArgsOf } from 'discordx';
import { logger } from '../common/logger.js';

const threadOwners = {
    '979291390162894918': '802440261543264288',
    '1003029764128374904': '699464544078266388'
};

@Discord()
export class Pin {
    @On('messageReactionAdd')
    async messageReactionAdd([{ message, emoji }, user]: ArgsOf<'messageReactionAdd'>): Promise<void> {
        // Must be in a guild
        if (!message.guild?.id) return;

        // Must be in a thread
        if (!message.channel || !message.channel.isThread()) return;

        // Must be a pin reaction
        if (emoji.name !== '📌') return;

        // This must be the owner of the thread or someone who has permission to pin messages
        const isThreadOwner = threadOwners[message.channel.id as keyof typeof threadOwners] === user.id;
        const hasPermissions = message.guild?.members.resolve(user.id)?.permissions.has('MANAGE_MESSAGES');
        if (!isThreadOwner && !hasPermissions) return;

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
        // Must be in a guild
        if (!message.guild?.id) return;

        // Must be in a thread
        if (!message.channel || !message.channel.isThread()) return;

        // Must be a pin reaction
        if (emoji.name !== '📌') return;

        // This must be the owner of the thread or someone who has permission to pin messages
        const isThreadOwner = threadOwners[message.channel.id as keyof typeof threadOwners] === user.id;
        const hasPermissions = message.guild?.members.resolve(user.id)?.permissions.has('MANAGE_MESSAGES');
        if (!isThreadOwner && !hasPermissions) return;

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
