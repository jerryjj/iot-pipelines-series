const writeLog = function (lvl, ...args) {
  if (typeof args[0] === 'string') args[0] = `${lvl}: ${args[0]}`
  console.log.apply(null, args)
}

const LEVEL = {
  debug: 4,
  info: 3,
  warn: 2,
  error: 1
}

const LOG_LEVEL = process.env.LOG_LEVEL ? LEVEL[process.env.LOG_LEVEL] : LEVEL.debug

module.exports = {
  LEVEL,
  log: writeLog,
  debug: function () {
    if (LOG_LEVEL === LEVEL.debug) writeLog('debug', ...arguments)
  },
  info: function () {
    if (LOG_LEVEL >= LEVEL.info) writeLog('info', ...arguments)
  },
  warn: function () {
    if (LOG_LEVEL >= LEVEL.warn) writeLog('warn', ...arguments)
  },
  error: function () {
    if (LOG_LEVEL >= LEVEL.error) writeLog('error', ...arguments)
  }
}
