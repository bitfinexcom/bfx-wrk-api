'use strict'

const async = require('async')
const Base = require('bfx-wrk-base')

class WrkApi extends Base {
  init () {
    super.init()

    this.setInitFacs([
      ['fac', 'grc', 'p0', 'bfx', () => {
        return this.getGrcConf()
      }],
      ['fac', 'api/api', 'bfx', 'bfx', () => {
        return this.getApiConf()
      }]
    ])
  }

  getGrcConf () {
    return {
      svc_port: this.ctx.apiPort || 0,
      services: []
    }
  }

  getApiConf () {
    return {
      path: null
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        ctx.grc_bfx = this.grc_bfx
        break
    }

    return ctx
  }

  _start (cb) {
    async.series([ next => { super._start(next) },
      next => {
        if (this.api_bfx) {
          this.grc_bfx.set('api', this.api_bfx.api)
        }

        next()
      }
    ], cb)
  }
}

module.exports = WrkApi
