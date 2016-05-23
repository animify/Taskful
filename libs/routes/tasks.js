var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var authcontroller = require(libs + 'auth/auth');

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var Task = require(libs + 'model/tasks');
var Story = require(libs + 'model/stories');
var taskController = require(libs + 'controllers/tasks');
var storyController = require(libs + 'controllers/stories');

var io = global.socketIO;
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
		Story.find({'target': task._id})
		.populate('stories.creator', '_id username fullname')
		.exec(function (err, stories) {
			console.log(stories)
			res.json({ status: 'OK', task : task, stories : stories });
		});
	});
});

router.post('/:id/:action', function(req, res) {
	switch(req.params.action) {
		case 'archive':
			taskController.archive(req, res, function(err, task) {
				if (err) {
					res.statusCode = err;
					return res.json({ error: err, message: task });
				}
				res.json({ status: 'OK', message : task });
			});
		break;
		case 'complete':
			taskController.complete(req, res, function(err, task) {
				if (err) {
					res.statusCode = err;
					return res.json({ error: err, message: task });
				}
				res.json({ status: 'OK', message : task });
			});
		break;
		case 'open':
			taskController.uncomplete(req, res, function(err, task) {
				if (err) {
					res.statusCode = err;
					return res.json({ error: err, message: task });
				}
				res.json({ status: 'OK', message : task });
			});
		break;
		default:
			return res.json({ error: '401', message: 'Forbidden action' });
	}


});

router.post('/:id/stories', function(req, res) {
	storyController.create('comment', req, res, function(err, story) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: story });
		}
		res.json({ status: 'OK', story : story });
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
