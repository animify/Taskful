var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');

var Workspace = new Schema({
		_id: {
			type: String
		}
		name: {
			type: String,
			required: true,
			trim: true
		},
		domain: {
			type: String,
			trim: true
		},
		creator: {
			type: String,
			ref: 'User'
		},
		members: {
			type: Array,
			ref: 'User'
		},
		created_at: {
			type: Date,
			default: Date.now
		},
		modified_at: {
			type: Date,
			default: Date.now
		}
});

Workspace.pre('save', function(next) {
	var currentDate = new Date();
	this.modified_at = currentDate;
	next();
});

module.exports = mongoose.model('Workspace', Workspace);
