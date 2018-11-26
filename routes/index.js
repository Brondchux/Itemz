var express = require('express');
var router = express.Router();
var xss = require("xss");
var csrf = require('csurf');
var csrfProtection = csrf();
var nodemailer = require('nodemailer');
var User = require('../models/user');

router.use(csrfProtection);

/* Website default pages and links to other pages */
router.get('/', function(req, res, next) {
	// redirect to home page
	res.render('web/index', {title: "Gospels Foundation", layout: 'layout.hbs', breadcrumb: true});
});

router.get('/signup', User.notLoggedIn, function(req, res, next) {
	var messages = req.flash('error');
	// redirect to signin page
	res.render('web/signup', { title: 'Sign Up', layout: 'layout.hbs', csrfToken: req.csrfToken, messages: messages, hasErrors: messages.length > 0 });
});

router.get('/signin', User.notLoggedIn, function(req, res, next) {
	var messages = req.flash('error');
	// redirect to signup page
	res.render('web/signin', { title: 'Sign In', layout: 'layout.hbs', csrfToken: req.csrfToken, messages: messages, hasErrors: messages.length > 0 });
});

////////////// POSTS /////////////

module.exports = router;