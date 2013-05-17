/*jshint curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: "single", sub: true, eqnull: true, indent: 2, unused: true, undef: true, strict: true, laxcomma: true, browser: true, es5: true, jquery: true */
/*global */

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

  /* Sidebar Active Class */
  var hash = window.location.pathname.split('/');
  $('.sidebar ul li a.active').removeClass('active');
  $('.sidebar ul li a[href="/' + hash[1] + '"]').addClass('active');

  /* Select Styler */
  $('.selectpicker').selectpicker();

  /* Live Checkbox */

  $('form.live-checkbox th input[type="checkbox"]').on('click', function () {
    var status = $(this).is(':checked') ? true : false;
    if (status) {
      $('form.live-checkbox td input[type="checkbox"]:visible:not(:checked)').trigger('click');
    } else {
      $('form.live-checkbox td input[type="checkbox"]:visible:checked').trigger('click');
    }
  });

  $('form.live-checkbox td input[type="checkbox"]').on('click', function () {
    var status = $(this).is(':checked') ? true : false;
    if (status) {
      $(this).closest('tr').addClass('success');
    } else {
      $('form.live-checkbox th input[type="checkbox"]').removeAttr('checked');
      $(this).closest('tr').removeClass('success');
    }
  });

});
