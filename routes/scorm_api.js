/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , clog = require('clog')
  , useragent_parser = require('useragent_parser')
  , Boom = require('boom')
  , _json = function (res, status, obj) {
      res.status(status).json(obj);
    };

/*  
 * SCORM DATA QUICK REFERENCE
 * ==========================
 *
 * cmi.completion_status   completed, incomplete, not_attempted, unknown
 * cmi.progress_measure    0 <= val <= 1
 * cmi.exit                suspend, normal (write only for SCO)
 * cmi.location            characterstring (only SCO)
 * cmi.score.raw
 * cmi.success_status      passed, failed, unknown
 * cmi.suspend_data        string (if cmi.exit === suspend, only SCO)
 * cmi.session_time        s
 * cmi.total_time          only LMS, r/o
 */

var _getLastReport = function (user_id, course_id, callback) {
  db.get('_design/lms/_list/last-report-event/reports', { 
    startkey: [user_id, course_id, {}], 
    endkey: [user_id, course_id, null], 
    include_docs: true,
    descending: true 
  }, function (err, body) {
    if (err) {
      callback(err);
    } else {
      clog.warn('Last report', body[0]);
      callback(null, body[0]);
    }
  });
};



function initialize(req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id');
    
  _getLastReport(user_id, course_id, function (err, report) {
    if (typeof report.sco_data !== 'object') report.sco_data = {};
    
    db.atomic('lms', 'report', undefined, {
      course_id: report.course_id
    , user_id: report.user_id
    , event_type: 'initialize'
    , event_description: 'Corso caricato'
    , sco_data: report.sco_data
    , extra: { 'user-agent': useragent_parser.prettyParse(req.headers['user-agent']) }
    , created_on: new Date()
    }, function (err) {
      if (err) {
        clog.error('SCORM.Initialize error', err);
        next(Boom.internal('SCORM.Initialize error'));
      }
      
      _json(res, 200, { ok: true, x_captivity_message: 'Captivity Ready' });
    });
    
  });
}


function terminate(req, res, next) {
  _json(res, 200, { ok: true, x_captivity_message: 'Bye bye.' });
}


function get(req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id')
    , key = req.param('key')
    , value = req.param('value');
    
  
}


function noop(req, res) {
  _json(res, 404, { noop: true });
}


module.exports = function (app) {
  var PREFIX = '/SCORM/:user_id/:course_id';
  
  app.post(PREFIX + '/Initialize', initialize);
  app.post(PREFIX + '/Terminate', terminate);
  app.post(PREFIX + '/Set', noop);
  app.post(PREFIX + '/Get', noop);
  app.post(PREFIX + '/Commit', noop);
};
 