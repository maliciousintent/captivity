/*jshint couch:true, laxcomma:true, indent:2 */

function (doc) {
  if (doc.type === 'report') {
    emit([doc.user_id, doc.course_id, doc._id], null);
  }
}
