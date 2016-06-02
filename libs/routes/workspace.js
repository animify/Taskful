var express = require('express');
var router = express.Router();
var fs = require('fs')
var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');
var Project = require('../model/projects');
var Tasks = require('../model/tasks');

var mailer = require('../controllers/mail');


router.get('/create', function(req, res) {
	res.render('createworkspace', {user: req.user});
});

router.post('/create', function(req, res) {
	req.sanitizeBody();
	req.checkBody({
		'organisation' :{
			notEmpty: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Project name can only be up to 30 characters long'
			}
		},
		'workemail' :{
			optional: true,
			isEmail: {
				errorMessage: 'Work email isnt a valid email address'
			}
		}
	});
});

module.exports = router;
