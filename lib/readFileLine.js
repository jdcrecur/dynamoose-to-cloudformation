var fs = require('fs')
var BR = require('os').EOL

function linesStrToArray (linesStr) {
  if (linesStr === '') {
    return []
  }
  return linesStr.split(BR)
}

module.exports = function (filePath, options) {
  var linesStr = fs.readFileSync(filePath, options).toString()
  return linesStrToArray(linesStr)
}