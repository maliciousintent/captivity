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
  , login = require('./login-utils');

require('sugar');
moment.lang('it');


function reportsList(req, res, next) {
  
  async.series({
    reports: function (done) {
      db.view('lms', 'reports', { include_docs: true }, function (err, doc) {
        if (err) {
          clog.error('Cannot get reports list:', err);
          return done(err);
        }

        done(null, doc);
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

    data.reports = data.reports.rows.map(function (row) { return row.doc; }).sortBy('created_on', true);
    data.courses = data.courses.rows.map(function (row) { return row.doc; }).groupBy('_id'); //.map(function (row) { return row[0].doc; });
    data.users = data.users.rows.map(function (row) { return row.doc; }).groupBy('_id'); //.map(function (row) { return row[0].doc; });

    clog.debug('Rendering with data', data);

    res.render('reports_list', {
      reports: data.reports
    , courses: data.courses
    , users: data.users
    , moment: moment
    , message: req.flash('message')
    , error: req.flash('error')
    });
  });
}


function reportDetail (req, res, next) {
  var id = req.param('id');
  
  db.get(id, function (err, doc_report) {
    if (err) {
      clog.error('Cannot get details for this report.');
      return next(err);
    }
    
    if (doc_report.type !== 'report') {
      clog.error('HTTP 404. Cannot get details of a non-report document.');
      return next(new Error('Type mismatch.'));
    }
    
    async.parallel({
      user: function (done) {
        db.get(doc_report.user_id, done);
      },
      course: function (done) {
        db.get(doc_report.course_id, done);
      }
    }, function (err, data) {
      if (err) {
        clog.error('Cannot get user or course for this report.');
        return next(err);
      }
      
      // data.report.events = data.report.events.orderBy('created_on'); ??
      
      res.render('reports_detail', {
        report: doc_report
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
  app.get(PREFIX + '/:id', login.requireLogin('admin'), reportDetail);
};
 
 