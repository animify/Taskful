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
			to: 'st.mansson@icloud.com',
			subject: 'Password Reset'
		}, {
			name: options.fullname.split(' ')[0],
			email: options.email,
			token: options.token,
			host: options.host
		}, function(err, info){
			if(err){
				 console.log(err);
			}else{
					console.log('Password reminder sent');
			}
		});
	}
};
