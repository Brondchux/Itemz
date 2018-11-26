var express = require('express');
var router = express.Router();
var xss = require("xss");
var moment = require("moment");
var csrf = require('csurf');
var csrfProtection = csrf();
var nodemailer = require('nodemailer');

var User = require('../../models/user');
var Ticket = require('../../models/ticket');
var Statement = require('../../models/statement');
var Mail = require('../../models/mail');
var Broadcast = require('../../models/broadcast');
var Faqs = require('../../models/faqs');
var Winner = require('../../models/winner');
var Giveaways = require('../../models/giveaways');
var Challenges = require('../../models/challenges');
var staLimit = 15 // statement limit

router.use(csrfProtection);

/* GET users listing. */
router.get('/', User.isLoggedIn, function(req, res, next) {
	res.redirect('/resources/tickets');
});

/////////////// GETS //////////////

router.get('/feeds', function(req, res, next) {
	// show all instagram feeds
	res.render('feeds', { title: '@GospelsFoundation', csrfToken: req.csrfToken, position: true });
});

router.get('/tickets', User.isLoggedIn, function(req, res, next) {
	// check if bank details are updated else force redirect
	if(req.user.bankSts == false){
		req.flash("error_msg", "First update your bank details!");
		res.redirect('/setting/bank');
	}
	else if(req.user.updated == false){
		req.flash("error_msg", "First update your profile details!");
		res.redirect('/setting/profile');
	}
	else{
		// fetch my ticket record from (balance, last top-up)
		const getTicket = (id) => {
			return new Promise((resolve, reject) => {
				const ticket = Ticket.findOne({'userId':id}, (err, found)=>{});

				if (ticket) {
					resolve(ticket);
				} else {
					reject(`Unable to find ticket!`);
				}
			});
		};

		// fetch all my statement record from (balance, last top-up)
		const getStatements = (id) => {
			return new Promise((resolve, reject) => {
				const statement = Statement.findOne({'userId':id}, (err, found)=>{});

				if (statement) {
					resolve(statement);
				} else {
					reject(`Unable to find statement!`);
				}
			});
		};

		// get ticket and statments
		const getTicketAndStatements = async () => {
			// my ticket exists here
			const ticket = await getTicket(req.user);
			// all my getStatements exists here
			const statements = await getStatements(req.user);
			
			// edit ticket content
			var ticketEdit = {
				balance: ticket.balance.toLocaleString(), 
				joined: moment(ticket.joined).calendar()
			}

			// edit statements brakdown content
			var arrStatements = [];
			if(statements !== null){ // this check makes the promise return something for tickets incase the statement collection is left blank
				var counter = 1;
				for(i = statements.breakdown.length - 1; i >= 0; i--){
					var breakdownEdit = {
						counter: counter, 
						userEmail: statements.userEmail, 
						narration: statements.breakdown[i].narration, 
						cost: statements.breakdown[i].cost, 
						balance: statements.breakdown[i].balance, 
						dated: moment(statements.breakdown[i].dated).format("ll")
					}
					// only show my last 15 ticket statements
					if(counter <= staLimit){
						arrStatements.push(breakdownEdit)
					}
					counter++;
				}
			}

			// new transporter object to views
			var obj = {
				ticket: ticketEdit, 
				statements: arrStatements
			}
			return obj;
		};

		// now run all the functions and transport to views
		getTicketAndStatements().then((bothItems) => {
			// continue to ticket display with contents
			res.render('user/tickets', { title: 'Top-up Tickets', csrfToken: req.csrfToken, ticket: bothItems.ticket, statements: bothItems.statements });
		}).catch((e) => {
			// continue to ticket display
			res.render('user/tickets', { title: 'Top-up Tickets', csrfToken: req.csrfToken });
		});

	}
});

router.get('/assistance', User.isLoggedIn, function(req, res, next) {
	// get all my previous mails
	Mail.find({"userId":req.user}, function(err, docs){
		if(docs.length == 0){
			res.render('user/assistance', { title: 'Help Desk', csrfToken: req.csrfToken });
		}else{
			var arr = [];
			var counter = 1;
			for(var i = docs.length - 1; i >= 0; i--){
				var docEdit = {
					counter: counter,
					id: docs[i].id,
					mailId: docs[i].mailId,
					subject: docs[i].subject,
					message: docs[i].message,
					status: docs[i].status == true ? "open" : "closed",
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('user/assistance', { title: 'Help Desk', csrfToken: req.csrfToken, mails: arr });
		}
	});
});

router.get('/broadcasts', User.isLoggedIn, function(req, res, next) {
	// get all my previous broadcast
	Broadcast.find({'active':true}).sort({'_id': -1}).limit(3).exec(function(err, docs){
		if(docs.length == 0){
			res.render('user/broadcasts', { title: 'Broadcasts', csrfToken: req.csrfToken });
		}else{
			var arr = [];
			var counter = 1;
			for(var i = docs.length - 1; i >= 0; i--){
				var docEdit = {
					counter: counter,
					id: docs[i].id,
					title: docs[i].title,
					body: docs[i].body,
					active: docs[i].active == true ? "open" : "closed",
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('user/broadcasts', { title: 'Broadcasts', csrfToken: req.csrfToken, broadcasts: arr });
		}
	});
});

router.get('/faqs', User.isLoggedIn, function(req, res, next) {
	// get all my previous faqs
	Faqs.find({'active':true}).sort({'_id': -1}).exec(function(err, docs){
		if(docs.length == 0){
			res.render('user/faqs', { title: 'FAQs', csrfToken: req.csrfToken });
		}else{
			var arr = [];
			var counter = 1;
			for(var i = docs.length - 1; i >= 0; i--){
				var docEdit = {
					counter: counter,
					id: docs[i].id,
					title: docs[i].title,
					body: docs[i].body,
					active: docs[i].active == true ? "open" : "closed",
					joined: moment(docs[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('user/faqs', { title: 'FAQs', csrfToken: req.csrfToken, faqs: arr });
		}
	});
});

router.get('/winners/:contestId', User.isLoggedIn, function(req, res, next) {	
	var contestId = req.params.contestId;
	res.redirect("/resources/winners");
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
				gfgid: contested.gfgid,  
				gfcid: contested.gfcid,  
				contest: winner[i].contest, 
				video: winner[i].video == null ? igVideos : winner[i].video, 
				media: winner[i].media == null ? "instagram" : winner[i].media, 
				mode: winner[i].mode == null ? names.email : winner[i].mode, 
				handle: winner[i].handle == null ? names.instagram : winner[i].handle,  
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
		res.render('user/winners', { title: 'Winners', csrfToken: req.csrfToken, winners: winnerFullDetails });
	}).catch((e) => {
		res.render('user/winners', { title: 'Winners', csrfToken: req.csrfToken });
	});
});


////////////// POSTS /////////////

// post to topup new tickets
router.post('/tickets', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var addTicket = xss(req.body.addTicket);
	
	// Validation
	req.checkBody('addTicket', 'First specify quantity of tickets you wish to add!').notEmpty().isInt({ min: 1 }); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/resources/tickets');
	}else{
		// save statement function [topup, bank reset, challange, giveaway]
		function saveStatement(narration, cost, balance){
			Statement.findOne({'userId': req.user}, function(err, doc){
				if(doc == null){
					// insert a complete record the first time
					var newObj = new Statement()
					newObj.userId = req.user; 
					newObj.userEmail = req.user.email;  
					newObj.breakdown = {
						narration: narration, 
						cost: cost, 
						balance: balance 
					}
					var decision = newObj;
				}else{
					// only update the breakdown for the user
					var obj = {
						narration: narration, 
						cost: cost, 
						balance: balance 
					}
					doc.breakdown.push(obj);
					var decision = doc;
				}
				decision.save(function(err, done){
					if(err){
						return done(err)
					};
					//return done;
				});
			});
		}

		// multiply ticket by 100
		addTicket = parseInt(parseInt(addTicket) * Ticket.ticketCost());

		//place create statement here
		Ticket.findOne({'userId': req.user}, function(err, doc){
			if(doc !== null){
				// fetch old balance and update record
				var previousBal = doc.balance;
				var newBalance = previousBal + addTicket;
				doc.balance = newBalance;
				doc.joined = Date.now();
				var saveObj = doc;
			}else{
				// insert a new record for me
				var previousBal = 0;
				var newBalance = previousBal + addTicket;
				var newTicketObj = new Ticket();
				newTicketObj.userId = req.user;
				newTicketObj.userEmail = req.user.email;
				newTicketObj.balance = newBalance;
				var saveObj = newTicketObj;
			}
			
			saveObj.save(function(err, result){
				if(err){
					res.render('error.hbs', {heading: "Warning!", note: err.message});
				}else{
					// update statement
					saveStatement("ticket topup", 0, saveObj.balance);
					req.flash("success_msg", `Topup successful! you have a balance of ${saveObj.balance} tickets`);
					res.redirect('/resources/tickets');
				}
			});
		});
	}

});

// Post action to send email
router.post('/assistance', User.isLoggedIn, function(req, res, next) {
	// receive the post variables
	var subject 				= xss(req.body.subject);
	var message 				= xss(req.body.message);
	var mailId 					= Date.now();
	var users_id_txt 			= req.body.users_id_txt;
	var message_subject_txt 	= req.body.message_subject_txt;
	var message_body_txt 		= req.body.message_body_txt;
	var help_desk_mail 			= "helpdesk@gospelsfoundation.org";

	// make sure no empty variable was sent 
	req.checkBody('subject', 'Email subject is required!').notEmpty();
	req.checkBody('message', 'Email message is required!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/resources/assistance');
	}else{
		
		// now send the email to our official helpdesk email helpdesk@gospelsfoundation.org
		// var smtpTransport = nodemailer.createTransport({
		// 	service: 'Gmail',
		// 	auth: {
		// 		user: help_desk_mail,
		// 		pass: 'brondchux224'
		// 	},
		// 	tls: {
		// 		rejectUnauthorized: false
		// 	}
		// });
		// var mailOptions = {
		// 	to: foundUserDetails.email,
		// 	from: help_desk_mail,
		// 	subject: message_subject_txt,
		// 	text: message_body_txt
		// };
		// smtpTransport.sendMail(mailOptions, function(err){
		// 	if(err){
		// 		console.log(err);
		// 		req.flash('error_msg', 'Message sending failed, try again');
		// 		res.redirect('/help_desk');
		// 	}else{
		// 		req.flash('success_msg', 'Message sent successfully to help desk, awaiting reply');
		// 		res.redirect('/help_desk');
		// 	}
		// });

		var output = `
		<p>You have a new message on help desk</p>

		<h3>Contact Details</h3>
		<ul>
		<li>Name: ${req.user.firstname} ${req.user.lastname}</li>
		<li>Ref: ${req.user}</li>
		<li>Phone: ${req.user.phone}</li>
		<li>Email: ${req.user.email}</li>
		<li>MID: ${mailId}</li>
		</ul>

		<h3>Message</h3>
		<ul>
		<li><p><b>${subject}</b></p></li>
		<li><p>${message}</p></li>
		</ul>
		`;

		let transporter = nodemailer.createTransport({
			host: 'gospelsfoundation.org',
			port: 465,
	        secure: true, // true for 465, false for other ports
	        auth: {
	            user: help_desk_mail, // generated ethereal user
	            pass: process.env.GMAILPW // generated ethereal password
	        },
	        tls: {
	        	rejectUnauthorized: true
	        }
	    });

	    // setup email data with unicode symbols
	    let mailOptions = {
	        from: 'Help Desk <' + req.user.email + '>', // sender address
	        to: help_desk_mail, // list of receivers
	        subject: subject, // Subject line
	        text: 'Hello world?', // plain text body
	        html: output // html body
	    };

	    // send mail with defined transport object
	    transporter.sendMail(mailOptions, (error, info) => {
	    	if (error) {
	    		console.log(error);
	    		req.flash('error_msg', 'Message sending failed, try again');
	    		res.redirect('/resources/assistance');
	    	}else{
	        	// save mail to mongodb
	        	var mailObj = new Mail();
	        	mailObj.mailId = mailId;
	        	mailObj.subject = subject;
	        	mailObj.message = message;
	        	mailObj.userId = req.user;
	        	mailObj.userEmail = req.user.email;
	        	mailObj.save(function(err, result){
	        		if(err){
	        			res.render('error.hbs', {heading: "Warning!", note: err.message});
	        		}else{
	        			console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
	        			req.flash('success_msg', 'Message sent successfully to help desk, to be replied in less than 48 hours');
	        			res.redirect('/resources/assistance');
	        		}
	        	});
	        }
	    });

	}
});

// Post action to delete email
router.post('/deleteMail', User.isLoggedIn, function(req, res, next) {
	// receive the post variables
	var hdMailId = xss(req.body.hdMailId);

	// make sure no empty variable was sent 
	req.checkBody('hdMailId', 'Email is required!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/resources/assistance');
	}else{
		Mail.deleteOne({"_id":hdMailId, "userId":req.user}, function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash("success_msg", 'Mail successfully removed!');
				res.redirect('/resources/assistance');
			}
		});
	}
});

module.exports = router;