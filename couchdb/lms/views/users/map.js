/*jshint couch:true, laxcomma:true, indent:2 */

function (doc) {
  if (doc.type === 'user') {
    emit(doc, null);
  }
}
