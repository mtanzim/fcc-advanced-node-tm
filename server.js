'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');
const LocalStrategy = require('passport-local');

const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

// const userid = ObjectID();
// const user = {_id:ObjectID()};


const app = express();

fccTesting(app); //For FCC testing purposes

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/');
};

app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.route('/')
  .get((req, res) => {
     res.render(process.cwd() +'/views/pug/index', {
       title:'Hello', 
       message:'Please login!', 
       showLogin: true,
       
     });
  });


// app.post('/login',
//   passport.authenticate('local', { successRedirect: '/',
//                                    failureRedirect: '/',
//                                  })
// );

app.route('/login')
  .post( (req,res, next) => {
    // console.log('posting');
    // console.log(req.body);
    passport.authenticate('local', function (err, user, info) {
      // return res.redirect('/');
      if (err) return next(err);
      // if (!user) return next(new Error(info));
      if (!user) return res.redirect('/');
      req.login(user, function (err) {
        if (err) return next(err);
        return res.redirect('/');
        // return res.json(user);
      });
    })(req, res, next);
});


app.route('/profile')
  .get(ensureAuthenticated, (req,res) => {
       res.render(process.cwd() + '/views/pug/profile',{
         username: req.user.username,
       });
  });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var error = new Error('Not found!');
  next(error);
});

//provide err argument before req to tell Express it's an error handling function
app.use((err, req, res, next) => {
  res.status(500).send(`Error found: ${err.message}`);
})


mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
    
    passport.serializeUser((user, done) => {
       done(null, user._id);
     });

    passport.deserializeUser((id, done) => {
      db.collection('users').findOne(
          {_id: new ObjectID(id)},
          (err, doc) => {
              done(null, doc);
          }
      );
    })
    
    passport.use(new LocalStrategy(
      
      function(username, password, done) {
        // console.log('came to passport');
        console.log('User '+ username +' attempted to log in.');
        return done(null, false, 'fake user');
        // db.collection('users').findOne({ username: username }, function (err, user) {
          // if (err) { return done(err); }
          // if (!user) { return done(null, false); }
          // if (password !== user.password) { return done(null, false); }
          // return done(null, user);
        // });
      }
    ));
    
    //serialization and app.listen
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

  }
});


