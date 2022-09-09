// import watch from 'node-watch';
const watch = require('node-watch')


const watcher = (filename = '', cb = () => { }) => {
  watch(filename, {
    recursive: true,
  }, cb);
}

// export default watcher
module.exports = watcher
