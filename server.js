'use strict';

require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');
const LocalStrategy = require('passport-local');

const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const saltRounds = 12;

// const userid = ObjectID();
// const user = {_id:ObjectID()};


const app = express();

fccTesting(app); //For FCC testing purposes

function ensureAuthenticated(req, res, next) {
  console.log('check auth');
  console.log(req.user); 
  if (req.isAuthenticated()) {
    console.log('success auth');
    return next();
  }
  return res.redirect('/');
  // return next();
};

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

app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index', {
      title: 'Hello',
      message: 'Please login!',
      showLogin: true,
      showRegistration: true,

    });
  });


app.post('/login',
  passport.authenticate('local',{failureRedirect:'/'}),
  function (req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/profile');
  });


app.route('/profile')
  .get(ensureAuthenticated, (req, res) => {
  // .get( (req, res) => {
    console.log('Showing profile!');
    console.log(req.user);
    res.render(process.cwd() + '/views/pug/profile', {
      username: req.user.username,
    });
  });

app.route('/logout')
  .get((req, res) => {
    console.log('Logging out!');
    req.logout();
    res.redirect('/');
  });




mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {

  let db = client.db('fcc-advanced-node');

  if (err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');


    passport.serializeUser((user, done) => {
      console.log(`Serializaing ${user._id}`);
      done(null, user._id);
    });

    // note the usage of object ID!!!!
    passport.deserializeUser((id, done) => {
      console.log(`Deserializaing ${id}`);
      // db.collection('users').find({ _id: ObjectID(id) }).limit(1).toArray(
      db.collection('users').findOne({ _id: ObjectID(id) },
      // db.collection('users').find({ _id: ObjectID(id) }).toArray(
        (err, doc) => {
          if (err) done(err);
          console.log('in deserialize');
          console.log(doc);
          done(null, doc);
        }
      );
    });

    passport.use(new LocalStrategy(
      function (username, password, done) {
        console.log('came to passport');
        // console.log('User ' + username + ' attempted to log in.');
        db.collection('users').findOne({ username: username }, function (err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          // if (password !== user.password) { return done(null, false); }
          if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
          console.log(user);
          return done(null, user);
        });
      }
    ));

    app.route('/register')
      .post((req, res, next) => {
        db.collection('users').findOne({ username: req.body.username }, function (err, user) {
          if (err) {
            next(err);
          } else if (user) {
            res.redirect('/');
          } else {
            db.collection('users').insertOne(
              {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password,saltRounds),
                // password: req.body.password
              },
              (err, doc) => {
                if (err) {
                  res.redirect('/');
                } else {
                  next(null, user);
                }
              }
            )
          }
        })
      },
      passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
          console.log('in passport authenticate');
          console.log(req.user);
          res.redirect('/profile');
        }
      );




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
      console.log("Listening on port " + process.env.PORT);
    });

  }
});


