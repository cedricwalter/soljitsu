const fs = require('fs');
const path = require('path');

const {
  extractImportTarget,
  createDir,
  getContractFiles,
  getDepFiles,
  getDepPaths,
  retrieveNestedDeps,
  generateNodeModuleVersionComments,
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
        // this is an import line

        // get the import target, e.g. ./Ownable.sol
        const importTarget = extractImportTarget(line);

        // get the full path to the file, e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
        const importPath = targetFile.dependencies.find(dep => dep.target === importTarget).path;

        // get the file item
        const fileItem = allFiles.find(file => file.path === importPath);

        // replace the import line
        return `import './${fileItem.name}';`;
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
 * @param {string} options.depDir - absolute path to the dependency directory (node_modules)
 * @param {string} options.destDir - absolute path to the output directory to write the results to
 */
const flatten = ({ srcDir, depDir, destDir }) => {
  // get all files in the provided source directory and all its subdirectories
  const contractFiles = getContractFiles(srcDir);

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
