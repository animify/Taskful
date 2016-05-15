var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var authcontroller = require(libs + 'auth/auth');

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var teamController = require(libs + 'controllers/teams');

var socketjs = require(libs + 'sockets/socket.js');

router.get('/', function(req, res) {
	teamController.findAll(req, res, function(err, ret) {
		if (err) {
			return res.render('teams', { user : req.user, teams : ret, error : err });
		}
		res.render('teams', { user : req.user, teams : ret });
	});

});

router.post('/', function(req, res) {
	teamController.createNew(req, res, function(err, ret) {
		if (err) {
			res.statusCode = err;
			return res.json({ error: err, message: ret });
		}
		res.json({ status: 'OK', team : ret });
	});
});

router.get('/:id', function(req, res) {
	teamController.findById(req, res, function(err, ret) {
		if (err) {
			return res.redirect('/teams');
		}
		req.session.viewingTeam = req.params.id;
		socketjs.serverEmitter.emit('join_team', req.session.viewingTeam);
		res.render('team', { user : req.user, team : ret});
	});
});

router.post('/invite', function(req, res) {
	teamController.invite(req, res, function(err, ret) {
		if (err) {
			return res.send({ error: err, message: ret });
		}
		res.send(ret);
	});
});


module.exports = router;
