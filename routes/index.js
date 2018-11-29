var express = require('express');
var router = express.Router();

/* Website default pages and links to other pages */
router.get('/', function(req, res, next) {
	// redirect to home page
	let output = 'Welocome to Itemz API - Exchange of Itemz';
	res.json(output);
});

module.exports = router;