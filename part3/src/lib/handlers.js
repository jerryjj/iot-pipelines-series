const { parseMessage } = require('./message')
const bq = require('./bq')

exports.pubSubToBigQueryHandler = async (event, context, transformer) => {
  const content = parseMessage(event, context)
  const transformed = transformer(context.eventId, content)

  if (!transformed) return transformed

  try {
    await bq.methods.insertRow(context.eventId, transformed)
  } catch (error) {
    console.error('error inserting row to BigQuery', error)

    if (error.response && error.response.insertErrors) {
      error.response.insertErrors.forEach((err) => {
        const reason = err.errors[0].message
        console.error(`insert failed for row ${err.index}: ${reason}`, { errors: err.errors })
      })
    }

    throw error
  }

  return transformed
}
