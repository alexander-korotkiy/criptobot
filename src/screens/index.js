var blessed = require('blessed');

const sleep = async (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

var screen = blessed.screen({
  smartCSR: true,
  warnings: true
});

var boxInfoTopLeft = blessed.box({
  parent: screen,
  top: '30%',
  left: '0',
  width: '33.5%',
  height: '40%',
  tags: true,
  // label: 'Info',
  border: {
    type: 'line',
    left: false,
    top: false,
    right: true,
    bottom: false
  },
  style: {
    fg: 'white',
    // bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

var boxInfoTopCenter = blessed.box({
  parent: screen,
  top: '30%',
  left: '33.5%',
  width: '33.5%',
  height: '40%',
  tags: true,
  // label: 'Info',
  border: {
    type: 'line',
    left: false,
    top: false,
    right: true,
    bottom: false
  },
  style: {
    fg: 'white',
    // bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

var boxInfoTopRight = blessed.box({
  parent: screen,
  top: '30%',
  left: '67%',
  width: '33%',
  height: '40%',
  tags: true,
  // label: 'Info',
  border: {
    type: 'line',
    left: false,
    top: false,
    right: false,
    bottom: false
  },
  style: {
    fg: 'white',
    // bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
});

var logBuyProcess = blessed.log({
  parent: screen,
  bottom: '0',
  left: 'left',
  width: '50%',
  height: '30%',
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
    // bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

var logSellProcess = blessed.log({
  parent: screen,
  bottom: '0',
  right: '0',
  width: '50%',
  height: '30%',
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
    // bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
// screen.append(boxInfo);
// screen.append(logBuyProcess);
// screen.append(logSellProcess);

// Quit on Escape, q
screen.key(['escape', 'q'], function(ch, key) {
  return process.exit(0);
});

// screen.key(['p'], function(ch, key) {
//   logBuyProcess.log(`Process is stopped...`);
//   logSellProcess.log(`Process is stopped...`);
//   sleep(5000*1000).then(() => {
//     return process.exit(0);
//   });
// });

// Focus our element.
// boxInfo.focus();
// logBuyProcess.focus();

// Render the screen.
screen.render();

module.exports = {
  blessed: blessed,
  screen: screen,
  boxInfoTopLeft: boxInfoTopLeft,
  boxInfoTopCenter: boxInfoTopCenter,
  boxInfoTopRight: boxInfoTopRight,
  boxInfoTopLeft: boxInfoTopLeft,
  logSellProcess: logSellProcess,
  logBuyProcess: logBuyProcess
};
