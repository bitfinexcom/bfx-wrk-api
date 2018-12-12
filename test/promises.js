/* eslint-env mocha */

'use strict'

const { Api } = require('..')
const assert = require('assert')

class ServiceApi extends Api {
  asyncCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  async asyncWithCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  async asyncWithCbThrows (space, ip, cb) {
    try {
      throw new Error('boom')
    } catch (e) {
      return cb(e)
    }
  }

  async asyncWithoutCbNoPrefix (space, ip) {
    function networkRequest () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('a')
        }, 200)
      })
    }

    const res = await networkRequest()
    return res
  }

  async aPrmAsyncWithoutCb (space, ip) {
    function networkRequest () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('prm_a')
        }, 200)
      })
    }

    const res = await networkRequest()
    return res
  }

  async aPrmAsyncWithCbAsserts (space, ip, cb) {
    try {
      cb()
    } catch (e) {
      return [ip, e]
    }
  }

  parseDocs (a) {
    throw new Error('tricky')
  }

  async aPrmAsyncWithCbThrows (space, ip) {
    const res = this.parseDocs()

    return res
  }

  twoCallbacks (space, cb) {
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
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('callback called twice returns first value', (done) => {
    api.handle('test', {
      action: 'twoCallbacks',
      args: []
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('async/await functions with callbacks', (done) => {
    api.handle('test', {
      action: 'asyncWithCb',
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('async/await functions using cb throws', (done) => {
    api.handle('test', {
      action: 'asyncWithCbThrows',
      args: [ 'a' ]
    }, (err, res) => {
      assert.strictEqual(err.message, 'ERR_API_BASE: boom')
      done()
    })
  })

  it('pure async/await functions cant use callbacks', (done) => {
    api.handle('test', {
      action: 'asyncWithoutCbNoPrefix',
      args: [ 'a' ]
    }, (_err, res) => {})

    setTimeout(done, 1000)
  })

  it('pure async/await functions must be prefixed by aPrm', (done) => {
    api.handle('test', {
      action: 'aPrmAsyncWithoutCb',
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'prm_a')
      done()
    })
  })

  it('pure async/await functions prefixed by aPrm do not have callback support', (done) => {
    api.handle('test', {
      action: 'aPrmAsyncWithCbAsserts',
      args: [ 'pineapple' ]
    }, (err, asserts) => {
      if (err) throw err

      const [res, e] = asserts
      assert.strictEqual(res, 'pineapple')
      assert.strictEqual(e.message, 'cb is not a function')
      done()
    })
  })

  it('pure async/await functions prefixed by aPrm throws', (done) => {
    api.handle('test', {
      action: 'aPrmAsyncWithCbThrows',
      args: [ 'pineapple' ]
    }, (err, asserts) => {
      assert.ok(err)

      done()
    })
  })
})
