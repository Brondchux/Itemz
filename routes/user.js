const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const config = require('../config/database')

// register new user
router.post('/register', (req, res, next) => {
	let newUser = ({
		name: req.body.name, 
		email: req.body.email, 
		username: req.body.username, 
		password: req.body.password
	})

	User.addUser(newUser, (err, user) => {
		if(err){
			res.json({success: false, msg: 'Failed to register user!'})
		}else{
			res.json({success: true, msg: 'New user registered!'})
		}
	})
})

// authenticate
router.post('/authenticate', (req, res, next) => {
	const username = req.body.username
	const password = req.body.password

	User.getUserByUsername(username, (err, user) => {
		if(err) throw err
		if(!user){
			return res.json({success: false, msg: 'User not found!'})
		}
		User.comparePassword(password, user.password, (err, isMatch) => {
			if(err) throw err
			if(isMatch){
				const token = jwt.sign(user, config.secret, {
					expiresIn: 60 // 1 minute
				})

				// display json response containing user profile details
				res.json({
					success: true,
					token: 'JWT '+ token,
					user: {
						id: user._id,
						name: user.name,
						username: user.username,
						password: user.password,
						email: user.email
					}
				})
			}else{
				return res.json({ success: false, msg: 'Wrong password combination!' })
			}
		})
	})
})

// profile
router.get('/profile', passport.authenticate('jwt', {session: false}), (req, res, next) => {
	res.json({user: req.user})
})

module.exports = router