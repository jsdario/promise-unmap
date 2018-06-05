
import * as Promise from 'bluebird'

type Future = Promise<any> | (() => Promise<any>)

class ExtendableError extends Error {
  constructor (message: string) {
    super()
    this.message = message
    this.stack = new Error().stack
    this.name = this.constructor.name
  }
}

class PromiseUnmapError extends ExtendableError {
  fulfillments: Array<any>
  errors: Array<Error>
  constructor (results: Array<any> = [], message = 'One or more tasks failed') {
    super(message)
    this.fulfillments = results.filter((r: any) => !(r instanceof Error))
    this.errors = results.filter((r: any) => r instanceof Error)
  }
}

export function promiseUnmap (promises: Array<Future>) {
  return Promise.all(promises.map(p => {
    return typeof p === 'function'
      ? p().catch((err: Error) => err)
      : p.catch((err: Error) => err)
  })).then((results: Array<any>) => {
    if (results.some(r => r instanceof Error)) {
      throw new PromiseUnmapError(results)
    }
    return results
  })
}


export function promiseUnmapSerial (futures: Array<Future>) {
  const safePromises = futures.map(f => {
    const p = typeof f === 'function' ? f() : f
    return p.catch(err => err)
  })

  return safePromises.reduce((accPromises, currPromise) =>
    accPromises.then(accResults => 
      currPromise.then(currResult => [...accResults, currResult])
    )
  , Promise.resolve([]))
    .then(results => {
      if (results.some((r: any) => r instanceof Error)) {
        return Promise.reject(new PromiseUnmapError(results))
      }
      return results
    })
}
