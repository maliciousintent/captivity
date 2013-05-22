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
    
  db.view('lms', 'reports', { startkey: [user_id, null, null], endkey: [user_id, {}, {}], include_docs: true }, function (err, reports) {
    if (err) {
      clog.error('Error getting courses list for this user', err);
      return next(err);
    }
    
    var courses_ids = reports.rows.map(function (row) { return row.doc.course_id; }).unique()
      , courses;
    
    db.view('lms', 'courses', { keys: courses_ids, include_docs: true }, function (err, courses) {
      if (err) {
        clog.error('Error getting courses docs', err);
        return next(err);
      }
      
      courses = courses.rows.map(function (row) { return row.doc; }).groupBy('_id');      
      reports = reports.rows.map(function _expandDoc(row) {
        clog.warn('id', row.doc.course_id);
        if (courses[row.doc.course_id] != null) {
          row.doc.course = courses[row.doc.course_id][0];        
          return row.doc;
        }
      });
      
      res.render('dashboard', {
        reports: reports
      , moment: moment
      });
    });
  });
}


module.exports = function (app) {
  var PREFIX = '/player';  
  
  app.get(PREFIX + '/:url', login.requireLogin(), player);
  app.get('/dashboard', login.requireLogin(), dashboard);
};
 