# ExchangeMatchingEngine
Lightweight Exchnage Matching Engine for nodejs

---

## Installation
```shell
$ npm i exchange-macthing-engine --save 
```

## Usage
```js

import { MatchingEngine, OrderSide } from 'exchange-macthing-engine';

const matchingEngine = new MatchingEngine();

/**
 * Place New Order (Instrument, Price, Quantity, Side)
 */
matchingEngine.newOrder('Instrument', 12.5, 5, OrderSide.buy);

/**
 * Trade Order
 */
matchingEngine.newOrder('Instrument', 12.5, 5, OrderSide.sell);

/**
 * Cancel Order (Order Id, Instrument)
 */
const orderResponse = matchingEngine.newOrder('Instrument', 12.5, 5, OrderSide.sell);
const order = orderResponse.data.order;

matchingEngine.cancelOrder(order.orderId, order.instrument);

```
