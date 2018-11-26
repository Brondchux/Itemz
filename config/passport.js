var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var xss = require("xss");
var User = require('../models/user');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use('local.signup', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
}, function(req, email, password, done){
	var email = xss(email);
	var password = xss(password);
	req.checkBody('email', 'Invalid email!').notEmpty().isEmail();
	req.checkBody('password', 'Invalid password!').notEmpty().isLength({min: 2});
	var errors = req.validationErrors();
	if(errors){
		var messages = [];
		errors.forEach(function(error){
			messages.push(error.msg);
		});
		return done(null, false, req.flash('error', messages));
	};
	User.findOne({'email': email}, function(err, user){
		if(err){
			return done(err);
		}
		if(user){
			return done(null, false, {message: 'Email is already in use!'});
		}
		var newUser = new User();
		newUser.email = email;
		newUser.password = newUser.encryptPassword(password);
		newUser.save(function(err, result){
			if(err){
				return done(err);
			}else{
				return done(null, newUser);
			}
		});
	});
}));

passport.use('local.signin', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
}, function(req, email, password, done){
	var email = xss(email);
	var password = xss(password);
	req.checkBody('email', 'Invalid email!').notEmpty().isEmail();
	req.checkBody('password', 'Invalid password!').notEmpty();
	var errors = req.validationErrors();
	if(errors){
		var messages = [];
		errors.forEach(function(error){
			messages.push(error.msg);
		});
		return done(null, false, req.flash('error', messages));
	};
	User.findOne({'email': email}, function(err, user){
		if(err){
			return done(err);
		}
		if(!user){
			return done(null, false, {message: 'No user found! Proceed to signup'});
		}
		if(!user.validPassword(password)){
			return done(null, false, {message: 'Wrong email/password combination!'});
		}
		return done(null, user);
	});
}));