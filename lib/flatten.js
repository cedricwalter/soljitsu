const fs = require('fs');
const path = require('path');

const {
  extractImportTarget,
  createDir,
  getContractFiles,
  retrieveDepFiles,
  getDepPaths,
  generateNodeModuleVersionComments,
  regexImportTarget,
  crossPlatformPath,
} = require('./shared');

/**
 * given a file object, check if it's a part of a node module and if so add
 * a line at the top of the file specifiying which version of the node module
 * is being used
 *
 * @param {object} file - the file object
 * @return {string} the updated file content
 */
const insertNodeModuleVersion = file => (
  [
    file.content.split('\n')[0],
    '', // add extra newline since that's also how it's output in combine.js
    generateNodeModuleVersionComments([file]),
    file.content.split('\n').slice(1).join('\n'),
  ]
    .join('\n')
);

/**
 * replace all file paths in import statements with a new local file path, so given
 * an import file path 'zeppelin-solidity/contracts/ownership/Ownable.sol' or
 * '../ownership/Ownable.sol', this function will replace it with './Ownable.sol'
 *
 * @param {object[]} allFiles - list of all file objects
 * @param {object} targetFile - target file object
 * @return {string} - the file content string with all import file paths replaced
 */
const replaceImports = (allFiles, targetFile) => (
  targetFile.content
    .split('\n')
    .map((line) => {
      if (line.startsWith('import')) {
        // needed otherwise single quoted imports will not be updated,
        // if we update regexImportTarget to also include single quotes,
        // we get the bug that node_modules are not found, fixing this is a TODO
        line = line.replace(/'/g, '"'); // eslint-disable-line no-param-reassign

        // get the import target, e.g. ./Ownable.sol
        const importTarget = extractImportTarget(line);

        // get the full path to the file, e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
        const importPath = crossPlatformPath(targetFile.dependencies.find(dep => dep.target === importTarget).path); // eslint-disable-line max-len

        // get the file item
        const fileItem = allFiles.find(file => crossPlatformPath(file.path) === importPath);

        // replace the import line target, leaving all else as it were
        return line.replace(regexImportTarget, `'./${fileItem.name}'`);
      }

      return line;
    })
    .join('\n')
);

/**
 * for each solidity file found in srcDir, get all dependencies, and write all
 * these files flattened (in 1 folder with no subfolders) into destDir.
 *
 * @param {string} options - options
 * @param {string} options.srcDir - absolute path to the source directory
 * @param {string} [options.npmDir] - absolute path to NPM dependencies
 * @param {string} [options.ethpmDir] - absolute path to EthPM dependencies
 * @param {string} options.destDir - absolute path to the output directory to write the results to
 */
const flatten = ({ srcDir, npmDir, ethpmDir, destDir }) => { // eslint-disable-line object-curly-newline, max-len
  // get all files in the provided source directory and all its subdirectories
  const contractFiles = getContractFiles(srcDir);

  // get a list of file paths of node_modules dependencies found in the contract files
  const depPaths = getDepPaths(contractFiles);

  let allFiles;

  if (depPaths.length) {
    // npm/ethpm dependencies found in the contract files
    if (!npmDir && !ethpmDir) {
      console.log('\nfound dependencies in contract files, but no dependency folders (--npm-dir --ethpm-dir) specified.\n\nEXITING\n');
      process.exit(1);
    }

    allFiles = [...contractFiles, ...retrieveDepFiles({ depPaths, npmDir, ethpmDir })];
  } else {
    // NO node module dependencies were found in the contract files
    allFiles = [...contractFiles];
  }

  // create output directory if it doesn't exist
  createDir(destDir);

  // write each file to the destDir
  allFiles.forEach((file) => {
    // eslint-disable-next-line no-param-reassign
    file.content = insertNodeModuleVersion(file);

    fs.writeFileSync(
      path.join(destDir, file.name),
      replaceImports(allFiles, file),
    );
  });
};

module.exports = flatten;
