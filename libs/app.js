var libs = process.cwd() + '/libs/';
var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();

var db = require(libs + 'db/mongoose');

var config = require('./config');
var log = require('./log')(module);
var debug = require('debug')('restapi');

var options = {
	 key  : fs.readFileSync('cert/taskful_io.key'),
	 cert : fs.readFileSync('cert/taskful_io.crt'),
	 ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES256-SHA384',
		honorCipherOrder: true,
	 secureProtocol: 'TLSv1_2_method'
};
app.set('port', process.env.PORT || config.get('port') || 80);

var server = https.Server(options, app).listen(app.get('port'), function () {
	 console.log('Taskful started on', app.get('port'));
});
var socketio = require('socket.io').listen(server);
global.socketIO = socketio;

var socketjs = require(libs + 'sockets/socket.js');
var path = require('path');
var passport = require('passport');
var reload = require('reload');
var helmet = require('helmet');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var User = require('./model/user');
var Team = require('./model/teams');

var methodOverride = require('method-override');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var validator = require('express-validator');

var authcontroller = require(libs + 'auth/auth');
var oauth2 = require('./auth/oauth2');


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
app.use(validator({
	customValidators: {
		isArray: function(value) {
				return Array.isArray(value);
		},
		onlyLetters: function(str) {
				return /^\w+$/.test(str);
		}
 }
}));

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
var payments = require('./routes/payments');
var stripehook = require('./routes/stripehook');
var account = require('./routes/account');
var upload = require('./routes/upload');
var workspaces = require('./routes/workspace');
var apiTasks = require('./routes/api_tasks');
var apiTeams = require('./routes/api_teams');
var apiProjects = require('./routes/api_projects');


app.use('/', users);


app.post('/login', passport.authenticate('local'), function(req, res) {
	return res.json({status:"OK"})
});


app.use('/api/users', users);
app.use('/files', authcontroller.isAuthenticatedLocal, upload);
app.use('/account', authcontroller.isAuthenticatedLocal, account);
app.use('/teams', authcontroller.isAuthenticatedLocal, teams);
app.use('/projects', authcontroller.isAuthenticatedLocal, projects);
app.use('/people', authcontroller.isAuthenticatedLocal, people);
app.use('/payments', authcontroller.isAuthenticatedLocal, payments);
app.use('/tasks', authcontroller.isAuthenticatedLocal, tasks);
app.use('/workspaces', authcontroller.isAuthenticatedLocal, workspaces);
app.use('/api/teams', authcontroller.isOauthAuthenticated, apiTeams);
app.use('/api/tasks', authcontroller.isOauthAuthenticated, apiTasks);
app.use('/api/projects', authcontroller.isOauthAuthenticated, apiProjects);
app.use('/api/oauth/token', oauth2.token);
app.use('/webhooks', stripehook);

app.use(function(req, res, next){
		res.status(404);
		log.debug('%s %d %s', req.method, res.statusCode, req.url);
		res.json({
			error: 'Not found'
		});
		return;
});

app.use(function(err, req, res, next){
		res.status(err.status || 500);
		log.error('%s %d %s', req.method, res.statusCode, err.message);
		res.json({
			error: err.message
		});
		return;
});


module.exports = app;
