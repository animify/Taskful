var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Tasks = require('./tasks');

var People = new Schema({
		_id: {
			type: String,
			trim: true
		},
		inviter: {
			type: String,
			ref: 'User'
		},
		invitee: {
			type: String,
			ref: 'User'
		},
		status: {
			type: Number,
			default: '0'
		},
		created_at: {
			type: Date,
			default: Date.now
		}
});

module.exports = mongoose.model('People', People);
