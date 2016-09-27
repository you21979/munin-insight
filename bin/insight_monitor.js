#!/usr/bin/env node
const munin = require('munin-plugin');
const rp = require('request-promise');
const task = require('promise-util-task');

const SYNC = "/sync"
const STATUS = "/status"
const ESTIMATEFEE = "/utils/estimatefee"

const get = (base_url, method, params) => rp({uri:base_url + method, qs: params, timeout:5000, method: 'GET', transform : (res) => JSON.parse(res)})

const arg = () => {
    return {
        BASE_URL : process.env['BASE_URL'] || 'https://insight.bitpay.com/api',
    }
}

const initialize = () => {
    global.Promise = require('bluebird')
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const finalize = (list, resp_time) => {
    const a = (sync) => {
        const g = new munin.Graph('insight sync height','height','insight');
        g.add(new munin.Model.Default('bitcoin').setValue(sync.height));
        return g;
    }
    const b = (fee) => {
        const g = new munin.Graph('insight network estimatefee','satoshi','insight');
        g.add(new munin.Model.Default('fee').setValue(Math.round(fee['2'] * 1e8)));
        return g;
    }
    const c = (status) => {
        const g = new munin.Graph('insight network difficulty','difficulty','insight');
        g.setScale(true);
        g.add(new munin.Model.Default('bitcoin').setValue(status.difficulty));
        return g;
    }
    const d = (resp_time) => {
        const g = new munin.Graph('insight response','sec','insight');
        g.add(new munin.Model.Default('response').setValue(resp_time));
        return g;
    }
    return munin.create([a(list[0]), b(list[1]), c(list[2]), d(resp_time)]);
}

const main = (arg) => {
    initialize();

    const sync = (params) => get(arg.BASE_URL, SYNC, params || {})
    const status = (params) => get(arg.BASE_URL, STATUS, params || {})
    const estimatefee = (params) => get(arg.BASE_URL, ESTIMATEFEE, params || {})
    const beginTime = process.uptime()

    return task.seq([
        () => sync(),
        () => estimatefee({nbBlocks:2}),
        () => status({q:"getDifficulty"})
    ]).then(list => {
        finalize(list, process.uptime() - beginTime)
    })
}

main(arg())
