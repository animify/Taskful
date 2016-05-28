var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var config = require(libs + 'config');

var EmailTemplate = require('email-templates').EmailTemplate;
var nodemailer = require('nodemailer');

var smtpConfig = {
		host: 'mail.privateemail.com',
		port: 465,
		secure: true,
		auth: {
				user: 'admin@taskful.io',
				pass: 'activ8r00'
		}
};

var transporter = nodemailer.createTransport(smtpConfig);

module.exports = {
	passwordreset: function(req, res,	options) {

		var sendPasswordReset = transporter.templateSender(new EmailTemplate(libs + 'templates/password_reset'), {
			from: '"Taskful" <admin@taskful.io>',
		});

		sendPasswordReset({
			to: options.email,
			subject: 'Forgot your password?'
		}, {
			email: options.email,
			token: options.token,
			host: options.host
		}, function(err, info){
			if(err){
				 console.log(err);
			} else{
					console.log('Password forgot sent');
			}
		});
	},
	passwordchanged: function(req, res,	options) {

		var sendPasswordChanged = transporter.templateSender(new EmailTemplate(libs + 'templates/password_changed'), {
			from: '"Taskful" <admin@taskful.io>',
		});

		sendPasswordChanged({
			to: options.email,
			subject: 'Your password has changed'
		}, {
			email: options.email,
			token: options.token,
			host: options.host
		}, function(err, info){
			if(err){
				 console.log(err);
			} else{
					console.log('Password changed sent');
			}
		});
	},
	addedcard: function(req, res,	options) {

		var sendCardAdded = transporter.templateSender(new EmailTemplate(libs + 'templates/card_added'), {
			from: '"Taskful" <admin@taskful.io>',
		});

		sendCardAdded({
			to: options.email,
			subject: 'New payment method added'
		}, {
			fullname: options.fullname,
			email: options.email,
			card: options.card,
			host: options.host
		}, function(err, info){
			if(err){
				 console.log(err);
			} else{
					console.log('Card added sent');
			}
		});
	}
};
