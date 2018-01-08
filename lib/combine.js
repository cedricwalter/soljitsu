/* eslint-disable no-nested-ternary */
const fs = require('fs');
const path = require('path');

const {
  createDir,
  getContractFiles,
  getDepFiles,
  getDepPaths,
  retrieveNestedDeps,
  generateNodeModuleVersionComments,
} = require('./shared');

/** used in: @see removePragmaAndImport, @see getLowestPragma */
const pragmaRegex = /^pragma solidity \^{0,1}(\d{1,2}\.\d{1,2}\.\d{1,3})/;

/** used in: @see removePragmaAndImports */
const importLineRegex = /^import/;

/**
 * given a root file object, and a list of all files, return a list of all files
 * the root file depends on (and the dependencies depend on, etc.)
 *
 * NOTE: this function is recursive
 *
 * @param {object} rootFile - root file object
 * @param {object[]} allFiles - list of all file objects
 * @return {object[]} list of all files that root file depends on
 *
 */
const getParentFiles = (rootFile, allFiles) => {
  if (!rootFile.dependencies.length) {
    return [rootFile];
  }

  const depFiles = rootFile.dependencies
    .map(dep => allFiles.find(file => file.path === dep.path))
    .reduce((memo, depFile) => (
      [...memo, ...getParentFiles(depFile, allFiles)]
    ), []);

  return [rootFile, ...depFiles];
};

/**
 * given a list of file objects, remove the duplicates and return the updated list
 *
 * @param {object[]} files - list of file objects
 * @return {object[]} list of file objects with duplicates removed
 */
const removeDuplicateFiles = files => (
  files.filter((file, idx) => files.findIndex(f => f.path === file.path) === idx)
);

/**
 * given a target file's path and a sorted list of all files, return the index of the
 * first file that depends on the target file
 *
 * @param {object[]} sortedFiles - list of sorted file objects
 * @param {string} targetFilePath - path of the target file
 * @return {object} the file object of the first found file that depends on the target file
 */
const getLowestReqPos = (sortedFiles, targetFilePath) => (
  sortedFiles.findIndex(sortedFile => (
    sortedFile.dependencies.some(dep => dep.path === targetFilePath)
  ))
);

/**
 * given a specific file's dependencies (paths) and a sorted list of all files,
 * return the index of the highest/last file in the list of files that is one of
 * the target file's dependencies
 *
 * @param {object[]} sortedFiles - list of sorted file objects
 * @param {object} targetFileDepPaths - target file's dependency paths
 * @return {object} the file object of the last found file that is one of the
 *                  target file's dependencies
 */
const getHighestDepPos = (sortedFiles, targetFileDepPaths) => (
  sortedFiles.reduce((highest, sortedFile, idx) => (
    targetFileDepPaths.some(depPath => sortedFile.path === depPath)
      ? idx
      : highest
  ), -1)
);

/**
 * given a list of file objects, sort them based on dependening on each other
 *
 * @param {object[]} files - list of file objects
 * @return {object[]} the sorted list of files
 */
const sortByDep = files => (
  files.reduce((sorted, file) => {
    // get a list of paths of all dependencies of this file
    const depPaths = file.dependencies.map(dep => dep.path);

    // find the last index of a file which depends on this file
    const lowestReqPos = getLowestReqPos(sorted, file.path);

    if (!depPaths.length) {
      // this file has no dependencies
      return lowestReqPos === -1
        // there is no file which depends on this file, put it at the front
        ? [file, ...sorted]
        // found a file which depends on this file, put this file before the found file
        : [...sorted.slice(0, lowestReqPos), file, ...sorted.slice(lowestReqPos)];
    }

    // this file has dependencies

    // find the last index of one of the dependencies of this file
    const highestDepPos = getHighestDepPos(sorted, depPaths);

    return highestDepPos === -1
      // found none of the dependencies of this file
      ? lowestReqPos === -1
        // found no files depending on this file, put it at the end
        ? [...sorted, file]
        // found a file which depends on this file, put this file before the found file
        : [...sorted.slice(0, lowestReqPos), file, ...sorted.slice(lowestReqPos)]
      // found a dependency of this file
      : lowestReqPos === -1
        // found no files depending on this file, put it after the found dependency
        ? [...sorted.slice(0, highestDepPos + 1), file, ...sorted.slice(highestDepPos + 1)]
        // found a file depending on this file, put it before the found file
        : [...sorted.slice(0, lowestReqPos), file, ...sorted.slice(lowestReqPos)];
  }, [])
);

/**
 * given a list of file objects, return the lowest found solidity pragma version
 *
 * @param {object[]} files - list of file objects
 * @return {string} the lowest found solidity pragma version
 */
const getLowestPragma = (files) => {
  const lowestPragma = files.reduce((lowest, file) => {
    const pragma = pragmaRegex.exec(file.content.split('\n')[0]);

    return !pragma
      ? lowest
      // on first iteration lowest will be null
      : lowest === null
        // since lowest is null, just set lowest to found pragma
        ? pragma[1]
        // check if the found pragma is lower than the current lowest pragma
        : pragma[1] < lowest
          // found pragma is lower, return that as new lowest
          ? pragma[1]
          // found pragma is not lower, so keep the current lowest as lowest
          : lowest;
  }, null);

  return `^${lowestPragma}`;
};

/**
 * given a file's content as a string, remove the pragma line and all the import lines
 *
 * @param {string} fileContent - the file's content as a string
 * @return {string} the file's content with the pragma + import lines removed
 */
const removePragmaAndImports = fileContent => (
  fileContent
    .split('\n')
    .filter(line => (
      !pragmaRegex.test(line) && // remove pragma lines
      !importLineRegex.test(line) // remove import lines
    ))
    .join('\n')
    .trim() // since we are removing first lines of files, trim of the white space
);

/**
 * given a list of files, concatenate all of them into one big string and return that
 *
 * @param {object[]} files - list of file objects
 * @return {string} all the input files concatenated
 */
const combineFiles = files => (
  [
    // calc that lowest common denominator pragma, and use that
    `pragma solidity ${getLowestPragma(files)};`,

    // add comment with version of each imported/used node module
    generateNodeModuleVersionComments(files),

    // for each of the files (already sorted dependency wise),
    // remove the pragma and import lines from the content and concat the content
    ...files.map(file => removePragmaAndImports(file.content)),

  // one extra whitespace line between each of the parts
  ].join('\n\n')
);

/**
 * given a root file object and a list of all file objects, return a string in which
 * all files have been sorted dependency-wise and concatenated, i.e. replace all with 1 file
 *
 * @param {object} rootFile - root file object
 * @param {object[]} allFiles - list of all file objects
 * @return {string} all the input files concatenated
 */
const toOneFile = (rootFile, allFiles) => (
  combineFiles(sortByDep(removeDuplicateFiles(getParentFiles(rootFile, allFiles))))
);

/**
 * given a filename prepend the ending .sol with .combined
 *
 * @param {string} filename - the file name
 * @return {string} the filename altered to end with .combined.sol
 */
const alterNameForCombine = filename => (
  filename.replace(/\.sol$/, '.combined.sol')
);

/**
 * given a list of file objects, check if any are using the import 'as' syntax
 * this can be found in the containsImportAs field of the objects in contractFile.dependencies
 *
 * @param {object[]} contractFiles - list of file objects
 * @return {boolean} true if a file is using import 'as syntax', false otherwise
 */
const existsFileUsingImportAs = contractFiles => (
  contractFiles.some(contractFile => (
    contractFile.dependencies.some(dep => dep.containsImportAs)
  ))
);

/**
 * for each solidity file found in srcDir, create solidity file in which all
 * dependencies of that file + the orignal file's content are written, in the correct order
 *
 * @param {string} options - options
 * @param {string} options.srcDir - absolute path to the source directory
 * @param {string} options.depDir - absolute path to the dependency directory (node_modules)
 * @param {string} options.destDir - absolute path to the output directory to write the results to
 */
const combine = ({ srcDir, depDir, destDir }) => {
  // get all files in the provided source directory and all its subdirectories
  const contractFiles = getContractFiles(srcDir);

  if (existsFileUsingImportAs(contractFiles)) {
    console.log('\nfiles containing imports using \'as\' cannot be combined, e.g. import { X as Y } from "./Contract.sol"\n');
    process.exit(1);
  }

  // get a list of file paths of node_modules dependencies found in the contract files
  const depPaths = getDepPaths(contractFiles);

  let allFiles;

  if (depPaths.length) {
    // node module dependencies found in the contract files
    if (!depDir) {
      console.log('\nfound dependencies in contract files, but no dependency folder (--dep-dir) specified.\n\nEXITING\n');
      process.exit(1);
    }

    // retrieve the files for the above found paths
    const depFiles = getDepFiles(depDir, depPaths);

    // recursively retrieve the dependencies of the depFiles
    const nestedDepFiles = retrieveNestedDeps(depDir, depFiles, depPaths);

    // create one big list of all file objects
    allFiles = [...contractFiles, ...depFiles, ...nestedDepFiles];
  } else {
    // NO node module dependencies were found in the contract files
    allFiles = [...contractFiles];
  }

  // create output directory if it doesn't exist
  createDir(destDir);

  // write a File.combined.sol file for each of the contract files to the destDir
  contractFiles.forEach((file) => {
    fs.writeFileSync(
      path.join(destDir, alterNameForCombine(file.name)),
      toOneFile(file, allFiles),
    );
  });
};

module.exports = combine;
