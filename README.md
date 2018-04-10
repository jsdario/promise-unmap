
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
   Here it is a playground: https://runkit.com/jsdario/promise-unmap

## Usage

Either `const {promiseUnmap} = require('promise-unmap')` or `ìmport {promiseUnmap} from 'promise-unmap'`

### From [test/test.js](test/test.js)

```
const bluebird = require('bluebird')
const {promiseUnmap} = require('../')
const chai = require('chai')

chai.should()
const expect = chai.expect

const ops = [
  async () => 'resolves 1',
  async () => { throw new Error('fails 2') },
  async () => 'resolves 3',
  async () => 'resolves 4',
  async () => { throw new Error('fails 5') },
  async () => 'resolves 6',
]

const passingOps = [async () => 'resolves', async () => 'resolves']

describe('promiseUnmap', function() {
  it('should fail with mixed requests', function(done) {
    promiseUnmap(ops.map(o => o()))
      .catch(err => {
        expect(err.errors.length).to.equal(2)
        expect(err.fulfillments.length).to.equal(4)
        done()
      })
  })

  it('should not fail if all are passing', function(done) {
    promiseUnmap(passingOps.map(o => o()))
      .then(results => {
        expect(results.length).to.equal(2)
        done()
      })
      .catch(done)
  })
})
```

### promiseUnmapSerial

Chain calls, return all results, throw if any errors.

```
it('should fail with mixed requests in serial', function(done) {
  promiseUnmapSerial(ops.map(o => o()))
    .catch(err => {
      expect(err.errors.length).to.equal(2)
      expect(err.fulfillments.length).to.equal(4)
      done()
    })
})

t('should not fail if all are passing in serial', function(done) {
  promiseUnmapSerial(passingOps.map(o => o()))
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

```javascript
function promiseUnmap (promises: Array<Promise>) {
  return Promise.all(promises.map(p => p.catch(err => err)))
    .then(results => {
      if (results.some(r => r instanceof Error)) {
        throw new PromiseUnmapError(results)
      }
      return results
    })
}
```

```javascript
function promiseUnmapSerial (promises) {
  const safePromises = promises.map(p => p.catch(err => err))

  return safePromises.reduce((accPromises, currPromise) =>
    accPromises.then(accResults => 
      currPromise.then(currResult => [...accResults, currResult])
    )
  , Promise.resolve([]))
    .then(results => {
      if (results.some(r => r instanceof Error)) {
        return Promise.reject(new PromiseUnmapError(results))
      }
      return results
    })
}
```

