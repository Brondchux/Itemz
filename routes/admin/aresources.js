var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var xss = require('xss');
var moment = require('moment');
var User = require('../../models/user');
var Ticket = require('../../models/ticket');
var Faqs = require('../../models/faqs');
var Broadcast = require('../../models/broadcast');

router.use(csrfProtection);

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.redirect('/aresources/tickets');
});

/////////////// GETS //////////////

// search tickets by email alone
router.get('/search/:email', User.isLoggedIn, function(req, res, next) {
	var searchEmail = xss(req.params.email);
	Ticket.find({"userEmail": searchEmail}, function(err, files) {
		if(files.length !== 0){
			// result found!
			var arr = [];
			var counter = 1;
			for(var i = 0; i < files.length; i++){
				var docEdit = {
					counter: counter, 
					id: files[i].id, 
					userId: files[i].userId, 
					userEmail: files[i].userEmail, 
					balance: files[i].balance, 
					joined: moment(files[i].joined).format("LL")
				}
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/tickets', { title: 'Tickets', csrfToken: req.csrfToken, found: arr, foundTotal: files.length });
		}else{
			// no result found!!
			res.render('admin/tickets', { title: 'No Tickets!', csrfToken: req.csrfToken });
		}
	});
});

router.get('/tickets', User.isLoggedIn, function(req, res, next) {
	Ticket.find({}).sort({'userEmail': 1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			var sum = 0;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					userId: docs[i].userId, 
					userEmail: docs[i].userEmail, 
					balance: docs[i].balance, 
					joined: moment(docs[i].joined).format("LL")
				}
				// calculate total tickets bought
				sum += docEdit.balance;
				arr.push(docEdit);
				counter++;
			}
			res.render('admin/tickets', { title: 'Tickets', csrfToken: req.csrfToken, tickets: arr, totalTickets: sum });
		}else{
			res.render('admin/tickets', { title: 'No Tickets!', csrfToken: req.csrfToken });
		}	
	});
});

router.get('/faqs', User.isLoggedIn, function(req, res, next) {
	Faqs.find({}).sort({'_id': -1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					title: docs[i].title, 
					body: docs[i].body, 
					active: docs[i].active, 
					joined: moment(docs[i].joined).format("LL")
				}

				arr.push(docEdit);
				counter++;
			}
			res.render('admin/faqs', { title: 'FAQs', csrfToken: req.csrfToken, faqs: arr, totalFaqs: docs.length });
		}else{
			res.render('admin/faqs', { title: 'No FAQs!', csrfToken: req.csrfToken });
		}	
	});
});

router.get('/broadcasts', User.isLoggedIn, function(req, res, next) {
	Broadcast.find({}).sort({'_id': -1}).exec(function(err, docs) {
		if(docs.length !== 0){
			var arr = [];
			var counter = 1;
			for(var i = 0; i < docs.length; i++){
				var docEdit = {
					counter: counter, 
					id: docs[i].id, 
					title: docs[i].title, 
					body: docs[i].body, 
					active: docs[i].active, 
					joined: moment(docs[i].joined).format("LL")
				}

				arr.push(docEdit);
				counter++;
			}
			res.render('admin/broadcasts', { title: 'Broadcast', csrfToken: req.csrfToken, broadcasts: arr, totalBroadcasts: docs.length });
		}else{
			res.render('admin/broadcasts', { title: 'No Broadcast!', csrfToken: req.csrfToken });
		}	
	});
});

////////////// POSTS /////////////

router.post('/search', User.isLoggedIn, function(req, res, next) {
	var search = xss(req.body.search);

	// Validation
	req.checkBody('search', 'Search email is required!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/tickets');
	}else{
		res.redirect("/aresources/search/" + search);
	}
});

// post to topup new tickets by admin
router.post('/topup', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var topupQty = xss(req.body.topupQty);
	var hdUserId = xss(req.body.hdUserId);
	var hdUserEmail = xss(req.body.hdUserEmail);
	
	// Validation
	req.checkBody('topupQty', 'Specify quantity of tickets to topup!').notEmpty().isInt({ min: 1 }); 
	req.checkBody('hdUserId', 'Unknown topup user!').notEmpty();
	req.checkBody('hdUserEmail', 'Unknown topup user*!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/search/' + hdUserEmail);
	}else{
		// multiply ticket by 100
		topupQty = parseInt(parseInt(topupQty) * Ticket.ticketCost());

		//place create statement here
		Ticket.findOne({'userId': hdUserId}, function(err, doc){
			if(doc !== null){
				// fetch old balance and update record
				var previousBal = doc.balance;
				var newBalance = previousBal + topupQty;
				doc.balance = newBalance;
				doc.joined = Date.now();
				var saveObj = doc;
			}else{
				// insert a new record for me
				var previousBal = 0;
				var newBalance = previousBal + topupQty;
				var newTicketObj = new Ticket();
				newTicketObj.userId = hdUserId;
				newTicketObj.userEmail = hdUserEmail;
				newTicketObj.balance = newBalance;
				var saveObj = newTicketObj;
			}
			
			saveObj.save(function(err, result){
				if(err){
					res.render('error.hbs', {heading: "Warning!", note: err.message});
				}else{
					req.flash("success_msg", `Topup successful for ${hdUserEmail}! New balance ${saveObj.balance} tickets`);
					res.redirect('/aresources/search/' + hdUserEmail);
				}
			});
		});
	}

});

// post to add new faq by admin
router.post('/faqs', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var faqTitle = xss(req.body.faqTitle);
	var faqBody = xss(req.body.faqBody);
	
	// Validation
	req.checkBody('faqTitle', 'Title (question) is required!').notEmpty(); 
	req.checkBody('faqBody', 'Body (answer) is required!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/faqs');
	}else{
		var newFaqObj = new Faqs();
		newFaqObj.title = faqTitle;
		newFaqObj.body = faqBody;
		newFaqObj.save(function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', 'New FAQ added!');
				res.redirect('/aresources/faqs');
			}
		});
	}

});

// post to remove faq by admin
router.post('/removeFaq', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var faqId = xss(req.body.faqId);
	
	// Validation
	req.checkBody('faqId', 'Unknown FAQ!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/faqs');
	}else{
		Faqs.deleteOne({'_id': faqId}, function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', `One FAQ (${faqId}) removed!`);
				res.redirect('/aresources/faqs');
			}
		});
	}

});

// post to add new broadcast by admin
router.post('/broadcasts', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var broadcastsTitle = xss(req.body.broadcastsTitle);
	var broadcastsBody = xss(req.body.broadcastsBody);
	
	// Validation
	req.checkBody('broadcastsTitle', 'Title is required!').notEmpty(); 
	req.checkBody('broadcastsBody', 'Body is required!').notEmpty();

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/broadcasts');
	}else{
		var newFaqObj = new Broadcast();
		newFaqObj.title = broadcastsTitle;
		newFaqObj.body = broadcastsBody;
		newFaqObj.save(function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', 'New broadcast added!');
				res.redirect('/aresources/broadcasts');
			}
		});
	}

});

// post to remove broadcast by admin
router.post('/removeBroadcast', User.isLoggedIn, function(req, res, next) {
	
	// receieve the input values
	var broadcastsId = xss(req.body.broadcastsId);
	
	// Validation
	req.checkBody('broadcastsId', 'Unknown FAQ!').notEmpty(); 

	var errors = req.validationErrors();
	if(errors){
		req.flash("errors", errors);
		res.redirect('/aresources/broadcasts');
	}else{
		Broadcast.deleteOne({'_id': broadcastsId}, function(err, result){
			if(err){
				res.render('error.hbs', {heading: "Warning!", note: err.message});
			}else{
				req.flash('success_msg', `One broadcast (${broadcastsId}) removed!`);
				res.redirect('/aresources/broadcasts');
			}
		});
	}

});

module.exports = router;