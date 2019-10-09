/**
 * A transforms incoming device signal event to BQ schema event
 * @param {string} inJson
 * @return {string} outJson
 */
function transformDeviceSignalEvent(inJson) {
  var original = JSON.parse(inJson)

  var now = new Date()

  var locationParts = original.l.split(',')

  var transformed = {
    timestamp: new Date(original.t * 1000),
    processing_timestamp: now,
    event_name: original.e,
    device_id: original.d,
    ride_id: original.i,
    battery_percentage: original.b,
    latitude: parseFloat(locationParts[0]) || 0.0,
    longitude: parseFloat(locationParts[1]) || 0.0,
    power_on_status: Boolean(original.p)
  }

  return JSON.stringify(transformed)
}
