/*jshint node:true, laxcomma:true, indent:2, eqnull:true */

'use strict';

require('sugar');
var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('coolog').logger('courses.js')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid')
  , spawn = require('child_process').spawn
  , fs = require('fs')
  , login = require('./login-utils')
  ;

moment.lang('it');

function _uploadToCloud(path, callback) {
  // should recursively upload "path" to a cloud storage
  // when done callback gets called with the cloud base path
  // 
  // @REQUIRES pip install awscli
  // 
  
  var id = uuid.v4()
    , S3_BUCKET = 'media-captivity'
    , s3_object_url = 'https://s3-eu-west-1.amazonaws.com/' + S3_BUCKET + '/' + id
    ;
  
  clog.debug('Cloud uploading {0} with id {1}'.format(path, id));
  
  var sync = spawn('aws', ['s3', 'cp', '--recursive', path, 's3://' + S3_BUCKET + '/' + id + '/']);
  
  sync.on('close', function (code) {
    if (code !== 0) {
      clog.error('Cloud upload failed with exit code', code);
      callback(new Error('Cloud upload failed with exit code ' + code));
      return;
    }
    
    clog.ok('Cloud upload completed to', s3_object_url);
    callback(null, s3_object_url);
  });
}


function coursesList(req, res, next) {
  db.view('lms', 'courses', { include_docs: true }, function (err, doc) {
    if (err) {
      return next(err);
    }
    
    res.render('courses_list', {
      courses: doc.rows
    , moment: moment
    });
  }); 
}


function coursesForm(req, res, next) {
  var course_id = req.param('id') || undefined;
  
  async.waterfall([
    
    function (done) {
      if (course_id) {
        db.get(course_id, function (err, doc) {
          done(err, doc);
        });
      } else {
        done(null, {});
      }
    },
    
    function (doc, done) {
      res.render('courses_add', {
        message: req.flash('message')
      , errors: req.flash('errors')
      , pagina: doc
      });
      done();
    }
    
  ], function (err) {
    if (err) {
      return next(err);
    }
  });
}


function courseUpdate(req, res, next) {
  var data = {
      type: 'course'
    , created_on: new Date()
    , enabled: true
    , name: req.param('name')
    , url: req.param('name').parameterize()
    , description: req.param('description')
    , max_attempts: req.param('max_attempts')
    , cover_image: req.param('cover_image')
    , scorm: req.param('scorm_uri')
    , scorm_index: req.param('scorm_index')
    , _id: req.param('_id') || undefined
    , _rev: req.param('_rev') || undefined
    }
    , errors = [];
  
  async.series([
  
    function uploadScormPackage(done) {
      if (req.files.scorm && req.files.scorm.size > 0) {
        tmp.dir(function _tempDirCreated(err, path) {
          if (err) {
            clog.error('Error creating temp dir.');
            return next(err);
          }
          
          clog.debug('Extracting SCORM zipfile to', path);
          
          var unzipStream = unzip.Extract({ path: path });
          
          unzipStream.on('error', function (err) {
            clog.error('Unzip extract error', err);
            return next(err);
          });
          
          unzipStream.on('close', function () {
            _uploadToCloud(path, function (err, path) {
              if (err) {
                clog.error('Cannot cloud-upload', err);
                return next(err);
              }
              
              data.scorm = path;
              clog.info('SCORM cloud upload completed to ' + path);
              done();
            });
          });
          
          fs.createReadStream(req.files.scorm.path).pipe(unzipStream);
        });
      } else {
        clog.debug('Nessuno SCORM zipfile caricato.');
        errors.push('Non è stato caricato nessun pacchetto SCORM.');
        done();
      }
    },
  
    function saveCourse(done) {
      clog.debug('Saving course...');
      
      db.insert(data, data._id, function (err, body) {
        if (err) {
          return next(err);
        }
        
        req.flash('message', 'Il corso è stato salvato correttamente.');
        // req.flash('errors', errors);
        
        clog.ok('Corso salvato correttamente (id: {0}, rev: {1})'.format(body.id, body.rev));
        res.redirect('/courses/form/' + body.id);
        done();
      });
    }
    
  ], function (err) {
    if (err) {
      return next(err);
    }    
  });
}


function courseToggleForm(req, res, next) {
  var id = req.param('id');
  
  db.get(id, function (err, doc) {
    if (err) {
      return next(err);
    }
    
    res.render('courses_disable', { 
      doc: doc
    , message: req.flash('message')
    });
  });
}


function courseToggle(req, res, next) {
  var _id = req.param('_id')
    , enabled = (req.param('enabled') === 'yes') ? true : false;
  
  db.atomic('lms', 'enabledisable', _id, { enabled: enabled }, function (err, body) {
    if (err) {
      return next(err);
    }
    
    clog.info('Course should be enabled. Message:', body);
    
    res.redirect('/courses');
  });
}




module.exports = function (app) {
  var PREFIX = '/courses';
  
  app.get(PREFIX, login.requireLogin('admin'), coursesList);
  
  app.get(PREFIX + '/form', login.requireLogin('admin'), coursesForm);
  app.get(PREFIX + '/form/:id', login.requireLogin('admin'), coursesForm);
  app.post(PREFIX, login.requireLogin('admin'), courseUpdate);
  
  app.get(PREFIX + '/disable/:id', login.requireLogin('admin'), courseToggleForm);
  app.put(PREFIX + '/disable', login.requireLogin('admin'), courseToggle);
  
};
 
 