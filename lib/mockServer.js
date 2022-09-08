import {
  isFunction,
  isObject,
  isHTML,
  isString,
  isNumber,
  isArray,
  isBoolean
} from './utils/types.js'

import glob from 'glob'
import pino from "pino";
import chalk from "chalk";
import express from "express";
import watcher from './utils/watcher.js';
import path from "path";
import http from 'http'
import fs from 'fs';
import babel from "@babel/core";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import dinc from "dynamic-import-no-cache";
const __dirname = path.resolve();


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
  const globPath = `${getBasePath()}mock/**/*.[jt]s`;
  // const testG = __dirname;
  return glob.sync(globPath)
}

/**
 * 根据mock文件生成requet
 * @param {string[]} files 
 */
const generateServerWithMockFiles = (files = []) => {
  files?.map(async (file) => {
    try {
      // const data = require(file)
      // const data = await dinc(file)
      if (file.includes('products.js')) {
        const newdata = fs.readFileSync(file, 'utf-8')
        console.log('newdata', newdata);
      }
      // dinc(file).then(data => {
      import(`${file}?${Date.now()}`).then(data => {
        if (file.includes('products.js')) {
          console.log('data', data.default['GET /array2'])
        }
        Object.entries(data?.default || {}).map(item => {
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

    } catch (err) {
      logger.error(chalk.red(err))
    }

  })

}

/**
 * 生成request
 * @param {object} opt 
 */
const createRequest = opt => {
  const { method = 'get', url = '', key = '', value = '' } = opt || {}
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

const initExpress = ({ port, host, insertWatcher }) => {
  logger.error('initExpress')
  // if (config.childProcess) {

  //   return;
  // }
  // app.del()
  // if (insertWatcher) {
  //   console.log('watcher-zhiqian',);
  //   return server.close();
  // }
  app = null;
  app = express();
  server.close(); // 开启新server实例前干掉前一个server，避免端口占用
  cacheUrlList = [];
  logger.info('Loading mock files...');
  const mockFiles = getMockFiles();
  generateServerWithMockFiles(mockFiles);
  server = http.createServer(app);

  server.on('error', onError);
  server.on('close', onClose);
  function onClose() {
    console.log('关闭~·')
  }
  server.on('listening', onListening);

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


  logger.info('Loaded mock files. Initing mock server...');
  server.listen(port, () => {
    logger.info(chalk.green(`Mock server is Ready：http://${host}:${port}`));
  })
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


export default initMockServer
