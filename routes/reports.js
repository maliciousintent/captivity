/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('coolog').logger('reports.js')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid')
  , login = require('./login-utils');

require('sugar');
moment.lang('it');


function reportsList(req, res, next) {
  
  async.parallel({
    reports: function (done) {
      var params = { include_docs: true, descending: true };
      
      if (req.param('filter_user')) {
        params.startkey = [req.param('filter_user'), {}, {}];
        params.endkey = [req.param('filter_user'), null, null];
      }
      
      db.get('_design/lms/_list/last-report-event/reports', params, function (err, body) {
        if (err) {
          clog.error('Cannot get reports list:', err);
          return done(err);
        }
        
        done(null, body);
      });
    },

    courses: function (done) {
      db.view('lms', 'courses', { include_docs: true }, function (err, doc) {
        if (err) {
          clog.error('Cannot get courses list:', err);
          return done(err);
        }
        
        done(null, doc);
      });
    },

    users: function (done) {
      db.view('lms', 'users', { include_docs: true }, function (err, doc) {
        if (err) {
          clog.error('Cannot get users list:', err);
          return done(err);
        }
        
        done(null, doc);
      });
    }

  }, function (err, data) {
    if (err) {
      return next(err);
    }
    
    data.reports = data.reports.sortBy('created_on', true);
    data.courses = data.courses.rows.map(function (row) { return row.doc; }).groupBy('_id'); //.map(function (row) { return row[0].doc; });
    data.users = data.users.rows.map(function (row) { return row.doc; }).groupBy('_id'); //.map(function (row) { return row[0].doc; });
    
    res.render('reports_list', {
      reports: data.reports
    , courses: data.courses
    , users: data.users
    , moment: moment
    , filtered: !!req.param('filter_user')
    , message: req.flash('message')
    , error: req.flash('error')
    });
  });
}


function reportDetail (req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id');
  
  db.view('lms', 'reports', { startkey: [user_id, course_id, {}], endkey: [user_id, course_id, null], include_docs: true, descending: true }, function (err, body) {
    if (err) {
      clog.error('Cannot get details for this report.');
      return next(err);
    }
    
    var reports = body.rows.map(function (row) { return row.doc; });
    
    async.parallel({
      user: function (done) {
        db.get(user_id, done);
      },
      course: function (done) {
        db.get(course_id, done);
      }
    }, function (err, data) {
      if (err) {
        clog.error('Cannot get user or course for this report.');
        return next(err);
      }
      
      res.render('reports_detail', {
        reports: reports
      , user: data.user[0]
      , course: data.course[0]
      , moment: moment
      });
    });

  });
}


module.exports = function (app) {
  var PREFIX = '/reports';
  
  app.get(PREFIX, login.requireLogin('admin'), reportsList);
  app.get(PREFIX + '/:user_id/:course_id', login.requireLogin('admin'), reportDetail);
};
 
 