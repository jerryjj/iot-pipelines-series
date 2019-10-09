const logger = require('./lib/logger')
const Devices = require('./devices')
const fs = require('fs')

const deviceConfig = {
  count: (process.env.DEVICE_COUNT || 5),
  geoCenter: process.env.GEO_CENTER || '60.168958,24.945093'
}

const validateEnv = () => {
  if (!process.env.GCP_PROJECT_ID) logger.error(`missing environment variable '${process.env.GCP_PROJECT_ID}'`)

  const pathToSecretKey = process.env.CREDENTIALS_FILE || '../secrets/ps-secret-key.json'
  if (!fs.existsSync(pathToSecretKey)) {
    logger.error(`secret key not found from path ${pathToSecretKey}. Use env 'CREDENTIALS_FILE' to overwrite`)
    return false
  }

  return true
}

async function main () {
  if (!validateEnv()) return

  await Devices.init(deviceConfig)
}

process.on('SIGINT', async () => {
  logger.info('shutting down, gracefully powering off all devices')

  try {
    await Devices.terminalAll()
  } catch (error) {
    logger.error('Error powering off devices', { error })
    process.exit(1)
    return
  }

  setTimeout(() => {
    logger.info('shutting down complete')
    process.exit(0)
  }, 3000)
})

if (require.main === module) {
  process.on('uncaughtException', (error) => {
    // handle the error safely
    logger.error('uncaughtException', { error, stack: error.stack })
  })

  // If this is run as a script, start the server
  main()
}
