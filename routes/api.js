"use strict";
var express = require('express');
var moment = require('moment');
var router = express.Router();

var Device = require('../models/device');

// respond with a list of all device_id's
router.get('/devices', (req, res) => {
    getDevices((response) => {
        res.json(response);
    });
});

// respond with a list of all pings from :device_id on :date,
// if :device_id == 'all' then respond with a list of all pings from all device_id's on :date
router.get('/:device_id/:date', (req, res) => {
    let start = moment.utc(req.params.date, "YYYY-MM-DD", true).valueOf();
    let end = moment.utc(req.params.date, "YYYY-MM-DD", true).add(1, 'days').valueOf();
    getResponse(req.params.device_id, start, end, (response) => {
        response ? res.json(response) : res.sendStatus(400);
    })
});

// respond with a list of all pings from :device_id between :from and :to,
// if :device_id == 'all' then respond with a list of all pings from all device_id's between :from and :to
router.get('/:device_id/:from/:to', (req, res) => {
    let start = moment.utc(req.params.from, "YYYY-MM-DD", true).valueOf() ||
        moment.unix(req.params.from).valueOf();
    let end = moment.utc(req.params.to, "YYYY-MM-DD", true).add(1, 'days').valueOf() ||
        moment.unix(req.params.to).valueOf();
    getResponse(req.params.device_id, start, end, (response) => {
        response ? res.json(response) : res.sendStatus(400);
    })
});

// empty the database of all data
router.post('/clear_data', (req, res) => {
    Device.remove({}, () => {
        res.sendStatus(200);
    });
});

// add a ping for :epoch_time to the database,
// if :device_id not already in database create it then add the ping
router.post('/:device_id/:epoch_time', (req, res) => {
    let time = moment.unix(req.params.epoch_time).valueOf();
    if (!time) {
        res.statusCode(400);
    } else {
        postPing(req.params.device_id, time, () => {
            res.sendStatus(200);
        });
    }
});

// choose whether to get pings from all devices are pings from a single device
function getResponse(device_id, start, end, callback) {
    if (!start || !end) {
        callback();
    } else if (device_id == 'all') {
        getAllPings(start, end, (response) => {
            callback(response);
        })
    } else {
        getPings(device_id, start, end, (response) => {
            callback(response);
        })
    }
}

// get a list of all devices
function getDevices(callback) {
    Device.find({}, (err, devices) => {
        if (err) throw err;
        let response = [];
        for (let i = 0; i < devices.length; i++) {
            response.push(devices[i].device_id);
        }
        callback(response);
    });
}

// get a list of all the pings from device_id between start and end
function getPings(device_id, start, end, callback) {
    Device.findOne({'device_id': device_id}, (err, device) => {
        if (err) throw err;
        device ? callback(getPingsInRange(device, start, end)): callback([]);
    })
}

// for each device get a list of all pings between start and end and add it to a response object
function getAllPings(start, end, callback) {
    Device.find({}, (err, devices) => {
        if (err) throw err;
        let response = {};
        for (let i = 0; i < devices.length; i++) {
            response[devices[i].device_id] = getPingsInRange(devices[i], start, end);
        }
        callback(response);
    });
}

// get a list of pings from device between start and end
// NOTE: probably could be improved for better efficiency
function getPingsInRange(device, start, end) {
    let epoch_times = device.epoch_times.sort();
    let counter = 0;
    while (epoch_times[counter] && epoch_times[counter] < start) {
        counter++;
    }
    epoch_times.splice(0, counter);
    counter = 0;
    let len = epoch_times.length;
    while (epoch_times[len - counter - 1] && epoch_times[len - counter - 1] >= end) {
        counter++;
    }
    epoch_times.splice(len - counter, counter);
    return epoch_times;
}

// add a ping to a device, if device is not already in database create it first
function postPing(device_id, time, callback) {
    Device.findOne({'device_id': device_id}, (err, device) => {
        if (err) throw err;
        device ? addPing(device, time) : newDevice(device_id, time);
        callback()
    });
}

// create a new device in the database
function newDevice(device_id, epoch_time) {
    let device = new Device({
        'device_id': device_id,
        epoch_times: [epoch_time]
    });
    device.save((err) => {
        // if failed to create new device because of uniqueness failed,
        // just add a new ping to that device.
        // this only occurs when multiple posts to the server of the same,
        // new device are received at approximately the same time
        if (err && err.code == 11000) {
            Device.findOne({'device_id': device_id}, (err, duplicate) => {
                addPing(duplicate, epoch_time);
            })
        } else if (err) {
            throw err;
        }
    })
}

// add a ping to an existing device
function addPing(device, epoch_time) {
    device.epoch_times.push(epoch_time);
    device.save((err) => {
        if (err) throw err;
    });
}

module.exports = router;