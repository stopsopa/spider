
const path  = require('path');

const fs    = require('fs');

// const file = path.resolve(__dirname, '../../migration_debug.log');

// module.exports =

export default (...args) => {
    // throw path.resolve(__dirname, '../../migration_debug.log');
    fs.appendFileSync(path.resolve(__dirname, '../migration_debug.log'), JSON.stringify(args, null, 4) + "\n\n");
}