var libs = process.cwd() + '/libs/';
var Project = require('../model/projects');
var Tasks = require('../model/tasks');
var Team = require('../model/teams');
var validate = require('./validate');
var mongoose = require('mongoose');
var log = require(libs + 'log')(module);
var async = require('async');

exports.createNew = function(req, res, callback) {

	req.sanitizeBody();
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Project name can only be up to 30 characters long'
			}
		},
		'team' :{
			optional: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Team name can only be up to 30 characters long'
			}
		}
	});
	req.body.team == 'undefined' ? req.body.team = undefined : req.body.team = req.body.team;

	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}

	var io = global.socketIO;
	var saveProject = function(err, result) {
		if (err) return callback(err, result);

		var project = new Project({
			name: req.body.name,
			team: req.body.team,
			owner: req.user.userId
		});

		project.save(function (err) {
			if (!err) {
				log.info("New project created with id: %s", project._id);
				project.populate('owner', 'username', function(err) {
					if (err) {
						return callback('500', 'Server error');
					}
					return callback(null, project);
				});
			} else {
				if(err.name === 'ValidationError') {
					return callback('400', 'Validation error');
				} else {
					return callback('500', 'Server error');
				}
				log.error('Internal error(%d): %s', '500', err.message);
			}
		});
	};
		if (req.body.team === undefined) {
			saveProject(null, true);
		} else {
			validate.isMember(req.body.team, req.user._id, function (err, done) {
				if (err) {
					saveProject('403', 'Not the owner or member of this team');
				} else {
					saveProject(null, true);
				}
			});
		}

};

exports.findAll = function(req, res, callback) {
	var teamProjects = [];
	var findData = function (req, res, callback) {
		async.parallel ({
			findAllInTeams: function(cb) {
				Team.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
				.exec(function (err, teams) {
					if (!err) {
						if (teams.length) {
							teams.forEach(function(doc, i, array) {
								Project.find({'team': doc._id})
								.populate('owner', '_id username')
								.populate('team', 'name')
								.exec(function (err, project) {
									if (!err) {
										teamProjects.push(project);
										if (i == 0) {
											cb(null, teamProjects)
										}
									} else {
										log.error('Internal error(%d): %s', '500',err.message);
										return callback('500', 'Server error');
									}
								});
							});
						} else {
							cb(null, null)
						}

					} else {
						log.error('Internal error(%d): %s', '500',err.message);
						return callback('500', 'Server error');
					}
				});
			},
			findAllSelf: function(cb) {
				Project.find({'owner': req.user._id, 'team': undefined})
				.populate('owner', '_id username')
				.exec(function (err, projects) {
					if (!err) {
						teamProjects.push(projects);
						cb(null, projects)
					} else {
						log.error('Internal error(%d): %s', '500',err.message);
						return callback('500', 'Server error');
					}
				});
			}
		}, function(err, result) {
			var teamP = result.findAllInTeams;
			var selfP = result.findAllSelf;
			console.log(teamProjects)
			return callback(null, teamProjects)
		});

	};
	findData(req, res, callback);
}

exports.findById = function(req, res, callback) {
	Project.findOne({'_id': req.params.id , $or:[{'owner':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate('creator', '_id username')
	.exec(function (err, project) {
		if(!project) {
			return callback('404', 'Project not found');
		}
		validate.isMember(req.body.team, req.user._id, function (err, done) {
			if (err) {
				return callback('500', 'Server error');
			} else {
				if (!err) {
					return callback(null, project);
				} else {
					log.error('Internal error(%d): %s', '500' , err.message);
					return callback('500', 'Server error');
				}
			}
		});
	});
};

exports.findByIdExtended = function(_filter, req, res, callback) {
	var projectstasks = [];
	var getTasks = function(db_project, _filter) {
		switch(_filter) {
			case 'open':
				var taskQuery = {'project': req.params.id, 'status': false, 'archived' : false};
				queryTasks(db_project, taskQuery);
			break;
			case 'archived':
				var taskQuery = {'project': req.params.id, 'archived' : true};
				queryTasks(db_project, taskQuery);
			break;
			case 'completed':
				var taskQuery = {'project': req.params.id, 'archived' : false, 'status': true};
				queryTasks(db_project, taskQuery);
			break;
			default:
				var taskQuery = {'project': req.params.id, 'status': false, 'archived' : false};
				queryTasks(db_project, taskQuery);
		}

	}

	var queryTasks = function(db_project, query) {
		Tasks.find(query)
		.populate('creator', '_id fullname username')
		.exec(function(err, db_tasks) {
			projectstasks.push(db_project);
			projectstasks.push(db_tasks);
			return callback(null, projectstasks);
		});
	}

	Project.findOne({'_id' : req.params.id})
	.populate('team')
	.populate('owner')
	.exec(function(err, db_project) {
		if (err) console.log(err);
		if (!db_project)
			return callback('404', 'Project not found');
		else {
			if (db_project.owner._id.toString().trim() === req.user._id.toString().trim()) {
				getTasks(db_project, _filter);
			} else if (db_project.team) {
				validate.isMember(db_project.team._id, req.user._id, function (err, done) {
					if (err) {
						return callback('500', 'Server error');
					} else {
						getTasks(db_project, _filter);
					}
				});
			} else {
				return callback('404', 'Project not found');
			}
		}
	});
};
