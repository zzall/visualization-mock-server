import { fork, spawn } from "child_process";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

let childPid = {
  pid: null,
  isAlive: true
};

/**
 * 启动子进程
 */
function startServerProcess() {
  //启动子进程并监听子进程发来的消息
  let childProcess = fork('lib/mockServer.js');
  //保存子进程的pid
  childPid = {
    pid: childProcess.pid,
    isAlive: true
  };
}

let fileName = './demo.txt';
//从命令行参数中获取watch文件名
// if (process.argv.length === 4 && process.argv[2] === '--watch') {
//   fileName = './' + process.argv[3];
// }
console.log('process', process);

fs.watch('./lib/demo.txt', function () {
  //因为windows下每次改变文件都会触发两次watch
  //必须要判断进程是存活状态，否则kill会报错
  if (childPid.isAlive) {
    //杀死子进程
    process.kill(childPid.pid);
    //状态设置为死亡
    childPid.isAlive = false;
    //重启一个新的子进程
    startServerProcess();
  }
});

process.on('exit', function() {
  console.log('killing');
  process.kill(childPid.pid);
});

export default startServerProcess
