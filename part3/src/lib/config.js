const REQUIRED_CONFIG_KEYS = [
  'BQ_PROJECT_ID', 'BQ_DATASET_ID', 'BQ_TABLE_ID'
]
let CONFIG = null

exports.getConfig = () => {
  if (CONFIG) return CONFIG

  CONFIG = {}
  REQUIRED_CONFIG_KEYS.map((key) => {
    if (!process.env[key]) {
      throw new Error(`missing required environment variable ${key}!`)
    }
    CONFIG[key] = process.env[key]
  })

  return CONFIG
}
