const logger = require('../lib/logger')
const { publishPayload } = require('../lib/publisher')
const uuidv4 = require('uuid/v4')
const gpsSim = require('../lib/gps-sim')
const { getRandom } = require('../lib/utils')

const INTERVALS = {
  tick: 1000,
  poweredOnUpdate: (5 * 1000),
  poweredOffUpdate: (3 * 60 * 1000)
}

const RIDE_SPEED = 18 // km/h
const DEFAULT_ID_PREFIX = `000`

const timestamp = () => Math.round(new Date().getTime() / 1000)

class Device {
  constructor (index, props) {
    // logger.debug('construct device', index, props)
    const prefix = props.devicePrefix || DEFAULT_ID_PREFIX
    this.id = `${prefix}${(index + 1)}`

    this.state = {
      powerOn: false,
      rideId: null,
      latitude: props.latitude || 60.1696993,
      longitude: props.longitude || 24.9294322,
      battery: 100
    }

    this.gpsEmitter = null
  }

  async init () {
    logger.debug('device initialized', { id: this.id })

    this._ticker = setInterval(() => { this._tick() }, INTERVALS.tick)
  }

  async powerOn () {
    if (this.state.powerOn) return
    logger.info(`device ${this.id} powerOn`)

    const start = {
      latitude: this.state.latitude,
      longitude: this.state.longitude
    }
    const end = {
      latitude: this.state.latitude + (getRandom(1, 5) * 0.001),
      longitude: this.state.longitude + (getRandom(1, 5) * 0.001)
    }

    this._lastPowerOnTick = null
    this.state.rideId = uuidv4()
    this.state.battery = 100
    this.state.powerOn = true

    this.gpsEmitter = gpsSim(start, end, RIDE_SPEED)

    this.gpsEmitter.on('step', async ({ latitude, longitude }) => {
      this.state.latitude = latitude
      this.state.longitude = longitude

      this._reduceBattery(this.gpsEmitter.currentStep, this.gpsEmitter.totalSteps)
    })
    this.gpsEmitter.on('finished', async ({ latitude, longitude }) => {
      this.state.latitude = latitude
      this.state.longitude = longitude

      await this.powerOff()
    })

    await this._publishEvent('poweron')

    this.gpsEmitter.start()
  }

  async powerOff () {
    if (this.state.powerOn) {
      logger.info(`device ${this.id} powerOff`)

      this.state.powerOn = false
      await this._publishEvent('poweroff')

      this.state.rideId = null
      this.state.battery = 100

      this.gpsEmitter.removeAllListeners()
    }
  }

  async triggerAlarm () {
    if (!this.state.powerOn) {
      logger.info(`device ${this.id} triggerAlarm`)
      await this._publishEvent('alarm')
    }
  }

  async terminate () {
    await this.powerOff()
    clearInterval(this._ticker)
  }

  _reduceBattery (currentStep, totalSteps) {
    let reducer = 0
    const mod = (totalSteps % currentStep)
    if (mod < 5) reducer = mod
    else reducer = getRandom(1, 5) * 0.1
    this.state.battery = this.state.battery - reducer
    if (this.state.battery < 0) {
      if (currentStep < totalSteps) this.state.battery = 1
      else this.state.battery = 0
    }
  }

  async _tick () {
    this._lastTick = timestamp()
    // logger.debug(`${this.id} tick...`)

    if (this.state.powerOn) {
      if (!this._lastPowerOnTick) this._lastPowerOnTick = timestamp()

      // Should we update location?
      if ((this._lastTick - this._lastPowerOnTick) >= (INTERVALS.poweredOnUpdate / INTERVALS.tick)) {
        this._lastPowerOnTick = timestamp()
        await this._publishEvent('gps')
      }
    } else {
      if (!this._lastPowerOffTick) this._lastPowerOffTick = timestamp()

      // Should we update location?
      if ((this._lastTick - this._lastPowerOffTick) >= (INTERVALS.poweredOffUpdate / INTERVALS.tick)) {
        this._lastPowerOffTick = timestamp()
        await this._publishEvent('gps')
      }
    }
  }

  async _publishEvent (name) {
    const payload = {
      d: this.id,
      t: timestamp(),
      i: this.state.rideId,
      e: name,
      b: Math.round(this.state.battery),
      l: `${this.state.latitude},${this.state.longitude}`,
      p: this.state.powerOn ? 1 : 0
    }
    logger.debug('publish event', { payload })
    await publishPayload(payload)
  }
}

module.exports = Device
