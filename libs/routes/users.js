var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../model/user');
var mongoose = require('mongoose');

var	crypto = require('crypto');

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var authController = require(libs + 'auth/auth');
var db = require(libs + 'db/mongoose');

var config = require(libs + 'config');
var stripe = require("stripe")(config.get("stripe:key"));
var async = require("async");
var mailer = require('../controllers/mail');


router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
});

router.get('/login', function(req, res) {
	res.render('login');
});

router.get('/register', function(req, res) {
	res.render('register');
});

router.post('/register', function(req, res) {
	log.info(req.body);
	req.sanitizeBody();
	req.checkBody({
		'username' :{
			notEmpty: true,
			errorMessage: 'username: A username is required'
		},
		'fullname' :{
			notEmpty: true,
			errorMessage: 'fullname: What is your name?'
		},
		'email' :{
			notEmpty: true,
			isEmail: {
				errorMessage: 'Email is invalid'
			},
			errorMessage: 'email: We need your email!'
		},
		'password' :{
			notEmpty: true,
			isLength: {
				options: [{ min: 6, max: 50 }],
				errorMessage: 'Password must be between 6 and 50 characters'
			},
			errorMessage: 'password: No good without a password!'
		},
		'repassword' :{
			notEmpty: true,
			errorMessage: 'repassword: That isn&#39;t the password you entered above!'
		}
	});
	var errors = req.validationErrors();

	var errors = req.validationErrors();

	if (errors) {
		return res.send(errors);
	} else {
		if (req.body.password == req.body.repassword) {
			var newid = mongoose.Types.ObjectId();

			stripe.customers.create({
				email: req.body.email,
				metadata: {'userID' : newid.toString(), 'fullname' : req.body.fullname }
			}, function(err, customer) {
				if (err)
					return res.json({ error: '404', message :  err });


				var user = new User();
				user._id = newid;
				user.fullname = req.body.fullname;
				user.username = req.body.username;
				user.email = req.body.email;
				user.password = req.body.password;
				user.plan.customer = customer.id;

				user.save(function(err, user) {
						if(!err) {
								log.info("New user - %s:%s", user.username, user.password);
								passport.authenticate('local')(req, res, function () {
									return res.send({'status': 'OK', 'statusCode' : '200'});
								});
						} else {
							return res.json({ error: '404', message : err });
						}
				});
			});

		} else {
			return res.send({'error': 'p404', 'message' : 'Passwords do not match'});
		}
	}


});

router.get('/info', passport.authenticate('bearer', { session: false }),
		function(req, res) {
				res.json({
					user_id: req.user.userId,
					name: req.user.username,
					scope: req.authInfo.scope
				});
		}
);

router.get('/forgot', function(req, res) {
	res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			User.findOne({ email: req.body.email }, function(err, user) {
				if (!user) {
					return res.json({error: '404', message: 'Email could not be found'});
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000;

				user.save(function(err) {
					done(err, token, user);
				});
			});
		},
		function(token, user, done) {
			var options = {};
			options['token'] = token;
			options['email'] = user.email;
			options['host'] = req.headers.host;
			mailer.passwordreset(req, res, options, function(err) {
				done(err, 'done');
			});
		}
	], function(err) {
	 if (err) return next(err);
	 res.redirect('/forgot');
	});
});

router.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
			return res.redirect('/');

		}
		res.render('reset', {user: req.user});
	});
});

router.post('/reset/:token', function(req, res) {
	async.waterfall([
		function(done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
				if (!user) {
					return res.json({error: '404', message: 'Password token is invalid or has expired'});
				}

				user.password = req.body.password;
				user.resetPasswordToken = undefined;
				user.resetPasswordExpires = undefined;

				user.save(function(err) {
					req.logIn(user, function(err) {
						var options = {};
						options['email'] = user.email;
						options['host'] = req.headers.host;
						mailer.passwordchanged(req, res, options, function(err) {
							done(err);
						});
					});
				});
			});
		}
	], function(err) {
		return res.sendStatus(200);
	});
});

module.exports = router;
