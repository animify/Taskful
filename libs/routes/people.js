var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var async = require('async');

var authcontroller = require(libs + 'auth/auth');
var peopleController = require(libs + 'controllers/people');
var validate = require(libs + 'controllers/validate');

router.get('/', function(req, res) {
	async.series({
		pending: function(cb){
			peopleController.findPending(req, res, function(err, ret) {
				cb(null, ret);
			});
		},
		requests: function(cb){
			peopleController.findRequests(req, res, function(err, ret) {
				cb(null, ret);
			});
		},
		friends: function(cb){
			peopleController.findFriends(req, res, function(err, ret) {
				cb(null, ret);
			});
		}
	}, function(err, people) {
		JSON.stringify(people);
		console.log(people)
		res.render('people', { user : req.user, people: people});
	});

});

router.post('/invite', function(req, res) {
	peopleController.invite(req, res, function(err, ret) {
		if (err) {
			return res.status(err).send({ error: err, message: ret });
		}
		res.json({'status': ret});
	});
});
router.post('/:id/accept', function(req, res) {
	peopleController.acceptInvite(req, res, function(err, ret) {
		if (err) {
			return res.status(err).send({ error: err, message: ret });
		}
		res.send(ret);
	});
});


module.exports = router;
