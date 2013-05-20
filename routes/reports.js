/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('clog')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid');

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

    data.reports = data.reports.rows.map(function (row) { return row.doc; });
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



module.exports = function (app) {
  var PREFIX = '/reports';
  
  app.get(PREFIX, reportsList);
};
 
 