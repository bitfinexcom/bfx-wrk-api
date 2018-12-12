'use strict'

const { Api } = require('..')
const assert = require('assert')

class ServiceApi extends Api {
  asyncCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  twoCallbacks (space, ip, cb) {
    cb(null, 'a')
    cb(null, 'b')
  }
}

let api
describe('callback handling', () => {
  beforeEach(function () {
    api = new ServiceApi()
    api.caller = { getCtx: () => { return true } }
  })

  it('handles callbacks', (done) => {
    api.handle('test', {
      action: 'asyncCb',
      args: [ '53.1.34.21' ]
    }, (err, res) => {
      if (err) throw err

      assert.equal(res, '53.1.34.21')
      done()
    })
  })

  it('errors if callback called twice', (done) => {
    api.handle('test', {
      action: 'twoCallbacks',
      args: [ '53.1.34.21' ]
    }, (err, res) => {
      if (err) throw err

      assert.equal(res, '53.1.34.21')
      done()
    })
  })
})
