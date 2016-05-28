var express = require('express');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');

var stripe = require("stripe")(config.get("stripe:key"));

router.post('/', function(req, res, next) {

	if(req.body.object!=='event') {
		return res.send(400);
	}

	stripe.events.retrieve(req.body.id, function(err, event){

		if(err || !event) {
			return res.send(401);
		}

		req.modeled.stripeEvent = event;
		next();
	});
}, function(req, res) {
	var o, event = req.modeled.stripeEvent;

	if(event.type==='charge.succeeded') {
		o = event.data.object;

		console.log(event.type)
	}
	else {
		console.log("unhandled stripe event", event.type);
	}
	res.send(200);
});

module.exports = router;
