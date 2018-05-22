#!/usr/bin/env node

const path = require('path');
const { argv } = require('yargs');
const untildify = require('untildify');
const flatten = require('./flatten');
const combine = require('./combine');

const COMMANDS = ['flatten', 'combine'];

/**
 * given an input path return an absolute path
 *
 * @param {string} inputPath - the input path
 * @return {string} the input path converted to an absolute path
 */
const getAbsolutePath = (inputPath) => {
  inputPath = untildify(inputPath); // eslint-disable-line no-param-reassign
  // use path.resolve to remove the ending slash if it's a directory, needed
  // for comparing srcDir with destDir
  return path.resolve(path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath));
};

// eslint-disable-next-line valid-jsdoc
/**
 * prints out help
 */
const printHelp = () => console.log(`NAME
  soljitsu       cli tool offering solidity file tools

COMMANDS
  flatten        flatten all (dependencies of) solidity files found in the source directory
  combine        combine all dependencies of each solidity file found in the source directory

SYNOPSIS
  soljitsu flatten --src-dir=dirPath --dest-dir=dirPath [--dep-dir=dirPath]
  soljitsu combine --src-dir=dirPath --dest-dir=dirPath [--dep-dir=dirPath]

REQUIRED ARGUMENTS
  --src-dir      path of source contracts directory
  --dest-dir     path of the directory to write the result solidity files to

OPTIONAL ARGUMENTS
  --dep-dir      path of the directory with the dependencies (node_modules)

EXAMPLES
  soljitsu flatten --src-dir=./contracts --dep-dir=./node_modules --dest-dir=./out
  soljitsu combine --src-dir=./contracts --dep-dir=./node_modules --dest-dir=./out
`);

/**
 * parse the cli arguments and if ok return an object with the arguments
 *
 * @return {object|false} false if invalid/missing arguments, otherwise an object
 *                        with the parsed arguments
 */
const handleCliArgs = () => {
  const args = {
    truffle: argv.truffle && getAbsolutePath(argv.truffle),
    srcDir: argv.srcDir && getAbsolutePath(argv.srcDir),
    depDir: argv.depDir && getAbsolutePath(argv.depDir),
    destDir: argv.destDir && getAbsolutePath(argv.destDir),
    commands: argv._,
  };

  if ((!args.truffle && !args.srcDir) || // need one of --truffle --src-dir
      (args.truffle && args.srcDir) || // cannot have both --truffle and --src-dir
      !args.destDir || // need --dest-dir
      args.commands.length !== 1 || // need at least 1 command
      !COMMANDS.includes(args.commands[0])) { // command can only be 'combine' or 'flatten'
    return false;
  }

  return !args.truffle
    ? { // --src-dir (+ --dep-dir)
      command: args.commands[0],
      srcDir: args.srcDir,
      destDir: args.destDir,
      depDir: args.depDir, // depDir is optional
    }
    : { // --truffle
      command: args.commands[0],
      srcDir: path.join(args.truffle, 'contracts'),
      destDir: args.destDir,
      depDir: path.join(args.truffle, 'node_modules'),
    };
};

const args = handleCliArgs();

if (!args) {
  printHelp();
} else {
  switch (args.command) {
    case 'flatten': flatten(args); break;
    case 'combine': combine(args); break;
    default: break;
  }
  process.exit(0);
}
