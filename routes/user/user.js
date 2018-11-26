var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var passport = require('passport');
var User = require('../../models/user');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.redirect('/user/signin');
});

/////////////// GETS //////////////
// alternative signin and signup pages via without web graphics design
router.get('/signup', User.notLoggedIn, function(req, res, next) {
	res.redirect('/signup'); // web sign up
	// var messages = req.flash('error');
	// res.render('user/signup', { title: 'SignUp', position: 'text-center', csrfToken: req.csrfToken, messages: messages, hasErrors: messages.length > 0 });
});

router.get('/signin', User.notLoggedIn, function(req, res, next) {
	res.redirect('/signin'); // web sign in
	// var messages = req.flash('error');
	// res.render('user/signin', { title: 'SignIn', position: 'text-center', csrfToken: req.csrfToken, messages: messages, hasErrors: messages.length > 0 });
});

////////////// POSTS /////////////

// post action to sign up using passport
router.post('/signup', User.notLoggedIn, passport.authenticate('local.signup', {
	successRedirect: '/giveaway/',
	failureRedirect: '/signup', // redirect to designed '/signup page' else /user/signup
	failureFlash: true
}));

// post action to sign in using passport
router.post('/signin', User.notLoggedIn, passport.authenticate('local.signin', {
	failureRedirect: '/signin', // redirect to designed '/signin page' else /user/signin
	failureFlash: true
	}), function(req, res) {
			if (req.user.isAdmin === true) {
				res.redirect('/ausers/');
			}
			if (req.user.isAdmin === false) {
				res.redirect('/giveaway/');
			}
		}
);

router.get('/logout', User.isLoggedIn, function(req, res, next) {
	req.logout();
	res.redirect('/signin'); // redirect to designed '/signin page' else /user/signin
});

module.exports = router;
