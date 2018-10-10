import { MatchingEngine, OrderSide } from './matchingEngine';

import * as mocha from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;

const matchEngine = new MatchingEngine();

describe('Matching Engine Test Suite', () => {

    it('should place an Order', () => {
        const order = matchEngine.newOrder('DevD', 23.4, 5, OrderSide.buy);
        expect(order.data.order.side).to.equal(OrderSide.buy);
    });

});
