/* eslint-disable no-nested-ternary, max-len */
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

/** @public used in: @see extractImportTarget, @see replaceImports (in flatten.js) */
const regexImportTarget = /"([^"]+)"/;

/** variable to see if we are running in Windows */
const isWindows = process.platform === 'win32';

/**
 * @public
 * convert a given file path into a Windows path if we are running in Windows
 *
 * @param {string} filePath - the file path to possibly convert
 * @return {string} the converted or original file path
 */
const crossPlatformPath = filePath => (
  isWindows ? filePath.replace(/\//g, '\\') : filePath
);

/**
 * @private
 * check if a given path is of a file
 *
 * @param {string} filePath - the file path
 * @return {boolean} true if it's a file, false otherwise
 */
const isFile = filePath => (
  fs.statSync(filePath).isFile()
);

/**
 * @private
 * check if a given path is of a directory
 *
 * @param {string} dirPath - the directory path
 * @return {boolean} true if it's a directory, false otherwise
 */
const isDirectory = dirPath => (
  fs.statSync(dirPath).isDirectory()
);

/**
 * @private
 * convert a file path into a name by replacing all slashes with a dot
 * e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
 * -->  zeppelin-solidity.contracts.ownership.Ownable.sol
 *
 * @param {string} filePath - the file path
 * @return {string} the name constructed from the path
 */
const nameFromPath = filePath => (
  // Windows uses backslash
  filePath.replace(/(\/|\\)/g, '.')
);

/**
 * @private
 * given a file path return the base node module to which it belongs
 * e.g. zeppelin-solidity/contracts/ownership/Ownable.sol --> zeppelin-solidity
 *
 * @param {string} filePath - the file path
 * @return {string} the base node module of the file path
 */
const baseModuleFromPath = filePath => (
  // Windows uses backslash
  filePath.split(/(\/|\\)/).shift()
);

/**
 * @private
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
 * @private
 * synchronously read the and return the contents of a given file in a given folder
 *
 * @param {string} filePath - absole puth of the file
 * @return {string} content of the file as an utf8 string
 */
const getFileContent = filePath => (
  fs.readFileSync(filePath, 'utf8')
);

/**
 * @public
 * synchronously create a (nested) directory if it doesn't exist yet
 *
 * @param {string} dirPath - absolute path of the (nested) directory to create
 */
const createDir = (dirPath) => {
  mkdirp.sync(dirPath);
};

/**
 * @private
 * given a node module name and the dependency dir, extract the version from that
 * module's package.json
 *
 * @param {string} npmDir - abosulte path tot he dependency directory
 * @param {string} nodeModuleName - name of the node module
 * @return {string} the version of the module
 */
const getNpmModuleVersion = (npmDir, nodeModuleName) => (
  JSON.parse(fs.readFileSync(path.join(npmDir, nodeModuleName, 'package.json'), 'utf8')).version
);

/**
 * @private
 * given an EthPM module name and the dependency dir, extract the version from that
 * module's ethpm.json
 *
 * @param {string} ethpmDir - abosulte path tot he dependency directory
 * @param {string} moduleName - name of the node module
 * @return {string} the version of the module
 */
const getEthpmModuleVersion = (ethpmDir, moduleName) => (
  JSON.parse(fs.readFileSync(path.join(ethpmDir, moduleName, 'ethpm.json'), 'utf8')).version
);

/**
 * @public
 * given an import line extract only the import target
 * e.g. import './nested/ContractX.sol' --> ./nested/ContractX.sol
 *
 * @param {string} importLine - the import line string
 * @return {string} the extracted import target
 */
const extractImportTarget = importLine => (
  regexImportTarget.exec(importLine.replace(/'/g, '"'))[1]
);

/**
 * @private
 * given an import line check if the import is using { X as Y } syntax
 *
 * @param {string} importLine - the import line string
 * @return {boolean} true if it contains 'as' syntax, false otherwise
 */
const containsImportAs = importLine => (
  /[_a-zA-Z]{1}[_a-zA-Z0-9]* as [_a-zA-Z]{1}[_a-zA-Z0-9]*/.test(importLine)
);

/**
 * @private
 * given a string, return a list of all the filepaths that are imported (import statements)
 *
 * @param {boolean} depModuleType - true if file is a npm/ethpm module, false otherwise
 * @param {string} fileContent - file content as a string
 * @param {string} subDirPath - path of the current subdir of this file
 * @return {string[]} a list with all imported filepaths
 */
const extractImports = (depModuleType, fileContent, subDirPath, { npmDir, ethpmDir } = {}) => (
  fileContent
    .split('\n')
    .reduce((memo, line) => {
      if (line.startsWith('import')) {
        // add import file path to memo
        const importInfo = {
          // keep track of this since the combine feature can't handle import 'as' syntax
          containsImportAs: containsImportAs(line),
          target: extractImportTarget(line),
        };

        const moduleName = importInfo.target.split('/')[0];

        if (ethpmDir && fs.existsSync(path.join(ethpmDir, moduleName))) {
          importInfo.depModuleType = 'EthPM';
        } else if (npmDir && fs.existsSync(path.join(npmDir, moduleName))) {
          importInfo.depModuleType = 'NPM';
        }

        importInfo.path = !importInfo.target.startsWith('.') || !subDirPath
          // it's a node_module, e.g. zeppelin-solidity/contracts/ownership/Ownable.sol
          // or the current file resides in the root of srcDir
          ? importInfo.target
          // the current file resides in a subdir of srcDir
          : depModuleType
            // it's a node module, we need an extra ..
            ? path.join(subDirPath, '..', importInfo.target)
            // it's not a node module, just join the path
            : path.join(subDirPath, importInfo.target);

        // remove the preceding ../ and ./ from the path
        importInfo.path = removeRelativeDots(importInfo.path);

        if (importInfo.depModuleType === 'EthPM') {
          importInfo.path = importInfo.path.replace('/', '/contracts/');
        }

        return [...memo, importInfo];
      }

      return memo;
    }, [])
);

/**
 * @private
 * create a file item object from a given filename and optional srcDir/subDir
 *
 * @param {string} fileName - name of the file
 * @param {string} srcDir - absolute path to source directory
 * @param {string[]} subDirs - list of subdirectories
 * @return {object} the file item object
 */
const createFileItem = (fileName, srcDir, subDirs, { npmDir, ethpmDir } = {}) => {
  const content = getFileContent(path.join(srcDir, ...subDirs, fileName));

  const fileItem = { content };

  if (subDirs.length) {
    fileItem.path = path.join(...subDirs, fileName);
    fileItem.name = nameFromPath(fileItem.path);
    fileItem.dependencies = extractImports(null, content, path.join(...subDirs), { npmDir, ethpmDir });
  } else {
    fileItem.path = fileName;
    fileItem.name = fileName;
    fileItem.dependencies = extractImports(null, content, undefined, { npmDir, ethpmDir });
  }

  return fileItem;
};

/**
 * @private
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
 * @public
 * recursively retrieve a list of all solidity files found in the srcDir and its
 * subdirectories, excluding the Migrations.sol file and any hidden files (starting with a dot)
 *
 * NOTE: this function is recursive
 *
 * @param {string} srcDir - absolute path of the srcDir
 * @param {string[]} [subDirs=[]] - list of subdirectories, will be undefined at first call
 * @return {object[]} list of contract file objects
 */
const getContractFiles = (srcDir, subDirs = [], { npmDir, ethpmDir } = {}) => {
  const itemnames = fs
    .readdirSync(path.join(srcDir, ...subDirs))
    .filter(itemname => (
      isDirectory(path.join(srcDir, ...subDirs, itemname)) ||
      isSolidityFile(path.join(srcDir, ...subDirs, itemname))
    ));

  const files = itemnames
    .filter(itemname => isFile(path.join(srcDir, ...subDirs, itemname)))
    .map(filename => createFileItem(filename, srcDir, subDirs, { npmDir, ethpmDir }));

  const folders = itemnames
    .filter(itemname => isDirectory(path.join(srcDir, ...subDirs, itemname)))
    .reduce((memo, foldername) => (
      [...memo, ...getContractFiles(srcDir, [...subDirs, foldername])]
    ), []);

  return [...files, ...folders];
};

/**
 * @public
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
 * @private
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
 * @private
 * retrieve all the files whose path is in depPaths, try to find them in the npmDir
 *
 * @param {string} npmDir - absolute path of the npmDir
 * @param {string[]} depPaths - list of file paths of dependencies relative to npmDir
 * @return {object[]} list of dep files
 */
const getNpmDepFiles = (npmDir, depPaths) => (
  depPaths.map((depPath) => {
    const moduleName = baseModuleFromPath(depPath);

    // load the file from the dependencies directory
    let content;
    try {
      content = getFileContent(path.join(npmDir, depPath));
    } catch (err) {
      return {
        type: 'NPM',
        path: depPath, // e.g. zeppelin-solidity/contracts/lifecycle/Pausable.sol
        moduleName, // e.g. zeppelin-solidity
        name: nameFromPath(depPath), // e.g. zeppelin-solidity.contracts.lifecycle.Pausable.sol
      };
    }

    return {
      type: 'NPM',
      path: depPath, // e.g. zeppelin-solidity/contracts/lifecycle/Pausable.sol
      moduleName, // e.g. zeppelin-solidity
      name: nameFromPath(depPath), // e.g. zeppelin-solidity.contracts.lifecycle.Pausable.sol
      moduleVersion: getNpmModuleVersion(npmDir, moduleName), // e.g. 0.4.11
      dependencies: extractImports('NPM', content, depPath), // list of dependencies
      content, // the file content as a string
    };
  })
);

/**
 * @private
 * retrieve all the files whose path is in depPaths, try to find them in the npmDir
 *
 * @param {string} ethpmDir - absolute path of the ethpmDir
 * @param {string[]} depPaths - list of file paths of dependencies relative to npmDir
 * @return {object[]} list of dep files
 */
const getEthpmDepFiles = (ethpmDir, depPaths) => (
  depPaths.map((depPath) => {
    // EthPM will not show the actual path but the path without /contracts/,
    // so when the real path is: bytes/contracts/BytesLib.sol
    // you require it with: bytes/BytesLib.sol
    const realDepPath = depPath.replace('/', '/contracts/');

    const moduleName = baseModuleFromPath(depPath);

    // load the file from the dependencies directory
    let content;
    try {
      content = getFileContent(path.join(ethpmDir, realDepPath));
    } catch (err) {
      return {
        type: 'EthPM',
        path: depPath, // e.g. bytes/BytesLib.sol
        moduleName, // e.g. bytes
        name: nameFromPath(depPath), // e.g. bytes.BytesLib.sol
      };
    }

    return {
      type: 'EthPM',
      path: depPath, // e.g. bytes/BytesLib.sol
      moduleName, // e.g. bytes
      name: nameFromPath(depPath), // e.g. bytes.BytesLib.sol
      moduleVersion: getEthpmModuleVersion(ethpmDir, moduleName), // e.g. 1.0
      dependencies: extractImports('EthPM', content, realDepPath), // list of dependencies
      content, // the file content as a string
    };
  })
);

/**
 * @private
 * recursively retrieve dependencies of dependencies and return them in one big list
 *
 * NOTE: this function is recursive
 *
 * @param {string} npmDir - absolute path of the npm/ethpm dependencies
 * @param {object[]} inputFiles - list of input files
 * @param {string[]} existingDepPaths - list of already retrieved dependencies
 * @return {object[]} list of all nested dependency files
 */
const retrieveNestedNpmDeps = (npmDir, inputFiles, existingDepPaths) => {
  // for each of the input files find all relative import file paths
  const nestedDepPaths = getNestedDepPaths(inputFiles)
  // exluding all paths that are already in the existing file paths (to prevent duplicates)
    .filter(nestedDepPath => !existingDepPaths.includes(nestedDepPath));

  // the input files don't have relative imports that are not already in the existing paths
  if (!nestedDepPaths.length) return [];

  // append the new found nested dep paths to the list of existing dep paths
  const updatedExistingDepPaths = [...existingDepPaths, ...nestedDepPaths];

  // for each of the new nested dep paths retrieve the file info object (includes the content)
  const nestedDepFiles = getNpmDepFiles(npmDir, nestedDepPaths);

  // return the newly found nested dep files concatenated with the deps of these files
  return [
    ...nestedDepFiles,
    ...retrieveNestedNpmDeps(npmDir, nestedDepFiles, updatedExistingDepPaths),
  ];
};

/**
 * @private
 * recursively retrieve dependencies of dependencies and return them in one big list
 *
 * NOTE: this function is recursive
 *
 * @param {string} ethpmDir - absolute path of the npm/ethpm dependencies
 * @param {object[]} inputFiles - list of input files
 * @param {string[]} existingDepPaths - list of already retrieved dependencies
 * @return {object[]} list of all nested dependency files
 */
const retrieveNestedEthpmDeps = (ethpmDir, inputFiles, existingDepPaths) => {
  // for each of the input files find all relative import file paths
  const nestedDepPaths = getNestedDepPaths(inputFiles)
  // exluding all paths that are already in the existing file paths (to prevent duplicates)
    .filter(nestedDepPath => !existingDepPaths.includes(nestedDepPath));

  // the input files don't have relative imports that are not already in the existing paths
  if (!nestedDepPaths.length) return [];

  // append the new found nested dep paths to the list of existing dep paths
  const updatedExistingDepPaths = [...existingDepPaths, ...nestedDepPaths];

  // for each of the new nested dep paths retrieve the file info object (includes the content)
  const nestedDepFiles = getEthpmDepFiles(ethpmDir, nestedDepPaths);

  // return the newly found nested dep files concatenated with the deps of these files
  return [
    ...nestedDepFiles,
    ...retrieveNestedEthpmDeps(ethpmDir, nestedDepFiles, updatedExistingDepPaths),
  ];
};

/**
 * @public
 * retrieve all npm/ethpm dep files of the file paths in depPaths
 *
 * @param {object} opts - options object
 * @param {string[]} depPaths - list of file paths of dependencies
 * @param {string} [opts.npmDir] - absolute path of the npmDir
 * @param {string} [opts.ethpmDir] - absolute path of the ethpmDir
 * @return {object[]} list of all npm/eth (nested) dependency files
 */
const retrieveDepFiles = ({ depPaths, npmDir, ethpmDir }) => {
  let npmDepFiles = [];
  let ethpmDepFiles = [];

  // retrieve NPM dependencies
  if (npmDir) {
    npmDepFiles = getNpmDepFiles(npmDir, depPaths);
  }

  // retrieve EthPM dependencies
  if (ethpmDir) {
    ethpmDepFiles = getEthpmDepFiles(ethpmDir, depPaths);
  }

  // create one big list of all file objects
  let allDepFiles = [...npmDepFiles, ...ethpmDepFiles];

  // check that all dependencies have been found in etiher npm or ethpm
  allDepFiles.forEach((file1) => {
    if (!file1.content) {
      const foundDepInOtherPackageRegistry = allDepFiles.some(file2 => (
        (file2.type === (file1.type === 'NPM' ? 'EthPM' : 'NPM'))
        && (file2.path === file1.path)
      ));
      if (!foundDepInOtherPackageRegistry) {
        console.log(`\ncould not find file ${file1.path}, did you forget to ethpm/npm install?\n\nEXITING\n`);
        process.exit(1);
      }
    }
  });

  // remove files we didn't find
  allDepFiles = allDepFiles.filter(file => !!file.content);
  npmDepFiles = npmDepFiles.filter(file => !!file.content);
  ethpmDepFiles = ethpmDepFiles.filter(file => !!file.content);

  if (npmDepFiles) {
    // recursively retrieve the dependencies of the depFiles
    allDepFiles = [...allDepFiles, ...retrieveNestedNpmDeps(npmDir, npmDepFiles, depPaths)];
  }

  if (ethpmDepFiles) {
    // recursively retrieve the dependencies of the depFiles
    allDepFiles = [...allDepFiles, ...retrieveNestedEthpmDeps(ethpmDir, ethpmDepFiles, depPaths)];
  }

  return allDepFiles;
};

/**
 * @public
 * given a list of file objects, create a set with all the version of each node
 * module that is in the file object list
 *
 * @param {object[]} files - list of file objects
 * @return {string} string with a comment for each node module with its version
 */
const generateDepModuleVersionComments = files => (
  files
    .reduce((memo, file) => (
      file.moduleName && !memo.includes(`${file.moduleName}@${file.moduleVersion} from ${file.type}`)
        ? [...memo, `${file.moduleName}@${file.moduleVersion} from ${file.type}`]
        : memo
    ), [])
    .map(moduleVersion => `// ${moduleVersion}`)
    .join('\n')
);

module.exports = {
  crossPlatformPath,
  createDir,
  extractImportTarget,
  getContractFiles,
  retrieveDepFiles,
  getDepPaths,
  generateDepModuleVersionComments,
  regexImportTarget,
};
