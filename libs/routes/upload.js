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
var Attachments = require('../controllers/attachments');

var multiparty = require('multiparty');


router.get('/', function(req, res) {
	res.render('files');
});

router.post('/upload/:task', function(req, res) {
	var form = new multiparty.Form();

	Attachments.upload(req,res, form, function(err, file) {
		if (err) {
			return res.status(err).send({ error: err, message: file });
		}
		res.send(file);
	});

});

module.exports = router;
