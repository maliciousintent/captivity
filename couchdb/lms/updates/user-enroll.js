/*jshint couch:true, eqnull:true, laxcomma:true */

function(doc, req) {
  var body = JSON.parse(req.body);
  
  if (!doc || (doc && doc.type !== 'user')) {
    return [null, 'Cannot update this document (design).'];
  }
  
  if (!Array.isArray(doc.courses)) {
    doc.courses = [];
  }
  
  doc.courses.push({ course_id: body.course_id, enrolled_on: new Date() });
  return [doc, '{ "ok": true }'];
}