# dynamoose-to-cloudformation

_*beta release*_

## What it will do
Accept an object for a dynamoose model in the following format (Note this is es5 not es6):
```
module.exports = {
  name: 'user',
  attributes: {
    id: {
      type: String,
      required: true,
      hashKey: true,
    },
    forename: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
    }, // etc etc
  },
}
```

The output will be yml usable within a cloud formation for example:
```
TableUser:
  Type: 'AWS::DynamoDB::Table'
Properties:
  TableName: user
  AttributeDefinitions:
    - AttributeName: id
      AttributeType: S
  KeySchema:
    - AttributeName: id
      KeyType: HASH
```

## How to use
- The tool is installed locally to your project
- The tool is used via command line (including a package.json script)
- Available cli arguments:
```
  Usage: index [options]

  Options:

    -v, --version            output the version number
    -i, --input [fullpath]   The es5 input file to parse. Expects the said file to offer a std module.exports object containing name and attributes
    -o, --output [fullpath]  The output path including filename to place the file
    -h, --help               output usage information
```

## Example usage
The below example will require the input file, convert to yaml and write to the output option. Should the output directories not exist then they will also be created, should the output file already exist it will be replaced.
```
node node_modules/dynamoose-to-cloudformation -i ../some/path/src/database/models/descriptions/user.js -o ./dynamodb/descriptions/user.yml
```

See the example folder within this project.

## Current known limitations
- The tool can only create simple secondary RANGE indexes of the name of the attribute.
- Secondary indexes of alternate names to their attribute are currently not possible.
- Global indexes are not currently possible.