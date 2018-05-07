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
    -s --streams [list]                             Comma separated list of tables names to add streams, eg users,songs
    -p --tableNamePrefix [string]                   The table name prefix as a string eg "wcp_live_"
    -h, --help                                      output usage information
    
```

## Example usage
The below example will extract all the js model files from the directory `./models` and output a complete yml. It will also add streams to the table User.
```
node node_modules/dynamoose-to-cloudformation -i ./models -d -o dynamodb/descriptions/all.yml -s User
```

For more examples, take a look at the package.json in this project.

#### The above exmaple will output the following:
```
Description: 'Dynamodb cloudformation schema including scaling from https://www.npmjs.com/package/dynamoose-to-cloudformation'
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
  TableLiveHashingReadCapacityUnits:
    Description: ReadCapacityUnits for the table
    Type: Number
    Default: 15
  TableLiveHashingWriteCapacityUnits:
    Description: WriteCapacityUnits for the table
    Type: Number
    Default: 15
  TableLiveHashingReadMinCap:
    Type: Number
    Default: 15
  TableLiveHashingReadMaxCap:
    Type: Number
    Default: 15
  TableLiveHashingWriteMinCap:
    Type: Number
    Default: 15
  TableLiveHashingWriteMaxCap:
    Type: Number
    Default: 15
  TableLiveUserReadCapacityUnits:
    Description: ReadCapacityUnits for the table
    Type: Number
    Default: 15
  TableLiveUserWriteCapacityUnits:
    Description: WriteCapacityUnits for the table
    Type: Number
    Default: 15
  TableLiveUserReadMinCap:
    Type: Number
    Default: 15
  TableLiveUserReadMaxCap:
    Type: Number
    Default: 15
  TableLiveUserWriteMinCap:
    Type: Number
    Default: 15
  TableLiveUserWriteMaxCap:
    Type: Number
    Default: 15
Outputs:
  TableLiveHashingStreamARN:
    Value: '!GetAtt TableLiveHashing.StreamArn'
    Export:
      Name:
        'Fn::Sub': '${AWS::StackName}-Hg'
  TableLiveUserStreamARN:
    Value: '!GetAtt TableLiveUser.StreamArn'
    Export:
      Name:
        'Fn::Sub': '${AWS::StackName}-Ur'
Resources:
  TableLiveHashing:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: LiveHashing
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
        ReadCapacityUnits: !Ref TableLiveHashingReadCapacityUnits
        WriteCapacityUnits: !Ref TableLiveHashingWriteCapacityUnits
  TableLiveHashingWriteScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableLiveHashingWriteMaxCap
      MinCapacity: !Ref TableLiveHashingWriteMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableLiveHashing
      RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: 'dynamodb:table:WriteCapacityUnits'
      ServiceNamespace: dynamodb
  TableLiveHashingReadScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableLiveHashingReadMaxCap
      MinCapacity: !Ref TableLiveHashingReadMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableLiveHashing
      RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: 'dynamodb:table:ReadCapacityUnits'
      ServiceNamespace: dynamodb
  TableLiveHashingWriteScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableLiveHashingWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref WriteScalingPolicyTarget
        ScaleInCooldown: !Ref WriteScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref WriteScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
  TableLiveHashingReadScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableLiveHashingReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref ReadScalingPolicyTarget
        ScaleInCooldown: !Ref ReadScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref ReadScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
  TableLiveUser:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: LiveUser
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
        ReadCapacityUnits: !Ref TableLiveUserReadCapacityUnits
        WriteCapacityUnits: !Ref TableLiveUserWriteCapacityUnits
  TableLiveUserWriteScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableLiveUserWriteMaxCap
      MinCapacity: !Ref TableLiveUserWriteMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableLiveUser
      RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: 'dynamodb:table:WriteCapacityUnits'
      ServiceNamespace: dynamodb
  TableLiveUserReadScalableTarget:
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget'
    Properties:
      MaxCapacity: !Ref TableLiveUserReadMaxCap
      MinCapacity: !Ref TableLiveUserReadMinCap
      ResourceId: !Join
        - /
        - - table
          - !Ref TableLiveUser
      RoleARN: '!Sub  arn:aws:iam::${AWS::AccountId}:role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable'
      ScalableDimension: 'dynamodb:table:ReadCapacityUnits'
      ServiceNamespace: dynamodb
  TableLiveUserWriteScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableLiveUserWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: !Ref WriteScalingPolicyTarget
        ScaleInCooldown: !Ref WriteScalingPolicyScaleInCooldown
        ScaleOutCooldown: !Ref WriteScalingPolicyScaleOutCooldown
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
  TableLiveUserReadScalingPolicy:
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy'
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref TableLiveUserReadScalableTarget
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