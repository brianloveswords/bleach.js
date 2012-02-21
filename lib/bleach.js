var jsdom = require('jsdom').jsdom
  , _ = require('underscore')
  
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
  opts = opts||{}
  var document = jsdom()
    , clean = document.createElement('clean')
    , dirty = document.createElement('dirty');
  
  _.defaults(opts, DEFAULTS);
  
  function slashAndBurn(root, callback) {
    var child, i = 0;
    // console.log('slashing');
    // console.log('type ', root.nodeType);
    // console.log('value', root.nodeValue||['<',root.tagName,'>'].join(''));
    // console.log('innerHTML', root.innerHTML);
    // console.log('--------');
    
    while (child = root.childNodes[i++]) {
      if (child.nodeType === 8 && opts.stripComments) {
        root.removeChild(child);
        continue;
      }
      if (child.nodeType === 1) {
        var tag = child.tagName.toLowerCase();
        if (opts.tags.indexOf(tag) === -1) {
          var textNode = document.createTextNode(child.outerHTML)
          // jsdom bug? creating a text node always adds a linebreak;
          textNode.nodeValue = textNode.nodeValue.replace(/\n$/, '');
          root.replaceChild(textNode, child);
          //root.removeChild(child);
          continue;
        }
        
        //jsdom bug -- doing `node.style` creates a style attribute
        if (!child.style.length) {
          child.attributes.removeNamedItem('style');
        }
        else {
          _.each(child.style, function (decl) {
            if (opts.styles.indexOf(decl) === -1) {
              child.style.removeProperty(decl);
            }
          });
        }

        if (child.attributes.length) {
          _.each(child.attributes, function (attr) {
            var whitelist = opts.attributes[tag];
            attr = attr.nodeName;
            if (!whitelist || whitelist.indexOf(attr) === -1) {
              child.attributes.removeNamedItem(attr);
            }
          });
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
  
  _.defaults(opts, DEFAULTS);
  return dirty.innerHTML;
  

};


if (!module.parent) {
  bleach.clean('what <abbr> are <!-- seriously --> <a> dirty <mother> fucker </mother> </a> </attr>');
}

module.exports = bleach;