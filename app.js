/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

var express = require('express')
  , http = require('http')
  , path = require('path')  
  , clog = require('clog')
  , flash = require('connect-flash')
  , RedisStore = require('connect-redis')(express)
  , colors = require('colors')
  , asciify = require('asciify')
  , Boom = require('boom');

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
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({ secret: 'asdasaq9389uionjkefsf', store: new RedisStore() }));
app.use(flash());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.errorHandler());

app.use(function _404handler(req, res, next) {
  next(Boom.notFound('Not found'));
});

app.use(function _exceptionHandler(err, req, res, next) {
  clog.error('Handling error', err);
  
  if (err.isBoom !== true) {
    err = Boom.internal(err);
  }
  
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    res.status(err.response.code).json({ error: err.response.code });
    
  } else {
    res.status(err.response.code).render('error', {
      error: err
    , production: (app.get('env') === 'production')
    });
  }
  
});


require('./routes/users.js')(app);
require('./routes/courses.js')(app);
require('./routes/reports.js')(app);
require('./routes/scorm_api.js')(app);
require('./routes/player.js')(app);
require('./routes/login-utils.js').setupLogin(app);


app.get('/', function (req, res) {
  res.redirect('/courses');
});


http.createServer(app).listen(app.get('port'), function () {
  clog.ok('Application started at {0} on port {1}'.format(new Date(), app.get('port')));
});
