

// import initMockServer from "./lib/mockServer.js";
const initMockServer = require("./lib/mockServer");

// import dinc from "dynamic-import-no-cache";

// (async function () {

//   const data = await dinc('/mock/login.js')
//   console.log('data', data?.default?.['GET /function']);
// })()

// 

// export default initMockServer;
module.exports = initMockServer;