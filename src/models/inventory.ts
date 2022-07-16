import { format } from 'util';
import { database } from '../common/database.js';
import { Item } from '../types/item.js';

export type Inventory = {
    guildId: string;
    userId: string;
    items: Item[]
};

const getInventoryModel = () => database.model<Inventory>('inventory', {
    guildId: String,
    userId: String,
    items: Array<Item>
});

export class InventoryModel {
    static async findOne(guildId: string, userId: string) {
        const inventoryModel = await getInventoryModel();
        const user = await inventoryModel.findOne({
            guildId,
            userId
        });

        return user;
    }

    static async create(guildId: string, userId: string) {
        if (await this.findOne(guildId, userId)) throw new Error(format('User %s already exists in %s', userId, guildId));

        const userModel = await getInventoryModel();
        const user = await userModel.create({
            guildId,
            userId,
            items: []
        });

        return user;
    }
}
