const config = require('configuration')

const APIKEY = config.get('BINANCE_API_KEY')
const APISECRET = config.get('BINANCE_API_SECRET')

const binance = require('node-binance-api')().options({ APIKEY, APISECRET, useServerTime: true })

const { logErrors } = require('screens');

process.on('unhandledRejection', error => {
  logErrors.log('unhandledRejection', error);
});

module.exports = {

  /**
   * Получения информации о текущих балансах аккаунта
   * @returns {Promise<object>}
   */
  getBalances: async () => new Promise((resolve, reject) => {
    binance.balance((err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Получения информации о текущих ценах валют
   * @returns {Promise<object>}
   */
  getPrices: async () => new Promise((resolve, reject) => {
    binance.prices((err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Получение информации о всех открытых ордерах торговой пары
   * @param pair string Аббревиатура торговой пары
   * @returns {Promise<object>}
   */
  openOrders: async (pair) => new Promise((resolve, reject) => {
    binance.openOrders(pair, (err, openOrders, symbol) => {
      err ? reject(err.body) : resolve(openOrders)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Создание ордера на покупку валюты
   * @param pair string Аббревиатура торговой пары
   * @param quantity integer Количество покупаемой валюты
   * @param price float Цена ордера
   * @returns {Promise<object>}
   */
  buy: async (pair, quantity, price) => new Promise((resolve, reject) => {
    binance.buy(pair, quantity, price, {type: 'LIMIT'}, (err, response) => {
      err ? reject(err.body) : resolve(response.orderId)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Создание ордера на продажу валюты
   * @param pair string Аббревиатура торговой пары
   * @param quantity integer Количество продаваемой валюты
   * @param price float Цена ордера
   * @returns {Promise<object>}
   */
  sell: async (pair, quantity, price) => new Promise((resolve, reject) => {
    binance.sell(pair, quantity, price, {type: 'LIMIT'}, (err, response) => {
      err ? reject(err.body) : resolve(response.orderId)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Отмена ордера
   * @param pair string Аббревиатура торговой пары
   * @param orderId integer Идентификатор ордера
   * @returns {Promise<object>}
   */
  cancel: async (pair, orderId) => new Promise((resolve, reject) => {
    binance.cancel(pair, orderId, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Получение информации по всем ордерам торговой пары
   * @param pair string Аббревиатура торговой пары
   * @returns {Promise<object>}
   */
  getAllOrders: async (pair) => new Promise((resolve, reject) => {
    binance.allOrders(pair, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }).catch(error => {
    logErrors.log(error);
  }),

  /**
   * Получение полной информации по ордеру
   * @param pair string Аббревиатура торговой пары
   * @param orderId integer Идентификатор ордера
   * @returns {Promise<object>}
   */
  checkOrderStatus: async (pair, orderId) => new Promise((resolve, reject) => {
    binance.orderStatus(pair, orderId, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }).catch(error => {
    logErrors.log(error);
  }),
};




