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

var io = global.socketIO;
console.log(io)
router.get('/', function(req, res) {
	req.session.viewingProject = null;
	taskController.findAll(req, res, function(err, ret) {
		if (err) {
			res.render('tasks', { user : req.user, teams : ret, error : err });
		}
		res.render('tasks', { user : req.user, tasks : ret });
	})
});

router.post('/', function(req, res) {
	console.log('reachedtasks')
	console.log('proj', req.session.viewingProject)

	var hasProject = null;

	if (req.session.viewingProject) {
		hasProject = req.session.viewingProject;
	}

	taskController.createNew(req, res, hasProject, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', tasks : ret });
	});
});

router.get('/:id', function(req, res) {
	taskController.findById(req, res, function(err, task) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: task });
		}
		res.json({ status: 'OK', task : task });
	});
});

router.put('/:id', passport.authenticate('bearer', { session: false }), function (req, res){
	var taskID = req.params.id;

	Task.findById(taskID, function (err, task) {
		if(!task) {
			res.statusCode = 404;
			log.error('Task with id: %s Not Found', taskID);
			return res.json({
				error: 'Not found'
			});
		}

		task.name = req.body.name;
		task.status = req.body.status;
		task.content = req.body.content;
		log.info(task.name);
		task.save(function (err) {
			if (!err) {
				log.info("Task with id: %s updated", task._id);
				return res.json({
					status: 'OK',
					task:task
				});
			} else {
				if(err.name === 'ValidationError') {
					res.statusCode = 400;
					return res.json({
						error: 'Validation error'
					});
				} else {
					res.statusCode = 500;

					return res.json({
						error: 'Server error'
					});
				}
				log.error('Internal error (%d): %s', res.statusCode, err.message);
			}
		});
	});
});

router.put('/:id/invite/', passport.authenticate('bearer', { session: false }), function (req, res){
	var taskID = req.params.id;
	var userID = req.body.userid;

	Task.findById(taskID, function (err, task) {
		if(!task) {
			res.statusCode = 404;
			log.error('Task with id: %s Not Found', taskID);
			return res.json({
				error: 'Not found'
			});
		}

		task.userlist.push(userID);

		task.save(function (err) {
			if (!err) {
				log.info("Task with id: %s updated", task._id);
				return res.json({
					status: 'OK',
					task:task
				});
			} else {
				if(err.name === 'ValidationError') {
					res.statusCode = 400;
					return res.json({
						error: 'Validation error'
					});
				} else {
					res.statusCode = 500;

					return res.json({
						error: 'Server error'
					});
				}
				log.error('Internal error (%d): %s', res.statusCode, err.message);
			}
		});
	});
});

module.exports = router;
