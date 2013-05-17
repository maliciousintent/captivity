/*jshint node:true, laxcomma:true, indent:2, eqnull:true, es5:true */

'use strict';

var db = require('nano')(process.env.DATABASE_URL)
  , async = require('async')
  , sugar = require('sugar')
  , moment = require('moment')
  , clog = require('clog')
  , tmp = require('tmp')
  , unzip = require('unzip')
  , uuid = require('node-uuid')
  , fs = require('fs');

require('sugar');
moment.lang('it');

if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp');
}

function _uploadToCloud(path, callback) {
  // should recursively upload "path" to a cloud storage
  // when done callback gets called with the cloud base path
  var id = uuid.v4();
  
  clog.info('Uploading {0} to the cloud, id {1}'.format(path, id));
  callback(process.cwd() + '/temp/' + id);
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
    , description: req.param('description')
    , max_attempts: req.param('max_attempts')
    , cover_image: req.param('cover_image')
    , scorm: null
    , scorm_index: req.param('scorm_index')
    , _id: req.param('_id') || undefined
    , _rev: req.param('_rev') || undefined
    };
    
  if (!data._id) {
    data.url = data.name.parameterize();
  }
  
  async.series([
  
    function uploadScormPackage(done) {
      if (req.files.scorm) {
        tmp.dir(function _tempDirCreated(err, path) {
          if (err) {
            clog.error('Error creating temp dir.');
            return next(err);
          }
          
          clog.info('Extracting SCORM zipfile to ', path);
          fs.createReadStream(req.files.scorm.path).pipe(unzip.Extract({ path: path }));
          _uploadToCloud(path, function (path) {
            data.scorm = path;
            done();
          });
        });
      } else {
        done();
      }
    },
  
    function saveCourse(done) {
      db.insert(data, data._id, function (err, body) {
        if (err) {
          return next(err);
        }
        
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
  
  app.get(PREFIX, coursesList);
  
  app.get(PREFIX + '/form', coursesForm);
  app.get(PREFIX + '/form/:id', coursesForm);
  app.post(PREFIX, courseUpdate);
  
  app.get(PREFIX + '/disable/:id', courseToggleForm);
  app.put(PREFIX + '/disable', courseToggle);
  
};
 
 