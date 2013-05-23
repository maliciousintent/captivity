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
  , fs = require('fs')
  , login = require('./login-utils')
  , Boom = require('boom');

require('sugar');
moment.lang('it');


function player(req, res, next) {
  var url = req.param('url')
    , user = req.user;
    
  if (req.user.admin) {
    return next(Boom.forbidden('Admin role not allowed here.'));
  }
  
  db.view('lms', 'courses-by-url', { key: url, include_docs: true }, function (err, body) {
    if (err) {
      clog.error('Error getting course by url', err);
      return next(err);
    }
    
    if (body.rows.length !== 1) {
      clog.error('No course found with URL', url);
      return next(new Error('No course found at that URL.'));
    }
    
    var course = body.rows[0].doc;
    
    if (course.enabled === false) {
      return next(Boom.forbidden('Spiacente, il corso è stato sospeso.'));
      //return res.render('player_disabled', { scorm: course });
    }
    
    res.render('player', {
      course: course
    , user: user
    });
  });
}


function dashboard(req, res, next) {
  var user_id = req.user._id;
  
  if (req.user.admin) {
    return next(Boom.forbidden('Admin role not allowed here.'));
  }
  
  db.get('_design/lms/_list/last-report-event/reports', { endkey: [user_id, null, null], startkey: [user_id, {}, {}], include_docs: true, descending: true }, function (err, reports) {
    if (err) {
      clog.error('Error getting courses list for this user', err);
      return next(err);
    }
    
    clog.warn('reports', reports);
    
    var courses_ids = reports.map(function (row) { return row.course_id; }).unique()
      , courses;
    
    db.view('lms', 'courses', { keys: courses_ids, include_docs: true }, function (err, courses) {
      if (err) {
        clog.error('Error getting courses docs', err);
        return next(err);
      }
      
      courses = courses.rows.map(function (row) { return row.doc; }).groupBy('_id');
      reports = reports.map(function _expandDoc(row) {
        if (courses[row.course_id] != null) {
          row.course = courses[row.course_id][0];        
          return row;
        }
      });
      
      res.render('dashboard', {
        reports: reports
      , moment: moment
      , user: req.user
      });
    });
  });
}


module.exports = function (app) {
  var PREFIX = '/player';  
  
  app.get(PREFIX + '/:url', login.requireLogin(), player);
  app.get('/dashboard', login.requireLogin(), dashboard);
};
 