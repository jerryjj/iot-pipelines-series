// const logger = require('./logger')
const EventEmitter = require('events')

const KM_IN_DEGREE = 110.562
const DEFAULT_INTERVAL = 1000
const DEFAULT_SPEED = 10

class MoveEmitter extends EventEmitter {}

module.exports = (start, end, speed, interval) => {
  speed = (speed || DEFAULT_SPEED) / 3600
  interval = interval || DEFAULT_INTERVAL
  const emitter = new MoveEmitter()

  const currentPos = {
    latitude: start.latitude,
    longitude: start.longitude
  }
  const rate = { latitude: 0, longitude: 0 }
  const deltaLat = (end.latitude - start.latitude) * KM_IN_DEGREE
  const deltaLon = (end.longitude - start.longitude) * KM_IN_DEGREE
  const deltaDist = Math.sqrt((deltaLat * deltaLat) + (deltaLon * deltaLon))
  const deltaSeconds = Math.floor(deltaDist / speed)
  const numSteps = deltaSeconds
  let currentStep = 0

  rate.latitude = deltaLat / deltaSeconds / KM_IN_DEGREE
  rate.longitude = deltaLon / deltaSeconds / KM_IN_DEGREE

  // logger.debug('gpsSim', {
  //   start,
  //   end,
  //   speed,
  //   deltaLat,
  //   deltaLon,
  //   deltaDist,
  //   rate,
  //   numSteps,
  //   currentPos
  // })

  const step = () => {
    currentStep++
    // logger.debug('gpsSim:step', {
    //   currentStep
    // })
    if (currentStep < numSteps) {
      currentPos.latitude += rate.latitude
      currentPos.longitude += rate.longitude
      emitter.currentStep = currentStep
      emitter.emit('step', currentPos)
      setTimeout(step, interval)
    } else {
      emitter.emit('finished', currentPos)
    }
  }

  emitter.start = () => {
    setTimeout(step, interval)
  }

  emitter.totalSteps = numSteps

  return emitter
}
