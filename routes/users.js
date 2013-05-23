/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('clog')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid')
  , bcrypt = require('bcrypt')
  , login = require('./login-utils');

require('sugar');
moment.lang('it');


function usersList(req, res, next) {
  
  db.view('lms', 'users', { include_docs: true }, function (err, doc) {
    if (err) {
      clog.error('Cannot get courses list:', err);
      return next(err);
    }
    
    db.view('lms', 'courses', { include_docs: true }, function (err, courses_doc) {
      if (err) {
        clog.error('Cannot get courses list:', err);
        return next(err);
      }
      
      res.render('users_list', {
        users: doc.rows
      , courses: courses_doc.rows
      , moment: moment
      , message: req.flash('message')
      , error: req.flash('error')
      });
      
    });
    
  });
}


function usersForm(req, res, next) {
  var user_id = req.param('id') || undefined;
  
  async.waterfall([
    
    function (done) {
      if (user_id) {
        db.get(user_id, function (err, doc) {
          done(err, doc);
        });
      } else {
        done(null, {});
      }
    },
    
    function (doc, done) {
      res.render('users_add', {
        message: req.flash('message')
      , errors: req.flash('errors')
      , pagina: doc
      });
      done();
    }
    
  ], function (err) {
    if (err) {
      return next(err);
    }
  });
}


function userUpdate(req, res, next) {
  var _id = req.param('_id') || undefined
    , errors = [];
  
  clog.debug('Saving user...');
  
  async.waterfall([
    
    function getUser(done) {
      if (_id) {
        db.get(_id, done);
        
      } else {
        var data = {
          type: 'user'
        , created_on: new Date()
        , enabled: true
        , _id: undefined
        , _rev: undefined
        , courses: []
        };
        
        done(null, data);
      }
    },
    
    function saveUser(data, done) {
      
      data.name = req.param('name');
      data.email = req.param('email');
      data.company = req.param('company');
      data.description = req.param('description');
      data.language = req.param('language');
      data.username = req.param('username');
      
      if (req.param('password') !== '') {
        data.password = bcrypt.hashSync(req.param('password'), bcrypt.genSaltSync(12));
      }
      
      db.insert(data, data._id, function (err, body) {
        if (err) {
          return next(err);
        }
        
        req.flash('message', 'L\'utente è stato salvato correttamente.');
        clog.ok('Corso salvato correttamente (id: {0}, rev: {1})'.format(body.id, body.rev));
        res.redirect('/users');
      });
    }
  ]);
}


function userLoginAs(req, res, next) {
  // Admin users can login to non-admin sections impersonating other users
  // See login-utils.requireLogin for the implementation
  
  var as_id = req.param('id');
  
  req.session.user_impersonate = as_id;
  
  if (req.param('next')) {
    res.redirect('/player/' + req.param('next'));
  } else {
    res.redirect('/dashboard');
  }
}


function userToggleForm(req, res, next) {
  var id = req.param('id');
  
  db.get(id, function (err, doc) {
    if (err) {
      return next(err);
    }
    
    res.render('users_disable', { 
      doc: doc
    , message: req.flash('message')
    });
  });
}


function userToggle(req, res, next) {
  var _id = req.param('_id')
    , enabled = (req.param('enabled') === 'yes') ? true : false;
  
  db.atomic('lms', 'enabledisable', _id, { enabled: enabled }, function (err, body) {
    if (err) {
      return next(err);
    }
    
    clog.info('User should be enabled. Message:', body);
    res.redirect('/users');
  });
}


function userEnroll(req, res, next) {
  if (!req.param('user') || typeof req.param('user') !== 'object') {
    clog.ok('No users selected for enrollment.');
    req.flash('error', 'Non hai selezionato alcun utente da iscrivere al corso.');
    res.redirect('/users');
    return;
  }
  
  var course_id = req.param('course_id')
    , users = Object.keys(req.param('user'));
  

  async.each(users, function (user_id, callback) {
    clog.debug('Enrolling user {0} to course {1}'.format(user_id, course_id));
    
    db.atomic('lms', 'user-enroll', user_id, { course_id: course_id }, function (err, body) {
      if (err) {
        clog.warn('Cannot enroll user {0}, skipping. DB Error:', err);
        return callback();
      }

      if (body.ok === true) {
        clog.info('User enroll completed {0}'.format(user_id));

        db.atomic('lms', 'report', '', { course_id: course_id, user_id: user_id, event_type: 'enroll', event_description: 'Enrolled' }, function (err, body) {
          if (err) {
            clog.warn('User cannot be enrolled (cannot create report).', err);
            return callback();
          }

          clog.info('User report created.');
          callback();
        });
      } else {
        clog.warn('Cannot enroll user {0}'.format(user_id));
      }
      
    });
    
  }, function () {
    clog.ok('Users enroll completed.');
    req.flash('message', 'Gli utenti selezionati sono stati iscritti al corso.');
    res.redirect('/users');
  });

}


module.exports = function (app) {
  var PREFIX = '/users';
  
  app.get(PREFIX, login.requireLogin('admin'), usersList);
  
  app.get(PREFIX + '/login/:id', login.requireLogin('admin'), userLoginAs);
  
  app.get(PREFIX + '/form', login.requireLogin('admin'), usersForm);
  app.get(PREFIX + '/form/:id', login.requireLogin('admin'), usersForm);
  app.post(PREFIX, login.requireLogin('admin'), userUpdate);
  
  app.get(PREFIX + '/disable/:id', login.requireLogin('admin'), userToggleForm);
  app.put(PREFIX + '/disable', login.requireLogin('admin'), userToggle);
  
  app.put(PREFIX + '/enroll', login.requireLogin('admin'), userEnroll);
};
 
 