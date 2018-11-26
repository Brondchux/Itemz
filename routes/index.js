var express = require('express');
var router = express.Router();
var xss = require("xss");
var csrf = require('csurf');
var csrfProtection = csrf();
var User = require('../models/user');

router.use(csrfProtection);

/* Website default pages and links to other pages */
router.get('/', function(req, res, next) {
	// redirect to home page
	let output = 'Itemz API - Exchange of Itemz';
	res.json(output);
});

////////////// POSTS /////////////

module.exports = router;