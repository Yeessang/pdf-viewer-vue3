
export function debounce(fn, timeout, immediate = false) {
  let timer

  return function(...args) {
    if (timer) clearTimeout(timer)
    const context = this
    if (immediate) {
      let call = !timer
      timer = setTimeout(() => {
        timer = null
      }, timeout)
      if (call) {
        fn.apply(context, args)
      }
    } else {
      timer = setTimeout(() => {
        fn.apply(context, args)
        timer = null
      }, timeout)
    }
  }
}

export function calculateFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${size} ${sizes[i]}`;
}