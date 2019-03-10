
const Validators = require('../validators/index'),
    Ajv = require('ajv'),
    cloneDeep = require('clone-deep'),
    ajvUtils = require('../utils/ajv-utils'),
    { Node } = require('../data_structures/tree');

module.exports = {
    buildBodyValidation
};

function buildBodyValidation(dereferenced, originalSwagger, currentPath, currentMethod, middlewareOptions = {}) {
    if (!dereferenced.paths[currentPath][currentMethod].requestBody){
        return;
    }
    const bodySchemaV3 = dereferenced.paths[currentPath][currentMethod].requestBody.content['application/json'].schema;
    const defaultAjvOptions = {
        allErrors: true
    };
    const options = Object.assign({}, defaultAjvOptions, middlewareOptions.ajvConfigBody);
    let ajv = new Ajv(options);

    ajvUtils.addCustomKeyword(ajv, middlewareOptions.formats, middlewareOptions.keywords);

    if (bodySchemaV3.discriminator) {
        return buildV3Inheritance(dereferenced, originalSwagger, currentPath, currentMethod, ajv);
    } else {
        return new Validators.SimpleValidator(ajv.compile(bodySchemaV3));
    }
}

function buildV3Inheritance(dereferencedDefinitions, swagger, currentPath, currentMethod, ajv) {
    const RECURSIVE__MAX_DEPTH = 20;
    const bodySchema = swagger.paths[currentPath][currentMethod].requestBody.content['application/json'];
    const schemas = swagger.components.schemas;
    const dereferencedSchemas = dereferencedDefinitions.components.schemas;
    const rootKey = bodySchema.schema['$ref'].split('/components/schemas/')[1];
    const tree = new Node();
    function getKeyFromRef(ref) {
        return ref.split('/components/schemas/')[1];
    }

    function recursiveDiscriminatorBuilder(ancestor, option, refValue, propertiesAcc = { required: [], properties: {} }, depth = RECURSIVE__MAX_DEPTH) {
        // assume first time is discriminator.
        if (depth === 0){
            throw new Error(`swagger schema exceed maximum supported depth of ${RECURSIVE__MAX_DEPTH} for swagger definitions inheritance`);
        }
        const discriminator = dereferencedSchemas[refValue].discriminator,
            currentSchema = schemas[refValue],
            currentDereferencedSchema = dereferencedSchemas[refValue];

        if (!discriminator){
            // need to stop and just add validator on ancesstor;
            const newSchema = cloneDeep(currentDereferencedSchema);
            newSchema.required.push(...(propertiesAcc.required || []));
            newSchema.properties = Object.assign(newSchema.properties, propertiesAcc.properties);
            ancestor.getValue().validators[option] = ajv.compile(newSchema); // think about key
            return;
        }
        propertiesAcc = cloneDeep(propertiesAcc);
        propertiesAcc.required.push(...(currentDereferencedSchema.required || []));
        propertiesAcc.properties = Object.assign(propertiesAcc.properties, currentDereferencedSchema.properties);

        const discriminatorObject = { validators: {} };
        discriminatorObject.discriminator = discriminator.propertyName;

        const currentDiscriminatorNode = new Node(discriminatorObject);
        if (!ancestor.getValue()){
            ancestor.setData(currentDiscriminatorNode);
        } else {
            ancestor.addChild(currentDiscriminatorNode, option);
        }

        if (!currentSchema.oneOf){
            throw new Error('oneOf must be part of discriminator');
        }

        const options = currentSchema.oneOf.map((refObject) => {
            let option = findKey(currentSchema.discriminator.mapping, (value) => (value === refObject['$ref']));
            const ref = getKeyFromRef(refObject['$ref']);
            return { option: option || ref, ref };
        });
        discriminatorObject.allowedValues = options.map((option) => option.option);
        options.forEach(function (optionObject) {
            recursiveDiscriminatorBuilder(currentDiscriminatorNode, optionObject.option, optionObject.ref, propertiesAcc, depth - 1);
        });
    }
    recursiveDiscriminatorBuilder(tree, rootKey, rootKey);
    return new Validators.DiscriminatorValidator(tree);
}

function findKey(object, searchFunc) {
    if (!object){
        return;
    }
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++){
        if (searchFunc(object[keys[i]])){
            return keys[i];
        }
    }
}
