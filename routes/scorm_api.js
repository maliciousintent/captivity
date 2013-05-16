/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , clog = require('clog');

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

function postSCORM(req, res, next) {
  res.status(200).json({ error: 'E_NOT_IMPLEMENTED', message: 'LMS does not implement this function.' });
}
 
 
module.exports = function (app) {
  var PREFIX = '/SCORM';
  app.post(PREFIX + '/*', postSCORM);
};
 