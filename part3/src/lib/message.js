
exports.parseMessage = (event, context) => {
  let content = {}
  try {
    const message = event || context.message // for local testing support
    const data = message.data
    // console.log('parse data', data)
    content = JSON.parse(Buffer.from(data, 'base64').toString())
  } catch (error) {
    console.error('error parsing JSON message', { error })
    throw error
  }
  // console.log('content', content)

  return content
}
