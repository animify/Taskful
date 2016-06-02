var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Tasks = require('./tasks');
var Attachments = require('./attachments');

var Story = new Schema({
		_id: {
			type: String,
			'default': shortid.generate
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
			attachment: {
				type: String,
				ref: 'Attachments'
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

module.exports = mongoose.model('Story', Story);
