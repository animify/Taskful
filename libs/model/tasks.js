var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Projects = require('./projects');

var Task = new Schema({
		_id: {
			type: String,
			trim: true
		},
		project: {
			type: String,
			ref: 'Projects'
		},
		parent: {
			type: String,
			default: null
		},
		assigned: {
			type: String
		},
		name: {
			type: String,
			trim: true
		},
		content: {
			type: String,
			default: null
		},
		status: {
			type: Boolean,
			default: false
		},
		archived: {
			type: Boolean,
			default: false
		},
		creator: {
			type: String,
			ref: 'User'
		},
		due_on: {
			type: Date
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

Task.pre('save', function(next) {
	var currentDate = new Date();
	this.modified_at = currentDate;
	next();
});

module.exports = mongoose.model('Task', Task);
