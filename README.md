# Soljitsu

![License](https://img.shields.io/github/license/BlockChainCompany/soljitsu.svg?style=flat-square)
[![Version](https://img.shields.io/npm/v/soljitsu.svg?style=flat-square&label=version)](https://www.npmjs.org/package/soljitsu)
![Node Version](https://img.shields.io/node/v/soljitsu.svg?label=node%20version)

Soljitsu is a cli tool offering 2 features useful when auditing solidity smart contracts: `flatten` + `combine`.

**Tested on MacOS, Ubuntu**

## Description

There are various tools to perform automated testing of smart contracts each with their own requirements.
When manually reviewing smart contracts the separate locations of project files and dependency files can increase the time needed to go through all the source code used by a smart contract. To address these requirements/difficulties this tool provides 2 features.

#### Feature: flatten

Some tools are unable to use with installed dependencies and require all solidity files to be in the same folder (using only relative imports: `./*.sol` `../*.sol`).
Besides that it is also very cumbersome to view the source code of dependencies, since you can either look online (GitHub) or in the `node_modules`/`installed_contracts` folders.

To solve these problems we could use this tool to **flatten** the project source code files, meaning:
- copy all used files of dependencies (recursively) from the `node_modules`/`installed_contracts` folder
- get rid of all (nested) folders inside the `contracts` folder
- for each dependency file coming from `node_modules`/`installed_contracts` place a comment at the top with the module version
- update the `import` statements in all files to point to the new flattened solidity files
- rename the files by replacing folder separators (`/`) with a dot (`.`)

#### Feature: combine

Some tools require all solidity code in 1 file, meaning no `import` statements. Having all code in 1 file could also be useful when manually reviewing.

To address the above we could use this tool to **combine** all dependencies of project source code files, meaning per file inside `contracts` (and it's subdirectories):
- retrieve all dependencies (recursively) and concatenate them in the right order dependency-wise
- get rid of all (nested) folders inside the `contracts` folder
- place a comment at the top for each used `node_modules`/`installed_contracts` dependency stating the used version
- remove all `import` statements
- use the lowest found solidity version (from the `pragma` line) and use that for the new file
- name the new file by replacing folder separators (`/`) with a dot (`.`)

## Notes

- supports both `NPM` and `EthPM` dependencies
- cannot yet handle npm dependencies which themselves depend on other npm dependencies ([#1](https://github.com/BlockChainCompany/soljitsu/issues/1))

## Requirements

node version `>= 8.0.0`

## Install

`npm install -g soljitsu`

## Usage

```
NAME
  soljitsu       cli tool offering solidity file tools

COMMANDS
  flatten        flatten all (dependencies of) solidity files found in the source directory
  combine        combine all dependencies of each solidity file found in the source directory

SYNOPSIS
  soljitsu flatten --src-dir=dirPath --dest-dir=dirPath [--npm-dir=dirPath --ethnpm-dir=dirPath]
  soljitsu flatten  --truffle=dirPath --dest-dir=dirPath
  soljitsu combine --src-dir=dirPath --dest-dir=dirPath [--npm-dir=dirPath --ethpm-dir=dirPath]
  soljitsu combine  --truffle=dirPath --dest-dir=dirPath

REQUIRED ARGUMENTS
  --truffle      path of truffle project (only when not specifying --src-dir)
  --src-dir      path of source contracts directory (only when not specifying --truffle)
  --dest-dir     path of the directory to write the result solidity files to

OPTIONAL ARGUMENTS
  --npm-dir      path of the directory with the NPM dependencies
                 only used with --src-dir
  --ethpm-dir      path of the directory with the EthPM dependencies
                 only used with --src-dir

EXAMPLES
  soljitsu flatten --src-dir=./contracts --npm-dir=./node_modules --dest-dir=./out
  soljitsu flatten --truffle=./my-truffle-project --dest-dir=./out
  soljitsu combine --src-dir=./contracts --npm-dir=./node_modules --dest-dir=./out
  soljitsu combine --truffle=./my-truffle-project --dest-dir=./out
```

To display help (the above shown excerpt) type: `soljitsu`.

## Example

Given a project with the following folder structure:

```
├── contracts
│   ├── ContractX.sol
│   └── sub
│       └── ContractY.sol
└── node_modules
    └── zeppelin-solidity  <-- version=1.4.0
        └── ...
```

With the file's content being:

`ContractX.sol`

```
pragma solidity ^0.4.19;

import "./sub/ContractY.sol";

contract ContractX {
  // ...
}
```

`sub/ContractY.sol`

```
pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/ownership/Pausable.sol";

contract ContractY is Pausable {
  // ...
}
```

### flatten

Executing `soljitsu flatten --src-dir=./contracts --dest-dir=./out --npm-dir=./node_modules` will create:

```
└── out
    ├── ContractX.sol
    ├── sub.ContractY.sol
    ├── zeppelin-solidity.contracts.lifecycle.Pausable.sol
    └── zeppelin-solidity.contracts.ownership.Ownable.sol
```

with the file's content being:

`ContractX.sol`

```
pragma solidity ^0.4.19;

import "./sub.ContractY.sol";

contract ContractX {
  // ...
}
```

`sub.ContractY.sol`

```
pragma solidity ^0.4.19;

import "./zeppelin-solidity.contracts.ownership.Pausable.sol";

contract ContractY is Pausable {
  // ...
}
```

`zeppelin-solidity.contracts.lifecycle.Pausable.sol`

```
pragma solidity ^0.4.18;

// zeppelin-solidity@1.4.0 from NPM

import "./zeppelin-solidity.contracts.ownership.Ownable.sol";

contract Pausable is Ownable {
  // ...
}
```

`zeppelin-solidity.contracts.ownership.Ownable.sol`

```
pragma solidity ^0.4.18;

// zeppelin-solidity@1.4.0 from NPM

contract Ownable {
  // ...
}
```

### combine

Executing `soljitsu combine --src-dir=./contracts --dest-dir=./out --npm-dir=./node_modules` will create:

```
└── out
    ├── ContractX.sol
    └── sub.ContractY.sol
```

with the file's content being:

`ContractX.sol`

```
pragma solidity ^0.4.18;

// zeppelin-solidity@1.4.0 from NPM

contract Ownable {
  // ...
}

contract Pausable is Ownable {
  // ...
}

contract ContractY is Pausable {
  // ...
}

contract ContractX {
  // ...
}
```

`sub.ContractY.sol`

```
pragma solidity ^0.4.18;

// zeppelin-solidity@1.4.0 from NPM

contract Ownable {
  // ...
}

contract Pausable is Ownable {
  // ...
}

contract ContractY is Pausable {
  // ...
}

```

## Test

`npm test`

## License

MIT
