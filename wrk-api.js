'use strict'

const async = require('async')
const Base = require('bfx-wrk-base')
const path = require('path')

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
    return {
      svc_port: this.ctx.apiPort || 0,
      services: this.getGrcServices()
    }
  }

  getGrcServices () {
    const group = this.group
    const conf = this.conf[group]

    if (conf && Array.isArray(conf.grcServices)) {
      return conf.grcServices
    }

    return null
  }

  getApiConf () {
    const wrk = path.basename(this.ctx.worker, '.js')
    const tmp = wrk.split('.')
    tmp.pop()
    tmp.shift()

    const inferred = tmp.join('.')
    return {
      path: inferred
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        ctx.grc_bfx = this.grc_bfx
        break
    }

    ctx.rootPath = this.ctx.root

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
