/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var colors = require('colors')
  , db = require('nano')(process.env.DATABASE_URL)
  , program = require('commander')
  , async = require('async')
  , bcrypt = require('bcrypt');
  
  
console.log('\nCaptivity Administration Utility'.bold.blue);
console.log('This script will create an administration user. Use Ctrl-C anytime to exit.');


async.waterfall([

  function _askUser(seriesNext) {
    var ok = false
      , it_username
      , it_password;

    async.until(
      function () { return ok; },
      function (iteratorDone) {
        program.prompt('\nUsername'.bold + ' (e.g. first.lastname): ', function (username) {
          username = username.trim();
          
          if (username.length < 6) {
            console.log('Username must be at least 6 characters'.red);
            return iteratorDone();
          }
          
          program.password('Password: '.bold, '*', function (pass) {
            pass = pass.trim();
        
            if (pass.length < 6) {
              console.log('Password must be at least 6 characters'.red);
              return iteratorDone();
            }
              
            program.password('Confirm Password: '.bold, '*', function (pass_confirm) {
              
              if (pass !== pass_confirm) {
                console.log('Passwords does not match'.red);
                iteratorDone();
              } else {
                ok = true;
                it_username = username;
                it_password = pass_confirm;
                iteratorDone();
              }
              
            });
          });
        });
      },
      
      function (err) {
        if (err) throw err;
        seriesNext(null, it_username, it_password);
      }
    );
  },
  
  function _saveUser(username, password, done) {
    password = bcrypt.hashSync(password, bcrypt.genSaltSync(12));
    
    db.insert({
      type: 'user'
    , name: 'Administrator'
    , email: 'administrator@captivity.lms'
    , company: 'Captivity LMS'
    , description: ''
    , language: 'it'
    , created_on: new Date()
    , admin: true
    , enabled: true
    , username: username
    , password: password
    }, function (err) {
      if (err) {
        console.log('\nError saving user to database.\n'.red);
        throw err;
      }
      
      console.log('\nUser created!'.bold.green);
      console.log('Please customize user details from the admin control panel.'.green);
    });
    
  }
]);

