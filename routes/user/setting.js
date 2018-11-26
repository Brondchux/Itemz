var express = require('express');
var router = express.Router();
var xss = require("xss");
var moment = require("moment");
var bcrypt = require("bcrypt-nodejs");
var csrf = require('csurf');
var csrfProtection = csrf();

var User = require('../../models/user');
var Ticket = require('../../models/ticket');
var Statement = require('../../models/statement');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	// check if user profile is updated
	res.redirect("/profile");
});

/////////////// GETS //////////////

router.get('/profile', User.isLoggedIn, function(req, res, next) {
	var docEdit = {
		firstname: req.user.firstname, 
		lastname: req.user.lastname, 
		phone: req.user.phone, 
		facebook: req.user.facebook, 
		instagram: req.user.instagram, 
		twitter: req.user.twitter, 
		active: req.user.active, 
		joined: moment(req.user.joined).format("LL") 
	};
	res.render('user/profile', { title: 'Update Profile', csrfToken: req.csrfToken, profile: docEdit });
});

router.get('/bank', User.isLoggedIn, function(req, res, next) {
	var docEdit = {
		bank: req.user.bank, 
		accNum: req.user.accNum, 
		accName: req.user.accName, 
		atm: req.user.atm 
	};
	res.render('user/bank', { title: 'Update Bank', csrfToken: req.csrfToken, profile: docEdit });
});

router.get('/invitation', User.isLoggedIn, function(req, res, next) {
	var docEdit = {
		invitation: req.user.invitation 
	};
	res.render('user/invitation', { title: 'Update Invitation', csrfToken: req.csrfToken, profile: docEdit });
});

router.get('/password', User.isLoggedIn, function(req, res, next) {
	res.render('user/password', { title: 'Change Password', csrfToken: req.csrfToken, position: "text-center" });
});

////////////// POSTS /////////////

// post to update profile details
router.post('/profile', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var firstname = xss(req.body.firstname);
	var lastname = xss(req.body.lastname);
	var phone = xss(req.body.phone);
	var instagram = xss(req.body.instagram);
	var facebook = xss(req.body.facebook);
	var twitter = xss(req.body.twitter);
	
	// Validation
	req.checkBody('firstname', 'First Name is required').notEmpty(); 
	req.checkBody('lastname', 'Last Name is required').notEmpty(); 
	req.checkBody('phone', 'Phone Number is required').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/setting/profile');
	}else{
		// place update statement here
		User.findOne({'_id':req.user}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "User not found!");
				res.redirect('/setting/profile');
			}else{
				doc.firstname = firstname;
				doc.lastname = lastname;
				doc.phone = phone;
				doc.instagram = instagram;
				doc.facebook = facebook;
				doc.twitter = twitter;
				doc.updated = true;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", "Changes saved!");
						res.redirect('/setting/profile');
					}
				});
			}
		});
	}

});

// post to update bank details
router.post('/bank', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var bank = xss(req.body.bank);
	var accNum = xss(req.body.accNum);
	var accName = xss(req.body.accName);

	// Validation
	req.checkBody('bank', 'Select your bank!').notEmpty(); 
	req.checkBody('accNum', 'Accont number is required').notEmpty(); 
	req.checkBody('accName', 'Accont Name is required').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/setting/bank');
	}else{
		// place update statement here
		User.findOne({'_id':req.user}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "User not found!");
				res.redirect('/setting/bank');
			}else{
				doc.bank = bank;
				doc.accNum = accNum;
				doc.accName = accName;
				doc.bankSts = true;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", "Changes saved!");
						res.redirect('/setting/bank');
					}
				});
			}
		});
	}
});

// post to reset bank details
router.post('/resetBank', User.isLoggedIn, function(req, res, next){
	// place update statement here
	User.findOne({'_id':req.user}, function(err, doc){
		if(doc == null){
			req.flash("error_msg", "User not found!");
			res.redirect('/setting/bank');
		}else{
			// save statement function [topup, bank reset, challange, giveaway]
			function saveStatement(narration, cost, balance){
				Statement.findOne({'userId': req.user}, function(err, doc){
					if(doc !== null){
						// only update the breakdown for the user created when obtaining tickets
						var obj = {
							narration: narration, 
							cost: cost, 
							balance: balance 
						}
						doc.breakdown.push(obj);
						doc.save(function(err, done){
							if(err){
								return done(err)
							};
							//return done;
						});
					}
				});
			}

			// get my ticket balance
			Ticket.findOne({'userId':req.user}, function(err, file){
				if(file == null){
					// flash insufficient ticket balance
					req.flash("error_msg", "You need to first top-up your ticket to proceed. Click Resources >> Tickets");
					res.redirect('/setting/bank');
				}else{
					var oldBalance = file.balance;
					var ticketCost = Ticket.ticketCost();

					if(oldBalance >= ticketCost){
						var newBalance = parseInt(oldBalance - ticketCost, 10);
						file.balance = newBalance;
						// update ticket balance
						file.save(function(err, result){
							var proceed = true;
							
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
									// save to ticket statements also
									saveStatement("bank reset", -ticketCost, newBalance);

									req.flash("success_msg", `Bank and profile reset successful! Your balance is ${newBalance} Tickets`);
									res.redirect('/setting/bank');
								}
							});
						});
					}else{
						// flash insufficient ticket balance
						req.flash("error_msg", 'Sorry, you have insufficient balance, kindly top-up and try again.');
						res.redirect('/setting/bank');
					}
				}
			});
		}
	});
});

// post to update password
router.post('/password', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var cpassword = xss(req.body.cpassword);
	var npassword = xss(req.body.npassword);
	var rpassword = xss(req.body.rpassword);

	// Validation
	req.checkBody('cpassword', 'Current password is required').notEmpty(); 
	req.checkBody('npassword', 'New password is required! Min. 6 Chars').notEmpty().isLength({min: 2}); 
	req.checkBody('rpassword', 'Repeat password is required').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/setting/password');
	}else{
		// place update statement here
		User.findOne({'_id':req.user}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "User not found!");
				res.redirect('/setting/password');
			}else{
				if(!doc.validPassword(cpassword)){
					req.flash("error_msg", "Wrong password!");
					res.redirect('/setting/password');
				}
				else if(npassword !== rpassword){
					req.flash("error_msg", "Passwords do not match!");
					res.redirect('/setting/password');
				}else{
					doc.password = doc.encryptPassword(npassword);
					doc.save(function(err, result){
						if(err){
							res.render('error.hbs', {heading: "Warning!", note: err.message});
						}else{
							req.flash("success_msg", "Password Changed!");
							res.redirect('/user/logout');
						}
					});
				}
			}
		});
	}
});

// post to update invitation details
router.post('/invitation', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var invitation = xss(req.body.invitation);

	// Validation
	req.checkBody('invitation', 'Invitation email is required').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/setting/invitation');
	}else{
		// place update statement here
		User.findOne({'_id':req.user}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "User not found!");
				res.redirect('/setting/invitation');
			}else{
				doc.invitation = invitation;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", "Changes saved!");
						res.redirect('/user/invitation');
					}
				});
			}
		});
	}
});

module.exports = router;