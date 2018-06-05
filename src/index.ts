
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
  const fulfilled = futures
    .reduce(
      (accPromises, currPromise) => {
        const acc = typeof accPromises === 'function' ? accPromises() : accPromises
        return acc.then((accResults: Array<any>) => {
          const p =
            typeof currPromise === 'function' ? currPromise() : currPromise

          return p
            .then((currResult: any) => [...accResults, currResult])
            .catch((err: Error) => [...accResults, err])
        })
      }, Promise.resolve()
    )

    const promises = typeof fulfilled === 'function' ? fulfilled() : fulfilled
    
    return promises.then((results: any) => {
      if (results.some((r: any) => r instanceof Error)) {
        return Promise.reject(new PromiseUnmapError(results))
      }
      return results
    })
}
