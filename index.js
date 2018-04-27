var program = require('commander')
var pkg = require('./package.json')
var path = require('path')
var recursive = require('recursive-readdir')
var processIt = require('./processIt')

function list(val) {
  return val.split(',');
}

program
  .version(pkg.version, '-v, --version')
  .option('-i, --input [fullpath]', 'The es5 input file to parse. Expects the said file to offer a std module.exports object containing name and attributes')
  .option('-d, --dir', 'If present the tool will attempt to scrape all the 1st level files found in the folder, if not present then the tool will assume the input is a file')
  .option('-o, --output [fullpath]', 'The output path including filename to place the file')
  .option('--WriteScalingPolicyTarget [integer]', 'WriteScalingPolicyTarget integer, defualt is 50')
  .option('--ReadScalingPolicyTarget [integer]', 'ReadScalingPolicyTarget integer, defualt is 50')
  .option('--WriteScalingPolicyScaleInCooldown [integer]', 'WriteScalingPolicyScaleInCooldown integer, defualt is 60')
  .option('--WriteScalingPolicyScaleOutCooldown [integer]', 'WriteScalingPolicyScaleOutCooldown integer, defualt is 60')
  .option('--ReadScalingPolicyScaleInCooldown [integer]', 'ReadScalingPolicyScaleInCooldown integer, defualt is 60')
  .option('--ReadScalingPolicyScaleOutCooldown [integer]', 'ReadScalingPolicyScaleOutCooldown integer, defualt is 60')
  .option('--TableReadCapacityUnits [integer]', 'TableReadCapacityUnits integer, defualt is 15')
  .option('--TableWriteCapacityUnits [integer]', 'TableWriteCapacityUnits integer, defualt is 15')
  .option('--TableReadMinCap [integer]', 'TableReadMinCap integer, defualt is 15')
  .option('--TableReadMaxCap [integer]', 'TableReadMaxCap integer, defualt is 15')
  .option('--TableWriteMinCap [integer]', 'TableWriteMinCap integer, defualt is 15')
  .option('--TableWriteMaxCap [integer]', 'TableWriteMaxCap integer, defualt is 15')
  .option('-s --streams [list]', 'Comma separated list of tables names to add streams, eg users,songs', list)
  .parse(process.argv)

if (!program.input || !program.output) {
  throw new Error('Both the input and output arguments are required. Please pass --help for info')
}

program.input = path.join(process.cwd(), program.input)
program.output = path.join(process.cwd(), program.output)

if (program.dir) {
  function ignoreFunc (file, stats) {
    return path.extname(file) !== '.js'
  }

  recursive(program.input, [ignoreFunc], function (err, files) {
    if (err) {
      console.error(err)
      throw new Error('Error reading the directory.')
    } else {
      processIt.process(program, files)
    }
  })
} else {
  // set the expected input to be an array
  processIt.process(program, [program.input])
}

