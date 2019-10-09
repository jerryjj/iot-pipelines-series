const logger = require('./logger')
const { PubSub } = require('@google-cloud/pubsub')

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
const SECRET_KEY_PATH = process.env.CREDENTIALS_FILE || '../secrets/ps-secret-key.json'
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC ? process.env.PUBSUB_TOPIC : 'device-signals'

const pubsub = new PubSub({
  projectId: GCP_PROJECT_ID,
  keyFilename: SECRET_KEY_PATH
})

exports.publishPayload = async (payload) => {
  const dataBuffer = Buffer.from(JSON.stringify(payload))

  if (!process.env.SKIP_PUBSUB) {
    const messageId = await pubsub.topic(PUBSUB_TOPIC).publish(dataBuffer)
    logger.debug(`message ${messageId} published`)
  } else {
    logger.debug(`skipping real pub/sub publish`)
  }
}
