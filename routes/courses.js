/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , clog = require('clog');


function coursesList(req, res, next) {
  
  db.view('lms', 'courses', { include_docs: true }, function (err, doc) {
    if (err) {
      return next(err);
    }
    
    res.render('courses_list', {
      courses: doc.rows
    });
  });
  
}



module.exports = function (app) {
  var PREFIX = '/courses';
  
  app.get(PREFIX, coursesList);
};
 
 