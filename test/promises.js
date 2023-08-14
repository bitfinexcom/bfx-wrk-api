'use strict'

/* eslint-env mocha */

const { Api } = require('..')
const _ = require('lodash')
const assert = require('assert')

class ServiceApi extends Api {
  asyncCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  twoCallbacks (space, ip, cb) {
    cb(null, ip)
    cb(null, ip)
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
      args: ['53.1.34.21']
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, '53.1.34.21')
      done()
    })
  })

  it('errors if callback called twice', (done) => {
    api.handle('test', {
      action: 'twoCallbacks',
      args: ['53.1.34.21']
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, '53.1.34.21')
      done()
    })
  })

  it('it should handle empty msg', (done) => {
    api.handle('test', null, (err, res) => {
      assert.strictEqual(_.isNil(res), true)
      assert.strictEqual(err instanceof Error, true)
      assert.strictEqual(err.message, 'ERR_API_ACTION_NOTFOUND')
      done()
    })
  })
})
