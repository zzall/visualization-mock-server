require('babel-register')({
  presets: ['env']
})
const {
  isFunction,
  isObject,
  isHTML,
  isString,
  isNumber,
  isArray,
  isBoolean
} = require('./utils/types.js');

const glob = require("glob");
const pino = require("pino");
const chalk = require("chalk");
const express = require("express");
const watcher = require("./utils/watcher");
// const path = require("path");
// const fs = require("fs");
// const babel = require("@babel/core");
// const parser = require("@babel/parser");
// const traverse = require("@babel/traverse");
// const { resolve } = require('path');
const http = require("http");
const ora = require('ora');


const spinner = ora(chalk.hex('#10a8cd')('Refreshing mock server...'));

let app = express()
let server = http.createServer(app)
const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
})

// 缓存所有请求method与path信息
let cacheUrlList = []
const config = {
  basePath: ''
}
const initConfig = opts => {
  Object.assign(config, opts)
}

const getBasePath = () => config.basePath ? `${config.basePath}/`.replace('//', '/') : ""

/**
 * 获取mock文件目录信息
 * @param {string} basePath 可以指定mock上级目录的位置，默认为当前目录
 * @returns string[] 返回所有的mock文件路径
 */
const getMockFiles = () => {
  logger.info('Loading mock files...');
  const globPath = `${getBasePath()}mock/**/*.[jt]s`;
  // const testG = __dirname;
  return glob.sync(globPath)
}

/**
 * 根据mock文件生成requet
 * @param {string[]} files 
 */
const generateServerWithMockFiles = async (files = []) => {
  return Promise.all(files?.map((file) => {
    return new Promise((resolve, reject) => {
      const res = import(`${file}?${Date.now()}`)
      delete require.cache[file]
      // if (file.includes('products.js')) {
      //   console.log('data', res, res?.default?.default?.['GET /array2'])
      // }
      resolve(res)
    })
  })).then(res => {
    logger.info('Loaded mock files. Initing mock proxy...');
    res.map(fileContent => {
      Object.entries(fileContent?.default?.default || fileContent?.default || {}).map(item => {
        // console.log('item', item);
        const [method = 'get', url = ''] = item[0].split(' ').filter(Boolean)
        const reqKey = `${method} ${url}`;
        if (cacheUrlList.includes(reqKey)) {
          return logger.warn(chalk.yellow(`The repeated Mock proxy, URL is：${reqKey}`))
        }
        cacheUrlList.push(reqKey)
        logger.info(`Mock proxy URL：${reqKey}`)
        createRequest({ method, url, key: item[0], value: item[1] })
      })
    })
    logger.info('Loaded mock proxy. Initing mock server...');
  });
}

/**
 * 生成request
 * @param {object} opt 
 */
const createRequest = opt => {
  const { method = 'get', url = '', key = '', value = '' } = opt || {}
  // console.log('method', method, url);
  app[method.toLocaleLowerCase()](url, function (req, res, next) {
    if (!key) {
      res.end('mock路径为空！')
    }
    if (isFunction(value)) {
      value(req, res, next)
    }
    if (isObject(value) || isNumber(value) || isArray(value) || isBoolean(value)) {
      res.json(value)
    }
    if (isHTML(value)) {
      res.write(value)
    }
    if (isString(value)) {
      res.send(value)
    }
    res.end()
    // res.send(value)
    // TODO: 如果是文件
    // res.sendFile(value)
  });
  // app.use('*', (req, res) => {
  //   res.status(404).send('the directory you request is not exist in the server')
  // })
}
let childPid = {
  pid: null,
  isAlive: true
};

const initExpress = async ({ port, host, insertWatcher }) => {
  // if (config.childProcess) {

  //   return;
  // }
  // app.del()
  if (!insertWatcher) {
    const mockFiles = getMockFiles();
    await generateServerWithMockFiles(mockFiles);
    server = http.createServer(app);
    server.on('error', onError);
    server.on('close', onClose);
    server.on('listening', onListening);
    server.listen(port, () => {
      logger.info(`${chalk.hex('#10a8cd')('Mock server is Ready：')}${chalk.green.bold(`http://${host}:${port}`)}`);
    })
  } else {
    app = null;
    app = express();
    // logger.info('开始close~·')
    server.close(); // 开启新server实例前干掉前一个server，避免端口占用
    // server = null;
    cacheUrlList = [];
    spinner.start()
  }

  async function onClose() {
    logger.info(chalk.green('Refreshed.'))
    spinner.stop()
    const mockFiles = getMockFiles();
    await generateServerWithMockFiles(mockFiles);
    server = http.createServer(app);
    server.on('error', onError);
    server.on('close', onClose);
    server.on('listening', onListening);
    server.listen(port, () => {
      logger.info(`${chalk.hex('#10a8cd')('Mock server is Ready：')}${chalk.green.bold(`http://${host}:${port}`)}`);
    })
  }


  function onError(error) {
    if (error.syscall !== 'listen') { // 系统非监听端口操作报错
      throw error;
    }
    /* 系统监听端口操作报错 */
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES': // 拒绝访问，则关闭进程
        logger.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE': // 服务器地址已经被占用，则关闭进程
        logger.error(bind + ' is already in use');
        process.exit(1);
        break;
      default: // 非上面两种问题，抛出异常
        throw error;
    }
  }

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    logger.info('Listening on ' + bind); // 通过debug来打印调试日志
  }
}

/**
 * 初始化mock server入口
 * @param {object} options 
 */
const initMockServer = options => {
  options = {
    port: process.env.PORT || 3000,
    host: 'localhost',
    basePath: process.cwd(),
    watch: true,
    mockType: 'js',
    childProcess: true,
    ...options
  }
  initConfig(options);
  const { port, host, watch } = options
  initExpress({ port, host });
  if (watch) {
    watcher(`${getBasePath()}mock/`, (eventType, filename) => {
      initExpress({ port, host, insertWatcher: true });
      // app.close()
      // app.listen(port, host, () => {
      //   logger.info(chalk.green(`Mock server is Ready：http://${host}:${port}`))
      // })
    })
  }
}

// initMockServer();


// export default initMockServer
module.exports = initMockServer
