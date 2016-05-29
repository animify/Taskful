var express = require('express');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');

var mailer = require('../controllers/mail');

var stripe = require("stripe")(config.get("stripe:key"));

router.post('/stripe', function(req, res) {
	async.waterfall([
		function (callback) {
			if(req.body.object!=='event') {
				return res.sendStatus(400);
			}

			stripe.events.retrieve(req.body.id, function(err, event){
				console.log(req.body.id)
				console.log(event)
				if(err || !event) {
					console.log(err)
					return res.sendStatus(401);
				}

				callback(event);
			});
		}, function(stripeEvent, callback){
			var o, event = stripeEvent;
			console.log(event.type)
			if(event.type==='charge.succeeded') {
				o = event.data.object;
			}
			else {
				console.log("unhandled stripe event", event.type);
			}
			callback(null, event);
		}
	], function (err, result) {
		if (!err) {
			res.sendStatus(200);
		} else {
			res.sendStatus(403);
		}
	});

});

module.exports = router;
