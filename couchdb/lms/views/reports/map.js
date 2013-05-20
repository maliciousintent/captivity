/*jshint couch:true, laxcomma:true, indent:2 */

function (doc) {
  if (doc.type === 'report') {
    emit([doc._id, doc.user_id, doc.course_id], null);
  }
}
