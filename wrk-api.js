'use strict'

const async = require('async')
const Base = require('bfx-wrk-base')

class WrkApi extends Base {
  init () {
    super.init()

    this.setInitFacs([
      ['fac', 'bfx-facs-grc', 'p0', 'bfx', () => {
        return this.getGrcConf()
      }],
      ['fac', 'bfx-facs-api', 'bfx', 'bfx', () => {
        return this.getApiConf()
      }]
    ])
  }

  getGrcConf () {
    console.warn('[WARNING] this.getGrcConf is deprecated and gets removed soon')
    console.warn('[WARNING] set service names in your service config')
    console.warn('[WARNING] see https://github.com/bitfinexcom/bfx-util-net-js/pull/3 for an example')

    return {
      svc_port: this.ctx.apiPort || 0,
      services: this.getServices()
    }
  }

  getServices () {
    const group = this.group
    const conf = this.conf[group]

    if (conf && conf.services) {
      return conf.services
    }

    if (conf && Array.isArray(conf.services)) {
      return conf.services
    }

    return []
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
