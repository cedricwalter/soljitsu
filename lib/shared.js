/* eslint-disable no-nested-ternary */
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

/**
 * check if a given path is of a file
 *
 * @param {string} filePath - the file path
 * @return {boolean} true if it's a file, false otherwise
 */
const isFile = filePath => (
  fs.statSync(filePath).isFile()
);

/**
 * check if a given path is of a directory
 *
 * @param {string} dirPath - the directory path
 * @return {boolean} true if it's a directory, false otherwise
 */
const isDirectory = dirPath => (
  fs.statSync(dirPath).isDirectory()
);

/**
 * convert a file path into a name by replacing all slashes with a dot
 * e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
 * -->  zeppelin-solidity.contracts.ownership.Ownable.sol
 *
 * @param {string} filePath - the file path
 * @return {string} the name constructed from the path
 */
const nameFromPath = filePath => (
  filePath.replace(/\//g, '.')
);

/**
 * given a file path return the base node module to which it belongs
 * e.g. zeppelin-solidity/contracts/ownership/Ownable.sol --> zeppelin-solidity
 *
 * @param {string} filePath - the file path
 * @return {string} the base node module of the file path
 */
const baseModuleFromPath = filePath => (
  filePath.split('/').shift()
);

/**
 * return a filepath without the preceding relative dots ./ ../
 * e.g. ../other/ContractY.sol --> other/ContractY.sol
 *
 * @param {string} filePath - the file path
 * @return {string} the transformed file path
 */
const removeRelativeDots = filePath => (
  filePath.replace(/^(\.{1,2}\/)+/, '')
);

/**
 * synchronously read the and return the contents of a given file in a given folder
 *
 * @param {string} filePath - absole puth of the file
 * @return {string} content of the file as an utf8 string
 */
const getFileContent = filePath => (
  fs.readFileSync(filePath, 'utf8')
);

/**
 * synchronously create a (nested) directory if it doesn't exist yet
 *
 * @param {string} dirPath - absolute path of the (nested) directory to create
 */
const createDir = (dirPath) => {
  mkdirp.sync(dirPath);
};

/**
 * given a node module name and the dependency dir, extract the version from that
 * module's package.json
 *
 * @param {string} depDir - abosulte path tot he dependency directory
 * @param {string} nodeModuleName - name of the node module
 * @return {string} the version of the module
 */
const getNodeModuleVersion = (depDir, nodeModuleName) => (
  JSON.parse(fs.readFileSync(path.join(depDir, nodeModuleName, 'package.json'), 'utf8')).version
);

/**
 * given an import line extract only the import target
 * e.g. import './nested/ContractX.sol' --> ./nested/ContractX.sol
 *
 * @param {string} importLine - the import line string
 * @return {string} the extracted import target
 */
const extractImportTarget = importLine => (
  importLine
    // remove preceding import statement
    .replace('import ', '')
    // remove quotation marks and semicolon
    .replace(/['";]/g, '')
);

/**
 * given a string, return a list of all the filepaths that are imported (import statements)
 *
 * @param {boolean} isNodeModule - true if file is a node module, false otherwise
 * @param {string} fileContent - file content as a string
 * @param {string} subDirPath - path of the current subdir of this file
 * @return {string[]} a list with all imported filepaths
 */
const extractImports = (isNodeModule, fileContent, subDirPath) => (
  fileContent
    .split('\n')
    .reduce((memo, line) => {
      if (line.startsWith('import')) {
        // add import file path to memo
        const importInfo = {
          target: extractImportTarget(line),
        };

        importInfo.path = !importInfo.target.startsWith('.') || !subDirPath
          // it's a node_module, e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
          // or the current file resides in the root of srcDir
          ? importInfo.target
          // the current file resides in a subdir of srcDir
          : isNodeModule
            // it's a node module, we need an extra ..
            ? path.join(subDirPath, '..', importInfo.target)
            // it's not a node module, just join the path
            : path.join(subDirPath, importInfo.target);

        // remove the preceding ../ and ./ from the path
        importInfo.path = removeRelativeDots(importInfo.path);

        return [...memo, importInfo];
      }

      return memo;
    }, [])
);

/**
 * create a file item object from a given filename and optional srcDir/subDir
 *
 * @param {string} fileName - name of the file
 * @param {string} srcDir - absolute path to source directory
 * @param {string[]} subDirs - list of subdirectories
 * @return {object} the file item object
 */
const createFileItem = (fileName, srcDir, subDirs) => {
  const content = getFileContent(path.join(srcDir, ...subDirs, fileName));

  const fileItem = { content };

  if (subDirs.length) {
    fileItem.path = path.join(...subDirs, fileName);
    fileItem.name = nameFromPath(fileItem.path);
    fileItem.dependencies = extractImports(false, content, path.join(...subDirs), subDirs.length);
  } else {
    fileItem.path = fileName;
    fileItem.name = fileName;
    fileItem.dependencies = extractImports(false, content);
  }

  return fileItem;
};

/**
 * check if a given file at a specific path is a solidity file
 *
 * @param {string} filePath - path of the file
 * @return {boolean} true if it's a solidity file, false otherwise
 */
const isSolidityFile = filePath => (
  isFile(filePath) && // it's a file
  !path.basename(filePath).startsWith('.') && // ignore hidden files (starting with a dot)
  path.extname(filePath) === '.sol' // only files with a .sol extension
);

/**
 * recursively retrieve a list of all solidity files found in the srcDir and its
 * subdirectories, excluding the Migrations.sol file and any hidden files (starting with a dot)
 *
 * NOTE: this function is recursive
 *
 * @param {string} srcDir - absolute path of the srcDir
 * @param {string[]} [subDirs=[]] - list of subdirectories, will be undefined at first call
 * @return {object[]} list of contract file objects
 */
const getContractFiles = (srcDir, subDirs = []) => {
  const itemnames = fs
    .readdirSync(path.join(srcDir, ...subDirs))
    .filter(itemname => (
      isDirectory(path.join(srcDir, ...subDirs, itemname)) ||
      isSolidityFile(path.join(srcDir, ...subDirs, itemname))
    ));

  const files = itemnames
    .filter(itemname => isFile(path.join(srcDir, ...subDirs, itemname)))
    .map(filename => createFileItem(filename, srcDir, subDirs));

  const folders = itemnames
    .filter(itemname => isDirectory(path.join(srcDir, ...subDirs, itemname)))
    .reduce((memo, foldername) => (
      [...memo, ...getContractFiles(srcDir, [...subDirs, foldername])]
    ), []);

  return [...files, ...folders];
};

/**
 * return a list of imported dependencies that are located in node_modules, meaning
 * no imports starting with ./ ../ or node builtin modules (e.g. crypto)
 *
 * e.g. import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
 * is pointing to a file inside the zeppelin-solidity node_module and therefore
 * the path is returned: zeppelin-solidity/contracts/ownership/Ownable.sol
 *
 * @param {object[]} contractFiles - list of contract files
 * @return {string[]} list of distinct file paths of imports of a node_module
 */
const getDepPaths = contractFiles => (
  contractFiles.reduce((memo, contractFile) => {
    contractFile.dependencies
      .map(depInfo => depInfo.target)
      // we only want imports of node_modules
      .filter(depTarget => !depTarget.startsWith('./') && !depTarget.startsWith('../'))
      .forEach(depTarget => !memo.includes(depTarget) && memo.push(depTarget));

    return memo;
  }, [])
);

/**
 * return a list of imported dependencies that are relative, meaning
 * only imports starting with ./ or ../
 *
 * NOTE: a depFile is a a source file of a dependency that was imported in one
 *       of the contract files (@see getDepPaths)
 *
 * @param {object[]} depFiles - list of dependency files
 * @return {string[]} list of distinct file paths of relative imports
 */
const getNestedDepPaths = depFiles => (
  depFiles.reduce((memo, depFile) => {
    depFile.dependencies
      .map(depInfo => depInfo.target)
      // we only want relative imports, starting with ./ or ../
      .filter(depTarget => depTarget.startsWith('./') || depTarget.startsWith('../'))
      .forEach((depTarget) => {
        // HACK: somehow i need the extra ..
        const fullPath = path.join(depFile.path, '..', depTarget);

        if (!memo.includes(fullPath)) {
          memo.push(fullPath);
        }
      });

    return memo;
  }, [])
);

/**
 * retrieve all the files whose path is in depPaths, try to find them in the depDir
 *
 * @param {string} depDir - absolute path of the depDir
 * @param {string[]} depPaths - list of file paths of dependencies relative to depDir
 * @return {object[]} list of dep files
 */
const getDepFiles = (depDir, depPaths) => (
  depPaths.map((depPath) => {
    // load the file from the dependencies directory
    let content;
    try {
      content = getFileContent(path.join(depDir, depPath));
    } catch (err) {
      console.log(`\ncould not find file ${depPath}, did you forget to npm install?\n\nEXITING\n`);
      process.exit(1);
    }

    const nodeModuleName = baseModuleFromPath(depPath);

    return {
      path: depPath, // e.g. zeppelin-solidity/contracts/lifecycle/Pausable.sol
      nodeModule: nodeModuleName, // e.g. zeppelin-solidity
      nodeModuleVersion: getNodeModuleVersion(depDir, nodeModuleName), // e.g. 0.4.11
      name: nameFromPath(depPath), // e.g. zeppelin-solidity.contracts.lifecycle.Pausable.sol
      dependencies: extractImports(true, content, depPath), // list of dependencies
      content, // the file content as a string
    };
  })
);

/**
 * recursively retrieve dependencies of dependencies and return them in one big list
 *
 * NOTE: this function is recursive
 *
 * @param {string} depDir - absolute path of the depDir
 * @param {object[]} inputFiles - list of input files
 * @param {string[]} existingDepPaths - list of already retrieved dependencies
 * @return {object[]} list of all nested dependency files
 */
const retrieveNestedDeps = (depDir, inputFiles, existingDepPaths) => {
  // for each of the input files find all relative import file paths
  const nestedDepPaths = getNestedDepPaths(inputFiles)
  // exluding all paths that are already in the existing file paths (to prevent duplicates)
    .filter(nestedDepPath => !existingDepPaths.includes(nestedDepPath));

  // the input files don't have relative imports that are not already in the existing paths
  if (!nestedDepPaths.length) return [];

  // append the new found nested dep paths to the list of existing dep paths
  const updatedExistingDepPaths = [...existingDepPaths, ...nestedDepPaths];

  // for each of the new nested dep paths retrieve the file info object (includes the content)
  const nestedDepFiles = getDepFiles(depDir, nestedDepPaths);

  // return the newly found nested dep files concatenated with the deps of these files
  return [
    ...nestedDepFiles,
    ...retrieveNestedDeps(depDir, nestedDepFiles, updatedExistingDepPaths),
  ];
};

/**
 * given a list of file objects, create a set with all the version of each node
 * module that is in the file object list
 *
 * @param {object[]} files - list of file objects
 * @return {string} string with a comment for each node module with its version
 */
const generateNodeModuleVersionComments = files => (
  files
    .reduce((memo, file) => (
      file.nodeModule && !memo.includes(`${file.nodeModule}: ${file.nodeModuleVersion}`)
        ? [...memo, `${file.nodeModule}: ${file.nodeModuleVersion}`]
        : memo
    ), [])
    .map(moduleVersion => `// ${moduleVersion}`)
    .join('\n')
);

module.exports = {
  createDir,
  extractImportTarget,
  getContractFiles,
  getDepFiles,
  getDepPaths,
  retrieveNestedDeps,
  generateNodeModuleVersionComments,
};
