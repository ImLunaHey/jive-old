import { randomUUID } from 'crypto';
import type { Except } from 'type-fest';
import { database } from '../common/database.js';

export type Item = {
    guildId: string;
    userId: string | undefined;
    itemId: string;
    uuid: string;
    name: string;
    description: string;
    price: number;
    metadata: string;
};

const getItemModel = () => database.model<Item>('items', {
    guildId: String,
    userId: { type: String, nullable: true },
    itemId: String,
    uuid: String,
    name: String,
    description: String,
    price: Number,
    metadata: String
});

export class ItemModel {
    static async findOne(criteria: Partial<Item>) {
        const itemModel = await getItemModel();
        const item = await itemModel.findOne(criteria);
        return item;
    }

    static async find(criteria: Partial<Item>) {
        const itemModel = await getItemModel();
        const items = await itemModel.find(criteria);
        return items;
    }

    static async create(data: Except<Item, 'uuid'>) {
        const itemModel = await getItemModel();
        const item = await itemModel.create({
            ...data,
            uuid: randomUUID()
        });
        return item;
    }

    static async update(criteria: Partial<Item>, data: Partial<Item>) {
        const itemModel = await getItemModel();
        const [item] = await itemModel.updateOrCreate({
            guildId: criteria.guildId,
            userId: criteria.userId,
            itemId: criteria.itemId,
            uuid: criteria.uuid
        }, data);

        return item;
    }
}
