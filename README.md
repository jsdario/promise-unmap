
# promiseUnmap

[![CircleCI](https://circleci.com/gh/jsdario/promise-unmap.svg?style=svg)](https://circleci.com/gh/jsdario/promise-unmap)

Similar to [Promise.map(ary)](http://bluebirdjs.com/docs/api/promise.map.html) with some connotations:

1. If all promises resolve, the global promise resolves,
   that is identical.
2. All promises are going to be started, unmap won't

   fulfill until all of them resolve or reject.
3. If any promises reject, promiseUnmap will reject
   with an Error containing all errors in its body
   as `err.errors: Array<Error>`. The message of the global
   error will be: "One or more tasks failed". Any fulfillments
   will also be inside `err.fulfillments: Array<any>`
4. If it fulfills, it will resolve the map of fulfillments.

## Usage

Either `const {promiseUnmap} = require('promise-unmap')` or `import {promiseUnmap} from 'promise-unmap'`

It accepts an array of **promises** or **functions that return promises**.

```javascript
const {promiseUnmap} = require('../')

// ...

const ops = [
  async () => 'resolves 1',
  async () => { throw new Error('fails 2') },
  Promise.resolve('resolves 3'),
  async () => 'resolves 4',
  Promise.reject(new Error('fails 5')),
  async () => 'resolves 6',
]

promiseUnmap(ops)
  .catch(err => {
    expect(err.errors.length).to.equal(2)
    expect(err.fulfillments.length).to.equal(4)
  })
})
```

### promiseUnmapSerial

Chain calls, return all results, throw if any errors.

```javascript
it('should fail with mixed requests in serial', function(done) {
  promiseUnmapSerial(ops)
    .catch(err => {
      expect(err.errors.length).to.equal(2)
      expect(err.fulfillments.length).to.equal(4)
      done()
    })
})

t('should not fail if all are passing in serial', function(done) {
  promiseUnmapSerial(passingOps)
    .then(results => {
      expect(results.length).to.equal(2)
      done()
    })
    .catch(done)
})
```

## Implementation

It is pretty obscure, read with caution. Basically consists
on wrapping all promises with a safe catch, to later processing
the results.

It is written in typescript. A type `Future` is defined as a promise
or an async function (something that returns a promise). This way
we can warrantee that promises are not started until they are called.

```javascript
type Future = Promise | () => Promise
```

A `typeof` check is performed to know whether the future should
begin or it is an unfulfilled promise that we must await.

```javascript
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
```

The following method, `promiseUnmapSerial` has been defined to enqueue such futures,
to safely execute a number of asynchronous functions, without interfering one another
(or await serially for promises to finish, but for that we already have
[bluebird's `mapSeries`](http://bluebirdjs.com/docs/api/promise.mapseries.html))

```javascript
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
```
