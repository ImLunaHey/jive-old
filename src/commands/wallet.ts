import { format } from 'util';
import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';
import { UserModel } from '../models/user.js';
import { CommandError } from '../common/command-error.js';
import { ItemModel } from '../models/items.js';

const formatCurrency = (balance: number, currency: string) => `${currency}${balance}`;

const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

@Discord()
export class WalletCommand {
    @Slash('wallet', {
        description: 'Shows your current wallet balance'
    })
    async wallet(
        @SlashChoice({ name: 'everyone', value: 'false' })
        @SlashChoice({ name: 'just me', value: 'true' })
        @SlashOption('privacy', {
            type: 'STRING',
            description: 'Should this be shown to all users or just you? (default is just you)',
            required: false
        }) ephemeral: 'true' | 'false' = 'true',
        interaction: CommandInteraction
    ) {
        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Show the bot thinking...
            await interaction.deferReply({ ephemeral: ephemeral === 'true' });

            const currency = '$';

            // Fetch or create the user
            const user = await UserModel.findOne(guildId, userId) ?? await UserModel.create(guildId, userId);
            if (!user) throw new CommandError('Failed to fetch or create a user');

            // Send user their wallet balance
            await interaction.editReply({
                content: `You have \`${formatCurrency(user.balance, currency)}\``
            });
        } catch (error: unknown) {
            if (!(error instanceof Error)) throw new Error(format('Unknown Error "%s"', error));
            if (error instanceof CommandError) return interaction.editReply({
                content: error.message
            });
            return interaction.reply({
                content: format('Failed running command with "%s"', error.message)
            });
        }
    }

    @Slash('beg', {
        description: 'Beg for some coins'
    })
    async beg(
        interaction: CommandInteraction
    ) {
        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            // Fetch or create the user
            const user = await UserModel.findOne(guildId, userId) ?? await UserModel.create(guildId, userId);
            if (!user) throw new CommandError('Failed to fetch or create a user');

            // Check if the user was robbed while begging
            const robbed = getRandomNumber(1, 100) > 75;

            // Generate amount the user wins/loses
            const amount = getRandomNumber(1, 100) > 98 ? getRandomNumber(10_000, 100_000) : getRandomNumber(1, 100);

            // If the user was robbed remove the amount from their balance
            if (robbed) {
                // Check if they're able to be robbed
                if (user.balance === 0) {
                    const item = await ItemModel.findOne({
                        guildId,
                        userId
                    });
                    if (!item) return interaction.reply({
                        content: `Someone tried holding you up but you had no money and no items, they killed you :sob:`,
                        ephemeral: true
                    });

                    // Move the item from the user's inventory to the server's store
                    // @todo: make a lost and found or something with these?
                    //        maybe these could go into the loot boxes?
                    await ItemModel.update({ uuid: item?.uuid }, { userId: undefined });
                    return interaction.reply({
                        content: `Someone tried holding you up but you had no money, they stabbed you and stole an item from your inventory`,
                        ephemeral: true
                    });
                }

                // Remove the money from the person's balance
                const amountTaken = amount > user.balance ? user.balance : amount;
                user.balance -= amountTaken;

                // Save user's balance
                await UserModel.update(guildId, userId, user);

                // Send user their wallet balance
                return interaction.reply({
                    content: `You were robbed of \`$${amountTaken}\` you now have \`$${user.balance}\``,
                    ephemeral: true
                });
            }

            // Add the money to the person's balance
            user.balance += amount;

            // Save user's balance
            await UserModel.update(guildId, userId, user);

            // Send user their wallet balance
            await interaction.reply({
                content: `Someone tossed you a few coins, you now have \`${user.balance}\``,
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
}
