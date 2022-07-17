import { format } from 'util';
import { CommandInteraction } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { UserModel } from '../models/user.js';
import { CommandError } from '../common/command-error.js';

const formatCurrency = (balance: number, currency: string) => `${currency}${balance}`;

@Discord()
export class WalletCommand {
    @Slash('wallet', {
        description: 'Shows your current wallet balance'
    })
    async wallet(
        interaction: CommandInteraction
    ) {
        try {
            const { guildId, user: { id: userId } } = interaction;

            // Ensure this is only run in guilds
            if (!guildId) throw new CommandError('This command can only be run in a guild');

            const currency = '$';

            // Fetch or create the user
            const user = await UserModel.findOne(guildId, userId) ?? await UserModel.create(guildId, userId);
            if (!user) throw new CommandError('Failed to fetch or create a user');

            // Send user their wallet balance
            await interaction.reply({
                content: `You have \`${formatCurrency(user.balance, currency)}\``,
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
