/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , clog = require('clog');


module.exports = function (app) {
  var PREFIX = '/users/';
  
  
};
 
