var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var authcontroller = require(libs + 'auth/auth');

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var Task = require(libs + 'model/tasks');
var taskController = require(libs + 'controllers/tasks');

// Get all tasks
router.get('/', function(req, res) {
	taskController.findAll(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', tasks : ret });
	});

});


// Create new task
router.post('/', function(req, res) {
	taskController.createNew(req, res, null, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', tasks : ret });
	});
});

// Find task by id
router.get('/:id', function(req, res) {
	taskController.findById(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', task : ret });
	});
});

module.exports = router;
