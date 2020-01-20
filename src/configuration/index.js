const minimist = require('minimist');
const arguments = minimist(process.argv.slice(2));
const path = require('path');

let config;

if (arguments.config && typeof arguments.config === "string") {
  try {
    config = require(path.resolve('configs', arguments.config));
  } catch (e) {
    console.log(e);
  }
} else {
  config = require(path.resolve('configs', 'config.json'));
}

exports.get = key => process.env[key] || config[key];
