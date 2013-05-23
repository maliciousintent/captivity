/*jshint browser:true, laxcomma:true, eqnull:true, indent:2, unused:true, undef:true, jquery:true*/

/*
 * (c) 2013 Plastic Panda Snc
 * All rights reserved.
 *
 * Part of Captivity LMS
 * https://bitbucket.org/plasticpanda/captivity
 * Creator: Simone Lusenti <simone@plasticpanda.com>
 *
 */

$(function () {
  'use strict';

  window.onbeforeunload = function () {
    if (window.API) {
      window.API.SetValue('cmi.exit', 'suspend');
      window.API.Commit('');
      window.API.Terminate();
      return 'Sei sicuro di voler lasciare il corso?\nPotrai riprendere il tentativo più tardi.';
    }
  };

  var setDimensions = function () {
    var wh = $(window).height()
      , nh = $('.navbar').outerHeight()   // not used at the moment!
      , margin = 40
      , bpt = parseInt($('body').css('padding-top').replace('px',''), 10);

    setTimeout(function () {
      $('#course-iframe').css({
        'height': (wh - nh - margin) + 'px',
        'margin-top': (nh - bpt + margin/2) + 'px'
      });
    }, 50);
  };

  setDimensions();
  $(window).on('debouncedresize', function () {
    setDimensions();
  });

});
