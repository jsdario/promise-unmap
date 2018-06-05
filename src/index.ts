
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
  constructor (results: Array<any> = []) {
    super('One or more tasks failed')
    this.fulfillments = results.filter((r: any) => !(r instanceof Error))
    this.errors = results.filter((r: any) => r instanceof Error)
  }
}

export function promiseUnmap (futures: Array<Future>) {
  return Promise.all(futures.map(f => {
    return typeof f === 'function'
      ? f().catch((err: Error) => err)
      : f.catch((err: Error) => err)
  })).then((results: Array<any>) => {
    if (results.some(r => r instanceof Error)) {
      throw new PromiseUnmapError(results)
    }
    return results
  })
}


export async function promiseUnmapSerial (futures: Array<Future>) {
  let safePromises: Array<Promise<any>> = []

  for (const f of futures) {
    if (typeof f === 'function') {
      const p = await f().catch((err: Error) => err)
      safePromises = [...safePromises, Promise.resolve(p)]
    } else {
      safePromises = [...safePromises, f.catch((err: Error) => err)]
    }
  }

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
