'use strict';
var express = require('express');
var router = express.Router();
var inputValidation = require('../src/middleware');

router.get('/pets/:petId', inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});
router.put('/pets', inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});

module.exports = router;