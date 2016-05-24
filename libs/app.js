var libs = process.cwd() + '/libs/';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var socketio = require('socket.io').listen(http);
global.socketIO = socketio;
var socketjs = require(libs + 'sockets/socket.js');
var path = require('path');
var passport = require('passport');
var reload = require('reload');
var EventEmitter = require('events').EventEmitter;
var emitter= new EventEmitter();
var helmet = require('helmet');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var User = require('./model/user');
var Team = require('./model/teams');

var methodOverride = require('method-override');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var validator = require('express-validator');

var db = require(libs + 'db/mongoose');

var config = require('./config');
var log = require('./log')(module);
var debug = require('debug')('restapi');

var authcontroller = require(libs + 'auth/auth');
var oauth2 = require('./auth/oauth2');


app.set('port', process.env.PORT || config.get('port') || 3000);

var server = http.listen(app.get('port'), function() {
	debug('Taskful server listening on port ' + app.get('port'));
	log.info('Taskful server listening on port ' + app.get('port'));
});

reload(server, app, 300, true)

app.locals.moment = require('moment');

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });

var sessionStore = new MongoStore({ mongooseConnection: db.connection });

var eSession = session({
		key: 'connect.sid',
		secret: 'secret',
		store: sessionStore,
		resave: true,
		saveUninitialized: true
});

app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }))
app.use(eSession);
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());


socketjs.connect(server, socketio, sessionStore, eSession);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(validator());

app.use(validator({
	errorFormatter: function(param, msg, value) {
			var namespace = param.split('.')
			, root    = namespace.shift()
			, formParam = root;

		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			parameter: formParam,
			description: msg
		};
	}
}));

var users = require('./routes/users');
var tasks = require('./routes/tasks');
var teams = require('./routes/teams');
var projects = require('./routes/projects');
var people = require('./routes/people');
var apiTasks = require('./routes/api_tasks');
var apiTeams = require('./routes/api_teams');
var apiProjects = require('./routes/api_projects');


app.use('/', users);

app.get('/profile', authcontroller.isAuthenticatedLocal, function(req, res) {
	res.render('profile', { user : req.user });
});

app.post('/login', passport.authenticate('local'), function(req, res) {
	return res.json({status:"OK"})
});

app.use('/api/users', users);
app.use('/teams', authcontroller.isAuthenticatedLocal, teams);
app.use('/projects', authcontroller.isAuthenticatedLocal, projects);
app.use('/people', authcontroller.isAuthenticatedLocal, people);
app.use('/tasks', authcontroller.isAuthenticatedLocal, tasks);
app.use('/api/teams', authcontroller.isOauthAuthenticated, apiTeams);
app.use('/api/tasks', authcontroller.isOauthAuthenticated, apiTasks);
app.use('/api/projects', authcontroller.isOauthAuthenticated, apiProjects);
app.use('/api/oauth/token', oauth2.token);

// catch 404 and forward to error handler
app.use(function(req, res, next){
		res.status(404);
		log.debug('%s %d %s', req.method, res.statusCode, req.url);
		res.json({
			error: 'Not found'
		});
		return;
});

// error handlers
app.use(function(err, req, res, next){
		res.status(err.status || 500);
		log.error('%s %d %s', req.method, res.statusCode, err.message);
		res.json({
			error: err.message
		});
		return;
});


module.exports = app;
