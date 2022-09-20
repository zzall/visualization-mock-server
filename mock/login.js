module.exports = {
  'GET /function': (_req, res) => {
    res.json({
      success: true,
      data: {},
      errorCode: 0,
    });
  },
  'GET /object': {
    name: 'zzz',
    age: 2122
  },
  'GET /string': 'string',
  'GET /boolean': false,
  'GET /number': 1,
  'GET /array': [{
    name: 'zzz',
    age: 21
  }, {
    name: 'zzz2',
    age: 22
  }]
};
