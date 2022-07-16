import { format } from 'util';
import { database } from '../common/database.js';

export type User = {
    guildId: string;
    userId: string;
    balance: number;
};

const getUserModel = () => database.model<User>('user', {
    guildId: String,
    userId: String,
    balance: Number
});

export class UserModel {
    static async findOne(guildId: string, userId: string) {
        const userModel = await getUserModel();
        const user = await userModel.findOne({
            guildId,
            userId
        });

        return user;
    }

    static async create(guildId: string, userId: string) {
        if (await this.findOne(guildId, userId)) throw new Error(format('User %s already exists in %s', userId, guildId));

        const userModel = await getUserModel();
        const user = await userModel.create({
            guildId,
            userId,
            balance: 1_000
        });

        return user;
    }

    static async update(guildId: string, userId: string, data: User) {
        const userModel = await getUserModel();
        const [user] = await userModel.updateOrCreate({
            guildId,
            userId
        }, data);

        return user;
    }
}
