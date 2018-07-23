
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

const bcrypt = require('bcrypt');
module.exports = function (app, db) {
  passport.serializeUser((user, done) => {
    // console.log(`Serializaing ${user._id}`);
    done(null, user._id);
  });

  // note the usage of object ID!!!!
  passport.deserializeUser((id, done) => {
    // console.log(`Deserializaing ${id}`);
    // db.collection('users').find({ _id: ObjectID(id) }).limit(1).toArray(
    db.collection('users').findOne({ _id: ObjectID(id) },
      // db.collection('users').find({ _id: ObjectID(id) }).toArray(
      (err, doc) => {
        if (err) done(err);
        // console.log('in deserialize');
        // console.log(doc);
        done(null, doc);
      }
    );
  });

  passport.use(new LocalStrategy(
    function (username, password, done) {
      // console.log('came to passport');
      // // console.log('User ' + username + ' attempted to log in.');
      db.collection('users').findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        // if (password !== user.password) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
        // console.log(user);
        return done(null, user);
      });
    }
  ));
}