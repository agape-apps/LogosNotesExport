#!/usr/bin/env bun
// @bun
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS((exports) => {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS((exports) => {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS((exports) => {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            val.delete(k);
          else if (v1 !== v0)
            val.set(k, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            delete val[k];
          else if (v1 !== v0)
            val[k] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS((exports) => {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res2) => {
        data.res = res2;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS((exports) => {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS((exports) => {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const { anchors: anchors2, doc, maxAliasCount } = ctx;
      const source = this.resolve(doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      let data = anchors2.get(source);
      if (!data) {
        toJS.toJS(source, null, ctx);
        data = anchors2.get(source);
      }
      if (!data || data.res === undefined) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc, source, anchors2);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
      return data.res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors2) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors2 && source && anchors2.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors2);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors2);
      const vc = getAliasCount(doc, node.value, anchors2);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node2 = new Scalar.Scalar(value);
        if (ref)
          ref.node = node2;
        return node2;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS((exports) => {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else {
        v = new Map([[k, v]]);
      }
    }
    return createNode.createNode(v, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS((exports) => {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS((exports) => {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j])
              return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i2 = 0;i2 < folds.length; ++i2) {
      const fold = folds[i2];
      const end2 = folds[i2 + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end2)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end2)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote: singleQuote2 } = ctx.options;
    let qs;
    if (singleQuote2 === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote2 ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS((exports) => {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
`)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS((exports) => {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    value = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
    if (identity.isSeq(value))
      for (const it of value.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(value))
      for (const it of value)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, value);
  }
  function mergeValue(ctx, map, value) {
    const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value2] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value2);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value: value2,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS((exports) => {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify2(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment2 = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment2 = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
      if (comment2)
        str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
      if (chompKeep && comment2)
        chompKeep = false;
      lines.push(blockItemPrefix + str2);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      if (i < items.length - 1)
        str += ",";
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      if (!reqNewline && (lines.length > linesAtValue || str.includes(`
`)))
        reqNewline = true;
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS((exports) => {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map2, onError) {
      if (!identity.isMap(map2))
        onError("Expected a mapping for this tag");
      return map2;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq2, onError) {
      if (!identity.isSeq(seq2))
        onError("Expected a sequence for this tag");
      return seq2;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS((exports) => {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS((exports) => {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS((exports) => {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
          lines[i] = str.substr(o, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs2 = new YAMLSeq.YAMLSeq(schema);
    pairs2.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs2.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs2;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS((exports) => {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_, ctx) {
      if (!ctx)
        return super.toJSON(_);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap2 = new this;
      omap2.items = pairs$1.items;
      return omap2;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n2 = BigInt(str);
      return sign === "-" ? BigInt(-1) * n2 : n2;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set2 = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set2.items.push(Pair.createPair(value, null, ctx));
        }
      return set2;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30)
          d *= 60;
        date -= 60000 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags2, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags2.includes(tagObj))
        tags2.push(tagObj);
      return tags2;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS((exports) => {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS((exports) => {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS((exports) => {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "\u2026" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "\u2026";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `\u2026
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end && end.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS((exports) => {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS((exports) => {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS((exports) => {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS((exports) => {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS((exports) => {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS((exports) => {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value && value.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS((exports) => {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source && value.source[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce && ce.source === expectedEnd)
      cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1)
        ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt && kt.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value2 = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end2 = start + header.length;
      if (scalar.source)
        end2 += scalar.source.length;
      return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return foldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function foldLines(source) {
    let first, line;
    try {
      first = new RegExp(`(.*?)(?<![ 	])[ 	]*\r?
`, "sy");
      line = new RegExp(`[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?
`, "sy");
    } catch {
      first = /(.*?)[ \t]*\r?\n/sy;
      line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
    }
    let match = first.exec(source);
    if (!match)
      return source;
    let res = match[1];
    let sep = " ";
    let pos = first.lastIndex;
    line.lastIndex = pos;
    while (match = line.exec(source)) {
      if (match[1] === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + match[1];
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = { x: 2, u: 4, U: 8 }[next];
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "\x85",
    _: "\xA0",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    if (isNaN(code)) {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
    return String.fromCodePoint(code);
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS((exports) => {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        node = composeCollection.composeCollection(CN, ctx, token, props, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError);
        isSrcToken = false;
      }
    }
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS((exports) => {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS((exports) => {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        Array.prototype.push.apply(doc.errors, this.errors);
        Array.prototype.push.apply(doc.warnings, this.warnings);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS((exports) => {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf(`
`);
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf(`
`);
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS((exports) => {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS((exports) => {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS((exports) => {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS((exports) => {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return yield* this.parseBlockStart();
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i2 = this.pos;ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i2 = nl - 1;
          let ch2 = this.buffer[i2];
          if (ch2 === "\r")
            ch2 = this.buffer[--i2];
          const lastChar = i2;
          while (ch2 === " ")
            ch2 = this.buffer[--i2];
          if (ch2 === `
` && i2 >= this.pos && i2 + 1 + indent > lastChar)
            nl = i2;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      switch (this.charAt(0)) {
        case "!":
          return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
        case "&":
          return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
        case "-":
        case "?":
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
            if (!inFlow)
              this.indentNext = this.indentValue + 1;
            else if (this.flowKey)
              this.flowKey = false;
            return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          }
        }
      }
      return 0;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS((exports) => {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS((exports) => {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              Array.prototype.push.apply(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            Array.prototype.push.apply(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && (!top || top.type !== "doc-end")) {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start2 = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start2 = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top && top.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS((exports) => {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter2)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter2) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter2));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// src/cli.ts
import { parseArgs } from "util";
import { existsSync as existsSync4, readFileSync as readFileSync2 } from "fs";
import { join as join4 } from "path";

// src/reference-decoder.ts
class BibleReferenceDecoder {
  bookMappings = new Map;
  constructor() {
    this.initializeBookMappings();
  }
  decodeReference(reference, anchorBookId) {
    try {
      if (reference.includes("bible+")) {
        return this.decodeBiblePlusReference(reference, anchorBookId);
      } else if (reference.includes(".")) {
        return this.decodeDottedReference(reference, anchorBookId);
      } else {
        return this.decodeSimpleReference(reference, anchorBookId);
      }
    } catch (error) {
      console.warn(`Failed to decode reference: ${reference}`, error);
      return null;
    }
  }
  getBookName(anchorBookId) {
    const mapping = this.bookMappings.get(anchorBookId);
    return mapping ? mapping.englishName : `Unknown Book ${anchorBookId}`;
  }
  decodeBiblePlusReference(reference, anchorBookId) {
    const match = reference.match(/bible\+([^.]+)\.(\d+)\.(\d+)\.(\d+)(?:-(\d+)\.(\d+)\.(\d+))?/);
    if (!match)
      return null;
    const [, version, bookNum, chapter, verse, endBook, endChapter, endVerse] = match;
    const bookId = parseInt(bookNum || "0");
    const bookName = this.getBookName(anchorBookId || bookId);
    const bookMapping = this.bookMappings.get(anchorBookId || bookId);
    const isSingleChapterBook = bookMapping?.chapterCount === 1;
    let actualChapter;
    let actualVerse;
    if (isSingleChapterBook) {
      actualChapter = parseInt(verse || "0");
      actualVerse = undefined;
    } else {
      actualChapter = parseInt(chapter || "0");
      actualVerse = parseInt(verse || "0");
    }
    const result = {
      bookName,
      chapter: actualChapter,
      verse: actualVerse,
      reference,
      anchorBookId: anchorBookId || bookId,
      formatted: this.formatReference(bookName, actualChapter, actualVerse, endChapter ? parseInt(endChapter || "0") : undefined, endVerse ? parseInt(endVerse || "0") : undefined)
    };
    if (endChapter && endVerse) {
      result.endChapter = parseInt(endChapter || "0");
      result.endVerse = parseInt(endVerse || "0");
    }
    return result;
  }
  decodeDottedReference(reference, anchorBookId) {
    const parts = reference.split(".");
    if (parts.length < 2)
      return null;
    const bookId = anchorBookId || parseInt(parts[0] || "0");
    const chapter = parseInt(parts[1] || "0");
    const verse = parts[2] ? parseInt(parts[2] || "0") : undefined;
    const bookName = this.getBookName(bookId);
    return {
      bookName,
      chapter,
      verse,
      reference,
      anchorBookId: bookId,
      formatted: this.formatReference(bookName, chapter, verse)
    };
  }
  decodeSimpleReference(reference, anchorBookId) {
    if (!anchorBookId)
      return null;
    const bookName = this.getBookName(anchorBookId);
    return {
      bookName,
      reference,
      anchorBookId,
      formatted: `${bookName} (${reference})`
    };
  }
  formatReference(bookName, chapter, verse, endChapter, endVerse) {
    let formatted = bookName;
    const bookMapping = Array.from(this.bookMappings.values()).find((b) => b.englishName === bookName);
    const isSingleChapterBook = bookMapping?.chapterCount === 1;
    if (chapter) {
      if (isSingleChapterBook) {
        formatted += ` ${chapter}`;
        if (verse) {
          formatted += `-${verse}`;
        }
      } else {
        formatted += ` ${chapter}`;
        if (verse) {
          formatted += `:${verse}`;
          if (endChapter && endVerse) {
            if (endChapter === chapter) {
              formatted += `-${endVerse}`;
            } else {
              formatted += `-${endChapter}:${endVerse}`;
            }
          }
        }
      }
    }
    return formatted;
  }
  initializeBookMappings() {
    const otBooks = [
      { anchorId: 1, englishName: "Genesis", osisAbbr: "Gen", chapterCount: 50, status: "Complete" },
      { anchorId: 2, englishName: "Exodus", osisAbbr: "Exod", chapterCount: 40, status: "Complete" },
      { anchorId: 3, englishName: "Leviticus", osisAbbr: "Lev", chapterCount: 27, status: "Partial" },
      { anchorId: 4, englishName: "Numbers", osisAbbr: "Num", chapterCount: 36, status: "Partial" },
      { anchorId: 5, englishName: "Deuteronomy", osisAbbr: "Deut", chapterCount: 34, status: "Complete" },
      { anchorId: 6, englishName: "Joshua", osisAbbr: "Josh", chapterCount: 24, status: "Complete" },
      { anchorId: 7, englishName: "Judges", osisAbbr: "Judg", chapterCount: 21, status: "Complete" },
      { anchorId: 8, englishName: "Ruth", osisAbbr: "Ruth", chapterCount: 4, status: "Complete" },
      { anchorId: 9, englishName: "1 Samuel", osisAbbr: "1Sam", chapterCount: 31, status: "Complete" },
      { anchorId: 10, englishName: "2 Samuel", osisAbbr: "2Sam", chapterCount: 24, status: "Complete" },
      { anchorId: 11, englishName: "1 Kings", osisAbbr: "1Kgs", chapterCount: 22, status: "Complete" },
      { anchorId: 12, englishName: "2 Kings", osisAbbr: "2Kgs", chapterCount: 25, status: "Complete" },
      { anchorId: 13, englishName: "1 Chronicles", osisAbbr: "1Chr", chapterCount: 29, status: "Partial" },
      { anchorId: 14, englishName: "2 Chronicles", osisAbbr: "2Chr", chapterCount: 36, status: "Partial" },
      { anchorId: 15, englishName: "Ezra", osisAbbr: "Ezra", chapterCount: 10, status: "Complete" },
      { anchorId: 16, englishName: "Nehemiah", osisAbbr: "Neh", chapterCount: 13, status: "Complete" },
      { anchorId: 17, englishName: "Esther", osisAbbr: "Esth", chapterCount: 10, status: "Complete" },
      { anchorId: 18, englishName: "Job", osisAbbr: "Job", chapterCount: 42, status: "Complete" },
      { anchorId: 19, englishName: "Psalms", osisAbbr: "Ps", chapterCount: 150, status: "Complete" },
      { anchorId: 20, englishName: "Proverbs", osisAbbr: "Prov", chapterCount: 31, status: "Complete" },
      { anchorId: 21, englishName: "Ecclesiastes", osisAbbr: "Eccl", chapterCount: 12, status: "Complete" },
      { anchorId: 22, englishName: "Song of Solomon", osisAbbr: "Song", chapterCount: 8, status: "Complete" },
      { anchorId: 23, englishName: "Isaiah", osisAbbr: "Isa", chapterCount: 66, status: "Complete" },
      { anchorId: 24, englishName: "Jeremiah", osisAbbr: "Jer", chapterCount: 52, status: "Partial" },
      { anchorId: 25, englishName: "Lamentations", osisAbbr: "Lam", chapterCount: 5, status: "Complete" },
      { anchorId: 26, englishName: "Ezekiel", osisAbbr: "Ezek", chapterCount: 48, status: "Partial" },
      { anchorId: 27, englishName: "Daniel", osisAbbr: "Dan", chapterCount: 12, status: "Complete" },
      { anchorId: 28, englishName: "Hosea", osisAbbr: "Hos", chapterCount: 14, status: "Complete" },
      { anchorId: 29, englishName: "Joel", osisAbbr: "Joel", chapterCount: 3, status: "Complete" },
      { anchorId: 30, englishName: "Amos", osisAbbr: "Amos", chapterCount: 9, status: "Complete" },
      { anchorId: 31, englishName: "Obadiah", osisAbbr: "Obad", chapterCount: 1, status: "Complete" },
      { anchorId: 32, englishName: "Jonah", osisAbbr: "Jonah", chapterCount: 4, status: "Complete" },
      { anchorId: 33, englishName: "Micah", osisAbbr: "Mic", chapterCount: 7, status: "Complete" },
      { anchorId: 34, englishName: "Nahum", osisAbbr: "Nah", chapterCount: 3, status: "Complete" },
      { anchorId: 35, englishName: "Habakkuk", osisAbbr: "Hab", chapterCount: 3, status: "Complete" },
      { anchorId: 36, englishName: "Zephaniah", osisAbbr: "Zeph", chapterCount: 3, status: "Complete" },
      { anchorId: 37, englishName: "Haggai", osisAbbr: "Hag", chapterCount: 2, status: "Complete" },
      { anchorId: 38, englishName: "Zechariah", osisAbbr: "Zech", chapterCount: 14, status: "Complete" },
      { anchorId: 39, englishName: "Malachi", osisAbbr: "Mal", chapterCount: 4, status: "Complete" }
    ];
    const apocryphaBooks = [
      { anchorId: 40, englishName: "Tobit", osisAbbr: "Tob", chapterCount: 14, status: "Complete" },
      { anchorId: 41, englishName: "Judith", osisAbbr: "Jdt", chapterCount: 16, status: "Complete" },
      { anchorId: 42, englishName: "Esther (Greek)", osisAbbr: "EsthGr", chapterCount: 16, status: "Complete" },
      { anchorId: 43, englishName: "The Wisdom of Solomon", osisAbbr: "Wis", chapterCount: 19, status: "Complete" },
      { anchorId: 44, englishName: "Ecclesiasticus (Sirach)", osisAbbr: "Sir", chapterCount: 51, status: "Complete" },
      { anchorId: 45, englishName: "Baruch", osisAbbr: "Bar", chapterCount: 6, status: "Complete" },
      { anchorId: 46, englishName: "The Letter of Jeremiah", osisAbbr: "EpJer", chapterCount: 1, status: "Complete" },
      { anchorId: 47, englishName: "The Prayer of Azariah and the Song of the Three Jews", osisAbbr: "PrAzar", chapterCount: 1, status: "Complete" },
      { anchorId: 48, englishName: "Susanna", osisAbbr: "Sus", chapterCount: 1, status: "Complete" },
      { anchorId: 49, englishName: "Bel and the Dragon", osisAbbr: "Bel", chapterCount: 1, status: "Complete" },
      { anchorId: 50, englishName: "1 Maccabees", osisAbbr: "1Macc", chapterCount: 16, status: "Complete" },
      { anchorId: 51, englishName: "2 Maccabees", osisAbbr: "2Macc", chapterCount: 15, status: "Complete" },
      { anchorId: 52, englishName: "1 Esdras", osisAbbr: "1Esd", chapterCount: 9, status: "Complete" },
      { anchorId: 53, englishName: "Prayer of Manasseh", osisAbbr: "PrMan", chapterCount: 1, status: "Complete" },
      { anchorId: 54, englishName: "Psalm 151", osisAbbr: "AddPs", chapterCount: 1, status: "Complete" },
      { anchorId: 55, englishName: "3 Maccabees", osisAbbr: "3Macc", chapterCount: 7, status: "Complete" },
      { anchorId: 56, englishName: "2 Esdras", osisAbbr: "2Esd", chapterCount: 16, status: "Complete" },
      { anchorId: 57, englishName: "4 Maccabees", osisAbbr: "4Macc", chapterCount: 18, status: "Complete" }
    ];
    const ntBooks = [
      { anchorId: 61, englishName: "Matthew", osisAbbr: "Matt", chapterCount: 28, status: "Complete" },
      { anchorId: 62, englishName: "Mark", osisAbbr: "Mark", chapterCount: 16, status: "Complete" },
      { anchorId: 63, englishName: "Luke", osisAbbr: "Luke", chapterCount: 24, status: "Complete" },
      { anchorId: 64, englishName: "John", osisAbbr: "John", chapterCount: 21, status: "Complete" },
      { anchorId: 65, englishName: "Acts", osisAbbr: "Acts", chapterCount: 28, status: "Complete" },
      { anchorId: 66, englishName: "Romans", osisAbbr: "Rom", chapterCount: 16, status: "Complete" },
      { anchorId: 67, englishName: "1 Corinthians", osisAbbr: "1Cor", chapterCount: 16, status: "Complete" },
      { anchorId: 68, englishName: "2 Corinthians", osisAbbr: "2Cor", chapterCount: 13, status: "Complete" },
      { anchorId: 69, englishName: "Galatians", osisAbbr: "Gal", chapterCount: 6, status: "Complete" },
      { anchorId: 70, englishName: "Ephesians", osisAbbr: "Eph", chapterCount: 6, status: "Complete" },
      { anchorId: 71, englishName: "Philippians", osisAbbr: "Phil", chapterCount: 4, status: "Complete" },
      { anchorId: 72, englishName: "Colossians", osisAbbr: "Col", chapterCount: 4, status: "Complete" },
      { anchorId: 73, englishName: "1 Thessalonians", osisAbbr: "1Thess", chapterCount: 5, status: "Complete" },
      { anchorId: 74, englishName: "2 Thessalonians", osisAbbr: "2Thess", chapterCount: 3, status: "Complete" },
      { anchorId: 75, englishName: "1 Timothy", osisAbbr: "1Tim", chapterCount: 6, status: "Complete" },
      { anchorId: 76, englishName: "2 Timothy", osisAbbr: "2Tim", chapterCount: 4, status: "Complete" },
      { anchorId: 77, englishName: "Titus", osisAbbr: "Titus", chapterCount: 3, status: "Complete" },
      { anchorId: 78, englishName: "Philemon", osisAbbr: "Phlm", chapterCount: 1, status: "Complete" },
      { anchorId: 79, englishName: "Hebrews", osisAbbr: "Heb", chapterCount: 13, status: "Complete" },
      { anchorId: 80, englishName: "James", osisAbbr: "Jas", chapterCount: 5, status: "Complete" },
      { anchorId: 81, englishName: "1 Peter", osisAbbr: "1Pet", chapterCount: 5, status: "Complete" },
      { anchorId: 82, englishName: "2 Peter", osisAbbr: "2Pet", chapterCount: 3, status: "Complete" },
      { anchorId: 83, englishName: "1 John", osisAbbr: "1John", chapterCount: 5, status: "Complete" },
      { anchorId: 84, englishName: "2 John", osisAbbr: "2John", chapterCount: 1, status: "Complete" },
      { anchorId: 85, englishName: "3 John", osisAbbr: "3John", chapterCount: 1, status: "Complete" },
      { anchorId: 86, englishName: "Jude", osisAbbr: "Jude", chapterCount: 1, status: "Complete" },
      { anchorId: 87, englishName: "Revelation", osisAbbr: "Rev", chapterCount: 22, status: "Complete" }
    ];
    [...otBooks, ...apocryphaBooks, ...ntBooks].forEach((book) => {
      this.bookMappings.set(book.anchorId, book);
    });
  }
  getBookMappings() {
    return Array.from(this.bookMappings.values());
  }
  isValidBookId(bookId) {
    return this.bookMappings.has(bookId);
  }
  getOsisAbbr(anchorBookId) {
    const mapping = this.bookMappings.get(anchorBookId);
    return mapping ? mapping.osisAbbr : "";
  }
  getBibleSectionPrefix(anchorBookId) {
    if (anchorBookId >= 1 && anchorBookId <= 39) {
      return "OT";
    } else if (anchorBookId >= 40 && anchorBookId <= 60) {
      return "AP";
    } else if (anchorBookId >= 61 && anchorBookId <= 87) {
      return "NT";
    }
    return "UN";
  }
  generateBibleFilename(anchorBookId, chapter, verse) {
    const sectionPrefix = this.getBibleSectionPrefix(anchorBookId);
    const osisAbbr = this.getOsisAbbr(anchorBookId);
    const bookIdFormatted = anchorBookId.toString().padStart(2, "0");
    const chapterFormatted = chapter.toString().padStart(2, "0");
    const verseFormatted = (verse || 1).toString().padStart(2, "0");
    return `${sectionPrefix}${bookIdFormatted}_${osisAbbr}-${chapterFormatted}.${verseFormatted}.md`;
  }
  generateSimpleFilename(bookName, chapter, verse) {
    const simpleName = bookName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (verse) {
      return `${simpleName}-${chapter}-${verse}`;
    } else {
      return `${simpleName}-${chapter}`;
    }
  }
}

// src/notebook-organizer.ts
class NotebookOrganizer {
  database;
  referenceDecoder;
  options;
  constructor(database, options = {}) {
    this.database = database;
    this.referenceDecoder = new BibleReferenceDecoder;
    this.options = options;
  }
  async organizeNotes() {
    let notes = this.database.getActiveNotes();
    if (this.options.skipHighlights) {
      notes = notes.filter((note) => note.kind !== 1);
    }
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();
    const allTextRanges = this.database.getNoteAnchorTextRanges();
    const notebookMap = new Map;
    notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
    const referencesMap = new Map;
    allReferences.forEach((ref) => {
      const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
      if (decoded) {
        if (!referencesMap.has(ref.noteId)) {
          referencesMap.set(ref.noteId, []);
        }
        const noteReferences = referencesMap.get(ref.noteId);
        if (noteReferences) {
          noteReferences.push(decoded);
        }
      }
    });
    const textRangesMap = new Map;
    allTextRanges.forEach((range) => {
      if (!textRangesMap.has(range.noteId)) {
        textRangesMap.set(range.noteId, range);
      }
    });
    const notebookGroups = new Map;
    const orphanedGroup = {
      notebook: null,
      notes: [],
      totalNotes: 0,
      sanitizedFolderName: "No Notebook"
    };
    for (const note of notes) {
      const organizedNote = this.processNote(note, notebookMap, referencesMap, textRangesMap);
      if (organizedNote.notebook) {
        const notebookId = organizedNote.notebook.externalId;
        if (!notebookGroups.has(notebookId)) {
          notebookGroups.set(notebookId, {
            notebook: organizedNote.notebook,
            notes: [],
            totalNotes: 0,
            sanitizedFolderName: this.sanitizeFilename(organizedNote.notebook.title || "untitled-notebook")
          });
        }
        const group = notebookGroups.get(notebookId);
        group.notes.push(organizedNote);
        group.totalNotes++;
      } else {
        orphanedGroup.notes.push(organizedNote);
        orphanedGroup.totalNotes++;
      }
    }
    const result = Array.from(notebookGroups.values()).sort((a, b) => (a.notebook?.title || "").localeCompare(b.notebook?.title || ""));
    if (orphanedGroup.totalNotes > 0) {
      result.push(orphanedGroup);
    }
    return result;
  }
  getOrganizationStats() {
    const notes = this.database.getActiveNotes();
    const notebooks = this.database.getActiveNotebooks();
    const references = this.database.getBibleReferences();
    const notesWithContent = notes.filter((n) => n.contentRichText && n.contentRichText.trim() !== "").length;
    const noteIdsWithReferences = new Set(references.map((r) => r.noteId));
    const notesWithReferences = notes.filter((n) => noteIdsWithReferences.has(n.id)).length;
    const notebookIds = new Set(notebooks.map((nb) => nb.externalId));
    const orphanedNotes = notes.filter((n) => !notebookIds.has(n.notebookExternalId)).length;
    return {
      totalNotes: notes.length,
      notesWithContent,
      notesWithReferences,
      notebooks: notebooks.length,
      orphanedNotes
    };
  }
  getNotesByNotebook(notebookExternalId) {
    const allNotes = this.database.getActiveNotes();
    let notes = allNotes.filter((n) => n.notebookExternalId === notebookExternalId);
    if (this.options.skipHighlights) {
      notes = notes.filter((note) => note.kind !== 1);
    }
    const notebooks = this.database.getActiveNotebooks();
    const allReferences = this.database.getBibleReferences();
    const allTextRanges = this.database.getNoteAnchorTextRanges();
    const notebookMap = new Map;
    notebooks.forEach((nb) => notebookMap.set(nb.externalId, nb));
    const referencesMap = new Map;
    allReferences.forEach((ref) => {
      const decoded = this.referenceDecoder.decodeReference(ref.reference, ref.bibleBook);
      if (decoded) {
        if (!referencesMap.has(ref.noteId)) {
          referencesMap.set(ref.noteId, []);
        }
        referencesMap.get(ref.noteId).push(decoded);
      }
    });
    const textRangesMap = new Map;
    allTextRanges.forEach((range) => {
      if (!textRangesMap.has(range.noteId)) {
        textRangesMap.set(range.noteId, range);
      }
    });
    return notes.map((note) => this.processNote(note, notebookMap, referencesMap, textRangesMap));
  }
  generateNoteFilename(note, index) {
    let filename = "";
    if (note.formattedTitle) {
      filename = note.formattedTitle;
    } else if (note.references.length > 0) {
      filename = note.references[0].formatted;
    } else {
      filename = `Note-${note.id}`;
    }
    if (index > 1) {
      filename += `-${index}`;
    }
    return this.sanitizeFilename(filename) + ".md";
  }
  processNote(note, notebookMap, referencesMap, textRangesMap) {
    const notebook = notebookMap.get(note.notebookExternalId) || null;
    const references = referencesMap.get(note.id) || [];
    const anchorTextRange = textRangesMap.get(note.id);
    const formattedTitle = this.generateNoteTitle(note, references);
    const sanitizedFilename = this.sanitizeFilename(formattedTitle);
    return {
      ...note,
      notebook,
      references,
      formattedTitle,
      sanitizedFilename,
      anchorTextRange
    };
  }
  generateNoteTitle(note, references) {
    if (note.contentRichText) {
      const title = this.extractTitleFromContent(note.contentRichText);
      if (title)
        return title;
    }
    if (references.length > 0) {
      return references[0].formatted;
    }
    const noteType = note.kind === 0 ? "Note" : note.kind === 1 ? "Highlight" : "Annotation";
    return `${noteType} ${note.id}`;
  }
  extractTitleFromContent(content) {
    const cleanText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText)
      return null;
    const firstLine = cleanText.split(/[\\n\\r]/)[0].trim();
    if (firstLine.length > 50) {
      return firstLine.substring(0, 47) + "...";
    }
    return firstLine || null;
  }
  sanitizeFilename(name) {
    return name.replace(/[<>:\"/\\|?*]/g, "-").replace(/\\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 100) || "untitled";
  }
  close() {
    this.database.close();
  }
}

// src/file-organizer.ts
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
var DEFAULT_FILE_OPTIONS = {
  baseDir: "./Logos-Exported-Notes",
  organizeByNotebooks: true,
  includeDateFolders: false,
  flattenSingleNotebook: false,
  maxFilenameLength: 100,
  fileExtension: ".md",
  createIndexFiles: true
};

class FileOrganizer {
  options;
  createdDirs = new Set;
  bibleDecoder = new BibleReferenceDecoder;
  resourceIdMap;
  constructor(options = {}, resourceIds) {
    this.options = { ...DEFAULT_FILE_OPTIONS, ...options };
    if (resourceIds) {
      this.resourceIdMap = new Map(resourceIds.map((r) => [r.resourceIdId, r]));
    }
  }
  async planDirectoryStructure(notebookGroups) {
    const structure = {
      baseDir: this.options.baseDir,
      notebookDirs: [],
      totalFiles: 0,
      indexFiles: []
    };
    if (this.options.createIndexFiles) {
      structure.indexFiles.push(join(this.options.baseDir, "README.md"));
    }
    for (const group of notebookGroups) {
      const notebookDir = this.getNotebookDirectory(group);
      structure.notebookDirs.push(notebookDir);
      structure.totalFiles += group.notes.length;
      if (this.options.createIndexFiles) {
        structure.indexFiles.push(join(notebookDir, "README.md"));
      }
    }
    return structure;
  }
  getNotebookDirectory(group) {
    if (!this.options.organizeByNotebooks) {
      return this.options.baseDir;
    }
    const notebookName = group.sanitizedFolderName;
    return join(this.options.baseDir, notebookName);
  }
  generateFilePath(note, group, index = 1) {
    const directory = this.getNotebookDirectory(group);
    let filename = this.generateSafeFilename(note, index);
    let finalDirectory = directory;
    if (this.options.includeDateFolders) {
      const date = new Date(note.createdDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      finalDirectory = join(directory, `${year}-${month}`);
    }
    const fullPath = join(finalDirectory, filename);
    const relativePath = fullPath.replace(this.options.baseDir + "/", "");
    return {
      fullPath,
      directory: finalDirectory,
      filename: filename.replace(this.options.fileExtension, ""),
      relativePath,
      exists: existsSync(fullPath)
    };
  }
  async ensureDirectory(dirPath) {
    if (!this.createdDirs.has(dirPath) && !existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
      this.createdDirs.add(dirPath);
    }
  }
  async writeFile(fileInfo, content) {
    await this.ensureDirectory(fileInfo.directory);
    await writeFile(fileInfo.fullPath, content, "utf-8");
  }
  generateMainIndex(notebookGroups, stats) {
    const lines = [
      "# Exported Logos Notes",
      "",
      `**Exported on:** ${new Date().toISOString()}  `,
      `**Total Notes:** ${stats.totalNotes}  `,
      `**Total Notebooks:** ${notebookGroups.length}  `,
      "",
      "## \uD83D\uDCDA Notebooks",
      ""
    ];
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "No Notebook";
      const noteCount = group.notes.length;
      const relativePath = group.sanitizedFolderName;
      lines.push(`- [**${notebookName}**](./${relativePath}/README.md) (${noteCount} notes)`);
    }
    lines.push("");
    lines.push("## \uD83D\uDCCA Statistics");
    lines.push("");
    lines.push(`- **Notes with Content:** ${stats.notesWithContent}`);
    lines.push(`- **Notes with References:** ${stats.notesWithReferences}`);
    lines.push(`- **No Notebook:** ${stats.orphanedNotes}`);
    lines.push("");
    lines.push("---");
    lines.push("*Generated by Logos Notes Exporter*");
    return lines.join(`
`);
  }
  generateNotebookIndex(group) {
    const notebookTitle = group.notebook?.title || "No Notebook";
    const lines = [
      `# ${notebookTitle}`,
      "",
      `**Notes:** ${group.notes.length}  `,
      ""
    ];
    if (group.notebook) {
      lines.push(`**Created:** ${new Date(group.notebook.createdDate).toLocaleDateString()}  `);
      lines.push(`**Notebook ID:** ${group.notebook.externalId}  `);
      lines.push("");
    }
    lines.push("## \uD83D\uDCDD Notes");
    lines.push("");
    const textNotes = group.notes.filter((n) => n.kind === 0);
    const highlights = group.notes.filter((n) => n.kind === 1);
    const annotations = group.notes.filter((n) => n.kind === 2);
    if (textNotes.length > 0) {
      lines.push("### \u270D\uFE0F Text Notes");
      lines.push("");
      textNotes.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    if (highlights.length > 0) {
      lines.push("### \uD83C\uDFA8 Highlights");
      lines.push("");
      highlights.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    if (annotations.length > 0) {
      lines.push("### \uD83D\uDCCB Annotations");
      lines.push("");
      annotations.forEach((note) => {
        const filename = this.generateSafeFilename(note, 1);
        const title = note.formattedTitle;
        const references = note.references.map((r) => r.formatted).join(", ");
        lines.push(`- [**${title}**](./${filename})${references ? ` - ${references}` : ""}`);
      });
      lines.push("");
    }
    lines.push("---");
    lines.push(`*${group.notes.length} notes in this notebook*`);
    return lines.join(`
`);
  }
  generateSafeFilename(note, index) {
    if (note.references.length > 0 && note.references[0]) {
      const firstRef = note.references[0];
      if (firstRef.anchorBookId && firstRef.chapter) {
        try {
          let filename2 = this.bibleDecoder.generateBibleFilename(firstRef.anchorBookId, firstRef.chapter, firstRef.verse);
          if (index > 1) {
            filename2 = filename2.replace(".md", `-${index}.md`);
          }
          return filename2;
        } catch (error) {
          console.warn(`Failed to generate Bible filename for note ${note.id}:`, error);
        }
      }
    }
    if (note.anchorResourceIdId && note.references.length === 0) {
      try {
        const resourceIdString = this.getResourceIdString(note.anchorResourceIdId);
        if (resourceIdString) {
          const filename2 = this.generateResourceIdFilename(resourceIdString, note.id, index);
          return filename2;
        }
      } catch (error) {
        console.warn(`Failed to generate resourceId filename for note ${note.id}:`, error);
      }
    }
    let filename = "";
    const isGenericNoteTitle = note.formattedTitle && /^(Note|Highlight|Annotation)\s+\d+$/.test(note.formattedTitle.trim());
    if (note.formattedTitle && note.formattedTitle.trim() && !isGenericNoteTitle) {
      filename = note.formattedTitle;
    } else if (note.references.length > 0 && note.references[0]) {
      filename = note.references[0].formatted;
    } else {
      const noteType = note.kind === 0 ? "Note" : note.kind === 1 ? "Highlight" : "Annotation";
      const paddedNoteId = note.id.toString().padStart(4, "0");
      filename = `${noteType}-${paddedNoteId}`;
    }
    if (index > 1) {
      filename += `-${index}`;
    }
    filename = this.sanitizeFilename(filename);
    return filename + this.options.fileExtension;
  }
  generateResourceIdFilename(resourceIdString, noteId, index) {
    const parts = resourceIdString.split(":");
    if (parts.length !== 2 || !parts[1]) {
      throw new Error(`Invalid resourceId format: ${resourceIdString}`);
    }
    const part1 = parts[0];
    const part2 = parts[1];
    let processedPart2 = part2;
    if (part2.length === 32 && /^[0-9a-f]{32}$/i.test(part2)) {
      processedPart2 = part2.slice(-4);
    }
    const paddedNoteId = noteId.toString().padStart(4, "0");
    let filename = `${part1}-${processedPart2}-${paddedNoteId}`;
    if (index > 1) {
      filename += `-${index}`;
    }
    return filename + this.options.fileExtension;
  }
  getResourceIdString(resourceIdId) {
    if (!this.resourceIdMap) {
      return null;
    }
    const resourceId = this.resourceIdMap.get(resourceIdId);
    return resourceId ? resourceId.resourceId : null;
  }
  sanitizeFilename(name) {
    return name.replace(/[<>:\"/\\\\|?*]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, this.options.maxFilenameLength) || "untitled";
  }
  resolveFilenameConflicts(notes, group) {
    const fileMap = new Map;
    const usedFilenames = new Set;
    for (const note of notes) {
      let index = 1;
      let fileInfo;
      do {
        fileInfo = this.generateFilePath(note, group, index);
        index++;
      } while (usedFilenames.has(fileInfo.fullPath) && index <= 100);
      usedFilenames.add(fileInfo.fullPath);
      fileMap.set(note, fileInfo);
    }
    return fileMap;
  }
  getFileOperationSummary(notebookGroups) {
    let totalDirectories = 1;
    let totalFiles = 0;
    let totalIndexFiles = 0;
    if (this.options.createIndexFiles) {
      totalIndexFiles++;
    }
    for (const group of notebookGroups) {
      if (this.options.organizeByNotebooks) {
        totalDirectories++;
      }
      totalFiles += group.notes.length;
      if (this.options.createIndexFiles && this.options.organizeByNotebooks) {
        totalIndexFiles++;
      }
      if (this.options.includeDateFolders) {
        const uniqueDates = new Set(group.notes.map((note) => {
          const date = new Date(note.createdDate);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }));
        totalDirectories += uniqueDates.size;
      }
    }
    const avgNoteSize = 2048;
    const avgIndexSize = 1024;
    const estimatedBytes = totalFiles * avgNoteSize + totalIndexFiles * avgIndexSize;
    const estimatedSize = this.formatBytes(estimatedBytes);
    return {
      totalDirectories,
      totalFiles,
      totalIndexFiles,
      estimatedSize
    };
  }
  formatBytes(bytes) {
    if (bytes === 0)
      return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
}

// node_modules/fast-xml-parser/src/util.js
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
var regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0;index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
var isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}

// node_modules/fast-xml-parser/src/validator.js
var defaultOptions = {
  allowBooleanAttributes: false,
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0;i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err)
        return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (;i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "\t" && xmlData[i] !== `
` && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {} else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++;i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err)
                return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "\t" || char === `
` || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3;i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {} else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0;i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (;i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var defaultOptions2 = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  allowBooleanAttributes: false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  captureMetaData: false
};
var buildOptions = function(options) {
  return Object.assign({}, defaultOptions2, options);
};

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var METADATA_SYMBOL;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = Symbol("XML Node Metadata");
}

class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = {};
  }
  add(key, val) {
    if (key === "__proto__")
      key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__")
      node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== undefined) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
}

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
function readDocType(xmlData, i) {
  const entities = {};
  if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false, comment = false;
    let exp = "";
    for (;i < xmlData.length; i++) {
      if (xmlData[i] === "<" && !comment) {
        if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
          i += 7;
          let entityName, val;
          [entityName, val, i] = readEntityExp(xmlData, i + 1);
          if (val.indexOf("&") === -1)
            entities[entityName] = {
              regx: RegExp(`&${entityName};`, "g"),
              val
            };
        } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
          i += 8;
          const { index } = readElementExp(xmlData, i + 1);
          i = index;
        } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
          i += 8;
        } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
          i += 9;
          const { index } = readNotationExp(xmlData, i + 1);
          i = index;
        } else if (hasSeq(xmlData, "!--", i))
          comment = true;
        else
          throw new Error(`Invalid DOCTYPE`);
        angleBracketsCount++;
        exp = "";
      } else if (xmlData[i] === ">") {
        if (comment) {
          if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
            comment = false;
            angleBracketsCount--;
          }
        } else {
          angleBracketsCount--;
        }
        if (angleBracketsCount === 0) {
          break;
        }
      } else if (xmlData[i] === "[") {
        hasBody = true;
      } else {
        exp += xmlData[i];
      }
    }
    if (angleBracketsCount !== 0) {
      throw new Error(`Unclosed DOCTYPE`);
    }
  } else {
    throw new Error(`Invalid Tag instead of DOCTYPE`);
  }
  return { entities, i };
}
var skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
function readEntityExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let entityName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
    entityName += xmlData[i];
    i++;
  }
  validateEntityName(entityName);
  i = skipWhitespace(xmlData, i);
  if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
    throw new Error("External entities are not supported");
  } else if (xmlData[i] === "%") {
    throw new Error("Parameter entities are not supported");
  }
  let entityValue = "";
  [i, entityValue] = readIdentifierVal(xmlData, i, "entity");
  i--;
  return [entityName, entityValue, i];
}
function readNotationExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let notationName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    notationName += xmlData[i];
    i++;
  }
  validateEntityName(notationName);
  i = skipWhitespace(xmlData, i);
  const identifierType = xmlData.substring(i, i + 6).toUpperCase();
  if (identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
    throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
  }
  i += identifierType.length;
  i = skipWhitespace(xmlData, i);
  let publicIdentifier = null;
  let systemIdentifier = null;
  if (identifierType === "PUBLIC") {
    [i, publicIdentifier] = readIdentifierVal(xmlData, i, "publicIdentifier");
    i = skipWhitespace(xmlData, i);
    if (xmlData[i] === '"' || xmlData[i] === "'") {
      [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    }
  } else if (identifierType === "SYSTEM") {
    [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    if (!systemIdentifier) {
      throw new Error("Missing mandatory system identifier for SYSTEM notation");
    }
  }
  return { notationName, publicIdentifier, systemIdentifier, index: --i };
}
function readIdentifierVal(xmlData, i, type) {
  let identifierVal = "";
  const startChar = xmlData[i];
  if (startChar !== '"' && startChar !== "'") {
    throw new Error(`Expected quoted string, found "${startChar}"`);
  }
  i++;
  while (i < xmlData.length && xmlData[i] !== startChar) {
    identifierVal += xmlData[i];
    i++;
  }
  if (xmlData[i] !== startChar) {
    throw new Error(`Unterminated ${type} value`);
  }
  i++;
  return [i, identifierVal];
}
function readElementExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let elementName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    elementName += xmlData[i];
    i++;
  }
  if (!validateEntityName(elementName)) {
    throw new Error(`Invalid element name: "${elementName}"`);
  }
  i = skipWhitespace(xmlData, i);
  let contentModel = "";
  if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i))
    i += 4;
  else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i))
    i += 2;
  else if (xmlData[i] === "(") {
    i++;
    while (i < xmlData.length && xmlData[i] !== ")") {
      contentModel += xmlData[i];
      i++;
    }
    if (xmlData[i] !== ")") {
      throw new Error("Unterminated content model");
    }
  } else {
    throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
  }
  return {
    elementName,
    contentModel: contentModel.trim(),
    index: i
  };
}
function hasSeq(data, seq, i) {
  for (let j = 0;j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1])
      return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}

// node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string")
    return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr))
    return str;
  else if (str === "0")
    return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (trimmedStr.search(/.+[eE].+/) !== -1) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === "." : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0)
          return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation)
            return num;
          else
            return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0")
            return num;
          else if (parsedStr === numTrimmedByZeros)
            return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`)
            return num;
          else
            return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
var eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation)
    return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === eChar : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros)
      return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || "") + notation[3];
      return Number(trimmedStr);
    } else
      return str;
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".")
      numStr = "0";
    else if (numStr[0] === ".")
      numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".")
      numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt)
    return parseInt(numStr, base);
  else if (Number.parseInt)
    return Number.parseInt(numStr, base);
  else if (window && window.parseInt)
    return window.parseInt(numStr, base);
  else
    throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}

// node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
      gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
      lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
      quot: { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      space: { regex: /&(nbsp|#160);/g, val: " " },
      cent: { regex: /&(cent|#162);/g, val: "\xA2" },
      pound: { regex: /&(pound|#163);/g, val: "\xA3" },
      yen: { regex: /&(yen|#165);/g, val: "\xA5" },
      euro: { regex: /&(euro|#8364);/g, val: "\u20AC" },
      copyright: { regex: /&(copy|#169);/g, val: "\xA9" },
      reg: { regex: /&(reg|#174);/g, val: "\xAE" },
      inr: { regex: /&(inr|#8377);/g, val: "\u20B9" },
      num_dec: { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }
}
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0;i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
      regex: new RegExp("&" + ent + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities)
        val = this.replaceEntitiesValue(val);
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if (newval === null || newval === undefined) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    for (let i = 0;i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if (aName === "__proto__")
          aName = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if (newVal === null || newVal === undefined) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, `
`);
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for (let i = 0;i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }
        const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
          this.tagsNodeStack.pop();
        } else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData)
          throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if (val == undefined)
          val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if (tagName !== xmlObj.tagname) {
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2)
              throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (tagName !== tagExp && attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if (tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          this.addChild(currentNode, childNode, jPath, startIndex);
        } else {
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            const childNode = new XmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          } else {
            const childNode = new XmlNode(tagName);
            this.tagsNodeStack.push(currentNode);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
  if (!this.options.captureMetaData)
    startIndex = undefined;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if (result === false) {} else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
var replaceEntitiesValue = function(val) {
  if (this.options.processEntities) {
    for (let entityName in this.docTypeEntities) {
      const entity = this.docTypeEntities[entityName];
      val = val.replace(entity.regx, entity.val);
    }
    for (let entityName in this.lastEntities) {
      const entity = this.lastEntities[entityName];
      val = val.replace(entity.regex, entity.val);
    }
    if (this.options.htmlEntities) {
      for (let entityName in this.htmlEntities) {
        const entity = this.htmlEntities[entityName];
        val = val.replace(entity.regex, entity.val);
      }
    }
    val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) {
    if (isLeafNode === undefined)
      isLeafNode = currentNode.child.length === 0;
    textData = this.parseTextData(textData, currentNode.tagname, jPath, false, currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false, isLeafNode);
    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodes, jPath, currentTagName) {
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if (allNodesExp === stopNodeExp || jPath === stopNodeExp)
      return true;
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i;index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary)
        attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "\t") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result)
    return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true")
      return true;
    else if (newval === "false")
      return false;
    else
      return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
function prettify(node, options) {
  return compress(node, options);
}
function compress(arr, options, jPath) {
  let text;
  const compressedObj = {};
  for (let i = 0;i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if (jPath === undefined)
      newJpath = property;
    else
      newJpath = jPath + "." + property;
    if (property === options.textNodeName) {
      if (text === undefined)
        text = tagObj[property];
      else
        text += "" + tagObj[property];
    } else if (property === undefined) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL2] !== undefined) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], newJpath, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode)
          val[options.textNodeName] = "";
        else
          val = "";
      }
      if (compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        if (options.isArray(property, newJpath, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0)
      compressedObj[options.textNodeName] = text;
  } else if (text !== undefined)
    compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@")
      return key;
  }
}
function assignAttributes(obj, attrMap, jpath, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0;i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  parse(xmlData, validationOption) {
    if (typeof xmlData === "string") {} else if (xmlData.toString) {
      xmlData = xmlData.toString();
    } else {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true)
        validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === undefined)
      return orderedResult;
    else
      return prettify(orderedResult, this.options);
  }
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}

// src/unicode-cleaner.ts
var DEFAULT_OPTIONS = {
  removeZeroWidth: true,
  removeControlChars: true,
  removeFootnoteMarkers: true,
  enableAdvancedCleaning: true
};

class UnicodeCleaner {
  options;
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  cleanText(text) {
    if (!text) {
      return text;
    }
    let cleaned = text;
    if (this.options.removeZeroWidth) {
      cleaned = this.removeZeroWidthCharacters(cleaned);
    }
    if (this.options.removeControlChars) {
      cleaned = this.removeControlCharacters(cleaned);
    }
    return cleaned;
  }
  removeZeroWidthCharacters(text) {
    const problematicChars = [
      "\u200B",
      "\u200C",
      "\u200D",
      "\u200E",
      "\u200F",
      "\u2060",
      "\uFEFF",
      "\xAD",
      "\u061C",
      "\u180E",
      "\u2061",
      "\u2062",
      "\u2063",
      "\u2064"
    ];
    for (const char of problematicChars) {
      text = text.replace(new RegExp(char, "g"), "");
    }
    return text;
  }
  removeControlCharacters(text) {
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  }
  removeFootnoteMarkers(text) {
    const crossRefPatterns = [
      /\b[a-z](?:true|false|noble|just|pure|lovely|whatever|things)\b/gi,
      /\b[a-z](?:the|and|that|with|will|shall|have|was|were|are)\b/gi,
      /\b[a-z](?:you|your|his|her|their|who|which|when|where|what)\b/gi,
      /\b[a-z](?:how|why|all|every|any|some|many|much|into|unto)\b/gi,
      /\b[a-z](?:upon|from|before|after|above|below|through|between)\b/gi,
      /\b[a-z](?:Lord|God|Jesus|Christ|Spirit|Father|Son|Holy)\b/gi,
      /\b[a-z](?:gospel|faith|grace|mercy|love|hope|peace|joy)\b/gi,
      /\b[a-z](?:salvation|righteousness|holiness|blessing|covenant)\b/gi,
      /\b[a-z](?:indeed|wages|cries|hearken|unto|behold|verily)\b/gi,
      /\b\d+(?:Sabaoth|the|and|that|will|shall|Lord|God|unto|into)\b/gi,
      /\b\d+(?:indeed|wages|cries|behold|verily|hearken|blessed)\b/gi,
      /\b[\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9](?:the|and|that|will|shall)\b/gi,
      /\b[\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DB\u05DC\u05DE\u05E0\u05E1\u05E2\u05E4\u05E6\u05E7\u05E8\u05E9\u05EA](?:the|and|that|will|shall)\b/gi,
      /\b[*\u2020\u2021\u00A7\u00B6#](?:the|and|that|will|shall|Lord|God)\b/gi,
      /\b[\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u2071\u02B2\u1D4F\u02E1\u1D50\u207F\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB](?:the|and|that|will|shall)\b/gi
    ];
    for (const pattern of crossRefPatterns) {
      text = text.replace(pattern, (match) => {
        return match.slice(1);
      });
    }
    return text;
  }
  applyAdvancedCleaning(text) {
    let cleaned = text;
    cleaned = cleaned.replace(/[\ufeff\u200b-\u200f\u2060]+(.?)[\ufeff\u200b-\u200f\u2060]+/g, "$1");
    cleaned = cleaned.replace(/\b([a-z])([A-Z][a-z]+)\b/g, "$2");
    cleaned = cleaned.replace(/\b(?![IiAa])[a-z]\b/g, "");
    cleaned = cleaned.replace(/\s{2,}/g, " ");
    cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/\(\s*\)/g, "");
    cleaned = cleaned.replace(/\[\s*\]/g, "");
    cleaned = cleaned.replace(/\{\s*\}/g, "");
    return cleaned;
  }
  cleanXamlText(xamlText) {
    if (!xamlText)
      return xamlText;
    let cleaned = xamlText.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code))).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    cleaned = this.cleanText(cleaned);
    return cleaned;
  }
  cleanExtractedText(texts) {
    return texts.map((text) => this.cleanXamlText(text)).filter((text) => text && text.trim() !== "");
  }
}
function cleanXamlText(xamlText) {
  const cleaner = new UnicodeCleaner;
  return cleaner.cleanXamlText(xamlText);
}

// src/xaml-converter.ts
var DEFAULT_OPTIONS2 = {
  headingSizes: [24, 22, 20, 18, 16, 14],
  monospaceFontName: "Courier New",
  blockQuoteLineThickness: 3,
  horizontalLineThickness: 3,
  ignoreUnknownElements: true
};

class XamlToMarkdownConverter {
  options;
  parser;
  unicodeCleaner;
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS2, ...options };
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      removeNSPrefix: true,
      parseAttributeValue: false,
      trimValues: false,
      processEntities: true,
      arrayMode: true
    });
    this.unicodeCleaner = new UnicodeCleaner;
  }
  isXamlElement(value) {
    return value !== null && typeof value === "object";
  }
  convertToMarkdown(xamlContent) {
    try {
      if (!xamlContent || xamlContent.trim() === "") {
        return "";
      }
      const cleanedXaml = this.cleanXamlContent(xamlContent);
      if (!cleanedXaml.trim()) {
        return "";
      }
      const wrappedXaml = `<Root>${cleanedXaml}</Root>`;
      const parsed = this.parser.parse(wrappedXaml);
      const markdown = this.processElement(parsed);
      return this.normalizeMarkdown(markdown);
    } catch (error) {
      if (this.options.ignoreUnknownElements) {
        return this.extractPlainText(xamlContent);
      }
      throw new Error(`Rich Text (XAML) conversion failed: ${error}`);
    }
  }
  cleanXamlContent(xaml) {
    let cleaned = xaml.replace(/<\?xml[^>]*\?>/gi, "");
    cleaned = cleaned.replace(/xmlns[^=]*="[^"]*"/gi, "");
    cleaned = cleaned.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
    return cleaned.trim();
  }
  processElement(element) {
    if (!element)
      return "";
    if (typeof element === "string") {
      return element;
    }
    let result = "";
    for (const [tagName, content] of Object.entries(element)) {
      if (tagName.startsWith("@_") || tagName === "#text") {
        continue;
      }
      switch (tagName.toLowerCase()) {
        case "section":
          result += this.processSection(content);
          break;
        case "paragraph":
          result += this.processParagraph(content);
          break;
        case "run":
          result += this.processRun(content);
          break;
        case "span":
          result += this.processSpan(content);
          break;
        case "list":
          result += this.processList(content);
          break;
        case "table":
          result += this.processTable(content);
          break;
        case "hyperlink":
          result += this.processHyperlink(content);
          break;
        default:
          if (Array.isArray(content)) {
            for (const item of content) {
              result += this.processElement({ [tagName]: item });
            }
          } else {
            result += this.processElement(content);
          }
          break;
      }
    }
    return result;
  }
  processSection(section) {
    const sections = Array.isArray(section) ? section : [section];
    let result = "";
    for (const sect of sections) {
      if (!sect)
        continue;
      const borderThickness = sect["@_BorderThickness"] || "";
      const fontFamily = sect["@_FontFamily"] || "";
      const content = this.extractElementContent(sect);
      if (this.isHorizontalRule(borderThickness, content)) {
        result += `---

`;
        continue;
      }
      if (this.isBlockQuote(borderThickness)) {
        const quotedLines = content.split(`
`).map((line) => line.trim() ? "> " + line : ">").join(`
`);
        result += quotedLines + `

`;
        continue;
      }
      if (this.isMonospaceFont(fontFamily)) {
        const language = sect["@_Tag"] || "";
        result += "```" + language + `
` + content + "\n```\n\n";
        continue;
      }
      result += content + `

`;
    }
    return result;
  }
  processParagraph(paragraph) {
    const paragraphs = Array.isArray(paragraph) ? paragraph : [paragraph];
    let result = "";
    for (const para of paragraphs) {
      if (!para)
        continue;
      const content = this.extractElementContent(para);
      if (!content.trim()) {
        result += `
`;
        continue;
      }
      const headingLevel = this.getHeadingLevelFromParagraph(para);
      if (headingLevel > 0) {
        result += "#".repeat(headingLevel) + " " + content.trim() + `

`;
      } else {
        result += content.trim() + `

`;
      }
    }
    return result;
  }
  processRun(run) {
    const runs = Array.isArray(run) ? run : [run];
    let result = "";
    for (const r of runs) {
      if (!r)
        continue;
      let text = r["@_Text"] || r["#text"] || "";
      if (!text)
        continue;
      text = this.applyInlineFormatting(text, r);
      result += text;
    }
    return result;
  }
  processSpan(span) {
    const spans = Array.isArray(span) ? span : [span];
    let result = "";
    for (const s of spans) {
      if (!s)
        continue;
      const content = this.extractElementContent(s);
      const formatted = this.applyInlineFormatting(content, s);
      result += formatted;
    }
    return result;
  }
  processList(list) {
    const lists = Array.isArray(list) ? list : [list];
    let result = "";
    for (const l of lists) {
      if (!l)
        continue;
      const markerStyle = l["@_Kind"] || l["@_MarkerStyle"] || "Disc";
      const isOrdered = markerStyle.toLowerCase().includes("decimal");
      result += this.processListItems(l, isOrdered) + `
`;
    }
    return result;
  }
  processListItems(list, isOrdered) {
    let result = "";
    let counter = 1;
    const listItems = this.extractListItems(list);
    for (const item of listItems) {
      const content = this.extractElementContent(item).trim();
      if (content) {
        const marker = isOrdered ? `${counter}. ` : "- ";
        result += marker + content + `
`;
        counter++;
      }
    }
    return result;
  }
  processTable(table) {
    const tables = Array.isArray(table) ? table : [table];
    let result = "";
    for (const t of tables) {
      if (!t)
        continue;
      const rows = this.extractTableRows(t);
      if (rows.length === 0)
        continue;
      if (rows.length > 0) {
        const headerCells = this.extractTableCells(rows[0]);
        const headerRow = "| " + headerCells.join(" | ") + " |";
        const separatorRow = "| " + headerCells.map(() => "---").join(" | ") + " |";
        result += headerRow + `
` + separatorRow + `
`;
        for (let i = 1;i < rows.length; i++) {
          const cells = this.extractTableCells(rows[i]);
          const dataRow = "| " + cells.join(" | ") + " |";
          result += dataRow + `
`;
        }
      }
      result += `
`;
    }
    return result;
  }
  processHyperlink(hyperlink) {
    const hyperlinks = Array.isArray(hyperlink) ? hyperlink : [hyperlink];
    let result = "";
    for (const link of hyperlinks) {
      if (!link)
        continue;
      const text = this.extractElementContent(link);
      const url = link["@_NavigateUri"] || "";
      if (url) {
        result += `[${text}](${url})`;
      } else {
        result += text;
      }
    }
    return result;
  }
  applyInlineFormatting(text, element) {
    if (!text)
      return "";
    let formatted = this.unicodeCleaner.cleanXamlText(text);
    const fontFamily = element["@_FontFamily"] || "";
    if (this.isMonospaceFont(fontFamily)) {
      formatted = "`" + formatted + "`";
      return formatted;
    }
    let needsBold = false;
    let needsItalic = false;
    let needsUnderline = false;
    let needsStrikethrough = false;
    let needsSmallCaps = false;
    let needsSubscript = false;
    let needsSuperscript = false;
    const fontBold = element["@_FontBold"] || "";
    if (fontBold.toLowerCase() === "true") {
      needsBold = true;
    }
    const fontItalic = element["@_FontItalic"] || "";
    if (fontItalic.toLowerCase() === "true") {
      needsItalic = true;
    }
    const hasUnderline = element["@_HasUnderline"] || "";
    if (hasUnderline.toLowerCase() === "true") {
      needsUnderline = true;
    }
    const hasStrikethrough = element["@_HasStrikethrough"] || "";
    if (hasStrikethrough.toLowerCase() === "true") {
      needsStrikethrough = true;
    }
    const fontCapitals = element["@_FontCapitals"] || "";
    if (fontCapitals.toLowerCase() === "smallcaps") {
      needsSmallCaps = true;
    }
    const fontVariant = element["@_FontVariant"] || "";
    if (fontVariant.toLowerCase() === "subscript") {
      needsSubscript = true;
    } else if (fontVariant.toLowerCase() === "superscript") {
      needsSuperscript = true;
    }
    if (needsSubscript) {
      formatted = "<sub>" + formatted + "</sub>";
    } else if (needsSuperscript) {
      formatted = "<sup>" + formatted + "</sup>";
    }
    if (needsSmallCaps) {
      formatted = "<small>" + formatted.toUpperCase() + "</small>";
    }
    if (needsStrikethrough) {
      formatted = "~~" + formatted + "~~";
    }
    if (needsUnderline) {
      formatted = "<u>" + formatted + "</u>";
    }
    if (needsItalic) {
      formatted = "*" + formatted + "*";
    }
    if (needsBold) {
      formatted = "**" + formatted + "**";
    }
    return formatted;
  }
  extractElementContent(element) {
    if (!element)
      return "";
    if (Array.isArray(element)) {
      let content2 = "";
      for (const item of element) {
        content2 += this.extractElementContent(item);
      }
      return content2;
    }
    let content = "";
    if (element["#text"]) {
      content += this.unicodeCleaner.cleanXamlText(element["#text"]);
    }
    if (element["@_Text"]) {
      content += this.unicodeCleaner.cleanXamlText(element["@_Text"]);
    }
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith("@_") || key === "#text")
        continue;
      switch (key.toLowerCase()) {
        case "run":
          content += this.processRun(value);
          break;
        case "span":
          content += this.processSpan(value);
          break;
        case "hyperlink":
          content += this.processHyperlink(value);
          break;
        case "list":
          content += this.processList(value);
          break;
        case "table":
          content += this.processTable(value);
          break;
        default:
          if (typeof value === "object" && value) {
            content += this.extractElementContent(value);
          }
          break;
      }
    }
    return content;
  }
  getHeadingLevel(fontSize) {
    if (fontSize === null)
      return 0;
    const index = this.options.headingSizes.indexOf(fontSize);
    return index >= 0 ? index + 1 : 0;
  }
  getHeadingLevelFromParagraph(paragraph) {
    const runs = this.extractRunsFromParagraph(paragraph);
    if (runs.length === 0)
      return 0;
    const fontSizes = runs.map((run) => {
      const fontSize = run["@_FontSize"] ? parseFloat(run["@_FontSize"]) : null;
      return fontSize;
    }).filter((size) => size !== null);
    if (fontSizes.length === 0)
      return 0;
    const firstFontSize = fontSizes[0];
    const allSameSize = fontSizes.every((size) => size === firstFontSize);
    if (allSameSize && firstFontSize !== undefined) {
      return this.getHeadingLevel(firstFontSize);
    }
    return 0;
  }
  extractRunsFromParagraph(paragraph) {
    const runs = [];
    for (const [key, value] of Object.entries(paragraph)) {
      if (key.toLowerCase() === "run") {
        if (Array.isArray(value)) {
          runs.push(...value.filter((v) => v && typeof v === "object"));
        } else if (value && typeof value === "object") {
          runs.push(value);
        }
      }
    }
    return runs;
  }
  isHorizontalRule(borderThickness, content) {
    if (!borderThickness || content.trim())
      return false;
    const parts = borderThickness.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 4)
      return false;
    return parts[1] === this.options.horizontalLineThickness && parts[0] === 0 && parts[2] === 0 && parts[3] === 0;
  }
  isBlockQuote(borderThickness) {
    if (!borderThickness)
      return false;
    const parts = borderThickness.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length !== 4)
      return false;
    return parts[0] === this.options.blockQuoteLineThickness && parts[1] === 0 && parts[2] === 0 && parts[3] === 0;
  }
  isMonospaceFont(fontFamily) {
    if (!fontFamily)
      return false;
    return fontFamily.toLowerCase().includes(this.options.monospaceFontName.toLowerCase());
  }
  extractListItems(list) {
    const items = [];
    for (const [key, value] of Object.entries(list)) {
      if (key.toLowerCase() === "listitem") {
        if (Array.isArray(value)) {
          items.push(...value);
        } else {
          items.push(value);
        }
      }
    }
    return items;
  }
  extractTableRows(table) {
    const rows = [];
    for (const [key, value] of Object.entries(table)) {
      if (key.toLowerCase() === "tablerowgroup") {
        const rowGroups = Array.isArray(value) ? value : [value];
        for (const rowGroup of rowGroups) {
          if (rowGroup) {
            for (const [rKey, rValue] of Object.entries(rowGroup)) {
              if (rKey.toLowerCase() === "tablerow") {
                if (Array.isArray(rValue)) {
                  rows.push(...rValue);
                } else {
                  rows.push(rValue);
                }
              }
            }
          }
        }
      } else if (key.toLowerCase() === "tablerow") {
        if (Array.isArray(value)) {
          rows.push(...value);
        } else {
          rows.push(value);
        }
      }
    }
    return rows;
  }
  extractTableCells(row) {
    const cells = [];
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase() === "tablecell") {
        const cellArray = Array.isArray(value) ? value : [value];
        for (const cell of cellArray) {
          if (cell && typeof cell === "object") {
            const content = this.extractElementContent(cell).trim();
            cells.push(content || "");
          }
        }
      }
    }
    return cells;
  }
  extractPlainText(xamlContent) {
    const textMatches = xamlContent.match(/Text="([^"]*?)"/g) || [];
    const plainTexts = textMatches.map((match) => this.unicodeCleaner.cleanXamlText(match.replace(/Text="([^"]*?)"/, "$1")));
    const contentMatches = xamlContent.match(/>([^<]+)</g) || [];
    const contents = contentMatches.map((match) => this.unicodeCleaner.cleanXamlText(match.replace(/^>([^<]+)<$/, "$1").trim())).filter((text) => text && !text.startsWith("<?") && !text.startsWith("<!--"));
    return [...plainTexts, ...contents].join(" ").trim();
  }
  normalizeMarkdown(markdown) {
    return markdown.replace(/\n{3,}/g, `

`).replace(/^\s+|\s+$/g, "").replace(/\s+$/gm, "");
  }
}

// src/metadata-processor.ts
var DEFAULT_METADATA_OPTIONS = {
  includeDates: true,
  includeNotebook: true,
  includeStyle: false,
  includeEnhancedMetadata: true,
  includeTags: true,
  includeLogosData: false,
  customExtractors: [],
  dateFormat: "iso"
};

class MetadataProcessor {
  options;
  lookups;
  bibleDecoder = new BibleReferenceDecoder;
  catalogDb;
  constructor(options = {}, lookups, catalogDb) {
    this.options = { ...DEFAULT_METADATA_OPTIONS, ...options };
    this.lookups = lookups;
    this.catalogDb = catalogDb;
  }
  generateMetadata(note) {
    const metadata = {
      title: note.formattedTitle,
      tags: [],
      noteType: this.getNoteType(note.kind),
      references: [],
      noteId: note.id
    };
    if (this.options.includeDates) {
      metadata.created = this.formatDate(note.createdDate);
      if (note.modifiedDate) {
        metadata.modified = this.formatDate(note.modifiedDate);
      }
    }
    if (this.options.includeNotebook && note.notebook) {
      metadata.notebook = note.notebook.title || "Untitled Notebook";
    }
    if (note.references.length > 0) {
      metadata.references = note.references.map((ref) => ref.formatted);
      if (note.references[0]) {
        metadata.logosBibleBook = note.references[0].anchorBookId;
      }
      const bibleVersion = this.extractBibleVersionFromReferences(note.references);
      if (bibleVersion) {
        metadata.bibleVersion = bibleVersion;
      }
    }
    if (note.anchorBibleBook) {
      metadata.logosBibleBook = note.anchorBibleBook;
    }
    if (this.options.includeStyle) {
      if (note.noteStyleId) {
        metadata.style = `style-${note.noteStyleId}`;
      }
      if (note.noteColorId) {
        metadata.color = `color-${note.noteColorId}`;
      }
    }
    if (this.options.includeEnhancedMetadata && this.lookups) {
      if (note.noteStyleId) {
        const style = this.lookups.styles.get(note.noteStyleId);
        metadata.noteStyle = style ? this.cleanStyleName(style.name) : `style-${note.noteStyleId}`;
      }
      if (note.noteColorId) {
        const color = this.lookups.colors.get(note.noteColorId);
        metadata.noteColor = color ? color.name : `color-${note.noteColorId}`;
      }
      if (note.noteIndicatorId) {
        const indicator = this.lookups.indicators.get(note.noteIndicatorId);
        metadata.noteIndicator = indicator ? indicator.name : `indicator-${note.noteIndicatorId}`;
      }
      if (note.anchorDataTypeId) {
        const dataType = this.lookups.dataTypes.get(note.anchorDataTypeId);
        metadata.dataType = dataType ? dataType.name : `datatype-${note.anchorDataTypeId}`;
      }
      if (note.anchorResourceIdId) {
        const resourceId = this.lookups.resourceIds.get(note.anchorResourceIdId);
        metadata.resourceId = resourceId ? resourceId.resourceId : `resource-${note.anchorResourceIdId}`;
        if (metadata.resourceId && this.catalogDb) {
          const title = this.catalogDb.getTitleByResourceId(metadata.resourceId);
          if (title) {
            metadata.resourceTitle = title;
          }
        }
      }
    }
    metadata.anchorLink = this.generateAnchorLink(note, metadata.resourceId);
    if (this.options.includeTags) {
      metadata.tags = this.extractTags(note);
    }
    if (this.options.includeLogosData) {
      metadata.logosExternalId = note.externalId;
      if (note.noteStyleId)
        metadata.logosStyleId = note.noteStyleId;
      if (note.noteColorId)
        metadata.logosColorId = note.noteColorId;
    }
    if (note.references.length > 0 && note.references[0]) {
      const firstRef = note.references[0];
      if (firstRef.anchorBookId && firstRef.bookName && firstRef.chapter) {
        metadata.filename = this.bibleDecoder.generateSimpleFilename(firstRef.bookName, firstRef.chapter, firstRef.verse);
      }
    }
    for (const extractor of this.options.customExtractors) {
      const customData = extractor(note);
      Object.assign(metadata, customData);
    }
    return metadata;
  }
  toYamlFrontmatter(metadata) {
    const yamlLines = ["---"];
    yamlLines.push(`title: ${this.escapeYamlValue(metadata.title)}`);
    if (metadata.created) {
      yamlLines.push(`created: ${metadata.created}`);
    }
    if (metadata.modified) {
      yamlLines.push(`modified: ${metadata.modified}`);
    }
    yamlLines.push(`noteType: ${metadata.noteType}`);
    if (metadata.notebook) {
      yamlLines.push(`notebook: ${this.escapeYamlValue(metadata.notebook)}`);
    }
    if (metadata.references.length > 0) {
      yamlLines.push("references:");
      metadata.references.forEach((ref) => {
        yamlLines.push(`  - ${this.escapeYamlValue(ref)}`);
      });
    }
    if (metadata.tags.length > 0) {
      yamlLines.push("tags:");
      metadata.tags.forEach((tag) => {
        yamlLines.push(`  - ${this.escapeYamlValue(tag)}`);
      });
    }
    if (metadata.logosBibleBook) {
      yamlLines.push(`logosBibleBook: ${metadata.logosBibleBook}`);
    }
    if (metadata.noteStyle) {
      yamlLines.push(`noteStyle: ${this.escapeYamlValue(metadata.noteStyle)}`);
    }
    if (metadata.noteColor) {
      yamlLines.push(`noteColor: ${this.escapeYamlValue(metadata.noteColor)}`);
    }
    if (metadata.noteIndicator) {
      yamlLines.push(`noteIndicator: ${this.escapeYamlValue(metadata.noteIndicator)}`);
    }
    if (metadata.dataType) {
      yamlLines.push(`dataType: ${this.escapeYamlValue(metadata.dataType)}`);
    }
    if (metadata.resourceId) {
      yamlLines.push(`resourceId: ${this.escapeYamlValue(metadata.resourceId)}`);
    }
    if (metadata.resourceTitle) {
      yamlLines.push(`resourceTitle: ${this.escapeYamlValue(metadata.resourceTitle)}`);
    }
    if (metadata.anchorLink) {
      yamlLines.push(`anchorLink: ${this.escapeYamlValue(metadata.anchorLink)}`);
    }
    if (metadata.bibleVersion) {
      yamlLines.push(`bibleVersion: ${this.escapeYamlValue(metadata.bibleVersion)}`);
    }
    if (metadata.filename) {
      yamlLines.push(`filename: ${this.escapeYamlValue(metadata.filename)}`);
    }
    yamlLines.push(`noteId: ${metadata.noteId}`);
    const standardFields = new Set([
      "title",
      "created",
      "modified",
      "noteType",
      "notebook",
      "references",
      "tags",
      "logosBibleBook",
      "noteStyle",
      "noteColor",
      "noteIndicator",
      "dataType",
      "resourceId",
      "resourceTitle",
      "anchorLink",
      "bibleVersion",
      "filename",
      "noteId"
    ]);
    for (const [key, value] of Object.entries(metadata)) {
      if (!standardFields.has(key) && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          yamlLines.push(`${key}:`);
          value.forEach((item) => {
            yamlLines.push(`  - ${this.escapeYamlValue(String(item))}`);
          });
        } else if (typeof value === "object") {
          yamlLines.push(`${key}:`);
          for (const [subKey, subValue] of Object.entries(value)) {
            yamlLines.push(`  ${subKey}: ${this.escapeYamlValue(String(subValue))}`);
          }
        } else {
          yamlLines.push(`${key}: ${this.escapeYamlValue(String(value))}`);
        }
      }
    }
    yamlLines.push("---");
    yamlLines.push("");
    return yamlLines.join("\\n");
  }
  extractTags(note) {
    const tags = new Set;
    tags.add(this.getNoteType(note.kind));
    if (note.notebook?.title) {
      const notebookTag = this.sanitizeTag(note.notebook.title);
      if (notebookTag)
        tags.add(notebookTag);
    }
    if (note.references.length > 0) {
      const uniqueBooks = new Set(note.references.map((ref) => ref.bookName));
      uniqueBooks.forEach((bookName) => {
        const bookTag = this.sanitizeTag(bookName);
        if (bookTag)
          tags.add(bookTag);
      });
    }
    if (note.contentRichText) {
      const contentTags = this.extractTagsFromContent(note.contentRichText);
      contentTags.forEach((tag) => tags.add(tag));
    }
    return Array.from(tags).sort();
  }
  extractTagsFromContent(content) {
    const tags = [];
    const cleanContent = content.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").toLowerCase().trim();
    const theologicalTerms = [
      "prayer",
      "worship",
      "faith",
      "grace",
      "mercy",
      "love",
      "hope",
      "salvation",
      "gospel",
      "cross",
      "resurrection",
      "trinity",
      "discipleship",
      "ministry",
      "mission",
      "evangelism",
      "prophecy",
      "covenant",
      "blessing",
      "forgiveness",
      "righteousness",
      "holiness"
    ];
    theologicalTerms.forEach((term) => {
      if (cleanContent.includes(term)) {
        tags.push(term);
      }
    });
    const hashtagMatches = content.match(/#\\w+/g);
    if (hashtagMatches) {
      hashtagMatches.forEach((match) => {
        const tag = match.substring(1).toLowerCase();
        if (tag.length > 2)
          tags.push(tag);
      });
    }
    return tags;
  }
  getNoteType(kind) {
    switch (kind) {
      case 0:
        return "text";
      case 1:
        return "highlight";
      default:
        return "annotation";
    }
  }
  formatDate(dateString) {
    const date = new Date(dateString);
    if (this.options.dateFormat === "readable") {
      return date.toLocaleString();
    } else {
      return date.toISOString();
    }
  }
  sanitizeTag(input) {
    return input.toLowerCase().replace(/[^a-z0-9\\s-]/g, "").replace(/\\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
  }
  escapeYamlValue(value) {
    if (!value)
      return '""';
    const needsQuoting = /^[\\s]*$|[:\\[\\]{},\"|'>]|^[&*!|>%@`]/.test(value) || /^(true|false|null|yes|no|on|off)$/i.test(value) || /^[0-9]/.test(value);
    if (needsQuoting) {
      const escaped = value.replace(/\\\\/g, "\\\\\\\\").replace(/\"/g, '\\\\"');
      return `"${escaped}"`;
    }
    return value;
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  addCustomExtractor(extractor) {
    this.options.customExtractors.push(extractor);
  }
  cleanStyleName(name) {
    return name.replace(/^(custom:|cu-tom:)/i, "").replace(/^[\\s]+/g, "").replace(/[\\s]+$/g, "").replace(/[\\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
  }
  extractBibleVersionFromReferences(references) {
    for (const ref of references) {
      const versionMatch = ref.reference.match(/^bible\+([^.]+)\./);
      if (versionMatch && versionMatch[1]) {
        return versionMatch[1].toUpperCase();
      }
    }
    return;
  }
  generateAnchorLink(note, resourceId) {
    if (!resourceId)
      return;
    const encodedResourceId = resourceId.replace(":", "%3A");
    if (note.references.length > 0) {
      const firstRef = note.references[0];
      if (firstRef && firstRef.reference) {
        return `https://app.logos.com/books/${encodedResourceId}/references/${firstRef.reference}`;
      }
    }
    if (note.anchorTextRange?.offset !== undefined) {
      return `https://app.logos.com/books/${encodedResourceId}/offsets/${note.anchorTextRange.offset}`;
    }
    return;
  }
}

// src/markdown-converter.ts
var DEFAULT_MARKDOWN_OPTIONS = {
  includeFrontmatter: true,
  includeMetadata: true,
  includeDates: true,
  includeKind: true,
  includeNotebook: true,
  customFields: {},
  dateFormat: "iso",
  includeId: false
};

class MarkdownConverter {
  options;
  xamlConverter;
  metadataProcessor;
  xamlStats;
  verbose;
  xamlFailures;
  constructor(options = {}, database, verbose = false, catalogDb) {
    this.options = { ...DEFAULT_MARKDOWN_OPTIONS, ...options };
    this.verbose = verbose;
    this.xamlConverter = new XamlToMarkdownConverter;
    this.xamlFailures = [];
    this.xamlStats = {
      totalNotes: 0,
      notesWithXaml: 0,
      xamlConversionsSucceeded: 0,
      xamlConversionsFailed: 0,
      plainTextNotes: 0,
      emptyNotes: 0
    };
    if (database) {
      try {
        const lookups = {
          styles: new Map(database.getNoteStyles().map((s) => [s.noteStyleId, s])),
          colors: new Map(database.getNoteColors().map((c) => [c.noteColorId, c])),
          indicators: new Map(database.getNoteIndicators().map((i) => [i.noteIndicatorId, i])),
          dataTypes: new Map(database.getDataTypes().map((d) => [d.dataTypeId, d])),
          resourceIds: new Map(database.getResourceIds().map((r) => [r.resourceIdId, r]))
        };
        const metadataOptions = {
          includeDates: this.options.includeDates,
          includeNotebook: this.options.includeNotebook,
          includeEnhancedMetadata: true,
          includeTags: true,
          dateFormat: this.options.dateFormat === "iso" ? "iso" : "readable"
        };
        this.metadataProcessor = new MetadataProcessor(metadataOptions, lookups, catalogDb);
      } catch (error) {
        console.warn("Failed to initialize enhanced metadata processor:", error);
      }
    }
  }
  containsXamlContent(content) {
    if (!content || !content.trim())
      return false;
    const xamlPatterns = [
      /<Paragraph[^>]*>/i,
      /<Run[^>]*>/i,
      /<Span[^>]*>/i,
      /Text="[^"]*"/i,
      /<Section[^>]*>/i
    ];
    return xamlPatterns.some((pattern) => pattern.test(content));
  }
  getXamlConversionStats() {
    return { ...this.xamlStats };
  }
  getXamlConversionFailures() {
    return [...this.xamlFailures];
  }
  resetXamlStats() {
    this.xamlStats = {
      totalNotes: 0,
      notesWithXaml: 0,
      xamlConversionsSucceeded: 0,
      xamlConversionsFailed: 0,
      plainTextNotes: 0,
      emptyNotes: 0
    };
    this.xamlFailures = [];
  }
  convertNote(note, group, fileInfo) {
    const frontmatter = this.generateFrontmatter(note, group, fileInfo);
    const body = this.generateBody(note, group);
    let content = "";
    if (this.options.includeFrontmatter && Object.keys(frontmatter).length > 0) {
      content += this.serializeFrontmatter(frontmatter);
      content += `
---

`;
    }
    content += body;
    return {
      content,
      frontmatter,
      body,
      wordCount: this.countWords(body),
      characterCount: body.length
    };
  }
  generateFrontmatter(note, group, fileInfo) {
    if (this.metadataProcessor) {
      const metadata = this.metadataProcessor.generateMetadata(note);
      const frontmatter = { ...metadata };
      if (fileInfo.filename) {
        frontmatter.filename = fileInfo.filename;
      }
      Object.assign(frontmatter, this.options.customFields);
      return frontmatter;
    } else {
      return this.generateBasicFrontmatter(note, group, fileInfo);
    }
  }
  generateBasicFrontmatter(note, group, fileInfo) {
    const frontmatter = {};
    frontmatter.title = note.formattedTitle || this.generateTitleFromReferences(note) || "Untitled Note";
    if (this.options.includeDates) {
      frontmatter.created = this.formatDate(note.createdDate);
      if (note.modifiedDate) {
        frontmatter.modified = this.formatDate(note.modifiedDate);
      }
    }
    if (this.options.includeKind) {
      frontmatter.noteType = this.getNoteTypeName(note.kind);
    }
    if (this.options.includeId) {
      frontmatter.noteId = note.id;
    }
    if (this.options.includeNotebook && group.notebook) {
      frontmatter.notebook = group.notebook.title;
    }
    if (note.references.length > 0) {
      frontmatter.references = note.references.map((ref) => ref.formatted);
    }
    const tags = this.extractTags(note);
    if (tags.length > 0) {
      frontmatter.tags = tags;
    }
    if (fileInfo.filename) {
      frontmatter.filename = fileInfo.filename;
    }
    Object.assign(frontmatter, this.options.customFields);
    return frontmatter;
  }
  generateBody(note, group) {
    const sections = [];
    this.xamlStats.totalNotes++;
    if (!this.options.includeFrontmatter) {
      const title = note.formattedTitle || this.generateTitleFromReferences(note) || "Untitled Note";
      sections.push(`# ${title}
`);
    }
    if (this.options.includeMetadata && !this.options.includeFrontmatter) {
      sections.push(this.generateMetadataSection(note, group));
    }
    if (note.references.length > 0 && !this.options.includeFrontmatter) {
      sections.push(this.generateReferencesSection(note));
    }
    if (note.contentRichText && note.contentRichText.trim()) {
      const hasXaml = this.containsXamlContent(note.contentRichText);
      if (hasXaml) {
        this.xamlStats.notesWithXaml++;
        try {
          const convertedContent = this.xamlConverter.convertToMarkdown(note.contentRichText);
          if (convertedContent.trim()) {
            this.xamlStats.xamlConversionsSucceeded++;
            sections.push(convertedContent.trim());
          } else {
            this.xamlStats.xamlConversionsFailed++;
            if (this.verbose) {
              this.xamlFailures.push({
                noteId: note.id,
                noteTitle: note.formattedTitle || "Untitled",
                failureType: "empty_content",
                xamlContentPreview: note.contentRichText.substring(0, 150)
              });
            }
            sections.push("*[This note contains formatting that could not be converted.]*");
          }
        } catch (error) {
          this.xamlStats.xamlConversionsFailed++;
          if (this.verbose) {
            this.xamlFailures.push({
              noteId: note.id,
              noteTitle: note.formattedTitle || "Untitled",
              failureType: "exception",
              errorMessage: error instanceof Error ? error.message : String(error),
              xamlContentPreview: note.contentRichText.substring(0, 150)
            });
          }
          const plainText = this.extractPlainTextFromXaml(note.contentRichText);
          if (plainText.trim()) {
            sections.push(plainText.trim());
          } else {
            sections.push("*[This note contains content that could not be processed.]*");
          }
        }
      } else {
        this.xamlStats.plainTextNotes++;
        sections.push(note.contentRichText.trim());
      }
    } else {
      if (note.kind !== 1) {
        this.xamlStats.emptyNotes++;
        sections.push("*[This note appears to be empty.]*");
      } else {
        this.xamlStats.emptyNotes++;
      }
    }
    if (note.kind === 1) {
      let reference = "";
      if (note.references.length > 0 && note.references[0]) {
        const formattedRef = note.references[0].formatted;
        if (typeof formattedRef === "string" && formattedRef.trim()) {
          reference = formattedRef.trim();
        }
      }
      if (reference) {
        sections.push(`Highlighted passage: ${reference}`);
      } else {
        sections.push("This is a highlighted passage");
      }
    }
    return sections.join(`

`);
  }
  generateMetadataSection(note, group) {
    const lines = [`## Metadata
`];
    lines.push(`**Type:** ${this.getNoteTypeName(note.kind)}  `);
    lines.push(`**Created:** ${this.formatDate(note.createdDate)}  `);
    if (note.modifiedDate) {
      lines.push(`**Modified:** ${this.formatDate(note.modifiedDate)}  `);
    }
    if (group.notebook) {
      lines.push(`**Notebook:** ${group.notebook.title || "Untitled"}  `);
    }
    if (this.options.includeId) {
      lines.push(`**ID:** ${note.id}  `);
    }
    return lines.join(`
`);
  }
  generateReferencesSection(note) {
    const lines = [`## References
`];
    for (const ref of note.references) {
      lines.push(`- ${ref.formatted}`);
    }
    return lines.join(`
`);
  }
  serializeFrontmatter(frontmatter) {
    const lines = ["---"];
    const fieldOrder = [
      "title",
      "created",
      "modified",
      "tags",
      "noteType",
      "references",
      "noteId",
      "notebook",
      "logosBibleBook",
      "bibleVersion",
      "noteStyle",
      "noteColor",
      "noteIndicator",
      "dataType",
      "resourceId",
      "resourceTitle",
      "anchorLink",
      "filename"
    ];
    for (const key of fieldOrder) {
      if (frontmatter[key] !== null && frontmatter[key] !== undefined) {
        lines.push(this.serializeYamlValue(key, frontmatter[key], 0));
      }
    }
    for (const [key, value] of Object.entries(frontmatter)) {
      if (value === null || value === undefined || fieldOrder.includes(key)) {
        continue;
      }
      lines.push(this.serializeYamlValue(key, value, 0));
    }
    return lines.join(`
`);
  }
  serializeYamlValue(key, value, indent = 0) {
    const prefix = "  ".repeat(indent);
    if (value === null || value === undefined) {
      return `${prefix}${key}: null`;
    }
    if (typeof value === "string") {
      if (value.includes(`
`) || value.includes('"') || value.includes("'")) {
        const escapedValue = value.replace(/"/g, "\\\"");
        return `${prefix}${key}: "${escapedValue}"`;
      }
      return `${prefix}${key}: "${value}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return `${prefix}${key}: ${value}`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${prefix}${key}: []`;
      }
      const lines = [`${prefix}${key}:`];
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          lines.push(`${prefix}  -`);
          for (const [subKey, subValue] of Object.entries(item)) {
            lines.push(this.serializeYamlValue(subKey, subValue, indent + 2));
          }
        } else {
          lines.push(`${prefix}  - ${this.formatYamlScalar(item)}`);
        }
      }
      return lines.join(`
`);
    }
    if (typeof value === "object") {
      const lines = [`${prefix}${key}:`];
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(this.serializeYamlValue(subKey, subValue, indent + 1));
      }
      return lines.join(`
`);
    }
    return `${prefix}${key}: ${String(value)}`;
  }
  formatYamlScalar(value) {
    if (typeof value === "string") {
      if (value.includes('"') || value.includes("'") || value.includes(`
`)) {
        return `"${value.replace(/"/g, "\\\"")}"`;
      }
      return `"${value}"`;
    }
    return String(value);
  }
  getNoteTypeName(kind) {
    switch (kind) {
      case 0:
        return "note";
      case 1:
        return "highlight";
      case 2:
        return "annotation";
      default:
        return "unknown";
    }
  }
  formatDate(dateStr) {
    const date = new Date(dateStr);
    switch (this.options.dateFormat) {
      case "locale":
        return date.toLocaleDateString();
      case "short":
        const isoString = date.toISOString();
        return isoString.split("T")[0] || isoString;
      case "iso":
      default:
        return date.toISOString();
    }
  }
  generateTitleFromReferences(note) {
    if (note.references.length === 0)
      return null;
    const firstRef = note.references[0];
    if (firstRef && firstRef.formatted) {
      return String(firstRef.formatted);
    }
    return null;
  }
  extractPlainTextFromXaml(xaml) {
    if (!xaml)
      return "";
    const textMatches = xaml.match(/Text="([^"]*?)"/g) || [];
    const texts = textMatches.map((match) => cleanXamlText(match.replace(/Text="([^"]*?)"/, "$1").trim())).filter((text) => text);
    return texts.join(" ");
  }
  extractTags(note) {
    const tags = [];
    switch (note.kind) {
      case 0:
        tags.push("note");
        break;
      case 1:
        tags.push("highlight");
        break;
      case 2:
        tags.push("annotation");
        break;
      default:
        tags.push("note");
    }
    if (note.references.length > 0) {
      tags.push("scripture");
      const books = [...new Set(note.references.map((ref) => ref.bookName).filter(Boolean))];
      for (const book of books.slice(0, 3)) {
        if (book && typeof book === "string") {
          tags.push(book.toLowerCase().replace(/\s+/g, "-"));
        }
      }
    }
    return tags;
  }
  countWords(text) {
    if (!text || text.trim().length === 0)
      return 0;
    const plainText = text.replace(/[#*_`~]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    if (plainText.length === 0)
      return 0;
    return plainText.split(/\s+/).length;
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
  convertNotebook(group, fileMap) {
    const results = new Map;
    for (const note of group.notes) {
      const fileInfo = fileMap.get(note);
      if (fileInfo) {
        const result = this.convertNote(note, group, fileInfo);
        results.set(note, result);
      }
    }
    return results;
  }
  getConversionStats(results) {
    let totalWords = 0;
    let totalCharacters = 0;
    let notesWithContent = 0;
    for (const result of results.values()) {
      totalWords += result.wordCount;
      totalCharacters += result.characterCount;
      if (result.wordCount > 0) {
        notesWithContent++;
      }
    }
    return {
      totalNotes: results.size,
      totalWords,
      totalCharacters,
      notesWithContent,
      averageWordCount: results.size > 0 ? Math.round(totalWords / results.size) : 0
    };
  }
}

// src/validator.ts
import { existsSync as existsSync2, statSync, readFileSync } from "fs";
import { join as join2 } from "path";

// node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors.YAMLError;
var $YAMLParseError = errors.YAMLParseError;
var $YAMLWarning = errors.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// src/validator.ts
var DEFAULT_VALIDATION_OPTIONS = {
  checkNoteCount: true,
  checkFileStructure: true,
  checkFrontmatter: true,
  checkReferences: true,
  sampleSize: 50
};

class ExportValidator {
  options;
  constructor(options = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  }
  async validateExport(exportDir, originalNotes, notebookGroups) {
    const issues = [];
    const stats = {
      filesChecked: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      issuesBySeverity: { error: 0, warning: 0, info: 0 },
      averageFileSize: 0
    };
    if (!existsSync2(exportDir)) {
      issues.push({
        severity: "error",
        type: "structure",
        message: "Export directory does not exist",
        filePath: exportDir
      });
      return this.buildResult(false, issues, stats);
    }
    if (this.options.checkFileStructure) {
      this.validateFileStructure(exportDir, notebookGroups, issues, stats);
    }
    if (this.options.checkNoteCount) {
      await this.validateNoteCount(exportDir, originalNotes, issues, stats);
    }
    if (this.options.checkFrontmatter || this.options.checkReferences) {
      await this.validateContent(exportDir, originalNotes, issues, stats);
    }
    stats.totalIssues = issues.length;
    stats.filesWithIssues = stats.filesChecked - (stats.filesChecked - issues.filter((i) => i.filePath).length);
    const isValid = stats.issuesBySeverity.error === 0;
    return this.buildResult(isValid, issues, stats);
  }
  validateFileStructure(exportDir, notebookGroups, issues, stats) {
    const mainReadme = join2(exportDir, "README.md");
    if (!existsSync2(mainReadme)) {
      issues.push({
        severity: "warning",
        type: "structure",
        message: "Main README.md not found",
        filePath: mainReadme
      });
    }
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "No Notebook";
      const notebookDir = join2(exportDir, group.sanitizedFolderName);
      if (!existsSync2(notebookDir)) {
        issues.push({
          severity: "error",
          type: "structure",
          message: `Notebook directory missing: ${notebookName}`,
          filePath: notebookDir
        });
        continue;
      }
      const notebookReadme = join2(notebookDir, "README.md");
      if (!existsSync2(notebookReadme)) {
        issues.push({
          severity: "warning",
          type: "structure",
          message: `Notebook README missing: ${notebookName}`,
          filePath: notebookReadme
        });
      }
    }
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.warning = (stats.issuesBySeverity.warning || 0) + issues.filter((i) => i.severity === "warning").length;
  }
  async validateNoteCount(exportDir, originalNotes, issues, stats) {
    const markdownFiles = this.findMarkdownFiles(exportDir);
    const expectedCount = originalNotes.length;
    const actualCount = markdownFiles.filter((f) => !f.endsWith("README.md")).length;
    if (actualCount !== expectedCount) {
      issues.push({
        severity: "error",
        type: "file",
        message: `Note count mismatch: expected ${expectedCount}, found ${actualCount}`,
        details: `Missing ${expectedCount - actualCount} notes`
      });
    } else {
      issues.push({
        severity: "info",
        type: "file",
        message: `All ${expectedCount} notes successfully exported`
      });
    }
    stats.filesChecked = actualCount;
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.info = (stats.issuesBySeverity.info || 0) + issues.filter((i) => i.severity === "info").length;
  }
  async validateContent(exportDir, originalNotes, issues, stats) {
    const markdownFiles = this.findMarkdownFiles(exportDir).filter((f) => !f.endsWith("README.md"));
    const sampleFiles = this.options.sampleSize > 0 ? markdownFiles.slice(0, this.options.sampleSize) : markdownFiles;
    let totalSize = 0;
    for (const filePath of sampleFiles) {
      try {
        const content = readFileSync(filePath, "utf8");
        const fileSize = statSync(filePath).size;
        totalSize += fileSize;
        if (this.options.checkFrontmatter) {
          this.validateFrontmatter(filePath, content, issues);
        }
        if (this.options.checkReferences) {
          this.validateReferences(filePath, content, issues);
        }
      } catch (error) {
        issues.push({
          severity: "error",
          type: "file",
          message: `Failed to read file: ${error}`,
          filePath
        });
      }
    }
    stats.averageFileSize = sampleFiles.length > 0 ? Math.round(totalSize / sampleFiles.length) : 0;
    stats.issuesBySeverity.error = (stats.issuesBySeverity.error || 0) + issues.filter((i) => i.severity === "error").length;
    stats.issuesBySeverity.warning = (stats.issuesBySeverity.warning || 0) + issues.filter((i) => i.severity === "warning").length;
  }
  lintYaml(yamlContent) {
    try {
      const doc = $parseDocument(yamlContent);
      if (doc.errors.length > 0) {
        return {
          valid: false,
          error: doc.errors.map((e) => e.message).join("; ")
        };
      }
      const warnings = doc.warnings.length > 0 ? doc.warnings.map((w) => w.message) : undefined;
      return {
        valid: true,
        data: doc.toJS(),
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown YAML error"
      };
    }
  }
  validateFrontmatter(filePath, content, issues) {
    if (!content.startsWith(`---
`)) {
      issues.push({
        severity: "warning",
        type: "format",
        message: "Missing YAML frontmatter",
        filePath
      });
      return;
    }
    const frontmatterEnd = content.indexOf(`
---
`, 4);
    if (frontmatterEnd === -1) {
      issues.push({
        severity: "warning",
        type: "format",
        message: "Malformed YAML frontmatter (missing end marker)",
        filePath
      });
      return;
    }
    const frontmatter = content.substring(4, frontmatterEnd);
    const yamlResult = this.lintYaml(frontmatter);
    if (!yamlResult.valid) {
      issues.push({
        severity: "warning",
        type: "format",
        message: `Invalid YAML syntax: ${yamlResult.error}`,
        filePath
      });
      return;
    }
    if (yamlResult.warnings && yamlResult.warnings.length > 0) {
      issues.push({
        severity: "warning",
        type: "format",
        message: `YAML warnings: ${yamlResult.warnings.join("; ")}`,
        filePath
      });
    }
    const requiredFields = ["title", "created", "noteType"];
    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        issues.push({
          severity: "warning",
          type: "format",
          message: `Missing required frontmatter field: ${field}`,
          filePath
        });
      }
    }
  }
  validateReferences(filePath, content, issues) {
    if (content.includes("references:")) {
      const referenceMatches = content.match(/- reference: "([^"]+)"/g);
      if (referenceMatches) {
        for (const match of referenceMatches) {
          const reference = match.match(/- reference: "([^"]+)"/)?.[1];
          if (reference && !this.isValidReference(reference)) {
            issues.push({
              severity: "warning",
              type: "content",
              message: `Potentially invalid Bible reference: ${reference}`,
              filePath
            });
          }
        }
      }
    }
  }
  findMarkdownFiles(dir) {
    const files = [];
    try {
      const { readdirSync, statSync: statSync2 } = __require("fs");
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join2(dir, entry);
        const stat = statSync2(fullPath);
        if (stat.isDirectory()) {
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (entry.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (error) {}
    return files;
  }
  isValidReference(reference) {
    const patterns = [
      /^[A-Za-z0-9\s]+ \d+:\d+/,
      /^[A-Za-z0-9\s]+ \d+:\d+-\d+/,
      /^[A-Za-z0-9\s]+ \d+/
    ];
    return patterns.some((pattern) => pattern.test(reference));
  }
  sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  }
  buildResult(isValid, issues, stats) {
    const errorCount = stats.issuesBySeverity.error || 0;
    const warningCount = stats.issuesBySeverity.warning || 0;
    const infoCount = stats.issuesBySeverity.info || 0;
    let summary = `Validation ${isValid ? "PASSED" : "FAILED"}`;
    summary += ` - ${stats.filesChecked} files checked`;
    if (errorCount > 0) {
      summary += `, ${errorCount} errors`;
    }
    if (warningCount > 0) {
      summary += `, ${warningCount} warnings`;
    }
    if (infoCount > 0) {
      summary += `, ${infoCount} info`;
    }
    return {
      isValid,
      issues,
      stats,
      summary
    };
  }
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  getOptions() {
    return { ...this.options };
  }
}

// src/notestool-database.ts
import { Database } from "bun:sqlite";

// src/database-locator.ts
import { existsSync as existsSync3, readdirSync, statSync as statSync2 } from "fs";
import { join as join3, resolve } from "path";
import { homedir } from "os";

class DatabaseLocator {
  static DATABASE_FILENAME = "notestool.db";
  static SUBDIRECTORY = "NotesToolManager";
  static CATALOG_FILENAME = "catalog.db";
  static CATALOG_SUBDIRECTORY = "LibraryCatalog";
  static findDatabases() {
    const locations = [];
    const devPath = join3("LogosDocuments", this.SUBDIRECTORY, this.DATABASE_FILENAME);
    locations.push(this.createLocation(devPath, "development", "Development location (current working directory)"));
    const platform = process.platform;
    if (platform === "win32") {
      locations.push(...this.findWindowsLocations());
    } else if (platform === "darwin") {
      locations.push(...this.findMacOSLocations());
    }
    return locations.sort((a, b) => {
      if (a.exists && !b.exists)
        return -1;
      if (!a.exists && b.exists)
        return 1;
      if (a.exists && b.exists) {
        return (b.size || 0) - (a.size || 0);
      }
      return 0;
    });
  }
  static getBestDatabase() {
    const locations = this.findDatabases();
    return locations.find((loc) => loc.exists) || null;
  }
  static checkCustomPath(customPath) {
    if (!customPath)
      return null;
    let fullPath = customPath;
    if (existsSync3(customPath) && statSync2(customPath).isDirectory()) {
      fullPath = join3(customPath, this.DATABASE_FILENAME);
    }
    return this.createLocation(fullPath, "custom", `Custom path: ${customPath}`);
  }
  static findWindowsLocations() {
    const locations = [];
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData)
      return locations;
    const logosPath = join3(localAppData, "Logos", "Documents");
    return this.searchRandomIdDirectories(logosPath, "windows", "Windows Logos installation");
  }
  static findMacOSLocations() {
    const locations = [];
    const logosPath = join3(homedir(), "Library", "Application Support", "Logos4", "Documents");
    return this.searchRandomIdDirectories(logosPath, "macos", "macOS Logos installation");
  }
  static searchRandomIdDirectories(basePath, type, description) {
    const locations = [];
    if (!existsSync3(basePath))
      return locations;
    try {
      const entries = readdirSync(basePath);
      for (const entry of entries) {
        const entryPath = join3(basePath, entry);
        if (statSync2(entryPath).isDirectory()) {
          const dbPath = join3(entryPath, this.SUBDIRECTORY, this.DATABASE_FILENAME);
          if (existsSync3(dbPath)) {
            locations.push(this.createLocation(dbPath, type, `${description} (${entry})`));
          }
        }
      }
    } catch (error) {}
    return locations;
  }
  static createLocation(path, type, description) {
    const fullPath = resolve(path);
    const exists = existsSync3(fullPath);
    let size;
    let lastModified;
    if (exists) {
      try {
        const stats = statSync2(fullPath);
        size = stats.size;
        lastModified = stats.mtime;
      } catch (error) {}
    }
    return {
      path: fullPath,
      type,
      description,
      exists,
      size,
      lastModified
    };
  }
  static validateDatabase(path) {
    if (!existsSync3(path)) {
      return { valid: false, error: "Database file does not exist" };
    }
    try {
      const stats = statSync2(path);
      if (stats.size === 0) {
        return { valid: false, error: "Database file is empty" };
      }
      if (stats.size < 1024) {
        return { valid: false, error: "Database file is too small (likely corrupted)" };
      }
      const fs = __require("fs");
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(path, "r");
      try {
        fs.readSync(fd, buffer, 0, 16, 0);
        const signature = buffer.toString("ascii", 0, 15);
        if (!signature.startsWith("SQLite format 3")) {
          return { valid: false, error: "File does not appear to be a valid SQLite database" };
        }
      } finally {
        fs.closeSync(fd);
      }
      return {
        valid: true,
        info: `Valid SQLite database (${(stats.size / 1024 / 1024).toFixed(1)} MB, modified ${stats.mtime.toISOString()})`
      };
    } catch (error) {
      return { valid: false, error: `Failed to validate database: ${error}` };
    }
  }
  static displayLocations() {
    const locations = this.findDatabases();
    const lines = [];
    lines.push(`\uD83D\uDD0D Searching for Logos NotesTool databases...
`);
    if (locations.length === 0) {
      lines.push("\u274C No database locations found");
      return lines;
    }
    for (const [index, location] of locations.entries()) {
      const status = location.exists ? "\u2705" : "\u274C";
      const sizeInfo = location.size ? ` (${(location.size / 1024 / 1024).toFixed(1)} MB)` : "";
      const dateInfo = location.lastModified ? ` - ${location.lastModified.toLocaleDateString()}` : "";
      lines.push(`${status} [${index + 1}] ${location.description}`);
      lines.push(`    ${location.path}${sizeInfo}${dateInfo}`);
      if (location.exists && index === 0) {
        lines.push("    \uD83D\uDC46 This database will be used by default");
      }
      lines.push("");
    }
    return lines;
  }
  static getSearchInstructions() {
    const platform = process.platform;
    const lines = [];
    lines.push(`\uD83D\uDCCB Manual Database Location Instructions:
`);
    if (platform === "win32") {
      lines.push("Windows:");
      lines.push("1. Open File Explorer");
      lines.push("2. Navigate to: %LOCALAPPDATA%\\Logos\\Documents");
      lines.push('3. Look for a directory with a random ID (e.g., "abc123def456...")');
      lines.push("4. Inside that directory, look for: NotesToolManager\\notestool.db");
      lines.push("");
      lines.push("Example path:");
      lines.push("C:\\Users\\YourName\\AppData\\Local\\Logos\\Documents\\{random-id}\\NotesToolManager\\notestool.db");
    } else if (platform === "darwin") {
      lines.push("macOS:");
      lines.push("1. Open Finder");
      lines.push("2. Press Cmd+Shift+G (Go to Folder)");
      lines.push("3. Navigate to: ~/Library/Application Support/Logos4/Documents");
      lines.push("4. Look for a directory with a random ID");
      lines.push("5. Inside that directory, look for: NotesToolManager/notestool.db");
      lines.push("");
      lines.push("Example path:");
      lines.push("/Users/YourName/Library/Application Support/Logos4/Documents/{random-id}/NotesToolManager/notestool.db");
    } else {
      lines.push("Linux/Other:");
      lines.push("Database location varies by Logos installation method.");
      lines.push("Check your Logos installation documentation.");
    }
    lines.push("");
    lines.push("\uD83D\uDCA1 Tip: Use the --database flag to specify a custom path:");
    lines.push('   bun run export --database "/path/to/your/notestool.db"');
    return lines;
  }
  static getCatalogLocation(notestoolPath) {
    try {
      let catalogPath = notestoolPath;
      catalogPath = catalogPath.replace("/Documents/", "/Data/");
      catalogPath = catalogPath.replace("/NotesToolManager/", "/LibraryCatalog/");
      catalogPath = catalogPath.replace("/notestool.db", "/catalog.db");
      catalogPath = catalogPath.replace("\\Documents\\", "\\Data\\");
      catalogPath = catalogPath.replace("\\NotesToolManager\\", "\\LibraryCatalog\\");
      catalogPath = catalogPath.replace("\\notestool.db", "\\catalog.db");
      const exists = existsSync3(catalogPath);
      let size;
      let lastModified;
      if (exists) {
        try {
          const stats = statSync2(catalogPath);
          size = stats.size;
          lastModified = stats.mtime;
        } catch (error) {}
      }
      return {
        path: catalogPath,
        exists,
        size,
        lastModified
      };
    } catch (error) {
      return null;
    }
  }
}

// src/notestool-database.ts
class NotesToolDatabase {
  db;
  dbLocation;
  constructor(dbPath) {
    this.dbLocation = this.findDatabase(dbPath);
    const validation = DatabaseLocator.validateDatabase(this.dbLocation.path);
    if (!validation.valid) {
      throw new Error(`Invalid database: ${validation.error}`);
    }
    this.db = new Database(this.dbLocation.path, { readonly: true });
  }
  findDatabase(customPath) {
    if (customPath) {
      const customLocation = DatabaseLocator.checkCustomPath(customPath);
      if (!customLocation) {
        throw new Error(`Invalid custom database path: ${customPath}`);
      }
      if (!customLocation.exists) {
        throw new Error(`Database file not found at custom path: ${customPath}`);
      }
      return customLocation;
    }
    const bestLocation = DatabaseLocator.getBestDatabase();
    if (!bestLocation) {
      const locations = DatabaseLocator.displayLocations();
      const instructions = DatabaseLocator.getSearchInstructions();
      throw new Error(`No Logos NotesTool database found in standard locations.

` + locations.join(`
`) + `

` + instructions.join(`
`));
    }
    return bestLocation;
  }
  getDatabaseInfo() {
    return { ...this.dbLocation };
  }
  static displayAvailableLocations() {
    return DatabaseLocator.displayLocations();
  }
  static getSearchInstructions() {
    return DatabaseLocator.getSearchInstructions();
  }
  getActiveNotes() {
    const query = `
      SELECT 
        NoteId as id,
        ExternalId as externalId,
        CreatedDate as createdDate,
        ModifiedDate as modifiedDate,
        Kind as kind,
        ContentRichText as contentRichText,
        AnchorBibleBook as anchorBibleBook,
        NotebookExternalId as notebookExternalId,
        NoteStyleId as noteStyleId,
        NoteColorId as noteColorId,
        NoteIndicatorId as noteIndicatorId,
        AnchorDataTypeId as anchorDataTypeId,
        AnchorResourceIdId as anchorResourceIdId,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notes
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY CreatedDate, NoteId
    `;
    return this.db.query(query).all();
  }
  getBibleReferences(noteIds) {
    let query = `
      SELECT 
        NoteId as noteId,
        Reference as reference,
        BibleBook as bibleBook,
        AnchorIndex as anchorIndex,
        DataTypeId as dataTypeId
      FROM NoteAnchorFacetReferences
    `;
    if (noteIds && noteIds.length > 0) {
      const placeholders = noteIds.map(() => "?").join(",");
      query += ` WHERE NoteId IN (${placeholders})`;
      return this.db.query(query).all(...noteIds);
    }
    query += ` ORDER BY NoteId, AnchorIndex`;
    return this.db.query(query).all();
  }
  getActiveNotebooks() {
    const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE IsDeleted = 0 AND IsTrashed = 0
      ORDER BY Title
    `;
    return this.db.query(query).all();
  }
  getNotebook(externalId) {
    const query = `
      SELECT 
        NotebookId as notebookId,
        ExternalId as externalId,
        Title as title,
        CreatedDate as createdDate,
        IsDeleted as isDeleted,
        IsTrashed as isTrashed
      FROM Notebooks
      WHERE ExternalId = ? AND IsDeleted = 0 AND IsTrashed = 0
    `;
    return this.db.query(query).get(externalId);
  }
  getNoteStyles() {
    const query = `
      SELECT 
        NoteStyleId as noteStyleId,
        Name as name
      FROM NoteStyles
      ORDER BY NoteStyleId
    `;
    return this.db.query(query).all();
  }
  getNoteColors() {
    const query = `
      SELECT 
        NoteColorId as noteColorId,
        Name as name
      FROM NoteColors
      ORDER BY NoteColorId
    `;
    return this.db.query(query).all();
  }
  getDataTypes() {
    const query = `
      SELECT 
        DataTypeId as dataTypeId,
        Name as name
      FROM DataTypes
      ORDER BY DataTypeId
    `;
    return this.db.query(query).all();
  }
  getNoteIndicators() {
    const query = `
      SELECT 
        NoteIndicatorId as noteIndicatorId,
        Name as name
      FROM NoteIndicators
      ORDER BY NoteIndicatorId
    `;
    return this.db.query(query).all();
  }
  getResourceIds() {
    const query = `
      SELECT 
        ResourceIdId as resourceIdId,
        ResourceId as resourceId
      FROM ResourceIds
      ORDER BY ResourceIdId
    `;
    return this.db.query(query).all();
  }
  getNoteAnchorTextRanges(noteIds) {
    let query = `
      SELECT 
        NoteId as noteId,
        AnchorIndex as anchorIndex,
        ResourceIdId as resourceIdId,
        ResourceVersionId as resourceVersionId,
        Offset as offset,
        PastEnd as pastEnd,
        WordNumberCount as wordNumberCount
      FROM NoteAnchorTextRanges
    `;
    if (noteIds && noteIds.length > 0) {
      const placeholders = noteIds.map(() => "?").join(",");
      query += ` WHERE NoteId IN (${placeholders})`;
      return this.db.query(query).all(...noteIds);
    }
    query += ` ORDER BY NoteId, AnchorIndex`;
    return this.db.query(query).all();
  }
  getNotesWithReferences() {
    const notes = this.getActiveNotes();
    const noteIds = notes.map((n) => n.id);
    const references = this.getBibleReferences(noteIds);
    const notebooks = this.getActiveNotebooks();
    const styles = this.getNoteStyles();
    const colors = this.getNoteColors();
    const indicators = this.getNoteIndicators();
    const dataTypes = this.getDataTypes();
    const resourceIds = this.getResourceIds();
    const notebookMap = new Map(notebooks.map((nb) => [nb.externalId, nb]));
    const styleMap = new Map(styles.map((s) => [s.noteStyleId, s]));
    const colorMap = new Map(colors.map((c) => [c.noteColorId, c]));
    const indicatorMap = new Map(indicators.map((i) => [i.noteIndicatorId, i]));
    const dataTypeMap = new Map(dataTypes.map((dt) => [dt.dataTypeId, dt]));
    const resourceIdMap = new Map(resourceIds.map((r) => [r.resourceIdId, r]));
    const referencesMap = new Map;
    for (const ref of references) {
      if (!referencesMap.has(ref.noteId)) {
        referencesMap.set(ref.noteId, []);
      }
      referencesMap.get(ref.noteId).push(ref);
    }
    return notes.map((note) => ({
      ...note,
      references: referencesMap.get(note.id) || [],
      notebook: notebookMap.get(note.notebookExternalId),
      style: note.noteStyleId ? styleMap.get(note.noteStyleId) : undefined,
      color: note.noteColorId ? colorMap.get(note.noteColorId) : undefined,
      indicator: note.noteIndicatorId ? indicatorMap.get(note.noteIndicatorId) : undefined,
      dataType: note.anchorDataTypeId ? dataTypeMap.get(note.anchorDataTypeId) : undefined,
      resourceId: note.anchorResourceIdId ? resourceIdMap.get(note.anchorResourceIdId) : undefined
    }));
  }
  getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as totalNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotes,
        SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) as deletedNotes,
        SUM(CASE WHEN IsTrashed = 1 THEN 1 ELSE 0 END) as trashedNotes,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 AND ContentRichText IS NOT NULL AND ContentRichText != '' THEN 1 ELSE 0 END) as notesWithContent
      FROM Notes
    `;
    const refStatsQuery = `
      SELECT COUNT(DISTINCT NoteId) as notesWithReferences
      FROM NoteAnchorFacetReferences
    `;
    const notebookStatsQuery = `
      SELECT 
        COUNT(*) as totalNotebooks,
        SUM(CASE WHEN IsDeleted = 0 AND IsTrashed = 0 THEN 1 ELSE 0 END) as activeNotebooks
      FROM Notebooks
    `;
    const noteStats = this.db.query(statsQuery).get();
    const refStats = this.db.query(refStatsQuery).get();
    const notebookStats = this.db.query(notebookStatsQuery).get();
    return {
      ...noteStats,
      ...refStats,
      ...notebookStats
    };
  }
  close() {
    this.db.close();
  }
}

// src/catalog-database.ts
import { Database as Database2 } from "bun:sqlite";
class CatalogDatabase {
  db;
  catalogLocation;
  constructor(notestoolDbPath) {
    const catalogLocation = this.findCatalogDatabase(notestoolDbPath);
    if (!catalogLocation || !catalogLocation.exists) {
      throw new Error(`Catalog database not found. Expected at: ${catalogLocation?.path || "unknown"}`);
    }
    this.catalogLocation = catalogLocation;
    this.db = new Database2(this.catalogLocation.path, { readonly: true });
  }
  findCatalogDatabase(notestoolDbPath) {
    return DatabaseLocator.getCatalogLocation(notestoolDbPath);
  }
  getCatalogInfo() {
    return { ...this.catalogLocation };
  }
  getTitleByResourceId(resourceId) {
    const query = `
      SELECT Title as title
      FROM Records
      WHERE ResourceId = ?
      LIMIT 1
    `;
    const result = this.db.query(query).get(resourceId);
    return result?.title || null;
  }
  getTitlesByResourceIds(resourceIds) {
    if (resourceIds.length === 0) {
      return new Map;
    }
    const placeholders = resourceIds.map(() => "?").join(",");
    const query = `
      SELECT ResourceId as resourceId, Title as title
      FROM Records
      WHERE ResourceId IN (${placeholders})
    `;
    const results = this.db.query(query).all(...resourceIds);
    const titleMap = new Map;
    for (const record of results) {
      titleMap.set(record.resourceId, record.title);
    }
    return titleMap;
  }
  getAllRecords() {
    const query = `
      SELECT ResourceId as resourceId, Title as title
      FROM Records
      ORDER BY ResourceId
    `;
    return this.db.query(query).all();
  }
  close() {
    this.db.close();
  }
}

// src/cli.ts
function getPackageVersion() {
  try {
    const packagePath = join4(process.cwd(), "package.json");
    const packageContent = readFileSync2(packagePath, "utf8");
    const packageJson = JSON.parse(packageContent);
    return packageJson.version || "unknown";
  } catch (error) {
    return "unknown";
  }
}
var HELP_TEXT = `
Logos Notes Exporter - Convert Logos notes to Markdown

USAGE:
  LogosNotesExporter [OPTIONS]

OPTIONS:
  --database, -d        Path to NotesTool database file (auto-detected if not specified)
  --list-databases      List all available database locations and exit
  --show-instructions   Show manual database location instructions and exit
  --output, -o          Output directory (default: ./Logos-Exported-Notes)
  
  ORGANIZATION:
  --no-organize-notebooks  Disable organizing notes by notebooks (default: organize by notebooks)
  --date-folders           Create date-based subdirectories
  --skip-highlights        Skip highlight notes, export only text and annotation notes
  --no-index-files         Do not create README.md index files (default: create them)
  
  MARKDOWN:
  --no-frontmatter      Exclude YAML frontmatter (default: include)
  --show-metadata       Include metadata in markdown content (default: only shown in frontmatter)
  --no-dates            Exclude creation/modification dates (default: include)
  --no-notebook-info    Exclude notebook information (default: include)
  --include-id          Include note IDs
  --date-format         Date format: iso, locale, short (default: iso)
  
  PROCESSING:
  --verbose, -v         Verbose output
  --dry-run            Show what would be done without writing files
  --help, -h           Show this help
  --version            Show version

EXAMPLES:
  # Basic export (auto-finds database)
  LogosNotesExporter
  
  # List available database locations
  LogosNotesExporter --list-databases
  
  # Export with custom database
  LogosNotesExporter --database ./path/to/notestool.db
  
  # Custom output with date folders
  LogosNotesExporter -o ./my-notes --date-folders
  
  # Dry run to see what would be exported
  LogosNotesExporter --dry-run --verbose
  
  # Export without frontmatter and show metadata in content
  LogosNotesExporter --no-frontmatter --show-metadata

NOTES:
  - Database is auto-detected in standard Logos installation locations
  - Windows: %LOCALAPPDATA%\\Logos4\\Documents\\{random-id}\\NotesToolManager\\notestool.db
  - macOS: ~/Library/Application Support/Logos4/Documents/{random-id}/NotesToolManager/notestool.db
  - Use --list-databases to see all available locations
  - All database operations are READ-ONLY for safety
  - Output files will be organized by notebooks unless --no-organize-notebooks
  - Existing files will be overwritten
  - Bible references are always included when available
`;

class LogosNotesExporter {
  database;
  catalogDb;
  organizer;
  fileOrganizer;
  markdownConverter;
  validator;
  options;
  constructor(options) {
    this.options = options;
    this.database = new NotesToolDatabase(options.database);
    try {
      this.catalogDb = new CatalogDatabase(this.database.getDatabaseInfo().path);
      if (options.verbose) {
        const catalogInfo = this.catalogDb.getCatalogInfo();
        console.log(`\uD83D\uDCD6 Using catalog database: ${catalogInfo.path}`);
        if (catalogInfo.size) {
          console.log(`   Size: ${(catalogInfo.size / 1024 / 1024).toFixed(1)} MB`);
        }
      }
    } catch (error) {
      if (options.verbose) {
        console.warn("\u26A0\uFE0F  Catalog database not found or accessible. Resource titles will not be included.");
        console.warn("   Error:", error);
      }
    }
    this.organizer = new NotebookOrganizer(this.database, { skipHighlights: options.skipHighlights || false });
    if (options.verbose) {
      const dbInfo = this.database.getDatabaseInfo();
      console.log(`\uD83D\uDCC1 Using database: ${dbInfo.description}`);
      console.log(`   Path: ${dbInfo.path}`);
      if (dbInfo.size) {
        console.log(`   Size: ${(dbInfo.size / 1024 / 1024).toFixed(1)} MB`);
      }
      console.log("");
    }
    const fileOptions = {
      baseDir: options.output || "./Logos-Exported-Notes",
      organizeByNotebooks: options.organizeByNotebooks !== false,
      includeDateFolders: options.includeDateFolders || false,
      createIndexFiles: options.createIndexFiles !== false
    };
    const resourceIds = this.database.getResourceIds();
    this.fileOrganizer = new FileOrganizer(fileOptions, resourceIds);
    const markdownOptions = {
      includeFrontmatter: options.includeFrontmatter !== false,
      includeMetadata: options.includeMetadata || false,
      includeDates: options.includeDates !== false,
      includeNotebook: options.includeNotebook !== false,
      includeId: options.includeId || false,
      dateFormat: options.dateFormat || "iso"
    };
    this.markdownConverter = new MarkdownConverter(markdownOptions, this.database, options.verbose || false, this.catalogDb);
    this.validator = new ExportValidator;
  }
  async export() {
    try {
      this.log(`Starting Logos Notes export...
`);
      this.log("\uD83D\uDCDA Organizing notes by notebooks...");
      const notebookGroups = await this.organizer.organizeNotes();
      this.log(`Found ${notebookGroups.length} notebook groups`);
      const stats = this.organizer.getOrganizationStats();
      this.logStats(stats);
      this.log(`
\uD83D\uDCC1 Planning file structure...`);
      const structure = await this.fileOrganizer.planDirectoryStructure(notebookGroups);
      const summary = this.fileOrganizer.getFileOperationSummary(notebookGroups);
      this.logFileSummary(summary);
      if (this.options.dryRun) {
        this.log(`
\uD83D\uDD0D DRY RUN - No files will be written`);
        this.logDryRunSummary(notebookGroups);
        return;
      }
      this.log(`
\uD83D\uDCDD Converting notes to markdown...`);
      let totalProcessed = 0;
      for (const group of notebookGroups) {
        const notebookName = group.notebook?.title || "No Notebook";
        this.log(`Processing: ${notebookName} (${group.notes.length} notes)`);
        const fileMap = this.fileOrganizer.resolveFilenameConflicts(group.notes, group);
        const markdownResults = this.markdownConverter.convertNotebook(group, fileMap);
        for (const [note, result] of markdownResults) {
          const fileInfo = fileMap.get(note);
          if (fileInfo) {
            await this.fileOrganizer.writeFile(fileInfo, result.content);
            totalProcessed++;
            if (this.options.verbose) {
              this.log(`  \u2713 ${fileInfo.filename}`);
            }
          }
        }
        if (this.fileOrganizer.getOptions().createIndexFiles) {
          const indexContent = this.fileOrganizer.generateNotebookIndex(group);
          const indexPath = join4(this.fileOrganizer.getNotebookDirectory(group), "README.md");
          await this.fileOrganizer.ensureDirectory(this.fileOrganizer.getNotebookDirectory(group));
          await this.fileOrganizer.writeFile({
            fullPath: indexPath,
            directory: this.fileOrganizer.getNotebookDirectory(group),
            filename: "README",
            relativePath: indexPath.replace(this.fileOrganizer.getOptions().baseDir + "/", ""),
            exists: false
          }, indexContent);
        }
      }
      if (this.fileOrganizer.getOptions().createIndexFiles) {
        this.log(`
\uD83D\uDCCB Creating main index...`);
        const mainIndexContent = this.fileOrganizer.generateMainIndex(notebookGroups, stats);
        const mainIndexPath = join4(this.fileOrganizer.getOptions().baseDir, "README.md");
        await this.fileOrganizer.writeFile({
          fullPath: mainIndexPath,
          directory: this.fileOrganizer.getOptions().baseDir,
          filename: "README",
          relativePath: "README.md",
          exists: false
        }, mainIndexContent);
      }
      this.log(`
\uD83D\uDCCA Rich Text (XAML) Conversion Statistics:`);
      const xamlStats = this.markdownConverter.getXamlConversionStats();
      this.displayXamlStats(xamlStats);
      if (this.options.verbose && xamlStats.xamlConversionsFailed > 0) {
        this.displayXamlFailures();
      }
      if (!this.options.dryRun) {
        this.log(`
\uD83D\uDD0D Validating export...`);
        const allNotes = notebookGroups.flatMap((group) => group.notes);
        const validationResult = await this.validator.validateExport(this.fileOrganizer.getOptions().baseDir, allNotes, notebookGroups);
        this.displayValidationResults(validationResult);
        if (!validationResult.isValid) {
          this.log(`
\u26A0\uFE0F  Export completed with validation issues. See details above.`);
        }
      }
      this.log(`
\u2705 Export completed successfully!`);
      this.log(`\uD83D\uDCC1 Output directory: ${this.fileOrganizer.getOptions().baseDir}`);
      this.log(`\uD83D\uDCC4 Total files created: ${totalProcessed}`);
      this.log(`\uD83D\uDCDA Notebooks processed: ${notebookGroups.length}`);
    } catch (error) {
      console.error(`
\u274C Export failed:`, error);
      process.exit(1);
    } finally {
      this.organizer.close();
      if (this.catalogDb) {
        this.catalogDb.close();
      }
    }
  }
  log(message) {
    console.log(message);
  }
  logStats(stats) {
    this.log(`
\uD83D\uDCCA Statistics:`);
    this.log(`  Total Notes: ${stats.totalNotes}`);
    this.log(`  Notes with Content: ${stats.notesWithContent}`);
    this.log(`  Notes with References: ${stats.notesWithReferences}`);
    this.log(`  Notebooks: ${stats.notebooks}`);
    this.log(`  Notes with No Notebook: ${stats.orphanedNotes}`);
  }
  logFileSummary(summary) {
    this.log(`  Directories to create: ${summary.totalDirectories}`);
    this.log(`  Notes to export: ${summary.totalFiles}`);
    this.log(`  Index files to create: ${summary.totalIndexFiles}`);
    this.log(`  Estimated size: ${summary.estimatedSize}`);
  }
  logDryRunSummary(notebookGroups) {
    for (const group of notebookGroups) {
      const notebookName = group.notebook?.title || "No Notebook";
      this.log(`
\uD83D\uDCDA ${notebookName}:`);
      this.log(`  \uD83D\uDCC4 ${group.notes.length} notes would be exported`);
      if (this.options.verbose) {
        for (const note of group.notes.slice(0, 5)) {
          this.log(`    - ${note.formattedTitle || "Untitled"}`);
        }
        if (group.notes.length > 5) {
          this.log(`    ... and ${group.notes.length - 5} more`);
        }
      }
    }
  }
  displayXamlStats(stats) {
    this.log(`  Total notes processed: ${stats.totalNotes}`);
    this.log(`  Notes with Rich Text content: ${stats.notesWithXaml}`);
    this.log(`  Conversions succeeded: ${stats.xamlConversionsSucceeded}`);
    this.log(`  Conversion issues: ${stats.xamlConversionsFailed}`);
    this.log(`  Plain text notes: ${stats.plainTextNotes}`);
    this.log(`  Empty notes: ${stats.emptyNotes}`);
    if (stats.notesWithXaml > 0) {
      if (stats.xamlConversionsFailed > 0) {
        const failureRate = (stats.xamlConversionsFailed / stats.notesWithXaml * 100).toFixed(1);
        this.log(`
\u26A0\uFE0F  Rich Text (XAML) Conversion Issues:
   ${stats.xamlConversionsFailed} out of ${stats.notesWithXaml} conversions had issues`);
      } else {
        this.log(`
\u2705 Rich Text (XAML) Conversion: All ${stats.notesWithXaml} Rich Text (XAML) converted successfully`);
      }
    }
  }
  displayXamlFailures() {
    const failures = this.markdownConverter.getXamlConversionFailures();
    if (failures.length === 0) {
      return;
    }
    this.log(`
\uD83D\uDD0D Detailed Rich Text (XAML) Conversion Issues:`);
    for (const failure of failures) {
      this.log(`
\u274C Note ID ${failure.noteId}: ${failure.noteTitle}`);
      if (failure.failureType === "empty_content") {
        this.log(`   Issue: Rich Text (XAML) conversion succeeded but produced empty content`);
      } else {
        this.log(`   Issue: Exception during Rich Text (XAML) conversion`);
        if (failure.errorMessage) {
          this.log(`   Error: ${failure.errorMessage}`);
        }
      }
      this.log(`   XAML preview: ${failure.xamlContentPreview}${failure.xamlContentPreview.length >= 150 ? "..." : ""}`);
    }
  }
  displayValidationResults(result) {
    this.log(`
\uD83D\uDCCB ${result.summary}`);
    if (result.issues.length > 0) {
      const errors2 = result.issues.filter((i) => i.severity === "error");
      const warnings = result.issues.filter((i) => i.severity === "warning");
      const info = result.issues.filter((i) => i.severity === "info");
      if (errors2.length > 0) {
        this.log(`
\u274C Errors found:`);
        for (const error of errors2.slice(0, 5)) {
          this.log(`  \u2022 ${error.message}`);
          if (error.filePath && this.options.verbose) {
            this.log(`    File: ${error.filePath}`);
          }
        }
        if (errors2.length > 5) {
          this.log(`  ... and ${errors2.length - 5} more errors`);
        }
      }
      if (warnings.length > 0 && this.options.verbose) {
        this.log(`
\u26A0\uFE0F  Warnings found:`);
        for (const warning of warnings.slice(0, 3)) {
          this.log(`  \u2022 ${warning.message}`);
        }
        if (warnings.length > 3) {
          this.log(`  ... and ${warnings.length - 3} more warnings`);
        }
      }
      if (info.length > 0 && this.options.verbose) {
        this.log(`
\uD83D\uDCA1 Info:`);
        for (const infoItem of info.slice(0, 3)) {
          this.log(`  \u2022 ${infoItem.message}`);
        }
        if (info.length > 3) {
          this.log(`  ... and ${info.length - 3} more info items`);
        }
      }
    }
  }
  getFileOrganizerOptions() {
    return this.fileOrganizer.getOptions();
  }
}
function parseCommandLine() {
  const args = process.argv.slice(2);
  const parsed = parseArgs({
    args,
    options: {
      database: { type: "string", short: "d" },
      "list-databases": { type: "boolean" },
      "show-instructions": { type: "boolean" },
      output: { type: "string", short: "o" },
      "no-organize-notebooks": { type: "boolean" },
      "date-folders": { type: "boolean" },
      "no-index-files": { type: "boolean" },
      "no-frontmatter": { type: "boolean" },
      "show-metadata": { type: "boolean" },
      "no-dates": { type: "boolean" },
      "no-notebook-info": { type: "boolean" },
      "include-id": { type: "boolean" },
      "date-format": { type: "string" },
      "skip-highlights": { type: "boolean" },
      verbose: { type: "boolean", short: "v" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean" }
    },
    allowPositionals: false
  });
  const options = {
    database: parsed.values.database,
    listDatabases: parsed.values["list-databases"],
    showInstructions: parsed.values["show-instructions"],
    output: parsed.values.output,
    organizeByNotebooks: !parsed.values["no-organize-notebooks"],
    includeDateFolders: parsed.values["date-folders"],
    createIndexFiles: !parsed.values["no-index-files"],
    includeFrontmatter: !parsed.values["no-frontmatter"],
    includeMetadata: parsed.values["show-metadata"],
    includeDates: !parsed.values["no-dates"],
    includeNotebook: !parsed.values["no-notebook-info"],
    includeId: parsed.values["include-id"],
    dateFormat: parsed.values["date-format"],
    skipHighlights: parsed.values["skip-highlights"],
    verbose: parsed.values.verbose,
    dryRun: parsed.values["dry-run"],
    help: parsed.values.help,
    version: parsed.values.version
  };
  return options;
}
function validateOptions(options) {
  if (options.database && !existsSync4(options.database)) {
    console.error(`\u274C Database file not found: ${options.database}`);
    process.exit(1);
  }
  if (options.dateFormat && !["iso", "locale", "short"].includes(options.dateFormat)) {
    console.error(`\u274C Invalid date format: ${options.dateFormat}. Must be one of: iso, locale, short`);
    process.exit(1);
  }
}
async function main() {
  const options = parseCommandLine();
  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  if (options.version) {
    const version = getPackageVersion();
    console.log(`Logos Notes Exporter v${version}`);
    process.exit(0);
  }
  if (options.listDatabases) {
    const locations = NotesToolDatabase.displayAvailableLocations();
    console.log(locations.join(`
`));
    process.exit(0);
  }
  if (options.showInstructions) {
    const instructions = NotesToolDatabase.getSearchInstructions();
    console.log(instructions.join(`
`));
    process.exit(0);
  }
  validateOptions(options);
  const exporter = new LogosNotesExporter(options);
  await exporter.export();
}
if (import.meta.main) {
  main().catch((error) => {
    console.error("\u274C Fatal error:", error);
    process.exit(1);
  });
}
export {
  validateOptions,
  parseCommandLine,
  main,
  LogosNotesExporter
};
