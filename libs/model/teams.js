var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var User = require('./user');

var Team = new Schema({
		_id: {
			type: String
		},
		color: {
			type: String
		},
		name: {
			type: String,
			required: true,
			trim: true
		},
		creator: {
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
		userlist: {
			type: Array,
			ref: 'User'
		}
});

Team.pre('save', function(next) {
	var currentDate = new Date();
	this.modified_at = currentDate;
	next();
});

module.exports = mongoose.model('Team', Team);
