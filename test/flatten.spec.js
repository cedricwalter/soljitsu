/* eslint-env node, mocha */
const path = require('path');
const fs = require('fs');

const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { expect } = require('chai');

const flatten = require('../lib/flatten');

describe('soljitsu - flatten', () => {
  let tmpDir;
  let srcDir;
  let npmDir;
  let ethpmDir;
  let destDir;

  before(() => {
    tmpDir = path.join(__dirname, '..', `.tmp-${Date.now()}`);

    mkdirp.sync(tmpDir);
  });

  beforeEach(() => {
    srcDir = path.join(tmpDir, 'contracts');
    npmDir = path.join(tmpDir, 'node_modules');
    ethpmDir = path.join(tmpDir, 'installed_contracts');
    destDir = path.join(tmpDir, 'destDir');

    mkdirp.sync(srcDir);
    mkdirp.sync(npmDir);
    mkdirp.sync(ethpmDir);
    mkdirp.sync(destDir);
  });

  afterEach(() => {
    rimraf.sync(srcDir);
    rimraf.sync(npmDir);
    rimraf.sync(ethpmDir);
    rimraf.sync(destDir);
  });

  after(() => {
    rimraf.sync(tmpDir);
  });

  describe('local contracts', () => {
    it('1 contract | in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
    });

    it('1 contract | in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractX.sol'), ContractX);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
    });

    it('2 separate contracts | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('2 separate contracts | 1 in root, 1 in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('2 separate contracts | all in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('2 dependent contracts | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractY.sol\';\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('2 dependent contracts | 1 in root, 1 in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/ContractY.sol\';\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./sub/', './sub.');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('2 dependent contracts | all in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractY.sol\';\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./ContractY.sol', './sub.ContractY.sol');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('1 separate contract, 2 dependent contracts | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);
      fs.writeFileSync(path.join(srcDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });

    it('1 separate contract, 2 dependent contracts | separate + 1 dependent in root, 1 dependent in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./sub/', './sub.');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });

    it('1 separate contract, 2 dependent contracts | separate in root, 2 dependent in same subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);
      fs.writeFileSync(path.join(subDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./ContractZ.sol', './sub.ContractZ.sol');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });

    it('1 separate contract, 2 dependent contracts | separate in root, 2 dependent in sibling subdirs', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'../sib/ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      const sibDir = path.join(srcDir, 'sib');
      mkdirp.sync(sibDir);
      fs.writeFileSync(path.join(sibDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sib.ContractZ.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sib.ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('../sib/', './sib.');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });

    it('1 separate contract, 2 dependent contracts | separate in root, 1 dependent in subdir, 1 dependent in nested subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'./nested/ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);

      const nestedDir = path.join(subDir, 'nested');
      mkdirp.sync(nestedDir);
      fs.writeFileSync(path.join(nestedDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol', 'sub.nested.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.nested.ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./nested/', './sub.nested.');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });

    it('1 separate contract, 2 dependent contracts | all in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractZ.sol\';\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';


      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(subDir, 'ContractY.sol'), ContractY);
      fs.writeFileSync(path.join(subDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('./ContractZ.sol', './sub.ContractZ.sol');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });
  });

  describe('NPM contracts', () => {
    it('1 node_modules dependency: 1 contract | in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
    });

    it('1 node_modules dependency: 1 contract | in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/sub/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      const depModuleSubDir = path.join(depModuleDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyDep.sol'), MyDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.sub.MyDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MyDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/sub/', './some-module.sub.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
    });

    it('1 node_modules dependency: 2 separate contracts | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'import \'some-module/MyOtherDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);
      fs.writeFileSync(path.join(depModuleDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-module.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-module.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace(/some-module\//g, './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });

    it('1 node_modules dependency: 2 dependent contracts | 1 in root, 1 in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/MyOtherDep.sol\';\n' +
        'contract MyDep {}\n';

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);
      const depModuleSubDir = path.join(depModuleDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-module.sub.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM')
        .replace('./sub/', './some-module.sub.');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });

    it('2 node_modules dependency: 1 contract per dependency | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'import \'some-other-module/MyOtherDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      const MyOtherDepPackageJson = {
        name: 'some-other-module',
        version: '0.1.9',
      };

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      const dep2ModuleDir = path.join(npmDir, 'some-other-module');
      mkdirp.sync(dep2ModuleDir);
      fs.writeFileSync(path.join(dep2ModuleDir, 'package.json'), JSON.stringify(MyOtherDepPackageJson, null, 4));
      fs.writeFileSync(path.join(dep2ModuleDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-other-module.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-other-module.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.')
        .replace('some-other-module/', './some-other-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-other-module@0.1.9 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });
    it('deep nested dependent npm modules', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/MySubDep.sol\';\n' +
        'contract MyDep {}\n';

      const MySubDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./subsub/MySubSubDep.sol\';\n' +
        'contract MySubDep {}\n';

      const MySubSubDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./subsubsub/MySubSubSubDep.sol\';\n' +
        'contract MySubSubDep {}\n';

      const MySubSubSubDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MySubSubSubDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(npmDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      const depModuleSubDir = path.join(depModuleDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MySubDep.sol'), MySubDep);

      const depModuleSubSubDir = path.join(depModuleSubDir, 'subsub');
      mkdirp.sync(depModuleSubSubDir);
      fs.writeFileSync(path.join(depModuleSubSubDir, 'MySubSubDep.sol'), MySubSubDep);

      const depModuleSubSubSubDir = path.join(depModuleSubSubDir, 'subsubsub');
      mkdirp.sync(depModuleSubSubSubDir);
      fs.writeFileSync(path.join(depModuleSubSubSubDir, 'MySubSubSubDep.sol'), MySubSubSubDep);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal([
        'ContractX.sol',
        'some-module.MyDep.sol',
        'some-module.sub.MySubDep.sol',
        'some-module.sub.subsub.MySubSubDep.sol',
        'some-module.sub.subsub.subsubsub.MySubSubSubDep.sol',
      ]);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMySubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MySubDep.sol'), 'utf8');
      const destMySubSubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.subsub.MySubSubDep.sol'), 'utf8');
      const destMySubSubSubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.subsub.subsubsub.MySubSubSubDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM')
        .replace('./sub/', './some-module.sub.');
      const expectedMySubDep = MySubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM')
        .replace('./subsub/', './some-module.sub.subsub.');
      const expectedMySubSubDep = MySubSubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM')
        .replace('./subsubsub/', './some-module.sub.subsub.subsubsub.');
      const expectedMySubSubSubDep = MySubSubSubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from NPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMySubDep).to.equal(expectedMySubDep);
      expect(destMySubSubDep).to.equal(expectedMySubSubDep);
      expect(destMySubSubSubDep).to.equal(expectedMySubSubSubDep);
    });
  });

  describe('EthPM contracts', () => {
    it('1 installed_contracts dependency: 1 contract | in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleContractDir, 'MyDep.sol'), MyDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
    });

    it('1 installed_contracts dependency: 1 contract | in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/sub/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      const depModuleSubDir = path.join(depModuleContractDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyDep.sol'), MyDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.sub.MyDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MyDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/sub/', './some-module.sub.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
    });

    it('1 installed_contracts dependency: 2 separate contracts | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'import \'some-module/MyOtherDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
          './contracts/MyOtherDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleContractDir, 'MyDep.sol'), MyDep);
      fs.writeFileSync(path.join(depModuleContractDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-module.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-module.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace(/some-module\//g, './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });

    it('1 installed_contracts dependency: 2 dependent contracts | 1 in root, 1 in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
          './contracts/sub/MyOtherDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/MyOtherDep.sol\';\n' +
        'contract MyDep {}\n';

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleContractDir, 'MyDep.sol'), MyDep);
      const depModuleSubDir = path.join(depModuleContractDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-module.sub.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM')
        .replace('./sub/', './some-module.sub.');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });

    it('2 installed_contracts dependency: 1 contract per dependency | all in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'import \'some-other-module/MyOtherDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyDep {}\n';

      const MyOtherDepPackageJson = {
        license: 'MIT',
        description: 'some other module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyOtherDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-other-module',
        version: '0.1.9',
      };

      const MyOtherDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyOtherDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleContractDir, 'MyDep.sol'), MyDep);

      const dep2ModuleDir = path.join(ethpmDir, 'some-other-module');
      const dep2ModuleContractDir = path.join(dep2ModuleDir, 'contracts');
      mkdirp.sync(dep2ModuleContractDir);
      fs.writeFileSync(path.join(dep2ModuleDir, 'ethpm.json'), JSON.stringify(MyOtherDepPackageJson, null, 4));
      fs.writeFileSync(path.join(dep2ModuleContractDir, 'MyOtherDep.sol'), MyOtherDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'some-module.MyDep.sol', 'some-other-module.MyOtherDep.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMyOtherDep = fs.readFileSync(path.join(destDir, 'some-other-module.MyOtherDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.')
        .replace('some-other-module/', './some-other-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');
      const expectedMyOtherDep = MyOtherDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-other-module@0.1.9 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMyOtherDep).to.equal(expectedMyOtherDep);
    });
    it('deep nested dependent ethpm modules', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-module/MyDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyDepPackageJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyDep.sol',
          './contracts/sub/MySubDep.sol',
          './contracts/subsub/MySubSubDep.sol',
          './contracts/subsubsub/MySubSubSubDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-module',
        version: '0.1.2',
      };

      const MyDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./sub/MySubDep.sol\';\n' +
        'contract MyDep {}\n';

      const MySubDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./subsub/MySubSubDep.sol\';\n' +
        'contract MySubDep {}\n';

      const MySubSubDep =
        'pragma solidity ^0.4.19;\n' +
        'import \'./subsubsub/MySubSubSubDep.sol\';\n' +
        'contract MySubSubDep {}\n';

      const MySubSubSubDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MySubSubSubDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const depModuleDir = path.join(ethpmDir, 'some-module');
      const depModuleContractDir = path.join(depModuleDir, 'contracts');
      mkdirp.sync(depModuleContractDir);
      fs.writeFileSync(path.join(depModuleDir, 'ethpm.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleContractDir, 'MyDep.sol'), MyDep);

      const depModuleSubDir = path.join(depModuleContractDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MySubDep.sol'), MySubDep);

      const depModuleSubSubDir = path.join(depModuleSubDir, 'subsub');
      mkdirp.sync(depModuleSubSubDir);
      fs.writeFileSync(path.join(depModuleSubSubDir, 'MySubSubDep.sol'), MySubSubDep);

      const depModuleSubSubSubDir = path.join(depModuleSubSubDir, 'subsubsub');
      mkdirp.sync(depModuleSubSubSubDir);
      fs.writeFileSync(path.join(depModuleSubSubSubDir, 'MySubSubSubDep.sol'), MySubSubSubDep);

      flatten({ srcDir, ethpmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal([
        'ContractX.sol',
        'some-module.MyDep.sol',
        'some-module.sub.MySubDep.sol',
        'some-module.sub.subsub.MySubSubDep.sol',
        'some-module.sub.subsub.subsubsub.MySubSubSubDep.sol',
      ]);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyDep = fs.readFileSync(path.join(destDir, 'some-module.MyDep.sol'), 'utf8');
      const destMySubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.MySubDep.sol'), 'utf8');
      const destMySubSubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.subsub.MySubSubDep.sol'), 'utf8');
      const destMySubSubSubDep = fs.readFileSync(path.join(destDir, 'some-module.sub.subsub.subsubsub.MySubSubSubDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-module/', './some-module.');
      const expectedMyDep = MyDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM')
        .replace('./sub/', './some-module.sub.');
      const expectedMySubDep = MySubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM')
        .replace('./subsub/', './some-module.sub.subsub.');
      const expectedMySubSubDep = MySubSubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM')
        .replace('./subsubsub/', './some-module.sub.subsub.subsubsub.');
      const expectedMySubSubSubDep = MySubSubSubDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyDep).to.equal(expectedMyDep);
      expect(destMySubDep).to.equal(expectedMySubDep);
      expect(destMySubSubDep).to.equal(expectedMySubSubDep);
      expect(destMySubSubSubDep).to.equal(expectedMySubSubSubDep);
    });
  });

  describe('NPM + EthPM contracts', () => {
    it('1 node_modules + 1 installed_contracts dependency: 1 contract | in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'some-ethpm-module/MyEthpmDep.sol\';\n' +
        'import \'some-npm-module/MyNpmDep.sol\';\n' +
        'contract ContractX {}\n';

      const MyEthpmDepEthpmJson = {
        license: 'MIT',
        description: 'some module.',
        keywords: [
          'solidity',
        ],
        links: {},
        sources: [
          './contracts/MyEthpmDep.sol',
        ],
        dependencies: {},
        manifest_version: 1,
        package_name: 'some-ethpm-module',
        version: '0.1.2',
      };

      const MyEthpmDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyEthpmDep {}\n';

      const MyNpmDepPackageJson = {
        name: 'some-npm-module',
        version: '0.1.7',
      };

      const MyNpmDep =
        'pragma solidity ^0.4.19;\n' +
        'contract MyNpmDep {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      const ethpmDepModuleDir = path.join(ethpmDir, 'some-ethpm-module');
      const ethpmDepModuleContractDir = path.join(ethpmDepModuleDir, 'contracts');
      mkdirp.sync(ethpmDepModuleContractDir);
      fs.writeFileSync(path.join(ethpmDepModuleDir, 'ethpm.json'), JSON.stringify(MyEthpmDepEthpmJson, null, 4));
      fs.writeFileSync(path.join(ethpmDepModuleContractDir, 'MyEthpmDep.sol'), MyEthpmDep);

      const npmDepModuleDir = path.join(npmDir, 'some-npm-module');
      mkdirp.sync(npmDepModuleDir);
      fs.writeFileSync(path.join(npmDepModuleDir, 'package.json'), JSON.stringify(MyNpmDepPackageJson, null, 4));
      fs.writeFileSync(path.join(npmDepModuleDir, 'MyNpmDep.sol'), MyNpmDep);

      flatten({ srcDir, npmDir, ethpmDir, destDir }); // eslint-disable-line object-curly-newline

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal([
        'ContractX.sol',
        'some-ethpm-module.MyEthpmDep.sol',
        'some-npm-module.MyNpmDep.sol',
      ]);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destMyNpmDep = fs.readFileSync(path.join(destDir, 'some-npm-module.MyNpmDep.sol'), 'utf8');
      const destMyEthpmDep = fs.readFileSync(path.join(destDir, 'some-ethpm-module.MyEthpmDep.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace('some-npm-module/', './some-npm-module.')
        .replace('some-ethpm-module/', './some-ethpm-module.');

      const expectedMyNpmDep = MyNpmDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-npm-module@0.1.7 from NPM');
      const expectedMyEthpmDep = MyEthpmDep
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n// some-ethpm-module@0.1.2 from EthPM');

      expect(destContractX).to.equal(expectedContractX);
      expect(destMyNpmDep).to.equal(expectedMyNpmDep);
      expect(destMyEthpmDep).to.equal(expectedMyEthpmDep);
    });
  });

  describe('single/double/mixed quotes', () => {
    it('single quotes import', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import \'./ContractY.sol\';\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('double quotes import', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import "./ContractY.sol";\n' +
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace(/"/g, '\''); // will always output single quotes
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
    });

    it('mixed quotes imports', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'import "./ContractY.sol";\n' + // <-- double quotes
        'import \'./ContractZ.sol\';\n' + // <-- single quotes
        'contract ContractX {}\n';

      const ContractY =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractY {}\n';

      const ContractZ =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractZ {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);
      fs.writeFileSync(path.join(srcDir, 'ContractY.sol'), ContractY);
      fs.writeFileSync(path.join(srcDir, 'ContractZ.sol'), ContractZ);

      flatten({ srcDir, npmDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'ContractZ.sol'), 'utf8');

      const expectedContractX = ContractX
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n')
        .replace(/"/g, '\''); // will always output single quotes
      const expectedContractY = ContractY
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');
      const expectedContractZ = ContractZ
        .replace('pragma solidity ^0.4.19;', 'pragma solidity ^0.4.19;\n\n');

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });
  });
});
