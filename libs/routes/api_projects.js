var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var authcontroller = require(libs + 'auth/auth');

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var Team = require(libs + 'model/teams');
var projectController = require(libs + 'controllers/projects');

// Get all tasks
router.get('/', function(req, res) {
	projectController.findAll(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', projects : ret });
	});

});


// Create new team
router.post('/', function(req, res) {
	projectController.createNew(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', project : ret });
	});
});

// Find task by id
router.get('/:id', function(req, res) {
	projectController.findById(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', project : ret });
	});
});

module.exports = router;
