var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');
var Team = require('./teams');

var Projects = new Schema({
		_id: {
			type: String
		},
		name: {
			type: String,
			required: true,
			trim: true
		},
		owner: {
			type: String,
			ref: 'User'
		},
		created_at: {
			type: Date,
			default: Date.now
		},
		modified_at: {
			type: Date,
			default: Date.now
		},
		team: {
			type: String,
			ref: 'Team'
		},
		status: {
			type: Number,
			default: '0'
		},
		public: {
			type: Boolean,
			default: false
		},
		archived: {
			type: Boolean,
			default: false
		}
});

Projects.pre('save', function(next) {
	var currentDate = new Date();
	this.modified_at = currentDate;
	next();
});

module.exports = mongoose.model('Projects', Projects);
