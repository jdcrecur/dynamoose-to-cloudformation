var wy = require('write-yaml')
var replaceInFile = require('replace-in-file')
var _ = require('lodash')
var upperCamelCase = require('uppercamelcase')
var fs = require('fs-extra')

var ymlObject = {}

var self = {
  process: function (options, files) {
    ymlObject = {}
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
    ymlObject.Resources = {}

    self.iterator(options, files, function () {

      // write the file to disk and performs any outstanding replacements
      fs.ensureFileSync(options.output)

      wy(options.output, ymlObject, function (err) {
        // Handle the error
        if (err) {
          throw new Error(err)
        }
        // insert the join syntax
        var replaceOptions = {
          files: options.output,
          from: /ResourceId:/g,
          to: 'ResourceId: !Join'
        }
        try {
          replaceInFile.sync(replaceOptions)
        } catch (e) {
          console.error(e)
        }
      })
    })
  },

  iterator: function (options, files, cb) {
    if (files.length === 0) {
      return cb()
    }
    self.processSingleModel(options, files.shift(), function () {
      self.iterator(options, files, cb)
    })
  },

  processSingleModel: function (options, file, cb) {
    var modelFile
    try {
      modelFile = require(file)
    } catch (e) {
      throw new Error(e)
    }
    if (!modelFile.attributes && !modelFile.name) {
      throw new Error('Could not find the expected inputs in the file ')
    }
    var attributes = modelFile.attributes
    var name = upperCamelCase(modelFile.name)

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

    ymlObject.Resources['Table' + name] = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: modelFile.name,
        AttributeDefinitions: [],
        KeySchema: [],
        ProvisionedThroughput: {
          ReadCapacityUnits: '!Ref Table' + name + 'ReadCapacityUnits',
          WriteCapacityUnits: '!Ref Table'+name+'WriteCapacityUnits'
        }
      }
    }

    ymlObject.Resources['Table' + name + 'WriteScalableTarget'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
      Properties: {
        MaxCapacity: '!Ref Table'+name+'WriteMaxCap',
        MinCapacity: '!Ref Table'+name+'WriteMinCap',
        ResourceId: [
          '/',
          [
            'table',
            '!Ref Table'+name
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
        MaxCapacity: '!Ref Table'+name+'ReadMaxCap',
        MinCapacity: '!Ref Table'+name+'ReadMinCap',
        ResourceId: [
          '/',
          [
            'table',
            '!Ref Table'+name
          ]
        ],
        RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable',
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        ServiceNamespace: 'dynamodb'
      }
    }

    ymlObject.Resources['Table' + name + 'WriteScalingPolicy'] = {
      Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
      Properties: {
        PolicyName: 'WriteAutoScalingPolicy',
        PolicyType: 'TargetTrackingScaling',
        ScalingTargetId: '!Ref Table'+name+'WriteScalableTarget',
        TargetTrackingScalingPolicyConfiguration:{
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
      Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
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
  }
}

module.exports = self