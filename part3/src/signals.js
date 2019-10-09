const { pubSubToBigQueryHandler } = require('./lib/handlers')

const transformer = (id, original) => {
  const now = new Date()

  const locationParts = original.l.split(',')

  const transformed = {
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

  return transformed
}

exports.handler = async (event, context) => {
  // console.log('orig event', event)
  // console.log('orig context', context)
  await pubSubToBigQueryHandler(event, context, transformer)
  return 'location message processed'
}
