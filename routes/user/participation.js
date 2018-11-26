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
var Giveaways = require('../../models/giveaways');
var Challenges = require('../../models/challenges');
var oneTicket = Ticket.ticketCost();

router.use(csrfProtection);

/* GET users listing. */
router.get('/', User.isLoggedIn, function(req, res, next) {
	res.redirect("/participation/giveaways");
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
				price: doc.price, 
				starts: doc.starts, 
				stops: doc.stops, 
				joined: moment(doc.joined).startOf('hour').calendar() 
			}
			res.render('user/challenges', { title: 'Challenges++', csrfToken: req.csrfToken, challenges: docEdit });
		}
	});
});

// display all giveaways
router.get('/giveaways', User.isLoggedIn, function(req, res, next) {
	Giveaways.findOne({'active':true}).sort({'_id': -1}).exec(function(err, doc){
		if(doc == null){
			res.render('user/giveaways', { title: 'No Giveaways!', csrfToken: req.csrfToken });
		}else{
			// get all my cliques in which i am a member to
			Members.find({"userId":req.user}, function(err, files){
				var arr = [];
				if(files == null){
					// if am currently cliqueless
					arr.push();
				}else{
					// get all my associated cliques
					for(var i = 0; i < files.length; i++){
						arr.push(files[i].cliqueEmail);
					}
				}
				docEdit = {
					id: doc.id, 
					gfgid: doc.gfgid, 
					title: doc.title, 
					price: doc.price, 
					cost: parseInt(doc.cost * oneTicket, 10), 
					allWinners: doc.allWinners, 
					duration: doc.duration, 
					starts: doc.starts, 
					stops: doc.stops, 
					active: doc.active == true ? "Yes" : "No", 
					joined: moment(doc.joined).startOf('hour').calendar(), 
					cliques: arr
				}

				//////////////////////////////////////////////////////
				/////////////// GENERATE WINNERS! ////////////////////
				//////////////////////////////////////////////////////
				/*
				*	automatically generate and display nominees and  
				*	winners if the current time is greater than 
				*	doc.stops time.
				*/
				var currentTime = Date.now();
				var insertBtn;
				var showResults;
				if(currentTime > doc.stops){

					insertBtn = false; // disable the insert button to avoid new participations
					showResults = true; // display the result sheets
					var parArr = [];
					var parCounter = 1;
					var parTotal = doc.participants.length; // total participants
					var pickedNomArr = []; // holds selected integers from nominees gen()
					var pickedWinArr = []; // holds selected integers from winners gen()
					var nomArr = []; // holds the new selected values from participants for nominees
					var winArr = []; // holds the new selected values from nominees for winners

					for(var i = 0; i < parTotal; i++){ // display all the participants
						var parObj = {
							counter: parCounter, 
							mode: doc.participants[i].mode, 
							userEmail: doc.participants[i].userEmail, 
							dated: moment(doc.dated).startOf('hour').calendar(), 
						}
						parArr.push(parObj);
						parCounter++;
					}

					/////////////////////////////////////////////
					////////////// NOMINEES STARTS //////////////
					/////////////////////////////////////////////
					var nomPercentage = Math.round((50/100) * parTotal); // 50% of total participants
					nomPercentage = nomPercentage < 1 ? 1 : nomPercentage; // be 1 if nomPercentage is less than 0

					var genNom = rn.generator({ // random number gen engine
						min:  0, // start from zero to include first participation entry
						max:  parTotal - 1, // subtract one to include last participation entry
						integer: true
					});

					for(var j = 0; j < nomPercentage; j++){ // run loop for nomPercentage times
						pickedNomArr.push(genNom()); // insert newly picked gen rand numbers
					}

					for(var k = 0; k < pickedNomArr.length; k++){ // extract the values of the picked array and save its value as new nominee
						newNomineesObj = { // new nominees object and values
							mode: doc.participants[pickedNomArr[k]].mode, 
							userId: doc.participants[pickedNomArr[k]].userId, 
							userEmail: doc.participants[pickedNomArr[k]].userEmail 
						};
						nomArr.push(newNomineesObj);
					}

					if(doc.nominated == false){ // only save nominees once if value is false
						doc.nominees = nomArr; // save new nominees via array
						doc.nominated = true; // set to true to disallow overwrites
						doc.save(function(err, result){
							if(err){
								res.render('error.hbs', {heading: "Warning!", note: err.message});
							}
						});
					}
					/////////////////////////////////////////////
					////////////// NOMINEES STOPS! //////////////
					/////////////////////////////////////////////

					/////////////////////////////////////////////
					////////////// WINNERS STARTS! //////////////
					/////////////////////////////////////////////

					var nomTotal = doc.nominees.length; // total nominees
					var allowedWinners = doc.allWinners; // allowed winners

					var genWin = rn.generator({ // random number gen engine
						min:  0, // start from zero to include first nominee entry
						max:  nomTotal - 1, // subtract one to include last nominee entry
						integer: true
					});

					for(var l = 0; l < allowedWinners; l++){
						pickedWinArr.push(genWin()); // insert newly picked gen rand numbers
					}

					for(var m = 0; m < pickedWinArr.length; m++){ // extract the values of the picked array and save its value as new winners						
						newWinnersObj = { // new winners object and values
							mode: doc.nominees[pickedWinArr[m]].mode, 
							userId: doc.nominees[pickedWinArr[m]].userId, 
							userEmail: doc.nominees[pickedWinArr[m]].userEmail 
						};
						winArr.push(newWinnersObj);
					}

					if(doc.won == false){ // only save winners once if value is false
						doc.winner = winArr; // save new winners via array
						doc.won = true; // set to true to disallow overwrites
						doc.save(function(err, result){
							if(err){
								res.render('error.hbs', {heading: "Warning!", note: err.message});
							}
						});
					}
					/////////////////////////////////////////////
					////////////// WINNERS STOPS! ///////////////
					/////////////////////////////////////////////

				}else{
					// if the countdown is still ongoing be temporarily empty
					insertBtn = true;
					showResults = false; // hide the result sheets
					var parArr = [];
					var nomArr = [];
					var winArr = [];
				}

				/////////////////////////////////////////////
				////////// SHOW RESULTS FROM DB! ////////////
				/////////////////////////////////////////////
				if(showResults == true){
					var showNomArr = [];
					var nomCounter = 1;
					var showWinArr = [];
					var winCounter = 1;
					
					// get results from db for nominees
					for(var n = 0; n < doc.nominees.length; n++){ 
						newNomObj = { 
							counter: nomCounter, 
							mode: doc.nominees[n].mode, 
							userId: doc.nominees[n].userId, 
							userEmail: doc.nominees[n].userEmail, 
							dated: moment(doc.nominees[n].dated).startOf('hour').calendar(), 
						};
						showNomArr.push(newNomObj);
						nomCounter++;
					}

					// get results from db for winners
					for(var p = 0; p < doc.winner.length; p++){ 
						newWinObj = { 
							mainGiveawayId: doc.id,
							counter: winCounter, 
							mode: doc.winner[p].mode, 
							userId: doc.winner[p].userId, 
							userEmail: doc.winner[p].userEmail, 
							dated: moment(doc.winner[p].dated).startOf('hour').calendar(), 
						};
						showWinArr.push(newWinObj);
						winCounter++;
					}
				}

				// transport all to be displayed to views page
				res.render('user/giveaways', { title: 'Giveaways+', csrfToken: req.csrfToken, giveaways: docEdit, insertBtn: insertBtn, showResults: showResults, participants: parArr, nominees: showNomArr, winners: showWinArr });
			});
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
		res.redirect('/participation/challenges');
	}else{
		//place create statement here
		Challenges.findById(challengesId, function(err, doc){
			if(doc == null){
				// if challenge is not found
				req.flash("error_msg", 'Challenge not available yet, check back soon!');
				res.redirect('/participation/challenges');
			}
			else{
				// get my ticket balance
				Ticket.findOne({'userId':req.user}, function(err, file){
					if(file == null){
						// flash insufficient ticket balance
						req.flash("error_msg", "Please first top-up your ticket to proceed. Click Resources >> Tickets");
						res.redirect('/participation/challenges');
					}else{
						var oldBalance = file.balance;
						var ticketCost = parseInt(doc.cost * oneTicket, 10);

						if(oldBalance >= ticketCost){
							var newBalance = parseInt(oldBalance - ticketCost, 10);
							file.balance = newBalance;
							// update ticket balance
							file.save(function(err, result){
								var proceed = true;

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
										res.redirect('/participation/challenges');
									}
								});
							});
						}else{
							// flash insufficient ticket balance
							req.flash("error_msg", 'Insufficient ticket balance to participate, kindly top-up and try again. Click Resources >> Tickets');
							res.redirect('/participation/challenges');
						}
					}
				});
			}
		});
	}
});

// post for giveaways
router.post('/giveaways', User.isLoggedIn, function(req, res, next) {
	// receieve the input values
	var pMode = xss(req.body.pMode);
	var giveawayId = xss(req.body.giveawayId);

	// Validation
	req.checkBody('pMode', 'Select your mode of participation (individual/clique)').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/participation/giveaways');
	}else{
		//place create statement here
		Giveaways.findById(giveawayId, function(err, doc){
			if(doc == null){
				// if giveaway is not found
				req.flash("error_msg", 'Giveaway not available yet, check back soon!');
				res.redirect('/participation/giveaways');
			}
			else{
				// get my ticket balance
				Ticket.findOne({'userId':req.user}, function(err, file){
					if(file == null){
						// flash insufficient ticket balance
						req.flash("error_msg", "Please first top-up your ticket to proceed. Click Resources >> Tickets");
						res.redirect('/participation/giveaways');
					}else{
						var oldBalance = file.balance;
						var ticketCost = parseInt(doc.cost * oneTicket, 10);

						if(oldBalance >= ticketCost){
							var newBalance = parseInt(oldBalance - ticketCost, 10);
							file.balance = newBalance;
							// update ticket balance
							file.save(function(err, result){
								var proceed = true;

								// now make one insertion of the participants email
								var newEntryObj = {
									mode: pMode, 
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
										req.flash("success_msg", `${pMode} made one successful entry, current balance is ${newBalance} ticket(s)`);
										res.redirect('/participation/giveaways');
									}
								});
							});
						}else{
							// flash insufficient ticket balance
							req.flash("error_msg", 'Insufficient ticket balance to participate, kindly top-up and try again. Click Resources >> Tickets');
							res.redirect('/participation/giveaways');
						}
					}
				});
			}
		});
	}
});

module.exports = router;