/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , clog = require('clog')
  , bcrypt = require('bcrypt');
  

function _redirectToLogin(req, res, message) {
  var next = req.url || '/';
  
  if (message) {
    req.flash('error', message);
  }
  
  return res.redirect('/login');
}


module.exports.requireLogin = function (require_role) {
  return function (req, res, next) {
    
    if (!req.session.user) {
      return _redirectToLogin(req, res, 'Login is required to view this page.');
    }
    
    db.get(req.session.user, function (err, doc) {
      if (err) {
        return next(err);
      }
      
      if (doc.enabled !== true) {
        return _redirectToLogin(req, res, 'Your user is not enabled.');
      }
      
      if (require_role === 'admin' && doc.admin !== true) {
        return _redirectToLogin(req, res, 'Admin role is required to access this page.');
      }
      
      next();
    });
    
  };
};


module.exports.setupLogin = function (app) {
  app.get('/login', function _displayLoginForm(req, res, next) {
    res.render('login', {
      message: req.flash('message')
    , error: req.flash('error')
    });
  });
  
  app.post('/login', function _processLogin(req, res, next) {
    var username = req.param('username').trim()
      , password = req.param('password').trim();
      
    if (username.length < 6 || password.length < 6) {
      req.flash('error', 'Utente o password non sono validi.');
      return res.redirect('/login');
    }
    
    db.view('lms', 'user-by-username', { key: username, include_docs: true }, function (err, body) {
      if (err) {
        clog.error('Cannot get user.', err);
        return next(err);
      }
      
      if (body.rows.length !== 1) {
        req.flash('error', 'Utente o password non sono corretti.');
        return res.redirect('/login');
      }
      
      var doc = body.rows[0].doc;
      
      if (doc.enabled !== true) {
        req.flash('error', 'Account non attivo.');
        return res.redirect('/login');
      }
      
      
      bcrypt.compare(password, doc.password, function (err, ok) {
        if (err) {
          clog.error('bcrypt compare error:', err);
          return next(err);
        }
        
        var redirect;
        
        if (ok) {
          req.session.user = doc._id;
          req.session.admin = !!doc.admin;
                    
          if (doc.admin) {
            redirect = '/courses';
          } else {
            redirect = '/dashboard';
          }
          
          return res.redirect(redirect);
          
        } else {
          req.flash('error', 'Utente o password non sono corretti.');
          return res.redirect('/login');
        }
      });
    });
    
  });
  
  app.get('/logout', function _doLogout(req, res) {
    req.session.destroy();
    res.redirect('/');
  });
};

