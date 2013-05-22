/*jshint couch:true, eqnull:true, laxcomma:true */

function(doc, req) {
  var body = JSON.parse(req.body);
  
  if (doc) {
    return [null, 'Report documents cannot be updated.'];
  }

  doc = doc || {
    _id: req.uuid
  , type: 'report'
  , course_id: body.course_id
  , user_id: body.user_id
  , event_type: body.event_type
  , event_description: body.event_description
  , sco_data: body.sco_data || {}
  , extra: body.extra || {}
  , created_on: new Date()
  };
  
  return [doc, '{ "ok": true }'];
}