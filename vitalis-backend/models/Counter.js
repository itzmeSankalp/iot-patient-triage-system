// vitalis-backend/models/Counter.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 } // Start patient IDs from 1001
});

module.exports = mongoose.model('Counter', counterSchema);