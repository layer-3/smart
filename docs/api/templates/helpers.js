const { existsSync, readFileSync } = require('node:fs');

const DOCTOC_IGNORE_STR = '<!-- DOCTOC SKIP -->\n';

const path = (contractName) => `./docs/api/templates/extenders/${contractName}.md`;

module.exports = {
  fileExists(contractName) {
    return existsSync(path(contractName));
  },
  importFile(contractName) {
    const fileStr = readFileSync(path(contractName)).toString();
    return fileStr.replace(DOCTOC_IGNORE_STR, '');
  },
};
