#!/usr/bin/env node
const munin = require('munin-plugin');
const rp = require('request-promise');
const task = require('promise-util-task');

const SYNC = "/sync"
const STATUS = "/status"
const ESTIMATEFEE = "/utils/estimatefee"

const get = (base_url, method, params) =>
    rp({uri:base_url + method, qs: params, timeout:5000, method: 'GET', transform: (res) => JSON.parse(res)})

const arg = () => {
    return {
        BASE_URL: process.env['BASE_URL'] || 'https://insight.bitpay.com/api',
    }
}

const initialize = () => {
    global.Promise = require('bluebird')
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const finalize = (list) => {
    return munin.create(list);
}

const main = (arg) => {
    initialize();

    const sync = (params) => get(arg.BASE_URL, SYNC, params || {})
    const status = (params) => get(arg.BASE_URL, STATUS, params || {})
    const estimatefee = (params) => get(arg.BASE_URL, ESTIMATEFEE, params || {})
    const beginTime = process.uptime()

    return task.seq([
        () => sync().then(sync => {
            const g = new munin.Graph('insight sync height','height','insight');
            g.add(new munin.Model.Default('bitcoin').setValue(sync.height));
            return g;
        }),
        () => estimatefee({nbBlocks:2}).then(fee => {
            const g = new munin.Graph('insight network estimatefee','satoshi','insight');
            g.add(new munin.Model.Default('fee').setValue(Math.round(fee['2'] * 1e8)));
            return g;
        }),
        () => status({q:"getDifficulty"}).then(status => {
            const g = new munin.Graph('insight network difficulty','difficulty','insight');
            g.setScale(true);
            g.add(new munin.Model.Default('bitcoin').setValue(status.difficulty));
            return g;
        })
    ]).then(list => {
        const t = (resp_time) => {
            const g = new munin.Graph('insight response','sec','insight');
            g.add(new munin.Model.Default('response').setValue(resp_time));
            return g
        }
        return finalize(list.concat(t(process.uptime() - beginTime)))
    })
}

main(arg())

