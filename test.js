/* eslint-env node, mocha */
const path = require('path');
const fs = require('fs');

const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { expect } = require('chai');

const flatten = require('./lib/flatten');
const combine = require('./lib/combine');

describe('soljitsu', () => {
  let tmpDir;
  let srcDir;
  let depDir;
  let destDir;

  before(() => {
    tmpDir = path.join(__dirname, `tmp-${Date.now()}`);

    mkdirp.sync(tmpDir);
  });

  beforeEach(() => {
    srcDir = path.join(tmpDir, `srcDir-${Date.now()}`);
    depDir = path.join(tmpDir, 'node_modules');
    destDir = path.join(tmpDir, `destDir-${Date.now()}`);

    mkdirp.sync(srcDir);
    mkdirp.sync(depDir);
    mkdirp.sync(destDir);
  });

  afterEach(() => {
    rimraf.sync(srcDir);
    rimraf.sync(depDir);
    rimraf.sync(destDir);
  });

  after(() => {
    rimraf.sync(tmpDir);
  });

  describe('flatten', () => {
    it('should generate expected flattened files', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/ContractY.sol\';\n' +
        'contract ContractX {\n' +
        '}';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractY {\n' +
        '}';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {\n' +
        '}';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      flatten({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./sub/', './sub.');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module: 0.1.2');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destMyDep).to.equal(expectedMyDep);
    });
  });
});
