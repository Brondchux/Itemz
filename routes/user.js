const express = require('express')
const router = express.Router()
const User = require('./models/user')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const config = require('./config/database')

// register new user
router.post('/signup', (req, res, next) => {
	let newUser = ({
		name: req.body.name, 
		email: req.body.email, 
		username: req.body.username, 
		password: req.body.password
	})

	User.addUser(newUser, (err, user) => {
		if(err){
			// https://medium.com/@shreyamduttagupta/api-authentication-using-passport-js-and-json-web-tokens-a6094df40ab0
		}
	})
})