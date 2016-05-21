var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var events = require('events');
var cookieParser = require('cookie-parser');
var serverEmitter = new events.EventEmitter();
var teamController = require(libs + 'controllers/teams');
var passport = require('passport');
var passportSocketIo = require('passport.socketio');
var sharedsession = require("express-socket.io-session");

module.exports.serverEmitter = serverEmitter;

module.exports.connect = function(server, io, sessionStore, eSession) {
	io.use(sharedsession(eSession));
	io.use(passportSocketIo.authorize({
			passport:     passport,
			cookieParser: cookieParser,
			key:          'connect.sid',
			secret:       'secret',
			store:        sessionStore,
			success:      onAuthorizeSuccess,
			fail:         onAuthorizeFail
	}));

	function onAuthorizeSuccess(data, accept){
		log.info('Aunthenticated with socket.io');
		accept();
	}

	function onAuthorizeFail(data, message, error, accept){
		log.error('Unauthenticated connection to socket.io:', data, message);
		if(error)
			accept(new Error(message));
	}

	var body = [];
	io.on('connection', function (socket) {
		log.info('Connection to socket.io');

		socket.on('refresh', function (body_) {
			body[body_.task] = body_.body;
		});

		socket.on('change', function (data) {
			if (data.change.origin == '+input' || data.change.origin == 'paste' || data.change.origin == '+delete') {
					socket.broadcast.to('project_' + socket.handshake.session.viewingProject).emit('change', {change : data.change, task: data.task});
			};
		});

		socket.on('pjoin', function (data) {
			socket.room = 'project_' + data.room;
			socket.join(socket.room);
		});

		serverEmitter.once('join_team', function (data) {
			socket.room = 'team_' + data;
			socket.join(socket.room);
		});

	});
}
