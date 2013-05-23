/*jshint couch:true, laxcomma:true, indent:2 */

function (keys, values, rereduce) {
  log(keys);
  return keys[0][1];
}
