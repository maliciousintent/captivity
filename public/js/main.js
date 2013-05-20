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
  var reloadCounter = function () {
    var count = $('form.live-checkbox td input[type="checkbox"]:checked').size();
    if (count === 0) {
      $('#counter').html('Nessun utente selezionato');
    } else if (count === 1) {
      $('#counter').html('Iscrivi <b>' + count + ' utente</b> selezionato al corso:');
    } else {
      $('#counter').html('Iscrivi <b>' + count + ' utenti</b> selezionati al corso:');
    }
  };

  $('form.live-checkbox th input[type="checkbox"]').on('click', function () {
    var status = $(this).is(':checked') ? true : false;
    if (status) {
      $('form.live-checkbox td input[type="checkbox"]:visible:not(:checked)').trigger('click');
    } else {
      $('form.live-checkbox td input[type="checkbox"]:visible:checked').trigger('click');
    }
    reloadCounter();
  });

  $('form.live-checkbox td input[type="checkbox"]').on('click', function () {
    var status = $(this).is(':checked') ? true : false;
    if (status) {
      $(this).closest('tr').addClass('success');
    } else {
      $('form.live-checkbox th input[type="checkbox"]').removeAttr('checked');
      $(this).closest('tr').removeClass('success');
    }
    reloadCounter();
  });

  $('#user-search').on('keyup', function () {
    var realtimetarget = $('#' + $(this).attr('data-search-target') + ' tbody');
    if(this.value.trim() === "") {
      realtimetarget.find('tr').show();
    } else {
      realtimetarget.find('tr').hide();
      var data = this.value.trim().toLowerCase().split(" ");
      var jo = realtimetarget.find('tr'); 

      $.each(jo, function(itr, tr) {
        var foundArray = new Array();
        $.each($(tr).find('td:not(.avoid-search)'), function(itd, td) {
          $.each(data, function(itoken, token) {
            if(token !== "" && $(td).text().toLowerCase().search(token) >= 0 && $.inArray(token, foundArray) === -1) {
              foundArray.push(token);
            }
          });
        });
        if(foundArray.length === data.length) {
          $(tr).show();
        }
      });
    }
  });

});
