'use strict'

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
    args.unshift(this._space(service, msg))
    args = args.concat((err, res) => {
      if (isExecuted) return
      // if (err) console.error(err, service, msg)
      cb(_.isError(err) ? new Error(`ERR_API_BASE: ${err.message}`) : err, res)
    })

    const method = this[action]
    const argCount = method.length
    if (args.length !== argCount) {
      return cb(new Error(`ERR_API_BASE: WRONG ARG COUNT`))
    }

    try {
      method.apply(this, args)
    } catch (e) {
      isExecuted = true
      console.error(e)
      cb(new Error(`ERR_API_ACTION: ${e.message}`))
    }
  }
}

module.exports = Api
