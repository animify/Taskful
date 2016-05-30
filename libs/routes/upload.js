var express = require('express');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');

var mailer = require('../controllers/mail');

// var knox = require('knox');
//
// var client = knox.createClient({
// 		key: 'AKIAJBDTRSGJAG5TCMLQ'
// 	, secret: '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'
// 	, bucket: 'taskful'
// });




var s3 = require('s3');
var multiparty = require('multiparty');
var util = require('util');

var client = s3.createClient({
	maxAsyncS3: 20,     // this is the default
	s3RetryCount: 3,    // this is the default
	s3RetryDelay: 1000, // this is the default
	multipartUploadThreshold: 20971520, // this is the default (20 MB)
	multipartUploadSize: 15728640, // this is the default (15 MB)
	s3Options: {
		accessKeyId: "AKIAJBDTRSGJAG5TCMLQ",
		secretAccessKey: "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",
	},
});

router.get('/', function(req, res) {

	res.render('files');
});

router.post('/upload', function(req, res) {
	console.log('here')

	var form = new multiparty.Form();

	form.parse(req, function(err, fields, files) {

		async.forEachOf(files['files'], function (file, key, callback) {
			var params = {
				localFile: file.path,
				s3Params: {
					Bucket: "taskful",
					Key: file.originalFilename,
				},
			};
			console.log(file.path)
			var uploader = client.uploadFile(params);
			uploader.on('error', function(err) {
				console.error("unable to upload:", err.stack);
			});
			//
			// uploader.on('progress', function() {
			// 	console.log("progress", uploader.progressMd5Amount,	uploader.progressAmount, uploader.progressTotal);
			// });

			uploader.on('end', function() {
				console.log("done uploading");
			});
		});

	});
});

// var params = {
// 	localFile: "some/local/file",
// 	s3Params: {
// 		Bucket: "taskful",
// 		Key: "/",
// 	},
// };
//
// var uploader = client.uploadFile(params);
// uploader.on('error', function(err) {
// 	console.error("unable to upload:", err.stack);
// });
//
// uploader.on('progress', function() {
// 	console.log("progress", uploader.progressMd5Amount,	uploader.progressAmount, uploader.progressTotal);
// });
//
// uploader.on('end', function() {
// 	console.log("done uploading");
// });


module.exports = router;
