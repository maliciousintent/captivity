/*jshint couch:true, eqnull:true, laxcomma:true */

function(doc, req) {
  var body = JSON.parse(req.body);
  
  if (!doc || doc.type !== 'course') {
    return [null, 'Cannot update this document (design).'];
  }
  
  doc.enabled = !!body.enabled;
  return [doc, '{ "ok": true }'];
}