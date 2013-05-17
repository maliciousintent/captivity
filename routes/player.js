/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('clog')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid')
  , fs = require('fs');

require('sugar');
moment.lang('it');



function player(req, res, next) {
  var url = req.param('url');
  
  db.view('lms', 'courses-by-url', { key: url, include_docs: true }, function (err, body) {
    if (err) {
      clog.error('Error getting course by url', err);
      return next(err);
    }
    
    if (body.rows.length !== 1) {
      clog.error('No course found with URL', url);
      return next(new Error('No course found at that URL.'));
    }
    
    res.render('player', { scorm: body.rows[0].doc });
  });
}


module.exports = function (app) {
  var PREFIX = '/player';  
  app.get(PREFIX + '/:url', player);
};
 