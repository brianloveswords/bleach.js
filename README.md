bleach.js is a port of Bleach (https://github.com/jsocol/bleach), the whitelist
based HTML sanitizer.  It runs on node.js using jsdom, in the browser as a
single file that contributes "Bleach" to the global environment, or as an AMD
(Asynchronous Module Definition, https://github.com/amdjs/amdjs-api/wiki/AMD).



## Tests ##

To test, use mocha: http://visionmedia.github.com/mocha/

Run "npm install -g mocha", then you can invoke "mocha" in the root dir
to run the tests.

Currently, all tests are ported from Bleach proper.  There are some cases where
jsdom does not do the right thing according to the tests, and as a result, 3
tests fail:

- "bleach cleaning normalish html should strip out attributes" fails because
  jsdom (as configured), wants to output XHTML tags for "br".

- "bleach cleaning normalish html should convert bare entities to escaped entities"
  fails because " < entity" gets fully corrected into a pair of start and end
  tags.  This is not what the browser does, and so we're blaming jsdom.

- "bleach cleaning normalish html should handle wildcard attributes" fails for
  same XHTML reason on an img tag.

TODO: Figure out how to get jsdom to do what we want here and/or file bugs
and/or create patches to fix jsdom and/or switch to another node library or
what not.
