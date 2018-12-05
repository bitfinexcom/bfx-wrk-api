'use strict'

const fs = require('fs')
const _ = require('lodash')

class Api {
  constructor (caller, opts = {}) {
    this.caller = caller
    this.opts = opts

    this.init()
  }

  init () {}

  _space (service, msg) {
    return {
      service: service,
      svp: service.split(':')
    }
  }

  isCtxReady () {
    return !!this.ctx
  }

  clearCtx () {
    this.ctx = null
  }

  loadAcl () {
    if (this.acl) {
      return
    }

    const rootPath = this.ctx.rootPath

    let acl = null
    try {
      acl = JSON.parse(fs.readFileSync(`${rootPath}/sec/acl.json`))
      if (!_.isObject(acl)) {
        acl = null
      }
    } catch (err) {
      console.error(err)
    }

    this.acl = acl
  }

  checkAcl (fingerprint, action, args) {
    if (!this.acl) {
      return false
    }

    let acl = this.acl

    if (acl['*']) {
      return true
    }

    if (!_.isObject(acl) || !acl[fingerprint]) {
      return false
    }

    acl = acl[fingerprint]

    if (acl['*']) {
      return true
    }

    if (!_.isObject(acl) || !acl[action]) {
      return false
    }

    return true
  }

  auth (auth, action, args) {
    if (!auth) {
      return false
    }

    this.loadAcl()

    const valid = this.checkAcl(auth.fingerprint, action, args)

    const rootPath = this.ctx.rootPath

    fs.appendFileSync(`${rootPath}/sec/acl.log`, `${auth.fingerprint}|${action}\n`)

    return valid
  }

  getStreamHandler (action) {
    if (!action) return false

    if (!action || _.startsWith(action, '_') || !this[action]) {
      return false
    }

    if (!_.endsWith(action, 'Stream')) {
      return false
    }

    return action
  }

  handleStream (service, action, req, res, meta, cb) {
    if (!this.ctx) {
      this.ctx = this.caller.getCtx()
    }

    const { args, _isSecure, _auth } = meta
    if (!this.isCtxReady()) {
      return cb(new Error('ERR_API_READY'))
    }

    if (_isSecure && !this.auth(_auth, action, args)) {
      return cb(new Error('ERR_API_AUTH'))
    }

    const space = this._space(service, null)
    const method = this[action]
    method.call(this, space, req, res, meta, cb)
  }

  handle (service, msg, cb) {
    if (!this.ctx) {
      this.ctx = this.caller.getCtx()
    }

    if (!this.isCtxReady()) {
      return cb(new Error('ERR_API_READY'))
    }

    const action = msg.action
    if (!action || _.startsWith(action, '_') || !this[action]) {
      return cb(new Error('ERR_API_ACTION_NOTFOUND'))
    }

    if (!_.isFunction(cb)) {
      return cb(new Error('ERR_API_CB_INVALID'))
    }

    let isExecuted = false

    let args = _.isArray(msg.args) ? msg.args : []

    if (msg._isSecure && !this.auth(msg._auth, action, args)) {
      return cb(new Error('ERR_API_AUTH'))
    }

    args.unshift(this._space(service, msg))
    args = args.concat((err, res) => {
      if (isExecuted) {
        return
      }
      cb(_.isError(err) ? new Error(`ERR_API_BASE: ${err.message}`) : err, res)

      isExecuted = true
    })

    const method = this[action]

    try {
      const promise = method.apply(this, args)

      if (promise instanceof Promise) {
        promise
          .then(res => args[args.length - 1](null, res))
          .catch(err => args[args.length - 1](err))
      }
    } catch (e) {
      isExecuted = true
      console.error(e)
      cb(new Error(`ERR_API_ACTION: ${e.message}`))
    }
  }
}

module.exports = Api
