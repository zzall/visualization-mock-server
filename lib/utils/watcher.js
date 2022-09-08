import watch from 'node-watch';


const watcher = (filename = '', cb = () => { }) => {
  watch(filename, {
    recursive: true,
  }, cb);
}

export default watcher
