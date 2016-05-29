var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../model/user');
var mongoose = require('mongoose');

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var authController = require(libs + 'auth/auth');
var db = require(libs + 'db/mongoose');

var config = require(libs + 'config');
var stripe = require("stripe")(config.get("stripe:key"));

router.get('/', function(req, res) {
	var getStripeDetails = function(req, res) {
		return new Promise((resolve, reject) => {
			stripe.customers.retrieve(req.user.plan.customer, function(err, customer) {
				if (err)
					return reject(err);

					return resolve(customer);
				}
			);
		});
	};

	getStripeDetails(req, res)
	.then(customer => {
		var cards = customer.sources.data;
		JSON.stringify(customer);
		JSON.stringify(cards);

		res.render('profile', { user : req.user, customer : customer, cards : cards });
	})
	.catch(err => {
		console.log(err)
	})
});


module.exports = router;
