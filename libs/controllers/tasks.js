var libs = process.cwd() + '/libs/';
var Task = require('../model/tasks');
var validate = require('./validate');
var mongoose = require('mongoose');
var log = require(libs + 'log')(module);
var Story = require('../model/stories');

var io = global.socketIO;

const findTask = function findTask(req) {
	return new Promise((resolve, reject) => {
		Task.findOne({'_id': req.params.id})
		.populate([{path:'creator', select:'_id username fullname'}, {path: 'project', select:'name team status'}])
		.exec(function (err, task) {
			if(!task) {
				reject(new Error('Task not found'));
			}

			if (!err) {
				if (req.user._id.toString().trim() == task.creator._id.toString().trim()) {
					resolve(task);
				} else {
					validate.isMember(task.project.team, req.user._id, function (err, done) {
						if (err) {
							reject(new Error('Validation error'));
						} else {
							resolve(task);
						}
					});
				}
			} else {
				log.error('Internal error(%d): %s',res.statusCode,err.message);
				reject(new Error('Server error'));
			}
		});
	});
}

exports.createNew = function(req, res, hasProject, callback) {
	req.sanitizeBody();
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Task name can only be up to 30 characters long'
			}
		},
		'content' :{
			optional: true,
			isLength: {
				options: [{ max: 300 }],
				errorMessage: 'Content can only be up to 300 characters long'
			}
		}
	});

	if (hasProject) {
		req.body.project = hasProject;
	}

	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}

	function pushTask(req) {
		return new Promise((resolve, reject) => {
			const task = new Task({
				name: req.body.name,
				project: req.body.project,
				content: req.body.content,
				creator: req.user.userId
			});

			task.save((err) => {
				if (!err) {
					log.info('New task created with id: %s in project', _id, hasProject);
					task.populate('creator', 'username fullname', function(err) {
						if (!err) {
							var story = new Story({
								target: task._id,
								stories : {
									text: 'created this task',
									type: 'init',
									creator: req.user.userId
								}
							});
							story.save();
							resolve(task);
						}

						reject(new Error('Internal error'));
					});
				} else {
					log.error('Internal error(%d): %s', err.code, err.message);
					reject(new Error('Internal error'));
				}
			});
		});
	}


	const saveTask = (req) => validate.isProject(req).then(pushTask);

	if (req.body.project) {
		saveTask(req)
		.then((task) => {
			io.sockets.in("project_" + req.body.project).emit('new_task', task);
			log.info(task._id)
			return callback(null, task);
		})
		.catch((err) => {
			console.log(err)
			return callback('500', 'Internal error');
		});
	} else {
		pushTask(req)
		.then((task) => {
			return callback(null, task);
		})
		.catch((err) => {
			return callback('500', 'Internal error');
		});
	}

};

exports.findAll = function(req, res, callback) {
	Task.find({$or:[{'creator':req.user.userId}, {'userlist': { $in : [req.user.userId]}}]})
	.populate('creator', '_id username')
	.exec(function (err, tasks) {
		if (!err) {
			return callback(null, tasks);
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);

			return callback('500', 'Server error');
		}
	});
}

exports.findById = function(req, res, callback) {
	findTask(req)
	.then((task) => {
		return callback(null, task);
	})
	.catch((err) => {
		return callback('500', 'Internal error');
	});
};

exports.archive = function(req, res, callback) {
	findTask(req)
	.then((task) => {
		Task.update({ '_id' : task._id}, {$set: { 'archived' : true}},  {new: true}, function(err, updated) {
			if (!err)
				return callback(null, 'Task has been archived');

			return callback('404', 'Task could not be updated');
		});
	})
	.catch((err) => {
		console.log(err)
		return callback('500', 'Internal error');
	});
};

exports.complete = function(req, res, callback) {
	findTask(req)
	.then((task) => {
		Task.update({ '_id' : task._id}, {$set: { 'status' : true}},  {new: true}, function(err, updated) {
			if (!err)
				return callback(null, 'Task is now complete');

			return callback('404', 'Task could not be updated');
		});
	})
	.catch((err) => {
		console.log(err)
		return callback('500', 'Internal error');
	});
};

exports.uncomplete = function(req, res, callback) {
	findTask(req)
	.then((task) => {
		Task.update({ '_id' : task._id}, {$set: { 'status' : false}},  {new: true}, function(err, updated) {
			if (!err)
				return callback(null, 'Task is now open');

			return callback('404', 'Task could not be updated');
		});
	})
	.catch((err) => {
		console.log(err)
		return callback('500', 'Internal error');
	});
};

exports.saveOnType = function(taskid, taskbody, callback) {
	Task.findOneAndUpdate({'_id': taskid}, { $set: { content: taskbody }}, function (err, task) {
		if (err) return console.log(err);
	});
};
