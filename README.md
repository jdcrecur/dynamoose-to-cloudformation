# dynamoose-to-cloudformation

_*beta release*_

## How to use
- The tool is installed locally to your project
- The tool is used via command line (including a package.json script)
- Available cli arguments:
```
Usage: index [options]

  Options:

    -v, --version                                   output the version number
    -i, --input [fullpath]                          The es5 input file to parse. Expects the said file to offer a std module.exports object containing name and attributes
    -d, --dir                                       If present the tool will attempt to scrape all the 1st level files found in the folder, if not present then the tool will assume the input is a file
    -o, --output [fullpath]                         The output path including filename to place the file
    -s --streams [list]                             Comma separated list of tables names to add streams, eg users,songs
    --WriteScalingPolicyTarget [integer]            WriteScalingPolicyTarget integer, defualt is 50
    --ReadScalingPolicyTarget [integer]             ReadScalingPolicyTarget integer, defualt is 50
    --WriteScalingPolicyScaleInCooldown [integer]   WriteScalingPolicyScaleInCooldown integer, defualt is 60
    --WriteScalingPolicyScaleOutCooldown [integer]  WriteScalingPolicyScaleOutCooldown integer, defualt is 60
    --ReadScalingPolicyScaleInCooldown [integer]    ReadScalingPolicyScaleInCooldown integer, defualt is 60
    --ReadScalingPolicyScaleOutCooldown [integer]   ReadScalingPolicyScaleOutCooldown integer, defualt is 60
    --TableReadCapacityUnits [integer]              TableReadCapacityUnits integer, defualt is 15
    --TableWriteCapacityUnits [integer]             TableWriteCapacityUnits integer, defualt is 15
    --TableReadMinCap [integer]                     TableReadMinCap integer, defualt is 15
    --TableReadMaxCap [integer]                     TableReadMaxCap integer, defualt is 15
    --TableWriteMinCap [integer]                    TableWriteMinCap integer, defualt is 15
    --TableWriteMaxCap [integer]                    TableWriteMaxCap integer, defualt is 15
    -h, --help                                      output usage information
    
```

## Example usage
The below example will require the input file, convert to yaml and write to the output option. Should the output directories not exist then they will also be created, should the output file already exist it will be replaced.
```
node node_modules/dynamoose-to-cloudformation -i ./models -d -o dynamodb/descriptions/all.yml
```

See the example folder within this project which also include single model options

## What it will do
Accept an object(s) for dynamoose model(s) in the following format (Note this is es5 not es6, any es6 modules will not work):
User.js
```
Description: >-
  Dynamodb cloudformation schema including scaling from
  https://www.npmjs.com/package/dynamoose-to-cloudformation
Parameters:
  WriteScalingPolicyTarget:
    Type: Number
    Default: 50
  ReadScalingPolicyTarget:
    Type: Number
    Default: 50
  WriteScalingPolicyScaleInCooldown:
    Type: Number
    Default: 60
  WriteScalingPolicyScaleOutCooldown:
    Type: Number
    Default: 60
  ReadScalingPolicyScaleInCooldown:
    Type: Number
    Default: 60
  ReadScalingPolicyScaleOutCooldown:
    Type: Number
    Default: 60
  TableHashingReadCapacityUnits:
    Description: ReadCapacityUnits for the table
    Type: Number
    Default: 15
  TableHashingWriteCapacityUnits:
    Description: WriteCapacityUnits for the table
    Type: Number
    Default: 15
  TableHashingReadMinCap:
    Type: Number
    Default: 15
  TableHashingReadMaxCap:
    Type: Number
    Default: 15
  TableHashingWriteMinCap:
    Type: Number
    Default: 15
  TableHashingWriteMaxCap:
    Type: Number
    Default: 15
  TableUserReadCapacityUnits:
    Description: ReadCapacityUnits for the table
    Type: Number
    Default: 15
  TableUserWriteCapacityUnits:
    Description: WriteCapacityUnits for the table
    Type: Number
    Default: 15
  TableUserReadMinCap:
    Type: Number
    Default: 15
  TableUserReadMaxCap:
    Type: Number
    Default: 15
  TableUserWriteMinCap:
    Type: Number
    Default: 15
  TableUserWriteMaxCap:
    Type: Number
    Default: 15
Resources:
  TableHashing:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: Hashing
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: userId
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref TableHashingReadCapacityUnits
        WriteCapacityUnits: !Ref TableHashingWriteCapacityUnits
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
  TableHashingWriteScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableHashingWriteMaxCap
      MinCapacity: !Ref TableHashingWriteMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableHashing
      RoleARN: >-
        !Sub 
        arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable
      ScalableDimension: 'dynamodb:table:WriteCapacityUnits'
      ServiceNamespace: dynamodb
  TableHashingReadScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableHashingReadMaxCap
      MinCapacity: !Ref TableHashingReadMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableHashing
      RoleARN: >-
        !Sub 
        arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable
      ScalableDimension: 'dynamodb:table:ReadCapacityUnits'
      ServiceNamespace: dynamodb
  TableHashingWriteScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableHashingWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref WriteScalingPolicyTarget
        ScaleInCooldown: !Ref WriteScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref WriteScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
  TableHashingReadScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableHashingReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref ReadScalingPolicyTarget
        ScaleInCooldown: !Ref ReadScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref ReadScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
  TableUser:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: User
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: forename
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: forename
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref TableUserReadCapacityUnits
        WriteCapacityUnits: !Ref TableUserWriteCapacityUnits
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
  TableUserWriteScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableUserWriteMaxCap
      MinCapacity: !Ref TableUserWriteMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableUser
      RoleARN: >-
        !Sub 
        arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable
      ScalableDimension: 'dynamodb:table:WriteCapacityUnits'
      ServiceNamespace: dynamodb
  TableUserReadScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableUserReadMaxCap
      MinCapacity: !Ref TableUserReadMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableUser
      RoleARN: >-
        !Sub 
        arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable
      ScalableDimension: 'dynamodb:table:ReadCapacityUnits'
      ServiceNamespace: dynamodb
  TableUserWriteScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableUserWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref WriteScalingPolicyTarget
        ScaleInCooldown: !Ref WriteScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref WriteScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
  TableUserReadScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableUserReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref ReadScalingPolicyTarget
        ScaleInCooldown: !Ref ReadScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref ReadScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
```

## Current known limitations
- The tool can only create simple secondary RANGE indexes of the name of the attribute.
- Secondary indexes of alternate names to their attribute are currently not possible.
- Global indexes are not currently possible.