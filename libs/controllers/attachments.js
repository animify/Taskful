var libs = process.cwd() + '/libs/';
var async = require('async');
var log = require(libs + 'log')(module);
var config = require(libs + 'config');
var fs = require('fs')


var User = require('../model/user');
var People = require('../model/people');
var Tasks = require('../model/tasks');
var Attachment = require('../model/attachments');
var storyController = require(libs + 'controllers/stories');

var s3 = require('s3');
var multiparty = require('multiparty');
var util = require('util');
var knox = require('knox').createClient({
		key: config.get("aws:key"),
		secret: config.get("aws:secret"),
		bucket: config.get("aws:bucket")
});

var mime = require('mime')

exports.upload = function(req, res, form, callback) {
	var findTask = new Promise(function(resolve, reject) {
		Tasks.findOne({'_id': req.params.task , 'project' : req.session.viewingProject}, function (err, project) {
			if(!project) {
				console.log('not found')
			}
			if (project) {
				var taskFileName = req.params.task;
				var projectFileName = req.session.viewingProject;
				var fileOwner = req.user._id;

				req.params.id = req.params.task
				form.parse(req, function(err, fields, files) {
					var fileURLs = {};
					if (files) {
					async.forEachOf(files['null'], function (file, key, callback) {
						var uploadKey = projectFileName + '/' + taskFileName + '/' + file.originalFilename;
						var stream = fs.createReadStream(file.path)
						var mimetype = mime.lookup(file.path);
						req.params.filename = file.originalFilename
						_req = req
						if (mimetype.localeCompare('image/jpeg')
							|| mimetype.localeCompare('image/pjpeg')
							|| mimetype.localeCompare('image/png')
							|| mimetype.localeCompare('image/gif')) {

								var req = knox.putStream(stream, uploadKey, {
										'Content-Type': mimetype,
										'Cache-Control': 'max-age=604800',
										'x-amz-acl': 'private',
										'Content-Length': file.size
								}, function(data) {
									var attachment = new Attachment();
									attachment.owner = fileOwner;
									attachment.key = uploadKey;
									attachment.target.where = 'task';
									attachment.target.id = taskFileName;
									attachment.save(function(err, output) {
										if (err)
											console.log(err)

										fileURLs[key] = output.key;
										storyController.create('file', _req, res, function(err, story) {
											if (err) {
												res.statusCode = err;
												return res.json({ error: err, message: story });
											}
											res.json({ status: 'OK', story : story });
										});
										callback()
									})
								});
						 } else {
							 callback(Error('invalid'))
						 }
					}, function (err) {
						if (err) console.error(err.message);
						console.log(fileURLs);
					});
					}
				});
			}
		});
	});

	function getS3Url(filename) {
		var expires = new Date();
		expires.setMinutes(expires.getMinutes() + 5);
		return knox.signedUrl(filename, expires);
	}


	findTask.then(function(result) {
		console.log(result); // "Stuff worked!"
	}, function(err) {
		console.log(err); // Error: "It broke"
	});
}

exports.saveAttachment = function(req, res, callback) {
	req.sanitizeBody();
	req.checkBody({
		'email' :{
			notEmpty: true,
			isEmail: {
				errorMessage: 'That isnt a valid email address'
			}
		}
	});
	var errors = req.validationErrors();
	if (errors) {
		return callback('500', errors);
	}  else {

	}
}
