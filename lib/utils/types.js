const getBaseType = (target) => Object.prototype.toString.call(target)?.match(/(?<= ).+(?=\])/)?.[0]
const isFunction = (tr) => getBaseType(tr) === 'Function'
const isObject = (tr) => getBaseType(tr) === 'Object'
const isHTML = (tr) => /^HTML.+Element$/.test(getBaseType(tr))
const isString = (tr) => getBaseType(tr) === 'String'
const isNumber = (tr) => getBaseType(tr) === 'Number'
const isArray = (tr) => getBaseType(tr) === 'Array'
const isBoolean = (tr) => getBaseType(tr) === 'Boolean'

export {
  getBaseType,
  isFunction,
  isObject,
  isHTML,
  isString,
  isNumber,
  isArray,
  isBoolean
}
