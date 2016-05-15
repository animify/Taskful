var libs = process.cwd() + '/libs/';
var Task = require('../model/tasks');
var validate = require('./validate');
var mongoose = require('mongoose');
var log = require(libs + 'log')(module);
var socketjs = require(libs + 'sockets/socket.js');
var io = global.socketIO;

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
			const _id = mongoose.Types.ObjectId();
			const task = new Task({
				_id,
				name: req.body.name,
				project: req.body.project,
				content: req.body.content,
				creator: req.user.userId
			});

			task.save((err) => {
				if (!err) {
					log.info('New task created with id: %s in project', _id, hasProject);
					task.populate('creator', 'username fullname', function(err) {
						if (!err)
						 resolve(task);

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
	Task.findOne({'_id': req.params.id})
	.populate([{path:'creator', select:'_id username'}, {path: 'project', select:'name team status'}])
	.exec(function (err, task) {

		if(!task) {
			return callback('404', 'Task not found');
		}

		if (!err) {
			if (req.user._id.toString().trim() == task.creator._id.toString().trim()) {
				return callback(null, task);
			} else {
				validate.isMember(task.project.team, req.user._id, function (err, done) {
					if (err) {
						return callback('500', 'Validation error');
					} else {
						return callback(null, task);
					}
				});
			}
		} else {
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			return callback('500', 'Server error');
		}
	});
};
