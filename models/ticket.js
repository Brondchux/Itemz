var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Ticket = require('./ticket');

var schema = new Schema ({
	userId: 			{type: Schema.Types.ObjectId, ref: 'User' },
	userEmail: 			{type: String },
	balance: 			{type: Number, default: 0 },
	joined: 			{type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', schema);

/////////////// FUNCTIONS ////////////

module.exports.ticketCost = function(){
	 var ticketCost = 100;
	 return ticketCost;
}