"use strict";

var fs = require("fs");
var path = require("path");
var efs = require("./util/files");
var ImportUtilities = require("./import_utils");

function makeImporter(eyeglass, sass, options, fallbackImporter) {
  var importUtils = new ImportUtilities(eyeglass, sass, options, fallbackImporter);
  var fsURI = /^fs\(([-_a-zA-Z][-_a-zA-Z0-9]+)\)$/;

  return function(uri, prev, done) {
    var match = uri.match(fsURI);
    if (match) {
      var identifier = match[1];
      var absolute_path = null;
      if (identifier === "root") {
        absolute_path = eyeglass.root();
      } else if (!importUtils.existsSync(prev)) {
        absolute_path = path.resolve(".");
      } else {
        absolute_path = path.resolve(path.dirname(prev));
      }
      if (absolute_path) {
        var sassContents =
          '@import "eyeglass/fs"; @include fs-register-path(' + identifier + ', "' + absolute_path + '");';
        var data = {
          contents: sassContents,
          file: "fs:" + identifier + ":" + absolute_path
        };
        importUtils.importOnce(data, done);
      } else {
        done(new Error("Cannot resolve filesystem location of " + prev));
      }
    } else {
      importUtils.fallback(uri, prev, done, function() {
        done(sass.NULL);
      });
    }
  };
}

module.exports = makeImporter;
