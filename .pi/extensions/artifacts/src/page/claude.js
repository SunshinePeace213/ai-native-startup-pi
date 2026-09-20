// The page runtime, served as /_rt/claude.js: the one script the platform
// adds to a published document, ahead of every page script, so window.claude
// exists when the first of them runs. It mirrors what Claude Code gives a
// page — claude.use(name) for capabilities, claude.hot for state carried
// across a republish, the stamped theme, mermaid. The capabilities are Claude
// Code's, verb for verb and code for code, so a page written against its type
// definitions runs here unchanged: `permissions` on every page, and
// `downloads`, `comments`, `artifact`, `db` and `assets` when the artifact
// declares them. A name this host cannot serve resolves null, as Claude Code
// tells a page to expect. One capability is this platform's own, `reply`: the
// data island, the questions/v1 form, and the [data-question] /
// [data-option] / [data-text] / [data-artifact-send] bindings that send the
// user's answers back to the agent.
//
// The page is framed by the viewer shell and lives on an origin of its own,
// so this script holds no secret and makes no request: everything it needs
// done — a reply, a save, a publish, a diagnostic, a reload — it asks of the
// shell over postMessage, and the shell decides. It never states its own user
// gesture; the shell reads that from its own window. It draws nothing but the
// questions form the island asks for: the Send bar, the comments, the save
// prompt and the "page changed" notice are the shell's. A classic script with
// no dependencies; the tag removes itself, so the document keeps no trace of it.

(function () {
  "use strict";

  var tag = document.currentScript;
  if (tag && tag.parentNode) tag.parentNode.removeChild(tag);

  var root = document.documentElement;
  var shell = window.parent;
  var framed = shell !== window;
  var PORT = location.port ? ":" + location.port : "";
  var SHELLS = ["http://localhost" + PORT, "http://127.0.0.1" + PORT];
  /** How long a page waits for a shell before its capabilities resolve to null. */
  var SHELL_WAIT_MS = 10000;
  var BUSY_MS = 1000;

  // ---- theme: stamped before first paint ------------------------------------
  // An explicit choice rides in the address; "system" stamps nothing, and an
  // attribute the author wrote is left alone until the viewer chooses.
  var asked = new URLSearchParams(location.search).get("theme");
  if (asked === "light" || asked === "dark") root.setAttribute("data-theme", asked);

  function whenParsed(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // ---- the bridge -----------------------------------------------------------
  var shellOrigin = null;
  var outbox = [];
  var calls = {};
  var callCount = 0;

  /** `transfer` hands buffers over instead of copying them: a save can be large. */
  function post(message, transfer) {
    message.af = 1;
    if (shellOrigin) shell.postMessage(message, shellOrigin, transfer || []);
    else outbox.push([message, transfer]);
  }

  /** The shell is one of two origins; the browser may already say which. */
  function hello() {
    var known = location.ancestorOrigins && location.ancestorOrigins[0];
    (SHELLS.indexOf(known) >= 0 ? [known] : SHELLS).forEach(function (origin) {
      shell.postMessage({ af: 1, type: "hello" }, origin);
    });
  }

  function call(cap, method, args, transfer) {
    return new Promise(function (resolve, reject) {
      var id = "c" + ++callCount;
      calls[id] = { resolve: resolve, reject: reject };
      try {
        post({ type: "call", id: id, cap: cap, method: method, args: args || [] }, transfer);
      } catch (e) {
        // An argument that cannot cross to the shell — a function, a DOM node — never left the page.
        delete calls[id];
        reject(refusal("transform_error", "the call's arguments could not be sent: " + e.message));
      }
    });
  }

  var settle;
  var ready = new Promise(function (resolve) {
    settle = resolve;
  });
  /** What hot.ready hands the page: the last document's snapshot, or {} on a fresh load. */
  var carried = {};
  var reply = null;
  /** What the shell pushes to a capability, by its name: a capability that listens puts its handler here. */
  var pushes = {};

  function onInit(message, origin) {
    if (shellOrigin) return;
    shellOrigin = origin;
    var caps = message.caps && typeof message.caps === "object" ? message.caps : {};
    var carry = message.carry && typeof message.carry === "object" ? message.carry : null;
    if (carry && carry.hot && typeof carry.hot === "object") {
      carried = carry.hot;
      Object.assign(hot.data, carried);
    }
    var init = { slug: message.slug, version: message.version, caps: caps };
    if (caps.reply) {
      reply = createReply(init, message.island);
      pushes.reply = reply.pushed;
    }
    outbox.splice(0).forEach(function (queued) {
      post(queued[0], queued[1]);
    });
    settle(init);
    report("log", "loaded v" + message.version);
    whenParsed(function () {
      if (reply) reply.boot();
      // After the page's own ready callbacks, so the controls they build exist.
      if (carry) setTimeout(restore, 0, carry);
    });
  }

  window.addEventListener("message", function (event) {
    var message = event.data;
    if (event.source !== shell || SHELLS.indexOf(event.origin) < 0) return;
    if (!message || message.af !== 1 || (shellOrigin && event.origin !== shellOrigin)) return;
    if (message.type === "init") onInit(message, event.origin);
    else if (message.type === "theme") setTheme(message.value);
    else if (message.type === "snapshot") onSnapshot(message);
    else if (message.type === "result") onResult(message);
    else if (message.type === "reply.collect" && reply)
      post({ type: "reply.island", id: message.id, data: reply.island() });
    else if (message.type === "event" && owns(pushes, message.cap))
      pushes[message.cap](message.name, message.data);
  });

  function onResult(message) {
    var pending = calls[message.id];
    if (!pending) return;
    delete calls[message.id];
    if (message.ok) return pending.resolve(message.value);
    var failure = message.error || {};
    var error = new Error(failure.message || "the viewer refused the call");
    error.code = failure.code;
    Object.assign(error, failure.detail || {});
    pending.reject(error);
  }

  // ---- claude.use -----------------------------------------------------------
  // A name resolves its namespace when the shell said this page is served it,
  // and null for everything else — not declared, not run by this host, or not a
  // capability at all. The cases are indistinguishable on purpose: a page is
  // told to design for absence.
  var namespaces = {};
  var builders = {
    permissions: createPermissions,
    downloads: createDownloads,
    comments: createComments,
    artifact: createArtifact,
    db: createDb,
    assets: createAssets,
  };
  function owns(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }
  function use(name) {
    var key = String(name);
    if (!owns(namespaces, key))
      namespaces[key] = ready.then(function (init) {
        if (!init || !owns(init.caps, key)) return null;
        if (key === "reply") return reply ? reply.namespace : null;
        return owns(builders, key) ? builders[key]() : null;
      });
    return namespaces[key];
  }

  // ---- the capabilities Claude Code defines -----------------------------------
  // Each namespace is frozen and carries Claude Code's verbs and rejection
  // codes. A verb checks what only the page can know — is this an Element of
  // this document? — and asks the shell for the rest; what this host does not
  // do rejects with the code the contract gives a page for exactly that.
  function refusal(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }
  /** Runs a verb so that whatever it throws is a rejection: none throws synchronously. */
  function attempt(verb) {
    return new Promise(function (resolve) {
      resolve(verb());
    });
  }
  function rejects(code, message) {
    return function () {
      return Promise.reject(refusal(code, message));
    };
  }

  /** The single viewer owns the page: what it is served is granted, and nothing ever prompts. */
  function createPermissions() {
    return Object.freeze({
      state: function (name) {
        return call("permissions", "state", name === undefined ? [] : [String(name)]);
      },
      request: function (names) {
        return attempt(function () {
          return call("permissions", "request", names == null ? [] : [Array.from(names, String)]);
        });
      },
    });
  }

  /** A save is only offered here: the shell asks the viewer and, on a yes, saves from its own document. */
  function createDownloads() {
    return Object.freeze({
      save: function (request) {
        return attempt(function () {
          var wanted = request || {};
          if (typeof wanted.filename !== "string")
            throw refusal("bad_request", "filename must be a string");
          // This host never asks a page for an export, so no token can name one.
          if (wanted.request !== undefined)
            throw refusal(
              typeof wanted.request === "string" ? "request_unknown" : "bad_request",
              "no export request is open on this host",
            );
          var data = wanted.data;
          var transfer = [];
          if (data instanceof ArrayBuffer) transfer = [data];
          else if (ArrayBuffer.isView(data)) {
            // A view is copied: only the bytes it shows leave the page, and its buffer stays the page's.
            data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice().buffer;
            transfer = [data];
          } else if (typeof data !== "string" && !(data instanceof Blob))
            throw refusal(
              "bad_request",
              "data must be a string, a Blob, an ArrayBuffer or a view of one",
            );
          var size = typeof data === "string" ? data.length : data.size || data.byteLength;
          if (!size) throw refusal("bad_request", "data is empty or detached");
          return call("downloads", "save", [{ filename: wanted.filename, data: data }], transfer);
        });
      },
    });
  }

  var ABOUT_MAX = 200;

  /** One line saying what a comment is about, short enough for the composer's About field. */
  function about(text) {
    var flat = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    return flat.length > ABOUT_MAX ? flat.slice(0, ABOUT_MAX - 1) + "…" : flat;
  }

  /** The element a composer target names and the words it holds; null when it is no target of this document. */
  function composerTarget(target) {
    if (!target || typeof target !== "object") return null;
    if ("element" in target === "range" in target) return null;
    if ("element" in target) {
      var element = target.element;
      return element instanceof Element && element.isConnected
        ? { element: element, text: element.textContent }
        : null;
    }
    var range = target.range;
    if (!(range instanceof Range) || !range.commonAncestorContainer.isConnected) return null;
    var holder = range.commonAncestorContainer;
    if (holder.nodeType !== 1) holder = holder.parentElement || document.documentElement;
    // A selection with nothing in it degrades to the element around it, as Claude Code's does.
    var selected = range.toString();
    return { element: holder, text: selected.trim() ? selected : holder.textContent };
  }

  function cssPath(element) {
    var parts = [];
    for (var node = element; node && node !== document.documentElement; node = node.parentElement) {
      if (node.id) {
        parts.unshift("#" + CSS.escape(node.id));
        break;
      }
      var nth = 1;
      for (var s = node.previousElementSibling; s; s = s.previousElementSibling)
        if (s.tagName === node.tagName) nth += 1;
      parts.unshift(node.tagName.toLowerCase() + ":nth-of-type(" + nth + ")");
    }
    return parts.join(" > ");
  }

  /**
   * Claude Code's composer-only grant, the one form this host serves: the page
   * opens the viewer's own composer and writes nothing itself, so a comment is
   * always the user's — typed and sent in the shell's 💬 panel.
   */
  function createComments() {
    var notGranted = rejects(
      "not_granted",
      "comments are composer-only here: the viewer writes them in the viewer's own panel",
    );
    return Object.freeze({
      openComposer: function (target) {
        return attempt(function () {
          var found = composerTarget(target);
          if (!found)
            throw refusal(
              "invalid",
              "openComposer takes {element} or {range}, attached to this document",
            );
          if (found.element.closest("[data-uncommentable]")) return { opened: false };
          return call("comments", "openComposer", [{ about: about(found.text) }]);
        });
      },
      anchorFor: function (element) {
        return attempt(function () {
          if (!(element instanceof Element) || !element.isConnected)
            throw refusal("invalid", "anchorFor takes an element attached to this document");
          var box = element.getBoundingClientRect();
          return {
            path: cssPath(element),
            x: box.left + box.width / 2 + window.scrollX,
            y: box.top + box.height / 2 + window.scrollY,
          };
        });
      },
      create: notGranted,
      reply: notGranted,
      sendToClaude: notGranted,
      resolve: notGranted,
      delete: notGranted,
      customAnchors: notGranted,
      canSendToClaude: function () {
        return Promise.resolve("off");
      },
    });
  }

  /** A Blob's own type without its parameters; undefined when it names none, so the path's extension decides. */
  function bareType(type) {
    var bare = String(type || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    return bare || undefined;
  }

  /** One entry of a files publish as the shell takes it; null when it is none of Claude Code's shapes. */
  function publishEntry(value) {
    if (value === null) return { delete: true };
    if (typeof value === "string") return { content: value };
    if (value instanceof Blob) return { content: value, contentType: bareType(value.type) };
    if (!value || typeof value !== "object") return null;
    var pin = value.ifMatch;
    if (pin !== undefined && pin !== null && typeof pin !== "string") return null;
    if (value.delete === true) return { delete: true, ifMatch: pin };
    var content = value.content;
    var stated = value.contentType;
    if (typeof content !== "string" && !(content instanceof Blob)) return null;
    if (stated !== undefined && typeof stated !== "string") return null;
    return {
      content: content,
      contentType: stated !== undefined ? stated : bareType(content.type),
      ifMatch: pin,
    };
  }

  /** The page writes to itself by publishing a version; a live doc's edit journal is not something this host keeps. */
  function createArtifact() {
    var liveDocsOnly = rejects(
      "capability_disabled",
      "edit and sync belong to live docs, which this host does not make; publish a version",
    );
    return Object.freeze({
      publish: function (page) {
        return attempt(function () {
          if (typeof page === "string") return call("artifact", "publish", [{ html: page }]);
          if (!page || typeof page !== "object" || Array.isArray(page) || page instanceof Blob)
            throw refusal(
              "invalid_content",
              "publish takes the whole page as a string, or an object of path → content",
            );
          var files = {};
          Object.keys(page).forEach(function (path) {
            var entry = publishEntry(page[path]);
            if (!entry)
              throw refusal(
                "invalid_content",
                JSON.stringify(path) + " is not text, a Blob, {content}, {delete: true} or null",
              );
            files[path] = entry;
          });
          return call("artifact", "publish", [{ files: files }]);
        });
      },
      edit: liveDocsOnly,
      sync: liveDocsOnly,
    });
  }

  // ---- assets: files people add, kept with the artifact -------------------------
  /** What the server answered, without the envelope it answers in. */
  function answered(keys) {
    return function (answer) {
      var out = {};
      keys.forEach(function (key) {
        out[key] = answer[key];
      });
      return out;
    };
  }

  /**
   * The bytes go to the shell as the Blob they are and come back as an id: the
   * durable pointer a page keeps in a document, served at "/_blob/" + id from
   * every version. The type is the one the page states, else the Blob's own.
   */
  function createAssets() {
    return Object.freeze({
      upload: function (blob, options) {
        return attempt(function () {
          if (!(blob instanceof Blob))
            throw refusal("invalid_request", "upload takes a Blob or a File");
          if (!blob.size) throw refusal("invalid_request", "the blob is empty");
          var stated = options == null ? undefined : options.type;
          if ((options != null && typeof options !== "object") || typeof stated === "number")
            throw refusal("invalid_request", "options is {type}, a media type as a string");
          var type = stated === undefined ? blob.type : stated;
          return call("assets", "upload", [{ blob: blob, type: type }]).then(
            answered(["id", "url", "sizeBytes", "contentType"]),
          );
        });
      },
      list: function () {
        return call("assets", "list", [{}]).then(answered(["assets", "usage"]));
      },
      delete: function (ref) {
        return call("assets", "delete", [{ ref: ref }]).then(answered(["deleted"]));
      },
    });
  }

  // ---- db: documents every view and the agent share ---------------------------
  var DB_SEGMENT = /^[A-Za-z0-9_\-.~:@+]+$/;
  var DB_LISTENERS = 64;
  var DB_RETRY_MS = 30000;
  var ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  /** One local server answers every read, so a snapshot is never from a cache and never ahead of a write. */
  var SNAPSHOT_META = Object.freeze({ fromCache: false, hasPendingWrites: false });

  /** A ref is built without asking anyone, so a path that breaks the grammar is thrown where it is written. */
  function dbPath(path, kind) {
    if (typeof path !== "string" || !path)
      throw new TypeError("a " + kind + " path is a non-empty string");
    var segments = path.split("/");
    var even = segments.length % 2 === 0;
    if (kind === "document" ? !even : even)
      throw new TypeError(
        JSON.stringify(path) +
          " has " +
          segments.length +
          " segments; a " +
          kind +
          " path has an " +
          (kind === "document" ? "even" : "odd") +
          " number",
      );
    if (path.length > 1000 || segments.length > 16)
      throw new TypeError("a path is at most 1000 bytes and 16 segments");
    segments.forEach(function (segment) {
      var reserved = /^__.*__$/.test(segment) || segment === "." || segment === "..";
      if (!DB_SEGMENT.test(segment) || segment.length > 200 || reserved)
        throw new TypeError(
          JSON.stringify(segment) +
            " is not a path segment: letters, digits and _ - . ~ : @ + only, at most 200 bytes, never . or .. or a __reserved__ name",
        );
    });
    return path;
  }

  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) {
        deepFreeze(value[key]);
      });
      Object.freeze(value);
    }
    return value;
  }

  /** A body as plain JSON, which is all a document holds: what JSON drops is dropped here, before it is sent. */
  function plainBody(data) {
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw refusal("invalid_argument", "a document is a plain object, not an array or a scalar");
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      throw refusal("transform_error", "the document is not plain JSON: " + e.message);
    }
  }

  function createDb() {
    var listeners = [];

    /** A path as the server files it: `data/users/me` is the one viewer's own subtree. */
    function canonical(path) {
      return path.replace(/^data\/users\/me(?=\/|$)/, "data/users/owner");
    }
    function mark(doc) {
      return doc.exists ? doc.version + "@" + doc.updatedAt : "";
    }
    function snapshotOf(doc) {
      var body = doc.exists ? deepFreeze(doc.data) : undefined;
      return Object.freeze({
        id: doc.id,
        exists: !!doc.exists,
        data: function () {
          return body;
        },
        metadata: SNAPSHOT_META,
      });
    }
    function querySnapshot(rows, changes) {
      var docs = Object.freeze(
        rows.map(function (row) {
          return row.snap;
        }),
      );
      var list = Object.freeze(changes);
      return Object.freeze({
        docs: docs,
        size: docs.length,
        empty: !docs.length,
        docChanges: function () {
          return list;
        },
        metadata: SNAPSHOT_META,
      });
    }

    /**
     * What turned one ordered result into the next, as Firestore tells it: each
     * change's indexes hold once the changes before it have been applied.
     */
    function changesBetween(before, after) {
      var changes = [];
      var kept = Object.create(null);
      after.forEach(function (row) {
        kept[row.id] = true;
      });
      function change(type, snap, oldIndex, newIndex) {
        changes.push(
          Object.freeze({ type: type, doc: snap, oldIndex: oldIndex, newIndex: newIndex }),
        );
      }
      var working = before.slice();
      for (var i = 0; i < working.length;) {
        if (kept[working[i].id]) i += 1;
        else change("removed", working.splice(i, 1)[0].snap, i, -1);
      }
      after.forEach(function (row, at) {
        var from = -1;
        for (var k = 0; k < working.length && from < 0; k += 1)
          if (working[k].id === row.id) from = k;
        if (from < 0) {
          working.splice(at, 0, row);
          return change("added", row.snap, -1, at);
        }
        var moved = from !== at || working[from].mark !== row.mark;
        working.splice(from, 1);
        working.splice(at, 0, row);
        if (moved) change("modified", row.snap, from, at);
      });
      return changes;
    }

    function tell(listener, snapshot) {
      try {
        listener.next(snapshot);
      } catch (e) {
        console.error(e);
      }
    }
    function deliverDoc(listener, answer) {
      var now = mark(answer.doc);
      if (listener.last && listener.last.mark === now) return;
      listener.last = { mark: now };
      tell(listener, snapshotOf(answer.doc));
    }
    /** A document that did not change is the same snapshot object in the next delivery. */
    function deliverQuery(listener, answer) {
      var before = listener.last ? listener.last.rows : [];
      var known = Object.create(null);
      before.forEach(function (row) {
        known[row.id] = row;
      });
      var rows = answer.docs.map(function (doc) {
        var now = mark(doc);
        var old = known[doc.id];
        return old && old.mark === now ? old : { id: doc.id, mark: now, snap: snapshotOf(doc) };
      });
      var changes = changesBetween(before, rows);
      if (listener.last && !changes.length) return;
      listener.last = { rows: rows };
      tell(listener, querySnapshot(rows, changes));
    }

    function drop(listener) {
      listener.dead = true;
      var at = listeners.indexOf(listener);
      if (at >= 0) listeners.splice(at, 1);
    }
    /** A listener's one terminal error: to its callback, or reported as any uncaught error is. */
    function fail(listener, error) {
      if (listener.dead) return;
      drop(listener);
      if (typeof listener.error === "function") {
        try {
          listener.error(error);
        } catch (e) {
          console.error(e);
        }
      } else if (typeof window.reportError === "function") window.reportError(error);
      else console.error(error);
    }

    /** Reads what a listener watches and delivers it when it differs; one read at a time per listener. */
    function refresh(listener) {
      if (listener.dead) return Promise.resolve();
      if (listener.reading) {
        listener.again = true;
        return listener.reading;
      }
      listener.reading = listener
        .read()
        .then(
          function (answer) {
            if (!listener.dead) listener.deliver(listener, answer);
          },
          function (error) {
            // The server not answering is not the listener's end: it reads again on the next
            // push, or after Claude Code's own fallback interval when no push comes.
            if (error.code !== "unavailable") fail(listener, error);
            else setTimeout(refresh, DB_RETRY_MS, listener);
          },
        )
        .then(function () {
          listener.reading = null;
          if (!listener.again) return;
          listener.again = false;
          return refresh(listener);
        });
      return listener.reading;
    }

    function listen(target, read, deliver, next, error) {
      if (typeof next !== "function") throw new TypeError("onSnapshot takes a function");
      var listener = { target: target, read: read, deliver: deliver, next: next, error: error };
      if (listeners.length >= DB_LISTENERS) {
        setTimeout(
          fail,
          0,
          listener,
          refusal("resource_exhausted", "a view holds at most " + DB_LISTENERS + " subscriptions"),
        );
        return function () {};
      }
      listeners.push(listener);
      refresh(listener);
      return function () {
        drop(listener);
      };
    }

    /** Listeners on a document, or on the collection it is in, read again; with no paths, all of them do. */
    function moved(paths) {
      var due = listeners.filter(function (listener) {
        return (
          !paths ||
          paths.some(function (path) {
            return (
              listener.target === path || listener.target === path.slice(0, path.lastIndexOf("/"))
            );
          })
        );
      });
      return Promise.all(due.map(refresh));
    }
    pushes.db = function (name, data) {
      if (name === "change") moved(data && Array.isArray(data.paths) ? data.paths : null);
    };

    /** A write resolves once this view's own listeners have seen it, so a page never renders behind its own write. */
    function write(verb, path, fields) {
      return call("db", verb, [Object.assign({ path: path }, fields)]).then(function () {
        return moved([canonical(path)]).then(function () {});
      });
    }

    function docRef(path) {
      return Object.freeze({
        id: path.slice(path.lastIndexOf("/") + 1),
        path: path,
        get: function () {
          return call("db", "get", [{ path: path }]).then(function (answer) {
            return snapshotOf(answer.doc);
          });
        },
        set: function (data) {
          return attempt(function () {
            return write("set", path, { data: plainBody(data) });
          });
        },
        update: function (data) {
          return attempt(function () {
            return write("update", path, { data: plainBody(data) });
          });
        },
        delete: function () {
          return write("delete", path, {});
        },
        acquire: function (options) {
          return attempt(function () {
            var wanted = options || {};
            var asked = { path: path, holder: wanted.holder, ttlMs: wanted.ttlMs };
            if (wanted.data !== undefined) asked.data = plainBody(wanted.data);
            return call("db", "acquire", [asked]).then(function (answer) {
              var lease = { acquired: answer.acquired === true };
              ["version", "expiresAt", "holder"].forEach(function (key) {
                if (answer[key] !== undefined) lease[key] = answer[key];
              });
              return moved(lease.acquired ? [canonical(path)] : []).then(function () {
                return lease;
              });
            });
          });
        },
        onSnapshot: function (next, error) {
          return listen(
            canonical(path),
            function () {
              return call("db", "get", [{ path: path }]);
            },
            deliverDoc,
            next,
            error,
          );
        },
        collection: function (name) {
          return collectionRef(dbPath(path + "/" + name, "collection"));
        },
      });
    }

    /** A query is a value: each builder answers a new one, and only get and onSnapshot reach the server. */
    function queryOf(collection, spec) {
      function extended(more) {
        return Object.freeze(queryOf(collection, Object.assign({}, spec, more)));
      }
      function read() {
        return call("db", "query", [
          {
            path: collection,
            query: { where: spec.where, orderBy: spec.orderBy, limit: spec.limit },
          },
        ]);
      }
      return {
        where: function (field, op, value) {
          return extended({ where: spec.where.concat([[field, op, value]]) });
        },
        orderBy: function (field, direction) {
          // One order only: a second is kept so the server names the rule, never silently dropped.
          var order = { field: field, direction: direction === undefined ? "asc" : direction };
          return extended({ orderBy: spec.orderBy ? [spec.orderBy, order] : order });
        },
        limit: function (n) {
          return extended({ limit: n });
        },
        get: function () {
          return read().then(function (answer) {
            var rows = answer.docs.map(function (doc) {
              return { id: doc.id, mark: mark(doc), snap: snapshotOf(doc) };
            });
            return querySnapshot(rows, changesBetween([], rows));
          });
        },
        onSnapshot: function (next, error) {
          return listen(canonical(collection), read, deliverQuery, next, error);
        },
      };
    }

    function collectionRef(path) {
      var ref = queryOf(path, { where: [] });
      ref.path = path;
      ref.doc = function (id) {
        if (id !== undefined) return docRef(dbPath(path + "/" + id, "document"));
        var bytes = window.crypto.getRandomValues(new Uint8Array(20));
        return docRef(
          path +
            "/" +
            [].map
              .call(bytes, function (byte) {
                return ID_ALPHABET[byte % ID_ALPHABET.length];
              })
              .join(""),
        );
      };
      ref.add = function (data) {
        var made = ref.doc();
        return made.set(data).then(function () {
          return made;
        });
      };
      return Object.freeze(ref);
    }

    return Object.freeze({
      doc: function (path) {
        return docRef(dbPath(path, "document"));
      },
      collection: function (path) {
        return collectionRef(dbPath(path, "collection"));
      },
    });
  }

  // ---- claude.hot -----------------------------------------------------------
  var leaving = new AbortController();
  var registered = { snapshot: null, accept: null };
  var hot = Object.freeze({
    data: {},
    from: null,
    gen: 0,
    signal: leaving.signal,
    snapshot: function (fn) {
      registered.snapshot = typeof fn === "function" ? fn : null;
    },
    ready: function (fn) {
      if (typeof fn !== "function") return;
      ready.then(function () {
        try {
          fn(carried);
        } catch (e) {
          console.error(e);
        }
      });
    },
    // Claude Code can hand a new version to a running document; here a new
    // version is always a new document, so the callback is kept and never called.
    accept: function (fn) {
      registered.accept = fn;
    },
    restart: function (options) {
      if (!framed) return location.reload();
      call("hot", "restart", [options]).catch(function () {});
    },
  });

  var claude = {};
  Object.defineProperty(claude, "use", { value: use });
  Object.defineProperty(claude, "hot", { value: hot });
  window.claude = claude;

  // ---- state carried across a republish -------------------------------------
  var lastTypedAt = 0;
  ["keydown", "input"].forEach(function (name) {
    document.addEventListener(
      name,
      function () {
        lastTypedAt = Date.now();
      },
      true,
    );
  });

  function cloneable(value) {
    try {
      return structuredClone(value);
    } catch {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return {};
      }
    }
  }

  function snapshotState() {
    if (!registered.snapshot) return {};
    try {
      var state = registered.snapshot();
      return state && typeof state === "object" ? cloneable(state) : {};
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  /** Controls with a stable id; never a file or a password. */
  function formValues() {
    var values = {};
    document.querySelectorAll("input[id],textarea[id],select[id]").forEach(function (el) {
      var type = (el.getAttribute("type") || "").toLowerCase();
      if (type === "file" || type === "password") return;
      if (type === "checkbox" || type === "radio") values[el.id] = el.checked;
      else if (el.tagName === "SELECT" && el.multiple)
        values[el.id] = [].map.call(el.selectedOptions, function (o) {
          return o.value;
        });
      else values[el.id] = el.value;
    });
    return values;
  }

  function onSnapshot(message) {
    if (!message.force && Date.now() - lastTypedAt < BUSY_MS)
      return post({ type: "carry", id: message.id, busy: true, data: null });
    var active = document.activeElement;
    post({
      type: "carry",
      id: message.id,
      busy: false,
      data: {
        hot: snapshotState(),
        forms: formValues(),
        focus: (active && active.id) || null,
        scroll: { x: window.scrollX, y: window.scrollY },
      },
    });
    leaving.abort();
  }

  function restore(carry) {
    var forms = carry.forms && typeof carry.forms === "object" ? carry.forms : {};
    Object.keys(forms).forEach(function (id) {
      var el = document.getElementById(id);
      var value = forms[id];
      if (!el) return;
      if (typeof value === "boolean") el.checked = value;
      else if (Array.isArray(value))
        [].forEach.call(el.options || [], function (o) {
          o.selected = value.indexOf(o.value) >= 0;
        });
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    var focus = carry.focus && document.getElementById(carry.focus);
    if (focus && typeof focus.focus === "function") focus.focus({ preventScroll: true });
    var scroll = carry.scroll;
    if (!scroll) return;
    window.scrollTo(scroll.x || 0, scroll.y || 0);
    // Late layout (fonts, images) can move the page; settle once more when it is complete.
    if (document.readyState !== "complete")
      window.addEventListener("load", function () {
        window.scrollTo(scroll.x || 0, scroll.y || 0);
      });
  }

  // ---- diagnostics: what this browser saw, for `verify` ----------------------
  var rows = [];
  var flushTimer = null;

  function report(level, message) {
    rows.push({ level: level, message: String(message).slice(0, 2000) });
    if (rows.length > 50) rows.shift();
    if (!flushTimer) flushTimer = setTimeout(flush, 1500);
  }
  function flush() {
    flushTimer = null;
    if (rows.length) post({ type: "diag", rows: rows.splice(0) });
  }
  ["error", "warn"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var parts = [].map.call(arguments, function (a) {
        return typeof a === "string" ? a : (a && a.message) || String(a);
      });
      report(level, parts.join(" "));
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (target && target !== window && target.tagName)
        report(
          "error",
          "failed to load " +
            target.tagName.toLowerCase() +
            " " +
            (target.src || target.href || ""),
        );
      else
        report(
          "error",
          (event.message || "uncaught error") +
            (event.lineno ? " (line " + event.lineno + ")" : ""),
        );
    },
    true,
  );
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    report("error", "unhandled rejection: " + ((reason && reason.message) || reason));
  });
  document.addEventListener("securitypolicyviolation", function (event) {
    report(
      "error",
      "blocked by the page policy (" +
        event.violatedDirective +
        "): " +
        (event.blockedURI || "inline"),
    );
  });
  window.addEventListener("pagehide", flush);

  // ---- mermaid --------------------------------------------------------------
  // Drawn for the ground the diagram actually sits on: a page that stays light
  // under a dark system still gets a readable figure.
  var diagrams = new Map();

  function onDarkGround(el) {
    for (var node = el; node && node.nodeType === 1; node = node.parentNode) {
      var rgb = /rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/.exec(
        getComputedStyle(node).backgroundColor,
      );
      if (rgb && (rgb[4] === undefined || Number(rgb[4]) > 0.5))
        return 0.2126 * rgb[1] + 0.7152 * rgb[2] + 0.0722 * rgb[3] < 128;
    }
    var stamped = root.getAttribute("data-theme");
    return stamped ? stamped === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function drawDiagrams() {
    if (!diagrams.size || !window.mermaid) return;
    var first = diagrams.keys().next().value;
    diagrams.forEach(function (source, pre) {
      pre.removeAttribute("data-processed");
      pre.textContent = source;
    });
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: onDarkGround(first) ? "dark" : "default",
    });
    window.mermaid.run({ nodes: Array.from(diagrams.keys()) }).catch(function (e) {
      console.error(e);
    });
  }

  whenParsed(function () {
    document.querySelectorAll("pre > code.language-mermaid").forEach(function (code) {
      var pre = code.parentNode;
      pre.className = "mermaid";
      pre.textContent = code.textContent;
    });
    document.querySelectorAll("pre.mermaid").forEach(function (pre) {
      diagrams.set(pre, pre.textContent);
    });
    if (!diagrams.size) return;
    var script = document.createElement("script");
    script.src = "/_rt/mermaid.js";
    script.onload = function () {
      script.remove();
      drawDiagrams();
    };
    document.head.appendChild(script);
  });

  function setTheme(value) {
    if (value === "light" || value === "dark") root.setAttribute("data-theme", value);
    else root.removeAttribute("data-theme");
    drawDiagrams();
  }

  // ---- the reply capability --------------------------------------------------
  var QUESTIONS_STYLE =
    ".qv1{--qv1-line:color-mix(in srgb,currentColor 18%,transparent);--qv1-card:color-mix(in srgb,currentColor 5%,transparent);" +
    "--qv1-muted:color-mix(in srgb,currentColor 64%,transparent);--qv1-accent:#4c6ef5;--qv1-danger:#e03131;font-size:16px;line-height:1.5}" +
    ".qv1-page{max-width:860px;margin:0 auto;padding:24px}" +
    ".qv1-intro{color:var(--qv1-muted);margin:0 0 1.5em}" +
    ".qv1-q{border:1px solid var(--qv1-line);border-radius:8px;padding:18px 20px;margin:0 0 18px}" +
    ".qv1-head{display:flex;gap:10px;align-items:center;margin:0 0 6px}" +
    ".qv1-chip{font-weight:600;font-size:11px;line-height:1;letter-spacing:.04em;text-transform:uppercase;color:var(--qv1-muted);" +
    "border:1px solid var(--qv1-line);border-radius:999px;padding:5px 8px}" +
    ".qv1-req{color:var(--qv1-danger);font-size:12px}" +
    ".qv1-title{font-weight:600;font-size:1.05em;margin:0 0 4px}" +
    ".qv1-why{color:var(--qv1-muted);font-size:.9em;margin:0 0 12px}" +
    ".qv1-options{display:grid;gap:8px;margin:8px 0}" +
    ".qv1-option{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;border:1px solid var(--qv1-line);" +
    "border-radius:8px;padding:10px 12px;cursor:pointer;background:var(--qv1-card)}" +
    ".qv1-option:hover,.qv1-option.qv1-selected{border-color:var(--qv1-accent)}" +
    ".qv1-option.qv1-selected{box-shadow:inset 0 0 0 1px var(--qv1-accent)}" +
    ".qv1-option input{margin-top:4px}" +
    ".qv1-label{font-weight:600}" +
    ".qv1-rec{font-size:11px;color:var(--qv1-accent);margin-left:6px;font-weight:600}" +
    ".qv1-desc{color:var(--qv1-muted);font-size:.92em}" +
    ".qv1-preview{grid-column:1/-1;margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.8em;" +
    "border:1px solid var(--qv1-line);border-radius:6px;padding:10px;white-space:pre-wrap;overflow:auto;max-height:280px}" +
    ".qv1-text{width:100%;box-sizing:border-box;font:inherit;color:inherit;background:transparent;border:1px solid var(--qv1-line);" +
    "border-radius:6px;padding:8px 10px;margin-top:6px;resize:vertical;min-height:38px}" +
    ".qv1-assume{display:flex;flex-wrap:wrap;gap:10px;align-items:center;border-top:1px solid var(--qv1-line);padding:10px 0}" +
    ".qv1-assume:first-of-type{border-top:0}.qv1-assume span{flex:1 1 12em}" +
    ".qv1-btn{font:inherit;font-weight:600;font-size:14px;border:1px solid var(--qv1-line);background:var(--qv1-card);color:inherit;" +
    "border-radius:6px;padding:7px 12px;cursor:pointer}" +
    ".qv1-btn.qv1-on{border-color:var(--qv1-accent);background:var(--qv1-accent);color:#fff}";

  function createReply(init, first) {
    var island = first && typeof first === "object" ? first : null;
    var dirty = false;
    var sending = false;
    var listeners = { change: [], sent: [], update: [] };
    var form = null;

    function on(name, fn) {
      if (listeners[name]) listeners[name].push(fn);
      return function () {
        off(name, fn);
      };
    }
    function off(name, fn) {
      var list = listeners[name] || [];
      var k = list.indexOf(fn);
      if (k >= 0) list.splice(k, 1);
    }
    function emit(name, arg) {
      (listeners[name] || []).slice().forEach(function (fn) {
        try {
          fn(arg);
        } catch (e) {
          console.error(e);
        }
      });
    }
    function el(name, attrs, children) {
      var node = document.createElement(name);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
      (children || []).forEach(function (c) {
        if (c != null) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
      return node;
    }

    function answers() {
      if (!island) island = {};
      if (!island.answers || typeof island.answers !== "object") island.answers = {};
      return island.answers;
    }
    function isQuestions() {
      return island && island.schema === "questions/v1" && Array.isArray(island.questions);
    }
    function visible(q) {
      if (!q.dependsOn) return true;
      var given = answers();
      return Object.keys(q.dependsOn).every(function (parent) {
        var wanted = q.dependsOn[parent];
        var labels = Array.isArray(wanted) ? wanted : [wanted];
        var selected = (given[parent] && given[parent].selected) || [];
        return labels.some(function (l) {
          return selected.indexOf(l) >= 0;
        });
      });
    }
    function progress() {
      if (!isQuestions()) return null;
      var given = answers();
      var out = { total: 0, done: 0, missing: [] };
      island.questions.forEach(function (q) {
        if (!visible(q)) return;
        out.total += 1;
        var a = given[q.id] || {};
        var has =
          (Array.isArray(a.selected) && a.selected.length) ||
          (typeof a.text === "string" && a.text.trim());
        if (has) out.done += 1;
        else if (q.required !== false) out.missing.push(q.id);
      });
      return out;
    }
    function tellShell() {
      post({ type: "reply.state", dirty: dirty, progress: progress() });
    }
    function changed() {
      dirty = true;
      emit("change", island);
      tellShell();
    }

    function answer(id, value) {
      var given = answers();
      var current = given[id] || {};
      if (typeof value === "string") current = Object.assign({}, current, { text: value });
      else if (Array.isArray(value)) current = Object.assign({}, current, { selected: value });
      else if (value && typeof value === "object") current = Object.assign({}, current, value);
      given[id] = current;
      changed();
      return current;
    }
    function select(id, label, multi) {
      var given = answers();
      var current = given[id] || {};
      var selected = Array.isArray(current.selected) ? current.selected.slice() : [];
      var k = selected.indexOf(label);
      if (multi) {
        if (k >= 0) selected.splice(k, 1);
        else selected.push(label);
      } else selected = k >= 0 && selected.length === 1 ? [] : [label];
      given[id] = Object.assign({}, current, { selected: selected });
      changed();
      markBindings();
      if (form) renderQuestions();
      return selected;
    }
    /** A send the page starts; whether a person was behind it is the shell's to say. */
    function send(extra) {
      if (sending) return Promise.resolve({ ok: false, error: "already sending" });
      if (extra && typeof extra === "object") island = Object.assign({}, island || {}, extra);
      sending = true;
      return call("reply", "send", [island]).then(
        function (sent) {
          sending = false;
          dirty = false;
          tellShell();
          emit("sent", sent);
          return { ok: true, version: sent.version, response: sent.response };
        },
        function (e) {
          sending = false;
          return {
            ok: false,
            error: e.message,
            code: e.code,
            current: e.current,
            errors: e.errors,
          };
        },
      );
    }

    function renderQuestions() {
      form.innerHTML = "";
      if (island.intro) form.appendChild(el("p", { class: "qv1-intro", text: island.intro }));
      island.questions.forEach(function (q) {
        var given = answers();
        var card = el("section", { class: "qv1-q", "data-q": q.id });
        var head = el("div", { class: "qv1-head" });
        if (q.header) head.appendChild(el("span", { class: "qv1-chip", text: q.header }));
        if (q.required !== false)
          head.appendChild(el("span", { class: "qv1-req", text: "required" }));
        card.appendChild(head);
        card.appendChild(el("p", { class: "qv1-title", text: q.question }));
        if (q.whyItMatters) card.appendChild(el("p", { class: "qv1-why", text: q.whyItMatters }));
        if (Array.isArray(q.options) && q.options.length) {
          var list = el("div", {
            class: "qv1-options",
            role: q.multiSelect ? "group" : "radiogroup",
          });
          q.options.forEach(function (o, k) {
            var chosen = ((given[q.id] && given[q.id].selected) || []).indexOf(o.label) >= 0;
            var input = el("input", {
              type: q.multiSelect ? "checkbox" : "radio",
              name: "qv1-" + q.id,
              value: o.label,
            });
            input.checked = chosen;
            var row = el(
              "label",
              { class: "qv1-option" + (chosen ? " qv1-selected" : ""), "data-option": o.label },
              [
                input,
                el("div", {}, [
                  el("div", { class: "qv1-label" }, [
                    o.label,
                    q.recommended === k
                      ? el("span", { class: "qv1-rec", text: "recommended" })
                      : null,
                  ]),
                  o.description ? el("div", { class: "qv1-desc", text: o.description }) : null,
                ]),
                o.preview ? el("pre", { class: "qv1-preview", text: o.preview }) : null,
              ],
            );
            row.addEventListener("click", function (event) {
              if (event.target && event.target.tagName === "INPUT") return;
              event.preventDefault();
              select(q.id, o.label, !!q.multiSelect);
            });
            input.addEventListener("change", function () {
              select(q.id, o.label, !!q.multiSelect);
            });
            list.appendChild(row);
          });
          card.appendChild(list);
        }
        if (q.allowText !== false) {
          var area = el("textarea", {
            class: "qv1-text",
            placeholder:
              q.options && q.options.length ? "Something else, or a note…" : "Type your answer…",
            rows: 1,
            "aria-label": q.question,
          });
          area.value = (given[q.id] && given[q.id].text) || "";
          area.addEventListener("input", function () {
            answer(q.id, area.value);
          });
          card.appendChild(area);
        }
        if (!visible(q)) card.hidden = true;
        form.appendChild(card);
      });
      if (!Array.isArray(island.assumptions) || !island.assumptions.length) return;
      var box = el("section", { class: "qv1-q" }, [
        el("p", {
          class: "qv1-title",
          text: "Assumptions the agent will make unless you change them",
        }),
      ]);
      island.assumptions.forEach(function (s) {
        var given = answers();
        var current = ((given[s.id] && given[s.id].selected) || [s.default || "confirm"])[0];
        var row = el("div", { class: "qv1-assume" }, [el("span", { text: s.text })]);
        ["confirm", "override"].forEach(function (choice) {
          row.appendChild(
            el("button", {
              type: "button",
              class: "qv1-btn" + (current === choice ? " qv1-on" : ""),
              text: choice === "confirm" ? "Keep" : "Change",
              onclick: function () {
                answer(s.id, { selected: [choice] });
                renderQuestions();
              },
            }),
          );
        });
        if (current === "override") {
          var note = el("input", {
            class: "qv1-text",
            type: "text",
            placeholder: "note (optional)",
            "aria-label": "Note on: " + s.text,
          });
          note.value = (given[s.id] && given[s.id].text) || "";
          note.addEventListener("input", function () {
            answer(s.id, note.value);
          });
          row.appendChild(note);
        }
        box.appendChild(row);
      });
      form.appendChild(box);
    }

    /** Hand-written option markup carries its state as an attribute the page styles. */
    function markBindings() {
      var given = (island && island.answers) || {};
      document.querySelectorAll("[data-question] [data-option]").forEach(function (option) {
        var holder = option.closest("[data-question]");
        var id = holder && holder.getAttribute("data-question");
        var selected = (id && given[id] && given[id].selected) || [];
        var chosen = selected.indexOf(option.getAttribute("data-option")) >= 0;
        option.toggleAttribute("data-selected", chosen);
        option.setAttribute("aria-pressed", String(chosen));
      });
    }
    function wireBindings() {
      document.querySelectorAll("[data-question]").forEach(function (holder) {
        var id = holder.getAttribute("data-question");
        var multi = holder.hasAttribute("data-multi");
        holder.querySelectorAll("[data-option]").forEach(function (option) {
          option.addEventListener("click", function () {
            select(id, option.getAttribute("data-option"), multi);
          });
        });
        if (holder.matches("input,textarea,select")) {
          holder.addEventListener("input", function () {
            answer(id, holder.value);
          });
        } else {
          holder.querySelectorAll("input[data-text],textarea[data-text]").forEach(function (t) {
            t.addEventListener("input", function () {
              answer(id, t.value);
            });
          });
        }
      });
      document.querySelectorAll("[data-artifact-send]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          var action = button.getAttribute("data-artifact-send");
          send(action ? { action: action } : undefined);
        });
      });
      markBindings();
    }

    return {
      namespace: Object.freeze({
        data: Object.freeze({
          get: function () {
            return island;
          },
          set: function (patch) {
            island = Object.assign({}, island || {}, patch || {});
            changed();
            return island;
          },
          replace: function (next) {
            island = next;
            changed();
            return island;
          },
        }),
        answer: answer,
        select: select,
        send: send,
        on: on,
        off: off,
        get version() {
          return init.version;
        },
        get slug() {
          return init.slug;
        },
        get dirty() {
          return dirty;
        },
      }),
      island: function () {
        return island;
      },
      /** The shell's pushes: its own Send went through, or another tab replied. */
      pushed: function (name, data) {
        if (name === "sent") {
          dirty = false;
          tellShell();
        } else if (name === "update" && !dirty && data && data.island) {
          island = data.island;
          if (form) renderQuestions();
          markBindings();
          tellShell();
        }
        emit(name, data);
      },
      boot: function () {
        if (isQuestions()) {
          form = document.querySelector("[data-artifact-questions]");
          if (!form) {
            form = el("div", { class: "qv1-page" });
            document.body.appendChild(form);
          }
          form.classList.add("qv1");
          document.head.appendChild(el("style", { text: QUESTIONS_STYLE }));
          renderQuestions();
        }
        wireBindings();
        tellShell();
      },
    };
  }

  // ---- start ------------------------------------------------------------------
  if (framed) {
    hello();
    setTimeout(settle, SHELL_WAIT_MS, null);
  } else {
    settle(null);
  }
})();
