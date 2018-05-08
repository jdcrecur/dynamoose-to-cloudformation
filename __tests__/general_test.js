const fs = require('fs-extra')
const line = require('../lib/readFileLine')

const streamArr = line(      fs.readFileSync('./dynamodb/descriptions/stream.yml', 'utf8'))

// console.log(streamArr)

describe('test output', function () {
  it('stream', function (done) {
    // if(streamJson.Outputs.TableUserStreamARN){
    //
    // }
    done()
  })
})
