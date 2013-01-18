musicnamer
==========

Organize your music collection

Rename music files to clean filenames based
on their music tags.  By default, `musicnamer` can take your music files
and rename them to a format like:

    :artist/:album/:trackno - :title.:ext

This package is not meant to be used as a Node module, but rather
as a command line tool

Usage
-----

Invocation of `musicnamer` is simple: just run the program with files as arguments
and it will do its thing on them.

    ~$ musicnamer -h
    Usage: musicnamer.js file1.mp3 file2.mp3 file3.mp3 ...

    given a list of files from the command line, rename them
    based on their id3 tags

    -h, --help       print this message and exit
    -i, --init       create a config file at /Users/dave/.musicnamer.json
    -f, --format     custom format line to use (defaults to :artist/:album/:trackno - :title.:ext)
    -n, --dry-run    don't actually rename files, just print what actions would be taken
    -t, --tags       just print the tags from the files processesd, assumes --dry-run
    -u, --updates    check for available updates
    -v, --version    print the version number and exit

Examples
--------

To invoke `musicnamer`, simply pass a file over the command line as an argument

    dave @ [ bahamas10 :: (SunOS) ] ~ $ musicnamer somesong.mp3
    warn: error reading /home/dave/.musicnamer.json, running with default config
    warn: invoke with --init to create the config file

    processing: somesong.mp3
    moving: /home/dave/somesong.mp3
    ->  To: BEING/Arrival/12 - The Singularity (Cosmists II).mp3

Music namer renamed the file for us.  What effectively happened here is this

    $ mv somesong.mp3 "BEING/Arrival/12 - The Singularity (Cosmists II).mp3"

**NOTE**: `musicnamer` by default renames files relative to your current directory.

We can see the error message above complaining because the config file was not found/
unreadable.  We can fix this warning with this:

    dave @ [ bahamas10 :: (SunOS) ] ~ $ musicnamer --init
    writing config to /home/dave/.musicnamer.json

More details on the configuration file can be found in the `Configuration` section below.

Now let's say we wanted to rename a bunch of files, but were worried about modifying
them without testing.  You can run `musicnamer` with a dry run option to show what action
*would* have been taken.

    dave @ [ bahamas10 :: (SunOS) ] ~ $ musicnamer --dry-run somesong.mp3
    moving: somesong.mp3
    ->  to: BEING/Arrival/12 - The Singularity (Cosmists II).mp3
    no action taken

As you can see, the warning message no longer shows because we have created a config file.
Also, `musicnamer` just printed out what it would have done, but didn't actually call rename(2)
on any of the files or make any new directories.

You can also test out files to get a glimpse into how `musicnamer` sees your files.  There is a
command line switch to have `musicnamer` print out the tags of files without renaming them.

    dave @ [ bahamas10 :: (SunOS) ] ~ $ musicnamer --tags music/*.mp3
    processing: song.mp3
    { title: 'Stimulus',
      artist: [ 'The Omega Experiment' ],
      albumartist: [],
      album: 'The Omega Experiment',
      year: '2012',
      track: { no: 2, of: 0 },
      genre: [],
      disk: { no: 0, of: 0 },
      picture:
       [ { format: '浩条⽥灪来cover\u0000',
           data: <Buffer 00 ff db 00 43 00 02 01 01 01 01 01 02 01 01 01 02 02 02 02 02 04 03 02 02 02 02 05 04 04 03 04 06 05 06 06 06 05 06 06 06 07 09 08 06 07 09 07 06 06 08 ...> } ] }
    processing: song2.mp3
    { title: 'Motion',
      artist: [ 'The Omega Experiment' ],
      albumartist: [],
      album: 'The Omega Experiment',
      year: '2012',
      track: { no: 3, of: 0 },
      genre: [],
      disk: { no: 0, of: 0 },
      picture:
       [ { format: '浩条⽥灪来cover\u0000',
           data: <Buffer 00 ff db 00 43 00 02 01 01 01 01 01 02 01 01 01 02 02 02 02 02 04 03 02 02 02 02 05 04 04 03 04 06 05 06 06 06 05 06 06 06 07 09 08 06 07 09 07 06 06 08 ...> } ] }

This output is good to look for debugging information, without making
any modifications to the filesystem.

Configuration
-------------

`musicnamer --init` will create a config file in `~/.musicnamer.json`. This config file
has a key called `format`, which has the format to use when renaming files.

    ~$ cat ~/.musicnamer.json
    {
      "format": ":artist/:album/:trackno - :title.:ext"
    }

The `--init` option will write out the default format value to the config file, this is the
format that will be used if the config file is not present.

Possible options for variables are:

* `:artist`: artist name
* `:album`: album name
* `:trackno`: track number
* `:title`: track title
* `:ext`: file extension

Format can also be passed in from the command line like: `--format 'format string'`


Installation
------------

    npm install -g musicnamer


Credits
-------

* Tags gathered with https://github.com/leetreveil/node-musicmetadata
* Modeled after on [tvnamer](https://github.com/dbr/tvnamer)

License
-------

MIT License
