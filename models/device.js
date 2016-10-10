var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    _v: false,
    device_id: {
        type: String,
        required: true,
        unique: true
    },
    epoch_times: [{
        _id: false,
        _v: false,
        type: Number,

    }]
})

module.exports = mongoose.model('device', deviceSchema);