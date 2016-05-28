var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var mongoose = require('mongoose');
var async = require('async');
var config = require(libs + 'config');
var User = require('../model/user');

var authcontroller = require(libs + 'auth/auth');
var peopleController = require(libs + 'controllers/people');
var validate = require(libs + 'controllers/validate');

var stripe = require("stripe")(config.get("stripe:key"));

router.post('/token', function(req, res) {
	var stripeToken = req.body.token;

	async.waterfall([
		function (callback) {
			User.findOne({'_id': req.user._id}, function (err, found){
				if (err)
					return res.send({ error: '404', message: err });

				if (found) {
					return callback(null, found);
				} else {
					return res.send({ error: '404', message: err });
				}
			});
		},
		function(found, callback){
			stripe.customers.createSource(found.plan.customer, {
				source : stripeToken
			}, function(err, customer) {
				if (err)
					return callback(true, err)

					return callback(null, customer)
				}
			);
		}
	], function (err, result) {
		if (!err) {
			return res.send('Card has been added')
		} else {
			return res.send({ error: '404', message: result });
		}
	});

});

module.exports = router;
