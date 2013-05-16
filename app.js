/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var express = require('express')
  , http = require('http')
  , path = require('path')  
  , clog = require('clog')
  , colors = require('colors')
  , asciify = require('asciify');

require('sugar');
require('string-format');

clog.info('Booting...');

if (!process.env.DATABASE_URL) {
  clog.error('A required env variable is missing. Not starting.');
  process.exit(1);
}

asciify('Captivity', function (err, res) { 
  console.log(res.bold.blue + '\t\t\t\t\t     LMS Server'.bold);
  console.log();
});

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
}


require('./routes/users.js')(app);
require('./routes/courses.js')(app);
require('./routes/scorm_api.js')(app);

app.get('/', function (req, res) {
  res.redirect('/courses');
});


http.createServer(app).listen(app.get('port'), function () {
  clog.ok('Application started at {0} on port {1}'.format(new Date(), app.get('port')));
});
