
const passport = require('passport');
// const express = require('express');

module.exports = function (app, db) {

  function ensureAuthenticated(req, res, next) {
    // console.log('check auth');
    // console.log(req.user); 
    if (req.isAuthenticated()) {
      // console.log('success auth');
      return next();
    }
    return res.redirect('/');
    // return next();
  }

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
    passport.authenticate('local', { failureRedirect: '/' }),
    function (req, res) {
      // If this function gets called, authentication was successful.
      // `req.user` contains the authenticated user.
      res.redirect('/profile');
    });


  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      // .get( (req, res) => {
      // console.log('Showing profile!');
      // console.log(req.user);
      res.render(process.cwd() + '/views/pug/profile', {
        username: req.user.username,
      });
    });

  app.route('/logout')
    .get((req, res) => {
      // console.log('Logging out!');
      req.logout();
      res.redirect('/');
    });

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
              password: bcrypt.hashSync(req.body.password, saltRounds),
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
        // console.log('in passport authenticate');
        // console.log(req.user);
        res.redirect('/profile');
      }
    );

}