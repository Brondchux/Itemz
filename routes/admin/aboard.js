var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var xss = require('xss');
var moment = require('moment');
var User = require('../../models/user');
var Mail = require('../../models/mail');
var Winner = require('../../models/winner');
var Challenges = require('../../models/challenges');
var Giveaways = require('../../models/giveaways');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.redirect('/aboard/assistance');
});

/////////////// GETS //////////////

router.get('/feeds', User.isLoggedIn, function(req, res, next) {
	// show all instagram feeds
	res.render('feeds', { title: '@GospelsFoundation', csrfToken: req.csrfToken, position: true });
});

router.get('/winners', User.isLoggedIn, function(req, res, next) {
	// fetch all winners from last to first (userId)
	const getWinners = () => {
		return new Promise((resolve, reject) => {
			const winners = Winner.find({'active': true}, (err, found)=>{});

			if (winners) {
				resolve(winners);
			} else {
				reject(`Unable to find winners!`);
			}
		});
	};

	// fetch all user names that won (firstname, lastname)
	const getNames = (id) => {
		return new Promise((resolve, reject) => {
			const user = User.findOne({'_id': id}, (err, found)=>{});

			if (user) {
				resolve(user);
			} else {
				reject(`Unable to find user!`);
			}
		});
	};

	// fetch all challenges or giveaway details that won (price and cost)
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

	// combine winners and their names 
	const winnersAndNames = async () => {
		// all my winners exists here
		const winner = await getWinners();
		
		var arr = []; // new transporter array to views
		var counter = 1; // just to show serial numbers
		var igVideos = "https://www.instagram.com/gospelsfoundation/";
		//for(var i = 0; i < winner.length; i++){
		for(var i = winner.length - 1; i >= 0; i--){
			// all winners names exists here based on winner[i].userId
			const names = await getNames(winner[i].userId);
			const contested = await getContest(winner[i].contestId, winner[i].contest);
			var obj = {
				counter: counter, 
				firstname: names.firstname, 
				lastname: names.lastname, 
				email: names.email, 
				price: contested.price, 
				cost: contested.cost,  
				winId: winner[i].id, 
				contest: winner[i].contest, 
				video: winner[i].video == null ? igVideos : winner[i].video, 
				media: winner[i].media == null ? "instagram" : winner[i].media, 
				mode: winner[i].mode == null ? names.email : winner[i].mode, 
				handle: winner[i].handle == null ? names.instagram : winner[i].handle,  
				paidSts: winner[i].paid, 
				paid: winner[i].paid == true ? "paid" : "awaiting video",
				active: winner[i].active == true ? "yes" : "no",
				joined: moment(winner[i].joined).format("LL")
			}
			arr.push(obj);
			counter++;
		}
		return arr;
	};

	// now run all the functions and transport to views
	winnersAndNames().then((winnerFullDetails) => {
		res.render('admin/winners', { title: 'Winners', csrfToken: req.csrfToken, winners: winnerFullDetails });
	}).catch((e) => {
		res.render('admin/winners', { title: 'Winners', csrfToken: req.csrfToken });
	});
});

router.get('/assistance', User.isLoggedIn, function(req, res, next) {
	Mail.find({'status': true}).sort({'_id': 1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					mailId: docs[i].mailId, 
					subject: docs[i].subject, 
					message: docs[i].message, 
					userId: docs[i].userId, 
					userEmail: docs[i].userEmail, 
					status: docs[i].status == true ? "open" : "closed", 
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/assistance', { title: 'Reply Mails', csrfToken: req.csrfToken, mails: arr, totalMails: docs.length });
		}else{
			res.render('admin/assistance', { title: 'No Mail!', csrfToken: req.csrfToken });
		}	
	});
});

////////////// POSTS /////////////

// post to close mail status by admin (make it disapper!)
router.post('/assistance', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var hdMailId = xss(req.body.hdMailId);
	
	// Validation
	req.checkBody('hdMailId', 'Unknown mail to close!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aboard/assistance');
	}else{
		// fetch the mail in question
		Mail.findOne({'_id': hdMailId}, function(err, doc){
			if(doc !== null){
				// close mail by turning active to false
				doc.status = false;
				doc.joined = Date.now();
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", 'One mail successfully replied and closed!');
						res.redirect('/aboard/assistance');
					}
				});
			}
		});
	}

});

// post to update video url after uploading it to official instagram by admin
router.post('/winners', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var hdWinId = xss(req.body.hdWinId);
	var videoUrl = xss(req.body.videoUrl);

	// Validation
	req.checkBody('hdWinId', 'Unknown win record to update!').notEmpty();
	req.checkBody('videoUrl', 'Video url is required!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aboard/winners');
	}else{
		// fetch the win record in question
		Winner.findOne({'_id': hdWinId}, function(err, doc){
			if(doc !== null){
				// videoUrl by updating paid to true after saving video url
				doc.video = videoUrl;
				doc.paid = true;
				doc.save(function(err, result){
					if(err){
						res.render('error.hbs', {heading: "Warning!", note: err.message});
					}else{
						req.flash("success_msg", `Video url updated for win record ${hdWinId}`);
						res.redirect('/aboard/winners');
					}
				});
			}
		});
	}

});

module.exports = router;