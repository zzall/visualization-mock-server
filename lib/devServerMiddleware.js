const fs = require('fs')
const path = require('path')
const chalk = require("chalk");
const { logger } = require('./utils/log');


function getFilesSync(filePath, result) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const filePaths = fs.readdirSync(filePath);
      filePaths.forEach((item) => {
        const itemFilePath = path.join(filePath, item);
        getFilesSync(itemFilePath, result);
      });
    } else {
      delete require.cache[require.resolve(filePath)];
      const file = require(filePath);
      Object.keys(file).map(key => {
        if (result.hasOwnProperty(key)) {
          logger.warn(chalk.yellow(`The repeated Mock proxy, URL is：${reqKey}`))
        }
      })
      Object.assign(result, file);
    }
  } catch (error) {
    logger.error(chalk.red(`error: ${error}`) );
  }
}
function mockMiddleware(mockPath) {
  return function (req, res, next) {
    logger.info('Loading mock files...');
    const method = req.method.toLowerCase();
    const baseUrl = req.baseUrl;
    const apiMap = {};
    getFilesSync(mockPath, apiMap);
    for (const [reqKey, handle] of Object.entries(apiMap)) {
      logger.info(`Mock proxy URL：${reqKey}`)
      const arr = reqKey.split(' ').reverse();
      const api = arr[0];
      const _method = arr[1] ? arr[1].toLowerCase() : 'get';
      if (_method === method && api === baseUrl) {
        if (typeof handle === 'function') {
          handle(req, res);
        } else {
          res.send(handle);
        }
        return;
      }
    }
    next();
    logger.info(chalk.green('Finished.'))
  };
};
const devServerMiddleware = opts => {
  const {
    mockPath = path.join(process.cwd(), 'mock')
  } = opts || {};
  return {
    onBeforeSetupMiddleware(devServer) {
      const { app } = devServer;
      app.use('*', mockMiddleware(mockPath));
    },
    before(app) {
      app.use('*', mockMiddleware(mockPath));
    }
  }
}

module.exports = devServerMiddleware;
