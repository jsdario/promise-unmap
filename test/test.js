const {promiseUnmap, promiseUnmapSerial} = require('../lib')
const Promise = require('bluebird')
const chai = require('chai')

chai.should()
const expect = chai.expect

const ops = [
  async () => 'resolves 1',
  async () => { throw new Error('fails 2') },
  Promise.resolve(),
  async () => 'resolves 4',
  Promise.reject(new Error('fails 5')),
  async () => 'resolves 6',
]

const passingOps = [async () => 'resolves', async () => 'resolves']


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
})
