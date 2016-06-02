var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Tasks = require('./tasks');

var Attachments = new Schema({
		_id: {
			type: String,
			trim: true
		},
		target: {
			type: String,
			ref: 'Tasks'
		},
		stories: [{
			text: {
				type: String,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			creator: {
				type: String,
				ref: 'User'
			},
			created_at: {
				type: Date,
				default: Date.now
			}
		}],
		created_at: {
			type: Date,
			default: Date.now
		}
});

module.exports = mongoose.model('Attachments', Attachments);
