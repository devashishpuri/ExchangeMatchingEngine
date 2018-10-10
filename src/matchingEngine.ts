namespace Utils {
    export const getObjMin = (object: Object): number | null => {
        const arr = Object.keys(object);
        return arr.length ? Math.min.apply(null, arr) : null;
    };
    export const getObjMax = (object: Object): number | null => {
        const arr = Object.keys(object);
        return arr.length ? Math.max.apply(null, arr) : null;
    };
    export const sumOfProperty = (arr: Array<any>, property: string): number => {
        // return arr.reduce((a, b) => {
        //     console.log('The Valssds', a, b);
        //     return a[property] ? a[property] + b[property] : a + b[property];
        // });
        let sum = 0;
        arr.forEach(ele => { sum += ele[property] })
        return sum;
    }
}

enum MEErrorCode {
    invalidSymbol,
    invalidOrderId,
    invalidOrder,
    invalidSide,
    invalidQty
}

enum MESuccessCode {
    orderCanceled,
    orderPlaced
}

interface MatchingEngineResponseData {
    order: Order;
    trades: Trade[];
}

interface MatchingEngineResponse {
    status: boolean;
    statusCode: MEErrorCode | MESuccessCode;
    message?: string;
    data?: MatchingEngineResponseData;
}

export enum OrderSide {
    buy,
    sell
}

class Order {
    orderId: number;
    instrument: string;
    price: number;
    qty: number;
    cumQty?: number = 0;
    leavesQty?: number;
    side: OrderSide;

    constructor(order: Order) {
        // Object.assign(this, order);
        this.orderId = order.orderId;
        this.instrument = order.instrument;
        this.price = order.price;
        this.qty = order.qty;
        this.side = order.side;

        this.leavesQty = this.qty;
    }
}

class Trade {
    orderId: number;
    instrument: string;
    tradePrice: number;
    tradeQty: number;
    tradeSide: OrderSide;
    tradeId: number;

    constructor(trade: Trade) {
        // Object.assign(this, trade);
        this.orderId = trade.orderId,
            this.instrument = trade.instrument,
            this.tradePrice = trade.tradePrice,
            this.tradeQty = trade.tradeQty,
            this.tradeSide = trade.tradeSide,
            this.tradeId = trade.tradeId
    }
}

class OrderBook {
    bids: { [price: number]: Array<Order> } = {};
    asks: { [price: number]: Array<Order> } = {};
    orderIdMap: { [orderId: number]: Order } = {};
}

export class MatchingEngine {

    orderBooks: { [instrument: string]: OrderBook } = {};
    currOrderId = 0;
    currTradeId = 0;

    newOrder(instrument: string, price: number, qty: number, side: OrderSide): MatchingEngineResponse {
        if (side === OrderSide.buy || side === OrderSide.sell) {

            // Init Order
            const trades: Trade[] = [];
            this.currOrderId += 1;
            const orderId = this.currOrderId;
            const order = new Order({
                orderId,
                instrument,
                price,
                qty,
                side
            });

            let orderBook = this.orderBooks[instrument];
            if (!orderBook) {
                orderBook = new OrderBook();
            }
            this.orderBooks[instrument] = orderBook;
            
            /**
             * IF ORDER SIDE is BUY
             */
            if (side === OrderSide.buy) {
                /**
                 * Best Ask
                 * Calculated by adding Keys of OrderBook(Price)
                 */
                let bestPrice = Utils.getObjMin(orderBook.asks);
                while (bestPrice !== null && (bestPrice === 0 || price >= bestPrice) && order.leavesQty > 0) {
                    const qtyAtBestPrice = Utils.sumOfProperty(orderBook.asks[bestPrice], 'qty');
                    let matchQty = Math.min(qtyAtBestPrice, order.leavesQty);
                    if (matchQty > 0) {

                        /**
                         * We have the Match Quantity, 
                         */
                        this.currTradeId += 1;
                        order.cumQty += matchQty;
                        order.leavesQty -= matchQty;

                        trades.push(new Trade({
                            orderId: orderId,
                            instrument: instrument,
                            tradePrice: bestPrice,
                            tradeQty: matchQty,
                            tradeSide: OrderSide.buy,
                            tradeId: this.currTradeId
                        }));

                        /**
                         * Generate Passive Executions
                         */
                        while (matchQty > 0) {
                            // The Order Hit
                            const orderHit = orderBook.asks[bestPrice][0];
                            const orderMatchQuantity = Math.min(matchQty, orderHit.leavesQty);
                            this.currTradeId += 1;

                            trades.push(new Trade({
                                orderId: orderHit.orderId,
                                instrument: orderHit.instrument,
                                tradePrice: bestPrice,
                                tradeQty: matchQty,
                                tradeSide: OrderSide.sell,
                                tradeId: this.currTradeId
                            }));

                            orderHit.cumQty += orderMatchQuantity;
                            orderHit.leavesQty -= orderMatchQuantity;
                            matchQty -= orderMatchQuantity;
                            if (orderHit.leavesQty === 0) {
                                orderBook.asks[bestPrice].splice(0, 1);
                            }
                            /**
                             * If Price has No Orders, Delete Depth
                             */
                            delete orderBook.asks[bestPrice];
                            /**
                             * Update Best Price
                             */
                            bestPrice = Utils.getObjMin(orderBook.asks);
                        }

                    } else {
                        return {
                            status: false,
                            statusCode: MEErrorCode.invalidQty,
                            message: `Invalid Order Quantity`
                        };
                    }
                }
                /**
                 * Add the remaining Order into Depth
                 */
                if (order.leavesQty > 0) {
                    if (!orderBook.bids[price]) {
                        orderBook.bids[price] = [];
                    }
                    orderBook.bids[price].push(order);

                    orderBook.orderIdMap[orderId] = order;
                }
            } else {
                /**
                 * IF ORDER SIDE is SELL
                 */
                /**
                 * Best Bid
                 * Calculated by adding Keys of OrderBook(Price)
                 */
                let bestPrice = Utils.getObjMax(orderBook.bids);
                while (bestPrice !== null && (bestPrice === 0 || price <= bestPrice) && order.leavesQty > 0) {
                    const qtyAtBestPrice = Utils.sumOfProperty(orderBook.bids[bestPrice], 'qty');

                    let matchQty = Math.min(qtyAtBestPrice, order.leavesQty);
                    if (matchQty > 0) {

                        /**
                         * We have the Match Quantity, 
                         */
                        this.currTradeId += 1;
                        order.cumQty += matchQty;
                        order.leavesQty -= matchQty;

                        trades.push(new Trade({
                            orderId: orderId,
                            instrument: instrument,
                            tradePrice: bestPrice,
                            tradeQty: matchQty,
                            tradeSide: OrderSide.sell,
                            tradeId: this.currTradeId
                        }));

                        /**
                         * Generate Passive Executions
                         */
                        while (matchQty > 0) {
                            // The Order Hit
                            const orderHit = orderBook.bids[bestPrice][0];
                            const orderMatchQuantity = Math.min(matchQty, orderHit.leavesQty);
                            this.currTradeId += 1;

                            trades.push(new Trade({
                                orderId: orderHit.orderId,
                                instrument: orderHit.instrument,
                                tradePrice: bestPrice,
                                tradeQty: matchQty,
                                tradeSide: OrderSide.buy,
                                tradeId: this.currTradeId
                            }));

                            orderHit.cumQty += orderMatchQuantity;
                            orderHit.leavesQty -= orderMatchQuantity;
                            matchQty -= orderMatchQuantity;
                            if (orderHit.leavesQty === 0) {
                                orderBook.bids[bestPrice].splice(0, 1);
                            }
                            /**
                             * If Price has No Orders, Delete Depth
                             */
                            delete orderBook.bids[bestPrice];
                            /**
                             * Update Best Price
                             */
                            bestPrice = Utils.getObjMin(orderBook.bids);
                        }

                    } else {
                        return {
                            status: false,
                            statusCode: MEErrorCode.invalidQty,
                            message: `Invalid Order Quantity`
                        };
                    }
                }
                /**
                 * Add the remaining Order into Depth
                 */
                if (order.leavesQty > 0) {
                    if (!orderBook.asks[price]) {
                        orderBook.asks[price] = [];
                    }
                    orderBook.asks[price].push(order);
                    orderBook.orderIdMap[orderId] = order;
                }
            }

            return {
                status: true,
                statusCode: MESuccessCode.orderPlaced,
                message: `Order Placed`,
                data: {
                    order: order,
                    trades: trades
                }
            };
        } else {
            return {
                status: false,
                statusCode: MEErrorCode.invalidSide,
                message: `Invalid Order Side`
            };
        }
    }

    /**
     * Cancel Order
     * @param orderId 
     * @param instrument 
     */
    cancelOrder(orderId: number, instrument: string): MatchingEngineResponse {
        if (Object.keys(this.orderBooks).indexOf(instrument) >= 0) {
            const orderBook = this.orderBooks[instrument];

            if (Object.keys(orderBook.orderIdMap).indexOf(`${orderId}`) === -1) {
                // throw { message: `OrderId Doesn't Exist` };
                return {
                    status: false,
                    statusCode: MEErrorCode.invalidOrderId,
                    message: `Order Id Doesn't Exist`
                };
            }

            const order: Order = orderBook.orderIdMap[orderId];

            /**
             * Array of Orders sorted By Time Priority
             */
            let priceLevel: Array<Order>;
            if (order.side === OrderSide.buy) {
                if (Object.keys(orderBook.bids).indexOf(`${order.price}`) === -1) {
                    // return this._cancelRejectOrder(order, `Order Doesn't Exist`);
                    return {
                        status: false,
                        statusCode: MEErrorCode.invalidOrder,
                        message: `Order Doesn't Exist`
                    };
                }
                priceLevel = orderBook.bids[order.price];
            } else {
                if (Object.keys(orderBook.asks).indexOf(`${order.price}`) === -1) {
                    // return this._cancelRejectOrder(order, `Order Doesn't Exist`);
                    return {
                        status: false,
                        statusCode: MEErrorCode.invalidOrder,
                        message: `Order Doesn't Exist`
                    };
                }
                priceLevel = orderBook.asks[order.price];
            }

            for (let i = 0; i < priceLevel.length; i++) {
                const iOrder = priceLevel[i];
                if (iOrder.orderId === orderId) {
                    iOrder.leavesQty = 0;
                    delete orderBook.orderIdMap[orderId];
                    // cancelledOrder = this._returnCanceledOrder(iOrder);
                    // break;
                    priceLevel.splice(i, 1);
                    return {
                        status: true,
                        statusCode: MESuccessCode.orderCanceled,
                        message: `Order Cancelled`
                    };
                }
            }

        } else {
            return {
                status: false,
                statusCode: MEErrorCode.invalidSymbol,
                message: `Invalid Symbol`
            };
        }
    }

}
