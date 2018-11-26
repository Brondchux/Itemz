var express = require('express');
var router = express.Router();
var xss = require("xss");
var moment = require("moment");
var csrf = require('csurf');
var csrfProtection = csrf();
var rn = require('random-number');

var User = require('../../models/user');
var Members = require('../../models/members');
var Ticket = require('../../models/ticket');
var Statement = require('../../models/statement');
var Challenges = require('../../models/challenges');
var oneTicket = Ticket.ticketCost();

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.redirect("/challenge/challenges");
});

/////////////// GETS //////////////

// display all challenges
router.get('/challenges', User.isLoggedIn, function(req, res, next) {
	Challenges.findOne({'active':true}).sort({'_id': -1}).exec(function(err, doc){
		if(doc == null){
			res.render('user/challenges', { title: 'No Challenge!', csrfToken: req.csrfToken });
		}else{
			// select media handle for the task
			var media = doc.media;
			var handle
			switch (media) {
				case 'instagram':
				handle = req.user.instagram;
				break;
				case 'facebook':
				handle = req.user.facebook;
				break;
				case 'twitter':
				handle = req.user.twitter;
				break;
				handle = "others";
			}
			docEdit = {
				id: doc.id, 
				gfcid: doc.gfcid, 
				title: doc.title, 
				condition: doc.condition, 
				challenge: doc.challenge, 
				extra: doc.extra, 
				media: doc.media, 
				handle: handle, 
				cost: parseInt(doc.cost * oneTicket, 10), 
				allWinners: doc.allWinners, 
				price: doc.price, 
				duration: doc.duration, 
				starts: doc.starts, 
				stops: doc.stops, 
				active: doc.active == true ? "Yes" : "No", 
				joined: moment(doc.joined).startOf('hour').calendar() 
			}

			// if winner has been determined thus won == true
			if(doc.won == true){
				var showResults = true;
				var winArr = [];
				var parArr = [];
				var counter = 1;
				var parCounter = 1;
				var totalWin = doc.winner.length;
				var totalPar = doc.participants.length;
				
				// fetch all participants
				for(var h = 0; h < totalPar; h++){
					parObj = {
						counter: parCounter,
						mainChallengeId: doc.id,
						handle: doc.participants[h].handle,
						media: doc.participants[h].media,
						userId: doc.participants[h].userId,
						userEmail: doc.participants[h].userEmail,
						dated: moment(doc.participants[h].dated).startOf('hour').calendar() 
					}
					parArr.push(parObj);
					parCounter++;
				}

				// fetch all winners
				for(var i = 0; i < totalWin; i++){
					winObj = {
						counter: counter,
						mainChallengeId: doc.id,
						handle: doc.winner[i].handle,
						media: doc.winner[i].media,
						userId: doc.winner[i].userId,
						userEmail: doc.winner[i].userEmail,
						dated: moment(doc.winner[i].dated).startOf('hour').calendar() 
					}
					winArr.push(winObj);
					counter++;
				}
			}else{
				var showResults = false;
				var winArr = [];
				var parArr = [];
				var totalWin = 0;
				var totalPar = 0;
			}
			res.render('user/challenges', { title: 'Challenges++', csrfToken: req.csrfToken, challenges: docEdit, showResults: showResults, participants: parArr, winners: winArr, totalPar: totalPar, totalWin: totalWin });
		}
	});

});

////////////// POSTS /////////////

// post for challenges
router.post('/challenges', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var handle = xss(req.body.handle);
	var challengesId = xss(req.body.challengesId);

	// Validation
	req.checkBody('handle', 'Your social media handle is require!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/challenge/challenges');
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

		//place create statement here
		Challenges.findById(challengesId, function(err, doc){
			if(doc == null){
				// if challenge is not found
				req.flash("error_msg", 'Challenge not available yet, check back soon!');
				res.redirect('/challenge/challenges');
			}
			else{
				// get my ticket balance
				Ticket.findOne({'userId':req.user}, function(err, file){
					if(file == null){
						// flash insufficient ticket balance
						req.flash("error_msg", "Please first top-up your ticket to proceed. Click Resources >> Tickets");
						res.redirect('/challenge/challenges');
					}else{
						var oldBalance = file.balance;
						var ticketCost = parseInt(doc.cost * oneTicket, 10);

						if(oldBalance >= ticketCost){
							var newBalance = parseInt(oldBalance - ticketCost, 10);
							file.balance = newBalance;
							// update ticket balance
							file.save(function(err, result){
								if(err){
									// flash unknown save ticket balance error
									req.flash("error_msg", 'Something went wrong with ticket balance!');
									res.redirect('/challenge/challenges');
								}else{
									var proceed = true;

									// save to ticket statements also
									saveStatement("challenge entry", -ticketCost, newBalance);

									// now make one insertion of the participants email
									var newEntryObj = {
										handle: handle, 
										media: doc.media, 
										userId: req.user, 
										userEmail: req.user.email, 
										cost: ticketCost, // should come from db per challenge
										dated: Date.now()
									};
									doc.participants.push(newEntryObj);
									doc.save(function(err, saved){
										if(err){
											res.render('error.hbs', {heading: "Warning!", note: err.message});
										}else{
											req.flash("success_msg", `${req.user.email} joined successfully, with ${doc.media} handle ${handle}. ${newBalance} ticket(s) left.`);
											res.redirect('/challenge/challenges');
										}
									});
								}
							});
						}else{
							// flash insufficient ticket balance
							req.flash("error_msg", 'Insufficient ticket balance to participate, kindly top-up and try again. Click Resources >> Tickets');
							res.redirect('/challenge/challenges');
						}
					}
				});
			}
		});
	}

});

module.exports = router;