var wy = require('write-yaml')
var replaceInFile = require('replace-in-file')
var _ = require('lodash')
var upperCamelCase = require('uppercamelcase')
var fs = require('fs-extra')
var readFile = fs.readFile
var S = require('string')

var ymlObject = {}

var self = {
  process: function (options, files) {
    options = self.optionsPrep(options)
    ymlObject = self.getBaseAttributes(options)

    self.iterator(options, files, function () {

      // write the file to disk and performs any outstanding replacements
      fs.ensureFileSync(options.output)

      wy(options.output, ymlObject, {
        lineWidth: 250
      }, function (err) {
        // Handle the error
        if (err) {
          throw new Error(err)
        }

        //lastly call the replace chars function
        try {
          self.replaceCharsInFile(options.output)
        } catch (err) {
          console.error('Error writing file')
          console.error(err)
        }
      })
    })
  },

  getBaseAttributes: function (options) {
    var ymlObject = {}
    ymlObject.Description = 'Dynamodb cloudformation schema including scaling from https://www.npmjs.com/package/dynamoose-to-cloudformation'
    ymlObject.Parameters = {
      WriteScalingPolicyTarget: {
        Type: 'Number',
        Default: options.WriteScalingPolicyTarget || 50
      },
      ReadScalingPolicyTarget: {
        Type: 'Number',
        Default: options.ReadScalingPolicyTarget || 50
      },
      WriteScalingPolicyScaleInCooldown: {
        Type: 'Number',
        Default: options.WriteScalingPolicyScaleInCooldown || 60
      },
      WriteScalingPolicyScaleOutCooldown: {
        Type: 'Number',
        Default: options.WriteScalingPolicyScaleOutCooldown || 60
      },
      ReadScalingPolicyScaleInCooldown: {
        Type: 'Number',
        Default: options.ReadScalingPolicyScaleInCooldown || 60
      },
      ReadScalingPolicyScaleOutCooldown: {
        Type: 'Number',
        Default: options.ReadScalingPolicyScaleOutCooldown || 60
      }
    }
    if (options.streams) {
      ymlObject.Outputs = {}
    }
    ymlObject.Resources = {}
    return ymlObject
  },

  iterator: function (options, files, cb) {
    if (files.length === 0) {
      return cb()
    }
    self.processSingleModel(options, files.shift(), function () {
      self.iterator(options, files, cb)
    })
  },

  getAllUpperCaseLetters: function (string) {
    var chars = upperCamelCase(string).split('')
    var upperChars = ''
    chars.forEach(function (char) {
      if (upperChars.length === 0) {
        upperChars = char.toUpperCase()
      } else {
        if (S(char).isUpper()) {
          upperChars += char
        }
      }
    })
    return upperChars
  },
  getLastLowerCaseLetter: function (string, backwardOffset) {
    if (typeof backwardOffset !== 'number') {
      backwardOffset = 0
    }
    if (backwardOffset < 0) {
      backwardOffset = 0
    }

    var chars = upperCamelCase(string).split('')
    var lowerChars = ''
    chars.forEach(function (char, i) {
      if (i !== 0) {
        if (S(char).isLower()) {
          lowerChars += char
        }
      }
    })
    var index = (lowerChars.length - 1) - backwardOffset
    if (index < 0) {
      index = 0
    }
    return lowerChars[index]
  },

  uniqueNamesUsed: {},
  uniqueNamesUsedCheckAndSet: function (name, proposed) {
    if (self.uniqueNamesUsed[proposed]) {
      proposed += self.getLastLowerCaseLetter(name)
      return self.uniqueNamesUsedCheckAndSet(name, proposed)
    }
    self.uniqueNamesUsed[proposed] = name
    return proposed
  },
  getUniqueShortHandTableName: function (name) {
    var upperChars = self.getAllUpperCaseLetters(name)
    if (upperChars.length === 1) {
      upperChars += self.getLastLowerCaseLetter(name)
    }
    return self.uniqueNamesUsedCheckAndSet(name, upperChars)
  },

  modelFilePrep: function (options, modelFile) {
    modelFile.shorthand = self.getUniqueShortHandTableName(modelFile.name)
    if (options.tableNamePrefix) {
      modelFile.name = options.tableNamePrefix + modelFile.name
    }
    return modelFile
  },

  optionsPrep: function (options) {
    if (options.tableNamePrefix) {
      if (options.streams) {
        // add the prefix to all table names
        for (var i = 0; i < options.streams.length; ++i) {
          options.streams[i] = options.tableNamePrefix + options.streams[i]
        }
      }
    }
    return options
  },

  processSingleModel: function (options, file, cb) {
    var modelFile
    try {
      modelFile = require(file)
      modelFile = self.modelFilePrep(options, modelFile)
    } catch (e) {
      throw new Error(e)
    }

    if (!modelFile.attributes && !modelFile.name) {
      throw new Error('Could not find the expected inputs in the file ')
    }
    var attributes = modelFile.attributes
    var name = upperCamelCase(modelFile.name)

    // Parameters specific to the table
    ymlObject.Parameters['Table' + name + 'ReadCapacityUnits'] = {
      Description: 'ReadCapacityUnits for the table',
      Type: 'Number',
      Default: options.TableReadCapacityUnits || 15
    }
    ymlObject.Parameters['Table' + name + 'WriteCapacityUnits'] = {
      Description: 'WriteCapacityUnits for the table',
      Type: 'Number',
      Default: options.TableWriteCapacityUnits || 15
    }
    ymlObject.Parameters['Table' + name + 'ReadMinCap'] = {
      Type: 'Number',
      Default: options.TableReadMinCap || 15
    }
    ymlObject.Parameters['Table' + name + 'ReadMaxCap'] = {
      Type: 'Number',
      Default: options.TableReadMaxCap || 15
    }
    ymlObject.Parameters['Table' + name + 'WriteMinCap'] = {
      Type: 'Number',
      Default: options.TableWriteMinCap || 15
    }
    ymlObject.Parameters['Table' + name + 'WriteMaxCap'] = {
      Type: 'Number',
      Default: options.TableWriteMaxCap || 15
    }

    // The actual table definition
    ymlObject.Resources['Table' + name] = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: modelFile.name,
        AttributeDefinitions: [],
        KeySchema: [],
	SSESpecification: {
	  SSEEnabled: true
	},
        ProvisionedThroughput: {
          ReadCapacityUnits: '!Ref Table' + name + 'ReadCapacityUnits',
          WriteCapacityUnits: '!Ref Table' + name + 'WriteCapacityUnits'
        }
      }
    }

    if (options.streams) {
      if (options.streams.indexOf(modelFile.name) !== -1) {
        // Table specific stream spec
        ymlObject.Resources['Table' + name].Properties.StreamSpecification = {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
        // Outputs object
        ymlObject.Outputs['Table' + name + 'StreamARN'] = {
          Value: '!GetAtt Table' + name + '.StreamArn',
          Export: {
            'Name': {
              'Fn::Sub': '${AWS::StackName}-' + modelFile.shorthand
            }
          }
        }
      }
    }

    ymlObject.Resources['Table' + name + 'WriteScalableTarget'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
      Properties: {
        MaxCapacity: '!Ref Table' + name + 'WriteMaxCap',
        MinCapacity: '!Ref Table' + name + 'WriteMinCap',
        ResourceId: [
          '/',
          [
            'table',
            '!Ref Table' + name
          ]
        ],
        RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable',
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        ServiceNamespace: 'dynamodb'
      }
    }

    ymlObject.Resources['Table' + name + 'ReadScalableTarget'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
      Properties: {
        MaxCapacity: '!Ref Table' + name + 'ReadMaxCap',
        MinCapacity: '!Ref Table' + name + 'ReadMinCap',
        ResourceId: [
          '/',
          [
            'table',
            '!Ref Table' + name
          ]
        ],
        RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable',
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        ServiceNamespace: 'dynamodb'
      }
    }

    ymlObject.Resources['Table' + name + 'WriteScalingPolicy'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
      Properties: {
        PolicyName: 'WriteAutoScalingPolicy',
        PolicyType: 'TargetTrackingScaling',
        ScalingTargetId: '!Ref Table' + name + 'WriteScalableTarget',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: '!Ref WriteScalingPolicyTarget',
          ScaleInCooldown: '!Ref WriteScalingPolicyScaleInCooldown',
          ScaleOutCooldown: '!Ref WriteScalingPolicyScaleOutCooldown',
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBWriteCapacityUtilization'
          }
        }
      }
    }

    ymlObject.Resources['Table' + name + 'ReadScalingPolicy'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
      Properties: {
        PolicyName: 'ReadAutoScalingPolicy',
        PolicyType: 'TargetTrackingScaling',
        ScalingTargetId: '!Ref Table' + name + 'ReadScalableTarget',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: '!Ref ReadScalingPolicyTarget',
          ScaleInCooldown: '!Ref ReadScalingPolicyScaleInCooldown',
          ScaleOutCooldown: '!Ref ReadScalingPolicyScaleOutCooldown',
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBReadCapacityUtilization'
          }
        }
      }
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
        ymlObject.Resources['Table' + name].Properties.AttributeDefinitions.push({
          AttributeName: key,
          AttributeType: attributes[key].dynamoDbType
        })
        ymlObject.Resources['Table' + name].Properties.KeySchema.push({
          AttributeName: key,
          KeyType: (value.hashKey) ? 'HASH' : 'RANGE'
        })
      }
    })

    cb()
  },

  newFileData: '',

  replaceCharsInFile: function (filePath) {

    // insert the join syntax
    var replaceOptions = {
      files: filePath,
      from: /ResourceId:/g,
      to: 'ResourceId: !Join'
    }
    try {
      replaceInFile.sync(replaceOptions)
    } catch (e) {
      console.error(e)
      process.exit(0)
    }

    fs.readFile(filePath, 'utf8').then(function (data) {
      var regex1 = RegExp('([\'])(.+)([\'])', 'gm')
      var array1
      self.newFileData = data

      while ((array1 = regex1.exec(data)) !== null) {
        var start = array1[0].substring(0, 6)
        var arr = ['\'!Ref ', '\'!Sub ', '!GetA']
        arr.forEach(function (item) {
          if (start.indexOf(item) !== -1) {
            self.newFileData = self.newFileData.split(array1[0]).join(array1[0].split('\'').join(''))
          }
        })
      }

      fs.outputFileSync(filePath, self.newFileData)
    })
  }
}

module.exports = self
