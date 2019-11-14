const logger = require('../lib/logger')
const Device = require('./device')
const { getRandom } = require('../lib/utils')

const DEVICE_RANDOM_ACTIONS = {
  1: 'powerOn',
  5: 'powerOn',
  2: 'triggerAlarm',
  7: 'triggerAlarm',
  9: 'powerOff'
}

class Devices {
  constructor () {
    this.count = 0
    this._devices = {}

    this._controllerIv = null
  }

  async init (config) {
    logger.debug('init devices', { config })
    if (config.geoCenter && config.geoCenter.length) {
      const parts = config.geoCenter.split(',')
      config.geoCenter = {
        latitude: parseFloat(parts[0]),
        longitude: parseFloat(parts[1])
      }
    }
    this.config = config

    const initTasks = []
    for (let i = 0; i < parseInt(this.config.count); i++) {
      initTasks.push(await this._initDevice(i))
    }

    await Promise.all(initTasks)

    logger.info(`initialized ${this.count} device(s).`)

    logger.info('starting controller loop')
    this._controllerIv = setInterval(() => this._tick(), 3000)
  }

  async terminalAll () {
    const tasks = []
    Object.keys(this._devices).forEach(async (id) => {
      tasks.push(await this._devices[id].terminate())
      delete this._devices[id]
      this.count--
    })
    return Promise.all(tasks)
  }

  async removeDevice (id) {
    await this._devices[id].terminate()
    delete this._devices[id]
    this.count--
  }

  async _initDevice (index) {
    const props = {
      latitude: this.config.geoCenter.latitude + (getRandom(1, 3) * 0.001),
      longitude: this.config.geoCenter.longitude + (getRandom(1, 3) * 0.001)
    }
    const device = new Device(index, props)
    await device.init()

    this._devices[device.id] = device
    this.count++
  }

  async _tick () {
    const deviceIndex = getRandom(0, Object.keys(this._devices).length)

    const shouldExecuteTick = () => {
      if (this.count > 10) {
        return (getRandom(1, 100) % 2)
      }
      return true
    }

    if (shouldExecuteTick()) {
      const actionIndex = getRandom(1, 10)
      const actionMethod = DEVICE_RANDOM_ACTIONS[actionIndex]

      if (!actionMethod) return

      let device
      Object.keys(this._devices).forEach((id, idx) => {
        if (idx === deviceIndex) device = this._devices[id]
      })

      if (device) device[actionMethod]()
    } else {
      logger.debug('skipping control tick')
    }
  }
}

module.exports = new Devices()
