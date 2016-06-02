var express = require('express');
var router = express.Router();
var fs = require('fs')
var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');
var Workspace = require('../model/workspace');
var mongoose = require('mongoose');

var mailer = require('../controllers/mail');


router.get('/new', function(req, res) {
	if (req.user.workspace)
		return res.redirect('/account')
	res.render('createworkspace', {user: req.user});
});

router.post('/new', function(req, res) {
	req.sanitizeBody();
	req.checkBody({
		'organisation' :{
			notEmpty: true,
			onlyLetters: {
				errorMessage: 'Organisation name has illegal characters'
			}
		},
		'workemail' :{
			optional: true,
			isEmail: {
				errorMessage: 'Work email isnt a valid email address'
			}
		}
	});
	var errors = req.validationErrors();
	if (errors) {
		return res.send(errors);
	}

	User.findOne({ _id: req.user._id }, function(err, user) {
		if (!user) {
			return res.json({error: '404', message: 'User could not be found'});
		}

		var workspace = new Workspace();
		workspace._id = mongoose.Types.ObjectId();
		workspace.name = req.body.organisation;
		workspace.domain = req.body.workemail.replace(/.*@/, "");
		workspace.creator = req.user._id;
		workspace.members.push(req.user._id);

		workspace.save(function(err, space) {
			user.workspace = space._id;
			user.save();
			res.json({status:'ok'});
		});
	});

});

module.exports = router;
