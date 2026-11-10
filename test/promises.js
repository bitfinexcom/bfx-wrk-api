'use strict'

const { Api } = require('..')
const test = require('brittle')

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
const setup = () => {
  api = new ServiceApi()
  api.caller = { getCtx: () => { return true } }
}

test('handles callbacks', (t) => {
  t.plan(1)
  setup()

  api.handle('test', {
    action: 'asyncCb',
    args: ['53.1.34.21']
  }, (err, res) => {
    if (err) throw err

    t.is(res, '53.1.34.21')
  })
})

test('errors if callback called twice', (t) => {
  t.plan(1)
  setup()

  api.handle('test', {
    action: 'twoCallbacks',
    args: ['53.1.34.21']
  }, (err, res) => {
    if (err) throw err

    t.is(res, '53.1.34.21')
  })
})

test('it should handle empty msg', (t) => {
  t.plan(3)
  setup()

  api.handle('test', null, (err, res) => {
    t.is(res === null || res === undefined, true)
    t.is(err instanceof Error, true)
    t.is(err.message, 'ERR_API_ACTION_NOTFOUND')
  })
})
