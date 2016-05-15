var libs = process.cwd() + '/libs/';
var Team = require('../model/teams');
var Project = require('../model/projects');
var mongoose = require('mongoose');
var log = require(libs + 'log')(module);

exports.isMember = function(teamid, userid, callback) {
	Team.find({'_id':teamid, $or:[{'creator': userid }, {'userlist': { $in : [userid]}}]}, function(err, result) {
			if (err) return err;
			if (!result.length)
				return callback('404', false);
			else
				return callback(null, true);
	});
}

exports.notMember = function(teamid, userid, callback) {
	Team.find({'_id':teamid, $or:[{'creator': userid }, {'userlist': { $in : [userid]}}]}, function(err, result) {
			if (err) return err;
			if (!result.length)
				return callback(null, true);
			else
				return callback('404', false);
	});
}

exports.isProject = function(req) {

	const projectid = req.body.project;
	const userid = req.user._id;

	const hasProjectId = (req) => new Promise((resolve, reject) => {
		if (req.body.project) {
			resolve(req);
		} else {
			reject(new Error('NoProject'));
		}
	});

	const checkProjectExists = (req) => {
		return Project.findOne({'_id':projectid})
		.populate('team', 'creator userlist')
		.exec()
		.then((result) => {
			if (result) {
				console.log(result.owner);
				if ((result.owner == userid) || (result.team.creator == userid) || (result.team.userlist.indexOf(userid) > -1)) {
					return req;
				} else {
					throw new Error('You do not own or are a member of this project');
				}
			} else {
				throw new Error('Project not found');
			}
		});
	};

	return hasProjectId(req).then(checkProjectExists);

	// Project.findOne({'_id':projectid})
	// .populate('team', 'creator userlist')
	// .exec(function(err, result) {
	// 		if (err) return err;
	// 		console.log(result);
	// 		if (!result) {
	// 			return callback('404', false);
	// 		}	else {
	// 			console.log(result.owner);
	// 			if ((result.owner == userid) || (result.team.creator == userid) || (result.team.userlist.indexOf(userid) > -1)) {
	// 				return callback(null, true);
	//
	// 			} else {
	// 				return callback('404', false);
	// 			}
	// 		}
	// });
}

// exports.projectAllowed = function(teamid, owner, req, res, callback) {
// 	if (teamid.team) {
// 		Team.find({'_id':teamid.team._id, $or:[{'creator':req._id}, {'userlist': { $in : [req._id]}}]}, function(err, result) {
// 			if (err) return err;
// 			if (!result.length)
// 				return callback(err, false);
// 			else
// 				return callback(err, true);
// 		});
// 	} else if(owner._id == req.id) {
// 		return callback(null, true);
// 	} else {
// 		res.redirect('/');
// 	}
// }
