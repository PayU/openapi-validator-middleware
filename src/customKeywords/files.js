var Ajv = require('ajv');
const fileNameField = 'fieldname';

function missingElements(superSet, subset) {
    let missingElements = [];
    subset.every(function (subsetElement) {
        if (!superSet.includes(subsetElement)) {
            missingElements.push(subsetElement);
        }
        return true;
    });

    return missingElements;
};

module.exports = {
    validate: function filesValidation(schema, data) {
        filesValidation.errors = [];
        const dataFileName = data.map((element) => { return element[fileNameField] });
        let missingFiles = missingElements(dataFileName, schema.required);
        if (missingFiles.length > 0) {
            filesValidation.errors.push(new Ajv.ValidationError({
                keyword: 'files',
                message: `Missing required files: ${missingFiles.toString()}`,
                params: { requiredFiles: schema.required, missingFiles: missingFiles }
            }));
            return false;
        }

        // Check that only the optional files exists
        let allFiles = schema.required.concat(schema.optional);
        let extraFiles = missingElements(allFiles, dataFileName);
        if (extraFiles.length > 0) {
            filesValidation.errors.push(new Ajv.ValidationError({
                keyword: 'files',
                message: `Extra files are not allowed. Not allowed files: ${extraFiles}`,
                params: { allowedFiles: allFiles, extraFiles: extraFiles }
            }));
            return false;
        } else {
            return true;
        }
    },
    errors: true
};