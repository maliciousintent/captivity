/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var express = require('express')
  , http = require('http')
  , path = require('path')  
  , clog = require('clog')
  , colors = require('colors')
  , asciify = require('asciify');

clog.info('Booting...');

if (!process.env.DATABASE_URL) {
  clog.error('A required env variable is missing. Not starting.');
  process.exit(1);
}

asciify('Captivity', function (err, res) { 
  console.log(res.bold.yellow + '\t\t\t\t\t     LMS Server'.bold);
  console.log();
});

var app = express();


// all environments
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

// development only
if ('development' == app.get('env')) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
}


require('./routes/users.js')(app);
require('./routes/courses.js')(app);
require('./routes/scorm_api.js')(app);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
