const { BigQuery } = require('@google-cloud/bigquery')
const { getConfig } = require('./config')

const config = getConfig()

const bigquery = new BigQuery({
  projectId: config.BQ_PROJECT_ID
})

const methods = {}

methods.getTable = () => {
  return bigquery.dataset(config.BQ_DATASET_ID).table(config.BQ_TABLE_ID)
}

methods.insertRow = async (insertId, json) => {
  console.log(`insert row to '${config.BQ_PROJECT_ID}:${config.BQ_DATASET_ID}.${config.BQ_TABLE_ID}' with insertId ${insertId}`)
  const table = methods.getTable()
  await table.insert({
    insertId, json
  }, {
    raw: true
  })
}

methods.insertRows = async (rows) => {
  console.log(`insert rows to '${config.BQ_PROJECT_ID}:${config.BQ_DATASET_ID}.${config.BQ_TABLE_ID}'`)
  const table = methods.getTable()
  await table.insert(rows)
}

module.exports = {
  bigquery,
  methods
}
