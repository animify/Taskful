var libs = process.cwd() + '/libs/';
var Team = require('../model/teams');
var User = require('../model/user');
var Story = require('../model/stories');
var Task = require('../model/tasks');
var mongoose = require('mongoose');
var validate = require('./validate');
var log = require(libs + 'log')(module);

var io = global.socketIO;

exports.create = function(type, req, res, callback) {
	req.sanitizeBody();
	req.checkBody({
		'text' :{
			notEmpty: true
		}
	});

	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}

	function pushStory(type, text, task, creator, project) {
		Story.findOneAndUpdate({
			target: task
		},
		{
			$push: {
				"stories" : {
					"text" : text,
					"type" : type,
					"creator" : creator
				}
			}

		},
		{new: true}, function(err, updated) {
			if (!err) {
				updated.populate('stories.creator', 'username fullname', function(err, finalstory) {
					io.sockets.in("project_" + project).emit('new_story', {story: finalstory, task : task });
					return callback(null, finalstory);
				});
			} else {
				return callback('404', 'Story could not be created');
			}
		});
	}

	Task.findOne({'_id': req.params.id})
	.populate([{path:'creator', select:'_id username'}, {path: 'project', select:'team'}])
	.exec(function (err, task) {
		if(!task) {
			return callback('404', 'Task not found');
		}

		if (!err) {
			if (req.user._id.toString().trim() == task.creator._id.toString().trim()) {
				pushStory(type, req.body.text, req.params.id, req.user._id, task.project._id);
			} else {
				validate.isMember(task.project.team, req.user._id, function (err, done) {
					if (err) {
						return callback('500', 'Validation error');
					} else {
						pushStory(type, req.body.text, req.params.id, req.user._id, task.project._id);
					}
				});
			}
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			return callback('500', 'Server error');
		}
	});
}

exports.attachment = function(filetype, filename, req, res, callback) {
	var type = 'attachment';

	function pushStory(type, text, task, creator, project) {
		Story.findOneAndUpdate({
			target: task
		},
		{
			$push: {
				"stories" : {
					"text" : text,
					"type" : type,
					"creator" : creator
				}
			}

		},
		{new: true}, function(err, updated) {
			if (!err) {
				updated.populate('stories.creator', 'username fullname', function(err, finalstory) {
					io.sockets.in("project_" + project).emit('new_story', {story: finalstory, task : task });
					return callback(null, finalstory);
				});
			} else {
				return callback('404', 'Story could not be created');
			}
		});
	}

	Task.findOne({'_id': req.params.id})
	.populate([{path:'creator', select:'_id username'}, {path: 'project', select:'team'}])
	.exec(function (err, task) {
		if(!task) {
			return callback('404', 'Task not found');
		}

		if (!err) {
			if (req.user._id.toString().trim() == task.creator._id.toString().trim()) {
				pushStory(type, req.body.text, req.params.id, req.user._id, task.project._id);
			} else {
				validate.isMember(task.project.team, req.user._id, function (err, done) {
					if (err) {
						return callback('500', 'Validation error');
					} else {
						pushStory(type, req.body.text, req.params.id, req.user._id, task.project._id);
					}
				});
			}
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			return callback('500', 'Server error');
		}
	});
}
