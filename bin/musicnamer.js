#!/usr/bin/env node
/**
 * Music Namer
 *
 * Easily rename music files by their tags
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 * License: MIT
 *
 * Tags gathered with https://github.com/leetreveil/node-musicmetadata
 * Based on TVnamer https://github.com/dbr/tvnamer
 */

// Requires and such
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    musicmetadata = require('musicmetadata'),
    mkdirp = require('mkdirp'),
    version = require('../package.json').version,
    args = process.argv.slice(2),
    config_file = path.join(process.env["HOME"], '.musicnamer.json'),
    tags_only = false,
    dry_run = false,
    default_config = {
      'format': '%artist%/%album%/%trackno% - %title%.%ext%'
    };

/**
 * Usage
 *
 * return the usage message
 */
function usage() {
  return util.format([
    'Usage: %s file1.mp3 file2.mp3 file3.mp3 ...',
    '',
    'Given a list of files from the command line, rename them to',
    'a clean filename (default \'%s\')',
    '',
    '',
    'Options (must be given as the first argument; all options are mutually exclusive)',
    '  --init    | -i: Create a config file at %s',
    '  --dry-run | -n: Don\'t actually rename files, just print what actions would be taken',
    '  --tags    | -t: Just print the tags from the files processesd, assumes --dry-run',
    '  --help    | -h: Print this message and exit',
    '  --version | -v: Print the version number and exit',
    ''
  ].join('\n'), path.basename(process.argv[1]), default_config.format, config_file);
}

/**
 * Check tags
 *
 * Check a given set of metadata to make sure all tags are present
 */
function check_tags(meta) {
  return meta.album && meta.title && meta.artist.length !== 0;
}

/**
 * Given a set of metadata, return the new path
 * for the file
 */
function make_new_path(meta) {
  var s = config.format || default_config.format;
  return s.replace('%artist%', meta.artist[0])
          .replace('%album%', meta.album)
          .replace('%trackno%', meta.track.no)
          .replace('%title%', meta.title)
          .replace('%ext%', meta.ext);
}

// Check arguments
if (args.length === 0) {
  console.error(usage());
  process.exit(1);
}
switch (args[0]) {
  case '-h': case '--help':
    console.log(usage());
    process.exit(0);
  case '-v': case '--version':
    console.log(version);
    process.exit(0);
  case '-i': case '--init':
    console.log('Writing config to %s', config_file);
    fs.writeFileSync(config_file, JSON.stringify(default_config, null, 2));
    process.exit(0);
  case '-n': case '--dry-run':
    dry_run = true;
    args = args.slice(1);
    break;
  case '-t': case '--tags':
    tags_only = true;
    args = args.slice(1);
    break;
}

// Try to get the config file
var config = {};
try {
  config = JSON.parse(fs.readFileSync(config_file));
} catch (e) {
  console.error('Error reading %s, Invoke with --init to create this file\n',
      config_file);
}

// Loop over the file arguments
args.forEach(function(file) {
  var parser = new musicmetadata(fs.createReadStream(file));
  parser.on('metadata', function(meta) {
    console.log('\n----- processing %s -----\n', file);

    // Only print the tags if --tags is supplied
    if (tags_only) return console.log(meta);

    // Check that all arguments are present
    if (!check_tags(meta)) {
      console.error('Error reading tags/not all tags present');
      console.error(meta);
      return;
    }

    // Create the new pathname
    meta.ext = path.extname(file) || '.mp3';
    meta.ext = meta.ext.split('.')[1];
    var new_path = make_new_path(meta);

    console.log('Moving: %s', file);
    console.log('->  To: %s', new_path);
    if (dry_run) return console.log('No action taken');

    // Make the folders and file
    mkdirp.sync(path.dirname(new_path));
    fs.renameSync(file, new_path);

  });
});
