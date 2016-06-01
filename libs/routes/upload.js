var express = require('express');
var router = express.Router();
var fs = require('fs')
var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');
var Project = require('../model/projects');
var Tasks = require('../model/tasks');

var mailer = require('../controllers/mail');

var s3 = require('s3');
var multiparty = require('multiparty');
var util = require('util');
var knox = require('knox').createClient({
		key: 'AKIAJBDTRSGJAG5TCMLQ'
	, secret: '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'
	, bucket: 'taskful'
});

var mime = require('mime')
// var client = s3.createClient({
// 	maxAsyncS3: 20,     // this is the default
// 	s3RetryCount: 3,    // this is the default
// 	s3RetryDelay: 1000, // this is the default
// 	multipartUploadThreshold: 20971520, // this is the default (20 MB)
// 	multipartUploadSize: 15728640, // this is the default (15 MB)
// 	s3Options: {
// 		accessKeyId: "AKIAJBDTRSGJAG5TCMLQ",
// 		secretAccessKey: "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",
// 	},
// });


router.get('/', function(req, res) {

	res.render('files');
});

router.post('/upload/:task', function(req, res) {

	var findTask = function(req, res) {
		Tasks.findOne({'_id': req.params.task , 'project' : req.session.viewingProject}, function (err, project) {
			if(!project) {
				console.log('not found')
			}
			if (project) {
				var form = new multiparty.Form();
				var taskFileName = req.params.task;
				var projectFileName = req.session.viewingProject;

				form.parse(req, function(err, fields, files) {
					if (files) {
					async.forEachOf(files['null'], function (file, key, callback) {
						console.log(file)
						var uploadKey = projectFileName + '/' + taskFileName + '/' + file.originalFilename;
						var stream = fs.createReadStream(file.path)
						var mimetype = mime.lookup(file.path);

						if (mimetype.localeCompare('image/jpeg')
							|| mimetype.localeCompare('image/pjpeg')
							|| mimetype.localeCompare('image/png')
							|| mimetype.localeCompare('image/gif')) {

							var req = knox.putStream(stream, uploadKey, {
									'Content-Type': mimetype,
									'Cache-Control': 'max-age=604800',
									'x-amz-acl': 'private',
									'Content-Length': file.size
							},
									function(err, result) {
											console.log(result);
									}
							 );
						 } else {
							 res.json({err : 'error'})
						 }

						 req.on('response', function(rest){
						 if (rest.statusCode == '200') {
								res.json({done: getS3Url(uploadKey)})
						 } else {
								console.log('not done')
						 }
					});

					});
					}
				});
			}
		});
	}

	function getS3Url(filename) {
		var expires = new Date();
		expires.setMinutes(expires.getMinutes() + 5);
		return knox.signedUrl(filename, expires);
	}

findTask(req,res)


// var params = {
// 	localFile: file.path,
// 	s3Params: {
// 		Bucket: "taskful",
// 		Key: uploadKey,
// 	},
// };
// console.log(file.path)
// var uploader = client.uploadFile(params);
// uploader.on('error', function(err) {
// 	console.error("unable to upload:", err.stack);
// });
//
// uploader.on('end', function(data) {
// 	console.log("done uploading", data);
// 	s3.getPublicUrl("taskful", uploadKey, function(err, data) {
// 		console.log(err, data)
// 	})
// });
});

module.exports = router;
