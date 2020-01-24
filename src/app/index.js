const pricing = require('pricing');
const config = require('configuration');
const path = require('path');
const fs = require('fs');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
const { blessed, screen, boxInfoTopLeft, boxInfoTopCenter, boxInfoTopRight, logBuyProcess, logSellProcess,
  logErrors
} = require('screens');

/**
 * Директория хранения логов продажи
 */
const dirLogs = config.get('DIR_LOGS');

/**
 * Иформация о торговой паре
 */
const pairParts = config.get('PAIR').split('/');
const pair = pairParts.join('');

/**
 * Коеффициент увеличение стоимости валюты для ордера продажи
 */
const altPriceBuyIndex = config.get('ALT_PRICE_BUY_INDEX');

/**
 * Коеффициент уменьшения стоимости валюты для ордера покупки
 */
const ratio = config.get('RATIO');

/**
 * Максимальное количество одновременно работающих ордеров на покупку
 */
const quantityGoodOrdersMax = config.get('QUANTITY_GOOD_ORDERS_MAX');

/**
 * Текущее количество рабочих одреров на покупку
 */
quantityGoodOrders = config.get('QUANTITY_GOOD_ORDERS');

/**
 * Сумма сделки в BTC
 */
orderSum = config.get("ORDER_SUM");

/**
 * Время жизни ордера на покупку в с.
 */
const lifeTimeOrder = config.get('LIFE_TIME_ORDER');

/**
 * Пауза от момента срабатывания ордера покупки до момента создания ордера продажи
 */
const pauseTime = config.get('PAUSE_TIME');

/**
 * Ограничение точности цены для заданной валюты (кол-во знаков после запятой)
 */
priceFilterSize = 8;

/**
 * Минимальная сумма ордера продажи
 */
orderMin = config.get('ORDER_MIN');

/**
 * Уменьшенная сумма ордера покупки
 */
orderPrice = ratio * orderMin;

/**
 * Текущий баланс BTC
 */
BalBTC = 0;

/**
 * Доступный баланс BTC
 */
BalBTCAv = 0;

/**
 * Баланс BTC задействованный в ордерах
 */
BalBTCInOrder = 0;

/**
 * Текущий баланс ALT
 */
BalALTAv = 0;

/**
 * Доступный баланс ALT
 */
BalALTInOrder = 0;

/**
 * Баланс ALT задействованный в ордерах
 */
BalALT = 0;

/**
 * Последняя цена BTC ($)
 */
LastPriceBTC = 0;

/**
 * Последняя цена ALT (BTC)
 */
LastPriceALT = 0;

/**
 * Средняя цена сработавших ордеров на покупку
 */
averagePriceBuy = 0;

/**
 * Момент времени последней успешной сделки покупки
 */
timeLastOrderBuy = 0;

/**
 * Идентификатор последнего ордера на продажу
 */
sellOpenOrderId = false;

/**
 * Метка разрешения создания ордера на продажу
 */
sellOrderFlag = false;

/**
 * Количество рабочих ордеров на продажу
 */
quantityGoodOrderSell = 0;


/**
 * Метод вывода текущей информации по ценам и переменным бота
 * @returns {Promise<void>}
 */
const printInfo = async () => {
  const time = 1000;

  await setBalance();

  boxInfoTopLeft.content = `Pair: ${pair}\n` +
    `BalBTC = ${BalBTC}\n` +
    `BalBTCAv = ${BalBTCAv}\n` +
    `BalBTCInOrder = ${BalBTCInOrder}\n` +
    `BalALT = ${BalALT}\n` +
    `BalALTAv = ${BalALTAv}\n` +
    `BalALTInOrder = ${BalALTInOrder}\n`;

  boxInfoTopCenter.content = `LastPriceBTC = ${LastPriceBTC}\n` +
    `LastPriceALT = ${LastPriceALT}\n`;

  let tzoffset = (new Date()).getTimezoneOffset() * 120000;
  let orderTimeFormat = timeLastOrderBuy ?
    new Date(timeLastOrderBuy - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    : 0;
  boxInfoTopRight.content = `orderMin = ${orderMin.toFixed(priceFilterSize)}\n` +
    `orderPrice = ${orderPrice.toFixed(priceFilterSize)}\n` +
    `quantityGoodOrders = ${quantityGoodOrders}\n` +
    `timeLastOrderBy = ${orderTimeFormat}\n` +
    `averagePriceBuy = ${averagePriceBuy.toFixed(priceFilterSize)}\n` +
    `altPriceBuy = ${(averagePriceBuy * altPriceBuyIndex).toFixed(priceFilterSize)}`;

  screen.render();

  await setTimeoutPromise(time);
  printInfo();
};


/**
 * Метод обновления информации о балансе аккаунта
 * @returns {Promise<void>}
 */
const setBalance = async () => {
  let balances = await pricing.getBalances();
  const prices = await pricing.getPrices();

  if (typeof balances.BTC !== 'undefined') {
    BalBTCAv = parseFloat(balances.BTC.available);
    BalBTCInOrder = parseFloat(balances.BTC.onOrder);
    BalBTC = BalBTCAv + BalBTCInOrder;

    BalALTAv = parseFloat(balances[pairParts[0]].available);
    BalALTInOrder = parseFloat(balances[pairParts[0]].onOrder);
    BalALT = BalALTAv + BalALTInOrder;
  }

  LastPriceBTC = parseFloat(prices.BTCUSDT);
  LastPriceALT = parseFloat(prices[pair]);
};


/**
 * Метод проверки необходимых условий перед созданием ордера покупки
 * @returns {Promise<void>}
 */
const buyProcess = async () => {
  const time = 5*1000;
  let error = false;

  orderPrice = parseFloat((ratio * orderMin).toFixed(priceFilterSize));

  if (LastPriceALT > orderPrice || quantityGoodOrders >= quantityGoodOrdersMax || BalBTCAv < orderSum) {
    error = true;
  }

  if (error) {
    await setTimeoutPromise(time);
    buyProcess();
  } else {
    createOrder(LastPriceALT, BalALT);
  }
};


/**
 * Метод создания ордера покупки
 * @returns {Promise<void>}
 */
const createOrder = async (price, lastBalance) => {
  // let quantity = Math.ceil(orderSum / price);
  let quantity = (orderSum / price).toFixed(2);
  logBuyProcess.log(`---------------------------------`);
  logBuyProcess.log(`Create order - quantity = ${quantity}, price = ${price.toFixed(priceFilterSize)}`);

  try {
    let orderId = await pricing.buy(pair, quantity, price);
    logBuyProcess.log(`Buy order created - orderId: ${orderId}`);
    await closeOrder(orderId, price, lastBalance);
  } catch (e) {
    let error = JSON.parse(e);
    logBuyProcess.log(`Error call binance API`);
    logBuyProcess.log(`Code: ${error.code}`);
    logBuyProcess.log(`Message: ${error.msg}`);
    return false;
  }
};


/**
 * Метод завершения жизни ордера и проверки его статуса
 * @returns {Promise<void>}
 */
const closeOrder = async (orderId, lastPrice, lastBalance) => {
  const time = lifeTimeOrder * 1000;

  sellOrderFlag = true;

  await setTimeoutPromise(time);

  logBuyProcess.log(`Expired order with id - ${orderId}`);

  let orderStatus = await pricing.checkOrderStatus(pair, orderId);

  await setBalance();
  await setTimeoutPromise(2000);

  if (BalALT > lastBalance) {
    orderMin = lastPrice;
    timeLastOrderBuy = orderStatus.time;

    let orders = await pricing.getAllOrders(pair);
    let totalPrice = 0;
    quantityGoodOrders = 0;
    await orders.reverse().some((o) => {
      if (o.side === 'SELL' && (o.status === 'FILLED' || o.executedQty > 0)) {
        return true;
      }
      if (o.side === 'BUY' && (o.status === 'FILLED' || o.executedQty > 0)) {
        totalPrice += parseFloat(o.price);
        quantityGoodOrders++;
      }
    });

    averagePriceBuy = totalPrice / quantityGoodOrders;
    // sellOrderFlag = true;
    logBuyProcess.log(`Order closed, balance increased...\n`);
    buyProcess();
  } else {
    logBuyProcess.log(`Balance has not changed...`);
    logBuyProcess.log(`Cancel order with id - ${orderId}\n`);
    try {
      await pricing.cancel(pair, orderId);
    } catch (e) {
      let error = JSON.parse(e);
      logBuyProcess.log(`Error call binance API`);
      logBuyProcess.log(`Code: ${error.code}`);
      logBuyProcess.log(`Message: ${error.msg}`);
    }
    buyProcess();
  }
};


/**
 * Метод создания ордера продажи
 * @returns {Promise<void>}
 */
const sellProcess = async () => {
  const time = 5*1000;
  let error = false;

  if (BalALTAv.toFixed(2) <= 0) {
    error = true;
  }

  if ((Date.now() - timeLastOrderBuy) < pauseTime*1000) {
    error = true;
  }

  if (!sellOrderFlag) {
    error = true;
  }

  let openOrders = await pricing.openOrders(pair);
  let orderFilled = true;
  await openOrders.filter((order) => order.side === 'SELL').forEach((o) => {
    orderFilled = false;
  });

  if (orderFilled && sellOpenOrderId) {
    logSellProcess.log(`Order closed, alt sold...`);
    await writeLogFile(sellOpenOrderId);

    for (let i = 0; i < quantityGoodOrderSell; i++) {
      orderMin = orderMin / ratio;
    }

    quantityGoodOrders = 0;
    quantityGoodOrderSell = 0;
    sellOpenOrderId = false;
  }

  if (!error) {
    await openOrders.filter((order) => order.side === 'SELL').forEach((order) => {
      pricing.cancel(pair, order.orderId);
      logSellProcess.log(`Cancel sell order with id - ${order.orderId}\n`);
    });

    await setBalance();
    await setTimeoutPromise(2000);
    logSellProcess.log(`---------------------------------`);

    let altPriceBuy = altPriceBuyIndex * averagePriceBuy;
    let altBalInOrder = BalALTAv.toFixed(2);
    try {
      sellOpenOrderId = await pricing.sell(pair, altBalInOrder, altPriceBuy.toFixed(priceFilterSize));
      quantityGoodOrderSell = quantityGoodOrders;
      sellOrderFlag = false;
      logSellProcess.log(`Sell order created...`);
      logSellProcess.log(`orderId: ${sellOpenOrderId}`);
      logSellProcess.log(`price: ${altPriceBuy.toFixed(priceFilterSize)}`);
      logSellProcess.log(`quantity: ${altBalInOrder}`);
    } catch (e) {
      let error = JSON.parse(e);
      if (error.msg === 'Filter failure: MIN_NOTIONAL') {
        logSellProcess.log(`MIN_NOTIONAL Filter during order creation`);
        logSellProcess.log(`Waiting for another purchase...`);
        sellOrderFlag = false;
      } else {
        logSellProcess.log(`Error call binance API`);
        logSellProcess.log(`Code: ${error.code}`);
        logSellProcess.log(`Message: ${error.msg}`);
        return false;
      }
    }
  }

  await setTimeoutPromise(time);
  sellProcess();
};


/**
 * Метод заполнения данных для работы бота на основе последних ордеров
 * @returns {Promise<void>}
 */
const getCurrentOrdersInfo = async () => {
  let orders = await pricing.getAllOrders(pair);
  let totalPrice = 0;

  await orders.reverse().some((o) => {
    if (o.side === 'SELL' && (o.status === 'FILLED' || o.executedQty > 0)) {
      return true;
    }

    if (o.side === 'BUY' && (o.status === 'FILLED' || o.executedQty > 0)) {
      totalPrice += parseFloat(o.price);
      quantityGoodOrders++;
      if (o.time > timeLastOrderBuy) {
        timeLastOrderBuy = o.time;
        orderMin = parseFloat(o.price);
      }
      sellOrderFlag = true;
    }
  });

  averagePriceBuy = totalPrice / quantityGoodOrders;
};


/**
 * Запись лога срабатывания ордеров продажи
 * @returns {Promise<void>}
 */
const writeLogFile = async (orderId) => {
  let lastOrderStatus = await pricing.checkOrderStatus(pair, orderId);

  let tzoffset = (new Date()).getTimezoneOffset() * 120000;
  let orderTimeFormat = new Date(lastOrderStatus.time - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '');

  content = `\n--- ${orderTimeFormat} ---\n` +
    `orderId: ${lastOrderStatus.orderId}\n` +
    `price: ${lastOrderStatus.price}\n` +
    `quantity: ${lastOrderStatus.origQty}\n` +
  `----------------------------\n`;
  try {
    fs.writeFileSync(path.resolve(dirLogs, pair + '_log.txt'), content, {flag: 'a'});
  } catch (err) {
    logSellProcess.log(err);
  }
  logSellProcess.log(`Success write log file...\n`);
};

// const test = async () => {
//   logErrors.log(await pricing.cancel(pair, '57005850'));
// };

module.exports = {
  start: async () => {

    // Отменяем все существующие ордера торговой пары
    let openOrders = await pricing.openOrders(pair);
    await openOrders.forEach((order) => {
      pricing.cancel(pair, order.orderId);
    });

    // Отменяем рабочую информацию
    await getCurrentOrdersInfo();

    // Получаем информацию по балансу
    // await setBalance();

    // Получаем основную информацию в окна
    await printInfo();

    // await test();

    // Получаем информацию о точности валюты ALT
    priceFilterSize = LastPriceALT.toString().includes('.') ? LastPriceALT.toString().split('.').pop().length : 0;

    // Запускаем процесс покупки
    logBuyProcess.log('Start of buy process...');
    buyProcess();

    // Запускаем процесс продажи
    logSellProcess.log('Start of sell process...');
    sellProcess();

  }
};