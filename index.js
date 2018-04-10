
class ExtendableError extends Error {
  constructor (message) {
    super()
    this.message = message
    this.stack = new Error().stack
    this.name = this.constructor.name
  }
}

class PromiseUnmapError extends ExtendableError {
  constructor (results = [], message = 'One or more tasks failed') {
    super(message)
    this.fulfillments = results.filter(r => !(r instanceof Error))
    this.errors = results.filter(r => r instanceof Error)
  }
}

function promiseUnmap (promises) {
  return Promise.all(promises.map(p => p.catch(err => err)))
    .then(results => {
      if (results.some(r => r instanceof Error)) {
        throw new PromiseUnmapError(results)
      }
      return results
    })
}

module.exports = promiseUnmap
