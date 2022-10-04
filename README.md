## visualization-mock-server

![version](https://badge.fury.io/js/visualization-mock-server.svg)

<!-- ![install size](https://packagephobia.com/badge?p=visualization-mock-server) -->

基于本地 mock 文件生成本地 mock 服务器

服务器基于`express`

### mock 文件目录如下

```
└── mock
│   ├── empty.js
│   ├── login.js
│   └── products.js
```

### 接口文件格式如下

login.js

```javascript
export default {
	"GET /function": (_req, res) => {
		res.json({
			success: true,
			data: {},
			errorCode: 0,
		});
	},
	"GET /object": {
		name: "zzz",
		age: 21,
	},
	"GET /string": "string",
	"GET /boolean": false,
	"GET /number": 1,
	"GET /array": [
		{
			name: "zzz",
			age: 21,
		},
		{
			name: "zzz2",
			age: 22,
		},
	],
};
```

### 支持 mock 数据类型

- `Object`
- `Array`
- `Function`
  - 入参分别对照`express`的`req`，`res`与`next`
- `String`
- `Number`
- `Boolean`
- ~~`HTMLElement`~~后续补上
- ~~文件~~后续会补上

### 安装

```bash
npm i visualization-mock-server -D
```

### 使用

#### mockServer 使用

```javascript
const initMockServer = require("visualization-mock-server");

initMockServer({ port: 4001, host: "localhost" });
```

#### devServerMiddleware 使用

```javascript
const { devServerMiddleware } = require("visualization-mock-server");

const { onBeforeSetupMiddleware, before } = devServerMiddleware();

// webpack.config.js

module.exports = {
	devServer: {
		onBeforeSetupMiddleware: devServerMiddleware().onBeforeSetupMiddleware,
	},
	// 更早的devServer版本需要用before
	devServer: {
		before: devServerMiddleware().before,
	},
};
```

针对不同的`webpack-dev-server`版本，考虑使用`onBeforeSetupMiddleware`与`before`

具体可查看[devServer 暴露的 api 情况](https://webpack.docschina.org/configuration/dev-server/)

## TODO

- 可借助`express`插件丰富 mock server 的用法
  - express-art-template art-template body-parser 等
- cicd
- 自动化构建流程
