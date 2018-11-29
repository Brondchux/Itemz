var express = require('express');
var router = express.Router();

/* Website default pages and links to other pages */
router.get('/', function(req, res, next) {
	// redirect to home page
	const Welcome = {
		app: "Welocome to Itemz API", 
		purpose: "Exchange of Itemz"
	}
	res.json(Welcome);
});

module.exports = router;