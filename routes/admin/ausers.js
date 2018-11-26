var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var xss = require('xss');
var moment = require('moment');
var User = require('../../models/user');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.redirect('/ausers/search');
});

/////////////// GETS //////////////

router.get('/search', User.isLoggedIn, function(req, res, next) {
	var search = xss(req.query.search);
	if(search.length !== 0){
		// very deep extensive user search
		var bait = new RegExp(User.escapeRegex(search), 'gi');
		User.find().or([
			{ 'firstname': { $regex: bait }}, 
			{ 'lastname': { $regex: bait }}, 
			{ 'email': { $regex: bait }}, 
			{ 'phone': { $regex: bait }}, 
			{ 'bank': { $regex: bait }}, 
			{ 'accNum': { $regex: bait }}, 
			{ 'accName': { $regex: bait }}, 
			{ 'invitation': { $regex: bait }}, 
			{ 'instagram': { $regex: bait }}, 
			{ 'facebook': { $regex: bait }}, 
			{ 'twitter': { $regex: bait }} 
			]).exec(function(err, docs) {
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					firstname: docs[i].firstname, 
					lastname: docs[i].lastname, 
					email: docs[i].email, 
					phone: docs[i].phone, 
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/search', { title: 'Search', csrfToken: req.csrfToken, found: arr, foundTotal: docs.length });
		});
	}else{
		res.render('admin/search', { title: 'Search', csrfToken: req.csrfToken });
	}
});

router.get('/search/:viewId', User.isLoggedIn, function(req, res, next) {
	var viewId = xss(req.params.viewId);
	User.findById(viewId, function(err, doc) {
		if(doc !== null){
			var docEdit = {
				id: doc.id, 
				firstname: doc.firstname, 
				lastname: doc.lastname, 
				email: doc.email, 
				phone: doc.phone, 
				bank: doc.bank, 
				accNum: doc.accNum, 
				accName: doc.accName, 
				invitation: doc.invitation, 
				instagram: doc.instagram, 
				facebook: doc.facebook, 
				twitter: doc.twitter, 
				updated: doc.updated, 
				bankSts: doc.bankSts, 
				isAdmin: doc.isAdmin, 
				isUser: doc.isUser, 
				active: doc.active, 
				joined: moment(doc.joined).format("LL")
			}
			res.render('admin/search', { title: 'Search', csrfToken: req.csrfToken, view: docEdit });
		}else{
			res.render('admin/search', { title: 'Search', csrfToken: req.csrfToken });
		}
	});
});

router.get('/records', User.isLoggedIn, function(req, res, next) {
	User.find({}).sort({'firstname': 1}).exec(function(err, docs){
		if(docs.length != 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					firstname: docs[i].firstname, 
					lastname: docs[i].lastname, 
					email: docs[i].email, 
					phone: docs[i].phone, 
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/records', { title: 'Records', csrfToken: req.csrfToken, records: arr, totalRecords: docs.length });
		}else{
			res.render('admin/records', { title: 'No Record!', csrfToken: req.csrfToken });
		}
	});
});

////////////// POSTS /////////////

// post for reset user
router.post('/resetUser', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var hdUserId = xss(req.body.hdUserId);

	// Validation
	req.checkBody('hdUserId', 'User is required!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/ausers/search/' + hdUserId);
	}else{
		User.findById(hdUserId, function(err, doc){
			if(doc !== null){
				doc.firstname = "";
				doc.lastname = "";
				doc.phone = "";
				doc.bank = "";
				doc.accNum = "";
				doc.accName = "";
				doc.updated = false;
				doc.bankSts = false;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", `Reset successful for user ${doc.email} !`);
						res.redirect('/ausers/search/' + hdUserId);
					}
				});
			}else{
				req.flash("error_msg", `Record for user ${doc.email} not found!`);
				res.redirect('/ausers/search/' + hdUserId);
			}
		});
	}
});

// post for activate user
router.post('/activateUser', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var hdUserId = xss(req.body.hdUserId);

	// Validation
	req.checkBody('hdUserId', 'User is required!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/ausers/search/' + hdUserId);
	}else{
		User.findById(hdUserId, function(err, doc){
			if(doc !== null){
				doc.active = true;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", `Activation successful for user ${doc.email} !`);
						res.redirect('/ausers/search/' + hdUserId);
					}
				});
			}else{
				req.flash("error_msg", `Record for user ${doc.email} not found!`);
				res.redirect('/ausers/search/' + hdUserId);
			}
		});
	}
});

// post for deactivate user
router.post('/deactivateUser', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var hdUserId = xss(req.body.hdUserId);

	// Validation
	req.checkBody('hdUserId', 'User is required!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/ausers/search/' + hdUserId);
	}else{
		User.findById(hdUserId, function(err, doc){
			if(doc !== null){
				doc.active = false;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", `Deactivation successful for user ${doc.email} !`);
						res.redirect('/ausers/search/' + hdUserId);
					}
				});
			}else{
				req.flash("error_msg", `Record for user ${doc.email} not found!`);
				res.redirect('/ausers/search/' + hdUserId);
			}
		});
	}
});


// post for deleteUser
router.post('/deleteUser', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var hdUserId = xss(req.body.hdUserId);

	// Validation
	req.checkBody('hdUserId', 'User is required!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/ausers/search/' + hdUserId);
	}else{
		User.deleteOne({'_id': hdUserId}, function(err, doc){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash("success_msg", `User (${hdUserId}) deleted successfully!`);
				res.redirect('/ausers/search/' + hdUserId);
			}
		});
	}
});

// post for loginAsUser
router.post('/loginAsUser', User.isLoggedIn, function(req, res, next) {
	req.flash("error_msg", 'You are yet to fix me to signIn!');
	res.redirect('/ausers/search');
});

module.exports = router;