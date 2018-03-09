const wy = require('write-yaml')
const program = require('commander')
const pkg = require('./package.json')
const _ = require('lodash')
const upperCamelCase = require('uppercamelcase')
const fs = require('fs-extra')
const path = require('path')

program
  .version(pkg.version, '-v, --version')
  .option('-i, --input [fullpath]', 'The es5 input file to parse. Expects the said file to offer a std module.exports object containing name and attributes')
  .option('-o, --output [fullpath]', 'The output path including filename to place the file')
  .parse(process.argv)

if (!program.input || !program.output) {
  throw new Error('Both the input and output arguments are required. Please pass --help for info')
}

program.input = path.join(process.cwd(), program.input)
program.output = path.join(process.cwd(), program.output)

if(!fs.pathExistsSync(program.input)){
  throw new Error('The input path provided does not exist: ' + program.input)
}

try{
  var modelFile = require(program.input)
} catch (e) {
  throw new Error(e)
}
var attributes = modelFile.attributes

var ymlObject = {}
ymlObject['Table' + upperCamelCase(modelFile.name)] = {
  Type: 'AWS::DynamoDB::Table'
}
ymlObject['Properties'] = {
  TableName: modelFile.name,
  AttributeDefinitions: [],
  KeySchema: []
}

_.forIn(attributes, function (value, key) {
  switch (Object(value.type).name) {
    case 'String' :
      attributes[key].dynamoDbType = 'S'
      break
    case 'Number' :
      attributes[key].dynamoDbType = 'S'
      break
    case 'Boolean' :
      attributes[key].dynamoDbType = 'Bool'
      break
  }
  if (value.hashKey || value.index) {
    ymlObject.Properties.AttributeDefinitions.push({
      AttributeName: key,
      AttributeType: attributes[key].dynamoDbType
    })
    ymlObject.Properties.KeySchema.push({
      AttributeName: key,
      KeyType: (value.hashKey) ? 'HASH' : 'RANGE'
    })
  }
})

fs.ensureFileSync(program.output)

wy(program.output, ymlObject, function (err) {
  // do stuff with err
  if (err) {
    throw new Error(err)
  }
})

