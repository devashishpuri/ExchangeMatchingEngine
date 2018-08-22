import { MatchingEngine, OrderSide } from './matchingEngine';

const matchEngine = new MatchingEngine();
/**
 * Add Order
 */
const order1 = matchEngine.newOrder('DevD', 23.4, 5, OrderSide.buy);

console.log('The First Order', order1);

/**
 * Trade the Order
 */
const order2 = matchEngine.newOrder('DevD', 23.4, 2, OrderSide.sell);

console.log('The Second Order', order2);
