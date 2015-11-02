'use strict'
var utils = require('./utils.js');
var esprima = require('esprima');
var escodegen = require('escodegen');
var concat = (function() {

    var encoder = {
        in: utils.NoopIconv,
        out: utils.NoopIconv
    };


    function merge(pm1, pm2) {
        if ( pm1.type != 'Program' || pm2.type != 'Program')
            return;
        pm1.body = pm1.body.concat(pm2.body);
        return pm1;

    }

    function parseToAst(files) {
        return files.map(function(v, idx) {

            var srcCode = utils.fs.read(v,encoder);
            return esprima.parse(srcCode, {range:true, attachComment:true});
        });
    }

    function concat(asts) {
        return asts.reduce(function(p, v, idx){
            return merge(p, v);
        });
    }

    return function(files, config) {

            if (config.encoder)
                encoder = config.encoder;

            var contents = escodegen.generate(utils.removeDuplicateComments(concat(parseToAst(files))), {comment: true});
            var outfile = config.output;
            if (outfile) {
                utils.fs.mkdir(utils.fs.dirname(outfile));
                utils.fs.write(outfile,contents,encoder);
            }else {
                console.log(contents);
            }

    };

}());

module.exports = concat;
