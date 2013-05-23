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
      return callback(err);
    } else {
      clog.warn('Last report', body[0]);
      return callback(null, body[0]);
    }
  });
};


var _updateSCOData = function (user_id, course_id, report_data, sco_data, callback) {
  _getLastReport(user_id, course_id, function (err, report) {
    if (typeof report.sco_data !== 'object') report.sco_data = {};
    
    db.atomic('lms', 'report', undefined, Object.merge({
      course_id: report.course_id
    , user_id: report.user_id
    , sco_data: Object.merge(report.sco_data, sco_data)
    , created_on: new Date()
    }, report_data), callback);
  });
};


function initialize(req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id');
    
  _updateSCOData(user_id, course_id, {
    event_type: 'initialize'
  , event_description: 'Corso caricato'
  , extra: { 'user-agent': useragent_parser.prettyParse(req.headers['user-agent']) }
  }, {}, function (err) {
    if (err) {
      clog.error('_updateSCOData error', err);
      return next(Boom.internal('_updateSCOData error'));
    }
    
    _json(res, 200, { ok: true, x_captivity_message: 'Captivity Ready' });
  });
}


function commit(req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id')
    , data = JSON.parse(req.param('data'));
    
  clog.warn('SCO DAta', data);
    
  // @TODO: filter SCO data
    
  _updateSCOData(user_id, course_id, {
    event_type: 'commit'
  , event_description: 'Tracciamento progresso'
  }, data, function (err) {
    if (err) {
      clog.error('_updateSCOData error', err);
      return next(Boom.internal('_updateSCOData error'));
    }
    
    _json(res, 200, { ok: true, x_captivity_message: 'Captivity Commit' });
  });
}


function terminate(req, res, next) {
  var user_id = req.param('user_id')
    , course_id = req.param('course_id');
    
  _updateSCOData(user_id, course_id, {
    event_type: 'terminate'
  , event_description: 'Finestra chiusa'
  , extra: { 'user-agent': useragent_parser.prettyParse(req.headers['user-agent']) }
  }, {}, function (err) {
    if (err) {
      clog.error('_updateSCOData error', err);
      return next(Boom.internal('_updateSCOData error'));
    }
    
    _json(res, 200, { ok: true, x_captivity_message: 'Bye bye.' });
  });
}



module.exports = function (app) {
  var PREFIX = '/SCORM/:user_id/:course_id';
  
  app.post(PREFIX + '/Initialize', initialize);
  app.post(PREFIX + '/Terminate', terminate);
  app.post(PREFIX + '/Commit', commit);
};
 