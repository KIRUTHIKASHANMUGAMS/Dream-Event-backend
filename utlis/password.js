const generator = require('generate-password');

exports.password = generator.generate({
    length: 8,
    numbers: true,
    symbols: true,
    uppercase: false,
    excludeSimilarCharacters: true,
    strict: true,

});