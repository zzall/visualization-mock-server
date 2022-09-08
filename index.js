require('babel-register')({
  presets: ['env']
})

const glob = require("glob");
const path = require('path')
const pino = require('pino')
const chalk = require('chalk');
const express = require('express');
const app = express()
const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
})

const getBaseType = (target) => Object.prototype.toString.call(target)?.match(/(?<= ).+(?=\])/)?.[0]
const isFunction = (tr) => getBaseType(tr) === 'Function'
const isObject = (tr) => getBaseType(tr) === 'Object'
const isHTML = (tr) => /^HTML.+Element$/.test(getBaseType(tr))
const isString = (tr) => getBaseType(tr) === 'String'
const isNumber = (tr) => getBaseType(tr) === 'Number'
const isArray = (tr) => getBaseType(tr) === 'Array'
const isBoolean = (tr) => getBaseType(tr) === 'Boolean'

// 缓存所有请求method与path信息
const cacheUrlList = []

/**
 * 获取mock文件目录信息
 * @param {string} baseUrl 可以指定mock上级目录的位置，默认为当前目录
 * @returns string[] 返回所有的mock文件路径
 */
const getMockFiles = (baseUrl = '') => {
  return glob.sync(`${baseUrl ? `${baseUrl}/` : ''}mock/**/*.[jt]s`)
}

/**
 * 生成request
 * @param {object} opt 
 */
const createRequest = opt => {
  const { method = 'get', url = '', key = '', value = '' } = opt || {}
  app[method.toLocaleLowerCase()](url, function (req, res, next) {
    if (!key) {
      return res.end('mock路径为空！')
    }
    if (isFunction(value)) {
      return value(req, res, next)
    }
    if (isObject(value) || isNumber(value) || isArray(value) || isBoolean(value)) {
      return res.json(value)
    }
    if (isHTML(value)) {
      return res.write(value)
    }
    if (isString(value)) {
      return res.send(value)
    }
    res.send(value)
    // TODO: 如果是文件
    // res.sendFile(value)
  })
}

/**
 * 根据mock文件生成requet
 * @param {string[]} files 
 */
const generateServerWithMockFiles = (files = []) => {
  files?.map(file => {
    const data = require(path.resolve(__dirname, file))
    Object.entries(data?.default || {}).map(item => {
      const [method = 'get', url = ''] = item[0].split(' ').filter(Boolean)
      const reqKey = `${method} ${url}`;
      if (cacheUrlList.includes(reqKey)) {
        return logger.warn(chalk.yellow(`发现了重复的mock代理，url为：${reqKey}`))
      }
      cacheUrlList.push(reqKey)
      createRequest({ method, url, key: item[0], value: item[1] })
    })
  })

}


/**
 * 初始化mock server入口
 * @param {object} options 
 */
const initMockServer = options => {
  const PORT = 3000, HOST = 'localhost'
  options = {
    port: PORT, host: HOST,
    ...options
  }
  const { port, host } = options
  const mockFiles = getMockFiles()
  logger.info('加载mock文件中...')
  generateServerWithMockFiles(mockFiles)
  logger.info('加载mock完成，开始初始化mock server...')
  app.listen(port, host, () => {
    logger.info(`mock服务器地址：http://${host}:${port}`)
  })
}


module.exports = initMockServer