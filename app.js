var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var validator = require('express-validator');

// all route pages must be declared and assigned to variables here
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user/user');

var app = express();

mongoose.connect("mongodb://localhost:27017/itemz");

// pull in passport configuration to enable user login/logout
require('./config/passport');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(validator());

app.use(passport.initialize());
app.use(passport.session());

// static folder
app.use('/public', express.static('public'));

// Global Vars
app.use(function(req, res, next){
	res.locals.login = req.isAuthenticated();
	res.locals.session = req.session;
	res.locals.user = req.user || null; // for users access control
	next();
});

// all route variables are used here to tie to a route url /example
app.use('/user', userRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;