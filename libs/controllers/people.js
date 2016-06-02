var libs = process.cwd() + '/libs/';
var Team = require('../model/teams');
var User = require('../model/user');
var People = require('../model/people');
var Task = require('../model/tasks');
var mongoose = require('mongoose');
var validate = require('./validate');
var log = require(libs + 'log')(module);

var io = global.socketIO;

exports.invite = function(req, res, callback) {
	req.sanitizeBody();
	req.checkBody({
		'email' :{
			notEmpty: true,
			isEmail: {
				errorMessage: 'That isnt a valid email address'
			}
		}
	});
	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}  else {
		User.findOne({'email': req.body.email}, function (err, found){
			if (found) {
				if (found._id == req.user._id) {
					return callback('500', 'You are already a member of this team');
				} else {
					People.findOne({$or:[{ inviter: req.user._id, invitee: found._id }, { inviter: found._id, invitee: req.user._id } ]}, function (err, relation) {
						if (!relation) {

							var people = new People ({
								inviter: req.user._id,
								invitee: found._id
							});

							people.save(function(err) {
								if (!err) {
									return callback(null, 'Invite sent!');
								} else {
									return callback('400', 'Validation error');
								}
							});
						} else {
							return callback('500', 'Duplicate relationship');
						}
					});
				}
			} else {
				return callback('500', 'Could not invite the user with that email address');
			}
		});
	}

}
exports.findPending = function(req, res, callback) {
	People.find({inviter:req.user._id, status: 0})
	.populate('inviter', 'username fullname email ')
	.populate('invitee', 'username fullname email ')
	.exec(function (err, pending) {
		if (err)
			return callback('500', 'Server error');

		if (pending.length) {
			return callback(null, pending);
		} else {
			return callback('201', '0');
		}
	});
}
exports.findRequests = function(req, res, callback) {
	People.find({invitee:req.user._id, status: 0})
	.populate('inviter', 'username fullname email')
	.populate('invitee', 'username fullname email')
	.exec(function (err, requests) {
		if (err)
			return callback('500', 'Server error');

		if (requests.length) {
			return callback(null, requests);
		} else {
			return callback('201', '0');
		}
	});
}
exports.findFriends = function(req, res, callback) {
	People.find({$or:[{inviter:req.user._id}, {invitee:req.user._id}], status : 1})
	.populate('inviter', 'username fullname email')
	.populate('invitee', 'username fullname email')
	.exec(function (err, friends) {
		if (err)
			return callback('500', 'Server error');

		if (friends.length) {
			return callback(null, friends);
		} else {
			return callback('201', '0');
		}
	});
}

exports.acceptInvite = function(req, res, callback) {
	People.findOneAndUpdate({_id:req.params.id, invitee:req.user._id}, { $set: {status: 1}}, {new:true})
	.populate('inviter', 'username fullname email')
	.populate('invitee', 'username fullname email')
	.exec(function (err, friend) {
		if (err)
			return callback('500', 'Server error');

		if (friend) {
			return callback(null, friend);
		} else {
			return callback('201', '0');
		}
	});
}
