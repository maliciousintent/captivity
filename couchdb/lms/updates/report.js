/*jshint couch:true, eqnull:true, laxcomma:true */

function(doc, req) {
  var body = JSON.parse(req.body);
  
  if (doc && doc.type !== 'report') {
    return [null, 'Cannot update this document (design).'];
  }

  if (!body.action || body.action === 'create') {
    log('Creating report document');

    doc = doc || {
      _id: req.uuid
    , type: 'report'
    , course_id: body.course_id
    , user_id: body.user_id
    , created_on: new Date()
    };

  }
  
  return [doc, '{ "ok": true }'];
}