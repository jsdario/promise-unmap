const bluebird = require('bluebird')
const promiseUnmap = require('../')
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