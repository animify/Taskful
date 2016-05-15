var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var authcontroller = require(libs + 'auth/auth');

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var Team = require(libs + 'model/teams');
var teamController = require(libs + 'controllers/teams');

// Get all tasks
router.get('/', function(req, res) {
	teamController.findAll(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', teams : ret });
	});

});


// Create new team
router.post('/', function(req, res) {
	teamController.createNew(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', team : ret });
	});
});

// Find task by id
router.get('/:id', function(req, res) {
	teamController.findById(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', team : ret });
	});
});

module.exports = router;
