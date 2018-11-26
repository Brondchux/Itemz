var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	// redirect to sign in
	res.redirect("/user/signin");
});

module.exports = router;