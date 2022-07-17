import { database } from "../common/database.js";

export type PriceHistory = {
    guildId: string;
    itemId: string;
    date: Date;
    price: number;
    seller: string;
    buyer: string;
}

const getPriceHistoryModel = () => database.model<PriceHistory>('price-history', {
    guildId: String,
    itemId: String,
    date: Date,
    price: Number,
    seller: String,
    buyer: String
});

export class PriceHistoryModel {
    static async findOne(guildId: string, itemId: string) {
        const priceHistoryModel = await getPriceHistoryModel();
        const priceHistory = await priceHistoryModel.findOne({
            guildId,
            itemId
        });

        return priceHistory;
    }

    static async mostExpensiveSale(guildId: string, itemId?: string) {
        const priceHistoryModel = await getPriceHistoryModel();
        const sale = priceHistoryModel.max('price', {
            guildId,
            itemId
        });
        return sale;
    }

    static async create(data: PriceHistory) {
        const priceHistoryModel = await getPriceHistoryModel();
        const priceHistory = await priceHistoryModel.create(data);

        return priceHistory;
    }

    static async update(guildId: string, itemId: string, data: Partial<PriceHistory>) {
        const priceHistoryModel = await getPriceHistoryModel();
        const [priceHistory] = await priceHistoryModel.updateOrCreate({
            guildId,
            itemId
        }, data);

        return priceHistory;
    }
}
