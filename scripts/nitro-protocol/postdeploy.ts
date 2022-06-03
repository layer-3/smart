// eslint-disable-next-line @typescript-eslint/no-var-requires
const {readFileSync, writeFileSync, rm} = require('fs');

const file_in = __dirname + '/../../addresses.json';
const file_out = __dirname + '/../../deployments/addresses.json';
const addresses = JSON.parse(readFileSync(file_in, 'utf8'));

function deepDelete(object: any, keyToDelete: any) {
  Object.keys(object).forEach((key) => {
    if (key === keyToDelete) delete object[key];
    else if (typeof object[key] === 'object') deepDelete(object[key], keyToDelete);
  });
}
const keyToDelete = 'abi';
deepDelete(addresses, keyToDelete);
writeFileSync(file_out, JSON.stringify(addresses, null, 2));
// eslint-disable-next-line @typescript-eslint/no-empty-function
rm(file_in, () => {});
