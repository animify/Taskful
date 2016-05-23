var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');

var authcontroller = require(libs + 'auth/auth');
var projectController = require(libs + 'controllers/projects');
var teamController = require(libs + 'controllers/teams');
var validate = require(libs + 'controllers/validate');

router.get('/', function(req, res) {
	projectController.findAll(req, res, function(err, ret) {
		if (err) {
			res.render('projects', { user : req.user, teams : ret, error : err });
		}
		teamController.findAll(req, res, function(err, teams) {
			if (err) {
				return res.render('teams', { user : req.user, teams : ret, error : err });
			}

			res.render('projects', { user : req.user, projects : ret, teams : teams });
		});
	});

});

router.post('/', function(req, res) {
	projectController.createNew(req, res, function(err, ret) {
		if (err) {
			return res.status(err).send({ error: err, message: ret });
		}
		res.send(ret);
	});
});

router.get('/:id', function(req, res) {
	projectController.findByIdExtended('open', req, res, function(err, ret) {
		if (err) {
			res.redirect('/projects');
		}
		req.session.viewingProject = req.params.id;

		var db_project = ret[0];
		var db_tasks = ret[1];

		res.render('project', { user : req.user, project : db_project, tasks: db_tasks });
	});
});

router.get('/:id/:filter', function(req, res) {
	var _filter = req.params.filter;

	if (!~['archived','open', 'completed'].indexOf(_filter))
		return res.json({
			error: 'Invalid tasks filter'
		});

	projectController.findByIdExtended(_filter, req, res, function(err, ret) {
		if (err) {
			return res.json({
				error: 'Error retrieving tasks'
			});
		}

		var db_project = ret[0];
		var db_tasks = ret[1];

		res.json({ status: 'OK', tasks : db_tasks });

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



module.exports = router;
