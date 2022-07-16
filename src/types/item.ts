export type ItemPriceHistory = {
    date: Date;
    price: number;
    seller: string;
    buyer: string;
}

export type Item = {
    uuid: string;
    name: string;
    description: string;
    price: number;
    priceHistory: ItemPriceHistory[];
};