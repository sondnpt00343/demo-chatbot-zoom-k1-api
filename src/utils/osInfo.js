const os = require('os')

function getOsInfo() {
  return `${os.type()} ${os.release()} (${os.arch()})`
}

module.exports = { getOsInfo }
