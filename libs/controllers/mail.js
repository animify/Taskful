var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var config = require(libs + 'config');

var nodemailer = require('nodemailer');

var smtpConfig = {
		host: 'mail.privateemail.com',
		port: 465,
		secure: true, // use SSL
		auth: {
				user: 'admin@taskful.io',
				pass: 'activ8r00'
		}
};
var transporter = nodemailer.createTransport(smtpConfig);

module.exports = {
	passwordreset: function() {
		var mailOptions = {
				from: '"Taskful" <admin@taskful.io>',
				to: 'st.mansson@icloud.com',
				subject: 'Password reset',
				text: 'Hello world',
				html: '<b>Hello world</b>'
		};

		transporter.sendMail(mailOptions, function(error, info){
				if(error){
						return console.log(error);
				}
				console.log('Message sent: ' + info.response);
		});
	}
};
