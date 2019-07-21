const os = require('os');

module.exports = {
    forbidOnly: os.platform() !== 'darwin', // fail the pipeline whenever .only is commited to the tests
    recursive: true,
    exit: true
};