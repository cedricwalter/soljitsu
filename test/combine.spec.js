/* eslint-env node, mocha */
const path = require('path');
const fs = require('fs');

const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { expect } = require('chai');

const combine = require('../lib/combine');

describe('soljitsu - combine', () => {
  let tmpDir;
  let srcDir;
  let depDir;
  let destDir;

  before(() => {
    tmpDir = path.join(__dirname, '..', `tmp-${Date.now()}`);

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

  describe('local contracts', () => {
    it('1 contract | in root', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      fs.writeFileSync(path.join(srcDir, 'ContractX.sol'), ContractX);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
    });

    it('1 contract | in subdir', () => {
      const ContractX =
        'pragma solidity ^0.4.19;\n' +
        'contract ContractX {}\n';

      const subDir = path.join(srcDir, 'sub');
      mkdirp.sync(subDir);
      fs.writeFileSync(path.join(subDir, 'ContractX.sol'), ContractX);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sib.ContractZ.sol', 'sub.ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sib.ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'sub.ContractY.sol', 'sub.nested.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.nested.ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['sub.ContractX.sol', 'sub.ContractY.sol', 'sub.ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'sub.ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'sub.ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'sub.ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractX {}';
      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}';
      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });
  });

  describe('node_modules contracts', () => {
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

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
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

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      const depModuleSubDir = path.join(depModuleDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyDep.sol'), MyDep);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
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

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);
      fs.writeFileSync(path.join(depModuleDir, 'MyOtherDep.sol'), MyOtherDep);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MyOtherDep {}\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
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

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);
      const depModuleSubDir = path.join(depModuleDir, 'sub');
      mkdirp.sync(depModuleSubDir);
      fs.writeFileSync(path.join(depModuleSubDir, 'MyOtherDep.sol'), MyOtherDep);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MyOtherDep {}\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
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

      const depModuleDir = path.join(depDir, 'some-module');
      mkdirp.sync(depModuleDir);
      fs.writeFileSync(path.join(depModuleDir, 'package.json'), JSON.stringify(MyDepPackageJson, null, 4));
      fs.writeFileSync(path.join(depModuleDir, 'MyDep.sol'), MyDep);

      const dep2ModuleDir = path.join(depDir, 'some-other-module');
      mkdirp.sync(dep2ModuleDir);
      fs.writeFileSync(path.join(dep2ModuleDir, 'package.json'), JSON.stringify(MyOtherDepPackageJson, null, 4));
      fs.writeFileSync(path.join(dep2ModuleDir, 'MyOtherDep.sol'), MyOtherDep);

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-other-module: 0.1.9\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MyOtherDep {}\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';

      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';

      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol', 'ContractY.sol', 'ContractZ.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');
      const destContractY = fs.readFileSync(path.join(destDir, 'ContractY.sol'), 'utf8');
      const destContractZ = fs.readFileSync(path.join(destDir, 'ContractZ.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}\n\n' +
        'contract ContractY {}\n\n' +
        'contract ContractX {}';

      const expectedContractY =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractY {}';

      const expectedContractZ =
        'pragma solidity ^0.4.19;\n\n\n\n' +
        'contract ContractZ {}';

      expect(destContractX).to.equal(expectedContractX);
      expect(destContractY).to.equal(expectedContractY);
      expect(destContractZ).to.equal(expectedContractZ);
    });
  });

  describe('other', () => {
    it('deep nested dependent node modules', () => {
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

      const depModuleDir = path.join(depDir, 'some-module');
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

      combine({ srcDir, depDir, destDir });

      const destFileNames = fs.readdirSync(destDir);
      expect(destFileNames).to.deep.equal(['ContractX.sol']);

      const destContractX = fs.readFileSync(path.join(destDir, 'ContractX.sol'), 'utf8');

      const expectedContractX =
        'pragma solidity ^0.4.19;\n\n' +
        '// some-module: 0.1.2\n\n' +
        'contract MySubSubSubDep {}\n\n' +
        'contract MySubSubDep {}\n\n' +
        'contract MySubDep {}\n\n' +
        'contract MyDep {}\n\n' +
        'contract ContractX {}';

      expect(destContractX).to.equal(expectedContractX);
    });
  });
});
