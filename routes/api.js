var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');

var Device = require('../models/device');

router.get('/devices', function (req, res) {
    getDevices(function (response) {
        res.json(response);
    });
});

router.get('/:device_id/:date', function (req, res) {
    var start = getStartEpoch(req.params.date);
    var end = getEndEpoch(req.params.date);
    getTimes(req.params.device_id, start, end, function (response) {
        if (response) {
            res.json(response);
        } else {
            res.sendStatus(400);
        }
    })
});

router.get('/:device_id/:from/:to', function (req, res) {
    var start = getEpoch(req.params.from);
    var end = getEpoch(req.params.to);
    getTimes(req.params.device_id, start, end, function (response) {
        if (response) {
            res.json(response);
        } else {
            res.sendStatus(400);
        }
    })
});

router.post('/clear_data', function (req, res) {
    Device.remove({}, function () {
        res.sendStatus(200);
    });
});

router.post('/:device_id/:epoch_time', function (req, res) {
    var time = moment.unix(req.params.epoch_time).valueOf();
    if (!time) {
        res.statusCode(400);
    } else {
        addPing(req.params.device_id, time, function () {
            res.sendStatus(200);
        });
    }
});

function getTimes(device_id, start, end, callback) {
    if (!start || !end) {
        callback(null);
    } else if (device_id == 'all') {
        getAllTimes(start, end, function (response) {
            callback(response);
        })
    } else {
        getSpecificTime(device_id, start, end, function (response) {
            callback(response);
        })
    }
}

function getDevices(callback) {
    Device.find({}, function (err, devices) {
        if (err) throw err;
        var response = [];
        for (var i = 0; i < devices.length; i++) {
            response.push(devices[i].device_id);
        }
        callback(response);
    });
}

function getStartEpoch(date) {
    return moment.utc(date, "YYYY-MM-DD", true).valueOf();
}

function getEndEpoch(date) {
    return moment.utc(date, "YYYY-MM-DD", true).add(1, 'days').valueOf();
}

function getEpoch(time) {
    return moment.utc(time, "YYYY-MM-DD", true).valueOf() || moment.unix(time).valueOf();
}

function getSpecificTime(device_id, start, end, callback) {
    Device.findOne({'device_id': device_id}, function (err, device) {
        if (err) throw err;
        if (!device) {
            callback([]);
        } else {
            callback(getDeviceTimes(device, start, end));
        }
    })
}

function getAllTimes(start, end, callback) {
    Device.find({}, function (err, devices) {
        if (err) throw err;
        var response = {};
        for (var i = 0; i < devices.length; i++) {
            response[devices[i].device_id] = getDeviceTimes(devices[i], start, end);
        }
        callback(response);
    });
}

function getDeviceTimes(device, from, to) {
    var epoch_times = device.epoch_times.sort();
    var counter = 0;
    while (epoch_times[counter] && epoch_times[counter] < from) {
        counter++;
    }
    epoch_times.splice(0, counter);
    counter = 0;
    var len = epoch_times.length;
    while (epoch_times[len - counter - 1] && epoch_times[len - counter - 1] >= to) {
        counter++;
    }
    epoch_times.splice(len - counter, counter);
    return epoch_times;
}


function addPing(device_id, time, callback) {
    Device.findOne({'device_id': device_id}, function (err, device) {
        if (err) throw err;
        if (device) {
            addEpochTime(device, time);
        } else {
            createNewDevice(device_id, time);
        }
        callback()
    });
}

function createNewDevice(device_id, epoch_time) {
    var device = new Device({
        'device_id': device_id,
        epoch_times: [epoch_time]
    });
    device.save(function (err) {
        if (err && err.code == 11000) {
            Device.findOne({'device_id': device_id}, function (err, duplicate) {
                addEpochTime(duplicate, epoch_time);
            })
        }
    })
}

function addEpochTime(device, epoch_time) {
    device.epoch_times.push(epoch_time);
    device.save(function (err) {
        if (err) throw err;
    });
}

module.exports = router;