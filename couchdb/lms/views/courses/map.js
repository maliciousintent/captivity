/*jshint couch:true, laxcomma:true, indent:2 */

function (doc) {
  if (doc.type === 'course') {
    emit(doc._id, null);
  }
}
