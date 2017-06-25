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

var fs = require('fs');
var path = require('path');
var util = require('util');

var mkdirp = require('mkdirp');
var musicmetadata = require('musicmetadata');
var getopt = require('posix-getopt');

var configfile = path.join(process.env.HOME, '.musicnamer.json');
var package = require('../package.json');

require('colors');

/**
 * Usage
 *
 * return the usage message
 */
function usage() {
  return util.format([
    'Usage: %s file1.mp3 file2.mp3 file3.mp3 ...',
    '',
    'given a list of files from the command line, rename them',
    'based on their id3 tags',
    '',
    '-f, --format     custom format line to use (defaults to %s)',
    '-h, --help       print this message and exit',
    '-i, --init       create a config file at %s',
    '-j, --json       output json, assumes --dry-run and --tags',
    '-n, --dry-run    don\'t actually rename files, just print what actions would be taken',
    '-t, --tags       just print the tags from the files processesd, assumes --dry-run',
    '-u, --updates    check for available updates',
    '-v, --version    print the version number and exit'
  ].join('\n'), path.basename(process.argv[1]), defaultconfig.format, configfile);
}

/**
 * Check tags
 *
 * Check a given set of metadata to make sure all tags are present
 */
function check_tags(requiredTags, meta) {
  if (requiredTags.artist && meta.artist.length < 1)
    return false;
  if (requiredTags.album && !meta.album)
    return false;
  if (requiredTags.title && !meta.title)
    return false;
  if (requiredTags.trackno && !meta.track.hasOwnProperty('no'))
    return false;
  return true;
}

/**
 * Given a set of metadata, return the new path
 * for the file
 */
function make_new_path(meta) {
  var s = format || config.format || defaultconfig.format;
  // support the old format
  return s.replace('%artist%', ':artist')
          .replace('%album%', ':album')
          .replace('%trackno%', ':trackno')
          .replace('%title%', ':title')
          .replace('%ext%', ':ext')
          .replace('%year%', ':year')
          .replace(':artist', filter(meta.artist[0] || ''))
          .replace(':album', filter(meta.album))
          .replace(':trackno', pad(meta.track.no))
          .replace(':title', filter(meta.title))
          .replace(':ext', filter(meta.ext))
          .replace(':year', filter(meta.year));
}

/**
 * Filter out bad characters
 */
function filter(s) {
  return s.replace(/\//g, '-');
}

/**
 * pad with leading zero
 */
function pad(s) {
  s = '' + s;
  if (s.length === 1) s = '0' + s;
  return s;
}

// command line arguments
var options = 'f:(format)h(help)i(init)j(json)n(dry-run)t(tags)u(updates)v(version)';
var parser = new getopt.BasicParser(options, process.argv);

var defaultconfig = {
  format: ':artist/:album/:trackno - :title.:ext'
};
var dryrun = false;
var format;
var json = false;
var tagsonly = false;
var option;
while ((option = parser.getopt()) !== undefined) {
  switch (option.option) {
    case 'f':
      format = option.optarg;
      break;
    case 'h': // help
      console.log(usage());
      process.exit(0);
      break;
    case 'i': // init
      console.log('writing config to %s', configfile);
      fs.writeFileSync(configfile, JSON.stringify(defaultconfig, null, 2));
      process.exit(0);
      break;
    case 'j': // json
      dryrun = true;
      tagsonly = true;
      json = true;
      break;
    case 'n': // dry-run
      dryrun = true;
      break;
    case 't': // tags only
      tagsonly = true;
      dryrun = true;
      break;
    case 'u': // check for updates
      require('latest').checkupdate(package, function(ret, msg) {
        console.log(msg);
        process.exit(ret);
      });
      return;
    case 'v': // version
      console.log(package.version);
      process.exit(0);
      break;
    default:
      console.error(usage());
      process.exit(1);
      break;
  }
}
var files = process.argv.slice(parser.optind());

// Try to get the config file if format not supplied
var config = {};
if (!format) {
  try {
    config = require(configfile);
  } catch (e) {
    console.error('warn:'.cyan + ' error reading '.yellow + configfile.green +
        ', running with default config'.yellow);
    console.error('warn:'.cyan + ' invoke with '.yellow + '--init'.green +
        ' to create the config file\n'.yellow);
  }
}
format = format || config.format || defaultconfig.format;
format = format.replace('%artist%', ':artist')
    .replace('%album%', ':album')
    .replace('%trackno%', ':trackno')
    .replace('%title%', ':title')
    .replace('%ext%', ':ext');
var requiredTags = {
  artist: format.match(/:artist/),
  album: format.match(/:album/),
  trackno: format.match(/:trackno/),
  title: format.match(/:title/),
};

// Loop over the file arguments
files.forEach(function(file) {
  var parser = new musicmetadata(fs.createReadStream(file));
  parser.on('metadata', function(meta) {
    meta.filename = file;
    if (json) {
      meta.picture = Object.keys(meta.picture).length;
      console.log(JSON.stringify(meta, null, 2));
      return;
    }

    console.log('processing: %s'.cyan, path.basename(file).green);

    // Only print the tags if --tags is supplied
    if (tagsonly)
      return console.log(util.inspect(meta, false, null, true));

    // Check that all arguments are present
    if (!check_tags(requiredTags, meta)) {
      console.error('error reading tags/not all tags present'.red);
      console.error(meta);
      return;
    }

    // Create the new pathname
    meta.ext = path.extname(file) || '.mp3';
    meta.ext = meta.ext.split('.')[1];
    var new_path = make_new_path(meta);

    console.log('moving: %s'.cyan, file.yellow);
    console.log('->  to: %s'.cyan, new_path.yellow);
    if (dryrun) return console.log('no action taken'.magenta);

    // Make the folders and file
    mkdirp.sync(path.dirname(new_path));
    fs.renameSync(file, new_path);
  });
});
