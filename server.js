'use strict';

require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');
const session = require('express-session');
const mongo = require('mongodb').MongoClient;


const routes = require('./routes');
const auth = require('./auth');

// const userid = ObjectID();
// const user = {_id:ObjectID()};


const app = express();

fccTesting(app); //For FCC testing purposes



app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {

  let db = client.db('fcc-advanced-node');

  if (err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');




    // note the difference in methodology vs my previous projects returning the router
    // note the singleton behaviour of the app
    routes(app,db);
    auth(app,db);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      var error = new Error('Not found!');
      next(error);
    });

    //provide err argument before req to tell Express it's an error handling function
    app.use((err, req, res, next) => {
      res.status(500).send(`Error found: ${err.message}`);
    });

    //serialization and app.listen
    app.listen(process.env.PORT || 3000, () => {
      // console.log("Listening on port " + process.env.PORT);
    });

  }
});


