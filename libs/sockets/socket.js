var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var events = require('events');
var cookieParser = require('cookie-parser');
var serverEmitter = new events.EventEmitter();
var teamController = require(libs + 'controllers/teams');
var passport = require('passport');
var passportSocketIo = require('passport.socketio');

module.exports.serverEmitter = serverEmitter;

module.exports.connect = function(server, io, sessionStore) {

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

	io.on('connection', function (socket) {

		log.info('Connection to socket.io');
		console.log(socket.request.user._id);

		serverEmitter.once('join_project', function (data) {
			// socket.room = 'project_' + data;
			// socket.join(socket.room);
			// console.log('Joined ' + socket.room);
		});
		socket.on('pjoin', function (data) {
			socket.room = 'project_' + data.room;
			socket.join(socket.room);
			console.log('joined ' + socket.room);
		});
		serverEmitter.once('join_team', function (data) {
			socket.room = 'team_' + data;
			socket.join(socket.room);
			console.log('Joined team ' + socket.room);
		});


	});
}
