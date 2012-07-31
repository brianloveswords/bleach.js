var jsdom = require('jsdom').jsdom;

var ALLOWED_TAGS = [
    'a',
    'abbr',
    'acronym',
    'b',
    'blockquote',
    'code',
    'em',
    'i',
    'li',
    'ol',
    'strong',
    'ul'
];
var ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'abbr': ['title'],
    'acronym': ['title']
};
var ALLOWED_STYLES = [];

var Node = {
  ELEMENT_NODE                :  1,
  ATTRIBUTE_NODE              :  2,
  TEXT_NODE                   :  3,
  CDATA_SECTION_NODE          :  4,
  ENTITY_REFERENCE_NODE       :  5,
  ENTITY_NODE                 :  6,
  PROCESSING_INSTRUCTION_NODE :  7,
  COMMENT_NODE                :  8,
  DOCUMENT_NODE               :  9,
  DOCUMENT_TYPE_NODE          : 10,
  DOCUMENT_FRAGMENT_NODE      : 11,
  NOTATION_NODE               : 12
};

var DEFAULTS = {
  tags: ALLOWED_TAGS,
  attributes: ALLOWED_ATTRIBUTES,
  styles: ALLOWED_STYLES,
  strip: false,
  stripComments: true
};

// strategies:
//   * loop over .attributes, remove anything not in the whitelist
//   * style|script: document.createTextElement(el.outerHTML);

function match (obj, key) {
}

var bleach = {};
bleach.clean = function (html, opts) {
  opts = opts || DEFAULTS;
  var document = jsdom()
    , clean = document.createElement('clean')
    , dirty = document.createElement('dirty');

  var doStrip = opts.hasOwnProperty('strip') ? opts.strip : DEFAULTS.strip,
      doStripComments = opts.hasOwnProperty('stripComments') ?
                          opts.stripComments : DEFAULTS.stripComments,
      allowedTags = opts.hasOwnProperty('tags') ? opts.tags : DEFAULTS.tags,
      attrsByTag = opts.hasOwnProperty('attributes') ? opts.attributes
                                                     : DEFAULTS.attributes,
      allowedStyles = opts.hasOwnProperty('styles') ? opts.styles
                                                    : DEFAULTS.styles,
      wildAttrs;
  if (Array.isArray(attrsByTag)) {
    wildAttrs = attrsByTag;
    attrsByTag = {};
  }
  else if (attrsByTag.hasOwnProperty('*')) {
    wildAttrs = attrsByTag['*'];
  }
  else {
    wildAttrs = [];
  }

  function slashAndBurn(root, callback) {
    var child, i = 0;
    // console.log('slashing');
    // console.log('type ', root.nodeType);
    // console.log('value', root.nodeValue||['<',root.tagName,'>'].join(''));
    // console.log('innerHTML', root.innerHTML);
    // console.log('--------');

    while ((child = root.childNodes[i++])) {
      if (child.nodeType === 8 && doStripComments) {
        root.removeChild(child);
        continue;
      }
      if (child.nodeType === 1) {
        var tag = child.tagName.toLowerCase();
        if (allowedTags.indexOf(tag) === -1) {
          // The tag is not in the whitelist.

          // If we are stripping, then replace the child with its contents.
          if (doStrip) {
            while (child.firstChild) {
              root.insertBefore(child.firstChild, child);
            }
            root.removeChild(child);
            // We want to make sure we process all of the children, so
            // decrement.  Alternately, we could have called slashAndBurn
            // on 'child' before splicing in the contents.
            i--;
          }
          // Otherwise, quote the child.
          // Unit tests do not indicate if this should be recursive or not,
          // so it's not.
          else {
            var textNode = document.createTextNode(child.outerHTML);
            // jsdom bug? creating a text node always adds a linebreak;
            textNode.nodeValue = textNode.nodeValue.replace(/\n$/, '');
            root.replaceChild(textNode, child);
          }
          continue;
        }

        if (child.style.length) {
          var styles = child.style;
          for (var iStyle = styles.length - 1; iStyle >= 0; iStyle--) {
            var decl = styles[iStyle];
            if (allowedStyles.indexOf(decl) === -1) {
              styles.removeProperty(decl);
            }
          }
        }

        if (child.attributes.length) {
          var attrs = child.attributes;
          for (var iAttr = attrs.length - 1; iAttr >= 0; iAttr--) {
            var attr = attrs[iAttr];
            var whitelist = attrsByTag[tag];
            attr = attr.nodeName;
            if (wildAttrs.indexOf(attr) === -1 &&
                (!whitelist || whitelist.indexOf(attr) === -1)) {
              attrs.removeNamedItem(attr);
            }
          }
        }
      }
      slashAndBurn(child, callback);
    }
  }

  dirty.innerHTML = html;
  if (!html) return '';

  // workaround for jsdom comment bug
  if (dirty.innerHTML === '' && html.match(/<!--/)) {
    dirty.innerHTML = (html + '-->');
  }

  slashAndBurn(dirty);

  return dirty.innerHTML;
};


if (!module.parent) {
  bleach.clean('what <abbr> are <!-- seriously --> <a> dirty <mother> fucker </mother> </a> </attr>');
}

module.exports = bleach;
