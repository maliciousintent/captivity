/*jshint browser: true, indent: 2, laxcomma:true, eqnull: true, unused: true, undef: true, jquery: true */
/*global MicroCache */

/*
 * (c) 2013 Plastic Panda Snc
 * All rights reserved.
 *
 * Captivity API Client
 * https://bitbucket.org/plasticpanda/captivity
 * Creator: <simone@plasticpanda.com>
 *
 */

var API = (function () {
  'use strict';
  
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
  
  var SCORM = {}
    , SCORM_API_PREFIX = window.SCORM_API_PREFIX
    , cache = new MicroCache()
    , committed = true
    , _debug = function () {
        if (window.SCORM_DEBUG === true) {
          var params = ['SCORM:'];
          params.push(Array.prototype.slice.call(arguments, 0));
          console.log.apply(null, params);
        }
      }
    , xhr = function (method, url, data) {
        var ret;
        
        if (!window.SCORM_FAKE) {
          jQuery.ajax({
            url: url,
            type: method,
            data: data,
            success: function(body) {
              ret = body;
            },
            async: false
          });
        } else {
          console.log('Fake SCORM call to', url, 'with data', data);
          ret = 'unknown';
        }
        
        return ret;
      };
  
  
  SCORM.Initialize = function () {
    _debug('Initialize');
    
    var ret = xhr('POST', SCORM_API_PREFIX + 'Initialize', {});
    
    Object.keys(ret.sco_data).forEach(function (key) {
      cache.set(key, ret.sco_data[key]);
    });
    
    return ret;
  };
  
  SCORM.SetValue = function (key, value) {
    _debug('SetValue', key, value);
    
    cache.set(key, value);
    committed = false;
    return 'true';
  };
  
  SCORM.Commit = function (emptystring) {
    _debug('Commit');
    
    if (emptystring !== '') {
      throw new Error('First parameter to SCORM.Commit *must* be an empty string.');
    }
    
    if (!committed && Object.keys(cache.values()).length > 0) {
      committed = true;
      return xhr('POST', SCORM_API_PREFIX + 'Commit', { data: JSON.stringify(cache.values()), date: new Date() });
    } else {
      console.log('Nothing to commit.');
    }
  };
  
  SCORM.GetValue = function (key) {
    _debug('GetValue', key);
    
    var from_cache = cache.get(key)
      , from_xhr;
    
    if (from_cache != null) {
      return from_cache;
    } else {
      from_xhr = xhr('GET', SCORM_API_PREFIX + 'Get', { key: key });
      cache.set(key, from_xhr);
      return from_xhr;
    }
  };
    
  SCORM.Terminate = function () {
    _debug('Terminate');
    xhr('POST', SCORM_API_PREFIX + 'Terminate', {});
  };
  
  // Support Methods
  SCORM.GetLastError = function () {
    throw new Error('GetLastError not implemented.');
  };
  
  SCORM.GetErrorString = function () {
    throw new Error('GetErrorString not implemented.');
  };
  
  return SCORM;
})();


window.API = API;
