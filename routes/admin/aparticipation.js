var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var xss = require('xss');
var moment = require('moment');
var User = require('../../models/user');
var Challenges = require('../../models/challenges');
var Giveaways = require('../../models/giveaways');
var Winner = require('../../models/winner');

router.use(csrfProtection);

/* GET users listing. */ 
router.get('/', function(req, res, next) {
	res.redirect('');
});

/////////////// GETS //////////////

// display all challenges
router.get('/challenges', User.isLoggedIn, function(req, res, next) {
	Challenges.find({'active': true}).sort({'_id': -1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){	
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					gfcid: docs[i].gfcid, 
					title: docs[i].title, 
					condition: docs[i].condition, 
					challenge: docs[i].challenge, 
					extra: docs[i].extra, 
					media: docs[i].media, 
					price: docs[i].price, 
					cost: docs[i].cost, 
					allWinners: docs[i].allWinners, 
					duration: docs[i].duration, 
					starts: docs[i].starts, 
					stops: docs[i].stops, 
					active: docs[i].active == true ? "Yes" : "No", 
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/challenges', { title: 'Challenges', csrfToken: req.csrfToken, newChallenge: true, challenges: arr, totalChallenges: docs.length });
		}else{
			res.render('admin/challenges', { title: 'No Challenge!', csrfToken: req.csrfToken, newChallenge: true });
		}	
	});
});

// display a requested challenge
router.get('/challenges/:id', User.isLoggedIn, function(req, res, next) {
	var challengeId = xss(req.params.id);
	Challenges.findById(challengeId, function(err, doc) {
		if(doc !== null){
			var counter = 1;
			var parCounter = 1;
			var nomCounter = 1;
			var winCounter = 1;
			
			// edit participants array
			var arrPar = [];
			for(var i = 0; i < doc.participants.length; i ++){
				parEdit = {
					mainChallengeId: doc.id, 
					counter: parCounter, 
					handle: doc.participants[i].handle, 
					media: doc.participants[i].media, 
					userId: doc.participants[i].userId, 
					userEmail: doc.participants[i].userEmail, 
					cost: doc.participants[i].cost, 
					dated: moment(doc.participants[i].dated).format("LL")
				}
				arrPar.push(parEdit);
				parCounter++;
			}

			// edit nominees array
			var arrNom = [];
			for(var i = 0; i < doc.nominees.length; i ++){
				nomEdit = {
					counter: nomCounter, 
					handle: doc.nominees[i].handle, 
					media: doc.nominees[i].media, 
					userId: doc.nominees[i].userId, 
					userEmail: doc.nominees[i].userEmail, 
					dated: moment(doc.nominees[i].dated).format("LL")
				}
				arrNom.push(nomEdit);
				nomCounter++;
			}

			// edit winner array
			var arrWin = [];
			for(var i = 0; i < doc.winner.length; i ++){
				winEdit = {
					counter: winCounter, 
					handle: doc.winner[i].handle, 
					media: doc.winner[i].media, 
					userId: doc.winner[i].userId, 
					userEmail: doc.winner[i].userEmail, 
					dated: moment(doc.winner[i].dated).format("LL")
				}
				arrWin.push(winEdit);
				winCounter++;
			}

			var docEdit = {
				counter: counter, 
				id: doc.id, 
				gfcid: doc.gfcid, 
				title: doc.title, 
				condition: doc.condition, 
				challenge: doc.challenge, 
				extra: doc.extra, 
				media: doc.media, 
				price: doc.price, 
				cost: doc.cost, 
				allWinners: doc.allWinners, 
				duration: doc.duration, 
				starts: doc.starts, 
				stops: doc.stops, 
				active: doc.active == true ? "Yes" : "No", 
				participants: arrPar,
				nominees: arrNom,
				winner: arrWin,
				joined: moment(doc.joined).format("LL")
			}
			//counter++;
			res.render('admin/challenges', { title: `Challenge ${docEdit.gfcid}`, csrfToken: req.csrfToken, aChallenge: docEdit, totalPar: doc.participants.length, totalNom: doc.nominees.length, totalWin: doc.winner.length });
		}else{
			res.render('admin/challenges', { title: 'No Challenge!', csrfToken: req.csrfToken });
		}	
	});
});

// display all giveaways
router.get('/giveaways', User.isLoggedIn, function(req, res, next) {
	Giveaways.find({'active': true}).sort({'_id': -1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){	
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					gfgid: docs[i].gfgid, 
					title: docs[i].title, 
					price: docs[i].price, 
					cost: docs[i].cost, 
					allWinners: docs[i].allWinners, 
					duration: docs[i].duration, 
					starts: docs[i].starts, 
					stops: docs[i].stops, 
					active: docs[i].active == true ? "Yes" : "No", 
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/giveaways', { title: 'Giveaways', csrfToken: req.csrfToken, newGiveaway: true, giveaways: arr, totalGiveaways: docs.length });
		}else{
			res.render('admin/giveaways', { title: 'No Giveaway!', csrfToken: req.csrfToken, newGiveaway: true });
		}	
	});
});

// display a requested giveaway
router.get('/giveaways/:id', User.isLoggedIn, function(req, res, next) {
	var giveawaysId = xss(req.params.id);
	Giveaways.findById(giveawaysId, function(err, doc) {
		if(doc !== null){
			var counter = 1;
			var parCounter = 1;
			var nomCounter = 1;
			var winCounter = 1;
			var sumCost = 0;
			
			// edit participants array
			var arrPar = [];
			for(var i = 0; i < doc.participants.length; i ++){
				parEdit = {
					counter: parCounter, 
					mode: doc.participants[i].mode, 
					userId: doc.participants[i].userId, 
					userEmail: doc.participants[i].userEmail, 
					cost: doc.participants[i].cost, 
					dated: moment(doc.participants[i].dated).format("LL")
				}
				arrPar.push(parEdit);
				parCounter++;
				sumCost +=  parEdit.cost;
			}

			// edit nominees array
			var arrNom = [];
			for(var i = 0; i < doc.nominees.length; i ++){
				nomEdit = {
					counter: nomCounter, 
					mode: doc.nominees[i].mode, 
					userId: doc.nominees[i].userId, 
					userEmail: doc.nominees[i].userEmail, 
					dated: moment(doc.nominees[i].dated).format("LL")
				}
				arrNom.push(nomEdit);
				nomCounter++;
			}

			// edit winner array
			var arrWin = [];
			for(var i = 0; i < doc.winner.length; i ++){
				winEdit = {
					counter: winCounter, 
					mode: doc.winner[i].mode, 
					userId: doc.winner[i].userId, 
					userEmail: doc.winner[i].userEmail, 
					dated: moment(doc.winner[i].dated).format("LL")
				}
				arrWin.push(winEdit);
				winCounter++;
			}

			var docEdit = {
				counter: counter, 
				id: doc.id, 
				gfgid: doc.gfgid, 
				title: doc.title, 
				price: doc.price, 
				cost: doc.cost, 
				allWinners: doc.allWinners, 
				duration: doc.duration, 
				starts: doc.starts, 
				stops: doc.stops, 
				active: doc.active == true ? "Yes" : "No", 
				participants: arrPar,
				nominees: arrNom,
				winner: arrWin,
				joined: moment(doc.joined).format("LL")
			}
			//counter++;
			res.render('admin/giveaways', { title: `Giveaway ${docEdit.gfgid}`, csrfToken: req.csrfToken, aGiveaway: docEdit, totalPar: doc.participants.length, sumCost: sumCost, totalNom: doc.nominees.length, totalWin: doc.winner.length });
		}else{
			res.render('admin/giveaways', { title: 'No Giveaway!', csrfToken: req.csrfToken });
		}	
	});
});

////////////// POSTS /////////////

// post to add new challenges by admin
router.post('/challenges', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var title = xss(req.body.title);
	var price = xss(req.body.price);
	var cost = xss(req.body.cost);
	var allWinners = xss(req.body.allWinners);
	var challenge = xss(req.body.challenge);
	var condition = xss(req.body.condition);
	var extra = xss(req.body.extra);
	var media = xss(req.body.media);
	var duration = xss(req.body.duration);
	
	// Validation
	req.checkBody('title', 'Title is required!').notEmpty();
	req.checkBody('price', 'Price is required!').notEmpty().isInt({min: 1}); 
	req.checkBody('cost', 'Cost is required!').notEmpty().isInt({min: 1}); 
	req.checkBody('allWinners', 'How many allowed winners!').notEmpty().isInt({min: 1}); 
	req.checkBody('challenge', 'Challenge is required!').notEmpty();
	req.checkBody('condition', 'Condition is required!').notEmpty();
	req.checkBody('extra', 'Extra is required!').notEmpty();
	req.checkBody('duration', 'Duration is required!').notEmpty().isInt({min: 1});

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aparticipation/challenges');
	}else{	

		// calculations for stoppage time
		var starts = Date.now();
		var stops = starts + parseInt(duration * 60 * 60 * 1000);

		var newChallengeObj = new Challenges();
		newChallengeObj.title = title;
		newChallengeObj.price = price;
		newChallengeObj.cost = cost;
		newChallengeObj.allWinners = allWinners;
		newChallengeObj.condition = condition;
		newChallengeObj.challenge = challenge;
		newChallengeObj.extra = extra;
		newChallengeObj.media = media;
		newChallengeObj.duration = duration;
		newChallengeObj.starts = starts;
		newChallengeObj.stops = stops;
		newChallengeObj.save(function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', 'New Challenge added!');
				res.redirect('/aparticipation/challenges');
			}
		});
	}

});

// post to remove challenge by admin
router.post('/removeChallenges', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var challengesId = xss(req.body.challengesId);
	
	// Validation
	req.checkBody('challengesId', 'Unknown challenge!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aparticipation/challenges');
	}else{
		Challenges.deleteOne({'_id': challengesId}, function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', `One challenge (${challengesId}) removed!`);
				res.redirect('/aparticipation/challenges');
			}
		});
	}

});

// post to mark user as a challenge winner by admin
router.post('/challengeWinner', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var hdChallengesId = xss(req.body.hdChallengesId);
	var hdHandle = xss(req.body.hdHandle);
	var hdMedia = xss(req.body.hdMedia);
	var hdUserId = xss(req.body.hdUserId);
	var hdUserEmail = xss(req.body.hdUserEmail);
	
	// Validation
	req.checkBody('hdChallengesId', 'Unknown challenge!').notEmpty(); 
	req.checkBody('hdHandle', 'Unknown handle!').notEmpty(); 
	req.checkBody('hdMedia', 'Unknown media!').notEmpty(); 
	req.checkBody('hdUserId', 'Unknown user!').notEmpty(); 
	req.checkBody('hdUserEmail', 'Unknown email!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aparticipation/challenges/' + hdChallengesId);
	}else{
		Challenges.findOne({'_id': hdChallengesId}, function(err, doc){
			if(doc == null){
				req.flash('error_msg', `Challenge (${hdChallengesId}) not found!`);
				res.redirect('/aparticipation/challenges/' + hdChallengesId);
			}else{

				if(doc.won == false){
					newWinObj = {
						handle: hdHandle,
						media: hdMedia,
						userId: hdUserId,
						userEmail: hdUserEmail
					}
					
					// this allows us to have multiple challenge winners inserted
					if(doc.winner.length >= (doc.allWinners - 1)){
						doc.won = true; // avoid overwriting one winner!	
					}
					doc.winner.push(newWinObj);
					doc.save(function(err, result){
						if(err){
							res.render('error.hbs', {heading: "Warning!", note: err.message});
						}else{
							
							// save the winner into our Winners collection
							var winObj = new Winner ({
								userId: hdUserId,
								userEmail: hdUserEmail, 
								contest: "challenge", 
								contestId: doc.id, 
								media: hdMedia, 
								handle: hdHandle
							});
							winObj.save(function(err, saved){
								if(err){
									res.render('error.hbs', {heading: "Warning!", note: err.message});
								}else{
									req.flash('success_msg', `${hdUserEmail} marked as challenge (${hdChallengesId}) winner!`);
									res.redirect('/aparticipation/challenges/' + hdChallengesId);
								}
							})
						}
					});
				}else{
					req.flash('error_msg', `There are already ${doc.allWinners} winners for challenge (${hdChallengesId}) !`);
					res.redirect('/aparticipation/challenges/' + hdChallengesId);
				}
			}
		});
	}

});

// post to add new giveaway by admin
router.post('/giveaways', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var title = xss(req.body.title);
	var price = xss(req.body.price);
	var cost = xss(req.body.cost);
	var allWinners = xss(req.body.allWinners);
	var duration = xss(req.body.duration);
	
	// Validation
	req.checkBody('title', 'Title is required!').notEmpty();
	req.checkBody('price', 'Price is required!').notEmpty().isInt({min: 1}); 
	req.checkBody('cost', 'Cost is required!').notEmpty().isInt({min: 1}); 
	req.checkBody('allWinners', 'Allowed winners is required!').notEmpty().isInt({min: 1}); 
	req.checkBody('duration', 'Duration is required!').notEmpty().isInt({min: 1});

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aparticipation/challenges');
	}else{	

		// calculations for stoppage time
		var starts = Date.now();
		var stops = starts + parseInt(duration * 60 * 60 * 1000);

		var newGiveawayObj = new Giveaways();
		newGiveawayObj.title = title;
		newGiveawayObj.price = price;
		newGiveawayObj.cost = cost;
		newGiveawayObj.allWinners = allWinners;
		newGiveawayObj.duration = duration;
		newGiveawayObj.starts = starts;
		newGiveawayObj.stops = stops;
		newGiveawayObj.save(function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', 'New Giveaway added!');
				res.redirect('/aparticipation/giveaways');
			}
		});
	}

});

// post to remove giveaway by admin
router.post('/removeGiveaways', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var giveawaysId = xss(req.body.giveawaysId);
	
	// Validation
	req.checkBody('giveawaysId', 'Unknown FAQ!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aparticipation/giveaways');
	}else{
		Giveaways.deleteOne({'_id': giveawaysId}, function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', `One giveaway (${giveawaysId}) removed!`);
				res.redirect('/aparticipation/giveaways');
			}
		});
	}

});

module.exports = router;