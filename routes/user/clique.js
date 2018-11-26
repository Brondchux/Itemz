var express = require('express');
var router = express.Router();
var xss = require("xss");
var moment = require("moment");
var csrf = require('csurf');
var csrfProtection = csrf();

var User = require('../../models/user');
var Clique = require('../../models/clique');
var Members = require('../../models/members');
var Winner = require('../../models/winner');
var Giveaways = require('../../models/giveaways');
var Challenges = require('../../models/challenges');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	// check if user profile is updated
	res.redirect("/newClique");
});

/////////////// GETS //////////////

router.get('/newClique', User.isLoggedIn, function(req, res, next) {
	Clique.find({'ownerId': req.user}, function(err, doc){
		if(err){
			res.render('error.hbs', {heading: "Warning!", note: err.message});
		}else{
			var arr = [];
			counter = 1;
			for(var i = 0; i < doc.length; i++){
				var docEdit = {
					counter: counter,
					id: doc[i].id, 
					ownerEmail: doc[i].ownerEmail, 
					cliqueEmail: doc[i].cliqueEmail, 
					total: doc[i].total, 
					position: doc[i].position, 
					active: doc[i].active,  
					joined: moment(doc[i].joined).format("LL") 
				};
				arr.push(docEdit);
				counter++;
			}
			res.render('user/newClique', { title: 'New Clique+', csrfToken: req.csrfToken, clique: arr });
		}
	});
});

router.get('/joinClique', User.isLoggedIn, function(req, res, next) {
	Members.find({'userId':req.user}, function(err, doc){
		if(err){
			res.render('error.hbs', {heading: "Warning!", note: err.message});
		}else{
			var arr = [];
			var counter = 1;
			for(var i=doc.length - 1; i >= 0; i--){ // reversed array from last to first
				
				var docEdit = {
					counter: counter, 
					id: doc[i].id, 
					cliqueEmail: doc[i].cliqueEmail, 
					joined: moment(doc[i].joined).calendar() 
				};

				arr.push(docEdit);
				counter++;
			}
			res.render('user/joinClique', { title: 'Update Clique', csrfToken: req.csrfToken, members: arr });
		}
	});
});

router.get('/exitClique', User.isLoggedIn, function(req, res, next) {
	res.redirect("/clique/joinClique");
});

router.get('/dissolveClique', User.isLoggedIn, function(req, res, next) {
	res.redirect("/clique/newClique");
});

router.get('/statistics', User.isLoggedIn, function(req, res, next) {
	// fetch all cliques i created
	const getCliques = (id) => {
		return new Promise((resolve, reject) => {
			const myCliques = Clique.find({'ownerId': id}, (err, found)=>{});

			if (myCliques) {
				resolve(myCliques);
			} else {
				reject(`Unable to find cliques!`);
			}
		});
	};

	// fetch winnings that belongs to myclique
	const getCliqueWins = (cliqueEmail) => {
		return new Promise((resolve, reject) => {
			const wins = Winner.findOne({'mode': cliqueEmail}, (err, found)=>{});

			if (wins) {
				resolve(wins);
			} else {
				reject(`Unable to find clique wins!`);
			}
		});
	};

	// fetch winnings that belongs to myclique
	const getContest = (id, contestName) => {
		return new Promise((resolve, reject) => {
			var Contest;
			if(contestName == "giveaway"){
				Contest = Giveaways;
			}else{
				Contest = Challenges;
			}
			const contest = Contest.findOne({'_id': id}, (err, found)=>{});

			if (contest) {
				resolve(contest);
			} else {
				reject(`Unable to find contest!`);
			}
		});
	};

	// combine cliques and their wins 
	const cliquesAndWins = async () => {
		// all my cliques exists here
		const cliques = await getCliques(req.user);
		
		var arr = []; // new transporter array to views
		var counter = 1; // just to show serial numbers
		for(var i = 0; i < cliques.length; i++){
			// all clique wins exists here based on cliques[i].cliqueEmail
			const winnings = await getCliqueWins(cliques[i].cliqueEmail);
			const contested = await getContest(winnings.contestId, winnings.contest);
			var obj = {
				counter: counter, 
				admin: req.user.firstname + "'s (" + cliques[i].ownerEmail + ")", 
				clique: cliques[i].cliqueEmail, 
				price: contested.price, 
				contest: winnings.contest, 
				joined: moment(winnings.joined).format("LL")
			}
			arr.push(obj);
			counter++;
		}
		return arr;
	};

	// now run all the functions and transport to views
	cliquesAndWins().then((statDetails) => {
		res.render('user/statistics', { title: 'Clique Stat.', csrfToken: req.csrfToken, statistics: statDetails });
	}).catch((e) => {
		res.render('user/statistics', { title: 'Clique Stat.', csrfToken: req.csrfToken });
	});
	
});

////////////// POSTS /////////////

// post to create new cliques
router.post('/newClique', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var suffix = "@gfclique.org";
	var newClique = xss(req.body.newClique);
	
	// Validation
	req.checkBody('newClique', 'Custom clique name is required').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/clique/newClique');
	}else{
		// append clique suffix to newClique input
		var newCliqueSplit = newClique.split(/[\s@]+/); // split string in case of spaces and @ signs
		newClique = newCliqueSplit[0]+suffix;

		//place create statement here
		Clique.findOne({'cliqueEmail': newClique}, function(err, doc){
			if(doc !== null){
				req.flash("error_msg", `Clique email "${newClique}" is already in use!`);
				res.redirect('/clique/newClique');
			}else{
				var newCliqueObj = new Clique();
				newCliqueObj.cliqueEmail = newClique;
				newCliqueObj.ownerId = req.user;
				newCliqueObj.ownerEmail = req.user.email;
				newCliqueObj.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", `New clique "${newClique}" created!`);
						res.redirect('/clique/newClique');
					}
				});
			}
		});
	}

});

// post to update clique details
router.post('/joinClique', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var clique = xss(req.body.clique);

	// Validation
	req.checkBody('clique', 'Valid clique email is required').notEmpty().isEmail(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/clique/joinClique');
	}else{
		// place update statement here
		Clique.findOne({'cliqueEmail':clique}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "Clique not found!");
				res.redirect('/clique/joinClique');
			}else{
				// check if user already joined this clique
				Members.findOne({'userId':req.user, 'cliqueEmail':clique}, function(err, item){
					if(item !== null){
						req.flash("error_msg", "You already a member of clique: "+clique);
						res.redirect('/clique/joinClique');
					}else{
						var memberObj = new Members();
						memberObj.cliqueEmail = clique;
						memberObj.userId = req.user;
						memberObj.userEmail = req.user.email;
						memberObj.save(function(err, result){
							if(err){
								res.render('error.hbs', {heading: "Warning!", note: err.message});
							}else{
								// update total for Clique
								doc.total = doc.total + 1;
								doc.position = Clique.position(doc.total);
								doc.save(function(err, result){
									if(err){
										res.render('error.hbs', {heading: "Warning!", note: err.message});
									}else{
										req.flash("success_msg", "Successfully joined clique: "+clique);
										res.redirect('/clique/joinClique');
									}
								});
							}
						});
					}
				});
			}
		});
	}
});

// post to exit clique 
router.post('/exitClique', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var hdCliqueEmail = xss(req.body.hdCliqueEmail);
	var hdMembersId = xss(req.body.hdMembersId);

	// Validation
	req.checkBody('hdCliqueEmail', 'Valid clique email is required').notEmpty().isEmail(); 
	req.checkBody('hdMembersId', 'Valid clique is required').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/clique/joinClique');
	}else{
		// place update total members statement here
		Clique.findOne({'cliqueEmail':hdCliqueEmail}, function(err, doc){
			if(doc == null){
				req.flash("error_msg", "Clique not found!");
				res.redirect('/clique/joinClique');
			}else{
				// delete user using that member object id and the clique email
				Members.deleteOne({'_id':hdMembersId, 'cliqueEmail':hdCliqueEmail}, function(err, item){
					// update total for Clique
					doc.total = doc.total - 1;
					doc.position = Clique.position(doc.total);
					doc.save(function(err, result){
						if(err){
							res.render('error.hbs', {heading: "Warning!", note: err.message});
						}else{
							req.flash("success_msg", "Successfully removed from clique: "+hdCliqueEmail);
							res.redirect('/clique/joinClique');
						}
					});
				});
			}
		});
	}
});

// post to dissolve clique 
router.post('/dissolveClique', User.isLoggedIn, function(req, res, next){
	// receieve the input values
	var hdCliqueEmail = xss(req.body.hdCliqueEmail);
	var hdCliqueId = xss(req.body.hdCliqueId);

	// Validation
	req.checkBody('hdCliqueEmail', 'Valid clique email is required').notEmpty().isEmail(); 
	req.checkBody('hdCliqueId', 'Valid clique is required').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/clique/newClique');
	}else{
		// delete all members in the clique
		Members.deleteMany({'cliqueEmail':hdCliqueEmail}, function(err, doc){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				// delete user using that member object id and the clique email
				Clique.deleteOne({'_id':hdCliqueId, 'cliqueEmail':hdCliqueEmail}, function(err, item){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", "Successfully dissolved clique: "+hdCliqueEmail);
						res.redirect('/clique/newClique');
					}
					
				});
			}
		});
	}
});

module.exports = router;