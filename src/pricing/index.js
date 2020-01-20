const config = require('configuration')

const APIKEY = config.get('BINANCE_API_KEY')
const APISECRET = config.get('BINANCE_API_SECRET')

const binance = require('node-binance-api')().options({ APIKEY, APISECRET, useServerTime: true })

module.exports = {
  getBalances: async () => new Promise((resolve, reject) => {
    binance.balance((err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }),
  getPrices: async () => new Promise((resolve, reject) => {
    binance.prices((err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }),
  getBuyPrice: async (pair) => new Promise((resolve, reject) => {
    console.log(pair);
    binance.prices(pair, (err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }),
  getSellPrice: async () => new Promise((resolve, reject) => {
    binance.prices((err, obj) => {
      err ? reject(err.body) : resolve(obj)
    })
  }),
  openOrders: async (pair) => new Promise((resolve, reject) => {
    binance.openOrders(pair, (err, openOrders, symbol) => {
      err ? reject(err.body) : resolve(openOrders)
    })
  }),
  buy: async (pair, quantity, price) => new Promise((resolve, reject) => {
    binance.buy(pair, quantity, price, {type: 'LIMIT'}, (err, response) => {
      err ? reject(err.body) : resolve(response.orderId)
    })
  }),
  sell: async (pair, quantity, price) => new Promise((resolve, reject) => {
    binance.sell(pair, quantity, price, {type: 'LIMIT'}, (err, response) => {
      err ? reject(err.body) : resolve(response.orderId)
    })
  }),
  cancel: async (pair, orderId) => new Promise((resolve, reject) => {
    binance.cancel(pair, orderId, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }),
  getAllOrders: async (pair) => new Promise((resolve, reject) => {
    binance.allOrders(pair, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }),
  checkOrderStatus: async (pair, orderId) => new Promise((resolve, reject) => {
    binance.orderStatus(pair, orderId, (err, response, symbol) => {
      err ? reject(err.body) : resolve(response)
    })
  }),
};




