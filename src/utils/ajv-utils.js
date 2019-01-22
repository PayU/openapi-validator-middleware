
const filesKeyword = require('../customKeywords/files'),
    contentKeyword = require('../customKeywords/contentTypeValidation');

module.exports = {
    addCustomKeyword
};

function addCustomKeyword(ajv, formats) {
    if (formats) {
        formats.forEach(function (format) {
            ajv.addFormat(format.name, format.pattern);
        });
    }

    ajv.addKeyword('files', filesKeyword);
    ajv.addKeyword('content', contentKeyword);
}