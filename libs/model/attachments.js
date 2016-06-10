var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Tasks = require('./tasks');

var Attachments = new Schema({
		_id: {
			type: String,
			'default': shortid.generate
		},
		owner: {
			type: String,
			ref: 'User'
		},
		key: {
			type: String
		},
		target: {
			where: {
				type: String
			},
			id: {
				type: String
			}
		},
		created_at: {
			type: Date,
			default: Date.now
		}
});

module.exports = mongoose.model('Attachments', Attachments);
