import { format } from 'util';
import { database } from '../common/database.js';
import { Item } from '../types/item.js';

export type Store = {
    guildId: string;
    items: Item[]
};

const getStoreModel = () => database.model<Store>('store', {
    guildId: String,
    items: Array<Item>
});

export class StoreModel {
    static async findOne(guildId: string) {
        const storeModel = await getStoreModel();
        const user = await storeModel.findOne({
            guildId
        });

        return user;
    }

    static async create(guildId: string) {
        if (await this.findOne(guildId)) throw new Error(format('A store already exists in %s', guildId));

        const storeModel = await getStoreModel();
        const store = await storeModel.create({
            guildId,
            items: []
        });

        return store;
    }
    
    static async update(guildId: string, data: Store) {
        const storeModel = await getStoreModel();
        const [store] = await storeModel.updateOrCreate({
            guildId
        }, data);

        return store;
    }
}
