const pricing = require('pricing');
const config = require('configuration');
const path = require('path');
const fs = require('fs');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
const { blessed, screen, boxInfoTopLeft, boxInfoTopCenter, boxInfoTopRight, logBuyProcess, logSellProcess,
  logErrors
} = require('screens');

Number.prototype.toFixedNoRounding = function(n) {
  return Math.floor(this * n) / n;
};

/**
 * Директория хранения логов продажи
 */
const dirLogsBuy = config.get('DIR_LOGS_BUY');
const dirLogsSell = config.get('DIR_LOGS_SELL');

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
 * Коеффициент покупки
 */
const ratioBuy = config.get('RATIO_BUY');

/**
 * Коеффициент продажи
 */
const ratioSell = config.get('RATIO_SELL');

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
 * Ограничение точности кол-ва для заданной валюты (кол-во знаков после запятой)
 */
quantityFilterSize = 0;

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
 * Текущий часовой пояс
 */
tzoffset = (new Date()).getTimezoneOffset() * 120000;


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

  let orderTimeFormat = timeLastOrderBuy ?
    new Date(timeLastOrderBuy - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    : 0;
  boxInfoTopRight.content = `orderMin = ${orderMin.toFixedNoRounding(priceFilterSize)}\n` +
    `orderPrice = ${orderPrice.toFixedNoRounding(priceFilterSize)}\n` +
    `quantityGoodOrders = ${quantityGoodOrders}\n` +
    `timeLastOrderBy = ${orderTimeFormat}\n` +
    `averagePriceBuy = ${averagePriceBuy.toFixedNoRounding(priceFilterSize)}\n` +
    `altPriceBuy = ${(averagePriceBuy * altPriceBuyIndex).toFixedNoRounding(priceFilterSize)}`;

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

  if (typeof balances !== 'undefined') {
    BalBTCAv = parseFloat(balances.BTC.available);
    BalBTCInOrder = parseFloat(balances.BTC.onOrder);
    BalBTC = BalBTCAv + BalBTCInOrder;

    BalALTAv = parseFloat(balances[pairParts[0]].available);
    BalALTInOrder = parseFloat(balances[pairParts[0]].onOrder);
    BalALT = BalALTAv + BalALTInOrder;
  }

  if (typeof prices !== 'undefined') {
    LastPriceBTC = parseFloat(prices.BTCUSDT);
    LastPriceALT = parseFloat(prices[pair]);
  }
};


/**
 * Метод проверки необходимых условий перед созданием ордера покупки
 * @returns {Promise<void>}
 */
const buyProcess = async () => {
  const time = 5*1000;
  let error = false;

  // orderPrice = parseFloat((ratio * orderMin).toFixedNoRounding(priceFilterSize));

  if (LastPriceALT > orderMin || quantityGoodOrders >= quantityGoodOrdersMax || BalBTCAv < orderSum) {
    error = true;
  }

  orderPrice = parseFloat((LastPriceALT * ratioBuy).toFixedNoRounding(priceFilterSize));

  if (error) {
    await setTimeoutPromise(time);
    buyProcess();
  } else {
    createOrder(orderPrice, BalALT);
  }
};


/**
 * Метод создания ордера покупки
 * @returns {Promise<void>}
 */
const createOrder = async (price, lastBalance) => {
  // let quantity = Math.ceil(orderSum / price);
  let quantity = (orderSum / price).toFixedNoRounding(quantityFilterSize);
  let createTime = new Date(new Date().getTime() - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '');
  logBuyProcess.log(`---------------------------------`);
  logBuyProcess.log(`Create order - quantity = ${quantity}, price = ${price.toFixedNoRounding(priceFilterSize)}`);

  try {
    let orderId = await pricing.buy(pair, quantity, price);
    logBuyProcess.log(`${createTime} - Buy order created - orderId: ${orderId}`);
    await closeOrder(orderId, price, lastBalance);
  } catch (e) {
    pricing.logError(e);
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
    orderMin = parseFloat((ratio*orderMin).toFixedNoRounding(priceFilterSize));
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
    let orderClosedTime = new Date(orderStatus.updateTime - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    logBuyProcess.log(`${orderClosedTime} - Order closed, balance increased...`);
    await writeLogFile(orderId, dirLogsBuy);
    buyProcess();
  } else {
    let cancelTime = new Date(new Date().getTime() - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '');
    logBuyProcess.log(`Balance has not changed...`);
    logBuyProcess.log(`${cancelTime} - Cancel order with id - ${orderId}\n`);
    try {
      await pricing.cancel(pair, orderId);
    } catch (e) {
      pricing.logError(e);
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

  if (BalALTAv.toFixedNoRounding(quantityFilterSize) <= 0) {
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
  if (typeof openOrders !== 'undefined') {
    await openOrders.filter((order) => order.side === 'SELL').forEach((o) => {
      orderFilled = false;
    });
  }

  if (orderFilled && sellOpenOrderId) {
    logSellProcess.log(`Order closed, alt sold...`);
    await writeLogFile(sellOpenOrderId, dirLogsSell);

    // for (let i = 0; i < quantityGoodOrderSell; i++) {
    //   orderMin = orderMin / ratio;
    // }

    orderMin = parseFloat((orderMin / (ratio - ratioSell)).toFixedNoRounding(priceFilterSize));

    quantityGoodOrders = 0;
    quantityGoodOrderSell = 0;
    sellOpenOrderId = false;
  }

  if (!error) {
    await openOrders.filter((order) => order.side === 'SELL').forEach((order) => {
      pricing.cancel(pair, order.orderId);
      let cancelTime = new Date(new Date().getTime() - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      logSellProcess.log(`${cancelTime} - Cancel sell order with id - ${order.orderId}\n`);
    });

    await setBalance();
    await setTimeoutPromise(2000);
    logSellProcess.log(`---------------------------------`);

    if (!averagePriceBuy) {
      averagePriceBuy = parseFloat((LastPriceALT * ratioBuy).toFixedNoRounding(priceFilterSize));
    }
    let altPriceBuy = altPriceBuyIndex * averagePriceBuy;
    let altBalInOrder = BalALTAv.toFixedNoRounding(quantityFilterSize);
    try {
      sellOpenOrderId = await pricing.sell(pair, altBalInOrder, altPriceBuy.toFixedNoRounding(priceFilterSize));
      quantityGoodOrderSell = quantityGoodOrders;
      sellOrderFlag = false;
      let createTime = new Date(new Date().getTime() - tzoffset).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      logSellProcess.log(`${createTime} - Sell order created...`);
      logSellProcess.log(`orderId: ${sellOpenOrderId}`);
      logSellProcess.log(`price: ${altPriceBuy.toFixedNoRounding(priceFilterSize)}`);
      logSellProcess.log(`quantity: ${altBalInOrder}`);
    } catch (e) {
      let error = JSON.parse(e);
      if (error.msg === 'Filter failure: MIN_NOTIONAL') {
        logSellProcess.log(`MIN_NOTIONAL Filter during order creation`);
        logSellProcess.log(`Waiting for another purchase...`);
        sellOrderFlag = false;
      } else {
        pricing.logError(e);
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
 * Запись лога срабатывания ордеров продажи и покупки
 * @returns {Promise<void>}
 */
const writeLogFile = async (orderId, dirLogs) => {
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
  if (dirLogs === 'logsBuy') {
    logBuyProcess.log(`Success write log file...\n`);
  } else {
    logSellProcess.log(`Success write log file...\n`);
  }
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

    // Получаем информацию о точности кол-ва валюты ALT
    let pairInfo = await pricing.exchangeInfo();
    quantityFilterSize = parseFloat(pairInfo[pair].minQty).toString().includes('.') ? parseFloat(pairInfo[pair].minQty).toString().split('.').pop().length : 0;
    let numberQuantityFilterSize = '1';
    for (let i = 0; i < quantityFilterSize; i++) {
      numberQuantityFilterSize += '0';
    }
    quantityFilterSize = parseInt(numberQuantityFilterSize);

    // Получаем информацию о точности цены валюты ALT
    priceFilterSize = LastPriceALT.toString().includes('.') ? LastPriceALT.toString().split('.').pop().length : 0;
    let numberPriceFilterSize = '1';
    for (let i = 0; i < priceFilterSize; i++) {
      numberPriceFilterSize += '0';
    }
    priceFilterSize = parseInt(numberPriceFilterSize);

    // Запускаем процесс покупки
    logBuyProcess.log('Start of buy process...');
    buyProcess();
    //
    // Запускаем процесс продажи
    logSellProcess.log('Start of sell process...');
    sellProcess();

  }
};