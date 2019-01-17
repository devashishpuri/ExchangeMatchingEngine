import { MatchingEngine, OrderSide, MEErrorCode } from '../src';

// import * as mocha from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;

const matchEngine = new MatchingEngine();

describe('Matching Engine Test Suite', () => {

    // ################################################
    // #############| BASIC ORDER CASES |##############
    // ################################################

    it('Order Placed has correct side, Buy', () => {
        const instrument = 'DevD';
        const orderResponseBuy = matchEngine.newOrder(instrument, 23.4, 5, OrderSide.buy);
        const orderBuy = orderResponseBuy.data.order;
        expect(orderBuy.side).to.equal(OrderSide.buy);
    });

    it('Order Placed has correct side, Sell', () => {
        const instrument = 'DevD';

        const orderResponseSell = matchEngine.newOrder(instrument, 23.4, 5, OrderSide.sell);
        const orderSell = orderResponseSell.data.order;
        expect(orderSell.side).to.equal(OrderSide.sell);
    });

    it('Should Match and COMPLETELY FILL order', () => {
        const instrument = 'DevD';

        const orderResponseBuy = matchEngine.newOrder(instrument, 23.4, 5, OrderSide.buy);
        const orderBuy = orderResponseBuy.data.order;

        const orderResponseSell = matchEngine.newOrder(instrument, 23.4, 5, OrderSide.sell);
        const orderSell = orderResponseSell.data.order;

        const trades = orderResponseSell.data.trades;
        
        expect(trades[0].orderId).to.equal(orderSell.orderId);
        expect(trades[1].orderId).to.equal(orderBuy.orderId);

    });

    // ################################################
    // ############| COMPLEX ORDER CASES |#############
    // ################################################

    it('Should Match and PARTIALLY FILL "MAKER" order', () => {
        const instrument = 'DevD';

        const orderResponseBuy = matchEngine.newOrder(instrument, 230.4, 5, OrderSide.buy);
        const orderBuy = orderResponseBuy.data.order;

        const orderResponseSell = matchEngine.newOrder(instrument, 230.4, 2, OrderSide.sell);
        const orderSell = orderResponseSell.data.order;

        const trades = orderResponseSell.data.trades;
        
        expect(trades[1].tradeQty).to.lessThan(orderBuy.qty);
        expect(trades[0].tradeQty).to.equal(orderSell.qty);

    });

    it('Should Match and PARTIALLY FILL "TAKER" order', () => {
        const instrument = 'DevT';

        const orderResponseBuy = matchEngine.newOrder(instrument, 23.40, 2, OrderSide.buy);
        const orderBuy = orderResponseBuy.data.order;

        const orderResponseSell = matchEngine.newOrder(instrument, 23.40, 5, OrderSide.sell);
        const orderSell = orderResponseSell.data.order;

        const trades = orderResponseSell.data.trades;
        
        expect(trades[1].tradeQty).to.equal(orderBuy.qty);
        expect(trades[0].tradeQty).to.lessThan(orderSell.qty);

    });

    // ################################################
    // ###########| ORDER CANCELLED CASES |############
    // ################################################

    it('Order Placed should be cancelled', () => {
        const instrument = 'DevD';
        const orderResponse = matchEngine.newOrder(instrument, 23.4, 6, OrderSide.buy);
        const order = orderResponse.data.order;
        const orderCancelResponse = matchEngine.cancelOrder(order.orderId, instrument);
        expect(orderCancelResponse.status).to.equal(true);
    });

    it('Cancelled Order should be Removed', () => {
        const instrument = 'DevD';
        const orderResponse = matchEngine.newOrder(instrument, 23.4, 6, OrderSide.buy);
        const order = orderResponse.data.order;
        const orderCancelResponse = matchEngine.cancelOrder(order.orderId, instrument);
        const orderBook = matchEngine.orderBooks[instrument]
        expect(orderBook.orderIdMap[order.orderId]).to.equal(undefined);
    });

    it('Cancalling Canceled Order should be Rejected', () => {
        const instrument = 'DevD';
        const orderResponse = matchEngine.newOrder(instrument, 23.4, 6, OrderSide.buy);
        const order = orderResponse.data.order;
        const orderCancelResponse = matchEngine.cancelOrder(order.orderId, instrument);

        const tryCancelAgainResponse = matchEngine.cancelOrder(order.orderId, instrument);
        expect(tryCancelAgainResponse.status).to.equal(false);
        expect(tryCancelAgainResponse.statusCode).to.equal(MEErrorCode.invalidOrderId);

    });

    it('Cancalling Order of Invalid Instrument should be Rejected', () => {
        const instrument = '$#@#$|RANDOM|#@#$$';
        const orderCancelResponse = matchEngine.cancelOrder(1234, instrument);
        expect(orderCancelResponse.statusCode).to.equal(MEErrorCode.invalidSymbol);
    });

});
