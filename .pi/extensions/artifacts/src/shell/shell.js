// The viewer shell's script, served as /a/_shell.js to every page the shell
// host writes. On all of them it stamps the theme the user chose (kept in
// this origin's localStorage) before first paint. On a viewer page it frames
// the artifact from its own origin and is the page's only way to the server:
//
//   the bridge     answers the runtime's `hello` with `init` (slug, version,
//                  capabilities, island, carried state), relays its
//                  diagnostics, and makes its capability calls for it
//   capabilities   what Claude Code's namespaces ask for is done here, with
//                  the viewer's cookie and in the viewer's sight: permissions
//                  answers from what the page is served; downloads asks before
//                  it saves, from this document, because the frame cannot;
//                  comments opens the 💬 panel's own composer; artifact
//                  publishes the page's new version and moves the views; db
//                  and assets are the server's, and what a db write moved is
//                  pushed to every open view's page
//   feedback       the 💬 button and its panel, the Send bar and the "page
//                  changed" banner are drawn here, over the frame, never in
//                  the page — so page script can neither imitate nor trigger
//                  them. A send from the Send button is a user gesture; a
//                  send the page starts carries what THIS window's
//                  navigator.userActivation says at the moment it arrives
//   updates        a newer version on the event stream is loaded in a second
//                  frame beneath the first, handed the old document's
//                  snapshot, and swapped in; the shell itself never reloads
//
// A message counts only when it comes from a frame this script created and
// from that frame's origin. A classic script with no dependencies.

(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "artifacts.theme";

  function storedTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  }
  function stampTheme(value) {
    if (value) root.setAttribute("data-theme", value);
    else root.removeAttribute("data-theme");
  }

  var theme = storedTheme();
  stampTheme(theme);

  document.addEventListener("DOMContentLoaded", function () {
    var boot = document.getElementById("viewer-boot");
    if (boot) viewer(JSON.parse(boot.textContent));
  });

  function viewer(boot) {
    var base = "/a/" + boot.slug;
    var state = boot.state;
    var $ = function (id) {
      return document.getElementById(id);
    };
    var stage = $("stage");
    /** The frame on show, and the one loading beneath it during an update. */
    var live = null;
    var incoming = null;
    var waiting = {};
    var sequence = 0;
    var moving = false;
    var wanted = 0;
    var sending = false;
    var sentAt = null;
    var lastReply = 0;
    var threads = [];

    // ---- requests ---------------------------------------------------------------
    function getJson(path) {
      return fetch(base + path, { credentials: "same-origin" }).then(function (r) {
        return r.json().then(function (body) {
          return { status: r.status, body: body };
        });
      });
    }
    function postJson(path, body) {
      return fetch(base + path, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body || {}),
      }).then(function (r) {
        return r
          .json()
          .catch(function () {
            return {};
          })
          .then(function (parsed) {
            return { status: r.status, body: parsed };
          });
      });
    }

    // ---- frames -------------------------------------------------------------------
    function frameUrl(version) {
      return boot.frameBase + version + "/" + (theme ? "?theme=" + theme : "");
    }
    function sendTo(frame, message) {
      message.af = 1;
      // A sandboxed frame's origin is opaque and cannot be named; the window handle is the address.
      var target = boot.frameOrigin === "null" ? "*" : boot.frameOrigin;
      if (frame && frame.el.contentWindow) frame.el.contentWindow.postMessage(message, target);
    }
    function served(frame) {
      return (frame && frame.data && frame.data.caps) || {};
    }

    /** Loads a version: into the frame the server wrote first, beneath the live one after. */
    function open(version, carry) {
      return getJson("/data?v=" + version).then(function (res) {
        if (res.status !== 200) throw new Error("v" + version + " is not available");
        var el = live ? document.createElement("iframe") : $("frame");
        // A frame tells its reply state as it boots, often before it is the one on show.
        var frame = {
          el: el,
          version: version,
          data: res.body,
          carry: carry || null,
          reply: { dirty: false, progress: null },
        };
        if (!live) {
          live = frame;
          el.src = frameUrl(version);
          return drawBar();
        }
        el.className = "frame frame-incoming";
        el.setAttribute("sandbox", live.el.getAttribute("sandbox"));
        el.setAttribute("title", live.el.getAttribute("title"));
        incoming = frame;
        stage.insertBefore(el, live.el);
        return new Promise(function (resolve) {
          var timer = setTimeout(promote, 4000);
          function promote() {
            clearTimeout(timer);
            el.removeEventListener("load", promote);
            var focused = document.activeElement === live.el;
            stage.removeChild(live.el);
            el.className = "frame";
            live = frame;
            incoming = null;
            // The window, not the element: focusing the <iframe> clears the control the runtime refocused.
            if (focused) el.contentWindow.focus();
            sentAt = null;
            lastReply = 0;
            hideBanner();
            drawBar();
            resolve();
          }
          el.addEventListener("load", promote);
          el.src = frameUrl(version);
        });
      });
    }

    /** Asks the live document for its state at a quiet moment; null when it cannot answer. */
    function snapshot(frame) {
      if (!frame || !frame.greeted) return Promise.resolve(null);
      var started = Date.now();
      return new Promise(function (resolve) {
        function ask(force) {
          var id = "s" + ++sequence;
          var silent = setTimeout(function () {
            delete waiting[id];
            resolve(null);
          }, 1500);
          waiting[id] = function (message) {
            clearTimeout(silent);
            if (!message.busy) return resolve(message.data || null);
            // The user is typing: come back, and after ten seconds stop waiting.
            var overdue = Date.now() - started >= 10000;
            setTimeout(ask, overdue ? 0 : 400, overdue);
          };
          sendTo(frame, { type: "snapshot", id: id, force: !!force });
        }
        ask(false);
      });
    }

    function moveTo(version) {
      wanted = Math.max(wanted, version);
      if (moving) return;
      moving = true;
      snapshot(live)
        .then(function (carry) {
          return open(version, carry);
        })
        .catch(function (e) {
          showBanner("Could not show v" + version + ": " + e.message);
        })
        .then(function () {
          moving = false;
          if (live && wanted > live.version && wanted !== version) moveTo(wanted);
        });
    }

    /** A newer version exists: follow it, unless that would throw away what the user has not sent. */
    function arrived(version) {
      if (boot.pinned !== null || !live || version <= Math.max(live.version, wanted)) return;
      if (!live.reply.dirty) return moveTo(version);
      showBanner(
        "v" + version + " was published. Showing it discards your unsent choices.",
        "Show v" + version,
        function () {
          moveTo(version);
        },
      );
    }

    /** The same version, loaded afresh: nothing is carried. */
    function reload(frame) {
      if (!frame) return;
      frame.greeted = false;
      frame.carry = null;
      frame.reply = { dirty: false, progress: null };
      frame.el.src = frameUrl(frame.version);
      drawBar();
    }

    // ---- the bridge ---------------------------------------------------------------
    window.addEventListener("message", function (event) {
      var frame = [live, incoming].filter(function (f) {
        return f && f.el.contentWindow === event.source;
      })[0];
      var message = event.data;
      if (!frame || event.origin !== boot.frameOrigin || !message || message.af !== 1) return;
      if (message.type === "hello") {
        frame.greeted = true;
        sendTo(frame, {
          type: "init",
          slug: boot.slug,
          version: frame.version,
          caps: served(frame),
          island: frame.data.island,
          carry: frame.carry,
        });
        frame.carry = null;
      } else if (message.type === "call") {
        // Read before anything else runs: activation a click in the frame gave this window expires.
        var gesture = !!(navigator.userActivation && navigator.userActivation.isActive);
        answerCall(frame, message, gesture);
      } else if (message.type === "carry" || message.type === "reply.island") {
        var resolve = waiting[message.id];
        delete waiting[message.id];
        if (resolve) resolve(message);
      } else if (message.type === "reply.state") {
        frame.reply = { dirty: !!message.dirty, progress: message.progress || null };
        if (frame === live) drawBar();
      } else if (message.type === "diag" && Array.isArray(message.rows)) {
        postJson("/diagnostics", { version: frame.version, rows: message.rows }).catch(
          function () {},
        );
      }
    });

    function owns(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }

    /**
     * A capability call from a frame. It is answered only for a capability the
     * frame is served; the refusals are Claude Code's lifecycle codes, which a
     * page already knows to read as "render without it".
     */
    function answerCall(frame, message, gesture) {
      function result(ok, payload) {
        var out = { type: "result", id: message.id, ok: ok };
        out[ok ? "value" : "error"] = payload;
        sendTo(frame, out);
      }
      if (message.cap === "hot" && message.method === "restart") {
        result(true, null);
        return reload(frame);
      }
      if (!owns(served(frame), message.cap))
        return result(false, { code: "not_granted", message: "this page is not served that" });
      var verbs = owns(capabilities, message.cap) ? capabilities[message.cap] : {};
      if (!owns(verbs, message.method))
        return result(false, {
          code: "capability_removed",
          message: "this viewer has no " + message.cap + "." + message.method,
        });
      verbs[message.method]({
        frame: frame,
        args: Array.isArray(message.args) ? message.args : [],
        gesture: gesture,
        resolve: function (value) {
          result(true, value);
        },
        refuse: function (code, text, detail) {
          result(false, { code: code, message: text, detail: detail });
        },
      });
    }

    var capabilities = {
      reply: {
        send: function (asked) {
          if (asked.frame !== live || !canSend())
            return asked.refuse(
              "read_only",
              "this view is read-only; open the latest version to send",
            );
          postReply(asked.args[0], asked.gesture).then(function (sent) {
            if (sent.ok) asked.resolve({ version: sent.version, response: sent.response });
            else
              asked.refuse(sent.code, sent.error, { current: sent.current, errors: sent.errors });
          });
        },
      },
      // One viewer, who owns the page: what a page is served is granted, and nothing ever asks.
      permissions: {
        state: function (asked) {
          var name = asked.args[0];
          asked.resolve(
            name === undefined ? states(asked.frame, null) : stateOf(asked.frame, name),
          );
        },
        request: function (asked) {
          var names = asked.args[0];
          asked.resolve(states(asked.frame, Array.isArray(names) ? names : null));
        },
      },
      downloads: { save: saveFile },
      comments: { openComposer: openComposer },
      artifact: { publish: publishSelf },
      db: relayed("/db", ["get", "query", "set", "update", "delete", "acquire"], "unavailable"),
      assets: Object.assign(relayed("/assets", ["list", "delete"], "store_unavailable"), {
        upload: uploadAsset,
      }),
    };

    /** An upload is the page's Blob, which JSON cannot carry: its bytes go in base64, under the type the page stated. */
    function uploadAsset(asked) {
      var given = asked.args[0] || {};
      if (!(given.blob instanceof Blob))
        return asked.refuse("invalid_request", "upload takes a Blob or a File");
      base64Of(given.blob).then(
        function (base64) {
          var body = { op: "upload", base64: base64, contentType: given.type };
          relay("/assets", body, asked, "store_unavailable");
        },
        function () {
          asked.refuse("invalid_request", "the file could not be read");
        },
      );
    }

    /**
     * A capability whose verbs the server carries out: a call is posted to the
     * capability's route as {op: <verb>, …its one argument}, and what comes back —
     * the answer, or a refusal under the capability's own codes — goes to the page.
     */
    function relayed(path, verbs, unreachable) {
      var table = {};
      verbs.forEach(function (verb) {
        table[verb] = function (asked) {
          relay(path, Object.assign({}, asked.args[0], { op: verb }), asked, unreachable);
        };
      });
      return table;
    }
    function relay(path, body, asked, unreachable) {
      postJson(path, body).then(
        function (res) {
          if (res.status === 200) return asked.resolve(res.body);
          asked.refuse(res.body.code || unreachable, res.body.message || "HTTP " + res.status);
        },
        function (e) {
          asked.refuse(unreachable, String((e && e.message) || e));
        },
      );
    }

    /** The database moved: a frame served `db` hears which documents, or null for "read everything again". */
    function tellDb(paths) {
      [live, incoming].forEach(function (frame) {
        if (frame && frame.greeted && owns(served(frame), "db"))
          sendTo(frame, { type: "event", cap: "db", name: "change", data: { paths: paths } });
      });
    }

    function stateOf(frame, name) {
      return owns(served(frame), String(name)) ? "granted" : "unavailable";
    }
    /** The state of each of `names`; with none named, of everything the frame is served, omitting the rest. */
    function states(frame, names) {
      var out = Object.create(null);
      (names || Object.keys(served(frame))).forEach(function (name) {
        out[name] = stateOf(frame, name);
      });
      return out;
    }

    // ---- replies: the Send bar --------------------------------------------------
    var sendBar = $("send-bar");
    var sendButton = $("send-button");
    var sendStatus = $("send-status");

    function canSend() {
      return !!(
        live &&
        served(live).reply &&
        boot.pinned === null &&
        live.version === state.current
      );
    }
    function setStatus(text, kind) {
      sendStatus.textContent = text;
      sendStatus.className = "send-status" + (kind ? " " + kind : "");
    }
    function drawBar() {
      sendBar.hidden = !canSend();
      if (sendBar.hidden) return;
      $("send-version").textContent = "v" + live.version;
      var p = live.reply.progress;
      var settled = sending || (sentAt && !live.reply.dirty);
      if (p) {
        sendButton.disabled = p.missing.length > 0 || sending;
        if (!settled)
          setStatus(
            p.missing.length
              ? p.done + " of " + p.total + " answered · " + p.missing.length + " required left"
              : p.done + " of " + p.total + " answered · ready to send",
          );
      } else {
        sendButton.disabled = sending || !live.reply.dirty;
        if (!settled)
          setStatus(
            live.reply.dirty
              ? "Unsent changes"
              : "v" + live.version + (lastReply ? " · reply " + lastReply : ""),
          );
      }
    }

    /** Posts the island as a reply to the version on show; resolves to what happened, never rejects. */
    function postReply(island, gesture) {
      if (sending) return Promise.resolve({ ok: false, code: "busy", error: "already sending" });
      var version = live.version;
      sending = true;
      setStatus("Sending…");
      drawBar();
      return postJson("/publish", { base_version: version, data: island, gesture: gesture })
        .then(function (res) {
          sending = false;
          if (res.status === 200 && res.body.ok) {
            lastReply = res.body.response;
            sentAt = new Date();
            live.reply.dirty = false;
            setStatus(
              "Sent reply " + lastReply + " to v" + version + " — the agent is continuing.",
              "ok",
            );
            drawBar();
            return { ok: true, version: version, response: lastReply };
          }
          if (res.status === 409) {
            var current = res.body.current;
            showBanner(
              "This page changed underneath you (now v" +
                (current || "?") +
                "). Show it to continue; your unsent choices will be lost.",
              "Show v" + (current || "?"),
              function () {
                if (current) moveTo(current);
              },
            );
            setStatus("Not sent — the page is out of date.", "err");
            drawBar();
            return { ok: false, code: "stale", error: "stale", current: current };
          }
          var error = res.body.error || "HTTP " + res.status;
          var detail =
            res.body.errors && res.body.errors.length ? " " + res.body.errors.join("; ") : "";
          setStatus("Not sent: " + error + detail, "err");
          drawBar();
          return { ok: false, code: "refused", error: error, errors: res.body.errors };
        })
        .catch(function (e) {
          sending = false;
          setStatus("Not sent: " + ((e && e.message) || e), "err");
          drawBar();
          return { ok: false, code: "network", error: String(e) };
        });
    }

    sendButton.addEventListener("click", function () {
      if (sending || !canSend()) return;
      var frame = live;
      var id = "r" + ++sequence;
      var silent = setTimeout(function () {
        delete waiting[id];
        setStatus("Not sent: the page did not answer.", "err");
      }, 3000);
      waiting[id] = function (message) {
        clearTimeout(silent);
        // The user pressed the shell's own button: this send is theirs.
        postReply(message.data, true).then(function (sent) {
          if (sent.ok)
            sendTo(frame, {
              type: "event",
              cap: "reply",
              name: "sent",
              data: { version: sent.version, response: sent.response },
            });
        });
      };
      sendTo(frame, { type: "reply.collect", id: id });
    });

    // ---- artifact: the page publishes its own next version -----------------------
    // The write is compare-and-set against the version the view runs. A whole
    // page moves every view to the new version, this one included. A files
    // publish leaves this view running on the version it just made — so while
    // one is in flight the stream's `version` events wait, and the one that is
    // only this view's own save moves nothing; a save that landed over someone
    // else's is a later version than that, and moves this view like any other.
    var saving = 0;
    var heldVersions = [];

    function heardVersion(version) {
      if (saving) heldVersions.push(version);
      else arrived(version);
    }

    function base64Of(blob) {
      return new Promise(function (resolve, reject) {
        if (!blob.size) return resolve("");
        var reader = new FileReader();
        reader.onload = function () {
          var url = String(reader.result);
          resolve(url.slice(url.indexOf(",") + 1));
        };
        reader.onerror = function () {
          reject(reader.error);
        };
        reader.readAsDataURL(blob);
      });
    }

    /** A page's files as the server takes them: text as it is, a Blob's bytes in base64. */
    function wireFiles(files) {
      var out = {};
      return Promise.all(
        Object.keys(files).map(function (path) {
          var entry = files[path] || {};
          if (entry.delete) {
            out[path] = { delete: true, ifMatch: entry.ifMatch };
            return null;
          }
          out[path] = { contentType: entry.contentType, ifMatch: entry.ifMatch };
          if (typeof entry.content === "string") {
            out[path].text = entry.content;
            return null;
          }
          return base64Of(entry.content).then(function (base64) {
            out[path].base64 = base64;
          });
        }),
      ).then(function () {
        return out;
      });
    }

    function publishSelf(asked) {
      var frame = asked.frame;
      var page = asked.args[0] || {};
      if (boot.pinned !== null || frame !== live)
        return asked.refuse(
          "not_granted",
          "this view is read-only; open the latest version to publish",
        );
      if (typeof page.html === "string") return post({ html: page.html }, false);
      if (!page.files || typeof page.files !== "object")
        return asked.refuse("invalid_content", "publish takes a page or its files");
      // One save at a time: each builds on the version the one before it made.
      frame.saves = (frame.saves || Promise.resolve()).then(function () {
        return wireFiles(page.files).then(
          function (files) {
            return post({ files: files }, true);
          },
          function () {
            asked.refuse("invalid_content", "a file's content could not be read");
          },
        );
      });

      function post(body, keepsRunning) {
        var base = frame.version;
        body.base_version = base;
        if (keepsRunning) saving += 1;
        return postJson("/self-publish", body)
          .then(
            function (res) {
              var made = Number(res.body.version);
              if (res.status !== 200 || !made) {
                asked.refuse(
                  res.body.code || "upstream_error",
                  res.body.message || "HTTP " + res.status,
                  { live: res.body.live, paths: res.body.paths, changed: res.body.changed },
                );
                // The winner of a conflict is where this view belongs, whatever the stream said.
                if (res.body.live) heldVersions.push(Number(res.body.live));
                return;
              }
              if (keepsRunning && made === base + 1) frame.version = made;
              asked.resolve({
                version: res.body.version,
                shas: res.body.shas,
                changed: res.body.changed,
              });
              heldVersions.push(made);
              refreshState();
            },
            function (e) {
              asked.refuse("upstream_error", String((e && e.message) || e));
            },
          )
          .then(function () {
            if (keepsRunning) saving -= 1;
            if (!saving) heldVersions.splice(0).forEach(arrived);
          });
      }
    }

    // ---- downloads: a save the viewer confirms --------------------------------------
    // The frame's sandbox allows no download, so a page can only offer a file.
    // The name is made safe and shown with the size; the file is saved from this
    // document, and only on the viewer's yes. One prompt at a time.
    var SAVE_TYPES = {
      gif: "image/gif",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      txt: "text/plain",
      json: "application/json",
      md: "text/markdown",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      epub: "application/epub+zip",
      csv: "text/csv",
      ttf: "font/ttf",
      html: "text/html",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
    };
    var SAVE_NAME_BYTES = 240;
    var saveDialog = $("save-dialog");
    var offered = null;

    function utf8Length(text) {
      return new TextEncoder().encode(text).length;
    }
    /** Claude Code's rule: invisible characters dropped, whitespace made one space, at most 240 bytes. */
    function safeName(raw) {
      var name = raw
        .replace(/[\p{Cc}\p{Cf}]/gu, "")
        .replace(/[\\/:]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
      var dot = name.lastIndexOf(".");
      var stem = Array.from(dot > 0 ? name.slice(0, dot) : name);
      var extension = dot > 0 ? name.slice(dot) : "";
      while (stem.length > 1 && utf8Length(stem.join("") + extension) > SAVE_NAME_BYTES) stem.pop();
      return stem.join("") + extension;
    }
    function readableSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    }

    function saveFile(asked) {
      var wanted = asked.args[0] || {};
      var data = wanted.data;
      if (typeof wanted.filename !== "string" || wanted.filename.length > 512)
        return asked.refuse("bad_request", "filename must be a string of at most 512 characters");
      var isData = typeof data === "string" || data instanceof Blob || data instanceof ArrayBuffer;
      var name = safeName(wanted.filename);
      var extension = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
      if (name.lastIndexOf(".") <= 0 || !owns(SAVE_TYPES, extension))
        return asked.refuse(
          "rejected_extension",
          "a saved file is one of: " + Object.keys(SAVE_TYPES).join(" "),
        );
      // The type comes from the name the viewer sees, never from the page's Blob.
      var file = isData ? new Blob([data], { type: SAVE_TYPES[extension] }) : null;
      if (!file || !file.size) return asked.refuse("bad_request", "data is empty");
      if (offered) return asked.refuse("rate_limited", "a save is already waiting for the viewer");
      offered = { asked: asked, file: file, name: name, accepted: false };
      $("save-name").textContent = name;
      $("save-size").textContent = "(" + readableSize(file.size) + ")";
      saveDialog.showModal();
    }
    $("save-confirm").addEventListener("click", function () {
      if (offered) offered.accepted = true;
      saveDialog.close();
    });
    // Every way out of the prompt ends here: the button, Escape, Don't save.
    saveDialog.addEventListener("close", function () {
      var save = offered;
      offered = null;
      if (!save) return;
      if (!save.accepted) return save.asked.refuse("declined", "the viewer did not save the file");
      var link = document.createElement("a");
      link.href = URL.createObjectURL(save.file);
      link.download = save.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(URL.revokeObjectURL, 60000, link.href);
      save.asked.resolve({ status: "saved" });
    });

    // ---- the banner ---------------------------------------------------------------
    var banner = $("banner");
    var bannerAction = $("banner-action");
    var onBannerAction = null;

    function showBanner(text, actionLabel, action) {
      $("banner-text").textContent = text;
      bannerAction.hidden = !actionLabel;
      bannerAction.textContent = actionLabel || "";
      onBannerAction = action || null;
      banner.hidden = false;
    }
    function hideBanner() {
      banner.hidden = true;
      onBannerAction = null;
    }
    bannerAction.addEventListener("click", function () {
      var action = onBannerAction;
      hideBanner();
      if (action) action();
    });
    $("banner-close").addEventListener("click", hideBanner);

    // ---- comments -------------------------------------------------------------------
    var panel = $("comments-panel");
    var fab = $("fab");
    var commentsToggle = $("comments-toggle");

    function make(name, className, text) {
      var node = document.createElement(name);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function comment(text, options) {
      return postJson("/comments", {
        text: text,
        toAgent: options.toAgent !== false,
        anchor: options.anchor,
        threadId: options.threadId,
      }).then(function (res) {
        if (res.status !== 200) throw new Error(res.body.error || "the comment was not saved");
        return loadThreads();
      });
    }
    function drawThreads() {
      var list = $("threads");
      list.textContent = "";
      if (!threads.length) list.appendChild(make("p", "thread-about", "No comments yet."));
      threads.forEach(function (t) {
        var box = make("div", "thread");
        box.appendChild(
          make(
            "div",
            "thread-about",
            (t.anchor ? t.anchor + " · " : "") +
              (t.toAgent ? "sent to agent" : "note") +
              (t.resolved ? " · resolved" : ""),
          ),
        );
        (t.messages || []).forEach(function (m) {
          var row = make("div", "message" + (m.author === "agent" ? " from-agent" : ""));
          row.appendChild(make("div", "message-who", m.author === "agent" ? "agent" : "you"));
          row.appendChild(make("div", "", m.text));
          box.appendChild(row);
        });
        var reply = make("input", "field");
        reply.type = "text";
        reply.placeholder = "Reply…";
        reply.setAttribute("aria-label", "Reply to this thread");
        reply.addEventListener("keydown", function (event) {
          var text = reply.value.trim();
          if (event.key !== "Enter" || !text) return;
          reply.value = "";
          comment(text, { threadId: t.id, toAgent: true }).catch(function (e) {
            showBanner(e.message);
          });
        });
        box.appendChild(reply);
        list.appendChild(box);
      });
      var open = threads.filter(function (t) {
        return !t.resolved;
      }).length;
      $("fab-count").textContent = String(open);
      $("fab-count").hidden = open === 0;
    }
    function loadThreads() {
      return getJson("/comments")
        .then(function (res) {
          threads = res.status === 200 && Array.isArray(res.body.threads) ? res.body.threads : [];
          drawThreads();
        })
        .catch(function () {});
    }
    function showPanel(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", String(open));
      commentsToggle.setAttribute("aria-expanded", String(open));
      if (open) loadThreads();
    }
    function togglePanel() {
      showPanel(panel.hidden);
    }
    fab.addEventListener("click", togglePanel);
    commentsToggle.addEventListener("click", togglePanel);

    /**
     * comments.openComposer: the page points at something and the 💬 panel opens
     * on its composer, About filled in — the panel the viewer already knows, and
     * the only place a comment is written. It answers the viewer's own gesture
     * in the page and never a script acting alone, and it leaves a draft the
     * viewer is still typing exactly as it is: both are Claude Code's soft
     * refusal, `opened: false`, which a page is told to ignore.
     */
    function openComposer(asked) {
      var told = asked.args[0] || {};
      var draft = $("comment-text");
      var activation = navigator.userActivation;
      if (activation && !asked.gesture) return asked.resolve({ opened: false });
      if (draft.value.trim()) {
        showPanel(true);
        return asked.resolve({ opened: false });
      }
      showPanel(true);
      $("comment-anchor").value = typeof told.about === "string" ? told.about.slice(0, 200) : "";
      draft.focus();
      asked.resolve({ opened: true });
    }
    $("composer").addEventListener("submit", function (event) {
      event.preventDefault();
      var text = $("comment-text").value.trim();
      if (!text) return;
      comment(text, {
        toAgent: $("comment-to-agent").checked,
        anchor: $("comment-anchor").value.trim() || undefined,
      })
        .then(function () {
          $("comment-text").value = "";
          $("comment-anchor").value = "";
        })
        .catch(function (e) {
          showBanner(e.message);
        });
    });

    // ---- the header -----------------------------------------------------------------
    var titleButton = $("title-button");
    var menu = $("title-menu");
    var versionPicker = $("version-picker");
    var themePicker = $("theme-picker");

    function drawHeader() {
      $("title-text").textContent = state.title;
      document.title = state.title;
      if (live) live.el.setAttribute("title", state.title);
      $("pin-item").textContent = state.pinned ? "Unpin" : "Pin";
      var dot = $("session-dot");
      var told = state.connected
        ? "The session that owns this page is listening: a send reaches it now."
        : "No session is listening: a send waits for the session that owns this page.";
      dot.className = "dot" + (state.connected ? " on" : "");
      dot.title = told;
      dot.setAttribute("aria-label", told);
      versionPicker.textContent = "";
      var latest = make("option", "", "Latest · v" + state.current);
      latest.value = "latest";
      versionPicker.appendChild(latest);
      state.versions
        .slice()
        .reverse()
        .forEach(function (v) {
          var option = make("option", "", "v" + v.n + (v.label ? " · " + v.label : ""));
          option.value = String(v.n);
          versionPicker.appendChild(option);
        });
      versionPicker.value = boot.pinned === null ? "latest" : String(boot.pinned);
    }
    function refreshState() {
      return getJson("/state").then(function (res) {
        if (res.status === 404) return gone();
        if (res.status !== 200) return;
        state = res.body;
        drawHeader();
        drawBar();
      });
    }
    function gone() {
      showBanner("This artifact was deleted.", "All artifacts", function () {
        location.assign("/a/");
      });
    }

    versionPicker.addEventListener("change", function () {
      var value = versionPicker.value;
      location.assign(value === "latest" ? base : base + "/v/" + value);
    });

    themePicker.value = theme || "system";
    themePicker.addEventListener("change", function () {
      theme = themePicker.value === "system" ? null : themePicker.value;
      try {
        if (theme) localStorage.setItem(THEME_KEY, theme);
        else localStorage.removeItem(THEME_KEY);
      } catch {
        // a private window: the choice lasts for this page
      }
      stampTheme(theme);
      [live, incoming].forEach(function (frame) {
        sendTo(frame, { type: "theme", value: theme });
      });
    });

    function closeMenu() {
      menu.hidden = true;
      titleButton.setAttribute("aria-expanded", "false");
    }
    titleButton.addEventListener("click", function () {
      menu.hidden = !menu.hidden;
      titleButton.setAttribute("aria-expanded", String(!menu.hidden));
      if (!menu.hidden) menu.querySelector("[role=menuitem]").focus();
    });
    document.addEventListener("click", function (event) {
      if (!menu.hidden && !event.target.closest(".menu")) closeMenu();
    });
    // A click inside the frame never reaches this document; losing focus to it does.
    window.addEventListener("blur", closeMenu);
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!menu.hidden) {
        closeMenu();
        titleButton.focus();
      } else if (!panel.hidden) togglePanel();
    });
    menu.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      var items = [].slice.call(menu.querySelectorAll("[role=menuitem]"));
      var k = items.indexOf(document.activeElement) + (event.key === "ArrowDown" ? 1 : -1);
      items[(k + items.length) % items.length].focus();
    });

    function act(path, body) {
      return postJson(path, body).then(function (res) {
        if (res.status !== 200) throw new Error(res.body.error || "HTTP " + res.status);
        return res.body;
      });
    }
    var actions = {
      rename: function () {
        $("rename-input").value = state.title;
        $("rename-dialog").showModal();
        $("rename-input").select();
      },
      duplicate: function () {
        return act("/duplicate").then(function (body) {
          location.assign("/a/" + body.slug);
        });
      },
      refresh: function () {
        reload(live);
      },
      pin: function () {
        return act("/pin", { pinned: !state.pinned }).then(function (body) {
          state = body.state;
          drawHeader();
        });
      },
      delete: function () {
        $("delete-dialog").showModal();
      },
    };
    menu.addEventListener("click", function (event) {
      var item = event.target.closest("[data-action]");
      if (!item) return;
      closeMenu();
      Promise.resolve(actions[item.getAttribute("data-action")]()).catch(function (e) {
        showBanner(e.message);
      });
    });
    document.querySelectorAll("dialog [data-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        button.closest("dialog").close();
      });
    });
    $("rename-form").addEventListener("submit", function (event) {
      event.preventDefault();
      act("/rename", { title: $("rename-input").value })
        .then(function (body) {
          state = body.state;
          drawHeader();
          $("rename-dialog").close();
        })
        .catch(function (e) {
          $("rename-dialog").close();
          showBanner(e.message);
        });
    });
    $("delete-confirm").addEventListener("click", function () {
      act("/delete")
        .then(function () {
          location.assign("/a/");
        })
        .catch(function (e) {
          $("delete-dialog").close();
          showBanner(e.message);
        });
    });

    // ---- live updates ---------------------------------------------------------------
    function subscribe() {
      var stream = new EventSource(base + "/events");
      stream.onmessage = function (e) {
        var event;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        if (event.type === "hello" || event.type === "version") {
          refreshState();
          if (typeof event.version === "number") heardVersion(event.version);
          // A stream that has just connected may have missed writes: every listener reads again.
          if (event.type === "hello") tellDb(null);
        } else if (event.type === "db") tellDb(Array.isArray(event.paths) ? event.paths : null);
        else if (event.type === "state") refreshState();
        else if (event.type === "comment") loadThreads();
        else if (event.type === "response") heardReply(event);
      };
      // The stream ends for good when the artifact is deleted; anything else reconnects by itself.
      stream.onerror = function () {
        refreshState().catch(function () {});
      };
    }
    /** A reply this window did not make (another tab's): the page hears it with the merged island. */
    function heardReply(event) {
      if (sending || !live || event.version !== live.version || event.response === lastReply)
        return;
      getJson("/data?v=" + live.version).then(function (res) {
        if (res.status !== 200) return;
        sendTo(live, {
          type: "event",
          cap: "reply",
          name: "update",
          data: { version: event.version, response: event.response, island: res.body.island },
        });
      });
    }

    drawHeader();
    loadThreads();
    // The stream's first message names the current version: heard with a frame on show, it catches up.
    open(boot.pinned === null ? state.current : boot.pinned, null)
      .catch(function (e) {
        showBanner(e.message);
      })
      .then(subscribe);
  }
})();
