const pricing = require('pricing');
const config = require('configuration');
const database = require('database');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

const pairParts = config.get('PAIR').split('/');
const pair = pairParts.join('');

const orderPriceIndex = config.get('ORDER_PRICE_INDEX');
const quantityGoodOrdersMax = config.get('QUANTITY_GOOD_ORDERS_MAX');
const orderSum = config.get("ORDER_SUM");
let quantityGoodOrders = config.get('QUANTITY_GOOD_ORDERS');
const lifeTimeOrder = config.get('LIFE_TIME_ORDER');

let orderMin = config.get('ORDER_MIN');
let orderPrice = orderPriceIndex * orderMin;


// Информация о доступном балансе BTC (заглушка)
let BalBTC = 100;
let BalBTCAv = 100;
let BalBTCInOrder = 0;

const buyProcess = async () => {
  const time = 20 * 1000;
  const buyPrice = await pricing.getBuyPrice(pair);

  console.log('orderMin: ', orderMin);
  console.log('orderPrice: ', orderPrice);
  console.log('orderPriceIndex: ', orderPriceIndex);
  console.log('buyPrice: ', buyPrice);

  if (buyPrice.BNBBTC > orderPrice) {
    return false;
  }

  if (quantityGoodOrders > quantityGoodOrdersMax) {
    return false;
  }

  if (BalBTCAv < orderSum) {
    return false;
  }

  const balances = await pricing.getBalances();
  console.log(balances);

  return false;

  // await createOrder(buyPrice.BNBBTC);

  // const balances = await pricing.getBalances()
  // console.log(balances)

  // await setTimeoutPromise(time);
  // await buyProcess()
};

const createOrder = async (price) => {
  console.log('create order...');
  let orderId = await pricing.buy(pair, orderSum, price);
  console.log('orderId: ', orderId);
  await closeOrder(orderId, price);
};

const closeOrder = async (orderId, lastPrice) => {
  const time = lifeTimeOrder * 1000;
  await setTimeoutPromise(time)


};

module.exports = {
  start: async () => {
    console.log("pair:", pair);
    await buyProcess()
  }
};
