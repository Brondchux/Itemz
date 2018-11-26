var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user/user');

var app = express();

mongoose.connect("mongodb://localhost:27017/itemz");
require('./config/passport');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(validator());
app.use(cookieParser());
app.use(session({
	secret: 'mygiantsecret', 
	resave: false, 
	saveUnintialized: false,
	store: new MongoStore({mongooseConnection: mongoose.connection}),
	cookie: { maxAge: 180 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// static folder
app.use('/public', express.static('public'));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function(req, res, next){
	res.locals.error_msg = req.flash('error_msg');
	res.locals.success_msg = req.flash('success_msg');
	res.locals.errors = req.flash('errors');
	res.locals.login = req.isAuthenticated();
	res.locals.session = req.session;
	res.locals.user = req.user || null; // for users access control
	next();
});

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