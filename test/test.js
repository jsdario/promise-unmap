const {promiseUnmap, promiseUnmapSerial} = require('../lib')
const chai = require('chai')

chai.should()
const expect = chai.expect

const ops = [
  async () => 'resolves 1',
  async () => { throw new Error('fails 2') },
  Promise.resolve('resolves 3'),
  async () => 'resolves 4',
  () => Promise.reject(new Error('fails 5')),
  async () => 'resolves 6',
]

const passingOps = [
  async () => 'resolves',
  Promise.resolve('resolves'),
]

describe('promiseUnmap', function() {
  it('should fail with mixed requests', function(done) {
    promiseUnmap(ops)
      .catch(err => {
        expect(err.errors.length).to.equal(2)
        expect(err.fulfillments.length).to.equal(4)
        done()
      })
  })

  it('should not fail if all are passing', function(done) {
    promiseUnmap(passingOps)
      .then(results => {
        expect(results.length).to.equal(2)
        done()
      })
      .catch(done)
  })

  it('should fail with mixed requests in serial', function(done) {
    promiseUnmapSerial(ops)
      .catch(err => {
        expect(err.errors.length).to.equal(2)
        expect(err.fulfillments.length).to.equal(4)
        done()
      })
  })

  it('should not fail if all are passing in serial', function(done) {
    promiseUnmapSerial(passingOps)
      .then(results => {
        expect(results.length).to.equal(2)
        done()
      })
      .catch(done)
  })

  it('should begin all tasks immediately w/ promiseUnmap', function(done) {
    let startedOps = 0
    const postponedOps = [
      createPostponedFuture(100, () => { startedOps = startedOps + 1 }),
      createPostponedFuture(200, () => { startedOps = startedOps + 1 }),
      createPostponedFuture(300, () => { startedOps = startedOps + 1 }),
    ]

    promiseUnmap(postponedOps)
      .then(results => {
        expect(startedOps).to.equal(3)
        done()
      })
      .catch(done)
      setTimeout(() => expect(startedOps).to.equal(3), 50)
  })

  it('should not begin a task until a previous task has finished w/ promiseUnmapSerial', function(done) {
    let startedOps = 0
    const postponedOps = [
      createPostponedFuture(100, () => { startedOps = startedOps + 1 }),
      createPostponedFuture(200, () => { startedOps = startedOps + 1 }),
      createPostponedFuture(300, () => { startedOps = startedOps + 1 }),
    ]

    promiseUnmapSerial(postponedOps)
      .then(results => {
        expect(startedOps).to.equal(3)
        done()
      })
      .catch(done)
      expect(startedOps).to.equal(1)
  })
})

function createPostponedFuture (timeoutInMs, onStart = () => {}) {
  return function () {
    onStart()
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeoutInMs)
    })
  }
}
