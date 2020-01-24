var blessed = require('blessed');

const sleep = async (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

var screen = blessed.screen({
  smartCSR: true,
  warnings: true
});

/**
 * Шаблон левого верхнего блока информации
 */
var boxInfoTopLeft = blessed.box({
  parent: screen,
  top: '0',
  left: '0',
  width: '33.5%',
  height: '40%',
  tags: true,
  border: {
    type: 'line',
    left: false,
    top: false,
    right: true,
    bottom: false
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

/**
 * Шаблон центрального верхнего блока информации
 */
var boxInfoTopCenter = blessed.box({
  parent: screen,
  top: '0',
  left: '33.5%',
  width: '33.5%',
  height: '40%',
  tags: true,
  border: {
    type: 'line',
    left: false,
    top: false,
    right: true,
    bottom: false
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

/**
 * Шаблон правого верхнего блока информации
 */
var boxInfoTopRight = blessed.box({
  parent: screen,
  top: '0',
  left: '67%',
  width: '33%',
  height: '40%',
  tags: true,
  border: {
    type: 'line',
    left: false,
    top: false,
    right: false,
    bottom: false
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

/**
 * Шаблон левого блока процесса создания ордеров
 */
var logBuyProcess = blessed.log({
  parent: screen,
  bottom: '0',
  left: 'left',
  width: '50%',
  height: '60%',
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  label: 'Buy process',
  scrollback: 100,
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'yellow'
    },
    style: {
      inverse: true,
    }
  },
  border: {
    type: 'line',
    left: false,
    bottom: false,
    right: true,
    top: true
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

/**
 * Шаблон правого блока процесса продажи ордеров
 */
var logSellProcess = blessed.log({
  parent: screen,
  bottom: '0',
  right: '0',
  width: '50%',
  height: '60%',
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  label: 'Sell process',
  scrollback: 100,
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'yellow'
    },
    style: {
      inverse: true,
    }
  },
  border: {
    type: 'line',
    left: false,
    bottom: false,
    right: false,
    top: true
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});




var logErrors = blessed.log({
  parent: screen,
  top: '0',
  right: '0',
  width: '0',
  height: '0',
  tags: true,
  border: {
    type: 'line',
    left: false,
    top: false,
    right: false,
    bottom: false
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

// Закрытие скрипта по нажатию Escape, q
screen.key(['escape', 'q'], function(ch, key) {
  return process.exit(0);
});

// Отображение рабочего экрана
screen.render();

module.exports = {
  blessed: blessed,
  screen: screen,
  boxInfoTopLeft: boxInfoTopLeft,
  boxInfoTopCenter: boxInfoTopCenter,
  boxInfoTopRight: boxInfoTopRight,
  boxInfoTopLeft: boxInfoTopLeft,
  logSellProcess: logSellProcess,
  logBuyProcess: logBuyProcess,
  logErrors: logErrors,
};
