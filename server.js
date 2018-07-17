'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

// const userid = ObjectID();
const user = {_id:ObjectID()};


const app = express();

fccTesting(app); //For FCC testing purposes
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
    // res.sendFile(process.cwd() + '/views/index.html');
     res.render(process.cwd() +'/views/pug/index', {title:'Hello', message:'Please login!'});
  });


mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
    
    passport.serializeUser((user, done) => {
       done(null, user._id);
     });

    passport.deserializeUser((id, done) => {
      done(null,null);
      // db.collection('users').findOne(
      //     {_id: new ObjectID(id)},
      //     (err, doc) => {
      //         done(null, doc);
      //     }
      // );
    })
    
    //serialization and app.listen
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });

}
});


