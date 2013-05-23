/*jshint couch:true, laxcomma:true */

function (doc, req) {
  var ret = []
    , last = null
    , row;
  
  while (row = getRow()) {
    var skey = row.key.slice(0, 2);
    
    if (last !== null && last[0] === skey[0] && last[1] === skey[1]) {
      continue;
    } else {
      log('adding doc because ' + last + ' != ' + skey);
      
      last = skey;
      ret.push(row.doc);
    }
  }
  
  return toJSON(ret);
}