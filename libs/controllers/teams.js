var libs = process.cwd() + '/libs/';
var Team = require('../model/teams');
var User = require('../model/user');
var mongoose = require('mongoose');
var validate = require('./validate');
var log = require(libs + 'log')(module);
var randomColor = require('randomcolor');

exports.createNew = function(req, res, callback) {
	req.sanitizeBody();
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Team name can only be up to 30 characters long'
			}
		}
	});

	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}

	var newid = mongoose.Types.ObjectId();
	var team = new Team({
		_id: newid,
		name: req.body.name,
		color: randomColor(),
		creator: req.user.userId
	});

	team.save(function (err) {
		if (!err) {
			log.info("New team created with id: %s", team._id);
			return callback(null, team);
		} else {
			if(err.name === 'ValidationError') {
				return callback('400', 'Validation error');
			} else {
				return callback('500', 'Server error');
			}
			log.error('Internal error(%d): %s', '500', err.message);
		}
	});
};

exports.findAll = function(req, res, callback) {
	Team.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec(function (err, teams) {
		if (!err) {
			return callback(null, teams);
		} else {
			log.error('Internal error(%d): %s', '500',err.message);

			return callback('500', 'Server error');
		}
	});
}

exports.findById = function(req, res, callback) {
	var populateQuery = [{path:'creator', select:'_id username fullname email'}, {path:'userlist', model:'User', select: '_id username fullname email'}];
	Team.findOne({'_id': req.params.id , $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate(populateQuery)
	.exec(function (err, team) {
		if(!team) {
			return callback('404', 'Team not found');
		}
		if (!err) {
			return callback(null, team);
		} else {
			log.error('Internal error(%d): %s', '500' , err.message);
			return callback('500', 'Server error');
		}
	});
};

exports.invite = function(req, res, callback) {
	req.sanitizeBody();
	req.checkBody({
		'email' :{
			notEmpty: true,
			isEmail: {
				errorMessage: 'That isnt a valid email address'
			}
		},
		'team' :{
			notEmpty: true
		}
	});

	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	} else {
		User.findOne({'email': req.body.email}, function (err, found){
			if (found) {
				if (found._id == req.user._id) {
					return callback('500', 'You are already a member of this team');
				} else {
					validate.isMember(req.body.team, req.user._id, function (err, done) {
						console.log(done);
						if (err) {
							return callback('500', 'You are not the owner or member of this team');
						} else {
							validate.notMember(req.body.team, found._id, function (err, done) {
								if (!err) {
									Team.update({'_id':req.body.team }, {$push: { 'userlist' : found._id }}, function(err, data) {
										return callback(null, 'User has been invitied to the team');
									});
								} else {
									return callback('500', 'The user with that email address is already a member of this team');
								}
							});
						}
					});
				}
			} else {
				return callback('500', 'Could not invite the user with that email address');
			}
		});
	}

};
