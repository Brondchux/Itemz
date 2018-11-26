var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var schema = new Schema ({
	fullname: 		{type: String },
	email: 			{type: String, require: true, unique: true },
	password: 		{type: String, require: true },
	role: 			{type: String, default: "user" },
	invitation:		{type: String },
	instagram: 		{type: String, unique: true },
	facebook: 		{type: String, unique: true },
	twitter: 		{type: String, unique: true },
	updated: 		{type: Boolean, default: false },
	isAdmin: 		{type: Boolean, default: false },
	isUser: 		{type: Boolean, default: true },
	blocked: 		{type: Boolean, default: false },
	joined: 		{type: Date, default: Date.now }
});

schema.methods.encryptPassword = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

schema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User', schema);

/////////////// FUNCTIONS ////////////

module.exports.isLoggedIn = function (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/');
	}
}

module.exports.notLoggedIn = function (req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/');
	}
}

module.exports.escapeRegex = function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};