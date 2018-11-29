// importing node js required npm modules
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const passport = require('passport')
const mongoose = require('mongoose')
// importing our created database connection from config folder
const config = require('./config/database')

// connect to database 
mongoose.connect(config.database)

// database connection successful
mongoose.connection.on('connected', () => {
	console.log('connected to resource ' + config.database)
})

// database connection error
mongoose.connection.on('error', (err) => {
	console.log('resource connection failed ' + err)
})

// save express engine into app variable
const app = express()
const indexRoute = require('./routes/index')
const userRoute = require('./routes/user')

// cors middleware
app.use(cors())

// static folder
app.use(express.static(path.join(__dirname, 'public')))

// bodyparser middleware
app.use(bodyParser.json())

// defining routes and assigning
app.use('/', indexRoute)
app.use('/user', userRoute)

// passport middleware
app.use(passport.initialize())
app.use(passport.session())
// importing our created passport file from config folder
require('./config/passport')(passport)

// setting port number
const port = 3000

// start node server
app.listen(port, () => {
	console.log('Itemz server started at port ' + port)
})