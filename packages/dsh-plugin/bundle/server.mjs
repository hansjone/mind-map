import { createRequire as __mmCr } from 'node:module'; const require = __mmCr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name17 in all)
    __defProp(target, name17, { get: all[name17], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name17, elem) {
      if (dest[name17] === void 0) dest[name17] = [elem];
      else dest[name17].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name17 = header.slice(start, end);
            if (code === 44) {
              push(offers, name17, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name17;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable: Readable3 } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener: addEventListener2, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener2;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/.pnpm/secure-json-parse@2.7.0/node_modules/secure-json-parse/index.js
var require_secure_json_parse = __commonJS({
  "node_modules/.pnpm/secure-json-parse@2.7.0/node_modules/secure-json-parse/index.js"(exports, module) {
    "use strict";
    var hasBuffer = typeof Buffer !== "undefined";
    var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
    var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
    function _parse(text2, reviver, options) {
      if (options == null) {
        if (reviver !== null && typeof reviver === "object") {
          options = reviver;
          reviver = void 0;
        }
      }
      if (hasBuffer && Buffer.isBuffer(text2)) {
        text2 = text2.toString();
      }
      if (text2 && text2.charCodeAt(0) === 65279) {
        text2 = text2.slice(1);
      }
      const obj = JSON.parse(text2, reviver);
      if (obj === null || typeof obj !== "object") {
        return obj;
      }
      const protoAction = options && options.protoAction || "error";
      const constructorAction = options && options.constructorAction || "error";
      if (protoAction === "ignore" && constructorAction === "ignore") {
        return obj;
      }
      if (protoAction !== "ignore" && constructorAction !== "ignore") {
        if (suspectProtoRx.test(text2) === false && suspectConstructorRx.test(text2) === false) {
          return obj;
        }
      } else if (protoAction !== "ignore" && constructorAction === "ignore") {
        if (suspectProtoRx.test(text2) === false) {
          return obj;
        }
      } else {
        if (suspectConstructorRx.test(text2) === false) {
          return obj;
        }
      }
      return filter(obj, { protoAction, constructorAction, safe: options && options.safe });
    }
    function filter(obj, { protoAction = "error", constructorAction = "error", safe } = {}) {
      let next = [obj];
      while (next.length) {
        const nodes = next;
        next = [];
        for (const node of nodes) {
          if (protoAction !== "ignore" && Object.prototype.hasOwnProperty.call(node, "__proto__")) {
            if (safe === true) {
              return null;
            } else if (protoAction === "error") {
              throw new SyntaxError("Object contains forbidden prototype property");
            }
            delete node.__proto__;
          }
          if (constructorAction !== "ignore" && Object.prototype.hasOwnProperty.call(node, "constructor") && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) {
            if (safe === true) {
              return null;
            } else if (constructorAction === "error") {
              throw new SyntaxError("Object contains forbidden prototype property");
            }
            delete node.constructor;
          }
          for (const key in node) {
            const value = node[key];
            if (value && typeof value === "object") {
              next.push(value);
            }
          }
        }
      }
      return obj;
    }
    function parse(text2, reviver, options) {
      const stackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        return _parse(text2, reviver, options);
      } finally {
        Error.stackTraceLimit = stackTraceLimit;
      }
    }
    function safeParse(text2, reviver) {
      const stackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        return _parse(text2, reviver, { safe: true });
      } catch (_e) {
        return null;
      } finally {
        Error.stackTraceLimit = stackTraceLimit;
      }
    }
    module.exports = parse;
    module.exports.default = parse;
    module.exports.parse = parse;
    module.exports.safeParse = safeParse;
    module.exports.scan = filter;
  }
});

// node_modules/.pnpm/d3-flextree@2.1.2/node_modules/d3-flextree/build/d3-flextree.js
var require_d3_flextree = __commonJS({
  "node_modules/.pnpm/d3-flextree@2.1.2/node_modules/d3-flextree/build/d3-flextree.js"(exports, module) {
    (function(global2, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : factory(global2.d3 = global2.d3 || {});
    })(exports, (function(exports2) {
      "use strict";
      function count(node) {
        var sum = 0, children = node.children, i = children && children.length;
        if (!i) sum = 1;
        else while (--i >= 0) sum += children[i].value;
        node.value = sum;
      }
      function node_count() {
        return this.eachAfter(count);
      }
      function node_each(callback) {
        var node = this, current, next = [node], children, i, n;
        do {
          current = next.reverse(), next = [];
          while (node = current.pop()) {
            callback(node), children = node.children;
            if (children) for (i = 0, n = children.length; i < n; ++i) {
              next.push(children[i]);
            }
          }
        } while (next.length);
        return this;
      }
      function node_eachBefore(callback) {
        var node = this, nodes = [node], children, i;
        while (node = nodes.pop()) {
          callback(node), children = node.children;
          if (children) for (i = children.length - 1; i >= 0; --i) {
            nodes.push(children[i]);
          }
        }
        return this;
      }
      function node_eachAfter(callback) {
        var node = this, nodes = [node], next = [], children, i, n;
        while (node = nodes.pop()) {
          next.push(node), children = node.children;
          if (children) for (i = 0, n = children.length; i < n; ++i) {
            nodes.push(children[i]);
          }
        }
        while (node = next.pop()) {
          callback(node);
        }
        return this;
      }
      function node_sum(value) {
        return this.eachAfter(function(node) {
          var sum = +value(node.data) || 0, children = node.children, i = children && children.length;
          while (--i >= 0) sum += children[i].value;
          node.value = sum;
        });
      }
      function node_sort(compare) {
        return this.eachBefore(function(node) {
          if (node.children) {
            node.children.sort(compare);
          }
        });
      }
      function node_path(end) {
        var start = this, ancestor = leastCommonAncestor(start, end), nodes = [start];
        while (start !== ancestor) {
          start = start.parent;
          nodes.push(start);
        }
        var k = nodes.length;
        while (end !== ancestor) {
          nodes.splice(k, 0, end);
          end = end.parent;
        }
        return nodes;
      }
      function leastCommonAncestor(a, b) {
        if (a === b) return a;
        var aNodes = a.ancestors(), bNodes = b.ancestors(), c = null;
        a = aNodes.pop();
        b = bNodes.pop();
        while (a === b) {
          c = a;
          a = aNodes.pop();
          b = bNodes.pop();
        }
        return c;
      }
      function node_ancestors() {
        var node = this, nodes = [node];
        while (node = node.parent) {
          nodes.push(node);
        }
        return nodes;
      }
      function node_descendants() {
        var nodes = [];
        this.each(function(node) {
          nodes.push(node);
        });
        return nodes;
      }
      function node_leaves() {
        var leaves = [];
        this.eachBefore(function(node) {
          if (!node.children) {
            leaves.push(node);
          }
        });
        return leaves;
      }
      function node_links() {
        var root = this, links = [];
        root.each(function(node) {
          if (node !== root) {
            links.push({ source: node.parent, target: node });
          }
        });
        return links;
      }
      function hierarchy(data, children) {
        var root = new Node3(data), valued = +data.value && (root.value = data.value), node, nodes = [root], child, childs, i, n;
        if (children == null) children = defaultChildren;
        while (node = nodes.pop()) {
          if (valued) node.value = +node.data.value;
          if ((childs = children(node.data)) && (n = childs.length)) {
            node.children = new Array(n);
            for (i = n - 1; i >= 0; --i) {
              nodes.push(child = node.children[i] = new Node3(childs[i]));
              child.parent = node;
              child.depth = node.depth + 1;
            }
          }
        }
        return root.eachBefore(computeHeight);
      }
      function node_copy() {
        return hierarchy(this).eachBefore(copyData);
      }
      function defaultChildren(d) {
        return d.children;
      }
      function copyData(node) {
        node.data = node.data.data;
      }
      function computeHeight(node) {
        var height = 0;
        do
          node.height = height;
        while ((node = node.parent) && node.height < ++height);
      }
      function Node3(data) {
        this.data = data;
        this.depth = this.height = 0;
        this.parent = null;
      }
      Node3.prototype = hierarchy.prototype = {
        constructor: Node3,
        count: node_count,
        each: node_each,
        eachAfter: node_eachAfter,
        eachBefore: node_eachBefore,
        sum: node_sum,
        sort: node_sort,
        path: node_path,
        ancestors: node_ancestors,
        descendants: node_descendants,
        leaves: node_leaves,
        links: node_links,
        copy: node_copy
      };
      var name17 = "d3-flextree";
      var version = "2.1.2";
      var main = "build/d3-flextree.js";
      var module$1 = "index";
      var author = { "name": "Chris Maloney", "url": "http://chrismaloney.org" };
      var description = "Flexible tree layout algorithm that allows for variable node sizes.";
      var keywords = ["d3", "d3-module", "layout", "tree", "hierarchy", "d3-hierarchy", "plugin", "d3-plugin", "infovis", "visualization", "2d"];
      var homepage = "https://github.com/klortho/d3-flextree";
      var license = "WTFPL";
      var repository = { "type": "git", "url": "https://github.com/klortho/d3-flextree.git" };
      var scripts = { "clean": "rm -rf build demo test", "build:demo": "rollup -c --environment BUILD:demo", "build:dev": "rollup -c --environment BUILD:dev", "build:prod": "rollup -c --environment BUILD:prod", "build:test": "rollup -c --environment BUILD:test", "build": "rollup -c", "lint": "eslint index.js src", "test:main": "node test/bundle.js", "test:browser": "node test/browser-tests.js", "test": "npm-run-all test:*", "prepare": "npm-run-all clean build lint test" };
      var dependencies = { "d3-hierarchy": "^1.1.5" };
      var devDependencies = { "babel-plugin-external-helpers": "^6.22.0", "babel-preset-es2015-rollup": "^3.0.0", "d3": "^4.13.0", "d3-selection-multi": "^1.0.1", "eslint": "^4.19.1", "jsdom": "^11.6.2", "npm-run-all": "^4.1.2", "rollup": "^0.55.3", "rollup-plugin-babel": "^2.7.1", "rollup-plugin-commonjs": "^8.0.2", "rollup-plugin-copy": "^0.2.3", "rollup-plugin-json": "^2.3.0", "rollup-plugin-node-resolve": "^3.0.2", "rollup-plugin-uglify": "^3.0.0", "uglify-es": "^3.3.9" };
      var packageInfo = {
        name: name17,
        version,
        main,
        module: module$1,
        author,
        description,
        keywords,
        homepage,
        license,
        repository,
        scripts,
        dependencies,
        devDependencies,
        "jsnext:main": "index"
      };
      var classCallCheck = function(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      };
      var createClass = /* @__PURE__ */ (function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }
        return function(Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      })();
      var inherits = function(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      };
      var possibleConstructorReturn = function(self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      };
      var slicedToArray = /* @__PURE__ */ (function() {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = void 0;
          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);
              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"]) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }
          return _arr;
        }
        return function(arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      })();
      var version$1 = packageInfo.version;
      var defaults$1 = Object.freeze({
        children: function children(data) {
          return data.children;
        },
        nodeSize: function nodeSize(node) {
          return node.data.size;
        },
        spacing: 0
      });
      function flextree2(options) {
        var opts = Object.assign({}, defaults$1, options);
        function accessor(name$$1) {
          var opt = opts[name$$1];
          return typeof opt === "function" ? opt : function() {
            return opt;
          };
        }
        function layout2(tree) {
          var wtree = wrap(getWrapper(), tree, function(node) {
            return node.children;
          });
          wtree.update();
          return wtree.data;
        }
        function getFlexNode() {
          var nodeSize = accessor("nodeSize");
          var _spacing = accessor("spacing");
          return (function(_hierarchy$prototype$) {
            inherits(FlexNode, _hierarchy$prototype$);
            function FlexNode(data) {
              classCallCheck(this, FlexNode);
              return possibleConstructorReturn(this, (FlexNode.__proto__ || Object.getPrototypeOf(FlexNode)).call(this, data));
            }
            createClass(FlexNode, [{
              key: "copy",
              value: function copy() {
                var c = wrap(this.constructor, this, function(node) {
                  return node.children;
                });
                c.each(function(node) {
                  return node.data = node.data.data;
                });
                return c;
              }
            }, {
              key: "spacing",
              value: function spacing(oNode) {
                return _spacing(this, oNode);
              }
            }, {
              key: "size",
              get: function get$$1() {
                return nodeSize(this);
              }
            }, {
              key: "nodes",
              get: function get$$1() {
                return this.descendants();
              }
            }, {
              key: "xSize",
              get: function get$$1() {
                return this.size[0];
              }
            }, {
              key: "ySize",
              get: function get$$1() {
                return this.size[1];
              }
            }, {
              key: "top",
              get: function get$$1() {
                return this.y;
              }
            }, {
              key: "bottom",
              get: function get$$1() {
                return this.y + this.ySize;
              }
            }, {
              key: "left",
              get: function get$$1() {
                return this.x - this.xSize / 2;
              }
            }, {
              key: "right",
              get: function get$$1() {
                return this.x + this.xSize / 2;
              }
            }, {
              key: "root",
              get: function get$$1() {
                var ancs = this.ancestors();
                return ancs[ancs.length - 1];
              }
            }, {
              key: "numChildren",
              get: function get$$1() {
                return this.hasChildren ? this.children.length : 0;
              }
            }, {
              key: "hasChildren",
              get: function get$$1() {
                return !this.noChildren;
              }
            }, {
              key: "noChildren",
              get: function get$$1() {
                return this.children === null;
              }
            }, {
              key: "firstChild",
              get: function get$$1() {
                return this.hasChildren ? this.children[0] : null;
              }
            }, {
              key: "lastChild",
              get: function get$$1() {
                return this.hasChildren ? this.children[this.numChildren - 1] : null;
              }
            }, {
              key: "extents",
              get: function get$$1() {
                return (this.children || []).reduce(function(acc, kid) {
                  return FlexNode.maxExtents(acc, kid.extents);
                }, this.nodeExtents);
              }
            }, {
              key: "nodeExtents",
              get: function get$$1() {
                return {
                  top: this.top,
                  bottom: this.bottom,
                  left: this.left,
                  right: this.right
                };
              }
            }], [{
              key: "maxExtents",
              value: function maxExtents(e0, e1) {
                return {
                  top: Math.min(e0.top, e1.top),
                  bottom: Math.max(e0.bottom, e1.bottom),
                  left: Math.min(e0.left, e1.left),
                  right: Math.max(e0.right, e1.right)
                };
              }
            }]);
            return FlexNode;
          })(hierarchy.prototype.constructor);
        }
        function getWrapper() {
          var FlexNode = getFlexNode();
          var nodeSize = accessor("nodeSize");
          var _spacing2 = accessor("spacing");
          return (function(_FlexNode) {
            inherits(_class, _FlexNode);
            function _class(data) {
              classCallCheck(this, _class);
              var _this2 = possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, data));
              Object.assign(_this2, {
                x: 0,
                y: 0,
                relX: 0,
                prelim: 0,
                shift: 0,
                change: 0,
                lExt: _this2,
                lExtRelX: 0,
                lThr: null,
                rExt: _this2,
                rExtRelX: 0,
                rThr: null
              });
              return _this2;
            }
            createClass(_class, [{
              key: "spacing",
              value: function spacing(oNode) {
                return _spacing2(this.data, oNode.data);
              }
            }, {
              key: "update",
              value: function update() {
                layoutChildren(this);
                resolveX(this);
                return this;
              }
            }, {
              key: "size",
              get: function get$$1() {
                return nodeSize(this.data);
              }
            }, {
              key: "x",
              get: function get$$1() {
                return this.data.x;
              },
              set: function set$$1(v) {
                this.data.x = v;
              }
            }, {
              key: "y",
              get: function get$$1() {
                return this.data.y;
              },
              set: function set$$1(v) {
                this.data.y = v;
              }
            }]);
            return _class;
          })(FlexNode);
        }
        function wrap(FlexClass, treeData, children) {
          var _wrap = function _wrap2(data, parent) {
            var node = new FlexClass(data);
            Object.assign(node, {
              parent,
              depth: parent === null ? 0 : parent.depth + 1,
              height: 0,
              length: 1
            });
            var kidsData = children(data) || [];
            node.children = kidsData.length === 0 ? null : kidsData.map(function(kd) {
              return _wrap2(kd, node);
            });
            if (node.children) {
              Object.assign(node, node.children.reduce(function(hl, kid) {
                return {
                  height: Math.max(hl.height, kid.height + 1),
                  length: hl.length + kid.length
                };
              }, node));
            }
            return node;
          };
          return _wrap(treeData, null);
        }
        Object.assign(layout2, {
          nodeSize: function nodeSize(arg) {
            return arguments.length ? (opts.nodeSize = arg, layout2) : opts.nodeSize;
          },
          spacing: function spacing(arg) {
            return arguments.length ? (opts.spacing = arg, layout2) : opts.spacing;
          },
          children: function children(arg) {
            return arguments.length ? (opts.children = arg, layout2) : opts.children;
          },
          hierarchy: function hierarchy2(treeData, children) {
            var kids = typeof children === "undefined" ? opts.children : children;
            return wrap(getFlexNode(), treeData, kids);
          },
          dump: function dump(tree) {
            var nodeSize = accessor("nodeSize");
            var _dump = function _dump2(i0) {
              return function(node) {
                var i1 = i0 + "  ";
                var i2 = i0 + "    ";
                var x = node.x, y = node.y;
                var size = nodeSize(node);
                var kids = node.children || [];
                var kdumps = kids.length === 0 ? " " : "," + i1 + "children: [" + i2 + kids.map(_dump2(i2)).join(i2) + i1 + "]," + i0;
                return "{ size: [" + size.join(", ") + "]," + i1 + "x: " + x + ", y: " + y + kdumps + "},";
              };
            };
            return _dump("\n")(tree);
          }
        });
        return layout2;
      }
      flextree2.version = version$1;
      var layoutChildren = function layoutChildren2(w) {
        var y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        w.y = y;
        (w.children || []).reduce(function(acc, kid) {
          var _acc = slicedToArray(acc, 2), i = _acc[0], lastLows = _acc[1];
          layoutChildren2(kid, w.y + w.ySize);
          var lowY = (i === 0 ? kid.lExt : kid.rExt).bottom;
          if (i !== 0) separate(w, i, lastLows);
          var lows = updateLows(lowY, i, lastLows);
          return [i + 1, lows];
        }, [0, null]);
        shiftChange(w);
        positionRoot(w);
        return w;
      };
      var resolveX = function resolveX2(w, prevSum, parentX) {
        if (typeof prevSum === "undefined") {
          prevSum = -w.relX - w.prelim;
          parentX = 0;
        }
        var sum = prevSum + w.relX;
        w.relX = sum + w.prelim - parentX;
        w.prelim = 0;
        w.x = parentX + w.relX;
        (w.children || []).forEach(function(k) {
          return resolveX2(k, sum, w.x);
        });
        return w;
      };
      var shiftChange = function shiftChange2(w) {
        (w.children || []).reduce(function(acc, child) {
          var _acc2 = slicedToArray(acc, 2), lastShiftSum = _acc2[0], lastChangeSum = _acc2[1];
          var shiftSum = lastShiftSum + child.shift;
          var changeSum = lastChangeSum + shiftSum + child.change;
          child.relX += changeSum;
          return [shiftSum, changeSum];
        }, [0, 0]);
      };
      var separate = function separate2(w, i, lows) {
        var lSib = w.children[i - 1];
        var curSubtree = w.children[i];
        var rContour = lSib;
        var rSumMods = lSib.relX;
        var lContour = curSubtree;
        var lSumMods = curSubtree.relX;
        var isFirst = true;
        while (rContour && lContour) {
          if (rContour.bottom > lows.lowY) lows = lows.next;
          var dist = rSumMods + rContour.prelim - (lSumMods + lContour.prelim) + rContour.xSize / 2 + lContour.xSize / 2 + rContour.spacing(lContour);
          if (dist > 0 || dist < 0 && isFirst) {
            lSumMods += dist;
            moveSubtree$1(curSubtree, dist);
            distributeExtra(w, i, lows.index, dist);
          }
          isFirst = false;
          var rightBottom = rContour.bottom;
          var leftBottom = lContour.bottom;
          if (rightBottom <= leftBottom) {
            rContour = nextRContour(rContour);
            if (rContour) rSumMods += rContour.relX;
          }
          if (rightBottom >= leftBottom) {
            lContour = nextLContour(lContour);
            if (lContour) lSumMods += lContour.relX;
          }
        }
        if (!rContour && lContour) setLThr(w, i, lContour, lSumMods);
        else if (rContour && !lContour) setRThr(w, i, rContour, rSumMods);
      };
      var moveSubtree$1 = function moveSubtree(subtree, distance) {
        subtree.relX += distance;
        subtree.lExtRelX += distance;
        subtree.rExtRelX += distance;
      };
      var distributeExtra = function distributeExtra2(w, curSubtreeI, leftSibI, dist) {
        var curSubtree = w.children[curSubtreeI];
        var n = curSubtreeI - leftSibI;
        if (n > 1) {
          var delta = dist / n;
          w.children[leftSibI + 1].shift += delta;
          curSubtree.shift -= delta;
          curSubtree.change -= dist - delta;
        }
      };
      var nextLContour = function nextLContour2(w) {
        return w.hasChildren ? w.firstChild : w.lThr;
      };
      var nextRContour = function nextRContour2(w) {
        return w.hasChildren ? w.lastChild : w.rThr;
      };
      var setLThr = function setLThr2(w, i, lContour, lSumMods) {
        var firstChild = w.firstChild;
        var lExt = firstChild.lExt;
        var curSubtree = w.children[i];
        lExt.lThr = lContour;
        var diff = lSumMods - lContour.relX - firstChild.lExtRelX;
        lExt.relX += diff;
        lExt.prelim -= diff;
        firstChild.lExt = curSubtree.lExt;
        firstChild.lExtRelX = curSubtree.lExtRelX;
      };
      var setRThr = function setRThr2(w, i, rContour, rSumMods) {
        var curSubtree = w.children[i];
        var rExt = curSubtree.rExt;
        var lSib = w.children[i - 1];
        rExt.rThr = rContour;
        var diff = rSumMods - rContour.relX - curSubtree.rExtRelX;
        rExt.relX += diff;
        rExt.prelim -= diff;
        curSubtree.rExt = lSib.rExt;
        curSubtree.rExtRelX = lSib.rExtRelX;
      };
      var positionRoot = function positionRoot2(w) {
        if (w.hasChildren) {
          var k0 = w.firstChild;
          var kf = w.lastChild;
          var prelim = (k0.prelim + k0.relX - k0.xSize / 2 + kf.relX + kf.prelim + kf.xSize / 2) / 2;
          Object.assign(w, {
            prelim,
            lExt: k0.lExt,
            lExtRelX: k0.lExtRelX,
            rExt: kf.rExt,
            rExtRelX: kf.rExtRelX
          });
        }
      };
      var updateLows = function updateLows2(lowY, index, lastLows) {
        while (lastLows !== null && lowY >= lastLows.lowY) {
          lastLows = lastLows.next;
        }
        return {
          lowY,
          index,
          next: lastLows
        };
      };
      exports2.flextree = flextree2;
      Object.defineProperty(exports2, "__esModule", { value: true });
    }));
  }
});

// apps/server/src/create-server.ts
import fs2 from "node:fs";

// node_modules/.pnpm/@hono+node-server@1.19.17_hono@4.13.7/node_modules/@hono/node-server/dist/index.mjs
import { createServer as createServerHTTP } from "http";
import { Http2ServerRequest as Http2ServerRequest2, constants as h2constants } from "http2";
import { Http2ServerRequest } from "http2";
import { Readable } from "stream";
import crypto2 from "crypto";
var RequestError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "RequestError";
  }
};
var toRequestError = (e) => {
  if (e instanceof RequestError) {
    return e;
  }
  return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request2 = class extends GlobalRequest {
  constructor(input, options) {
    if (typeof input === "object" && getRequestCache in input) {
      input = input[getRequestCache]();
    }
    if (typeof options?.body?.getReader !== "undefined") {
      ;
      options.duplex ??= "half";
    }
    super(input, options);
  }
};
var newHeadersFromIncoming = (incoming) => {
  const headerRecord = [];
  const rawHeaders = incoming.rawHeaders;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/
    58) {
      headerRecord.push([key, value]);
    }
  }
  return new Headers(headerRecord);
};
var wrapBodyStream = Symbol("wrapBodyStream");
var newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
  const init = {
    method,
    headers,
    signal: abortController.signal
  };
  if (method === "TRACE") {
    init.method = "GET";
    const req = new Request2(url, init);
    Object.defineProperty(req, "method", {
      get() {
        return "TRACE";
      }
    });
    return req;
  }
  if (!(method === "GET" || method === "HEAD")) {
    if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
      init.body = new ReadableStream({
        start(controller) {
          controller.enqueue(incoming.rawBody);
          controller.close();
        }
      });
    } else if (incoming[wrapBodyStream]) {
      let reader;
      init.body = new ReadableStream({
        async pull(controller) {
          try {
            reader ||= Readable.toWeb(incoming).getReader();
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } else {
      init.body = Readable.toWeb(incoming);
    }
  }
  return new Request2(url, init);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var headersKey = Symbol("headersKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var requestPrototype = {
  get method() {
    return this[incomingKey].method || "GET";
  },
  get url() {
    return this[urlKey];
  },
  get headers() {
    return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
  },
  [getAbortController]() {
    this[getRequestCache]();
    return this[abortControllerKey];
  },
  [getRequestCache]() {
    this[abortControllerKey] ||= new AbortController();
    return this[requestCache] ||= newRequestFromIncoming(
      this.method,
      this[urlKey],
      this.headers,
      this[incomingKey],
      this[abortControllerKey]
    );
  }
};
[
  "body",
  "bodyUsed",
  "cache",
  "credentials",
  "destination",
  "integrity",
  "mode",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "keepalive"
].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    get() {
      return this[getRequestCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    value: function() {
      return this[getRequestCache]()[k]();
    }
  });
});
Object.defineProperty(requestPrototype, Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      method: this.method,
      url: this.url,
      headers: this.headers,
      nativeRequest: this[requestCache]
    };
    return `Request (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(requestPrototype, Request2.prototype);
var newRequest = (incoming, defaultHostname) => {
  const req = Object.create(requestPrototype);
  req[incomingKey] = incoming;
  const incomingUrl = incoming.url || "";
  if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
  (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
    if (incoming instanceof Http2ServerRequest) {
      throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
    }
    try {
      const url2 = new URL(incomingUrl);
      req[urlKey] = url2.href;
    } catch (e) {
      throw new RequestError("Invalid absolute URL", { cause: e });
    }
    return req;
  }
  const host = (incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
  if (!host) {
    throw new RequestError("Missing host header");
  }
  let scheme;
  if (incoming instanceof Http2ServerRequest) {
    scheme = incoming.scheme;
    if (!(scheme === "http" || scheme === "https")) {
      throw new RequestError("Unsupported scheme");
    }
  } else {
    scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
  }
  const url = new URL(`${scheme}://${host}${incomingUrl}`);
  if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
    throw new RequestError("Invalid host header");
  }
  req[urlKey] = url.href;
  return req;
};
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = class _Response {
  #body;
  #init;
  [getResponseCache]() {
    delete this[cacheKey];
    return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
  }
  constructor(body, init) {
    let headers;
    this.#body = body;
    if (init instanceof _Response) {
      const cachedGlobalResponse = init[responseCache];
      if (cachedGlobalResponse) {
        this.#init = cachedGlobalResponse;
        this[getResponseCache]();
        return;
      } else {
        this.#init = init.#init;
        headers = new Headers(init.#init.headers);
      }
    } else {
      this.#init = init;
    }
    if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
      ;
      this[cacheKey] = [init?.status || 200, body, headers || init?.headers];
    }
  }
  get headers() {
    const cache = this[cacheKey];
    if (cache) {
      if (!(cache[2] instanceof Headers)) {
        cache[2] = new Headers(
          cache[2] || { "content-type": "text/plain; charset=UTF-8" }
        );
      }
      return cache[2];
    }
    return this[getResponseCache]().headers;
  }
  get status() {
    return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
  }
  get ok() {
    const status = this.status;
    return status >= 200 && status < 300;
  }
};
["body", "bodyUsed", "redirected", "statusText", "trailers", "type", "url"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    get() {
      return this[getResponseCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    value: function() {
      return this[getResponseCache]()[k]();
    }
  });
});
Object.defineProperty(Response2.prototype, Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      status: this.status,
      headers: this.headers,
      ok: this.ok,
      nativeResponse: this[responseCache]
    };
    return `Response (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
async function readWithoutBlocking(readPromise) {
  return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable, currentReadPromise) {
  const cancel = (error) => {
    reader.cancel(error).catch(() => {
    });
  };
  writable.on("close", cancel);
  writable.on("error", cancel);
  (currentReadPromise ?? reader.read()).then(flow, handleStreamError);
  return reader.closed.finally(() => {
    writable.off("close", cancel);
    writable.off("error", cancel);
  });
  function handleStreamError(error) {
    if (error) {
      writable.destroy(error);
    }
  }
  function onDrain() {
    reader.read().then(flow, handleStreamError);
  }
  function flow({ done, value }) {
    try {
      if (done) {
        writable.end();
      } else if (!writable.write(value)) {
        writable.once("drain", onDrain);
      } else {
        return reader.read().then(flow, handleStreamError);
      }
    } catch (e) {
      handleStreamError(e);
    }
  }
}
function writeFromReadableStream(stream, writable) {
  if (stream.locked) {
    throw new TypeError("ReadableStream is locked.");
  } else if (writable.destroyed) {
    return;
  }
  return writeFromReadableStreamDefaultReader(stream.getReader(), writable);
}
var buildOutgoingHttpHeaders = (headers) => {
  const res = {};
  if (!(headers instanceof Headers)) {
    headers = new Headers(headers ?? void 0);
  }
  const cookies = [];
  for (const [k, v] of headers) {
    if (k === "set-cookie") {
      cookies.push(v);
    } else {
      res[k] = v;
    }
  }
  if (cookies.length > 0) {
    res["set-cookie"] = cookies;
  }
  res["content-type"] ??= "text/plain; charset=UTF-8";
  return res;
};
var X_ALREADY_SENT = "x-hono-already-sent";
if (typeof global.crypto === "undefined") {
  global.crypto = crypto2;
}
var outgoingEnded = Symbol("outgoingEnded");
var incomingDraining = Symbol("incomingDraining");
var DRAIN_TIMEOUT_MS = 500;
var MAX_DRAIN_BYTES = 64 * 1024 * 1024;
var drainIncoming = (incoming) => {
  const incomingWithDrainState = incoming;
  if (incoming.destroyed || incomingWithDrainState[incomingDraining]) {
    return;
  }
  incomingWithDrainState[incomingDraining] = true;
  if (incoming instanceof Http2ServerRequest2) {
    try {
      ;
      incoming.stream?.close?.(h2constants.NGHTTP2_NO_ERROR);
    } catch {
    }
    return;
  }
  let bytesRead = 0;
  const cleanup = () => {
    clearTimeout(timer);
    incoming.off("data", onData);
    incoming.off("end", cleanup);
    incoming.off("error", cleanup);
  };
  const forceClose = () => {
    cleanup();
    const socket = incoming.socket;
    if (socket && !socket.destroyed) {
      socket.destroySoon();
    }
  };
  const timer = setTimeout(forceClose, DRAIN_TIMEOUT_MS);
  timer.unref?.();
  const onData = (chunk) => {
    bytesRead += chunk.length;
    if (bytesRead > MAX_DRAIN_BYTES) {
      forceClose();
    }
  };
  incoming.on("data", onData);
  incoming.on("end", cleanup);
  incoming.on("error", cleanup);
  incoming.resume();
};
var handleRequestError = () => new Response(null, {
  status: 400
});
var handleFetchError = (e) => new Response(null, {
  status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500
});
var handleResponseError = (e, outgoing) => {
  const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
  if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
    console.info("The user aborted a request.");
  } else {
    console.error(e);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "Content-Type": "text/plain" });
    }
    outgoing.end(`Error: ${err.message}`);
    outgoing.destroy(err);
  }
};
var flushHeaders = (outgoing) => {
  if ("flushHeaders" in outgoing && outgoing.writable) {
    outgoing.flushHeaders();
  }
};
var responseViaCache = async (res, outgoing) => {
  let [status, body, header] = res[cacheKey];
  let hasContentLength = false;
  if (!header) {
    header = { "content-type": "text/plain; charset=UTF-8" };
  } else if (header instanceof Headers) {
    hasContentLength = header.has("content-length");
    header = buildOutgoingHttpHeaders(header);
  } else if (Array.isArray(header)) {
    const headerObj = new Headers(header);
    hasContentLength = headerObj.has("content-length");
    header = buildOutgoingHttpHeaders(headerObj);
  } else {
    for (const key in header) {
      if (key.length === 14 && key.toLowerCase() === "content-length") {
        hasContentLength = true;
        break;
      }
    }
  }
  if (!hasContentLength) {
    if (typeof body === "string") {
      header["Content-Length"] = Buffer.byteLength(body);
    } else if (body instanceof Uint8Array) {
      header["Content-Length"] = body.byteLength;
    } else if (body instanceof Blob) {
      header["Content-Length"] = body.size;
    }
  }
  outgoing.writeHead(status, header);
  if (typeof body === "string" || body instanceof Uint8Array) {
    outgoing.end(body);
  } else if (body instanceof Blob) {
    outgoing.end(new Uint8Array(await body.arrayBuffer()));
  } else {
    flushHeaders(outgoing);
    await writeFromReadableStream(body, outgoing)?.catch(
      (e) => handleResponseError(e, outgoing)
    );
  }
  ;
  outgoing[outgoingEnded]?.();
};
var isPromise = (res) => typeof res.then === "function";
var responseViaResponseObject = async (res, outgoing, options = {}) => {
  if (isPromise(res)) {
    if (options.errorHandler) {
      try {
        res = await res;
      } catch (err) {
        const errRes = await options.errorHandler(err);
        if (!errRes) {
          return;
        }
        res = errRes;
      }
    } else {
      res = await res.catch(handleFetchError);
    }
  }
  if (cacheKey in res) {
    return responseViaCache(res, outgoing);
  }
  const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
  if (res.body) {
    const reader = res.body.getReader();
    const values = [];
    let done = false;
    let currentReadPromise = void 0;
    if (resHeaderRecord["transfer-encoding"] !== "chunked") {
      let maxReadCount = 2;
      for (let i = 0; i < maxReadCount; i++) {
        currentReadPromise ||= reader.read();
        const chunk = await readWithoutBlocking(currentReadPromise).catch((e) => {
          console.error(e);
          done = true;
        });
        if (!chunk) {
          if (i === 1) {
            await new Promise((resolve) => setTimeout(resolve));
            maxReadCount = 3;
            continue;
          }
          break;
        }
        currentReadPromise = void 0;
        if (chunk.value) {
          values.push(chunk.value);
        }
        if (chunk.done) {
          done = true;
          break;
        }
      }
      if (done && !("content-length" in resHeaderRecord)) {
        resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
      }
    }
    outgoing.writeHead(res.status, resHeaderRecord);
    values.forEach((value) => {
      ;
      outgoing.write(value);
    });
    if (done) {
      outgoing.end();
    } else {
      if (values.length === 0) {
        flushHeaders(outgoing);
      }
      await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
  } else {
    outgoing.writeHead(res.status, resHeaderRecord);
    outgoing.end();
  }
  ;
  outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {}) => {
  const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
  if (options.overrideGlobalObjects !== false && global.Request !== Request2) {
    Object.defineProperty(global, "Request", {
      value: Request2
    });
    Object.defineProperty(global, "Response", {
      value: Response2
    });
  }
  return async (incoming, outgoing) => {
    let res, req;
    try {
      req = newRequest(incoming, options.hostname);
      let incomingEnded = !autoCleanupIncoming || incoming.method === "GET" || incoming.method === "HEAD";
      if (!incomingEnded) {
        ;
        incoming[wrapBodyStream] = true;
        incoming.on("end", () => {
          incomingEnded = true;
        });
        if (incoming instanceof Http2ServerRequest2) {
          ;
          outgoing[outgoingEnded] = () => {
            if (!incomingEnded) {
              setTimeout(() => {
                if (!incomingEnded) {
                  setTimeout(() => {
                    drainIncoming(incoming);
                  });
                }
              });
            }
          };
        }
        outgoing.on("finish", () => {
          if (!incomingEnded) {
            drainIncoming(incoming);
          }
        });
      }
      outgoing.on("close", () => {
        const abortController = req[abortControllerKey];
        if (abortController) {
          if (incoming.errored) {
            req[abortControllerKey].abort(incoming.errored.toString());
          } else if (!outgoing.writableFinished) {
            req[abortControllerKey].abort("Client connection prematurely closed.");
          }
        }
        if (!incomingEnded) {
          setTimeout(() => {
            if (!incomingEnded) {
              setTimeout(() => {
                drainIncoming(incoming);
              });
            }
          });
        }
      });
      res = fetchCallback(req, { incoming, outgoing });
      if (cacheKey in res) {
        return responseViaCache(res, outgoing);
      }
    } catch (e) {
      if (!res) {
        if (options.errorHandler) {
          res = await options.errorHandler(req ? e : toRequestError(e));
          if (!res) {
            return;
          }
        } else if (!req) {
          res = handleRequestError();
        } else {
          res = handleFetchError(e);
        }
      } else {
        return handleResponseError(e, outgoing);
      }
    }
    try {
      return await responseViaResponseObject(res, outgoing, options);
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};
var createAdaptorServer = (options) => {
  const fetchCallback = options.fetch;
  const requestListener = getRequestListener(fetchCallback, {
    hostname: options.hostname,
    overrideGlobalObjects: options.overrideGlobalObjects,
    autoCleanupIncoming: options.autoCleanupIncoming
  });
  const createServer = options.createServer || createServerHTTP;
  const server = createServer(options.serverOptions || {}, requestListener);
  return server;
};
var serve = (options, listeningListener) => {
  const server = createAdaptorServer(options);
  server.listen(options?.port ?? 3e3, options.hostname, () => {
    const serverInfo = server.address();
    listeningListener && listeningListener(serverInfo);
  });
  return server;
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/mime.js
var getMimeType = (filename, mimes = baseMimes) => {
  const regexp = /\.([a-zA-Z0-9]+?)$/;
  const match2 = filename.match(regexp);
  if (!match2) {
    return;
  }
  return mimes[match2[1].toLowerCase()];
};
var _baseMimes = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html; charset=utf-8",
  html: "text/html; charset=utf-8",
  ico: "image/x-icon",
  ics: "text/calendar; charset=utf-8",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript; charset=utf-8",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript; charset=utf-8",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml; charset=utf-8",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain; charset=utf-8",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
};
var baseMimes = _baseMimes;

// node_modules/.pnpm/@hono+node-server@1.19.17_hono@4.13.7/node_modules/@hono/node-server/dist/serve-static.mjs
import { createReadStream, statSync, existsSync } from "fs";
import { join } from "path";
import { versions } from "process";
import { Readable as Readable2 } from "stream";
var COMPRESSIBLE_CONTENT_TYPE_REGEX = /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
var ENCODINGS = {
  br: ".br",
  zstd: ".zst",
  gzip: ".gz"
};
var ENCODINGS_ORDERED_KEYS = Object.keys(ENCODINGS);
var pr54206Applied = () => {
  const [major2, minor] = versions.node.split(".").map((component) => parseInt(component));
  return major2 >= 23 || major2 === 22 && minor >= 7 || major2 === 20 && minor >= 18;
};
var useReadableToWeb = pr54206Applied();
var createStreamBody = (stream) => {
  if (useReadableToWeb) {
    return Readable2.toWeb(stream);
  }
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
      stream.on("end", () => {
        controller.close();
      });
    },
    cancel() {
      stream.destroy();
    }
  });
  return body;
};
var getStats = (path3) => {
  let stats;
  try {
    stats = statSync(path3);
  } catch {
  }
  return stats;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var serveStatic = (options = { root: "" }) => {
  const root = options.root || "";
  const optionPath = options.path;
  if (root !== "" && !existsSync(root)) {
    console.error(`serveStatic: root path '${root}' is not found, are you sure it's correct?`);
  }
  return async (c, next) => {
    if (c.finalized) {
      return next();
    }
    let filename;
    if (optionPath) {
      filename = optionPath;
    } else {
      try {
        filename = tryDecodeURI(c.req.path);
        if (/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(filename)) {
          throw new Error();
        }
      } catch {
        await options.onNotFound?.(c.req.path, c);
        return next();
      }
    }
    let path3 = join(
      root,
      !optionPath && options.rewriteRequestPath ? options.rewriteRequestPath(filename, c) : filename
    );
    let stats = getStats(path3);
    if (stats && stats.isDirectory()) {
      const indexFile = options.index ?? "index.html";
      path3 = join(path3, indexFile);
      stats = getStats(path3);
    }
    if (!stats) {
      await options.onNotFound?.(path3, c);
      return next();
    }
    const mimeType = getMimeType(path3);
    c.header("Content-Type", mimeType || "application/octet-stream");
    if (options.precompressed && (!mimeType || COMPRESSIBLE_CONTENT_TYPE_REGEX.test(mimeType))) {
      const acceptEncodingSet = new Set(
        c.req.header("Accept-Encoding")?.split(",").map((encoding) => encoding.trim())
      );
      for (const encoding of ENCODINGS_ORDERED_KEYS) {
        if (!acceptEncodingSet.has(encoding)) {
          continue;
        }
        const precompressedStats = getStats(path3 + ENCODINGS[encoding]);
        if (precompressedStats) {
          c.header("Content-Encoding", encoding);
          c.header("Vary", "Accept-Encoding", { append: true });
          stats = precompressedStats;
          path3 = path3 + ENCODINGS[encoding];
          break;
        }
      }
    }
    let result;
    const size = stats.size;
    const range = c.req.header("range") || "";
    if (c.req.method == "HEAD" || c.req.method == "OPTIONS") {
      c.header("Content-Length", size.toString());
      c.status(200);
      result = c.body(null);
    } else if (!range) {
      c.header("Content-Length", size.toString());
      result = c.body(createStreamBody(createReadStream(path3)), 200);
    } else {
      c.header("Accept-Ranges", "bytes");
      c.header("Date", stats.birthtime.toUTCString());
      const parts = range.replace(/bytes=/, "").split("-", 2);
      const start = parseInt(parts[0], 10) || 0;
      let end = parseInt(parts[1], 10) || size - 1;
      if (size < end - start + 1) {
        end = size - 1;
      }
      const chunksize = end - start + 1;
      const stream = createReadStream(path3, { start, end });
      c.header("Content-Length", chunksize.toString());
      c.header("Content-Range", `bytes ${start}-${end}/${stats.size}`);
      result = c.body(createStreamBody(stream), 206);
    }
    await options.onFound?.(path3, c);
    return result;
  };
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/url.js
var splitPath = (path3) => {
  const paths = path3.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path3 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path3);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path3) => {
  const groups = [];
  path3 = path3.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path3 };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey2 = `${label}#${next}`;
    if (!patternCache[cacheKey2]) {
      if (match2[2]) {
        patternCache[cacheKey2] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey2, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey2] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey2];
  }
  return null;
};
var tryDecode2 = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI2 = (str) => tryDecode2(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path3 = url.slice(start, end);
      return tryDecodeURI2(path3.includes("%25") ? path3.replace(/%25/g, "%2525") : path3);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path3) => {
  if (path3.charCodeAt(path3.length - 1) !== 63 || !path3.includes(":")) {
    return null;
  }
  const segments = path3.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode2(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name17 = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name17 = _decodeURI(name17);
    }
    keyIndex = nextKeyIndex;
    if (name17 === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name17] && Array.isArray(results[name17]))) {
        results[name17] = [];
      }
      ;
      results[name17].push(value);
    } else {
      results[name17] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path3 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path3;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name17) {
    if (name17) {
      return this.raw.headers.get(name17) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout2) => this.#layout = layout2;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name17, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name17);
    } else if (options?.append) {
      headers.append(name17, value);
    } else {
      headers.set(name17, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object2, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object2),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path3, ...handlers) => {
      for (const p of [path3].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path3, app) {
    const subApp = this.basePath(path3);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path3) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path3);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path3, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path3);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path3, "*"), handler);
    return this;
  }
  #addRoute(method, path3, handler, baseRoutePath) {
    path3 = mergePath(this._basePath, path3);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path: path3,
      method,
      handler
    };
    this.router.add(method, path3, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path3 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path3);
    const c = new Context(request, {
      path: path3,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path3) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path22) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path22];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path22.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path3);
}

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name17 = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name17 && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name17 !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name17, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path3, isStatic) {
    if (isStatic) {
      this.#root.insert(path3.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path3;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path3] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path3) {
  return wildcardRegExpCache[path3] ??= new RegExp(
    `^${path3.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
function findMiddleware(middleware, path3) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path3)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path3) {
    try {
      this.#tries[method].insert(path3, !/\*|\/:/.test(path3));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path3) : e;
    }
  }
  add(method, path3, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path3 === "/*") {
      path3 = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path3)) {
      const re2 = buildWildcardRegExp(path3);
      for (const m of methods) {
        if (!middleware[m][path3]) {
          this.#insertPath(m, path3);
          middleware[m][path3] = findMiddleware(middleware[m], path3) || findMiddleware(middleware[METHOD_NAME_ALL], path3) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re2.test(p) && handlerMap[m][p].push([handler, path3]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path3) || [path3];
    for (const path22 of paths) {
      for (const m of methods) {
        if (!routes[m][path22]) {
          this.#insertPath(m, path22);
          routes[m][path22] = findMiddleware(middleware[m], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || [];
        }
        routes[m][path22].push([handler, path22]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path3 in r) {
        const handlers = r[path3];
        const pathData = trie.paths[path3];
        if (!pathData) {
          staticMap[path3] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path3, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path3, handler]);
  }
  match(method, path3) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path3);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path3, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path3);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path3) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path3);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name17, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path3[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path3.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name17] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name17] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path3, handler) {
    for (const result of checkOptionalParameter(path3) || [path3]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path3) {
    return this.#node.search(method, path3);
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/.pnpm/hono@4.13.7/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    } else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else {
      return () => "";
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (exposeHeadersStr) {
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        c.res.headers.append("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) {
        set("Access-Control-Allow-Methods", allowMethods);
      }
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
        }
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// apps/server/src/create-server.ts
import path2 from "node:path";
import { fileURLToPath } from "node:url";

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs
var import_stream3 = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// packages/graph-store/src/index.ts
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object2) => {
    const keys = [];
    for (const key in object2) {
      if (Object.prototype.hasOwnProperty.call(object2, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path3, errorMaps, issueData } = params;
  const fullPath = [...path3, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path3, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path3;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// packages/shared/src/types.ts
var StylePresetSchema = external_exports.enum([
  "default",
  "title",
  "decision",
  "risk",
  "note",
  "muted",
  "card"
]);
var EdgeKindSchema = external_exports.enum(["hierarchy", "relation"]);
var DensitySchema = external_exports.enum(["comfortable", "compact"]);
var RiskProfileSchema = external_exports.enum(["fast", "strict"]);
var AgentModeSchema = external_exports.enum(["explore", "edit", "critique"]);
var NodeBadgesSchema = external_exports.enum(["off", "icons", "tags"]);
var InspectorModeSchema = external_exports.enum(["selection", "always"]);
var NodeViewModeSchema = external_exports.enum(["bubble", "card"]);
var NodeIconSchema = external_exports.enum([
  "server",
  "database",
  "cloud",
  "person",
  "folder",
  "doc",
  "link",
  "warning",
  "check",
  "star",
  "gear",
  "globe"
]);
var EdgeLineStyleSchema = external_exports.enum(["solid", "dashed", "dotted"]);
var EdgeDirectionSchema = external_exports.enum(["forward", "both", "none"]);
var SearchScopeSchema = external_exports.enum([
  "text",
  "note",
  "tags",
  "description",
  "edge_label",
  "edge_note",
  "all"
]);
var DescriptionSchema = external_exports.record(external_exports.string(), external_exports.unknown());
var AccentColorSchema = external_exports.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
var ViewportSchema = external_exports.object({
  x: external_exports.number(),
  y: external_exports.number(),
  zoom: external_exports.number()
});
var LinkRefSchema = external_exports.object({
  url: external_exports.string().min(1),
  title: external_exports.string().optional()
});
var CanvasPrefsSchema = external_exports.object({
  themeId: external_exports.string().default("abyss"),
  branchColoring: external_exports.boolean().default(true),
  density: DensitySchema.default("comfortable"),
  riskProfile: RiskProfileSchema.default("fast"),
  showRelationEdges: external_exports.boolean().default(true),
  nodeBadges: NodeBadgesSchema.default("icons"),
  showHoverCard: external_exports.boolean().default(true),
  inspectorMode: InspectorModeSchema.default("selection"),
  nodeViewMode: NodeViewModeSchema.default("card")
});
var NodeSchema = external_exports.object({
  id: external_exports.string(),
  canvasId: external_exports.string(),
  text: external_exports.string(),
  /** Longer free-text body. */
  note: external_exports.string().optional(),
  /** Structured knowledge fields (JSON object; keys free-form). */
  description: DescriptionSchema.optional(),
  collapsed: external_exports.boolean().default(false),
  pinned: external_exports.boolean().default(false),
  pos: external_exports.object({ x: external_exports.number(), y: external_exports.number() }).nullable().optional(),
  sidePref: external_exports.union([external_exports.literal(-1), external_exports.literal(0), external_exports.literal(1)]).default(0),
  stylePreset: StylePresetSchema.default("default"),
  version: external_exports.number().int().nonnegative(),
  tags: external_exports.array(external_exports.string()).default([]),
  links: external_exports.array(LinkRefSchema).default([]),
  imageUrl: external_exports.string().optional(),
  dueAt: external_exports.number().optional(),
  startAt: external_exports.number().optional(),
  /** Optional accent stroke/fill override (#RGB / #RRGGBB). */
  accentColor: AccentColorSchema.optional(),
  /** Optional controlled icon id. */
  icon: NodeIconSchema.optional(),
  /** Stable agent-facing alias (unique per canvas, lowercase). */
  alias: external_exports.string().min(1).max(64).optional(),
  createdAt: external_exports.number(),
  updatedAt: external_exports.number(),
  deletedAt: external_exports.number().nullable().optional()
});
var EdgeSchema = external_exports.object({
  id: external_exports.string(),
  canvasId: external_exports.string(),
  from: external_exports.string(),
  to: external_exports.string(),
  kind: EdgeKindSchema,
  isPrimaryParent: external_exports.boolean().default(false),
  order: external_exports.number().default(0),
  label: external_exports.string().optional(),
  tags: external_exports.array(external_exports.string()).default([]),
  note: external_exports.string().optional(),
  /** Relative stroke weight 1–5 (default 1). */
  weight: external_exports.number().min(1).max(5).optional(),
  lineStyle: EdgeLineStyleSchema.optional(),
  direction: EdgeDirectionSchema.optional(),
  version: external_exports.number().int().nonnegative(),
  createdAt: external_exports.number(),
  updatedAt: external_exports.number(),
  deletedAt: external_exports.number().nullable().optional()
});
var CanvasMetaSchema = external_exports.object({
  id: external_exports.string(),
  title: external_exports.string(),
  focusNodeId: external_exports.string().nullable(),
  /** Hidden system root — not shown to users/agents; top-level nodes hang under it. */
  anchorNodeId: external_exports.string().nullable().optional(),
  viewport: ViewportSchema,
  rev: external_exports.number().int().nonnegative(),
  prefs: CanvasPrefsSchema,
  agentMode: AgentModeSchema.default("edit"),
  createdAt: external_exports.number(),
  updatedAt: external_exports.number(),
  deletedAt: external_exports.number().nullable().optional()
});
var ErrorCodeSchema = external_exports.enum([
  "not_found",
  "version_conflict",
  "ambiguous",
  "budget_exceeded",
  "invalid_op",
  "proposal_stale",
  "cycle_rejected",
  "permission_denied",
  "mode_denied"
]);

// packages/shared/src/ops.ts
var OP_TYPES = [
  "create_node",
  "batch_create",
  "batch_link",
  "update_text",
  "update_node_meta",
  "move_node",
  "reorder",
  "set_primary_parent",
  "link",
  "unlink",
  "delete_node",
  "restore_node",
  "set_pinned",
  "set_collapsed",
  "set_style_preset",
  "set_edge_label",
  "update_edge_meta",
  "set_prefs",
  "set_focus",
  "set_viewport",
  "auto_fit"
];
var PosSchema = external_exports.object({ x: external_exports.number(), y: external_exports.number() });
var InlineRelationSchema = external_exports.object({
  to: external_exports.string(),
  kind: external_exports.enum(["hierarchy", "relation"]).default("relation"),
  label: external_exports.string().optional(),
  weight: external_exports.number().min(1).max(5).optional(),
  lineStyle: EdgeLineStyleSchema.optional(),
  direction: EdgeDirectionSchema.optional()
});
var NodeMetaPatchSchema = external_exports.object({
  note: external_exports.string().nullable().optional(),
  description: DescriptionSchema.nullable().optional(),
  tags: external_exports.array(external_exports.string()).optional(),
  links: external_exports.array(LinkRefSchema).optional(),
  imageUrl: external_exports.string().nullable().optional(),
  dueAt: external_exports.number().nullable().optional(),
  startAt: external_exports.number().nullable().optional(),
  accentColor: AccentColorSchema.nullable().optional(),
  icon: NodeIconSchema.nullable().optional(),
  alias: external_exports.string().min(1).max(64).nullable().optional()
});
var EdgeMetaPatchSchema = external_exports.object({
  label: external_exports.string().nullable().optional(),
  tags: external_exports.array(external_exports.string()).optional(),
  note: external_exports.string().nullable().optional(),
  weight: external_exports.number().min(1).max(5).nullable().optional(),
  lineStyle: EdgeLineStyleSchema.nullable().optional(),
  direction: EdgeDirectionSchema.nullable().optional()
});
var CreateNodeFieldsSchema = external_exports.object({
  id: external_exports.string().optional(),
  text: external_exports.string(),
  parentId: external_exports.string().nullable().optional(),
  sidePref: external_exports.union([external_exports.literal(-1), external_exports.literal(0), external_exports.literal(1)]).optional(),
  stylePreset: StylePresetSchema.optional(),
  /** Optional absolute position; implies pinned=true when set. */
  pos: PosSchema.optional(),
  pinned: external_exports.boolean().optional(),
  note: external_exports.string().optional(),
  description: DescriptionSchema.optional(),
  tags: external_exports.array(external_exports.string()).optional(),
  /** URL bookmarks (not graph edges). */
  links: external_exports.array(LinkRefSchema).optional(),
  /** Outgoing graph edges created with this node. */
  relations: external_exports.array(InlineRelationSchema).optional(),
  imageUrl: external_exports.string().optional(),
  dueAt: external_exports.number().optional(),
  startAt: external_exports.number().optional(),
  accentColor: AccentColorSchema.optional(),
  icon: NodeIconSchema.optional(),
  /** Agent-friendly handle; later refs use @alias or bare alias. */
  alias: external_exports.string().min(1).max(64).optional()
});
var OpSchema = external_exports.discriminatedUnion("type", [
  CreateNodeFieldsSchema.extend({
    type: external_exports.literal("create_node")
  }),
  external_exports.object({
    type: external_exports.literal("batch_create"),
    nodes: external_exports.array(CreateNodeFieldsSchema).min(1).max(200)
  }),
  external_exports.object({
    type: external_exports.literal("batch_link"),
    edges: external_exports.array(
      external_exports.object({
        from: external_exports.string(),
        to: external_exports.string(),
        kind: external_exports.enum(["hierarchy", "relation"]).default("relation"),
        label: external_exports.string().optional(),
        asPrimary: external_exports.boolean().optional(),
        weight: external_exports.number().min(1).max(5).optional(),
        lineStyle: EdgeLineStyleSchema.optional(),
        direction: EdgeDirectionSchema.optional()
      })
    ).min(1).max(100)
  }),
  external_exports.object({
    type: external_exports.literal("update_text"),
    nodeId: external_exports.string(),
    text: external_exports.string(),
    expectedVersion: external_exports.number().optional()
  }),
  external_exports.object({
    type: external_exports.literal("update_node_meta"),
    nodeId: external_exports.string(),
    patch: NodeMetaPatchSchema,
    expectedVersion: external_exports.number().optional()
  }),
  external_exports.object({
    type: external_exports.literal("move_node"),
    nodeId: external_exports.string(),
    newParentId: external_exports.string().nullable(),
    sidePref: external_exports.union([external_exports.literal(-1), external_exports.literal(0), external_exports.literal(1)]).optional(),
    order: external_exports.number().optional(),
    expectedVersion: external_exports.number().optional()
  }),
  external_exports.object({
    type: external_exports.literal("reorder"),
    nodeId: external_exports.string(),
    /** Numeric sibling sort key on the primary hierarchy edge (preferred). */
    order: external_exports.number().optional(),
    /**
     * Convenience alias: place after this sibling under the same parent.
     * `null` = move to front. Server resolves to `order` when applying.
     */
    afterSiblingId: external_exports.string().nullable().optional()
  }),
  external_exports.object({
    type: external_exports.literal("set_primary_parent"),
    nodeId: external_exports.string(),
    edgeId: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("link"),
    from: external_exports.string(),
    to: external_exports.string(),
    kind: external_exports.enum(["hierarchy", "relation"]),
    label: external_exports.string().optional(),
    asPrimary: external_exports.boolean().optional(),
    weight: external_exports.number().min(1).max(5).optional(),
    lineStyle: EdgeLineStyleSchema.optional(),
    direction: EdgeDirectionSchema.optional()
  }),
  external_exports.object({
    type: external_exports.literal("unlink"),
    edgeId: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("delete_node"),
    nodeId: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("restore_node"),
    nodeId: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("set_pinned"),
    nodeId: external_exports.string(),
    pinned: external_exports.boolean(),
    pos: PosSchema.optional()
  }),
  external_exports.object({
    type: external_exports.literal("set_collapsed"),
    nodeId: external_exports.string(),
    collapsed: external_exports.boolean()
  }),
  external_exports.object({
    type: external_exports.literal("set_style_preset"),
    nodeId: external_exports.string(),
    stylePreset: StylePresetSchema
  }),
  external_exports.object({
    type: external_exports.literal("set_edge_label"),
    edgeId: external_exports.string(),
    label: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("update_edge_meta"),
    edgeId: external_exports.string(),
    patch: EdgeMetaPatchSchema,
    expectedVersion: external_exports.number().optional()
  }),
  external_exports.object({
    type: external_exports.literal("set_prefs"),
    prefs: external_exports.record(external_exports.unknown())
  }),
  external_exports.object({
    type: external_exports.literal("set_focus"),
    nodeId: external_exports.string()
  }),
  external_exports.object({
    type: external_exports.literal("set_viewport"),
    viewport: ViewportSchema
  }),
  external_exports.object({
    type: external_exports.literal("auto_fit"),
    /** Extra world-space padding around content bbox (default 50). */
    padding: external_exports.number().min(0).max(400).optional()
  })
]);
function coerceOpInput(raw2) {
  if (!raw2 || typeof raw2 !== "object" || Array.isArray(raw2)) return raw2;
  const o = { ...raw2 };
  if (o.type == null) {
    if (typeof o.op === "string") o.type = o.op;
    else if (typeof o.operation === "string") o.type = o.operation;
  }
  delete o.op;
  delete o.operation;
  return o;
}
function parseOps(raw2) {
  if (!Array.isArray(raw2)) {
    return {
      ok: false,
      error: "invalid_op",
      message: "ops must be an array of objects with discriminator field `type` (not `op`).",
      validTypes: OP_TYPES
    };
  }
  if (raw2.length === 0) {
    return {
      ok: false,
      error: "invalid_op",
      message: "ops array is empty",
      validTypes: OP_TYPES
    };
  }
  const coerced = raw2.map(coerceOpInput);
  const parsed = external_exports.array(OpSchema).safeParse(coerced);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const hint = first?.path?.join(".") === "0.type" || String(first?.message || "").includes("discriminator") ? ' Each op MUST use field `type` (e.g. {"type":"create_node","text":"...","parentId":"..."}). Do not use `op`.' : "";
    return {
      ok: false,
      error: "invalid_op",
      message: `Invalid ops: ${first?.message ?? "schema error"}.${hint}`,
      validTypes: OP_TYPES,
      issues: parsed.error.issues.slice(0, 8)
    };
  }
  for (const op of parsed.data) {
    if (op.type === "reorder" && op.order == null && op.afterSiblingId === void 0) {
      return {
        ok: false,
        error: "invalid_op",
        message: 'reorder requires `order` (number) or `afterSiblingId` (sibling id | null for first). Example: {"type":"reorder","nodeId":"...","order":10}',
        validTypes: OP_TYPES
      };
    }
  }
  return { ok: true, ops: parsed.data };
}
var OP_SCHEMA_DOC = {
  discriminator: "type",
  note: "Use `type`, never `op` / `operation`. Prefer batch_create for trees. There is no visible root node \u2014 omit parentId for top-level creates.",
  validTypes: OP_TYPES,
  examples: [
    {
      type: "batch_create",
      nodes: [
        { text: "\u6570\u901A\u4EA7\u54C1\u7EBF", alias: "datacom" },
        {
          text: "\u6570\u636E\u4E2D\u5FC3\u4EA4\u6362\u673A",
          alias: "dc_switch",
          parentId: "@datacom"
        },
        {
          text: "AIOps\u8BCA\u65AD",
          alias: "aiops",
          parentId: "@datacom",
          description: {
            function: "\u6545\u969C\u6839\u56E0\u8BCA\u65AD",
            inputs: ["\u6307\u6807", "\u65E5\u5FD7"],
            sla: "30\u79D2\u5185\u8F93\u51FA"
          },
          relations: [
            { to: "@restart", label: "\u89E6\u53D1\u91CD\u542F", kind: "relation" }
          ]
        },
        { text: "\u81EA\u52A8\u91CD\u542F", alias: "restart", parentId: "@datacom" }
      ],
      _comment: "Two-pass: all nodes first, then parents/relations. Max 200."
    },
    {
      type: "batch_link",
      edges: [
        { from: "@daiyu", to: "@baoyu", kind: "relation", label: "\u77E5\u5DF1" },
        { from: "@baoyu", to: "@baochai", kind: "relation", label: "\u91D1\u7389\u826F\u7F18" }
      ],
      _comment: "Bulk relation/hierarchy links (max 100). Prefer after nodes exist."
    },
    {
      type: "create_node",
      text: "AIOps\u8BCA\u65AD",
      alias: "aiops",
      relations: [{ to: "@restart", label: "\u89E6\u53D1\u91CD\u542F", kind: "relation" }],
      _comment: "relations = graph edges; links = URL bookmarks"
    },
    { type: "create_node", text: "\u8D3E\u5B9D\u7389" },
    {
      type: "create_node",
      text: "\u8D3E\u653F",
      parentId: "<visibleParentId>"
    },
    {
      type: "link",
      from: "<fromNodeId>",
      to: "<toNodeId>",
      kind: "relation",
      label: "\u6728\u77F3\u524D\u76DF"
    },
    {
      type: "create_node",
      text: "AIOps",
      alias: "aiops",
      _comment: "Later refs: parentId:'@aiops' or parentText:'AIOps'"
    },
    {
      type: "create_node",
      text: "\u81EA\u52A8\u91CD\u542F",
      parentId: "@aiops"
    },
    {
      type: "link",
      from: "@aiops",
      to: "\u81EA\u52A8\u91CD\u542F",
      kind: "relation",
      label: "\u8BCA\u65AD\u2192\u91CD\u542F",
      _comment: "from/to accept id, @alias, or unique title. Or use fromText/toText before resolve."
    },
    { type: "update_text", nodeId: "<id>", text: "\u65B0\u6587\u6848" },
    {
      type: "update_node_meta",
      nodeId: "@aiops",
      patch: {
        note: "\u81EA\u7531\u6587\u672C\u5907\u6CE8",
        description: {
          function: "\u6545\u969C\u6839\u56E0\u8BCA\u65AD",
          owner: "SRE\u56E2\u961F"
        },
        tags: ["\u4EBA\u7269", "\u8D3E\u5E9C"],
        links: [{ url: "https://example.com", title: "\u767E\u79D1" }],
        accentColor: "#e74c3c",
        icon: "person",
        alias: "aiops",
        dueAt: null
      }
    },
    {
      type: "update_edge_meta",
      edgeId: "<edgeId>",
      patch: {
        label: "\u914D\u5076",
        tags: ["\u4EB2\u5C5E"],
        weight: 3,
        lineStyle: "dashed",
        direction: "both",
        note: null
      }
    },
    {
      type: "set_pinned",
      nodeId: "<id>",
      pinned: true,
      pos: { x: 120, y: -80 },
      _comment: "Pure position move / lock \u2014 prefer this over move_node"
    },
    {
      type: "move_node",
      nodeId: "<id>",
      newParentId: "<visibleParentId or null for top-level>",
      _comment: "Reparent only (change hierarchy parent). To change x/y only, use set_pinned + pos instead."
    },
    { type: "set_edge_label", edgeId: "<edgeId>", label: "\u914D\u5076" },
    {
      type: "reorder",
      nodeId: "<id>",
      order: 10,
      _comment: "Changes sibling sort; also unpins so auto-layout can move the node visually."
    },
    {
      type: "reorder",
      nodeId: "<id>",
      afterSiblingId: "<siblingId or null for first>",
      _comment: "Optional alias; server resolves to order"
    },
    {
      type: "set_collapsed",
      nodeId: "<id>",
      collapsed: true,
      _comment: "Hides hierarchy descendants from layout/viewport until expanded"
    },
    {
      type: "set_style_preset",
      nodeId: "@baoyu",
      stylePreset: "decision",
      _comment: "Field is stylePreset (not preset). Values: default|title|decision|risk|note|muted|card"
    },
    {
      type: "unlink",
      edgeId: "<edgeId>",
      _comment: "Prefer edgeId when multiple edges exist between the same pair. Sugar from+to(+kind) only works if exactly one live match \u2014 label is ignored."
    },
    {
      type: "unlink",
      from: "@daiyu",
      to: "@baoyu",
      kind: "relation",
      _comment: "Sugar form; fails with ambiguous if >1 edge of that kind between the pair \u2014 then use edgeId."
    },
    {
      type: "restore_node",
      nodeId: "<softDeletedNodeId>",
      _comment: "Restores a soft-deleted node (+ compatible incident edges). Use the same id returned by delete_node; @alias/title of deleted nodes also work."
    },
    {
      type: "auto_fit",
      padding: 50,
      _comment: "Fit camera to content bbox after layout; pair with batch_create"
    }
  ],
  opNotes: {
    batch_create: "Create up to 200 nodes in one op. Two-pass (nodes then parents/relations) so forward @alias refs work. Prefer this over many create_node calls.",
    batch_link: "Create up to 100 edges in one op: {type:'batch_link', edges:[{from,to,kind,label,...}]}. from/to accept id|@alias|title.",
    move_node: "Requires newParentId (visible parent id, or null for top-level). Changes hierarchy parent only \u2014 NOT free-drag. Position \u2192 set_pinned + pos.",
    link: "kind: hierarchy | relation. from/to: node id, @alias, or unique title. Wire sugar: fromText/toText (resolved server-side before apply).",
    unlink: "Remove an edge. Prefer {type:'unlink', edgeId} (exact). Sugar: {from, to, kind?} with id|@alias|title \u2014 server resolves to edgeId when unique. If multiple edges share the same from+to(+kind), sugar is ambiguous \u2192 must use edgeId (label is NOT a disambiguator).",
    set_style_preset: "Field name is stylePreset (not preset). Example: {type:'set_style_preset', nodeId:'@x', stylePreset:'risk'}.",
    restore_node: "Soft-deleted nodes keep their id. Pass that id (or deleted @alias / unique title). Restores compatible incident edges; children already promoted stay under the new parent.",
    create_node: "Omit parentId for top-level. Optional pos pins immediately. Optional alias. Optional relations[] for outgoing graph edges (not URL links). Optional description object.",
    update_node_meta: "Patch note/description/tags/links/imageUrl/dueAt/startAt/accentColor/icon/alias. description is a JSON object (knowledge fields). Null clears scalar fields. links = URL bookmarks.",
    update_edge_meta: "Patch label/tags/note/weight(1-5)/lineStyle(solid|dashed|dotted)/direction(forward|both|none) on an edge.",
    set_edge_label: "Need edgeId from spatial_context.edges or get_subgraph.",
    reorder: 'Sibling order on primary hierarchy edge. Also unpins the node so auto-layout can move it. Example: {"type":"reorder","nodeId":"\u2026","order":0}. Optional afterSiblingId (null=first).',
    set_collapsed: "Recursively hides ALL hierarchy descendants (via primary parent edges) from viewport/layout. Relation-only neighbors stay. Coordinates of collapsed nodes are preserved; expand restores them in place. Does not delete data.",
    auto_fit: "Camera fit to laid-out content. Does not reflow flextree sides. Optional padding (world units, default 50)."
  },
  highRisk: ["delete_node", "move_node", "set_primary_parent"],
  layout: "No visible root. Prefer batch_create for trees. Pin with set_pinned + pos. After big creates, call auto_fit. Agent refs: prefer alias over raw ids.",
  refs: {
    alias: "create_node.alias / batch_create \u2192 reference as @alias in parentId/nodeId/from/to/relations.to / get_subgraph.rootId",
    text: "Unique exact title also works as from/to/parentId; duplicates \u2192 ambiguous error",
    applyResponse: "mindmap_apply_direct returns nodeIdMap { text|@alias \u2192 id }"
  }
};

// packages/shared/src/resolve-ops.ts
function newId(prefix = "n") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function isRefToken(v) {
  return typeof v === "string" && v.length > 0;
}
function normalizeAlias(raw2) {
  return raw2.trim().replace(/^@/, "").toLowerCase();
}
function resolveWireOps(rawOps, liveNodes2, opts) {
  const anchorId = opts?.anchorId ?? null;
  const edges = opts?.edges ?? [];
  const aliasToId = /* @__PURE__ */ new Map();
  const textToIds = /* @__PURE__ */ new Map();
  const deletedAliasToId = /* @__PURE__ */ new Map();
  const deletedTextToIds = /* @__PURE__ */ new Map();
  const knownIds = new Set(liveNodes2.filter((n) => !n.deletedAt).map((n) => n.id));
  const deletedIds = new Set(
    liveNodes2.filter((n) => n.deletedAt && n.id !== anchorId).map((n) => n.id)
  );
  const addText = (map, text2, id) => {
    const key = text2.trim().toLowerCase();
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.includes(id)) list.push(id);
    map.set(key, list);
  };
  for (const n of liveNodes2) {
    if (n.id === anchorId) continue;
    if (n.deletedAt) {
      addText(deletedTextToIds, n.text, n.id);
      if (n.alias) deletedAliasToId.set(normalizeAlias(n.alias), n.id);
      continue;
    }
    addText(textToIds, n.text, n.id);
    if (n.alias) aliasToId.set(normalizeAlias(n.alias), n.id);
  }
  const resolveAlias = (token) => {
    const key = normalizeAlias(token);
    const id = aliasToId.get(key);
    if (!id) {
      return {
        ok: false,
        error: "invalid_op",
        message: `Unknown alias @${key}. Create with alias first, or use mindmap_find.`
      };
    }
    return id;
  };
  const resolveDeletedAlias = (token) => {
    const key = normalizeAlias(token);
    const id = deletedAliasToId.get(key);
    if (!id) {
      return {
        ok: false,
        error: "invalid_op",
        message: `Unknown deleted alias @${key}. Pass the soft-deleted node id from delete_node / history.`
      };
    }
    return id;
  };
  const resolveDeletedText = (text2, field) => {
    const key = text2.trim().toLowerCase();
    const ids = deletedTextToIds.get(key) ?? [];
    if (ids.length === 1) return ids[0];
    if (ids.length > 1) {
      return {
        ok: false,
        error: "ambiguous",
        message: `${field} "${text2}" matches ${ids.length} deleted nodes; use node id`,
        candidates: ids.slice(0, 8).map((id) => {
          const n = liveNodes2.find((x) => x.id === id);
          return { id, text: n?.text ?? id };
        })
      };
    }
    return {
      ok: false,
      error: "invalid_op",
      message: `${field} "${text2}" matched no deleted node. Soft-deleted ids stay valid for restore_node.`
    };
  };
  const resolveText = (text2, field) => {
    const key = text2.trim().toLowerCase();
    const ids = textToIds.get(key) ?? [];
    if (ids.length === 1) return ids[0];
    if (ids.length === 0) {
      const soft = [];
      for (const [t, list] of textToIds) {
        if (t.includes(key) || key.includes(t)) {
          for (const id of list) {
            const n = liveNodes2.find((x) => x.id === id);
            soft.push({
              id,
              text: n?.text ?? [...textToIds.entries()].find(([, v]) => v.includes(id))?.[0] ?? t
            });
          }
        }
      }
      const uniq = [...new Map(soft.map((s) => [s.id, s])).values()];
      if (uniq.length === 1) return uniq[0].id;
      if (uniq.length > 1) {
        return {
          ok: false,
          error: "ambiguous",
          message: `${field}="${text2}" matches multiple nodes; use @alias or exact id`,
          candidates: uniq.slice(0, 8)
        };
      }
      return {
        ok: false,
        error: "invalid_op",
        message: `${field}="${text2}" matched no node. Create it first or check spelling.`
      };
    }
    return {
      ok: false,
      error: "ambiguous",
      message: `${field}="${text2}" matches ${ids.length} nodes with the same title; use @alias`,
      candidates: ids.slice(0, 8).map((id) => ({
        id,
        text: liveNodes2.find((n) => n.id === id)?.text ?? text2
      }))
    };
  };
  const resolveNodeRef = (value, field, mode = "live") => {
    if (value === void 0) return void 0;
    if (value === null) return null;
    if (!isRefToken(value)) {
      return {
        ok: false,
        error: "invalid_op",
        message: `${field} must be a string id, @alias, or omitted`
      };
    }
    if (mode === "deleted") {
      if (value.startsWith("@")) return resolveDeletedAlias(value);
      if (deletedIds.has(value)) return value;
      if (deletedAliasToId.has(normalizeAlias(value))) {
        return deletedAliasToId.get(normalizeAlias(value));
      }
      if (knownIds.has(value)) {
        return {
          ok: false,
          error: "invalid_op",
          message: `${field} ${value} is not deleted; restore_node only targets soft-deleted nodes`
        };
      }
      return resolveDeletedText(value, field);
    }
    if (value.startsWith("@")) return resolveAlias(value);
    if (knownIds.has(value)) return value;
    if (aliasToId.has(normalizeAlias(value))) {
      return aliasToId.get(normalizeAlias(value));
    }
    return resolveText(value, field);
  };
  const registerCreateFields = (fields, path3) => {
    const id = typeof fields.id === "string" && fields.id.length ? fields.id : newId("n");
    fields.id = id;
    knownIds.add(id);
    const text2 = String(fields.text ?? "");
    const aliasRaw = typeof fields.alias === "string" && fields.alias.trim() ? normalizeAlias(fields.alias) : null;
    if (aliasRaw) {
      if (aliasToId.has(aliasRaw) && aliasToId.get(aliasRaw) !== id) {
        return {
          ok: false,
          error: "invalid_op",
          message: `alias "${aliasRaw}" already used by ${aliasToId.get(aliasRaw)} (${path3})`
        };
      }
      fields.alias = aliasRaw;
      aliasToId.set(aliasRaw, id);
    }
    addText(textToIds, text2, id);
    return fields;
  };
  const resolveCreateParentsAndRelations = (fields, path3) => {
    if (fields.parentText != null && fields.parentId == null) {
      const r = resolveText(String(fields.parentText), `${path3}.parentText`);
      if (typeof r !== "string") return r;
      fields.parentId = r;
    }
    delete fields.parentText;
    const parentResolved = resolveNodeRef(fields.parentId, `${path3}.parentId`);
    if (parentResolved && typeof parentResolved === "object" && "ok" in parentResolved) {
      return parentResolved;
    }
    if (parentResolved !== void 0) fields.parentId = parentResolved;
    if (Array.isArray(fields.relations)) {
      const nextRels = [];
      for (let ri = 0; ri < fields.relations.length; ri++) {
        const rel = fields.relations[ri];
        if (!rel || typeof rel !== "object" || Array.isArray(rel)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `${path3}.relations[${ri}] must be an object`
          };
        }
        const r = { ...rel };
        if (r.toText != null && r.to == null) {
          const tr = resolveText(String(r.toText), `${path3}.relations[${ri}].toText`);
          if (typeof tr !== "string") return tr;
          r.to = tr;
        }
        delete r.toText;
        const toR = resolveNodeRef(r.to, `${path3}.relations[${ri}].to`);
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") r.to = toR;
        nextRels.push(r);
      }
      fields.relations = nextRels;
    }
    return fields;
  };
  const out = [];
  const batchTextById = /* @__PURE__ */ new Map();
  for (let i = 0; i < rawOps.length; i++) {
    const raw2 = rawOps[i];
    if (!raw2 || typeof raw2 !== "object" || Array.isArray(raw2)) {
      return {
        ok: false,
        error: "invalid_op",
        message: `ops[${i}] must be an object`
      };
    }
    const op = { ...raw2 };
    const type = String(op.type ?? op.op ?? op.operation ?? "");
    if (type === "batch_create") {
      if (!Array.isArray(op.nodes) || op.nodes.length === 0) {
        return {
          ok: false,
          error: "invalid_op",
          message: `ops[${i}].nodes must be a non-empty array`
        };
      }
      if (op.nodes.length > 200) {
        return {
          ok: false,
          error: "invalid_op",
          message: `batch_create supports at most 200 nodes (got ${op.nodes.length})`
        };
      }
      const registered = [];
      for (let ni = 0; ni < op.nodes.length; ni++) {
        const nraw = op.nodes[ni];
        if (!nraw || typeof nraw !== "object" || Array.isArray(nraw)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `ops[${i}].nodes[${ni}] must be an object`
          };
        }
        const fields = { ...nraw };
        const reg = registerCreateFields(fields, `ops[${i}].nodes[${ni}]`);
        if ("ok" in reg && reg.ok === false) return reg;
        const f = reg;
        batchTextById.set(String(f.id), String(f.text ?? ""));
        registered.push(f);
      }
      const resolvedNodes = [];
      for (let ni = 0; ni < registered.length; ni++) {
        const r = resolveCreateParentsAndRelations(
          registered[ni],
          `ops[${i}].nodes[${ni}]`
        );
        if ("ok" in r && r.ok === false) return r;
        resolvedNodes.push(r);
      }
      op.nodes = resolvedNodes;
      out.push(op);
      continue;
    }
    if (type === "batch_link") {
      if (!Array.isArray(op.edges) || op.edges.length === 0) {
        return {
          ok: false,
          error: "invalid_op",
          message: `ops[${i}].edges must be a non-empty array`
        };
      }
      if (op.edges.length > 100) {
        return {
          ok: false,
          error: "invalid_op",
          message: `batch_link supports at most 100 edges (got ${op.edges.length})`
        };
      }
      const resolvedEdges = [];
      for (let ei = 0; ei < op.edges.length; ei++) {
        const eraw = op.edges[ei];
        if (!eraw || typeof eraw !== "object" || Array.isArray(eraw)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `ops[${i}].edges[${ei}] must be an object`
          };
        }
        const e = { ...eraw };
        if (e.fromText != null && e.from == null) {
          const r = resolveText(String(e.fromText), `edges[${ei}].fromText`);
          if (typeof r !== "string") return r;
          e.from = r;
        }
        if (e.toText != null && e.to == null) {
          const r = resolveText(String(e.toText), `edges[${ei}].toText`);
          if (typeof r !== "string") return r;
          e.to = r;
        }
        delete e.fromText;
        delete e.toText;
        const fromR = resolveNodeRef(e.from, `edges[${ei}].from`);
        if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
        if (typeof fromR === "string") e.from = fromR;
        const toR = resolveNodeRef(e.to, `edges[${ei}].to`);
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") e.to = toR;
        if (!e.kind) e.kind = "relation";
        resolvedEdges.push(e);
      }
      op.edges = resolvedEdges;
      out.push(op);
      continue;
    }
    if (type === "create_node") {
      const reg = registerCreateFields(op, `ops[${i}]`);
      if ("ok" in reg && reg.ok === false) return reg;
      Object.assign(op, reg);
      batchTextById.set(String(op.id), String(op.text ?? ""));
      const resolved = resolveCreateParentsAndRelations(op, `ops[${i}]`);
      if ("ok" in resolved && resolved.ok === false) {
        return resolved;
      }
      Object.assign(op, resolved);
      out.push(op);
      continue;
    }
    if (type === "link") {
      if (op.fromText != null && op.from == null) {
        const r = resolveText(String(op.fromText), "fromText");
        if (typeof r !== "string") return r;
        op.from = r;
      }
      if (op.toText != null && op.to == null) {
        const r = resolveText(String(op.toText), "toText");
        if (typeof r !== "string") return r;
        op.to = r;
      }
      delete op.fromText;
      delete op.toText;
      const fromR = resolveNodeRef(op.from, "from");
      if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
      if (typeof fromR === "string") op.from = fromR;
      const toR = resolveNodeRef(op.to, "to");
      if (toR && typeof toR === "object" && "ok" in toR) return toR;
      if (typeof toR === "string") op.to = toR;
      out.push(op);
      continue;
    }
    if (type === "restore_node") {
      if (op.nodeText != null && op.nodeId == null) {
        const r2 = resolveDeletedText(String(op.nodeText), "nodeText");
        if (typeof r2 !== "string") return r2;
        op.nodeId = r2;
      }
      delete op.nodeText;
      const r = resolveNodeRef(op.nodeId, "nodeId", "deleted");
      if (r && typeof r === "object" && "ok" in r) return r;
      if (typeof r === "string") op.nodeId = r;
      out.push(op);
      continue;
    }
    if (type === "unlink") {
      if (op.fromText != null && op.from == null) {
        const r = resolveText(String(op.fromText), "fromText");
        if (typeof r !== "string") return r;
        op.from = r;
      }
      if (op.toText != null && op.to == null) {
        const r = resolveText(String(op.toText), "toText");
        if (typeof r !== "string") return r;
        op.to = r;
      }
      delete op.fromText;
      delete op.toText;
      if (!op.edgeId) {
        const fromR = resolveNodeRef(op.from, "from");
        if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
        if (typeof fromR === "string") op.from = fromR;
        const toR = resolveNodeRef(op.to, "to");
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") op.to = toR;
        const from = typeof op.from === "string" ? op.from : null;
        const to = typeof op.to === "string" ? op.to : null;
        if (!from || !to) {
          return {
            ok: false,
            error: "invalid_op",
            message: "unlink needs edgeId, or from+to (id|@alias|title). Optional kind: hierarchy|relation."
          };
        }
        const kind = op.kind === "hierarchy" || op.kind === "relation" ? op.kind : void 0;
        const match2 = (a, b) => edges.filter(
          (e) => !e.deletedAt && e.from === a && e.to === b && (kind == null || e.kind === kind)
        );
        let hits = match2(from, to);
        if (!hits.length) hits = match2(to, from);
        if (!hits.length) {
          return {
            ok: false,
            error: "invalid_op",
            message: `No live edge between ${from} and ${to}${kind ? ` (kind=${kind})` : ""}. Use mindmap_get_edge / spatial_context.edges for edgeId.`
          };
        }
        if (hits.length > 1) {
          return {
            ok: false,
            error: "ambiguous",
            message: `${hits.length} edges between those nodes; pass edgeId or kind`,
            candidates: hits.slice(0, 8).map((e) => ({
              id: e.id,
              text: `${e.kind}${e.label ? `:${e.label}` : ""} ${e.from}\u2192${e.to}`
            }))
          };
        }
        op.edgeId = hits[0].id;
      }
      delete op.from;
      delete op.to;
      delete op.kind;
      out.push(op);
      continue;
    }
    if (op.nodeText != null && op.nodeId == null) {
      const r = resolveText(String(op.nodeText), "nodeText");
      if (typeof r !== "string") return r;
      op.nodeId = r;
    }
    delete op.nodeText;
    for (const field of [
      "nodeId",
      "newParentId",
      "afterSiblingId",
      "from",
      "to",
      "parentId"
    ]) {
      if (op[field] === void 0) continue;
      const r = resolveNodeRef(op[field], field);
      if (r && typeof r === "object" && "ok" in r) return r;
      if (r !== void 0) op[field] = r;
    }
    out.push(op);
  }
  const nodeIdMap = {};
  for (const [alias, id] of aliasToId) {
    nodeIdMap[`@${alias}`] = id;
    nodeIdMap[alias] = id;
  }
  for (const [text2, ids] of textToIds) {
    if (ids.length === 1) {
      const id = ids[0];
      const label = batchTextById.get(id) ?? liveNodes2.find((n) => n.id === id)?.text ?? text2;
      nodeIdMap[label] = id;
    }
  }
  return { ok: true, ops: out, nodeIdMap };
}
function buildNodeIdMap(nodes, opts) {
  const map = {};
  const anchorId = opts?.anchorId ?? null;
  for (const n of nodes) {
    if (n.deletedAt || n.id === anchorId) continue;
    if (opts?.onlyIds && !opts.onlyIds.has(n.id)) continue;
    map[n.text] = n.id;
    if (n.alias) {
      map[n.alias] = n.id;
      map[`@${n.alias}`] = n.id;
    }
  }
  return map;
}

// packages/shared/src/graph-query.ts
function nodeFunction(n) {
  const d = n.description;
  if (!d || typeof d !== "object") return void 0;
  if (typeof d.function === "string" && d.function.trim()) return d.function.trim();
  if (typeof d.summary === "string" && d.summary.trim()) return d.summary.trim();
  return void 0;
}
function toCompactNode(n) {
  const fn = nodeFunction(n);
  return {
    id: n.id,
    text: n.text,
    ...n.alias ? { alias: n.alias } : {},
    ...fn ? { function: fn } : {}
  };
}
function textOf(byId, id) {
  return byId.get(id)?.text ?? id;
}
function toCompactEdge(e, byId) {
  return {
    id: e.id,
    from: e.from,
    to: e.to,
    fromText: textOf(byId, e.from),
    toText: textOf(byId, e.to),
    kind: e.kind,
    ...e.label ? { label: e.label } : {},
    ...e.direction ? { direction: e.direction } : {},
    ...e.weight != null ? { weight: e.weight } : {},
    ...e.lineStyle ? { lineStyle: e.lineStyle } : {},
    ...e.note ? { note: e.note } : {},
    ...e.tags?.length ? { tags: e.tags } : {}
  };
}
function toPathEdge(e) {
  return {
    id: e.id,
    label: e.label ?? null,
    ...e.direction ? { direction: e.direction } : {},
    ...e.weight != null ? { weight: e.weight } : {},
    ...e.lineStyle ? { lineStyle: e.lineStyle } : {},
    ...e.note ? { note: e.note } : {}
  };
}
function filterEdges(edges, edgeKinds = "all") {
  if (edgeKinds === "all") return edges.filter((e) => !e.deletedAt);
  return edges.filter((e) => !e.deletedAt && e.kind === edgeKinds);
}
function buildAdj(edges, direction) {
  const adj = /* @__PURE__ */ new Map();
  const add = (from, to, edge) => {
    const list = adj.get(from) ?? [];
    list.push({ to, edge });
    adj.set(from, list);
  };
  for (const e of edges) {
    if (direction === "out" || direction === "both") add(e.from, e.to, e);
    if (direction === "in" || direction === "both") add(e.to, e.from, e);
  }
  return adj;
}
function queryNeighbors(input) {
  const depth = Math.max(1, Math.min(6, input.depth ?? 1));
  const direction = input.direction ?? "both";
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const live = filterEdges(input.edges, input.edgeKinds ?? "all");
  const adj = buildAdj(live, direction);
  const keep = /* @__PURE__ */ new Set([input.nodeId]);
  const usedEdges = /* @__PURE__ */ new Set();
  let frontier = [input.nodeId];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const id of frontier) {
      for (const { to, edge } of adj.get(id) ?? []) {
        usedEdges.add(edge.id);
        if (!keep.has(to)) {
          keep.add(to);
          next.push(to);
        }
      }
    }
    frontier = next;
  }
  const nodes = [...keep].map((id) => byId.get(id)).filter((n) => n != null && !n.deletedAt).map(toCompactNode);
  const edges = live.filter((e) => usedEdges.has(e.id) && keep.has(e.from) && keep.has(e.to)).map((e) => toCompactEdge(e, byId));
  return {
    rootId: input.nodeId,
    nodes,
    edges,
    citedNodeIds: [...keep]
  };
}
function queryPaths(input) {
  const throughRelationNodes = input.throughRelationNodes !== false;
  let maxHops = Math.max(
    1,
    Math.min(12, input.maxHops ?? input.maxDepth ?? 8)
  );
  if (!throughRelationNodes) maxHops = 1;
  const maxPaths = Math.max(1, Math.min(20, input.maxPaths ?? 5));
  const direction = input.direction ?? (throughRelationNodes ? "both" : "out");
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const live = filterEdges(input.edges, input.edgeKinds ?? "all");
  const adj = buildAdj(live, direction);
  const paths = [];
  let totalPathsFound = 0;
  const enumerateCap = Math.max(maxPaths, Math.min(200, maxPaths * 20));
  const queue = [
    {
      node: input.fromId,
      path: [input.fromId],
      pathEdges: [],
      visited: /* @__PURE__ */ new Set([input.fromId])
    }
  ];
  while (queue.length) {
    const cur = queue.shift();
    const hops = cur.pathEdges.length;
    if (cur.node === input.toId && hops > 0) {
      totalPathsFound += 1;
      if (paths.length < maxPaths) {
        paths.push({
          nodeIds: cur.path,
          texts: cur.path.map((id) => textOf(byId, id)),
          edgeLabels: cur.pathEdges.map((e) => e.label ?? null),
          edges: cur.pathEdges.map(toPathEdge),
          hops
        });
      }
      if (totalPathsFound >= enumerateCap) break;
      continue;
    }
    if (hops >= maxHops) continue;
    for (const { to, edge } of adj.get(cur.node) ?? []) {
      if (cur.visited.has(to)) continue;
      const visited = new Set(cur.visited);
      visited.add(to);
      queue.push({
        node: to,
        path: [...cur.path, to],
        pathEdges: [...cur.pathEdges, edge],
        visited
      });
    }
  }
  const truncated = totalPathsFound > paths.length;
  const cited = /* @__PURE__ */ new Set();
  const edgeIds = /* @__PURE__ */ new Set();
  for (const p of paths) {
    for (const id of p.nodeIds) cited.add(id);
    for (const e of p.edges) edgeIds.add(e.id);
  }
  return {
    paths,
    nodes: [...cited].map((id) => byId.get(id)).filter((n) => n != null).map(toCompactNode),
    edges: live.filter((e) => edgeIds.has(e.id)).map((e) => toCompactEdge(e, byId)),
    citedNodeIds: [...cited],
    truncated,
    maxPaths,
    pathsReturned: paths.length,
    totalPathsFound,
    omittedPaths: Math.max(0, totalPathsFound - paths.length),
    maxHops,
    throughRelationNodes
  };
}
function queryStats(input) {
  const edgeKinds = input.edgeKinds ?? "all";
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const allEdges = input.edges.filter((e) => !e.deletedAt);
  const edges = filterEdges(input.edges, edgeKinds);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const connected = /* @__PURE__ */ new Set();
  for (const e of edges) {
    if (nodeIds.has(e.from)) connected.add(e.from);
    if (nodeIds.has(e.to)) connected.add(e.to);
  }
  const orphans = nodes.filter((n) => !connected.has(n.id)).length;
  const orphanDef = edgeKinds === "relation" ? "Nodes with degree 0 on the relation-only subgraph (no relation edges). Not global isolates \u2014 hierarchy links are ignored in this view." : edgeKinds === "hierarchy" ? "Nodes with degree 0 on the hierarchy-only subgraph (no hierarchy edges). Relation-only nodes count here." : "Nodes with degree 0 on the full graph (no hierarchy or relation edges).";
  const orphanAliases = edgeKinds === "relation" ? { nodesWithoutRelation: orphans } : edgeKinds === "hierarchy" ? { nodesWithoutHierarchy: orphans } : {};
  const adj = /* @__PURE__ */ new Map();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    adj.get(e.from).push(e.to);
    adj.get(e.to).push(e.from);
  }
  const seen = /* @__PURE__ */ new Set();
  const componentLists = [];
  for (const id of nodeIds) {
    if (seen.has(id)) continue;
    const q = [id];
    seen.add(id);
    const members = [];
    while (q.length) {
      const cur = q.pop();
      members.push(cur);
      for (const nxt of adj.get(cur) ?? []) {
        if (seen.has(nxt)) continue;
        seen.add(nxt);
        q.push(nxt);
      }
    }
    members.sort();
    componentLists.push(members);
  }
  componentLists.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  const connectedComponents = {
    count: componentLists.length,
    edgeKinds,
    components: componentLists.slice(0, 40).map((ids) => ({
      size: ids.length,
      nodeIds: ids.slice(0, 24),
      texts: ids.slice(0, 24).map((id) => byId.get(id)?.text ?? id)
    }))
  };
  const islands = connectedComponents.count;
  const children = /* @__PURE__ */ new Map();
  for (const e of allEdges) {
    if (e.kind !== "hierarchy" || !e.isPrimaryParent) continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  let childSum = 0;
  let parents = 0;
  for (const [, list] of children) {
    parents += 1;
    childSum += list.length;
  }
  let deepestDepth = 0;
  const roots = [...nodeIds].filter((id) => {
    return !allEdges.some(
      (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.to === id && nodeIds.has(e.from)
    );
  });
  for (const root of roots) {
    const q = [{ id: root, d: 0 }];
    const vis = /* @__PURE__ */ new Set([root]);
    while (q.length) {
      const { id, d } = q.shift();
      deepestDepth = Math.max(deepestDepth, d);
      for (const c of children.get(id) ?? []) {
        if (vis.has(c)) continue;
        vis.add(c);
        q.push({ id: c, d: d + 1 });
      }
    }
  }
  const degree = /* @__PURE__ */ new Map();
  for (const id of nodeIds) degree.set(id, 0);
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  let mostConnected = null;
  for (const [id, deg] of degree) {
    if (!mostConnected || deg > mostConnected.degree) {
      mostConnected = {
        nodeId: id,
        text: byId.get(id)?.text ?? id,
        degree: deg,
        edgeKinds
      };
    }
  }
  if (mostConnected && mostConnected.degree === 0) mostConnected = null;
  let longestPath = null;
  const bfsFarthest = (start) => {
    const dist = /* @__PURE__ */ new Map([[start, 0]]);
    const q = [start];
    let far = start;
    while (q.length) {
      const cur = q.shift();
      const d = dist.get(cur);
      if (d > (dist.get(far) ?? 0)) far = cur;
      for (const nxt of adj.get(cur) ?? []) {
        if (dist.has(nxt)) continue;
        dist.set(nxt, d + 1);
        q.push(nxt);
      }
    }
    return { far, hops: dist.get(far) ?? 0 };
  };
  const starts = nodes.slice(0, 200).map((n) => n.id);
  for (const start of starts) {
    const { far, hops } = bfsFarthest(start);
    if (hops > 0 && (!longestPath || hops > longestPath.hops)) {
      longestPath = {
        hops,
        from: start,
        to: far,
        fromText: byId.get(start)?.text ?? start,
        toText: byId.get(far)?.text ?? far,
        edgeKinds
      };
    }
  }
  return {
    nodeCount: nodes.length,
    edgeCount: allEdges.length,
    hierarchyEdgeCount: allEdges.filter((e) => e.kind === "hierarchy").length,
    relationEdgeCount: allEdges.filter((e) => e.kind === "relation").length,
    orphanNodes: orphans,
    orphanDef,
    ...orphanAliases,
    islands,
    connectedComponents,
    avgChildrenPerNode: parents ? Math.round(childSum / parents * 10) / 10 : 0,
    deepestDepth,
    nodesWithoutDescription: nodes.filter(
      (n) => !n.description || Object.keys(n.description).length === 0
    ).length,
    nodesWithoutFunction: nodes.filter((n) => {
      if (!n.description || Object.keys(n.description).length === 0) return false;
      return !nodeFunction(n);
    }).length,
    edgesWithoutLabel: allEdges.filter((e) => !e.label?.trim()).length,
    longestPath,
    mostConnected
  };
}
function queryOrphans(input) {
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const edges = input.edges.filter((e) => !e.deletedAt);
  const connected = /* @__PURE__ */ new Set();
  for (const e of edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  const orphans = nodes.filter((n) => !connected.has(n.id));
  return {
    nodes: orphans.map(toCompactNode),
    citedNodeIds: orphans.map((n) => n.id)
  };
}
function queryMissingMeta(input) {
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const edges = input.edges.filter((e) => !e.deletedAt);
  const withoutDesc = nodes.filter(
    (n) => !n.description || Object.keys(n.description).length === 0
  );
  const withoutFn = nodes.filter((n) => {
    if (!n.description || Object.keys(n.description).length === 0) return false;
    return !nodeFunction(n);
  });
  const withoutLabel = edges.filter((e) => !e.label?.trim());
  const cited = /* @__PURE__ */ new Set([
    ...withoutDesc.map((n) => n.id),
    ...withoutFn.map((n) => n.id),
    ...withoutLabel.flatMap((e) => [e.from, e.to])
  ]);
  return {
    nodesWithoutDescription: withoutDesc.map(toCompactNode),
    nodesWithoutFunction: withoutFn.map(toCompactNode),
    edgesWithoutLabel: withoutLabel.map((e) => toCompactEdge(e, byId)),
    citedNodeIds: [...cited]
  };
}
function resolveQueryNodeRef(nodes, token, opts) {
  const raw2 = token.trim();
  if (!raw2) {
    return { ok: false, error: "not_found", message: "empty node ref" };
  }
  const anchorId = opts?.anchorId ?? null;
  const live = nodes.filter((n) => !n.deletedAt && n.id !== anchorId);
  if (live.some((n) => n.id === raw2)) return { ok: true, id: raw2 };
  const aliasKey = raw2.replace(/^@/, "").toLowerCase();
  const byAlias = live.filter((n) => n.alias === aliasKey);
  if (byAlias.length === 1) return { ok: true, id: byAlias[0].id };
  if (byAlias.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `alias @${aliasKey} matches multiple nodes`,
      candidates: byAlias.slice(0, 8).map((n) => ({ id: n.id, text: n.text }))
    };
  }
  const key = raw2.toLowerCase();
  const exact = live.filter((n) => n.text.trim().toLowerCase() === key);
  if (exact.length === 1) return { ok: true, id: exact[0].id };
  if (exact.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `title "${raw2}" matches ${exact.length} nodes; use @alias`,
      candidates: exact.slice(0, 8).map((n) => ({ id: n.id, text: n.text }))
    };
  }
  const soft = live.filter(
    (n) => n.text.toLowerCase().includes(key) || key.includes(n.text.toLowerCase()) || n.alias && n.alias.includes(aliasKey)
  );
  if (soft.length === 1) return { ok: true, id: soft[0].id };
  if (soft.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `"${raw2}" is ambiguous`,
      candidates: soft.slice(0, 8).map((n) => ({ id: n.id, text: n.text }))
    };
  }
  return {
    ok: false,
    error: "not_found",
    message: `No node matched "${raw2}". Use mindmap_find or create it first.`
  };
}

// packages/shared/src/index.ts
function now() {
  return Date.now();
}
function newId2(prefix = "n") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function computeFitViewport(positions, opts) {
  const pad = opts?.padding ?? 50;
  const viewW = opts?.viewW ?? 1280;
  const viewH = opts?.viewH ?? 800;
  const nodeW = opts?.nodeW ?? 160;
  const nodeH = opts?.nodeH ?? 44;
  const pts = Object.values(positions);
  if (!pts.length) return { x: 0, y: 0, zoom: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x - nodeW / 2);
    maxX = Math.max(maxX, p.x + nodeW / 2);
    minY = Math.min(minY, p.y - nodeH / 2);
    maxY = Math.max(maxY, p.y + nodeH / 2);
  }
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;
  const bw = Math.max(40, maxX - minX);
  const bh = Math.max(40, maxY - minY);
  const zoom = Math.min(
    2.5,
    Math.max(0.12, Math.min(viewW * 0.86 / bw, viewH * 0.86 / bh))
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: -cx * zoom, y: -cy * zoom, zoom };
}

// packages/graph-core/src/index.ts
var GraphError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "GraphError";
  }
};
function liveNodes(g) {
  return [...g.nodes.values()].filter((n) => !n.deletedAt);
}
function liveEdges(g) {
  return [...g.edges.values()].filter((e) => !e.deletedAt);
}
function wouldCreateHierarchyCycle(g, from, to) {
  const children = /* @__PURE__ */ new Map();
  for (const e of liveEdges(g)) {
    if (e.kind !== "hierarchy") continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  const stack = [to];
  const seen = /* @__PURE__ */ new Set();
  while (stack.length) {
    const cur = stack.pop();
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const c of children.get(cur) ?? []) stack.push(c);
  }
  return false;
}
function clearPrimaryForTarget(g, to) {
  for (const e of liveEdges(g)) {
    if (e.kind === "hierarchy" && e.to === to && e.isPrimaryParent) {
      e.isPrimaryParent = false;
      e.version += 1;
      e.updatedAt = now();
    }
  }
}
function promoteChildrenOnDelete(g, nodeId) {
  const inverse = [];
  const node = g.nodes.get(nodeId);
  if (!node) return inverse;
  let primaryParentId = null;
  for (const e of liveEdges(g)) {
    if (e.kind === "hierarchy" && e.to === nodeId && e.isPrimaryParent) {
      primaryParentId = e.from;
      break;
    }
  }
  const childEdges = liveEdges(g).filter(
    (e) => e.kind === "hierarchy" && e.from === nodeId
  );
  for (const ce of childEdges) {
    ce.deletedAt = now();
    ce.version += 1;
    inverse.push({ type: "link", from: nodeId, to: ce.to, kind: "hierarchy", asPrimary: ce.isPrimaryParent, label: ce.label });
    if (primaryParentId) {
      const id = newId2("e");
      const t = now();
      clearPrimaryForTarget(g, ce.to);
      g.edges.set(id, {
        id,
        canvasId: g.canvas.id,
        from: primaryParentId,
        to: ce.to,
        kind: "hierarchy",
        isPrimaryParent: true,
        order: ce.order,
        tags: [],
        version: 1,
        createdAt: t,
        updatedAt: t
      });
      inverse.push({ type: "unlink", edgeId: id });
    }
  }
  return inverse;
}
function createEmptyGraph(title = "\u672A\u547D\u540D\u753B\u5E03", rootText) {
  const canvasId = newId2("c");
  const nodeId = newId2("n");
  const t = now();
  const prefs = {
    themeId: "abyss",
    branchColoring: true,
    density: "comfortable",
    riskProfile: "fast",
    showRelationEdges: true,
    nodeBadges: "icons",
    showHoverCard: true,
    inspectorMode: "selection",
    nodeViewMode: "card"
  };
  const canvas = {
    id: canvasId,
    title,
    focusNodeId: nodeId,
    anchorNodeId: nodeId,
    viewport: { x: 0, y: 0, zoom: 1 },
    rev: 0,
    prefs,
    agentMode: "edit",
    createdAt: t,
    updatedAt: t
  };
  const node = {
    id: nodeId,
    canvasId,
    text: rootText ?? title,
    collapsed: false,
    pinned: false,
    sidePref: 0,
    stylePreset: "title",
    version: 1,
    tags: [],
    links: [],
    createdAt: t,
    updatedAt: t
  };
  return {
    canvas,
    nodes: /* @__PURE__ */ new Map([[nodeId, node]]),
    edges: /* @__PURE__ */ new Map()
  };
}
function resolveAnchorNodeId(g) {
  if (g.canvas.anchorNodeId && g.nodes.get(g.canvas.anchorNodeId) && !g.nodes.get(g.canvas.anchorNodeId).deletedAt) {
    return g.canvas.anchorNodeId;
  }
  for (const n of g.nodes.values()) {
    if (n.deletedAt) continue;
    if (n.stylePreset !== "title") continue;
    const hasParent = [...g.edges.values()].some(
      (e) => e.kind === "hierarchy" && e.isPrimaryParent && !e.deletedAt && e.to === n.id
    );
    if (!hasParent) {
      g.canvas.anchorNodeId = n.id;
      return n.id;
    }
  }
  return g.canvas.focusNodeId;
}
function isAnchorNode(g, nodeId) {
  return resolveAnchorNodeId(g) === nodeId;
}
function cloneGraph(g) {
  return {
    canvas: { ...g.canvas, prefs: { ...g.canvas.prefs }, viewport: { ...g.canvas.viewport } },
    nodes: new Map(
      [...g.nodes.entries()].map(([k, v]) => [
        k,
        {
          ...v,
          tags: [...v.tags ?? []],
          links: (v.links ?? []).map((l) => ({ ...l })),
          description: v.description ? { ...v.description } : void 0
        }
      ])
    ),
    edges: new Map(
      [...g.edges.entries()].map(([k, v]) => [
        k,
        { ...v, tags: [...v.tags ?? []] }
      ])
    )
  };
}
function assertAliasUnique(g, alias, selfId) {
  if (!alias) return;
  for (const other of g.nodes.values()) {
    if (!other.deletedAt && other.id !== selfId && other.alias === alias) {
      throw new GraphError(
        "invalid_op",
        `alias "${alias}" already used by ${other.id}`
      );
    }
  }
}
function addOutgoingRelations(g, fromId, relations, affected) {
  if (!relations?.length) return;
  const t = now();
  for (const rel of relations) {
    if (!g.nodes.get(rel.to) || g.nodes.get(rel.to).deletedAt) {
      throw new GraphError("not_found", rel.to);
    }
    const kind = rel.kind ?? "relation";
    if (kind === "hierarchy" && wouldCreateHierarchyCycle(g, fromId, rel.to)) {
      throw new GraphError("cycle_rejected", "hierarchy cycle");
    }
    const eid = newId2("e");
    if (kind === "hierarchy") clearPrimaryForTarget(g, rel.to);
    g.edges.set(eid, {
      id: eid,
      canvasId: g.canvas.id,
      from: fromId,
      to: rel.to,
      kind,
      isPrimaryParent: kind === "hierarchy",
      order: 0,
      label: rel.label,
      tags: [],
      weight: rel.weight,
      lineStyle: rel.lineStyle,
      direction: rel.direction ?? (kind === "relation" ? "forward" : "none"),
      version: 1,
      createdAt: t,
      updatedAt: t
    });
    affected.add(fromId);
    affected.add(rel.to);
  }
}
function materializeNodeFromCreate(g, op, opts) {
  const id = op.id ?? newId2("n");
  if (g.nodes.has(id) && !g.nodes.get(id).deletedAt) {
    throw new GraphError("invalid_op", `node exists: ${id}`);
  }
  if (op.stylePreset === "title") {
    throw new GraphError(
      "invalid_op",
      "Cannot create another title/anchor node; omit parentId for top-level content nodes"
    );
  }
  const t = now();
  const pinPos = op.pos;
  const pinned = op.pinned ?? Boolean(pinPos);
  const alias = op.alias?.trim().replace(/^@/, "").toLowerCase() || void 0;
  assertAliasUnique(g, alias, id);
  const node = {
    id,
    canvasId: g.canvas.id,
    text: op.text,
    note: op.note,
    description: op.description ? { ...op.description } : void 0,
    collapsed: false,
    pinned,
    pos: pinPos ?? null,
    sidePref: op.sidePref ?? 0,
    stylePreset: op.stylePreset ?? "default",
    version: 1,
    tags: op.tags ? [...op.tags] : [],
    links: op.links ? op.links.map((l) => ({ ...l })) : [],
    imageUrl: op.imageUrl,
    dueAt: op.dueAt,
    startAt: op.startAt,
    accentColor: op.accentColor,
    icon: op.icon,
    alias,
    createdAt: t,
    updatedAt: t
  };
  g.nodes.set(id, node);
  let parentId = op.parentId === void 0 || op.parentId === null || op.parentId === "" ? opts.anchorId : op.parentId;
  if (!opts.attachParent) {
    return { id, parentId };
  }
  if (parentId === id) {
    throw new GraphError("invalid_op", "node cannot parent itself");
  }
  if (parentId) {
    if (!g.nodes.get(parentId) || g.nodes.get(parentId).deletedAt) {
      throw new GraphError("not_found", `parent ${parentId}`);
    }
    if (wouldCreateHierarchyCycle(g, parentId, id)) {
      throw new GraphError("cycle_rejected", "hierarchy cycle");
    }
    const eid = newId2("e");
    clearPrimaryForTarget(g, id);
    g.edges.set(eid, {
      id: eid,
      canvasId: g.canvas.id,
      from: parentId,
      to: id,
      kind: "hierarchy",
      isPrimaryParent: true,
      order: 0,
      tags: [],
      version: 1,
      createdAt: t,
      updatedAt: t
    });
  }
  return { id, parentId };
}
function applyOps(graph, ops) {
  const g = cloneGraph(graph);
  const inverseOps = [];
  const affected = /* @__PURE__ */ new Set();
  const anchorId = resolveAnchorNodeId(g);
  let autoFitPadding;
  for (const op of ops) {
    switch (op.type) {
      case "create_node": {
        const { id, parentId } = materializeNodeFromCreate(g, op, {
          attachParent: true,
          anchorId
        });
        affected.add(id);
        if (parentId) affected.add(parentId);
        inverseOps.push({ type: "delete_node", nodeId: id });
        addOutgoingRelations(g, id, op.relations, affected);
        break;
      }
      case "batch_create": {
        const specs = op.nodes;
        const created = [];
        for (const spec of specs) {
          const { id, parentId } = materializeNodeFromCreate(g, spec, {
            attachParent: false,
            anchorId
          });
          created.push({ id, parentId, relations: spec.relations });
          affected.add(id);
          inverseOps.push({ type: "delete_node", nodeId: id });
        }
        const t = now();
        for (const c of created) {
          let parentId = c.parentId;
          if (parentId === void 0 || parentId === null || parentId === "") {
            parentId = anchorId;
          }
          if (!parentId || parentId === c.id) continue;
          if (!g.nodes.get(parentId) || g.nodes.get(parentId).deletedAt) {
            throw new GraphError("not_found", `parent ${parentId}`);
          }
          if (wouldCreateHierarchyCycle(g, parentId, c.id)) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId2("e");
          clearPrimaryForTarget(g, c.id);
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: parentId,
            to: c.id,
            kind: "hierarchy",
            isPrimaryParent: true,
            order: 0,
            tags: [],
            version: 1,
            createdAt: t,
            updatedAt: t
          });
          affected.add(parentId);
        }
        for (const c of created) {
          addOutgoingRelations(g, c.id, c.relations, affected);
        }
        break;
      }
      case "batch_link": {
        for (const edge of op.edges) {
          if (!g.nodes.get(edge.from) || g.nodes.get(edge.from).deletedAt) {
            throw new GraphError("not_found", edge.from);
          }
          if (!g.nodes.get(edge.to) || g.nodes.get(edge.to).deletedAt) {
            throw new GraphError("not_found", edge.to);
          }
          if (edge.kind === "hierarchy" && wouldCreateHierarchyCycle(g, edge.from, edge.to)) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId2("e");
          const t = now();
          if (edge.kind === "hierarchy" && edge.asPrimary !== false) {
            clearPrimaryForTarget(g, edge.to);
          }
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            isPrimaryParent: edge.kind === "hierarchy" && edge.asPrimary !== false,
            order: 0,
            label: edge.label,
            tags: [],
            weight: edge.weight,
            lineStyle: edge.lineStyle,
            direction: edge.direction ?? (edge.kind === "relation" ? "forward" : "none"),
            version: 1,
            createdAt: t,
            updatedAt: t
          });
          inverseOps.push({ type: "unlink", edgeId: eid });
          affected.add(edge.from);
          affected.add(edge.to);
        }
        break;
      }
      case "update_node_meta": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (op.expectedVersion != null && n.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.nodeId);
        }
        const prevPatch = {
          note: n.note ?? null,
          description: n.description ? { ...n.description } : null,
          tags: [...n.tags ?? []],
          links: (n.links ?? []).map((l) => ({ ...l })),
          imageUrl: n.imageUrl ?? null,
          dueAt: n.dueAt ?? null,
          startAt: n.startAt ?? null,
          accentColor: n.accentColor ?? null,
          icon: n.icon ?? null,
          alias: n.alias ?? null
        };
        inverseOps.push({
          type: "update_node_meta",
          nodeId: op.nodeId,
          patch: prevPatch,
          expectedVersion: n.version + 1
        });
        const p = op.patch;
        if (p.note !== void 0) n.note = p.note ?? void 0;
        if (p.description !== void 0) {
          n.description = p.description == null ? void 0 : { ...p.description };
        }
        if (p.tags !== void 0) n.tags = [...p.tags];
        if (p.links !== void 0) n.links = p.links.map((l) => ({ ...l }));
        if (p.imageUrl !== void 0) n.imageUrl = p.imageUrl ?? void 0;
        if (p.dueAt !== void 0) n.dueAt = p.dueAt ?? void 0;
        if (p.startAt !== void 0) n.startAt = p.startAt ?? void 0;
        if (p.accentColor !== void 0) n.accentColor = p.accentColor ?? void 0;
        if (p.icon !== void 0) n.icon = p.icon ?? void 0;
        if (p.alias !== void 0) {
          const next = p.alias == null ? void 0 : p.alias.trim().replace(/^@/, "").toLowerCase();
          assertAliasUnique(g, next, n.id);
          n.alias = next;
        }
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "update_text": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (op.expectedVersion != null && n.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.nodeId);
        }
        inverseOps.push({
          type: "update_text",
          nodeId: op.nodeId,
          text: n.text,
          expectedVersion: n.version + 1
        });
        n.text = op.text;
        n.version += 1;
        n.updatedAt = now();
        if (isAnchorNode(g, op.nodeId)) {
          g.canvas.title = op.text;
        }
        affected.add(n.id);
        break;
      }
      case "move_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot move the hidden canvas anchor");
        }
        const oldPrimary = liveEdges(g).find(
          (e) => e.kind === "hierarchy" && e.to === op.nodeId && e.isPrimaryParent
        );
        if (oldPrimary) {
          oldPrimary.deletedAt = now();
          oldPrimary.version += 1;
          inverseOps.push({
            type: "link",
            from: oldPrimary.from,
            to: oldPrimary.to,
            kind: "hierarchy",
            asPrimary: true,
            label: oldPrimary.label
          });
        }
        if (op.newParentId || anchorId) {
          const newParentId = op.newParentId || anchorId;
          if (!g.nodes.get(newParentId) || g.nodes.get(newParentId).deletedAt) {
            throw new GraphError("not_found", newParentId);
          }
          if (wouldCreateHierarchyCycle(g, newParentId, op.nodeId)) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId2("e");
          const t = now();
          clearPrimaryForTarget(g, op.nodeId);
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: newParentId,
            to: op.nodeId,
            kind: "hierarchy",
            isPrimaryParent: true,
            order: op.order ?? 0,
            tags: [],
            version: 1,
            createdAt: t,
            updatedAt: t
          });
          inverseOps.push({ type: "unlink", edgeId: eid });
          affected.add(newParentId);
        }
        if (op.sidePref != null) n.sidePref = op.sidePref;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "reorder": {
        const e = liveEdges(g).find(
          (x) => x.kind === "hierarchy" && x.to === op.nodeId && x.isPrimaryParent
        );
        if (!e) throw new GraphError("not_found", `primary edge for ${op.nodeId}`);
        if (op.order == null && op.afterSiblingId === void 0) {
          throw new GraphError(
            "invalid_op",
            "reorder requires order (number) or afterSiblingId"
          );
        }
        let nextOrder = op.order;
        if (nextOrder == null) {
          const siblings = liveEdges(g).filter(
            (x) => x.kind === "hierarchy" && x.isPrimaryParent && x.from === e.from && x.to !== op.nodeId
          ).sort((a, b) => a.order - b.order);
          if (op.afterSiblingId == null) {
            nextOrder = (siblings[0]?.order ?? 0) - 1;
          } else {
            const after = siblings.find((s) => s.to === op.afterSiblingId);
            if (!after) {
              throw new GraphError(
                "not_found",
                `afterSiblingId ${op.afterSiblingId} not under same parent`
              );
            }
            const idx = siblings.indexOf(after);
            const next = siblings[idx + 1];
            nextOrder = next ? (after.order + next.order) / 2 : after.order + 1;
          }
        }
        const n = g.nodes.get(op.nodeId);
        if (n.pinned) {
          inverseOps.push({
            type: "set_pinned",
            nodeId: op.nodeId,
            pinned: true,
            pos: n.pos ?? void 0
          });
          n.pinned = false;
          n.pos = null;
        }
        inverseOps.push({ type: "reorder", nodeId: op.nodeId, order: e.order });
        e.order = nextOrder;
        e.version += 1;
        e.updatedAt = now();
        n.version += 1;
        n.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "set_primary_parent": {
        const edge = g.edges.get(op.edgeId);
        if (!edge || edge.deletedAt || edge.kind !== "hierarchy") {
          throw new GraphError("not_found", op.edgeId);
        }
        if (edge.to !== op.nodeId) {
          throw new GraphError("invalid_op", "edge target mismatch");
        }
        const prev = liveEdges(g).find(
          (e) => e.kind === "hierarchy" && e.to === op.nodeId && e.isPrimaryParent
        );
        if (prev) {
          inverseOps.push({
            type: "set_primary_parent",
            nodeId: op.nodeId,
            edgeId: prev.id
          });
          prev.isPrimaryParent = false;
          prev.version += 1;
        }
        edge.isPrimaryParent = true;
        edge.version += 1;
        edge.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "link": {
        if (!g.nodes.get(op.from) || g.nodes.get(op.from).deletedAt) {
          throw new GraphError("not_found", op.from);
        }
        if (!g.nodes.get(op.to) || g.nodes.get(op.to).deletedAt) {
          throw new GraphError("not_found", op.to);
        }
        if (op.kind === "hierarchy" && wouldCreateHierarchyCycle(g, op.from, op.to)) {
          throw new GraphError("cycle_rejected", "hierarchy cycle");
        }
        const eid = newId2("e");
        const t = now();
        if (op.kind === "hierarchy" && op.asPrimary !== false) {
          clearPrimaryForTarget(g, op.to);
        }
        g.edges.set(eid, {
          id: eid,
          canvasId: g.canvas.id,
          from: op.from,
          to: op.to,
          kind: op.kind,
          isPrimaryParent: op.kind === "hierarchy" && op.asPrimary !== false,
          order: 0,
          label: op.label,
          tags: [],
          weight: op.weight,
          lineStyle: op.lineStyle,
          direction: op.direction ?? (op.kind === "relation" ? "forward" : "none"),
          version: 1,
          createdAt: t,
          updatedAt: t
        });
        inverseOps.push({ type: "unlink", edgeId: eid });
        affected.add(op.from);
        affected.add(op.to);
        break;
      }
      case "unlink": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        inverseOps.push({
          type: "link",
          from: e.from,
          to: e.to,
          kind: e.kind,
          asPrimary: e.isPrimaryParent,
          label: e.label
        });
        e.deletedAt = now();
        e.version += 1;
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "delete_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot delete the hidden canvas anchor");
        }
        inverseOps.push(...promoteChildrenOnDelete(g, op.nodeId).reverse());
        for (const e of liveEdges(g)) {
          if (e.from === op.nodeId || e.to === op.nodeId) {
            e.deletedAt = now();
            e.version += 1;
          }
        }
        inverseOps.push({ type: "restore_node", nodeId: op.nodeId });
        n.deletedAt = now();
        n.version += 1;
        n.updatedAt = now();
        if (g.canvas.focusNodeId === op.nodeId) {
          const parentEdge = [...g.edges.values()].find(
            (e) => e.kind === "hierarchy" && e.to === op.nodeId && e.isPrimaryParent && e.deletedAt
          );
          const fallback = parentEdge && liveNodes(g).find((x) => x.id === parentEdge.from)?.id || liveNodes(g).sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id || null;
          if (!fallback) {
            const anchor = createEmptyGraph(g.canvas.title);
            const only = [...anchor.nodes.values()][0];
            only.canvasId = g.canvas.id;
            g.nodes.set(only.id, only);
            g.canvas.focusNodeId = only.id;
            affected.add(only.id);
          } else {
            g.canvas.focusNodeId = fallback;
            affected.add(fallback);
          }
        }
        affected.add(op.nodeId);
        break;
      }
      case "restore_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot restore the hidden canvas anchor");
        }
        if (!n.deletedAt) {
          throw new GraphError(
            "invalid_op",
            `node ${op.nodeId} is not deleted`
          );
        }
        inverseOps.push({ type: "delete_node", nodeId: op.nodeId });
        n.deletedAt = null;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        for (const e of g.edges.values()) {
          if (!e.deletedAt) continue;
          if (e.from !== op.nodeId && e.to !== op.nodeId) continue;
          const otherId = e.from === op.nodeId ? e.to : e.from;
          const other = g.nodes.get(otherId);
          if (!other || other.deletedAt) continue;
          const dup = liveEdges(g).some(
            (x) => x.from === e.from && x.to === e.to && x.kind === e.kind
          );
          if (dup) continue;
          if (e.kind === "hierarchy" && e.isPrimaryParent) {
            const hasPrimary = liveEdges(g).some(
              (x) => x.kind === "hierarchy" && x.isPrimaryParent && x.to === e.to
            );
            if (hasPrimary) continue;
          }
          e.deletedAt = null;
          e.version += 1;
          e.updatedAt = now();
          affected.add(e.from);
          affected.add(e.to);
        }
        break;
      }
      case "set_pinned": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_pinned",
          nodeId: op.nodeId,
          pinned: n.pinned,
          pos: n.pos ?? void 0
        });
        n.pinned = op.pinned;
        if (op.pos) n.pos = op.pos;
        if (!op.pinned) n.pos = null;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_collapsed": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_collapsed",
          nodeId: op.nodeId,
          collapsed: n.collapsed
        });
        n.collapsed = op.collapsed;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_style_preset": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_style_preset",
          nodeId: op.nodeId,
          stylePreset: n.stylePreset
        });
        n.stylePreset = op.stylePreset;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_edge_label": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        inverseOps.push({
          type: "set_edge_label",
          edgeId: op.edgeId,
          label: e.label ?? ""
        });
        e.label = op.label;
        e.version += 1;
        e.updatedAt = now();
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "update_edge_meta": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        if (op.expectedVersion != null && e.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.edgeId);
        }
        inverseOps.push({
          type: "update_edge_meta",
          edgeId: op.edgeId,
          patch: {
            label: e.label ?? null,
            tags: [...e.tags ?? []],
            note: e.note ?? null,
            weight: e.weight ?? null,
            lineStyle: e.lineStyle ?? null,
            direction: e.direction ?? null
          },
          expectedVersion: e.version + 1
        });
        const p = op.patch;
        if (p.label !== void 0) e.label = p.label ?? void 0;
        if (p.tags !== void 0) e.tags = [...p.tags];
        if (p.note !== void 0) e.note = p.note ?? void 0;
        if (p.weight !== void 0) e.weight = p.weight ?? void 0;
        if (p.lineStyle !== void 0) e.lineStyle = p.lineStyle ?? void 0;
        if (p.direction !== void 0) e.direction = p.direction ?? void 0;
        e.version += 1;
        e.updatedAt = now();
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "set_prefs": {
        const prev = { ...g.canvas.prefs };
        inverseOps.push({ type: "set_prefs", prefs: prev });
        g.canvas.prefs = { ...g.canvas.prefs, ...op.prefs };
        g.canvas.updatedAt = now();
        break;
      }
      case "set_focus": {
        if (!g.nodes.get(op.nodeId) || g.nodes.get(op.nodeId).deletedAt) {
          throw new GraphError("not_found", op.nodeId);
        }
        const prev = g.canvas.focusNodeId;
        if (prev) inverseOps.push({ type: "set_focus", nodeId: prev });
        g.canvas.focusNodeId = op.nodeId;
        g.canvas.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "set_viewport": {
        inverseOps.push({
          type: "set_viewport",
          viewport: { ...g.canvas.viewport }
        });
        g.canvas.viewport = { ...op.viewport };
        g.canvas.updatedAt = now();
        break;
      }
      case "auto_fit": {
        inverseOps.push({
          type: "set_viewport",
          viewport: { ...g.canvas.viewport }
        });
        autoFitPadding = op.padding ?? 50;
        break;
      }
      default: {
        const bad = op;
        throw new GraphError(
          "invalid_op",
          `unknown op ${String(bad?.type)}. Each op needs field "type" (not "op"). Valid: create_node, batch_create, batch_link, update_text, update_node_meta, move_node, reorder, set_primary_parent, link, unlink, delete_node, restore_node, set_pinned, set_collapsed, set_style_preset, set_edge_label, update_edge_meta, set_prefs, set_focus, set_viewport, auto_fit`
        );
      }
    }
  }
  g.canvas.updatedAt = now();
  return {
    graph: g,
    inverseOps: inverseOps.reverse(),
    affectedNodeIds: [...affected],
    autoFitPadding
  };
}
function toSnapshot(g) {
  return {
    canvas: g.canvas,
    nodes: liveNodes(g),
    edges: liveEdges(g)
  };
}

// packages/graph-store/src/index.ts
var SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  focus_node_id TEXT,
  viewport_json TEXT NOT NULL,
  prefs_json TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 0,
  agent_mode TEXT NOT NULL DEFAULT 'edit',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  collapsed INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  pos_json TEXT,
  side_pref INTEGER NOT NULL DEFAULT 0,
  style_preset TEXT NOT NULL DEFAULT 'default',
  version INTEGER NOT NULL DEFAULT 1,
  tags_json TEXT NOT NULL DEFAULT '[]',
  links_json TEXT NOT NULL DEFAULT '[]',
  image_url TEXT,
  due_at INTEGER,
  start_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  kind TEXT NOT NULL,
  is_primary_parent INTEGER NOT NULL DEFAULT 0,
  "order" REAL NOT NULL DEFAULT 0,
  label TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  canvas_id TEXT NOT NULL,
  change_set_id TEXT NOT NULL,
  op_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS change_sets (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  base_rev INTEGER NOT NULL,
  origin TEXT NOT NULL,
  summary TEXT NOT NULL,
  inverse_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  undone_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_nodes_canvas ON nodes(canvas_id);
CREATE INDEX IF NOT EXISTS idx_edges_canvas ON edges(canvas_id);
CREATE INDEX IF NOT EXISTS idx_events_canvas ON events(canvas_id);
`;
function rowNode(r) {
  return {
    id: String(r.id),
    canvasId: String(r.canvas_id),
    text: String(r.text),
    note: r.note != null ? String(r.note) : void 0,
    collapsed: Boolean(r.collapsed),
    pinned: Boolean(r.pinned),
    pos: r.pos_json ? JSON.parse(String(r.pos_json)) : null,
    sidePref: Number(r.side_pref),
    stylePreset: String(r.style_preset),
    version: Number(r.version),
    tags: JSON.parse(String(r.tags_json ?? "[]")),
    links: JSON.parse(String(r.links_json ?? "[]")),
    imageUrl: r.image_url != null ? String(r.image_url) : void 0,
    dueAt: r.due_at != null ? Number(r.due_at) : void 0,
    startAt: r.start_at != null ? Number(r.start_at) : void 0,
    accentColor: r.accent_color != null ? String(r.accent_color) : void 0,
    icon: r.icon != null ? String(r.icon) : void 0,
    alias: r.alias != null ? String(r.alias) : void 0,
    description: r.description_json ? JSON.parse(String(r.description_json)) : void 0,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null
  };
}
function rowEdge(r) {
  return {
    id: String(r.id),
    canvasId: String(r.canvas_id),
    from: String(r.from),
    to: String(r.to),
    kind: String(r.kind),
    isPrimaryParent: Boolean(r.is_primary_parent),
    order: Number(r.order),
    label: r.label != null ? String(r.label) : void 0,
    tags: JSON.parse(String(r.tags_json ?? "[]")),
    note: r.note != null ? String(r.note) : void 0,
    weight: r.weight != null ? Number(r.weight) : void 0,
    lineStyle: r.line_style != null ? String(r.line_style) : void 0,
    direction: r.direction != null ? String(r.direction) : void 0,
    version: Number(r.version),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null
  };
}
var SqliteGraphStore = class {
  db;
  cache = /* @__PURE__ */ new Map();
  constructor(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
    this.migrateSchema();
  }
  migrateSchema() {
    const verRow = this.db.prepare("SELECT value FROM meta WHERE key = ?").get("schema_version");
    let ver = verRow ? Number(verRow.value) : 0;
    if (!verRow) {
      this.db.prepare("INSERT INTO meta(key, value) VALUES(?, ?)").run("schema_version", "1");
      ver = 1;
    }
    const tableInfo = (table) => this.db.prepare(`PRAGMA table_info(${table})`).all().map(
      (c) => c.name
    );
    const ensureCol = (table, col, ddl) => {
      if (!tableInfo(table).includes(col)) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
      }
    };
    if (ver < 2) {
      ensureCol("nodes", "links_json", `links_json TEXT NOT NULL DEFAULT '[]'`);
      ensureCol("nodes", "image_url", `image_url TEXT`);
      ensureCol("nodes", "due_at", `due_at INTEGER`);
      ensureCol("nodes", "start_at", `start_at INTEGER`);
      ensureCol("edges", "tags_json", `tags_json TEXT NOT NULL DEFAULT '[]'`);
      ensureCol("edges", "note", `note TEXT`);
      this.db.prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run("schema_version", "2");
      ver = 2;
    }
    if (ver < 3) {
      ensureCol("nodes", "accent_color", `accent_color TEXT`);
      ensureCol("nodes", "icon", `icon TEXT`);
      ensureCol("edges", "weight", `weight REAL`);
      ensureCol("edges", "line_style", `line_style TEXT`);
      this.db.prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run("schema_version", "3");
      ver = 3;
    }
    if (ver < 4) {
      ensureCol("nodes", "alias", `alias TEXT`);
      this.db.prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run("schema_version", "4");
      ver = 4;
    }
    if (ver < 5) {
      ensureCol("edges", "direction", `direction TEXT`);
      this.db.exec(`
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  name TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_canvas ON snapshots(canvas_id);
`);
      this.db.prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run("schema_version", "5");
      ver = 5;
    }
    if (ver < 6) {
      ensureCol("nodes", "description_json", `description_json TEXT`);
      this.db.prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run("schema_version", "6");
    }
  }
  close() {
    this.db.close();
  }
  listCanvases() {
    const rows = this.db.prepare(
      `SELECT * FROM canvases WHERE deleted_at IS NULL ORDER BY updated_at DESC`
    ).all();
    return rows.map((r) => this.rowCanvas(r));
  }
  rowCanvas(r) {
    const rawPrefs = JSON.parse(String(r.prefs_json || "{}"));
    const anchorNodeId = rawPrefs.anchorNodeId != null ? String(rawPrefs.anchorNodeId) : null;
    const prefs = {
      themeId: "abyss",
      branchColoring: true,
      density: "comfortable",
      riskProfile: "fast",
      showRelationEdges: true,
      nodeBadges: "icons",
      showHoverCard: true,
      inspectorMode: "selection",
      nodeViewMode: "card",
      ...rawPrefs
    };
    delete prefs.anchorNodeId;
    return {
      id: String(r.id),
      title: String(r.title),
      focusNodeId: r.focus_node_id != null ? String(r.focus_node_id) : null,
      anchorNodeId,
      viewport: JSON.parse(String(r.viewport_json)),
      prefs,
      rev: Number(r.rev),
      agentMode: String(r.agent_mode),
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null
    };
  }
  createCanvas(title, rootText) {
    const g = createEmptyGraph(title ?? "\u672A\u547D\u540D\u753B\u5E03", rootText);
    this.persistGraph(g, true);
    this.cache.set(g.canvas.id, g);
    return g;
  }
  loadCanvas(canvasId) {
    const cached = this.cache.get(canvasId);
    if (cached) return cloneGraph(cached);
    const crow = this.db.prepare(`SELECT * FROM canvases WHERE id = ?`).get(canvasId);
    if (!crow || crow.deleted_at != null) throw new Error(`canvas not found: ${canvasId}`);
    const nodes = this.db.prepare(`SELECT * FROM nodes WHERE canvas_id = ?`).all(canvasId).map(rowNode);
    const edges = this.db.prepare(`SELECT * FROM edges WHERE canvas_id = ?`).all(canvasId).map(rowEdge);
    const g = {
      canvas: this.rowCanvas(crow),
      nodes: new Map(nodes.map((n) => [n.id, n])),
      edges: new Map(edges.map((e) => [e.id, e]))
    };
    if (!g.canvas.anchorNodeId) {
      resolveAnchorNodeId(g);
    }
    this.cache.set(canvasId, g);
    return cloneGraph(g);
  }
  getSnapshot(canvasId) {
    return toSnapshot(this.loadCanvas(canvasId));
  }
  applyChangeSet(canvasId, ops, opts) {
    const g = this.loadCanvas(canvasId);
    const baseRev = g.canvas.rev;
    const result = applyOps(g, ops);
    result.graph.canvas.rev = baseRev + 1;
    const changeSetId = newId2("cs");
    this.db.exec("BEGIN");
    try {
      this.persistGraph(result.graph, false);
      this.db.prepare(
        `INSERT INTO change_sets(id, canvas_id, base_rev, origin, summary, inverse_json, created_at)
           VALUES(?,?,?,?,?,?,?)`
      ).run(
        changeSetId,
        canvasId,
        baseRev,
        opts.origin,
        opts.summary ?? `${ops.length} ops`,
        JSON.stringify(result.inverseOps),
        now()
      );
      const ins = this.db.prepare(
        `INSERT INTO events(canvas_id, change_set_id, op_json, created_at) VALUES(?,?,?,?)`
      );
      for (const op of ops) {
        ins.run(canvasId, changeSetId, JSON.stringify(op), now());
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    this.cache.set(canvasId, result.graph);
    return {
      changeSetId,
      rev: result.graph.canvas.rev,
      snapshot: toSnapshot(result.graph),
      affectedNodeIds: result.affectedNodeIds,
      inverseOps: result.inverseOps,
      autoFitPadding: result.autoFitPadding
    };
  }
  undoChangeSet(changeSetId) {
    const row = this.db.prepare(`SELECT * FROM change_sets WHERE id = ?`).get(changeSetId);
    if (!row) throw new Error("changeset not found");
    if (row.undone_at != null) throw new Error("already undone");
    const canvasId = String(row.canvas_id);
    const inverse = JSON.parse(String(row.inverse_json));
    const cleaned = inverse.map((op) => {
      if (!op || typeof op !== "object") return op;
      const { expectedVersion: _ev, ...rest } = op;
      return rest;
    });
    const result = this.applyChangeSet(canvasId, cleaned, {
      origin: "user",
      summary: `undo ${changeSetId}`
    });
    this.db.prepare(`UPDATE change_sets SET undone_at = ? WHERE id = ?`).run(now(), changeSetId);
    return result;
  }
  /** Most recent change set that can still be undone (for mindmap_undo without id). */
  latestUndoableChangeSetId(canvasId) {
    const row = this.db.prepare(
      `SELECT id FROM change_sets
         WHERE canvas_id = ? AND undone_at IS NULL
         ORDER BY created_at DESC LIMIT 1`
    ).get(canvasId);
    return row?.id ?? null;
  }
  /** Latest undo companion (summary starts with "undo ") — redo by undoing it. */
  latestRedoableChangeSetId(canvasId) {
    const row = this.db.prepare(
      `SELECT id, summary FROM change_sets
         WHERE canvas_id = ? AND undone_at IS NULL
         ORDER BY created_at DESC LIMIT 1`
    ).get(canvasId);
    if (!row) return null;
    if (!String(row.summary).startsWith("undo ")) return null;
    return row.id;
  }
  listChangeSets(canvasId, limit = 30) {
    const rows = this.db.prepare(
      `SELECT id, base_rev, origin, summary, created_at, undone_at
         FROM change_sets WHERE canvas_id = ?
         ORDER BY created_at DESC LIMIT ?`
    ).all(canvasId, limit);
    return rows.map((r) => ({
      id: String(r.id),
      baseRev: Number(r.base_rev),
      origin: String(r.origin),
      summary: String(r.summary),
      createdAt: Number(r.created_at),
      undone: r.undone_at != null,
      isUndoCompanion: String(r.summary).startsWith("undo ")
    }));
  }
  createSnapshot(canvasId, name17) {
    const snap = this.getSnapshot(canvasId);
    const id = newId2("snap");
    const t = now();
    this.db.prepare(
      `INSERT INTO snapshots(id, canvas_id, name, snapshot_json, created_at) VALUES(?,?,?,?,?)`
    ).run(id, canvasId, name17 || `snapshot-${t}`, JSON.stringify(snap), t);
    return { id, name: name17 || `snapshot-${t}`, createdAt: t };
  }
  listSnapshots(canvasId, limit = 20) {
    const rows = this.db.prepare(
      `SELECT id, name, created_at FROM snapshots WHERE canvas_id = ?
         ORDER BY created_at DESC LIMIT ?`
    ).all(canvasId, limit);
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      createdAt: Number(r.created_at)
    }));
  }
  restoreSnapshot(snapshotId) {
    const row = this.db.prepare(`SELECT * FROM snapshots WHERE id = ?`).get(snapshotId);
    if (!row) throw new Error("snapshot not found");
    const canvasId = String(row.canvas_id);
    const snap = JSON.parse(String(row.snapshot_json));
    const g = this.loadCanvas(canvasId);
    const t = now();
    for (const n of g.nodes.values()) {
      if (!n.deletedAt) {
        n.deletedAt = t;
        n.version += 1;
        n.updatedAt = t;
      }
    }
    for (const e of g.edges.values()) {
      if (!e.deletedAt) {
        e.deletedAt = t;
        e.version += 1;
        e.updatedAt = t;
      }
    }
    for (const n of snap.nodes) {
      g.nodes.set(n.id, {
        ...n,
        canvasId,
        deletedAt: n.deletedAt ?? null,
        updatedAt: t
      });
    }
    for (const e of snap.edges) {
      g.edges.set(e.id, {
        ...e,
        canvasId,
        deletedAt: e.deletedAt ?? null,
        updatedAt: t
      });
    }
    g.canvas.title = snap.canvas.title;
    g.canvas.focusNodeId = snap.canvas.focusNodeId;
    g.canvas.anchorNodeId = snap.canvas.anchorNodeId;
    g.canvas.prefs = { ...g.canvas.prefs, ...snap.canvas.prefs };
    g.canvas.viewport = { ...snap.canvas.viewport };
    g.canvas.rev += 1;
    g.canvas.updatedAt = t;
    const changeSetId = newId2("cs");
    this.db.exec("BEGIN");
    try {
      this.persistGraph(g, false);
      this.db.prepare(
        `INSERT INTO change_sets(id, canvas_id, base_rev, origin, summary, inverse_json, created_at)
           VALUES(?,?,?,?,?,?,?)`
      ).run(
        changeSetId,
        canvasId,
        g.canvas.rev - 1,
        "user",
        `restore snapshot ${snapshotId}`,
        JSON.stringify([]),
        t
      );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    this.cache.set(canvasId, g);
    return {
      changeSetId,
      rev: g.canvas.rev,
      snapshot: toSnapshot(g),
      affectedNodeIds: [...g.nodes.keys()]
    };
  }
  search(canvasId, query, limit = 20, scope = "text") {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const g = this.loadCanvas(canvasId);
    const hits = [];
    const wantNodes = scope === "text" || scope === "note" || scope === "tags" || scope === "description" || scope === "all";
    const wantEdgeLabel = scope === "edge_label" || scope === "all";
    const wantEdgeNote = scope === "edge_note" || scope === "all";
    if (wantNodes) {
      for (const n of g.nodes.values()) {
        if (n.deletedAt) continue;
        const matchIn = [];
        const t = n.text.toLowerCase();
        const note = (n.note ?? "").toLowerCase();
        const tags = (n.tags ?? []).map((x) => x.toLowerCase());
        const desc = n.description ? JSON.stringify(n.description).toLowerCase() : "";
        const wantText = scope === "text" || scope === "all";
        const wantNote = scope === "note" || scope === "all";
        const wantTags = scope === "tags" || scope === "all";
        const wantDesc = scope === "description" || scope === "all";
        if (wantText && t.includes(q)) matchIn.push("text");
        if (wantNote && note.includes(q)) matchIn.push("note");
        if (wantTags && tags.some((tag) => tag.includes(q))) matchIn.push("tags");
        if (wantDesc && desc.includes(q)) matchIn.push("description");
        if (!matchIn.length) continue;
        let score = 0.4;
        if (matchIn.includes("text")) score = t.startsWith(q) ? 1 : 0.75;
        else if (matchIn.includes("tags")) score = 0.55;
        else if (matchIn.includes("description")) score = 0.5;
        else score = 0.45;
        hits.push({ kind: "node", id: n.id, text: n.text, score, matchIn });
      }
    }
    if (wantEdgeLabel || wantEdgeNote) {
      for (const e of g.edges.values()) {
        if (e.deletedAt) continue;
        const matchIn = [];
        const label = (e.label ?? "").toLowerCase();
        const note = (e.note ?? "").toLowerCase();
        if (wantEdgeLabel && label.includes(q)) matchIn.push("edge_label");
        if (wantEdgeNote && note.includes(q)) matchIn.push("edge_note");
        if (!matchIn.length) continue;
        const fromN = g.nodes.get(e.from);
        const toN = g.nodes.get(e.to);
        let score = 0.5;
        if (matchIn.includes("edge_label")) {
          score = label.startsWith(q) ? 0.95 : 0.7;
        } else {
          score = 0.55;
        }
        hits.push({
          kind: "edge",
          id: e.id,
          from: e.from,
          to: e.to,
          fromText: fromN?.text ?? e.from,
          toText: toN?.text ?? e.to,
          ...e.label ? { label: e.label } : {},
          ...e.note ? { note: e.note } : {},
          score,
          matchIn
        });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  renameCanvas(canvasId, title) {
    const g = this.loadCanvas(canvasId);
    g.canvas.title = title;
    g.canvas.updatedAt = now();
    this.db.prepare(`UPDATE canvases SET title = ?, updated_at = ? WHERE id = ?`).run(title, g.canvas.updatedAt, canvasId);
    this.cache.set(canvasId, g);
    return g.canvas;
  }
  softDeleteCanvas(canvasId) {
    const t = now();
    this.db.prepare(`UPDATE canvases SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(t, t, canvasId);
    this.cache.delete(canvasId);
  }
  /** Permanent delete of a canvas and all related rows (P17). */
  hardDeleteCanvas(canvasId) {
    this.db.prepare(`DELETE FROM events WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM change_sets WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM edges WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM nodes WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM canvases WHERE id = ?`).run(canvasId);
    this.cache.delete(canvasId);
  }
  listDeletedNodes(canvasId) {
    const rows = this.db.prepare(
      `SELECT * FROM nodes WHERE canvas_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 100`
    ).all(canvasId);
    return rows.map(rowNode);
  }
  restoreNode(canvasId, nodeId) {
    const g = this.loadCanvas(canvasId);
    const focus = g.canvas.focusNodeId;
    if (!g.nodes.get(nodeId)) throw new Error("not found");
    const ops = [{ type: "restore_node", nodeId }];
    if (focus && focus !== nodeId) {
      ops.push({
        type: "link",
        from: focus,
        to: nodeId,
        kind: "hierarchy",
        asPrimary: true
      });
    }
    return this.applyChangeSet(canvasId, ops, {
      origin: "user",
      summary: `restore ${nodeId}`
    });
  }
  updateViewport(canvasId, viewport) {
    const g = this.loadCanvas(canvasId);
    g.canvas.viewport = viewport;
    g.canvas.updatedAt = now();
    this.db.prepare(`UPDATE canvases SET viewport_json = ?, updated_at = ? WHERE id = ?`).run(JSON.stringify(viewport), g.canvas.updatedAt, canvasId);
    this.cache.set(canvasId, g);
  }
  persistGraph(g, isNew) {
    const c = g.canvas;
    if (!c.anchorNodeId) resolveAnchorNodeId(g);
    const prefsJson = JSON.stringify({
      ...c.prefs,
      anchorNodeId: c.anchorNodeId ?? null
    });
    if (isNew) {
      this.db.prepare(
        `INSERT INTO canvases(id, title, focus_node_id, viewport_json, prefs_json, rev, agent_mode, created_at, updated_at)
           VALUES(?,?,?,?,?,?,?,?,?)`
      ).run(
        c.id,
        c.title,
        c.focusNodeId,
        JSON.stringify(c.viewport),
        prefsJson,
        c.rev,
        c.agentMode,
        c.createdAt,
        c.updatedAt
      );
    } else {
      this.db.prepare(
        `UPDATE canvases SET title=?, focus_node_id=?, viewport_json=?, prefs_json=?, rev=?, agent_mode=?, updated_at=? WHERE id=?`
      ).run(
        c.title,
        c.focusNodeId,
        JSON.stringify(c.viewport),
        prefsJson,
        c.rev,
        c.agentMode,
        c.updatedAt,
        c.id
      );
    }
    const upsertNode = this.db.prepare(
      `INSERT INTO nodes(id, canvas_id, text, note, collapsed, pinned, pos_json, side_pref, style_preset, version, tags_json, links_json, image_url, due_at, start_at, accent_color, icon, alias, description_json, created_at, updated_at, deleted_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         text=excluded.text, note=excluded.note, collapsed=excluded.collapsed, pinned=excluded.pinned,
         pos_json=excluded.pos_json, side_pref=excluded.side_pref, style_preset=excluded.style_preset,
         version=excluded.version, tags_json=excluded.tags_json, links_json=excluded.links_json,
         image_url=excluded.image_url, due_at=excluded.due_at, start_at=excluded.start_at,
         accent_color=excluded.accent_color, icon=excluded.icon, alias=excluded.alias,
         description_json=excluded.description_json,
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`
    );
    for (const n of g.nodes.values()) {
      upsertNode.run(
        n.id,
        n.canvasId,
        n.text,
        n.note ?? null,
        n.collapsed ? 1 : 0,
        n.pinned ? 1 : 0,
        n.pos ? JSON.stringify(n.pos) : null,
        n.sidePref,
        n.stylePreset,
        n.version,
        JSON.stringify(n.tags ?? []),
        JSON.stringify(n.links ?? []),
        n.imageUrl ?? null,
        n.dueAt ?? null,
        n.startAt ?? null,
        n.accentColor ?? null,
        n.icon ?? null,
        n.alias ?? null,
        n.description ? JSON.stringify(n.description) : null,
        n.createdAt,
        n.updatedAt,
        n.deletedAt ?? null
      );
    }
    const upsertEdge = this.db.prepare(
      `INSERT INTO edges(id, canvas_id, "from", "to", kind, is_primary_parent, "order", label, tags_json, note, weight, line_style, direction, version, created_at, updated_at, deleted_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         "from"=excluded."from", "to"=excluded."to", kind=excluded.kind, is_primary_parent=excluded.is_primary_parent,
         "order"=excluded."order", label=excluded.label, tags_json=excluded.tags_json, note=excluded.note,
         weight=excluded.weight, line_style=excluded.line_style, direction=excluded.direction,
         version=excluded.version, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`
    );
    for (const e of g.edges.values()) {
      upsertEdge.run(
        e.id,
        e.canvasId,
        e.from,
        e.to,
        e.kind,
        e.isPrimaryParent ? 1 : 0,
        e.order,
        e.label ?? null,
        JSON.stringify(e.tags ?? []),
        e.note ?? null,
        e.weight ?? null,
        e.lineStyle ?? null,
        e.direction ?? null,
        e.version,
        e.createdAt,
        e.updatedAt,
        e.deletedAt ?? null
      );
    }
  }
};

// packages/dream-skin/src/skins.json
var skins_default = [
  {
    id: "abyss",
    colorScheme: "dark",
    name: "Abyss",
    nameZh: "\u6DF1\u6E0A",
    tokens: {
      "--dsw-alias-bg-base": "#101014",
      "--dsw-alias-bg-layer-1": "#1b1e28",
      "--dsw-alias-bg-layer-2": "rgba(26, 30, 42, 0.85)",
      "--dsw-alias-bg-layer-3": "#1a1d27",
      "--dsw-alias-bg-module-platform": "#151821",
      "--dsw-alias-bg-overlay": "rgba(24, 24, 30, 0.86)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.08)",
      "--dsw-specific-tip": "rgba(30, 33, 46, 0.9)",
      "--dsw-alias-border-l1": "rgba(255, 255, 255, 0.07)",
      "--dsw-alias-border-l2": "rgba(255, 255, 255, 0.13)",
      "--dsw-alias-label-primary": "#f4f5f7",
      "--dsw-alias-label-secondary": "#a5adb8",
      "--dsw-alias-label-tertiary": "#7b838f",
      "--dsw-alias-brand-primary": "#5e6ad2",
      "--dsw-specific-bubble": "rgba(37, 42, 58, 0.9)",
      "--dsw-specific-bubble-highlight": "rgba(94, 106, 210, 0.16)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.10)",
      "--dsw-alias-brand-text": "#ffffff",
      "--dsw-alias-button-primary-hover": "#6f7be0",
      "--dsw-alias-button-primary-dimmed": "rgba(94, 106, 210, 0.16)",
      "--dsw-alias-state-business-primary": "#5e6ad2",
      "--dsw-alias-state-business-tertiary": "rgba(94, 106, 210, 0.16)",
      "--dsw-alias-interactive-bg-hover": "rgba(94, 106, 210, 0.16)",
      "--dsw-alias-interactive-bg-active": "rgba(94, 106, 210, 0.26)",
      "--dsw-alias-markdown-code-block": "rgba(0, 0, 0, 0.35)",
      "--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.09)",
      "--dsw-specific-sidebar-fill": "rgba(16, 16, 20, 0.92)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.09)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.05)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.09)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.14)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.2)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.2)"
    }
  },
  {
    id: "aurora",
    colorScheme: "dark",
    name: "Aurora",
    nameZh: "\u6781\u5149",
    tokens: {
      "--dsw-alias-bg-base": "#0e1316",
      "--dsw-alias-bg-layer-1": "#162128",
      "--dsw-alias-bg-layer-2": "rgba(22, 32, 34, 0.85)",
      "--dsw-alias-bg-layer-3": "#182128",
      "--dsw-alias-bg-module-platform": "#131c20",
      "--dsw-alias-bg-overlay": "rgba(18, 24, 27, 0.86)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.08)",
      "--dsw-specific-tip": "rgba(24, 35, 36, 0.9)",
      "--dsw-alias-border-l1": "rgba(110, 231, 183, 0.10)",
      "--dsw-alias-border-l2": "rgba(110, 231, 183, 0.18)",
      "--dsw-alias-label-primary": "#eefaf4",
      "--dsw-alias-label-secondary": "#9fc9b8",
      "--dsw-alias-label-tertiary": "#74a494",
      "--dsw-alias-brand-primary": "#2dd4bf",
      "--dsw-specific-bubble": "rgba(30, 42, 44, 0.9)",
      "--dsw-specific-bubble-highlight": "rgba(45, 212, 191, 0.14)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.10)",
      "--dsw-alias-brand-text": "#03211b",
      "--dsw-alias-button-primary-hover": "#45e0cd",
      "--dsw-alias-button-primary-dimmed": "rgba(45, 212, 191, 0.14)",
      "--dsw-alias-state-business-primary": "#2dd4bf",
      "--dsw-alias-state-business-tertiary": "rgba(45, 212, 191, 0.14)",
      "--dsw-alias-interactive-bg-hover": "rgba(45, 212, 191, 0.14)",
      "--dsw-alias-interactive-bg-active": "rgba(45, 212, 191, 0.22)",
      "--dsw-alias-markdown-code-block": "rgba(0, 0, 0, 0.32)",
      "--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-fill": "rgba(14, 19, 22, 0.92)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.045)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.085)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.13)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.2)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.2)"
    }
  },
  {
    id: "nebula",
    colorScheme: "dark",
    name: "Nebula",
    nameZh: "\u661F\u4E91",
    tokens: {
      "--dsw-alias-bg-base": "#12101a",
      "--dsw-alias-bg-layer-1": "#1c1a2a",
      "--dsw-alias-bg-layer-2": "rgba(30, 27, 44, 0.85)",
      "--dsw-alias-bg-layer-3": "#1c1a28",
      "--dsw-alias-bg-module-platform": "#171523",
      "--dsw-alias-bg-overlay": "rgba(22, 20, 30, 0.86)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.08)",
      "--dsw-specific-tip": "rgba(32, 28, 46, 0.9)",
      "--dsw-alias-border-l1": "rgba(196, 181, 253, 0.10)",
      "--dsw-alias-border-l2": "rgba(196, 181, 253, 0.18)",
      "--dsw-alias-label-primary": "#f3f0fb",
      "--dsw-alias-label-secondary": "#b6a8d9",
      "--dsw-alias-label-tertiary": "#8a7cb0",
      "--dsw-alias-brand-primary": "#8b7cf6",
      "--dsw-specific-bubble": "rgba(40, 36, 56, 0.9)",
      "--dsw-specific-bubble-highlight": "rgba(139, 124, 246, 0.14)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.10)",
      "--dsw-alias-brand-text": "#0d0a1c",
      "--dsw-alias-button-primary-hover": "#9d90f8",
      "--dsw-alias-button-primary-dimmed": "rgba(139, 124, 246, 0.14)",
      "--dsw-alias-state-business-primary": "#8b7cf6",
      "--dsw-alias-state-business-tertiary": "rgba(139, 124, 246, 0.14)",
      "--dsw-alias-interactive-bg-hover": "rgba(139, 124, 246, 0.14)",
      "--dsw-alias-interactive-bg-active": "rgba(139, 124, 246, 0.22)",
      "--dsw-alias-markdown-code-block": "rgba(0, 0, 0, 0.32)",
      "--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-fill": "rgba(18, 16, 26, 0.92)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.045)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.085)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.13)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.2)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.2)"
    }
  },
  {
    id: "ember",
    colorScheme: "dark",
    name: "Ember",
    nameZh: "\u4F59\u70EC",
    tokens: {
      "--dsw-alias-bg-base": "#16110d",
      "--dsw-alias-bg-layer-1": "#211a15",
      "--dsw-alias-bg-layer-2": "rgba(36, 28, 20, 0.85)",
      "--dsw-alias-bg-layer-3": "#231b15",
      "--dsw-alias-bg-module-platform": "#1b1712",
      "--dsw-alias-bg-overlay": "rgba(28, 20, 15, 0.86)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.08)",
      "--dsw-specific-tip": "rgba(38, 28, 20, 0.9)",
      "--dsw-alias-border-l1": "rgba(253, 186, 116, 0.10)",
      "--dsw-alias-border-l2": "rgba(253, 186, 116, 0.18)",
      "--dsw-alias-label-primary": "#fdf0e6",
      "--dsw-alias-label-secondary": "#d0a98a",
      "--dsw-alias-label-tertiary": "#a48266",
      "--dsw-alias-brand-primary": "#f59e5b",
      "--dsw-specific-bubble": "rgba(48, 38, 28, 0.9)",
      "--dsw-specific-bubble-highlight": "rgba(245, 158, 91, 0.14)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.10)",
      "--dsw-alias-brand-text": "#1f0f06",
      "--dsw-alias-button-primary-hover": "#f8b06f",
      "--dsw-alias-button-primary-dimmed": "rgba(245, 158, 91, 0.14)",
      "--dsw-alias-state-business-primary": "#f59e5b",
      "--dsw-alias-state-business-tertiary": "rgba(245, 158, 91, 0.14)",
      "--dsw-alias-interactive-bg-hover": "rgba(245, 158, 91, 0.14)",
      "--dsw-alias-interactive-bg-active": "rgba(245, 158, 91, 0.22)",
      "--dsw-alias-markdown-code-block": "rgba(0, 0, 0, 0.32)",
      "--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-fill": "rgba(22, 17, 13, 0.92)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.045)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.085)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.13)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.2)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.2)"
    }
  },
  {
    id: "midnight",
    colorScheme: "dark",
    name: "Midnight",
    nameZh: "\u5348\u591C",
    tokens: {
      "--dsw-alias-bg-base": "#0b0b0e",
      "--dsw-alias-bg-layer-1": "#17171f",
      "--dsw-alias-bg-layer-2": "rgba(22, 22, 28, 0.85)",
      "--dsw-alias-bg-layer-3": "#181820",
      "--dsw-alias-bg-module-platform": "#11111a",
      "--dsw-alias-bg-overlay": "rgba(20, 20, 25, 0.86)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.08)",
      "--dsw-specific-tip": "rgba(26, 26, 32, 0.9)",
      "--dsw-alias-border-l1": "rgba(255, 255, 255, 0.06)",
      "--dsw-alias-border-l2": "rgba(255, 255, 255, 0.12)",
      "--dsw-alias-label-primary": "#f2f2f6",
      "--dsw-alias-label-secondary": "#a4a4b2",
      "--dsw-alias-label-tertiary": "#787884",
      "--dsw-alias-brand-primary": "#7c8cff",
      "--dsw-specific-bubble": "rgba(30, 30, 38, 0.9)",
      "--dsw-specific-bubble-highlight": "rgba(124, 140, 255, 0.14)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.10)",
      "--dsw-alias-brand-text": "#05050f",
      "--dsw-alias-button-primary-hover": "#93a1ff",
      "--dsw-alias-button-primary-dimmed": "rgba(124, 140, 255, 0.14)",
      "--dsw-alias-state-business-primary": "#7c8cff",
      "--dsw-alias-state-business-tertiary": "rgba(124, 140, 255, 0.14)",
      "--dsw-alias-interactive-bg-hover": "rgba(124, 140, 255, 0.12)",
      "--dsw-alias-interactive-bg-active": "rgba(124, 140, 255, 0.20)",
      "--dsw-alias-markdown-code-block": "rgba(0, 0, 0, 0.4)",
      "--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-fill": "rgba(11, 11, 14, 0.92)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.085)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.045)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.085)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.13)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.2)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.2)"
    }
  },
  {
    id: "ivory",
    colorScheme: "light",
    name: "Ivory",
    nameZh: "\u8C61\u7259",
    tokens: {
      "--dsw-alias-bg-base": "#f4f4f6",
      "--dsw-alias-bg-layer-1": "#ffffff",
      "--dsw-alias-bg-layer-2": "#ffffff",
      "--dsw-alias-bg-layer-3": "#fafafc",
      "--dsw-alias-bg-module-platform": "#ededf0",
      "--dsw-alias-bg-overlay": "#ffffff",
      "--dsw-specific-input-major": "#ffffff",
      "--dsw-specific-tip": "#ffffff",
      "--dsw-alias-border-l1": "rgba(0, 0, 0, 0.08)",
      "--dsw-alias-border-l2": "rgba(0, 0, 0, 0.14)",
      "--dsw-alias-label-primary": "#1c1c1e",
      "--dsw-alias-label-secondary": "#6e6e73",
      "--dsw-alias-label-tertiary": "#86868b",
      "--dsw-alias-brand-primary": "#0071e3",
      "--dsw-specific-bubble": "#ffffff",
      "--dsw-specific-bubble-highlight": "rgba(0, 113, 227, 0.08)",
      "--dsw-specific-selector": "rgba(0, 0, 0, 0.04)",
      "--dsw-alias-brand-text": "#ffffff",
      "--dsw-alias-button-primary-hover": "#3395ff",
      "--dsw-alias-button-primary-dimmed": "rgba(0, 113, 227, 0.12)",
      "--dsw-alias-state-business-primary": "#0071e3",
      "--dsw-alias-state-business-tertiary": "rgba(0, 113, 227, 0.12)",
      "--dsw-alias-interactive-bg-hover": "rgba(0, 113, 227, 0.10)",
      "--dsw-alias-interactive-bg-active": "rgba(0, 113, 227, 0.16)",
      "--dsw-alias-markdown-code-block": "#f2f2f4",
      "--dsw-alias-markdown-inline-code": "rgba(0, 113, 227, 0.10)",
      "--dsw-specific-sidebar-fill": "#f4f4f6",
      "--dsw-specific-sidebar-nav-item-active": "#e4e4e8",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(0, 0, 0, 0.04)",
      "--dsw-alias-scrollbar-bg-l1": "#d1d1d6",
      "--dsw-alias-scrollbar-bg-l2": "#c0c0c6",
      "--dsw-alias-scrollbar-hover-l1": "#a6a6ad",
      "--dsw-alias-scrollbar-hover-l2": "#a6a6ad"
    }
  },
  {
    id: "mist",
    colorScheme: "light",
    name: "Mist",
    nameZh: "\u6668\u96FE",
    tokens: {
      "--dsw-alias-bg-base": "#e9eef6",
      "--dsw-alias-bg-layer-1": "rgba(255, 255, 255, 0.5)",
      "--dsw-alias-bg-layer-2": "rgba(255, 255, 255, 0.6)",
      "--dsw-alias-bg-layer-3": "rgba(255, 255, 255, 0.68)",
      "--dsw-alias-bg-module-platform": "rgba(243, 247, 252, 0.9)",
      "--dsw-alias-bg-overlay": "rgba(255, 255, 255, 0.55)",
      "--dsw-specific-input-major": "rgba(255, 255, 255, 0.45)",
      "--dsw-specific-tip": "rgba(255, 255, 255, 0.5)",
      "--dsw-alias-border-l1": "rgba(30, 41, 59, 0.10)",
      "--dsw-alias-border-l2": "rgba(30, 41, 59, 0.16)",
      "--dsw-alias-label-primary": "#0f1b33",
      "--dsw-alias-label-secondary": "#3d5270",
      "--dsw-alias-label-tertiary": "#6b80a0",
      "--dsw-alias-brand-primary": "#2196f3",
      "--dsw-specific-bubble": "rgba(255, 255, 255, 0.7)",
      "--dsw-specific-bubble-highlight": "rgba(33, 150, 243, 0.12)",
      "--dsw-specific-selector": "rgba(255, 255, 255, 0.5)",
      "--dsw-alias-brand-text": "#ffffff",
      "--dsw-alias-button-primary-hover": "#42a5f5",
      "--dsw-alias-button-primary-dimmed": "rgba(33, 150, 243, 0.14)",
      "--dsw-alias-state-business-primary": "#2196f3",
      "--dsw-alias-state-business-tertiary": "rgba(33, 150, 243, 0.14)",
      "--dsw-alias-interactive-bg-hover": "rgba(33, 150, 243, 0.12)",
      "--dsw-alias-interactive-bg-active": "rgba(33, 150, 243, 0.20)",
      "--dsw-alias-markdown-code-block": "rgba(255, 255, 255, 0.6)",
      "--dsw-alias-markdown-inline-code": "rgba(33, 150, 243, 0.12)",
      "--dsw-specific-sidebar-fill": "rgba(255, 255, 255, 0.5)",
      "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.72)",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.35)",
      "--dsw-alias-scrollbar-bg-l1": "rgba(30, 41, 59, 0.18)",
      "--dsw-alias-scrollbar-bg-l2": "rgba(30, 41, 59, 0.24)",
      "--dsw-alias-scrollbar-hover-l1": "rgba(30, 41, 59, 0.34)",
      "--dsw-alias-scrollbar-hover-l2": "rgba(30, 41, 59, 0.34)"
    }
  },
  {
    id: "rose",
    colorScheme: "light",
    name: "Rose",
    nameZh: "\u73AB\u7470",
    tokens: {
      "--dsw-alias-bg-base": "#f7f0f3",
      "--dsw-alias-bg-layer-1": "#ffffff",
      "--dsw-alias-bg-layer-2": "#fffdfd",
      "--dsw-alias-bg-layer-3": "#fdeef3",
      "--dsw-alias-bg-module-platform": "#f6e9ef",
      "--dsw-alias-bg-overlay": "#ffffff",
      "--dsw-specific-input-major": "#ffffff",
      "--dsw-specific-tip": "#fff7fa",
      "--dsw-alias-border-l1": "rgba(154, 55, 118, 0.12)",
      "--dsw-alias-border-l2": "rgba(154, 55, 118, 0.20)",
      "--dsw-alias-label-primary": "#3a1424",
      "--dsw-alias-label-secondary": "#8a4a63",
      "--dsw-alias-label-tertiary": "#a86b82",
      "--dsw-alias-brand-primary": "#e91e63",
      "--dsw-specific-bubble": "#ffffff",
      "--dsw-specific-bubble-highlight": "rgba(233, 30, 99, 0.10)",
      "--dsw-specific-selector": "rgba(233, 30, 99, 0.06)",
      "--dsw-alias-brand-text": "#ffffff",
      "--dsw-alias-button-primary-hover": "#f06292",
      "--dsw-alias-button-primary-dimmed": "rgba(233, 30, 99, 0.12)",
      "--dsw-alias-state-business-primary": "#e91e63",
      "--dsw-alias-state-business-tertiary": "rgba(233, 30, 99, 0.12)",
      "--dsw-alias-interactive-bg-hover": "rgba(233, 30, 99, 0.10)",
      "--dsw-alias-interactive-bg-active": "rgba(233, 30, 99, 0.18)",
      "--dsw-alias-markdown-code-block": "#fdeef3",
      "--dsw-alias-markdown-inline-code": "rgba(233, 30, 99, 0.10)",
      "--dsw-specific-sidebar-fill": "#f6e9ef",
      "--dsw-specific-sidebar-nav-item-active": "#f5d4e2",
      "--dsw-specific-sidebar-nav-item-hover": "rgba(233, 30, 99, 0.06)",
      "--dsw-alias-scrollbar-bg-l1": "#e5c7d4",
      "--dsw-alias-scrollbar-bg-l2": "#d9b3c4",
      "--dsw-alias-scrollbar-hover-l1": "#c392ab",
      "--dsw-alias-scrollbar-hover-l2": "#c392ab"
    }
  }
];

// packages/dream-skin/src/index.ts
var SKINS = skins_default;
function listSkins() {
  return SKINS;
}

// node_modules/.pnpm/@ai-sdk+provider@1.1.3/node_modules/@ai-sdk/provider/dist/index.mjs
var marker = "vercel.ai.error";
var symbol = Symbol.for(marker);
var _a;
var _AISDKError = class _AISDKError2 extends Error {
  /**
   * Creates an AI SDK Error.
   *
   * @param {Object} params - The parameters for creating the error.
   * @param {string} params.name - The name of the error.
   * @param {string} params.message - The error message.
   * @param {unknown} [params.cause] - The underlying cause of the error.
   */
  constructor({
    name: name143,
    message,
    cause
  }) {
    super(message);
    this[_a] = true;
    this.name = name143;
    this.cause = cause;
  }
  /**
   * Checks if the given error is an AI SDK Error.
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if the error is an AI SDK Error, false otherwise.
   */
  static isInstance(error) {
    return _AISDKError2.hasMarker(error, marker);
  }
  static hasMarker(error, marker153) {
    const markerSymbol = Symbol.for(marker153);
    return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
  }
};
_a = symbol;
var AISDKError = _AISDKError;
var name = "AI_APICallError";
var marker2 = `vercel.ai.error.${name}`;
var symbol2 = Symbol.for(marker2);
var _a2;
var APICallError = class extends AISDKError {
  constructor({
    message,
    url,
    requestBodyValues,
    statusCode,
    responseHeaders,
    responseBody,
    cause,
    isRetryable = statusCode != null && (statusCode === 408 || // request timeout
    statusCode === 409 || // conflict
    statusCode === 429 || // too many requests
    statusCode >= 500),
    // server error
    data
  }) {
    super({ name, message, cause });
    this[_a2] = true;
    this.url = url;
    this.requestBodyValues = requestBodyValues;
    this.statusCode = statusCode;
    this.responseHeaders = responseHeaders;
    this.responseBody = responseBody;
    this.isRetryable = isRetryable;
    this.data = data;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker2);
  }
};
_a2 = symbol2;
var name2 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var EmptyResponseBodyError = class extends AISDKError {
  // used in isInstance
  constructor({ message = "Empty response body" } = {}) {
    super({ name: name2, message });
    this[_a3] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker3);
  }
};
_a3 = symbol3;
function getErrorMessage(error) {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var InvalidArgumentError = class extends AISDKError {
  constructor({
    message,
    cause,
    argument
  }) {
    super({ name: name3, message, cause });
    this[_a4] = true;
    this.argument = argument;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker4);
  }
};
_a4 = symbol4;
var name4 = "AI_InvalidPromptError";
var marker5 = `vercel.ai.error.${name4}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var InvalidPromptError = class extends AISDKError {
  constructor({
    prompt,
    message,
    cause
  }) {
    super({ name: name4, message: `Invalid prompt: ${message}`, cause });
    this[_a5] = true;
    this.prompt = prompt;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker5);
  }
};
_a5 = symbol5;
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var InvalidResponseDataError = class extends AISDKError {
  constructor({
    data,
    message = `Invalid response data: ${JSON.stringify(data)}.`
  }) {
    super({ name: name5, message });
    this[_a6] = true;
    this.data = data;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker6);
  }
};
_a6 = symbol6;
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var JSONParseError = class extends AISDKError {
  constructor({ text: text2, cause }) {
    super({
      name: name6,
      message: `JSON parsing failed: Text: ${text2}.
Error message: ${getErrorMessage(cause)}`,
      cause
    });
    this[_a7] = true;
    this.text = text2;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker7);
  }
};
_a7 = symbol7;
var name7 = "AI_LoadAPIKeyError";
var marker8 = `vercel.ai.error.${name7}`;
var symbol8 = Symbol.for(marker8);
var _a8;
var LoadAPIKeyError = class extends AISDKError {
  // used in isInstance
  constructor({ message }) {
    super({ name: name7, message });
    this[_a8] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker8);
  }
};
_a8 = symbol8;
var name8 = "AI_LoadSettingError";
var marker9 = `vercel.ai.error.${name8}`;
var symbol9 = Symbol.for(marker9);
var _a9;
_a9 = symbol9;
var name9 = "AI_NoContentGeneratedError";
var marker10 = `vercel.ai.error.${name9}`;
var symbol10 = Symbol.for(marker10);
var _a10;
_a10 = symbol10;
var name10 = "AI_NoSuchModelError";
var marker11 = `vercel.ai.error.${name10}`;
var symbol11 = Symbol.for(marker11);
var _a11;
_a11 = symbol11;
var name11 = "AI_TooManyEmbeddingValuesForCallError";
var marker12 = `vercel.ai.error.${name11}`;
var symbol12 = Symbol.for(marker12);
var _a12;
var TooManyEmbeddingValuesForCallError = class extends AISDKError {
  constructor(options) {
    super({
      name: name11,
      message: `Too many values for a single embedding call. The ${options.provider} model "${options.modelId}" can only embed up to ${options.maxEmbeddingsPerCall} values per call, but ${options.values.length} values were provided.`
    });
    this[_a12] = true;
    this.provider = options.provider;
    this.modelId = options.modelId;
    this.maxEmbeddingsPerCall = options.maxEmbeddingsPerCall;
    this.values = options.values;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker12);
  }
};
_a12 = symbol12;
var name12 = "AI_TypeValidationError";
var marker13 = `vercel.ai.error.${name12}`;
var symbol13 = Symbol.for(marker13);
var _a13;
var _TypeValidationError = class _TypeValidationError2 extends AISDKError {
  constructor({ value, cause }) {
    super({
      name: name12,
      message: `Type validation failed: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
      cause
    });
    this[_a13] = true;
    this.value = value;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker13);
  }
  /**
   * Wraps an error into a TypeValidationError.
   * If the cause is already a TypeValidationError with the same value, it returns the cause.
   * Otherwise, it creates a new TypeValidationError.
   *
   * @param {Object} params - The parameters for wrapping the error.
   * @param {unknown} params.value - The value that failed validation.
   * @param {unknown} params.cause - The original error or cause of the validation failure.
   * @returns {TypeValidationError} A TypeValidationError instance.
   */
  static wrap({
    value,
    cause
  }) {
    return _TypeValidationError2.isInstance(cause) && cause.value === value ? cause : new _TypeValidationError2({ value, cause });
  }
};
_a13 = symbol13;
var TypeValidationError = _TypeValidationError;
var name13 = "AI_UnsupportedFunctionalityError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var UnsupportedFunctionalityError = class extends AISDKError {
  constructor({
    functionality,
    message = `'${functionality}' functionality not supported.`
  }) {
    super({ name: name13, message });
    this[_a14] = true;
    this.functionality = functionality;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker14);
  }
};
_a14 = symbol14;

// node_modules/.pnpm/nanoid@3.3.18/node_modules/nanoid/non-secure/index.js
var customAlphabet = (alphabet, defaultSize = 21) => {
  return (size = defaultSize) => {
    let id = "";
    let i = size | 0;
    while (i-- > 0) {
      id += alphabet[Math.random() * alphabet.length | 0];
    }
    return id;
  };
};

// node_modules/.pnpm/@ai-sdk+provider-utils@2.2.8_zod@3.25.76/node_modules/@ai-sdk/provider-utils/dist/index.mjs
var import_secure_json_parse = __toESM(require_secure_json_parse(), 1);
function combineHeaders(...headers) {
  return headers.reduce(
    (combinedHeaders, currentHeaders) => ({
      ...combinedHeaders,
      ...currentHeaders != null ? currentHeaders : {}
    }),
    {}
  );
}
function convertAsyncIteratorToReadableStream(iterator) {
  return new ReadableStream({
    /**
     * Called when the consumer wants to pull more data from the stream.
     *
     * @param {ReadableStreamDefaultController<T>} controller - The controller to enqueue data into the stream.
     * @returns {Promise<void>}
     */
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    /**
     * Called when the consumer cancels the stream.
     */
    cancel() {
    }
  });
}
async function delay(delayInMs) {
  return delayInMs == null ? Promise.resolve() : new Promise((resolve2) => setTimeout(resolve2, delayInMs));
}
function createEventSourceParserStream() {
  let buffer = "";
  let event = void 0;
  let data = [];
  let lastEventId = void 0;
  let retry = void 0;
  function parseLine(line, controller) {
    if (line === "") {
      dispatchEvent(controller);
      return;
    }
    if (line.startsWith(":")) {
      return;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      handleField(line, "");
      return;
    }
    const field = line.slice(0, colonIndex);
    const valueStart = colonIndex + 1;
    const value = valueStart < line.length && line[valueStart] === " " ? line.slice(valueStart + 1) : line.slice(valueStart);
    handleField(field, value);
  }
  function dispatchEvent(controller) {
    if (data.length > 0) {
      controller.enqueue({
        event,
        data: data.join("\n"),
        id: lastEventId,
        retry
      });
      data = [];
      event = void 0;
      retry = void 0;
    }
  }
  function handleField(field, value) {
    switch (field) {
      case "event":
        event = value;
        break;
      case "data":
        data.push(value);
        break;
      case "id":
        lastEventId = value;
        break;
      case "retry":
        const parsedRetry = parseInt(value, 10);
        if (!isNaN(parsedRetry)) {
          retry = parsedRetry;
        }
        break;
    }
  }
  return new TransformStream({
    transform(chunk, controller) {
      const { lines, incompleteLine } = splitLines(buffer, chunk);
      buffer = incompleteLine;
      for (let i = 0; i < lines.length; i++) {
        parseLine(lines[i], controller);
      }
    },
    flush(controller) {
      parseLine(buffer, controller);
      dispatchEvent(controller);
    }
  });
}
function splitLines(buffer, chunk) {
  const lines = [];
  let currentLine = buffer;
  for (let i = 0; i < chunk.length; ) {
    const char = chunk[i++];
    if (char === "\n") {
      lines.push(currentLine);
      currentLine = "";
    } else if (char === "\r") {
      lines.push(currentLine);
      currentLine = "";
      if (chunk[i] === "\n") {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  return { lines, incompleteLine: currentLine };
}
function extractResponseHeaders(response) {
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}
var createIdGenerator = ({
  prefix,
  size: defaultSize = 16,
  alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  separator = "-"
} = {}) => {
  const generator = customAlphabet(alphabet, defaultSize);
  if (prefix == null) {
    return generator;
  }
  if (alphabet.includes(separator)) {
    throw new InvalidArgumentError({
      argument: "separator",
      message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
    });
  }
  return (size) => `${prefix}${separator}${generator(size)}`;
};
var generateId = createIdGenerator();
function getErrorMessage2(error) {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}
function removeUndefinedEntries(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([_key, value]) => value != null)
  );
}
function isAbortError(error) {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}
function loadApiKey({
  apiKey,
  environmentVariableName,
  apiKeyParameterName = "apiKey",
  description
}) {
  if (typeof apiKey === "string") {
    return apiKey;
  }
  if (apiKey != null) {
    throw new LoadAPIKeyError({
      message: `${description} API key must be a string.`
    });
  }
  if (typeof process === "undefined") {
    throw new LoadAPIKeyError({
      message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter. Environment variables is not supported in this environment.`
    });
  }
  apiKey = process.env[environmentVariableName];
  if (apiKey == null) {
    throw new LoadAPIKeyError({
      message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter or the ${environmentVariableName} environment variable.`
    });
  }
  if (typeof apiKey !== "string") {
    throw new LoadAPIKeyError({
      message: `${description} API key must be a string. The value of the ${environmentVariableName} environment variable is not a string.`
    });
  }
  return apiKey;
}
var validatorSymbol = Symbol.for("vercel.ai.validator");
function validator(validate) {
  return { [validatorSymbol]: true, validate };
}
function isValidator(value) {
  return typeof value === "object" && value !== null && validatorSymbol in value && value[validatorSymbol] === true && "validate" in value;
}
function asValidator(value) {
  return isValidator(value) ? value : zodValidator(value);
}
function zodValidator(zodSchema2) {
  return validator((value) => {
    const result = zodSchema2.safeParse(value);
    return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
  });
}
function validateTypes({
  value,
  schema: inputSchema
}) {
  const result = safeValidateTypes({ value, schema: inputSchema });
  if (!result.success) {
    throw TypeValidationError.wrap({ value, cause: result.error });
  }
  return result.value;
}
function safeValidateTypes({
  value,
  schema
}) {
  const validator2 = asValidator(schema);
  try {
    if (validator2.validate == null) {
      return { success: true, value };
    }
    const result = validator2.validate(value);
    if (result.success) {
      return result;
    }
    return {
      success: false,
      error: TypeValidationError.wrap({ value, cause: result.error })
    };
  } catch (error) {
    return {
      success: false,
      error: TypeValidationError.wrap({ value, cause: error })
    };
  }
}
function parseJSON({
  text: text2,
  schema
}) {
  try {
    const value = import_secure_json_parse.default.parse(text2);
    if (schema == null) {
      return value;
    }
    return validateTypes({ value, schema });
  } catch (error) {
    if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) {
      throw error;
    }
    throw new JSONParseError({ text: text2, cause: error });
  }
}
function safeParseJSON({
  text: text2,
  schema
}) {
  try {
    const value = import_secure_json_parse.default.parse(text2);
    if (schema == null) {
      return { success: true, value, rawValue: value };
    }
    const validationResult = safeValidateTypes({ value, schema });
    return validationResult.success ? { ...validationResult, rawValue: value } : validationResult;
  } catch (error) {
    return {
      success: false,
      error: JSONParseError.isInstance(error) ? error : new JSONParseError({ text: text2, cause: error })
    };
  }
}
function isParsableJson(input) {
  try {
    import_secure_json_parse.default.parse(input);
    return true;
  } catch (e) {
    return false;
  }
}
function parseProviderOptions({
  provider,
  providerOptions,
  schema
}) {
  if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) {
    return void 0;
  }
  const parsedProviderOptions = safeValidateTypes({
    value: providerOptions[provider],
    schema
  });
  if (!parsedProviderOptions.success) {
    throw new InvalidArgumentError({
      argument: "providerOptions",
      message: `invalid ${provider} provider options`,
      cause: parsedProviderOptions.error
    });
  }
  return parsedProviderOptions.value;
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({
  url,
  headers,
  body,
  failedResponseHandler,
  successfulResponseHandler,
  abortSignal,
  fetch: fetch2
}) => postToApi({
  url,
  headers: {
    "Content-Type": "application/json",
    ...headers
  },
  body: {
    content: JSON.stringify(body),
    values: body
  },
  failedResponseHandler,
  successfulResponseHandler,
  abortSignal,
  fetch: fetch2
});
var postFormDataToApi = async ({
  url,
  headers,
  formData,
  failedResponseHandler,
  successfulResponseHandler,
  abortSignal,
  fetch: fetch2
}) => postToApi({
  url,
  headers,
  body: {
    content: formData,
    values: Object.fromEntries(formData.entries())
  },
  failedResponseHandler,
  successfulResponseHandler,
  abortSignal,
  fetch: fetch2
});
var postToApi = async ({
  url,
  headers = {},
  body,
  successfulResponseHandler,
  failedResponseHandler,
  abortSignal,
  fetch: fetch2 = getOriginalFetch2()
}) => {
  try {
    const response = await fetch2(url, {
      method: "POST",
      headers: removeUndefinedEntries(headers),
      body: body.content,
      signal: abortSignal
    });
    const responseHeaders = extractResponseHeaders(response);
    if (!response.ok) {
      let errorInformation;
      try {
        errorInformation = await failedResponseHandler({
          response,
          url,
          requestBodyValues: body.values
        });
      } catch (error) {
        if (isAbortError(error) || APICallError.isInstance(error)) {
          throw error;
        }
        throw new APICallError({
          message: "Failed to process error response",
          cause: error,
          statusCode: response.status,
          url,
          responseHeaders,
          requestBodyValues: body.values
        });
      }
      throw errorInformation.value;
    }
    try {
      return await successfulResponseHandler({
        response,
        url,
        requestBodyValues: body.values
      });
    } catch (error) {
      if (error instanceof Error) {
        if (isAbortError(error) || APICallError.isInstance(error)) {
          throw error;
        }
      }
      throw new APICallError({
        message: "Failed to process successful response",
        cause: error,
        statusCode: response.status,
        url,
        responseHeaders,
        requestBodyValues: body.values
      });
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    if (error instanceof TypeError && error.message === "fetch failed") {
      const cause = error.cause;
      if (cause != null) {
        throw new APICallError({
          message: `Cannot connect to API: ${cause.message}`,
          cause,
          url,
          requestBodyValues: body.values,
          isRetryable: true
          // retry when network error
        });
      }
    }
    throw error;
  }
};
var createJsonErrorResponseHandler = ({
  errorSchema,
  errorToMessage,
  isRetryable
}) => async ({ response, url, requestBodyValues }) => {
  const responseBody = await response.text();
  const responseHeaders = extractResponseHeaders(response);
  if (responseBody.trim() === "") {
    return {
      responseHeaders,
      value: new APICallError({
        message: response.statusText,
        url,
        requestBodyValues,
        statusCode: response.status,
        responseHeaders,
        responseBody,
        isRetryable: isRetryable == null ? void 0 : isRetryable(response)
      })
    };
  }
  try {
    const parsedError = parseJSON({
      text: responseBody,
      schema: errorSchema
    });
    return {
      responseHeaders,
      value: new APICallError({
        message: errorToMessage(parsedError),
        url,
        requestBodyValues,
        statusCode: response.status,
        responseHeaders,
        responseBody,
        data: parsedError,
        isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
      })
    };
  } catch (parseError) {
    return {
      responseHeaders,
      value: new APICallError({
        message: response.statusText,
        url,
        requestBodyValues,
        statusCode: response.status,
        responseHeaders,
        responseBody,
        isRetryable: isRetryable == null ? void 0 : isRetryable(response)
      })
    };
  }
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
  const responseHeaders = extractResponseHeaders(response);
  if (response.body == null) {
    throw new EmptyResponseBodyError({});
  }
  return {
    responseHeaders,
    value: response.body.pipeThrough(new TextDecoderStream()).pipeThrough(createEventSourceParserStream()).pipeThrough(
      new TransformStream({
        transform({ data }, controller) {
          if (data === "[DONE]") {
            return;
          }
          controller.enqueue(
            safeParseJSON({
              text: data,
              schema: chunkSchema
            })
          );
        }
      })
    )
  };
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
  const responseBody = await response.text();
  const parsedResult = safeParseJSON({
    text: responseBody,
    schema: responseSchema
  });
  const responseHeaders = extractResponseHeaders(response);
  if (!parsedResult.success) {
    throw new APICallError({
      message: "Invalid JSON response",
      cause: parsedResult.error,
      statusCode: response.status,
      responseHeaders,
      responseBody,
      url,
      requestBodyValues
    });
  }
  return {
    responseHeaders,
    value: parsedResult.value,
    rawValue: parsedResult.rawValue
  };
};
var createBinaryResponseHandler = () => async ({ response, url, requestBodyValues }) => {
  const responseHeaders = extractResponseHeaders(response);
  if (!response.body) {
    throw new APICallError({
      message: "Response body is empty",
      url,
      requestBodyValues,
      statusCode: response.status,
      responseHeaders,
      responseBody: void 0
    });
  }
  try {
    const buffer = await response.arrayBuffer();
    return {
      responseHeaders,
      value: new Uint8Array(buffer)
    };
  } catch (error) {
    throw new APICallError({
      message: "Failed to read response as array buffer",
      url,
      requestBodyValues,
      statusCode: response.status,
      responseHeaders,
      responseBody: void 0,
      cause: error
    });
  }
};
var { btoa, atob: atob2 } = globalThis;
function convertBase64ToUint8Array(base64String) {
  const base64Url = base64String.replace(/-/g, "+").replace(/_/g, "/");
  const latin1string = atob2(base64Url);
  return Uint8Array.from(latin1string, (byte) => byte.codePointAt(0));
}
function convertUint8ArrayToBase64(array) {
  let latin1string = "";
  for (let i = 0; i < array.length; i++) {
    latin1string += String.fromCodePoint(array[i]);
  }
  return btoa(latin1string);
}
function withoutTrailingSlash(url) {
  return url == null ? void 0 : url.replace(/\/$/, "");
}

// node_modules/.pnpm/@ai-sdk+openai@1.3.22_zod@3.25.76/node_modules/@ai-sdk/openai/dist/index.mjs
function convertToOpenAIChatMessages({
  prompt,
  useLegacyFunctionCalling = false,
  systemMessageMode = "system"
}) {
  const messages = [];
  const warnings = [];
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        switch (systemMessageMode) {
          case "system": {
            messages.push({ role: "system", content });
            break;
          }
          case "developer": {
            messages.push({ role: "developer", content });
            break;
          }
          case "remove": {
            warnings.push({
              type: "other",
              message: "system messages are removed for this model"
            });
            break;
          }
          default: {
            const _exhaustiveCheck = systemMessageMode;
            throw new Error(
              `Unsupported system message mode: ${_exhaustiveCheck}`
            );
          }
        }
        break;
      }
      case "user": {
        if (content.length === 1 && content[0].type === "text") {
          messages.push({ role: "user", content: content[0].text });
          break;
        }
        messages.push({
          role: "user",
          content: content.map((part, index) => {
            var _a17, _b, _c, _d;
            switch (part.type) {
              case "text": {
                return { type: "text", text: part.text };
              }
              case "image": {
                return {
                  type: "image_url",
                  image_url: {
                    url: part.image instanceof URL ? part.image.toString() : `data:${(_a17 = part.mimeType) != null ? _a17 : "image/jpeg"};base64,${convertUint8ArrayToBase64(part.image)}`,
                    // OpenAI specific extension: image detail
                    detail: (_c = (_b = part.providerMetadata) == null ? void 0 : _b.openai) == null ? void 0 : _c.imageDetail
                  }
                };
              }
              case "file": {
                if (part.data instanceof URL) {
                  throw new UnsupportedFunctionalityError({
                    functionality: "'File content parts with URL data' functionality not supported."
                  });
                }
                switch (part.mimeType) {
                  case "audio/wav": {
                    return {
                      type: "input_audio",
                      input_audio: { data: part.data, format: "wav" }
                    };
                  }
                  case "audio/mp3":
                  case "audio/mpeg": {
                    return {
                      type: "input_audio",
                      input_audio: { data: part.data, format: "mp3" }
                    };
                  }
                  case "application/pdf": {
                    return {
                      type: "file",
                      file: {
                        filename: (_d = part.filename) != null ? _d : `part-${index}.pdf`,
                        file_data: `data:application/pdf;base64,${part.data}`
                      }
                    };
                  }
                  default: {
                    throw new UnsupportedFunctionalityError({
                      functionality: `File content part type ${part.mimeType} in user messages`
                    });
                  }
                }
              }
            }
          })
        });
        break;
      }
      case "assistant": {
        let text2 = "";
        const toolCalls = [];
        for (const part of content) {
          switch (part.type) {
            case "text": {
              text2 += part.text;
              break;
            }
            case "tool-call": {
              toolCalls.push({
                id: part.toolCallId,
                type: "function",
                function: {
                  name: part.toolName,
                  arguments: JSON.stringify(part.args)
                }
              });
              break;
            }
          }
        }
        if (useLegacyFunctionCalling) {
          if (toolCalls.length > 1) {
            throw new UnsupportedFunctionalityError({
              functionality: "useLegacyFunctionCalling with multiple tool calls in one message"
            });
          }
          messages.push({
            role: "assistant",
            content: text2,
            function_call: toolCalls.length > 0 ? toolCalls[0].function : void 0
          });
        } else {
          messages.push({
            role: "assistant",
            content: text2,
            tool_calls: toolCalls.length > 0 ? toolCalls : void 0
          });
        }
        break;
      }
      case "tool": {
        for (const toolResponse of content) {
          if (useLegacyFunctionCalling) {
            messages.push({
              role: "function",
              name: toolResponse.toolName,
              content: JSON.stringify(toolResponse.result)
            });
          } else {
            messages.push({
              role: "tool",
              tool_call_id: toolResponse.toolCallId,
              content: JSON.stringify(toolResponse.result)
            });
          }
        }
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  return { messages, warnings };
}
function mapOpenAIChatLogProbsOutput(logprobs) {
  var _a17, _b;
  return (_b = (_a17 = logprobs == null ? void 0 : logprobs.content) == null ? void 0 : _a17.map(({ token, logprob, top_logprobs }) => ({
    token,
    logprob,
    topLogprobs: top_logprobs ? top_logprobs.map(({ token: token2, logprob: logprob2 }) => ({
      token: token2,
      logprob: logprob2
    })) : []
  }))) != null ? _b : void 0;
}
function mapOpenAIFinishReason(finishReason) {
  switch (finishReason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content-filter";
    case "function_call":
    case "tool_calls":
      return "tool-calls";
    default:
      return "unknown";
  }
}
var openaiErrorDataSchema = external_exports.object({
  error: external_exports.object({
    message: external_exports.string(),
    // The additional information below is handled loosely to support
    // OpenAI-compatible providers that have slightly different error
    // responses:
    type: external_exports.string().nullish(),
    param: external_exports.any().nullish(),
    code: external_exports.union([external_exports.string(), external_exports.number()]).nullish()
  })
});
var openaiFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: openaiErrorDataSchema,
  errorToMessage: (data) => data.error.message
});
function getResponseMetadata({
  id,
  model,
  created
}) {
  return {
    id: id != null ? id : void 0,
    modelId: model != null ? model : void 0,
    timestamp: created != null ? new Date(created * 1e3) : void 0
  };
}
function prepareTools({
  mode,
  useLegacyFunctionCalling = false,
  structuredOutputs
}) {
  var _a17;
  const tools = ((_a17 = mode.tools) == null ? void 0 : _a17.length) ? mode.tools : void 0;
  const toolWarnings = [];
  if (tools == null) {
    return { tools: void 0, tool_choice: void 0, toolWarnings };
  }
  const toolChoice = mode.toolChoice;
  if (useLegacyFunctionCalling) {
    const openaiFunctions = [];
    for (const tool2 of tools) {
      if (tool2.type === "provider-defined") {
        toolWarnings.push({ type: "unsupported-tool", tool: tool2 });
      } else {
        openaiFunctions.push({
          name: tool2.name,
          description: tool2.description,
          parameters: tool2.parameters
        });
      }
    }
    if (toolChoice == null) {
      return {
        functions: openaiFunctions,
        function_call: void 0,
        toolWarnings
      };
    }
    const type2 = toolChoice.type;
    switch (type2) {
      case "auto":
      case "none":
      case void 0:
        return {
          functions: openaiFunctions,
          function_call: void 0,
          toolWarnings
        };
      case "required":
        throw new UnsupportedFunctionalityError({
          functionality: "useLegacyFunctionCalling and toolChoice: required"
        });
      default:
        return {
          functions: openaiFunctions,
          function_call: { name: toolChoice.toolName },
          toolWarnings
        };
    }
  }
  const openaiTools2 = [];
  for (const tool2 of tools) {
    if (tool2.type === "provider-defined") {
      toolWarnings.push({ type: "unsupported-tool", tool: tool2 });
    } else {
      openaiTools2.push({
        type: "function",
        function: {
          name: tool2.name,
          description: tool2.description,
          parameters: tool2.parameters,
          strict: structuredOutputs ? true : void 0
        }
      });
    }
  }
  if (toolChoice == null) {
    return { tools: openaiTools2, tool_choice: void 0, toolWarnings };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
    case "none":
    case "required":
      return { tools: openaiTools2, tool_choice: type, toolWarnings };
    case "tool":
      return {
        tools: openaiTools2,
        tool_choice: {
          type: "function",
          function: {
            name: toolChoice.toolName
          }
        },
        toolWarnings
      };
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError({
        functionality: `Unsupported tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
var OpenAIChatLanguageModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  get supportsStructuredOutputs() {
    var _a17;
    return (_a17 = this.settings.structuredOutputs) != null ? _a17 : isReasoningModel(this.modelId);
  }
  get defaultObjectGenerationMode() {
    if (isAudioModel(this.modelId)) {
      return "tool";
    }
    return this.supportsStructuredOutputs ? "json" : "tool";
  }
  get provider() {
    return this.config.provider;
  }
  get supportsImageUrls() {
    return !this.settings.downloadImages;
  }
  getArgs({
    mode,
    prompt,
    maxTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed,
    providerMetadata
  }) {
    var _a17, _b, _c, _d, _e, _f, _g, _h;
    const type = mode.type;
    const warnings = [];
    if (topK != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "topK"
      });
    }
    if ((responseFormat == null ? void 0 : responseFormat.type) === "json" && responseFormat.schema != null && !this.supportsStructuredOutputs) {
      warnings.push({
        type: "unsupported-setting",
        setting: "responseFormat",
        details: "JSON response format schema is only supported with structuredOutputs"
      });
    }
    const useLegacyFunctionCalling = this.settings.useLegacyFunctionCalling;
    if (useLegacyFunctionCalling && this.settings.parallelToolCalls === true) {
      throw new UnsupportedFunctionalityError({
        functionality: "useLegacyFunctionCalling with parallelToolCalls"
      });
    }
    if (useLegacyFunctionCalling && this.supportsStructuredOutputs) {
      throw new UnsupportedFunctionalityError({
        functionality: "structuredOutputs with useLegacyFunctionCalling"
      });
    }
    const { messages, warnings: messageWarnings } = convertToOpenAIChatMessages(
      {
        prompt,
        useLegacyFunctionCalling,
        systemMessageMode: getSystemMessageMode(this.modelId)
      }
    );
    warnings.push(...messageWarnings);
    const baseArgs = {
      // model id:
      model: this.modelId,
      // model specific settings:
      logit_bias: this.settings.logitBias,
      logprobs: this.settings.logprobs === true || typeof this.settings.logprobs === "number" ? true : void 0,
      top_logprobs: typeof this.settings.logprobs === "number" ? this.settings.logprobs : typeof this.settings.logprobs === "boolean" ? this.settings.logprobs ? 0 : void 0 : void 0,
      user: this.settings.user,
      parallel_tool_calls: this.settings.parallelToolCalls,
      // standardized settings:
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? this.supportsStructuredOutputs && responseFormat.schema != null ? {
        type: "json_schema",
        json_schema: {
          schema: responseFormat.schema,
          strict: true,
          name: (_a17 = responseFormat.name) != null ? _a17 : "response",
          description: responseFormat.description
        }
      } : { type: "json_object" } : void 0,
      stop: stopSequences,
      seed,
      // openai specific settings:
      // TODO remove in next major version; we auto-map maxTokens now
      max_completion_tokens: (_b = providerMetadata == null ? void 0 : providerMetadata.openai) == null ? void 0 : _b.maxCompletionTokens,
      store: (_c = providerMetadata == null ? void 0 : providerMetadata.openai) == null ? void 0 : _c.store,
      metadata: (_d = providerMetadata == null ? void 0 : providerMetadata.openai) == null ? void 0 : _d.metadata,
      prediction: (_e = providerMetadata == null ? void 0 : providerMetadata.openai) == null ? void 0 : _e.prediction,
      reasoning_effort: (_g = (_f = providerMetadata == null ? void 0 : providerMetadata.openai) == null ? void 0 : _f.reasoningEffort) != null ? _g : this.settings.reasoningEffort,
      // messages:
      messages
    };
    if (isReasoningModel(this.modelId)) {
      if (baseArgs.temperature != null) {
        baseArgs.temperature = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "temperature",
          details: "temperature is not supported for reasoning models"
        });
      }
      if (baseArgs.top_p != null) {
        baseArgs.top_p = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "topP",
          details: "topP is not supported for reasoning models"
        });
      }
      if (baseArgs.frequency_penalty != null) {
        baseArgs.frequency_penalty = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "frequencyPenalty",
          details: "frequencyPenalty is not supported for reasoning models"
        });
      }
      if (baseArgs.presence_penalty != null) {
        baseArgs.presence_penalty = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "presencePenalty",
          details: "presencePenalty is not supported for reasoning models"
        });
      }
      if (baseArgs.logit_bias != null) {
        baseArgs.logit_bias = void 0;
        warnings.push({
          type: "other",
          message: "logitBias is not supported for reasoning models"
        });
      }
      if (baseArgs.logprobs != null) {
        baseArgs.logprobs = void 0;
        warnings.push({
          type: "other",
          message: "logprobs is not supported for reasoning models"
        });
      }
      if (baseArgs.top_logprobs != null) {
        baseArgs.top_logprobs = void 0;
        warnings.push({
          type: "other",
          message: "topLogprobs is not supported for reasoning models"
        });
      }
      if (baseArgs.max_tokens != null) {
        if (baseArgs.max_completion_tokens == null) {
          baseArgs.max_completion_tokens = baseArgs.max_tokens;
        }
        baseArgs.max_tokens = void 0;
      }
    } else if (this.modelId.startsWith("gpt-4o-search-preview") || this.modelId.startsWith("gpt-4o-mini-search-preview")) {
      if (baseArgs.temperature != null) {
        baseArgs.temperature = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "temperature",
          details: "temperature is not supported for the search preview models and has been removed."
        });
      }
    }
    switch (type) {
      case "regular": {
        const { tools, tool_choice, functions, function_call, toolWarnings } = prepareTools({
          mode,
          useLegacyFunctionCalling,
          structuredOutputs: this.supportsStructuredOutputs
        });
        return {
          args: {
            ...baseArgs,
            tools,
            tool_choice,
            functions,
            function_call
          },
          warnings: [...warnings, ...toolWarnings]
        };
      }
      case "object-json": {
        return {
          args: {
            ...baseArgs,
            response_format: this.supportsStructuredOutputs && mode.schema != null ? {
              type: "json_schema",
              json_schema: {
                schema: mode.schema,
                strict: true,
                name: (_h = mode.name) != null ? _h : "response",
                description: mode.description
              }
            } : { type: "json_object" }
          },
          warnings
        };
      }
      case "object-tool": {
        return {
          args: useLegacyFunctionCalling ? {
            ...baseArgs,
            function_call: {
              name: mode.tool.name
            },
            functions: [
              {
                name: mode.tool.name,
                description: mode.tool.description,
                parameters: mode.tool.parameters
              }
            ]
          } : {
            ...baseArgs,
            tool_choice: {
              type: "function",
              function: { name: mode.tool.name }
            },
            tools: [
              {
                type: "function",
                function: {
                  name: mode.tool.name,
                  description: mode.tool.description,
                  parameters: mode.tool.parameters,
                  strict: this.supportsStructuredOutputs ? true : void 0
                }
              }
            ]
          },
          warnings
        };
      }
      default: {
        const _exhaustiveCheck = type;
        throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
      }
    }
  }
  async doGenerate(options) {
    var _a17, _b, _c, _d, _e, _f, _g, _h;
    const { args: body, warnings } = this.getArgs(options);
    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse
    } = await postJsonToApi({
      url: this.config.url({
        path: "/chat/completions",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiChatResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { messages: rawPrompt, ...rawSettings } = body;
    const choice = response.choices[0];
    const completionTokenDetails = (_a17 = response.usage) == null ? void 0 : _a17.completion_tokens_details;
    const promptTokenDetails = (_b = response.usage) == null ? void 0 : _b.prompt_tokens_details;
    const providerMetadata = { openai: {} };
    if ((completionTokenDetails == null ? void 0 : completionTokenDetails.reasoning_tokens) != null) {
      providerMetadata.openai.reasoningTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.reasoning_tokens;
    }
    if ((completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens) != null) {
      providerMetadata.openai.acceptedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.accepted_prediction_tokens;
    }
    if ((completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens) != null) {
      providerMetadata.openai.rejectedPredictionTokens = completionTokenDetails == null ? void 0 : completionTokenDetails.rejected_prediction_tokens;
    }
    if ((promptTokenDetails == null ? void 0 : promptTokenDetails.cached_tokens) != null) {
      providerMetadata.openai.cachedPromptTokens = promptTokenDetails == null ? void 0 : promptTokenDetails.cached_tokens;
    }
    return {
      text: (_c = choice.message.content) != null ? _c : void 0,
      toolCalls: this.settings.useLegacyFunctionCalling && choice.message.function_call ? [
        {
          toolCallType: "function",
          toolCallId: generateId(),
          toolName: choice.message.function_call.name,
          args: choice.message.function_call.arguments
        }
      ] : (_d = choice.message.tool_calls) == null ? void 0 : _d.map((toolCall) => {
        var _a23;
        return {
          toolCallType: "function",
          toolCallId: (_a23 = toolCall.id) != null ? _a23 : generateId(),
          toolName: toolCall.function.name,
          args: toolCall.function.arguments
        };
      }),
      finishReason: mapOpenAIFinishReason(choice.finish_reason),
      usage: {
        promptTokens: (_f = (_e = response.usage) == null ? void 0 : _e.prompt_tokens) != null ? _f : NaN,
        completionTokens: (_h = (_g = response.usage) == null ? void 0 : _g.completion_tokens) != null ? _h : NaN
      },
      rawCall: { rawPrompt, rawSettings },
      rawResponse: { headers: responseHeaders, body: rawResponse },
      request: { body: JSON.stringify(body) },
      response: getResponseMetadata(response),
      warnings,
      logprobs: mapOpenAIChatLogProbsOutput(choice.logprobs),
      providerMetadata
    };
  }
  async doStream(options) {
    if (this.settings.simulateStreaming) {
      const result = await this.doGenerate(options);
      const simulatedStream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "response-metadata", ...result.response });
          if (result.text) {
            controller.enqueue({
              type: "text-delta",
              textDelta: result.text
            });
          }
          if (result.toolCalls) {
            for (const toolCall of result.toolCalls) {
              controller.enqueue({
                type: "tool-call-delta",
                toolCallType: "function",
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                argsTextDelta: toolCall.args
              });
              controller.enqueue({
                type: "tool-call",
                ...toolCall
              });
            }
          }
          controller.enqueue({
            type: "finish",
            finishReason: result.finishReason,
            usage: result.usage,
            logprobs: result.logprobs,
            providerMetadata: result.providerMetadata
          });
          controller.close();
        }
      });
      return {
        stream: simulatedStream,
        rawCall: result.rawCall,
        rawResponse: result.rawResponse,
        warnings: result.warnings
      };
    }
    const { args, warnings } = this.getArgs(options);
    const body = {
      ...args,
      stream: true,
      // only include stream_options when in strict compatibility mode:
      stream_options: this.config.compatibility === "strict" ? { include_usage: true } : void 0
    };
    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: "/chat/completions",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        openaiChatChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { messages: rawPrompt, ...rawSettings } = args;
    const toolCalls = [];
    let finishReason = "unknown";
    let usage = {
      promptTokens: void 0,
      completionTokens: void 0
    };
    let logprobs;
    let isFirstChunk = true;
    const { useLegacyFunctionCalling } = this.settings;
    const providerMetadata = { openai: {} };
    return {
      stream: response.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            var _a17, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
            if (!chunk.success) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: chunk.error });
              return;
            }
            const value = chunk.value;
            if ("error" in value) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: value.error });
              return;
            }
            if (isFirstChunk) {
              isFirstChunk = false;
              controller.enqueue({
                type: "response-metadata",
                ...getResponseMetadata(value)
              });
            }
            if (value.usage != null) {
              const {
                prompt_tokens,
                completion_tokens,
                prompt_tokens_details,
                completion_tokens_details
              } = value.usage;
              usage = {
                promptTokens: prompt_tokens != null ? prompt_tokens : void 0,
                completionTokens: completion_tokens != null ? completion_tokens : void 0
              };
              if ((completion_tokens_details == null ? void 0 : completion_tokens_details.reasoning_tokens) != null) {
                providerMetadata.openai.reasoningTokens = completion_tokens_details == null ? void 0 : completion_tokens_details.reasoning_tokens;
              }
              if ((completion_tokens_details == null ? void 0 : completion_tokens_details.accepted_prediction_tokens) != null) {
                providerMetadata.openai.acceptedPredictionTokens = completion_tokens_details == null ? void 0 : completion_tokens_details.accepted_prediction_tokens;
              }
              if ((completion_tokens_details == null ? void 0 : completion_tokens_details.rejected_prediction_tokens) != null) {
                providerMetadata.openai.rejectedPredictionTokens = completion_tokens_details == null ? void 0 : completion_tokens_details.rejected_prediction_tokens;
              }
              if ((prompt_tokens_details == null ? void 0 : prompt_tokens_details.cached_tokens) != null) {
                providerMetadata.openai.cachedPromptTokens = prompt_tokens_details == null ? void 0 : prompt_tokens_details.cached_tokens;
              }
            }
            const choice = value.choices[0];
            if ((choice == null ? void 0 : choice.finish_reason) != null) {
              finishReason = mapOpenAIFinishReason(choice.finish_reason);
            }
            if ((choice == null ? void 0 : choice.delta) == null) {
              return;
            }
            const delta = choice.delta;
            if (delta.content != null) {
              controller.enqueue({
                type: "text-delta",
                textDelta: delta.content
              });
            }
            const mappedLogprobs = mapOpenAIChatLogProbsOutput(
              choice == null ? void 0 : choice.logprobs
            );
            if (mappedLogprobs == null ? void 0 : mappedLogprobs.length) {
              if (logprobs === void 0) logprobs = [];
              logprobs.push(...mappedLogprobs);
            }
            const mappedToolCalls = useLegacyFunctionCalling && delta.function_call != null ? [
              {
                type: "function",
                id: generateId(),
                function: delta.function_call,
                index: 0
              }
            ] : delta.tool_calls;
            if (mappedToolCalls != null) {
              for (const toolCallDelta of mappedToolCalls) {
                const index = toolCallDelta.index;
                if (toolCalls[index] == null) {
                  if (toolCallDelta.type !== "function") {
                    throw new InvalidResponseDataError({
                      data: toolCallDelta,
                      message: `Expected 'function' type.`
                    });
                  }
                  if (toolCallDelta.id == null) {
                    throw new InvalidResponseDataError({
                      data: toolCallDelta,
                      message: `Expected 'id' to be a string.`
                    });
                  }
                  if (((_a17 = toolCallDelta.function) == null ? void 0 : _a17.name) == null) {
                    throw new InvalidResponseDataError({
                      data: toolCallDelta,
                      message: `Expected 'function.name' to be a string.`
                    });
                  }
                  toolCalls[index] = {
                    id: toolCallDelta.id,
                    type: "function",
                    function: {
                      name: toolCallDelta.function.name,
                      arguments: (_b = toolCallDelta.function.arguments) != null ? _b : ""
                    },
                    hasFinished: false
                  };
                  const toolCall2 = toolCalls[index];
                  if (((_c = toolCall2.function) == null ? void 0 : _c.name) != null && ((_d = toolCall2.function) == null ? void 0 : _d.arguments) != null) {
                    if (toolCall2.function.arguments.length > 0) {
                      controller.enqueue({
                        type: "tool-call-delta",
                        toolCallType: "function",
                        toolCallId: toolCall2.id,
                        toolName: toolCall2.function.name,
                        argsTextDelta: toolCall2.function.arguments
                      });
                    }
                    if (isParsableJson(toolCall2.function.arguments)) {
                      controller.enqueue({
                        type: "tool-call",
                        toolCallType: "function",
                        toolCallId: (_e = toolCall2.id) != null ? _e : generateId(),
                        toolName: toolCall2.function.name,
                        args: toolCall2.function.arguments
                      });
                      toolCall2.hasFinished = true;
                    }
                  }
                  continue;
                }
                const toolCall = toolCalls[index];
                if (toolCall.hasFinished) {
                  continue;
                }
                if (((_f = toolCallDelta.function) == null ? void 0 : _f.arguments) != null) {
                  toolCall.function.arguments += (_h = (_g = toolCallDelta.function) == null ? void 0 : _g.arguments) != null ? _h : "";
                }
                controller.enqueue({
                  type: "tool-call-delta",
                  toolCallType: "function",
                  toolCallId: toolCall.id,
                  toolName: toolCall.function.name,
                  argsTextDelta: (_i = toolCallDelta.function.arguments) != null ? _i : ""
                });
                if (((_j = toolCall.function) == null ? void 0 : _j.name) != null && ((_k = toolCall.function) == null ? void 0 : _k.arguments) != null && isParsableJson(toolCall.function.arguments)) {
                  controller.enqueue({
                    type: "tool-call",
                    toolCallType: "function",
                    toolCallId: (_l = toolCall.id) != null ? _l : generateId(),
                    toolName: toolCall.function.name,
                    args: toolCall.function.arguments
                  });
                  toolCall.hasFinished = true;
                }
              }
            }
          },
          flush(controller) {
            var _a17, _b;
            controller.enqueue({
              type: "finish",
              finishReason,
              logprobs,
              usage: {
                promptTokens: (_a17 = usage.promptTokens) != null ? _a17 : NaN,
                completionTokens: (_b = usage.completionTokens) != null ? _b : NaN
              },
              ...providerMetadata != null ? { providerMetadata } : {}
            });
          }
        })
      ),
      rawCall: { rawPrompt, rawSettings },
      rawResponse: { headers: responseHeaders },
      request: { body: JSON.stringify(body) },
      warnings
    };
  }
};
var openaiTokenUsageSchema = external_exports.object({
  prompt_tokens: external_exports.number().nullish(),
  completion_tokens: external_exports.number().nullish(),
  prompt_tokens_details: external_exports.object({
    cached_tokens: external_exports.number().nullish()
  }).nullish(),
  completion_tokens_details: external_exports.object({
    reasoning_tokens: external_exports.number().nullish(),
    accepted_prediction_tokens: external_exports.number().nullish(),
    rejected_prediction_tokens: external_exports.number().nullish()
  }).nullish()
}).nullish();
var openaiChatResponseSchema = external_exports.object({
  id: external_exports.string().nullish(),
  created: external_exports.number().nullish(),
  model: external_exports.string().nullish(),
  choices: external_exports.array(
    external_exports.object({
      message: external_exports.object({
        role: external_exports.literal("assistant").nullish(),
        content: external_exports.string().nullish(),
        function_call: external_exports.object({
          arguments: external_exports.string(),
          name: external_exports.string()
        }).nullish(),
        tool_calls: external_exports.array(
          external_exports.object({
            id: external_exports.string().nullish(),
            type: external_exports.literal("function"),
            function: external_exports.object({
              name: external_exports.string(),
              arguments: external_exports.string()
            })
          })
        ).nullish()
      }),
      index: external_exports.number(),
      logprobs: external_exports.object({
        content: external_exports.array(
          external_exports.object({
            token: external_exports.string(),
            logprob: external_exports.number(),
            top_logprobs: external_exports.array(
              external_exports.object({
                token: external_exports.string(),
                logprob: external_exports.number()
              })
            )
          })
        ).nullable()
      }).nullish(),
      finish_reason: external_exports.string().nullish()
    })
  ),
  usage: openaiTokenUsageSchema
});
var openaiChatChunkSchema = external_exports.union([
  external_exports.object({
    id: external_exports.string().nullish(),
    created: external_exports.number().nullish(),
    model: external_exports.string().nullish(),
    choices: external_exports.array(
      external_exports.object({
        delta: external_exports.object({
          role: external_exports.enum(["assistant"]).nullish(),
          content: external_exports.string().nullish(),
          function_call: external_exports.object({
            name: external_exports.string().optional(),
            arguments: external_exports.string().optional()
          }).nullish(),
          tool_calls: external_exports.array(
            external_exports.object({
              index: external_exports.number(),
              id: external_exports.string().nullish(),
              type: external_exports.literal("function").nullish(),
              function: external_exports.object({
                name: external_exports.string().nullish(),
                arguments: external_exports.string().nullish()
              })
            })
          ).nullish()
        }).nullish(),
        logprobs: external_exports.object({
          content: external_exports.array(
            external_exports.object({
              token: external_exports.string(),
              logprob: external_exports.number(),
              top_logprobs: external_exports.array(
                external_exports.object({
                  token: external_exports.string(),
                  logprob: external_exports.number()
                })
              )
            })
          ).nullable()
        }).nullish(),
        finish_reason: external_exports.string().nullish(),
        index: external_exports.number()
      })
    ),
    usage: openaiTokenUsageSchema
  }),
  openaiErrorDataSchema
]);
function isReasoningModel(modelId) {
  return modelId.startsWith("o");
}
function isAudioModel(modelId) {
  return modelId.startsWith("gpt-4o-audio-preview");
}
function getSystemMessageMode(modelId) {
  var _a17, _b;
  if (!isReasoningModel(modelId)) {
    return "system";
  }
  return (_b = (_a17 = reasoningModels[modelId]) == null ? void 0 : _a17.systemMessageMode) != null ? _b : "developer";
}
var reasoningModels = {
  "o1-mini": {
    systemMessageMode: "remove"
  },
  "o1-mini-2024-09-12": {
    systemMessageMode: "remove"
  },
  "o1-preview": {
    systemMessageMode: "remove"
  },
  "o1-preview-2024-09-12": {
    systemMessageMode: "remove"
  },
  o3: {
    systemMessageMode: "developer"
  },
  "o3-2025-04-16": {
    systemMessageMode: "developer"
  },
  "o3-mini": {
    systemMessageMode: "developer"
  },
  "o3-mini-2025-01-31": {
    systemMessageMode: "developer"
  },
  "o4-mini": {
    systemMessageMode: "developer"
  },
  "o4-mini-2025-04-16": {
    systemMessageMode: "developer"
  }
};
function convertToOpenAICompletionPrompt({
  prompt,
  inputFormat,
  user = "user",
  assistant = "assistant"
}) {
  if (inputFormat === "prompt" && prompt.length === 1 && prompt[0].role === "user" && prompt[0].content.length === 1 && prompt[0].content[0].type === "text") {
    return { prompt: prompt[0].content[0].text };
  }
  let text2 = "";
  if (prompt[0].role === "system") {
    text2 += `${prompt[0].content}

`;
    prompt = prompt.slice(1);
  }
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        throw new InvalidPromptError({
          message: "Unexpected system message in prompt: ${content}",
          prompt
        });
      }
      case "user": {
        const userMessage = content.map((part) => {
          switch (part.type) {
            case "text": {
              return part.text;
            }
            case "image": {
              throw new UnsupportedFunctionalityError({
                functionality: "images"
              });
            }
          }
        }).join("");
        text2 += `${user}:
${userMessage}

`;
        break;
      }
      case "assistant": {
        const assistantMessage = content.map((part) => {
          switch (part.type) {
            case "text": {
              return part.text;
            }
            case "tool-call": {
              throw new UnsupportedFunctionalityError({
                functionality: "tool-call messages"
              });
            }
          }
        }).join("");
        text2 += `${assistant}:
${assistantMessage}

`;
        break;
      }
      case "tool": {
        throw new UnsupportedFunctionalityError({
          functionality: "tool messages"
        });
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  text2 += `${assistant}:
`;
  return {
    prompt: text2,
    stopSequences: [`
${user}:`]
  };
}
function mapOpenAICompletionLogProbs(logprobs) {
  return logprobs == null ? void 0 : logprobs.tokens.map((token, index) => ({
    token,
    logprob: logprobs.token_logprobs[index],
    topLogprobs: logprobs.top_logprobs ? Object.entries(logprobs.top_logprobs[index]).map(
      ([token2, logprob]) => ({
        token: token2,
        logprob
      })
    ) : []
  }));
}
var OpenAICompletionLanguageModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.defaultObjectGenerationMode = void 0;
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  get provider() {
    return this.config.provider;
  }
  getArgs({
    mode,
    inputFormat,
    prompt,
    maxTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences: userStopSequences,
    responseFormat,
    seed
  }) {
    var _a17;
    const type = mode.type;
    const warnings = [];
    if (topK != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "topK"
      });
    }
    if (responseFormat != null && responseFormat.type !== "text") {
      warnings.push({
        type: "unsupported-setting",
        setting: "responseFormat",
        details: "JSON response format is not supported."
      });
    }
    const { prompt: completionPrompt, stopSequences } = convertToOpenAICompletionPrompt({ prompt, inputFormat });
    const stop = [...stopSequences != null ? stopSequences : [], ...userStopSequences != null ? userStopSequences : []];
    const baseArgs = {
      // model id:
      model: this.modelId,
      // model specific settings:
      echo: this.settings.echo,
      logit_bias: this.settings.logitBias,
      logprobs: typeof this.settings.logprobs === "number" ? this.settings.logprobs : typeof this.settings.logprobs === "boolean" ? this.settings.logprobs ? 0 : void 0 : void 0,
      suffix: this.settings.suffix,
      user: this.settings.user,
      // standardized settings:
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      seed,
      // prompt:
      prompt: completionPrompt,
      // stop sequences:
      stop: stop.length > 0 ? stop : void 0
    };
    switch (type) {
      case "regular": {
        if ((_a17 = mode.tools) == null ? void 0 : _a17.length) {
          throw new UnsupportedFunctionalityError({
            functionality: "tools"
          });
        }
        if (mode.toolChoice) {
          throw new UnsupportedFunctionalityError({
            functionality: "toolChoice"
          });
        }
        return { args: baseArgs, warnings };
      }
      case "object-json": {
        throw new UnsupportedFunctionalityError({
          functionality: "object-json mode"
        });
      }
      case "object-tool": {
        throw new UnsupportedFunctionalityError({
          functionality: "object-tool mode"
        });
      }
      default: {
        const _exhaustiveCheck = type;
        throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
      }
    }
  }
  async doGenerate(options) {
    const { args, warnings } = this.getArgs(options);
    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse
    } = await postJsonToApi({
      url: this.config.url({
        path: "/completions",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: args,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiCompletionResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { prompt: rawPrompt, ...rawSettings } = args;
    const choice = response.choices[0];
    return {
      text: choice.text,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens
      },
      finishReason: mapOpenAIFinishReason(choice.finish_reason),
      logprobs: mapOpenAICompletionLogProbs(choice.logprobs),
      rawCall: { rawPrompt, rawSettings },
      rawResponse: { headers: responseHeaders, body: rawResponse },
      response: getResponseMetadata(response),
      warnings,
      request: { body: JSON.stringify(args) }
    };
  }
  async doStream(options) {
    const { args, warnings } = this.getArgs(options);
    const body = {
      ...args,
      stream: true,
      // only include stream_options when in strict compatibility mode:
      stream_options: this.config.compatibility === "strict" ? { include_usage: true } : void 0
    };
    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: "/completions",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        openaiCompletionChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { prompt: rawPrompt, ...rawSettings } = args;
    let finishReason = "unknown";
    let usage = {
      promptTokens: Number.NaN,
      completionTokens: Number.NaN
    };
    let logprobs;
    let isFirstChunk = true;
    return {
      stream: response.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            if (!chunk.success) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: chunk.error });
              return;
            }
            const value = chunk.value;
            if ("error" in value) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: value.error });
              return;
            }
            if (isFirstChunk) {
              isFirstChunk = false;
              controller.enqueue({
                type: "response-metadata",
                ...getResponseMetadata(value)
              });
            }
            if (value.usage != null) {
              usage = {
                promptTokens: value.usage.prompt_tokens,
                completionTokens: value.usage.completion_tokens
              };
            }
            const choice = value.choices[0];
            if ((choice == null ? void 0 : choice.finish_reason) != null) {
              finishReason = mapOpenAIFinishReason(choice.finish_reason);
            }
            if ((choice == null ? void 0 : choice.text) != null) {
              controller.enqueue({
                type: "text-delta",
                textDelta: choice.text
              });
            }
            const mappedLogprobs = mapOpenAICompletionLogProbs(
              choice == null ? void 0 : choice.logprobs
            );
            if (mappedLogprobs == null ? void 0 : mappedLogprobs.length) {
              if (logprobs === void 0) logprobs = [];
              logprobs.push(...mappedLogprobs);
            }
          },
          flush(controller) {
            controller.enqueue({
              type: "finish",
              finishReason,
              logprobs,
              usage
            });
          }
        })
      ),
      rawCall: { rawPrompt, rawSettings },
      rawResponse: { headers: responseHeaders },
      warnings,
      request: { body: JSON.stringify(body) }
    };
  }
};
var openaiCompletionResponseSchema = external_exports.object({
  id: external_exports.string().nullish(),
  created: external_exports.number().nullish(),
  model: external_exports.string().nullish(),
  choices: external_exports.array(
    external_exports.object({
      text: external_exports.string(),
      finish_reason: external_exports.string(),
      logprobs: external_exports.object({
        tokens: external_exports.array(external_exports.string()),
        token_logprobs: external_exports.array(external_exports.number()),
        top_logprobs: external_exports.array(external_exports.record(external_exports.string(), external_exports.number())).nullable()
      }).nullish()
    })
  ),
  usage: external_exports.object({
    prompt_tokens: external_exports.number(),
    completion_tokens: external_exports.number()
  })
});
var openaiCompletionChunkSchema = external_exports.union([
  external_exports.object({
    id: external_exports.string().nullish(),
    created: external_exports.number().nullish(),
    model: external_exports.string().nullish(),
    choices: external_exports.array(
      external_exports.object({
        text: external_exports.string(),
        finish_reason: external_exports.string().nullish(),
        index: external_exports.number(),
        logprobs: external_exports.object({
          tokens: external_exports.array(external_exports.string()),
          token_logprobs: external_exports.array(external_exports.number()),
          top_logprobs: external_exports.array(external_exports.record(external_exports.string(), external_exports.number())).nullable()
        }).nullish()
      })
    ),
    usage: external_exports.object({
      prompt_tokens: external_exports.number(),
      completion_tokens: external_exports.number()
    }).nullish()
  }),
  openaiErrorDataSchema
]);
var OpenAIEmbeddingModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  get provider() {
    return this.config.provider;
  }
  get maxEmbeddingsPerCall() {
    var _a17;
    return (_a17 = this.settings.maxEmbeddingsPerCall) != null ? _a17 : 2048;
  }
  get supportsParallelCalls() {
    var _a17;
    return (_a17 = this.settings.supportsParallelCalls) != null ? _a17 : true;
  }
  async doEmbed({
    values,
    headers,
    abortSignal
  }) {
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new TooManyEmbeddingValuesForCallError({
        provider: this.provider,
        modelId: this.modelId,
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        values
      });
    }
    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: "/embeddings",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), headers),
      body: {
        model: this.modelId,
        input: values,
        encoding_format: "float",
        dimensions: this.settings.dimensions,
        user: this.settings.user
      },
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiTextEmbeddingResponseSchema
      ),
      abortSignal,
      fetch: this.config.fetch
    });
    return {
      embeddings: response.data.map((item) => item.embedding),
      usage: response.usage ? { tokens: response.usage.prompt_tokens } : void 0,
      rawResponse: { headers: responseHeaders }
    };
  }
};
var openaiTextEmbeddingResponseSchema = external_exports.object({
  data: external_exports.array(external_exports.object({ embedding: external_exports.array(external_exports.number()) })),
  usage: external_exports.object({ prompt_tokens: external_exports.number() }).nullish()
});
var modelMaxImagesPerCall = {
  "dall-e-3": 1,
  "dall-e-2": 10,
  "gpt-image-1": 10
};
var hasDefaultResponseFormat = /* @__PURE__ */ new Set(["gpt-image-1"]);
var OpenAIImageModel = class {
  constructor(modelId, settings, config) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
    this.specificationVersion = "v1";
  }
  get maxImagesPerCall() {
    var _a17, _b;
    return (_b = (_a17 = this.settings.maxImagesPerCall) != null ? _a17 : modelMaxImagesPerCall[this.modelId]) != null ? _b : 1;
  }
  get provider() {
    return this.config.provider;
  }
  async doGenerate({
    prompt,
    n,
    size,
    aspectRatio,
    seed,
    providerOptions,
    headers,
    abortSignal
  }) {
    var _a17, _b, _c, _d;
    const warnings = [];
    if (aspectRatio != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "aspectRatio",
        details: "This model does not support aspect ratio. Use `size` instead."
      });
    }
    if (seed != null) {
      warnings.push({ type: "unsupported-setting", setting: "seed" });
    }
    const currentDate = (_c = (_b = (_a17 = this.config._internal) == null ? void 0 : _a17.currentDate) == null ? void 0 : _b.call(_a17)) != null ? _c : /* @__PURE__ */ new Date();
    const { value: response, responseHeaders } = await postJsonToApi({
      url: this.config.url({
        path: "/images/generations",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), headers),
      body: {
        model: this.modelId,
        prompt,
        n,
        size,
        ...(_d = providerOptions.openai) != null ? _d : {},
        ...!hasDefaultResponseFormat.has(this.modelId) ? { response_format: "b64_json" } : {}
      },
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiImageResponseSchema
      ),
      abortSignal,
      fetch: this.config.fetch
    });
    return {
      images: response.data.map((item) => item.b64_json),
      warnings,
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders
      }
    };
  }
};
var openaiImageResponseSchema = external_exports.object({
  data: external_exports.array(external_exports.object({ b64_json: external_exports.string() }))
});
var openAIProviderOptionsSchema = external_exports.object({
  include: external_exports.array(external_exports.string()).nullish(),
  language: external_exports.string().nullish(),
  prompt: external_exports.string().nullish(),
  temperature: external_exports.number().min(0).max(1).nullish().default(0),
  timestampGranularities: external_exports.array(external_exports.enum(["word", "segment"])).nullish().default(["segment"])
});
var languageMap = {
  afrikaans: "af",
  arabic: "ar",
  armenian: "hy",
  azerbaijani: "az",
  belarusian: "be",
  bosnian: "bs",
  bulgarian: "bg",
  catalan: "ca",
  chinese: "zh",
  croatian: "hr",
  czech: "cs",
  danish: "da",
  dutch: "nl",
  english: "en",
  estonian: "et",
  finnish: "fi",
  french: "fr",
  galician: "gl",
  german: "de",
  greek: "el",
  hebrew: "he",
  hindi: "hi",
  hungarian: "hu",
  icelandic: "is",
  indonesian: "id",
  italian: "it",
  japanese: "ja",
  kannada: "kn",
  kazakh: "kk",
  korean: "ko",
  latvian: "lv",
  lithuanian: "lt",
  macedonian: "mk",
  malay: "ms",
  marathi: "mr",
  maori: "mi",
  nepali: "ne",
  norwegian: "no",
  persian: "fa",
  polish: "pl",
  portuguese: "pt",
  romanian: "ro",
  russian: "ru",
  serbian: "sr",
  slovak: "sk",
  slovenian: "sl",
  spanish: "es",
  swahili: "sw",
  swedish: "sv",
  tagalog: "tl",
  tamil: "ta",
  thai: "th",
  turkish: "tr",
  ukrainian: "uk",
  urdu: "ur",
  vietnamese: "vi",
  welsh: "cy"
};
var OpenAITranscriptionModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v1";
  }
  get provider() {
    return this.config.provider;
  }
  getArgs({
    audio,
    mediaType,
    providerOptions
  }) {
    var _a17, _b, _c, _d, _e;
    const warnings = [];
    const openAIOptions = parseProviderOptions({
      provider: "openai",
      providerOptions,
      schema: openAIProviderOptionsSchema
    });
    const formData = new FormData();
    const blob = audio instanceof Uint8Array ? new Blob([audio]) : new Blob([convertBase64ToUint8Array(audio)]);
    formData.append("model", this.modelId);
    formData.append("file", new File([blob], "audio", { type: mediaType }));
    if (openAIOptions) {
      const transcriptionModelOptions = {
        include: (_a17 = openAIOptions.include) != null ? _a17 : void 0,
        language: (_b = openAIOptions.language) != null ? _b : void 0,
        prompt: (_c = openAIOptions.prompt) != null ? _c : void 0,
        temperature: (_d = openAIOptions.temperature) != null ? _d : void 0,
        timestamp_granularities: (_e = openAIOptions.timestampGranularities) != null ? _e : void 0
      };
      for (const key in transcriptionModelOptions) {
        const value = transcriptionModelOptions[key];
        if (value !== void 0) {
          formData.append(key, String(value));
        }
      }
    }
    return {
      formData,
      warnings
    };
  }
  async doGenerate(options) {
    var _a17, _b, _c, _d, _e, _f;
    const currentDate = (_c = (_b = (_a17 = this.config._internal) == null ? void 0 : _a17.currentDate) == null ? void 0 : _b.call(_a17)) != null ? _c : /* @__PURE__ */ new Date();
    const { formData, warnings } = this.getArgs(options);
    const {
      value: response,
      responseHeaders,
      rawValue: rawResponse
    } = await postFormDataToApi({
      url: this.config.url({
        path: "/audio/transcriptions",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      formData,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiTranscriptionResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const language = response.language != null && response.language in languageMap ? languageMap[response.language] : void 0;
    return {
      text: response.text,
      segments: (_e = (_d = response.words) == null ? void 0 : _d.map((word) => ({
        text: word.word,
        startSecond: word.start,
        endSecond: word.end
      }))) != null ? _e : [],
      language,
      durationInSeconds: (_f = response.duration) != null ? _f : void 0,
      warnings,
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders,
        body: rawResponse
      }
    };
  }
};
var openaiTranscriptionResponseSchema = external_exports.object({
  text: external_exports.string(),
  language: external_exports.string().nullish(),
  duration: external_exports.number().nullish(),
  words: external_exports.array(
    external_exports.object({
      word: external_exports.string(),
      start: external_exports.number(),
      end: external_exports.number()
    })
  ).nullish()
});
function convertToOpenAIResponsesMessages({
  prompt,
  systemMessageMode
}) {
  const messages = [];
  const warnings = [];
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        switch (systemMessageMode) {
          case "system": {
            messages.push({ role: "system", content });
            break;
          }
          case "developer": {
            messages.push({ role: "developer", content });
            break;
          }
          case "remove": {
            warnings.push({
              type: "other",
              message: "system messages are removed for this model"
            });
            break;
          }
          default: {
            const _exhaustiveCheck = systemMessageMode;
            throw new Error(
              `Unsupported system message mode: ${_exhaustiveCheck}`
            );
          }
        }
        break;
      }
      case "user": {
        messages.push({
          role: "user",
          content: content.map((part, index) => {
            var _a17, _b, _c, _d;
            switch (part.type) {
              case "text": {
                return { type: "input_text", text: part.text };
              }
              case "image": {
                return {
                  type: "input_image",
                  image_url: part.image instanceof URL ? part.image.toString() : `data:${(_a17 = part.mimeType) != null ? _a17 : "image/jpeg"};base64,${convertUint8ArrayToBase64(part.image)}`,
                  // OpenAI specific extension: image detail
                  detail: (_c = (_b = part.providerMetadata) == null ? void 0 : _b.openai) == null ? void 0 : _c.imageDetail
                };
              }
              case "file": {
                if (part.data instanceof URL) {
                  throw new UnsupportedFunctionalityError({
                    functionality: "File URLs in user messages"
                  });
                }
                switch (part.mimeType) {
                  case "application/pdf": {
                    return {
                      type: "input_file",
                      filename: (_d = part.filename) != null ? _d : `part-${index}.pdf`,
                      file_data: `data:application/pdf;base64,${part.data}`
                    };
                  }
                  default: {
                    throw new UnsupportedFunctionalityError({
                      functionality: "Only PDF files are supported in user messages"
                    });
                  }
                }
              }
            }
          })
        });
        break;
      }
      case "assistant": {
        for (const part of content) {
          switch (part.type) {
            case "text": {
              messages.push({
                role: "assistant",
                content: [{ type: "output_text", text: part.text }]
              });
              break;
            }
            case "tool-call": {
              messages.push({
                type: "function_call",
                call_id: part.toolCallId,
                name: part.toolName,
                arguments: JSON.stringify(part.args)
              });
              break;
            }
          }
        }
        break;
      }
      case "tool": {
        for (const part of content) {
          messages.push({
            type: "function_call_output",
            call_id: part.toolCallId,
            output: JSON.stringify(part.result)
          });
        }
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  return { messages, warnings };
}
function mapOpenAIResponseFinishReason({
  finishReason,
  hasToolCalls
}) {
  switch (finishReason) {
    case void 0:
    case null:
      return hasToolCalls ? "tool-calls" : "stop";
    case "max_output_tokens":
      return "length";
    case "content_filter":
      return "content-filter";
    default:
      return hasToolCalls ? "tool-calls" : "unknown";
  }
}
function prepareResponsesTools({
  mode,
  strict
}) {
  var _a17;
  const tools = ((_a17 = mode.tools) == null ? void 0 : _a17.length) ? mode.tools : void 0;
  const toolWarnings = [];
  if (tools == null) {
    return { tools: void 0, tool_choice: void 0, toolWarnings };
  }
  const toolChoice = mode.toolChoice;
  const openaiTools2 = [];
  for (const tool2 of tools) {
    switch (tool2.type) {
      case "function":
        openaiTools2.push({
          type: "function",
          name: tool2.name,
          description: tool2.description,
          parameters: tool2.parameters,
          strict: strict ? true : void 0
        });
        break;
      case "provider-defined":
        switch (tool2.id) {
          case "openai.web_search_preview":
            openaiTools2.push({
              type: "web_search_preview",
              search_context_size: tool2.args.searchContextSize,
              user_location: tool2.args.userLocation
            });
            break;
          default:
            toolWarnings.push({ type: "unsupported-tool", tool: tool2 });
            break;
        }
        break;
      default:
        toolWarnings.push({ type: "unsupported-tool", tool: tool2 });
        break;
    }
  }
  if (toolChoice == null) {
    return { tools: openaiTools2, tool_choice: void 0, toolWarnings };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
    case "none":
    case "required":
      return { tools: openaiTools2, tool_choice: type, toolWarnings };
    case "tool": {
      if (toolChoice.toolName === "web_search_preview") {
        return {
          tools: openaiTools2,
          tool_choice: {
            type: "web_search_preview"
          },
          toolWarnings
        };
      }
      return {
        tools: openaiTools2,
        tool_choice: {
          type: "function",
          name: toolChoice.toolName
        },
        toolWarnings
      };
    }
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError({
        functionality: `Unsupported tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}
var OpenAIResponsesLanguageModel = class {
  constructor(modelId, config) {
    this.specificationVersion = "v1";
    this.defaultObjectGenerationMode = "json";
    this.supportsStructuredOutputs = true;
    this.modelId = modelId;
    this.config = config;
  }
  get provider() {
    return this.config.provider;
  }
  getArgs({
    mode,
    maxTokens,
    temperature,
    stopSequences,
    topP,
    topK,
    presencePenalty,
    frequencyPenalty,
    seed,
    prompt,
    providerMetadata,
    responseFormat
  }) {
    var _a17, _b, _c;
    const warnings = [];
    const modelConfig = getResponsesModelConfig(this.modelId);
    const type = mode.type;
    if (topK != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "topK"
      });
    }
    if (seed != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "seed"
      });
    }
    if (presencePenalty != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "presencePenalty"
      });
    }
    if (frequencyPenalty != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "frequencyPenalty"
      });
    }
    if (stopSequences != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "stopSequences"
      });
    }
    const { messages, warnings: messageWarnings } = convertToOpenAIResponsesMessages({
      prompt,
      systemMessageMode: modelConfig.systemMessageMode
    });
    warnings.push(...messageWarnings);
    const openaiOptions = parseProviderOptions({
      provider: "openai",
      providerOptions: providerMetadata,
      schema: openaiResponsesProviderOptionsSchema
    });
    const isStrict = (_a17 = openaiOptions == null ? void 0 : openaiOptions.strictSchemas) != null ? _a17 : true;
    const baseArgs = {
      model: this.modelId,
      input: messages,
      temperature,
      top_p: topP,
      max_output_tokens: maxTokens,
      ...(responseFormat == null ? void 0 : responseFormat.type) === "json" && {
        text: {
          format: responseFormat.schema != null ? {
            type: "json_schema",
            strict: isStrict,
            name: (_b = responseFormat.name) != null ? _b : "response",
            description: responseFormat.description,
            schema: responseFormat.schema
          } : { type: "json_object" }
        }
      },
      // provider options:
      metadata: openaiOptions == null ? void 0 : openaiOptions.metadata,
      parallel_tool_calls: openaiOptions == null ? void 0 : openaiOptions.parallelToolCalls,
      previous_response_id: openaiOptions == null ? void 0 : openaiOptions.previousResponseId,
      store: openaiOptions == null ? void 0 : openaiOptions.store,
      user: openaiOptions == null ? void 0 : openaiOptions.user,
      instructions: openaiOptions == null ? void 0 : openaiOptions.instructions,
      // model-specific settings:
      ...modelConfig.isReasoningModel && ((openaiOptions == null ? void 0 : openaiOptions.reasoningEffort) != null || (openaiOptions == null ? void 0 : openaiOptions.reasoningSummary) != null) && {
        reasoning: {
          ...(openaiOptions == null ? void 0 : openaiOptions.reasoningEffort) != null && {
            effort: openaiOptions.reasoningEffort
          },
          ...(openaiOptions == null ? void 0 : openaiOptions.reasoningSummary) != null && {
            summary: openaiOptions.reasoningSummary
          }
        }
      },
      ...modelConfig.requiredAutoTruncation && {
        truncation: "auto"
      }
    };
    if (modelConfig.isReasoningModel) {
      if (baseArgs.temperature != null) {
        baseArgs.temperature = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "temperature",
          details: "temperature is not supported for reasoning models"
        });
      }
      if (baseArgs.top_p != null) {
        baseArgs.top_p = void 0;
        warnings.push({
          type: "unsupported-setting",
          setting: "topP",
          details: "topP is not supported for reasoning models"
        });
      }
    }
    switch (type) {
      case "regular": {
        const { tools, tool_choice, toolWarnings } = prepareResponsesTools({
          mode,
          strict: isStrict
          // TODO support provider options on tools
        });
        return {
          args: {
            ...baseArgs,
            tools,
            tool_choice
          },
          warnings: [...warnings, ...toolWarnings]
        };
      }
      case "object-json": {
        return {
          args: {
            ...baseArgs,
            text: {
              format: mode.schema != null ? {
                type: "json_schema",
                strict: isStrict,
                name: (_c = mode.name) != null ? _c : "response",
                description: mode.description,
                schema: mode.schema
              } : { type: "json_object" }
            }
          },
          warnings
        };
      }
      case "object-tool": {
        return {
          args: {
            ...baseArgs,
            tool_choice: { type: "function", name: mode.tool.name },
            tools: [
              {
                type: "function",
                name: mode.tool.name,
                description: mode.tool.description,
                parameters: mode.tool.parameters,
                strict: isStrict
              }
            ]
          },
          warnings
        };
      }
      default: {
        const _exhaustiveCheck = type;
        throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
      }
    }
  }
  async doGenerate(options) {
    var _a17, _b, _c, _d, _e, _f, _g;
    const { args: body, warnings } = this.getArgs(options);
    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse
    } = await postJsonToApi({
      url: this.config.url({
        path: "/responses",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        external_exports.object({
          id: external_exports.string(),
          created_at: external_exports.number(),
          model: external_exports.string(),
          output: external_exports.array(
            external_exports.discriminatedUnion("type", [
              external_exports.object({
                type: external_exports.literal("message"),
                role: external_exports.literal("assistant"),
                content: external_exports.array(
                  external_exports.object({
                    type: external_exports.literal("output_text"),
                    text: external_exports.string(),
                    annotations: external_exports.array(
                      external_exports.object({
                        type: external_exports.literal("url_citation"),
                        start_index: external_exports.number(),
                        end_index: external_exports.number(),
                        url: external_exports.string(),
                        title: external_exports.string()
                      })
                    )
                  })
                )
              }),
              external_exports.object({
                type: external_exports.literal("function_call"),
                call_id: external_exports.string(),
                name: external_exports.string(),
                arguments: external_exports.string()
              }),
              external_exports.object({
                type: external_exports.literal("web_search_call")
              }),
              external_exports.object({
                type: external_exports.literal("computer_call")
              }),
              external_exports.object({
                type: external_exports.literal("reasoning"),
                summary: external_exports.array(
                  external_exports.object({
                    type: external_exports.literal("summary_text"),
                    text: external_exports.string()
                  })
                )
              })
            ])
          ),
          incomplete_details: external_exports.object({ reason: external_exports.string() }).nullable(),
          usage: usageSchema
        })
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const outputTextElements = response.output.filter((output) => output.type === "message").flatMap((output) => output.content).filter((content) => content.type === "output_text");
    const toolCalls = response.output.filter((output) => output.type === "function_call").map((output) => ({
      toolCallType: "function",
      toolCallId: output.call_id,
      toolName: output.name,
      args: output.arguments
    }));
    const reasoningSummary = (_b = (_a17 = response.output.find((item) => item.type === "reasoning")) == null ? void 0 : _a17.summary) != null ? _b : null;
    return {
      text: outputTextElements.map((content) => content.text).join("\n"),
      sources: outputTextElements.flatMap(
        (content) => content.annotations.map((annotation) => {
          var _a23, _b2, _c2;
          return {
            sourceType: "url",
            id: (_c2 = (_b2 = (_a23 = this.config).generateId) == null ? void 0 : _b2.call(_a23)) != null ? _c2 : generateId(),
            url: annotation.url,
            title: annotation.title
          };
        })
      ),
      finishReason: mapOpenAIResponseFinishReason({
        finishReason: (_c = response.incomplete_details) == null ? void 0 : _c.reason,
        hasToolCalls: toolCalls.length > 0
      }),
      toolCalls: toolCalls.length > 0 ? toolCalls : void 0,
      reasoning: reasoningSummary ? reasoningSummary.map((summary) => ({
        type: "text",
        text: summary.text
      })) : void 0,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens
      },
      rawCall: {
        rawPrompt: void 0,
        rawSettings: {}
      },
      rawResponse: {
        headers: responseHeaders,
        body: rawResponse
      },
      request: {
        body: JSON.stringify(body)
      },
      response: {
        id: response.id,
        timestamp: new Date(response.created_at * 1e3),
        modelId: response.model
      },
      providerMetadata: {
        openai: {
          responseId: response.id,
          cachedPromptTokens: (_e = (_d = response.usage.input_tokens_details) == null ? void 0 : _d.cached_tokens) != null ? _e : null,
          reasoningTokens: (_g = (_f = response.usage.output_tokens_details) == null ? void 0 : _f.reasoning_tokens) != null ? _g : null
        }
      },
      warnings
    };
  }
  async doStream(options) {
    const { args: body, warnings } = this.getArgs(options);
    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: "/responses",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: {
        ...body,
        stream: true
      },
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        openaiResponsesChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const self = this;
    let finishReason = "unknown";
    let promptTokens = NaN;
    let completionTokens = NaN;
    let cachedPromptTokens = null;
    let reasoningTokens = null;
    let responseId = null;
    const ongoingToolCalls = {};
    let hasToolCalls = false;
    return {
      stream: response.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            var _a17, _b, _c, _d, _e, _f, _g, _h;
            if (!chunk.success) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: chunk.error });
              return;
            }
            const value = chunk.value;
            if (isResponseOutputItemAddedChunk(value)) {
              if (value.item.type === "function_call") {
                ongoingToolCalls[value.output_index] = {
                  toolName: value.item.name,
                  toolCallId: value.item.call_id
                };
                controller.enqueue({
                  type: "tool-call-delta",
                  toolCallType: "function",
                  toolCallId: value.item.call_id,
                  toolName: value.item.name,
                  argsTextDelta: value.item.arguments
                });
              }
            } else if (isResponseFunctionCallArgumentsDeltaChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];
              if (toolCall != null) {
                controller.enqueue({
                  type: "tool-call-delta",
                  toolCallType: "function",
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  argsTextDelta: value.delta
                });
              }
            } else if (isResponseCreatedChunk(value)) {
              responseId = value.response.id;
              controller.enqueue({
                type: "response-metadata",
                id: value.response.id,
                timestamp: new Date(value.response.created_at * 1e3),
                modelId: value.response.model
              });
            } else if (isTextDeltaChunk(value)) {
              controller.enqueue({
                type: "text-delta",
                textDelta: value.delta
              });
            } else if (isResponseReasoningSummaryTextDeltaChunk(value)) {
              controller.enqueue({
                type: "reasoning",
                textDelta: value.delta
              });
            } else if (isResponseOutputItemDoneChunk(value) && value.item.type === "function_call") {
              ongoingToolCalls[value.output_index] = void 0;
              hasToolCalls = true;
              controller.enqueue({
                type: "tool-call",
                toolCallType: "function",
                toolCallId: value.item.call_id,
                toolName: value.item.name,
                args: value.item.arguments
              });
            } else if (isResponseFinishedChunk(value)) {
              finishReason = mapOpenAIResponseFinishReason({
                finishReason: (_a17 = value.response.incomplete_details) == null ? void 0 : _a17.reason,
                hasToolCalls
              });
              promptTokens = value.response.usage.input_tokens;
              completionTokens = value.response.usage.output_tokens;
              cachedPromptTokens = (_c = (_b = value.response.usage.input_tokens_details) == null ? void 0 : _b.cached_tokens) != null ? _c : cachedPromptTokens;
              reasoningTokens = (_e = (_d = value.response.usage.output_tokens_details) == null ? void 0 : _d.reasoning_tokens) != null ? _e : reasoningTokens;
            } else if (isResponseAnnotationAddedChunk(value)) {
              controller.enqueue({
                type: "source",
                source: {
                  sourceType: "url",
                  id: (_h = (_g = (_f = self.config).generateId) == null ? void 0 : _g.call(_f)) != null ? _h : generateId(),
                  url: value.annotation.url,
                  title: value.annotation.title
                }
              });
            }
          },
          flush(controller) {
            controller.enqueue({
              type: "finish",
              finishReason,
              usage: { promptTokens, completionTokens },
              ...(cachedPromptTokens != null || reasoningTokens != null) && {
                providerMetadata: {
                  openai: {
                    responseId,
                    cachedPromptTokens,
                    reasoningTokens
                  }
                }
              }
            });
          }
        })
      ),
      rawCall: {
        rawPrompt: void 0,
        rawSettings: {}
      },
      rawResponse: { headers: responseHeaders },
      request: { body: JSON.stringify(body) },
      warnings
    };
  }
};
var usageSchema = external_exports.object({
  input_tokens: external_exports.number(),
  input_tokens_details: external_exports.object({ cached_tokens: external_exports.number().nullish() }).nullish(),
  output_tokens: external_exports.number(),
  output_tokens_details: external_exports.object({ reasoning_tokens: external_exports.number().nullish() }).nullish()
});
var textDeltaChunkSchema = external_exports.object({
  type: external_exports.literal("response.output_text.delta"),
  delta: external_exports.string()
});
var responseFinishedChunkSchema = external_exports.object({
  type: external_exports.enum(["response.completed", "response.incomplete"]),
  response: external_exports.object({
    incomplete_details: external_exports.object({ reason: external_exports.string() }).nullish(),
    usage: usageSchema
  })
});
var responseCreatedChunkSchema = external_exports.object({
  type: external_exports.literal("response.created"),
  response: external_exports.object({
    id: external_exports.string(),
    created_at: external_exports.number(),
    model: external_exports.string()
  })
});
var responseOutputItemDoneSchema = external_exports.object({
  type: external_exports.literal("response.output_item.done"),
  output_index: external_exports.number(),
  item: external_exports.discriminatedUnion("type", [
    external_exports.object({
      type: external_exports.literal("message")
    }),
    external_exports.object({
      type: external_exports.literal("function_call"),
      id: external_exports.string(),
      call_id: external_exports.string(),
      name: external_exports.string(),
      arguments: external_exports.string(),
      status: external_exports.literal("completed")
    })
  ])
});
var responseFunctionCallArgumentsDeltaSchema = external_exports.object({
  type: external_exports.literal("response.function_call_arguments.delta"),
  item_id: external_exports.string(),
  output_index: external_exports.number(),
  delta: external_exports.string()
});
var responseOutputItemAddedSchema = external_exports.object({
  type: external_exports.literal("response.output_item.added"),
  output_index: external_exports.number(),
  item: external_exports.discriminatedUnion("type", [
    external_exports.object({
      type: external_exports.literal("message")
    }),
    external_exports.object({
      type: external_exports.literal("function_call"),
      id: external_exports.string(),
      call_id: external_exports.string(),
      name: external_exports.string(),
      arguments: external_exports.string()
    })
  ])
});
var responseAnnotationAddedSchema = external_exports.object({
  type: external_exports.literal("response.output_text.annotation.added"),
  annotation: external_exports.object({
    type: external_exports.literal("url_citation"),
    url: external_exports.string(),
    title: external_exports.string()
  })
});
var responseReasoningSummaryTextDeltaSchema = external_exports.object({
  type: external_exports.literal("response.reasoning_summary_text.delta"),
  item_id: external_exports.string(),
  output_index: external_exports.number(),
  summary_index: external_exports.number(),
  delta: external_exports.string()
});
var openaiResponsesChunkSchema = external_exports.union([
  textDeltaChunkSchema,
  responseFinishedChunkSchema,
  responseCreatedChunkSchema,
  responseOutputItemDoneSchema,
  responseFunctionCallArgumentsDeltaSchema,
  responseOutputItemAddedSchema,
  responseAnnotationAddedSchema,
  responseReasoningSummaryTextDeltaSchema,
  external_exports.object({ type: external_exports.string() }).passthrough()
  // fallback for unknown chunks
]);
function isTextDeltaChunk(chunk) {
  return chunk.type === "response.output_text.delta";
}
function isResponseOutputItemDoneChunk(chunk) {
  return chunk.type === "response.output_item.done";
}
function isResponseFinishedChunk(chunk) {
  return chunk.type === "response.completed" || chunk.type === "response.incomplete";
}
function isResponseCreatedChunk(chunk) {
  return chunk.type === "response.created";
}
function isResponseFunctionCallArgumentsDeltaChunk(chunk) {
  return chunk.type === "response.function_call_arguments.delta";
}
function isResponseOutputItemAddedChunk(chunk) {
  return chunk.type === "response.output_item.added";
}
function isResponseAnnotationAddedChunk(chunk) {
  return chunk.type === "response.output_text.annotation.added";
}
function isResponseReasoningSummaryTextDeltaChunk(chunk) {
  return chunk.type === "response.reasoning_summary_text.delta";
}
function getResponsesModelConfig(modelId) {
  if (modelId.startsWith("o")) {
    if (modelId.startsWith("o1-mini") || modelId.startsWith("o1-preview")) {
      return {
        isReasoningModel: true,
        systemMessageMode: "remove",
        requiredAutoTruncation: false
      };
    }
    return {
      isReasoningModel: true,
      systemMessageMode: "developer",
      requiredAutoTruncation: false
    };
  }
  return {
    isReasoningModel: false,
    systemMessageMode: "system",
    requiredAutoTruncation: false
  };
}
var openaiResponsesProviderOptionsSchema = external_exports.object({
  metadata: external_exports.any().nullish(),
  parallelToolCalls: external_exports.boolean().nullish(),
  previousResponseId: external_exports.string().nullish(),
  store: external_exports.boolean().nullish(),
  user: external_exports.string().nullish(),
  reasoningEffort: external_exports.string().nullish(),
  strictSchemas: external_exports.boolean().nullish(),
  instructions: external_exports.string().nullish(),
  reasoningSummary: external_exports.string().nullish()
});
var WebSearchPreviewParameters = external_exports.object({});
function webSearchPreviewTool({
  searchContextSize,
  userLocation
} = {}) {
  return {
    type: "provider-defined",
    id: "openai.web_search_preview",
    args: {
      searchContextSize,
      userLocation
    },
    parameters: WebSearchPreviewParameters
  };
}
var openaiTools = {
  webSearchPreview: webSearchPreviewTool
};
var OpenAIProviderOptionsSchema = external_exports.object({
  instructions: external_exports.string().nullish(),
  speed: external_exports.number().min(0.25).max(4).default(1).nullish()
});
var OpenAISpeechModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v1";
  }
  get provider() {
    return this.config.provider;
  }
  getArgs({
    text: text2,
    voice = "alloy",
    outputFormat = "mp3",
    speed,
    instructions,
    providerOptions
  }) {
    const warnings = [];
    const openAIOptions = parseProviderOptions({
      provider: "openai",
      providerOptions,
      schema: OpenAIProviderOptionsSchema
    });
    const requestBody = {
      model: this.modelId,
      input: text2,
      voice,
      response_format: "mp3",
      speed,
      instructions
    };
    if (outputFormat) {
      if (["mp3", "opus", "aac", "flac", "wav", "pcm"].includes(outputFormat)) {
        requestBody.response_format = outputFormat;
      } else {
        warnings.push({
          type: "unsupported-setting",
          setting: "outputFormat",
          details: `Unsupported output format: ${outputFormat}. Using mp3 instead.`
        });
      }
    }
    if (openAIOptions) {
      const speechModelOptions = {};
      for (const key in speechModelOptions) {
        const value = speechModelOptions[key];
        if (value !== void 0) {
          requestBody[key] = value;
        }
      }
    }
    return {
      requestBody,
      warnings
    };
  }
  async doGenerate(options) {
    var _a17, _b, _c;
    const currentDate = (_c = (_b = (_a17 = this.config._internal) == null ? void 0 : _a17.currentDate) == null ? void 0 : _b.call(_a17)) != null ? _c : /* @__PURE__ */ new Date();
    const { requestBody, warnings } = this.getArgs(options);
    const {
      value: audio,
      responseHeaders,
      rawValue: rawResponse
    } = await postJsonToApi({
      url: this.config.url({
        path: "/audio/speech",
        modelId: this.modelId
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: requestBody,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createBinaryResponseHandler(),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    return {
      audio,
      warnings,
      request: {
        body: JSON.stringify(requestBody)
      },
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders,
        body: rawResponse
      }
    };
  }
};
function createOpenAI(options = {}) {
  var _a17, _b, _c;
  const baseURL = (_a17 = withoutTrailingSlash(options.baseURL)) != null ? _a17 : "https://api.openai.com/v1";
  const compatibility = (_b = options.compatibility) != null ? _b : "compatible";
  const providerName = (_c = options.name) != null ? _c : "openai";
  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: "OPENAI_API_KEY",
      description: "OpenAI"
    })}`,
    "OpenAI-Organization": options.organization,
    "OpenAI-Project": options.project,
    ...options.headers
  });
  const createChatModel = (modelId, settings = {}) => new OpenAIChatLanguageModel(modelId, settings, {
    provider: `${providerName}.chat`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    compatibility,
    fetch: options.fetch
  });
  const createCompletionModel = (modelId, settings = {}) => new OpenAICompletionLanguageModel(modelId, settings, {
    provider: `${providerName}.completion`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    compatibility,
    fetch: options.fetch
  });
  const createEmbeddingModel = (modelId, settings = {}) => new OpenAIEmbeddingModel(modelId, settings, {
    provider: `${providerName}.embedding`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createImageModel = (modelId, settings = {}) => new OpenAIImageModel(modelId, settings, {
    provider: `${providerName}.image`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createTranscriptionModel = (modelId) => new OpenAITranscriptionModel(modelId, {
    provider: `${providerName}.transcription`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createSpeechModel = (modelId) => new OpenAISpeechModel(modelId, {
    provider: `${providerName}.speech`,
    url: ({ path: path3 }) => `${baseURL}${path3}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createLanguageModel = (modelId, settings) => {
    if (new.target) {
      throw new Error(
        "The OpenAI model function cannot be called with the new keyword."
      );
    }
    if (modelId === "gpt-3.5-turbo-instruct") {
      return createCompletionModel(
        modelId,
        settings
      );
    }
    return createChatModel(modelId, settings);
  };
  const createResponsesModel = (modelId) => {
    return new OpenAIResponsesLanguageModel(modelId, {
      provider: `${providerName}.responses`,
      url: ({ path: path3 }) => `${baseURL}${path3}`,
      headers: getHeaders,
      fetch: options.fetch
    });
  };
  const provider = function(modelId, settings) {
    return createLanguageModel(modelId, settings);
  };
  provider.languageModel = createLanguageModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;
  provider.responses = createResponsesModel;
  provider.embedding = createEmbeddingModel;
  provider.textEmbedding = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.image = createImageModel;
  provider.imageModel = createImageModel;
  provider.transcription = createTranscriptionModel;
  provider.transcriptionModel = createTranscriptionModel;
  provider.speech = createSpeechModel;
  provider.speechModel = createSpeechModel;
  provider.tools = openaiTools;
  return provider;
}
var openai = createOpenAI({
  compatibility: "strict"
  // strict for OpenAI API
});

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Refs.js
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name17, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name17],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function parseArrayDef(def, refs) {
  const res = {
    type: "array"
  };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
    }
  }
  return res;
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0) {
        unevaluatedProperties = void 0;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = void 0;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function parseLiteralDef(def, refs) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType === "bigint" ? "integer" : parsedType,
      enum: [def.value]
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var emojiRegex2 = void 0;
var zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex2 === void 0) {
      emojiRegex2 = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex2;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex.source;
  }
  return pattern;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi") {
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  }
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  const object2 = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object2[object2[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object2[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
  }
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)(typeName);
  }
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema2) {
    addMeta(def, refs, jsonSchema2);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
    newItem.jsonSchema = jsonSchema2;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema2;
  return jsonSchema2;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
    }
  }
};
var addMeta = (def, refs, jsonSchema2) => {
  if (def.description) {
    jsonSchema2.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema2.markdownDescription = def.description;
    }
  }
  return jsonSchema2;
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name18, schema2]) => ({
    ...acc,
    [name18]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name18]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name17 = typeof options === "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name;
  const main = parseDef(schema._def, name17 === void 0 ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name17]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0) {
    main.title = title;
  }
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        // Skipping "object" as no properties can be defined and additionalProperties must be "false"
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name17 === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name17
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name17]: main
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) {
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  }
  return combined;
};

// node_modules/.pnpm/zod-to-json-schema@3.25.2_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/index.js
var esm_default = zodToJsonSchema;

// node_modules/.pnpm/@ai-sdk+ui-utils@1.2.11_zod@3.25.76/node_modules/@ai-sdk/ui-utils/dist/index.mjs
var textStreamPart = {
  code: "0",
  name: "text",
  parse: (value) => {
    if (typeof value !== "string") {
      throw new Error('"text" parts expect a string value.');
    }
    return { type: "text", value };
  }
};
var errorStreamPart = {
  code: "3",
  name: "error",
  parse: (value) => {
    if (typeof value !== "string") {
      throw new Error('"error" parts expect a string value.');
    }
    return { type: "error", value };
  }
};
var assistantMessageStreamPart = {
  code: "4",
  name: "assistant_message",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("id" in value) || !("role" in value) || !("content" in value) || typeof value.id !== "string" || typeof value.role !== "string" || value.role !== "assistant" || !Array.isArray(value.content) || !value.content.every(
      (item) => item != null && typeof item === "object" && "type" in item && item.type === "text" && "text" in item && item.text != null && typeof item.text === "object" && "value" in item.text && typeof item.text.value === "string"
    )) {
      throw new Error(
        '"assistant_message" parts expect an object with an "id", "role", and "content" property.'
      );
    }
    return {
      type: "assistant_message",
      value
    };
  }
};
var assistantControlDataStreamPart = {
  code: "5",
  name: "assistant_control_data",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("threadId" in value) || !("messageId" in value) || typeof value.threadId !== "string" || typeof value.messageId !== "string") {
      throw new Error(
        '"assistant_control_data" parts expect an object with a "threadId" and "messageId" property.'
      );
    }
    return {
      type: "assistant_control_data",
      value: {
        threadId: value.threadId,
        messageId: value.messageId
      }
    };
  }
};
var dataMessageStreamPart = {
  code: "6",
  name: "data_message",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("role" in value) || !("data" in value) || typeof value.role !== "string" || value.role !== "data") {
      throw new Error(
        '"data_message" parts expect an object with a "role" and "data" property.'
      );
    }
    return {
      type: "data_message",
      value
    };
  }
};
var assistantStreamParts = [
  textStreamPart,
  errorStreamPart,
  assistantMessageStreamPart,
  assistantControlDataStreamPart,
  dataMessageStreamPart
];
var assistantStreamPartsByCode = {
  [textStreamPart.code]: textStreamPart,
  [errorStreamPart.code]: errorStreamPart,
  [assistantMessageStreamPart.code]: assistantMessageStreamPart,
  [assistantControlDataStreamPart.code]: assistantControlDataStreamPart,
  [dataMessageStreamPart.code]: dataMessageStreamPart
};
var StreamStringPrefixes = {
  [textStreamPart.name]: textStreamPart.code,
  [errorStreamPart.name]: errorStreamPart.code,
  [assistantMessageStreamPart.name]: assistantMessageStreamPart.code,
  [assistantControlDataStreamPart.name]: assistantControlDataStreamPart.code,
  [dataMessageStreamPart.name]: dataMessageStreamPart.code
};
var validCodes = assistantStreamParts.map((part) => part.code);
function fixJson(input) {
  const stack = ["ROOT"];
  let lastValidIndex = -1;
  let literalStart = null;
  function processValueStart(char, i, swapState) {
    {
      switch (char) {
        case '"': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_STRING");
          break;
        }
        case "f":
        case "t":
        case "n": {
          lastValidIndex = i;
          literalStart = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_LITERAL");
          break;
        }
        case "-": {
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_NUMBER");
          break;
        }
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_NUMBER");
          break;
        }
        case "{": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_OBJECT_START");
          break;
        }
        case "[": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_ARRAY_START");
          break;
        }
      }
    }
  }
  function processAfterObjectValue(char, i) {
    switch (char) {
      case ",": {
        stack.pop();
        stack.push("INSIDE_OBJECT_AFTER_COMMA");
        break;
      }
      case "}": {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }
  function processAfterArrayValue(char, i) {
    switch (char) {
      case ",": {
        stack.pop();
        stack.push("INSIDE_ARRAY_AFTER_COMMA");
        break;
      }
      case "]": {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const currentState = stack[stack.length - 1];
    switch (currentState) {
      case "ROOT":
        processValueStart(char, i, "FINISH");
        break;
      case "INSIDE_OBJECT_START": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_KEY");
            break;
          }
          case "}": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_AFTER_COMMA": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_KEY");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_KEY": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_AFTER_KEY");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_AFTER_KEY": {
        switch (char) {
          case ":": {
            stack.pop();
            stack.push("INSIDE_OBJECT_BEFORE_VALUE");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_BEFORE_VALUE": {
        processValueStart(char, i, "INSIDE_OBJECT_AFTER_VALUE");
        break;
      }
      case "INSIDE_OBJECT_AFTER_VALUE": {
        processAfterObjectValue(char, i);
        break;
      }
      case "INSIDE_STRING": {
        switch (char) {
          case '"': {
            stack.pop();
            lastValidIndex = i;
            break;
          }
          case "\\": {
            stack.push("INSIDE_STRING_ESCAPE");
            break;
          }
          default: {
            lastValidIndex = i;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_START": {
        switch (char) {
          case "]": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
          default: {
            lastValidIndex = i;
            processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
            break;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_AFTER_VALUE": {
        switch (char) {
          case ",": {
            stack.pop();
            stack.push("INSIDE_ARRAY_AFTER_COMMA");
            break;
          }
          case "]": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
          default: {
            lastValidIndex = i;
            break;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_AFTER_COMMA": {
        processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
        break;
      }
      case "INSIDE_STRING_ESCAPE": {
        stack.pop();
        lastValidIndex = i;
        break;
      }
      case "INSIDE_NUMBER": {
        switch (char) {
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9": {
            lastValidIndex = i;
            break;
          }
          case "e":
          case "E":
          case "-":
          case ".": {
            break;
          }
          case ",": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
              processAfterArrayValue(char, i);
            }
            if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
              processAfterObjectValue(char, i);
            }
            break;
          }
          case "}": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
              processAfterObjectValue(char, i);
            }
            break;
          }
          case "]": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
              processAfterArrayValue(char, i);
            }
            break;
          }
          default: {
            stack.pop();
            break;
          }
        }
        break;
      }
      case "INSIDE_LITERAL": {
        const partialLiteral = input.substring(literalStart, i + 1);
        if (!"false".startsWith(partialLiteral) && !"true".startsWith(partialLiteral) && !"null".startsWith(partialLiteral)) {
          stack.pop();
          if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
            processAfterObjectValue(char, i);
          } else if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
            processAfterArrayValue(char, i);
          }
        } else {
          lastValidIndex = i;
        }
        break;
      }
    }
  }
  let result = input.slice(0, lastValidIndex + 1);
  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i];
    switch (state) {
      case "INSIDE_STRING": {
        result += '"';
        break;
      }
      case "INSIDE_OBJECT_KEY":
      case "INSIDE_OBJECT_AFTER_KEY":
      case "INSIDE_OBJECT_AFTER_COMMA":
      case "INSIDE_OBJECT_START":
      case "INSIDE_OBJECT_BEFORE_VALUE":
      case "INSIDE_OBJECT_AFTER_VALUE": {
        result += "}";
        break;
      }
      case "INSIDE_ARRAY_START":
      case "INSIDE_ARRAY_AFTER_COMMA":
      case "INSIDE_ARRAY_AFTER_VALUE": {
        result += "]";
        break;
      }
      case "INSIDE_LITERAL": {
        const partialLiteral = input.substring(literalStart, input.length);
        if ("true".startsWith(partialLiteral)) {
          result += "true".slice(partialLiteral.length);
        } else if ("false".startsWith(partialLiteral)) {
          result += "false".slice(partialLiteral.length);
        } else if ("null".startsWith(partialLiteral)) {
          result += "null".slice(partialLiteral.length);
        }
      }
    }
  }
  return result;
}
function parsePartialJson(jsonText) {
  if (jsonText === void 0) {
    return { value: void 0, state: "undefined-input" };
  }
  let result = safeParseJSON({ text: jsonText });
  if (result.success) {
    return { value: result.value, state: "successful-parse" };
  }
  result = safeParseJSON({ text: fixJson(jsonText) });
  if (result.success) {
    return { value: result.value, state: "repaired-parse" };
  }
  return { value: void 0, state: "failed-parse" };
}
var textStreamPart2 = {
  code: "0",
  name: "text",
  parse: (value) => {
    if (typeof value !== "string") {
      throw new Error('"text" parts expect a string value.');
    }
    return { type: "text", value };
  }
};
var dataStreamPart = {
  code: "2",
  name: "data",
  parse: (value) => {
    if (!Array.isArray(value)) {
      throw new Error('"data" parts expect an array value.');
    }
    return { type: "data", value };
  }
};
var errorStreamPart2 = {
  code: "3",
  name: "error",
  parse: (value) => {
    if (typeof value !== "string") {
      throw new Error('"error" parts expect a string value.');
    }
    return { type: "error", value };
  }
};
var messageAnnotationsStreamPart = {
  code: "8",
  name: "message_annotations",
  parse: (value) => {
    if (!Array.isArray(value)) {
      throw new Error('"message_annotations" parts expect an array value.');
    }
    return { type: "message_annotations", value };
  }
};
var toolCallStreamPart = {
  code: "9",
  name: "tool_call",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("toolCallId" in value) || typeof value.toolCallId !== "string" || !("toolName" in value) || typeof value.toolName !== "string" || !("args" in value) || typeof value.args !== "object") {
      throw new Error(
        '"tool_call" parts expect an object with a "toolCallId", "toolName", and "args" property.'
      );
    }
    return {
      type: "tool_call",
      value
    };
  }
};
var toolResultStreamPart = {
  code: "a",
  name: "tool_result",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("toolCallId" in value) || typeof value.toolCallId !== "string" || !("result" in value)) {
      throw new Error(
        '"tool_result" parts expect an object with a "toolCallId" and a "result" property.'
      );
    }
    return {
      type: "tool_result",
      value
    };
  }
};
var toolCallStreamingStartStreamPart = {
  code: "b",
  name: "tool_call_streaming_start",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("toolCallId" in value) || typeof value.toolCallId !== "string" || !("toolName" in value) || typeof value.toolName !== "string") {
      throw new Error(
        '"tool_call_streaming_start" parts expect an object with a "toolCallId" and "toolName" property.'
      );
    }
    return {
      type: "tool_call_streaming_start",
      value
    };
  }
};
var toolCallDeltaStreamPart = {
  code: "c",
  name: "tool_call_delta",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("toolCallId" in value) || typeof value.toolCallId !== "string" || !("argsTextDelta" in value) || typeof value.argsTextDelta !== "string") {
      throw new Error(
        '"tool_call_delta" parts expect an object with a "toolCallId" and "argsTextDelta" property.'
      );
    }
    return {
      type: "tool_call_delta",
      value
    };
  }
};
var finishMessageStreamPart = {
  code: "d",
  name: "finish_message",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("finishReason" in value) || typeof value.finishReason !== "string") {
      throw new Error(
        '"finish_message" parts expect an object with a "finishReason" property.'
      );
    }
    const result = {
      finishReason: value.finishReason
    };
    if ("usage" in value && value.usage != null && typeof value.usage === "object" && "promptTokens" in value.usage && "completionTokens" in value.usage) {
      result.usage = {
        promptTokens: typeof value.usage.promptTokens === "number" ? value.usage.promptTokens : Number.NaN,
        completionTokens: typeof value.usage.completionTokens === "number" ? value.usage.completionTokens : Number.NaN
      };
    }
    return {
      type: "finish_message",
      value: result
    };
  }
};
var finishStepStreamPart = {
  code: "e",
  name: "finish_step",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("finishReason" in value) || typeof value.finishReason !== "string") {
      throw new Error(
        '"finish_step" parts expect an object with a "finishReason" property.'
      );
    }
    const result = {
      finishReason: value.finishReason,
      isContinued: false
    };
    if ("usage" in value && value.usage != null && typeof value.usage === "object" && "promptTokens" in value.usage && "completionTokens" in value.usage) {
      result.usage = {
        promptTokens: typeof value.usage.promptTokens === "number" ? value.usage.promptTokens : Number.NaN,
        completionTokens: typeof value.usage.completionTokens === "number" ? value.usage.completionTokens : Number.NaN
      };
    }
    if ("isContinued" in value && typeof value.isContinued === "boolean") {
      result.isContinued = value.isContinued;
    }
    return {
      type: "finish_step",
      value: result
    };
  }
};
var startStepStreamPart = {
  code: "f",
  name: "start_step",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("messageId" in value) || typeof value.messageId !== "string") {
      throw new Error(
        '"start_step" parts expect an object with an "id" property.'
      );
    }
    return {
      type: "start_step",
      value: {
        messageId: value.messageId
      }
    };
  }
};
var reasoningStreamPart = {
  code: "g",
  name: "reasoning",
  parse: (value) => {
    if (typeof value !== "string") {
      throw new Error('"reasoning" parts expect a string value.');
    }
    return { type: "reasoning", value };
  }
};
var sourcePart = {
  code: "h",
  name: "source",
  parse: (value) => {
    if (value == null || typeof value !== "object") {
      throw new Error('"source" parts expect a Source object.');
    }
    return {
      type: "source",
      value
    };
  }
};
var redactedReasoningStreamPart = {
  code: "i",
  name: "redacted_reasoning",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("data" in value) || typeof value.data !== "string") {
      throw new Error(
        '"redacted_reasoning" parts expect an object with a "data" property.'
      );
    }
    return { type: "redacted_reasoning", value: { data: value.data } };
  }
};
var reasoningSignatureStreamPart = {
  code: "j",
  name: "reasoning_signature",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("signature" in value) || typeof value.signature !== "string") {
      throw new Error(
        '"reasoning_signature" parts expect an object with a "signature" property.'
      );
    }
    return {
      type: "reasoning_signature",
      value: { signature: value.signature }
    };
  }
};
var fileStreamPart = {
  code: "k",
  name: "file",
  parse: (value) => {
    if (value == null || typeof value !== "object" || !("data" in value) || typeof value.data !== "string" || !("mimeType" in value) || typeof value.mimeType !== "string") {
      throw new Error(
        '"file" parts expect an object with a "data" and "mimeType" property.'
      );
    }
    return { type: "file", value };
  }
};
var dataStreamParts = [
  textStreamPart2,
  dataStreamPart,
  errorStreamPart2,
  messageAnnotationsStreamPart,
  toolCallStreamPart,
  toolResultStreamPart,
  toolCallStreamingStartStreamPart,
  toolCallDeltaStreamPart,
  finishMessageStreamPart,
  finishStepStreamPart,
  startStepStreamPart,
  reasoningStreamPart,
  sourcePart,
  redactedReasoningStreamPart,
  reasoningSignatureStreamPart,
  fileStreamPart
];
var dataStreamPartsByCode = Object.fromEntries(
  dataStreamParts.map((part) => [part.code, part])
);
var DataStreamStringPrefixes = Object.fromEntries(
  dataStreamParts.map((part) => [part.name, part.code])
);
var validCodes2 = dataStreamParts.map((part) => part.code);
function formatDataStreamPart(type, value) {
  const streamPart = dataStreamParts.find((part) => part.name === type);
  if (!streamPart) {
    throw new Error(`Invalid stream part type: ${type}`);
  }
  return `${streamPart.code}:${JSON.stringify(value)}
`;
}
var NEWLINE = "\n".charCodeAt(0);
var NEWLINE2 = "\n".charCodeAt(0);
function zodSchema(zodSchema2, options) {
  var _a17;
  const useReferences = (_a17 = options == null ? void 0 : options.useReferences) != null ? _a17 : false;
  return jsonSchema(
    esm_default(zodSchema2, {
      $refStrategy: useReferences ? "root" : "none",
      target: "jsonSchema7"
      // note: openai mode breaks various gemini conversions
    }),
    {
      validate: (value) => {
        const result = zodSchema2.safeParse(value);
        return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
      }
    }
  );
}
var schemaSymbol = Symbol.for("vercel.ai.schema");
function jsonSchema(jsonSchema2, {
  validate
} = {}) {
  return {
    [schemaSymbol]: true,
    _type: void 0,
    // should never be used directly
    [validatorSymbol]: true,
    jsonSchema: jsonSchema2,
    validate
  };
}
function isSchema(value) {
  return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
  return isSchema(schema) ? schema : zodSchema(schema);
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/node/globalThis.js
var _globalThis = typeof globalThis === "object" ? globalThis : global;

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/version.js
var VERSION = "1.9.0";

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/semver.js
var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
  var acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  var rejectedVersions = /* @__PURE__ */ new Set();
  var myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return function() {
      return false;
    };
  }
  var ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v) {
    rejectedVersions.add(v);
    return false;
  }
  function _accept(v) {
    acceptedVersions.add(v);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    var globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    var globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
var isCompatible = _makeCompatibilityCheck(VERSION);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
var major = VERSION.split(".")[0];
var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for("opentelemetry.js.api." + major);
var _global = _globalThis;
function registerGlobal(type, instance, diag, allowOverride) {
  var _a17;
  if (allowOverride === void 0) {
    allowOverride = false;
  }
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a17 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a17 !== void 0 ? _a17 : {
    version: VERSION
  };
  if (!allowOverride && api[type]) {
    var err = new Error("@opentelemetry/api: Attempted duplicate registration of API: " + type);
    diag.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION) {
    var err = new Error("@opentelemetry/api: Registration of version v" + api.version + " for " + type + " does not match previously registered API v" + VERSION);
    diag.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag.debug("@opentelemetry/api: Registered a global for " + type + " v" + VERSION + ".");
  return true;
}
function getGlobal(type) {
  var _a17, _b;
  var globalVersion = (_a17 = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a17 === void 0 ? void 0 : _a17.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag) {
  diag.debug("@opentelemetry/api: Unregistering a global for " + type + " v" + VERSION + ".");
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var DiagComponentLogger = (
  /** @class */
  (function() {
    function DiagComponentLogger2(props) {
      this._namespace = props.namespace || "DiagComponentLogger";
    }
    DiagComponentLogger2.prototype.debug = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("debug", this._namespace, args);
    };
    DiagComponentLogger2.prototype.error = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("error", this._namespace, args);
    };
    DiagComponentLogger2.prototype.info = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("info", this._namespace, args);
    };
    DiagComponentLogger2.prototype.warn = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("warn", this._namespace, args);
    };
    DiagComponentLogger2.prototype.verbose = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("verbose", this._namespace, args);
    };
    return DiagComponentLogger2;
  })()
);
function logProxy(funcName, namespace, args) {
  var logger = getGlobal("diag");
  if (!logger) {
    return;
  }
  args.unshift(namespace);
  return logger[funcName].apply(logger, __spreadArray([], __read(args), false));
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js
var DiagLogLevel;
(function(DiagLogLevel2) {
  DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
  DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
  DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
  DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
  DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
  DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
  DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger = logger || {};
  function _filterFunc(funcName, theLevel) {
    var theFunc = logger[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/diag.js
var __read2 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray2 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME = "diag";
var DiagAPI = (
  /** @class */
  (function() {
    function DiagAPI2() {
      function _logProxy(funcName) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var logger = getGlobal("diag");
          if (!logger)
            return;
          return logger[funcName].apply(logger, __spreadArray2([], __read2(args), false));
        };
      }
      var self = this;
      var setLogger = function(logger, optionsOrLogLevel) {
        var _a17, _b, _c;
        if (optionsOrLogLevel === void 0) {
          optionsOrLogLevel = { logLevel: DiagLogLevel.INFO };
        }
        if (logger === self) {
          var err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
          self.error((_a17 = err.stack) !== null && _a17 !== void 0 ? _a17 : err.message);
          return false;
        }
        if (typeof optionsOrLogLevel === "number") {
          optionsOrLogLevel = {
            logLevel: optionsOrLogLevel
          };
        }
        var oldLogger = getGlobal("diag");
        var newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger);
        if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
          var stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
          oldLogger.warn("Current logger will be overwritten from " + stack);
          newLogger.warn("Current logger will overwrite one already registered from " + stack);
        }
        return registerGlobal("diag", newLogger, self, true);
      };
      self.setLogger = setLogger;
      self.disable = function() {
        unregisterGlobal(API_NAME, self);
      };
      self.createComponentLogger = function(options) {
        return new DiagComponentLogger(options);
      };
      self.verbose = _logProxy("verbose");
      self.debug = _logProxy("debug");
      self.info = _logProxy("info");
      self.warn = _logProxy("warn");
      self.error = _logProxy("error");
    }
    DiagAPI2.instance = function() {
      if (!this._instance) {
        this._instance = new DiagAPI2();
      }
      return this._instance;
    };
    return DiagAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/context.js
function createContextKey(description) {
  return Symbol.for(description);
}
var BaseContext = (
  /** @class */
  /* @__PURE__ */ (function() {
    function BaseContext2(parentContext) {
      var self = this;
      self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
      self.getValue = function(key) {
        return self._currentContext.get(key);
      };
      self.setValue = function(key, value) {
        var context = new BaseContext2(self._currentContext);
        context._currentContext.set(key, value);
        return context;
      };
      self.deleteValue = function(key) {
        var context = new BaseContext2(self._currentContext);
        context._currentContext.delete(key);
        return context;
      };
    }
    return BaseContext2;
  })()
);
var ROOT_CONTEXT = new BaseContext();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var __read3 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray3 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var NoopContextManager = (
  /** @class */
  (function() {
    function NoopContextManager2() {
    }
    NoopContextManager2.prototype.active = function() {
      return ROOT_CONTEXT;
    };
    NoopContextManager2.prototype.with = function(_context, fn, thisArg) {
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return fn.call.apply(fn, __spreadArray3([thisArg], __read3(args), false));
    };
    NoopContextManager2.prototype.bind = function(_context, target) {
      return target;
    };
    NoopContextManager2.prototype.enable = function() {
      return this;
    };
    NoopContextManager2.prototype.disable = function() {
      return this;
    };
    return NoopContextManager2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/context.js
var __read4 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray4 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME2 = "context";
var NOOP_CONTEXT_MANAGER = new NoopContextManager();
var ContextAPI = (
  /** @class */
  (function() {
    function ContextAPI2() {
    }
    ContextAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new ContextAPI2();
      }
      return this._instance;
    };
    ContextAPI2.prototype.setGlobalContextManager = function(contextManager) {
      return registerGlobal(API_NAME2, contextManager, DiagAPI.instance());
    };
    ContextAPI2.prototype.active = function() {
      return this._getContextManager().active();
    };
    ContextAPI2.prototype.with = function(context, fn, thisArg) {
      var _a17;
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return (_a17 = this._getContextManager()).with.apply(_a17, __spreadArray4([context, fn, thisArg], __read4(args), false));
    };
    ContextAPI2.prototype.bind = function(context, target) {
      return this._getContextManager().bind(context, target);
    };
    ContextAPI2.prototype._getContextManager = function() {
      return getGlobal(API_NAME2) || NOOP_CONTEXT_MANAGER;
    };
    ContextAPI2.prototype.disable = function() {
      this._getContextManager().disable();
      unregisterGlobal(API_NAME2, DiagAPI.instance());
    };
    return ContextAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
var TraceFlags;
(function(TraceFlags2) {
  TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
  TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js
var INVALID_SPANID = "0000000000000000";
var INVALID_TRACEID = "00000000000000000000000000000000";
var INVALID_SPAN_CONTEXT = {
  traceId: INVALID_TRACEID,
  spanId: INVALID_SPANID,
  traceFlags: TraceFlags.NONE
};

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
var NonRecordingSpan = (
  /** @class */
  (function() {
    function NonRecordingSpan2(_spanContext) {
      if (_spanContext === void 0) {
        _spanContext = INVALID_SPAN_CONTEXT;
      }
      this._spanContext = _spanContext;
    }
    NonRecordingSpan2.prototype.spanContext = function() {
      return this._spanContext;
    };
    NonRecordingSpan2.prototype.setAttribute = function(_key, _value) {
      return this;
    };
    NonRecordingSpan2.prototype.setAttributes = function(_attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addEvent = function(_name, _attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addLink = function(_link) {
      return this;
    };
    NonRecordingSpan2.prototype.addLinks = function(_links) {
      return this;
    };
    NonRecordingSpan2.prototype.setStatus = function(_status) {
      return this;
    };
    NonRecordingSpan2.prototype.updateName = function(_name) {
      return this;
    };
    NonRecordingSpan2.prototype.end = function(_endTime) {
    };
    NonRecordingSpan2.prototype.isRecording = function() {
      return false;
    };
    NonRecordingSpan2.prototype.recordException = function(_exception, _time) {
    };
    return NonRecordingSpan2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
var SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
function getSpan(context) {
  return context.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context, span) {
  return context.setValue(SPAN_KEY, span);
}
function deleteSpan(context) {
  return context.deleteValue(SPAN_KEY);
}
function setSpanContext(context, spanContext) {
  return setSpan(context, new NonRecordingSpan(spanContext));
}
function getSpanContext(context) {
  var _a17;
  return (_a17 = getSpan(context)) === null || _a17 === void 0 ? void 0 : _a17.spanContext();
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
function isValidTraceId(traceId) {
  return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
var contextApi = ContextAPI.getInstance();
var NoopTracer = (
  /** @class */
  (function() {
    function NoopTracer2() {
    }
    NoopTracer2.prototype.startSpan = function(name17, options, context) {
      if (context === void 0) {
        context = contextApi.active();
      }
      var root = Boolean(options === null || options === void 0 ? void 0 : options.root);
      if (root) {
        return new NonRecordingSpan();
      }
      var parentFromContext = context && getSpanContext(context);
      if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
        return new NonRecordingSpan(parentFromContext);
      } else {
        return new NonRecordingSpan();
      }
    };
    NoopTracer2.prototype.startActiveSpan = function(name17, arg2, arg3, arg4) {
      var opts;
      var ctx;
      var fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      var parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
      var span = this.startSpan(name17, opts, parentContext);
      var contextWithSpanSet = setSpan(parentContext, span);
      return contextApi.with(contextWithSpanSet, fn, void 0, span);
    };
    return NoopTracer2;
  })()
);
function isSpanContext(spanContext) {
  return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER = new NoopTracer();
var ProxyTracer = (
  /** @class */
  (function() {
    function ProxyTracer2(_provider, name17, version, options) {
      this._provider = _provider;
      this.name = name17;
      this.version = version;
      this.options = options;
    }
    ProxyTracer2.prototype.startSpan = function(name17, options, context) {
      return this._getTracer().startSpan(name17, options, context);
    };
    ProxyTracer2.prototype.startActiveSpan = function(_name, _options, _context, _fn) {
      var tracer = this._getTracer();
      return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    };
    ProxyTracer2.prototype._getTracer = function() {
      if (this._delegate) {
        return this._delegate;
      }
      var tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
      if (!tracer) {
        return NOOP_TRACER;
      }
      this._delegate = tracer;
      return this._delegate;
    };
    return ProxyTracer2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
var NoopTracerProvider = (
  /** @class */
  (function() {
    function NoopTracerProvider2() {
    }
    NoopTracerProvider2.prototype.getTracer = function(_name, _version, _options) {
      return new NoopTracer();
    };
    return NoopTracerProvider2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER = new NoopTracerProvider();
var ProxyTracerProvider = (
  /** @class */
  (function() {
    function ProxyTracerProvider2() {
    }
    ProxyTracerProvider2.prototype.getTracer = function(name17, version, options) {
      var _a17;
      return (_a17 = this.getDelegateTracer(name17, version, options)) !== null && _a17 !== void 0 ? _a17 : new ProxyTracer(this, name17, version, options);
    };
    ProxyTracerProvider2.prototype.getDelegate = function() {
      var _a17;
      return (_a17 = this._delegate) !== null && _a17 !== void 0 ? _a17 : NOOP_TRACER_PROVIDER;
    };
    ProxyTracerProvider2.prototype.setDelegate = function(delegate) {
      this._delegate = delegate;
    };
    ProxyTracerProvider2.prototype.getDelegateTracer = function(name17, version, options) {
      var _a17;
      return (_a17 = this._delegate) === null || _a17 === void 0 ? void 0 : _a17.getTracer(name17, version, options);
    };
    return ProxyTracerProvider2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js
var SpanStatusCode;
(function(SpanStatusCode2) {
  SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
  SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
  SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME3 = "trace";
var TraceAPI = (
  /** @class */
  (function() {
    function TraceAPI2() {
      this._proxyTracerProvider = new ProxyTracerProvider();
      this.wrapSpanContext = wrapSpanContext;
      this.isSpanContextValid = isSpanContextValid;
      this.deleteSpan = deleteSpan;
      this.getSpan = getSpan;
      this.getActiveSpan = getActiveSpan;
      this.getSpanContext = getSpanContext;
      this.setSpan = setSpan;
      this.setSpanContext = setSpanContext;
    }
    TraceAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new TraceAPI2();
      }
      return this._instance;
    };
    TraceAPI2.prototype.setGlobalTracerProvider = function(provider) {
      var success = registerGlobal(API_NAME3, this._proxyTracerProvider, DiagAPI.instance());
      if (success) {
        this._proxyTracerProvider.setDelegate(provider);
      }
      return success;
    };
    TraceAPI2.prototype.getTracerProvider = function() {
      return getGlobal(API_NAME3) || this._proxyTracerProvider;
    };
    TraceAPI2.prototype.getTracer = function(name17, version) {
      return this.getTracerProvider().getTracer(name17, version);
    };
    TraceAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME3, DiagAPI.instance());
      this._proxyTracerProvider = new ProxyTracerProvider();
    };
    return TraceAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js
var trace = TraceAPI.getInstance();

// node_modules/.pnpm/ai@4.3.16_react@19.2.8_zod@3.25.76/node_modules/ai/dist/index.mjs
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name17 in all)
    __defProp2(target, name17, { get: all[name17], enumerable: true });
};
function prepareResponseHeaders(headers, {
  contentType,
  dataStreamVersion
}) {
  const responseHeaders = new Headers(headers != null ? headers : {});
  if (!responseHeaders.has("Content-Type")) {
    responseHeaders.set("Content-Type", contentType);
  }
  if (dataStreamVersion !== void 0) {
    responseHeaders.set("X-Vercel-AI-Data-Stream", dataStreamVersion);
  }
  return responseHeaders;
}
function prepareOutgoingHttpHeaders(headers, {
  contentType,
  dataStreamVersion
}) {
  const outgoingHeaders = {};
  if (headers != null) {
    for (const [key, value] of Object.entries(headers)) {
      outgoingHeaders[key] = value;
    }
  }
  if (outgoingHeaders["Content-Type"] == null) {
    outgoingHeaders["Content-Type"] = contentType;
  }
  if (dataStreamVersion !== void 0) {
    outgoingHeaders["X-Vercel-AI-Data-Stream"] = dataStreamVersion;
  }
  return outgoingHeaders;
}
function writeToServerResponse({
  response,
  status,
  statusText,
  headers,
  stream
}) {
  response.writeHead(status != null ? status : 200, statusText, headers);
  const reader = stream.getReader();
  const read = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        response.write(value);
      }
    } catch (error) {
      throw error;
    } finally {
      response.end();
    }
  };
  read();
}
var name14 = "AI_InvalidArgumentError";
var marker15 = `vercel.ai.error.${name14}`;
var symbol15 = Symbol.for(marker15);
var _a15;
var InvalidArgumentError2 = class extends AISDKError {
  constructor({
    parameter,
    value,
    message
  }) {
    super({
      name: name14,
      message: `Invalid argument for parameter ${parameter}: ${message}`
    });
    this[_a15] = true;
    this.parameter = parameter;
    this.value = value;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker15);
  }
};
_a15 = symbol15;
var name22 = "AI_RetryError";
var marker22 = `vercel.ai.error.${name22}`;
var symbol22 = Symbol.for(marker22);
var _a22;
var RetryError = class extends AISDKError {
  constructor({
    message,
    reason,
    errors
  }) {
    super({ name: name22, message });
    this[_a22] = true;
    this.reason = reason;
    this.errors = errors;
    this.lastError = errors[errors.length - 1];
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker22);
  }
};
_a22 = symbol22;
var retryWithExponentialBackoff = ({
  maxRetries = 2,
  initialDelayInMs = 2e3,
  backoffFactor = 2
} = {}) => async (f) => _retryWithExponentialBackoff(f, {
  maxRetries,
  delayInMs: initialDelayInMs,
  backoffFactor
});
async function _retryWithExponentialBackoff(f, {
  maxRetries,
  delayInMs,
  backoffFactor
}, errors = []) {
  try {
    return await f();
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    if (maxRetries === 0) {
      throw error;
    }
    const errorMessage = getErrorMessage2(error);
    const newErrors = [...errors, error];
    const tryNumber = newErrors.length;
    if (tryNumber > maxRetries) {
      throw new RetryError({
        message: `Failed after ${tryNumber} attempts. Last error: ${errorMessage}`,
        reason: "maxRetriesExceeded",
        errors: newErrors
      });
    }
    if (error instanceof Error && APICallError.isInstance(error) && error.isRetryable === true && tryNumber <= maxRetries) {
      await delay(delayInMs);
      return _retryWithExponentialBackoff(
        f,
        { maxRetries, delayInMs: backoffFactor * delayInMs, backoffFactor },
        newErrors
      );
    }
    if (tryNumber === 1) {
      throw error;
    }
    throw new RetryError({
      message: `Failed after ${tryNumber} attempts with non-retryable error: '${errorMessage}'`,
      reason: "errorNotRetryable",
      errors: newErrors
    });
  }
}
function prepareRetries({
  maxRetries
}) {
  if (maxRetries != null) {
    if (!Number.isInteger(maxRetries)) {
      throw new InvalidArgumentError2({
        parameter: "maxRetries",
        value: maxRetries,
        message: "maxRetries must be an integer"
      });
    }
    if (maxRetries < 0) {
      throw new InvalidArgumentError2({
        parameter: "maxRetries",
        value: maxRetries,
        message: "maxRetries must be >= 0"
      });
    }
  }
  const maxRetriesResult = maxRetries != null ? maxRetries : 2;
  return {
    maxRetries: maxRetriesResult,
    retry: retryWithExponentialBackoff({ maxRetries: maxRetriesResult })
  };
}
function assembleOperationName({
  operationId,
  telemetry
}) {
  return {
    // standardized operation and resource name:
    "operation.name": `${operationId}${(telemetry == null ? void 0 : telemetry.functionId) != null ? ` ${telemetry.functionId}` : ""}`,
    "resource.name": telemetry == null ? void 0 : telemetry.functionId,
    // detailed, AI SDK specific data:
    "ai.operationId": operationId,
    "ai.telemetry.functionId": telemetry == null ? void 0 : telemetry.functionId
  };
}
function getBaseTelemetryAttributes({
  model,
  settings,
  telemetry,
  headers
}) {
  var _a17;
  return {
    "ai.model.provider": model.provider,
    "ai.model.id": model.modelId,
    // settings:
    ...Object.entries(settings).reduce((attributes, [key, value]) => {
      attributes[`ai.settings.${key}`] = value;
      return attributes;
    }, {}),
    // add metadata as attributes:
    ...Object.entries((_a17 = telemetry == null ? void 0 : telemetry.metadata) != null ? _a17 : {}).reduce(
      (attributes, [key, value]) => {
        attributes[`ai.telemetry.metadata.${key}`] = value;
        return attributes;
      },
      {}
    ),
    // request headers
    ...Object.entries(headers != null ? headers : {}).reduce((attributes, [key, value]) => {
      if (value !== void 0) {
        attributes[`ai.request.headers.${key}`] = value;
      }
      return attributes;
    }, {})
  };
}
var noopTracer = {
  startSpan() {
    return noopSpan;
  },
  startActiveSpan(name17, arg1, arg2, arg3) {
    if (typeof arg1 === "function") {
      return arg1(noopSpan);
    }
    if (typeof arg2 === "function") {
      return arg2(noopSpan);
    }
    if (typeof arg3 === "function") {
      return arg3(noopSpan);
    }
  }
};
var noopSpan = {
  spanContext() {
    return noopSpanContext;
  },
  setAttribute() {
    return this;
  },
  setAttributes() {
    return this;
  },
  addEvent() {
    return this;
  },
  addLink() {
    return this;
  },
  addLinks() {
    return this;
  },
  setStatus() {
    return this;
  },
  updateName() {
    return this;
  },
  end() {
    return this;
  },
  isRecording() {
    return false;
  },
  recordException() {
    return this;
  }
};
var noopSpanContext = {
  traceId: "",
  spanId: "",
  traceFlags: 0
};
function getTracer({
  isEnabled = false,
  tracer
} = {}) {
  if (!isEnabled) {
    return noopTracer;
  }
  if (tracer) {
    return tracer;
  }
  return trace.getTracer("ai");
}
function recordSpan({
  name: name17,
  tracer,
  attributes,
  fn,
  endWhenDone = true
}) {
  return tracer.startActiveSpan(name17, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      if (endWhenDone) {
        span.end();
      }
      return result;
    } catch (error) {
      try {
        if (error instanceof Error) {
          span.recordException({
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
        } else {
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
      } finally {
        span.end();
      }
      throw error;
    }
  });
}
function selectTelemetryAttributes({
  telemetry,
  attributes
}) {
  if ((telemetry == null ? void 0 : telemetry.isEnabled) !== true) {
    return {};
  }
  return Object.entries(attributes).reduce((attributes2, [key, value]) => {
    if (value === void 0) {
      return attributes2;
    }
    if (typeof value === "object" && "input" in value && typeof value.input === "function") {
      if ((telemetry == null ? void 0 : telemetry.recordInputs) === false) {
        return attributes2;
      }
      const result = value.input();
      return result === void 0 ? attributes2 : { ...attributes2, [key]: result };
    }
    if (typeof value === "object" && "output" in value && typeof value.output === "function") {
      if ((telemetry == null ? void 0 : telemetry.recordOutputs) === false) {
        return attributes2;
      }
      const result = value.output();
      return result === void 0 ? attributes2 : { ...attributes2, [key]: result };
    }
    return { ...attributes2, [key]: value };
  }, {});
}
var name32 = "AI_NoImageGeneratedError";
var marker32 = `vercel.ai.error.${name32}`;
var symbol32 = Symbol.for(marker32);
var _a32;
_a32 = symbol32;
var DefaultGeneratedFile = class {
  constructor({
    data,
    mimeType
  }) {
    const isUint8Array = data instanceof Uint8Array;
    this.base64Data = isUint8Array ? void 0 : data;
    this.uint8ArrayData = isUint8Array ? data : void 0;
    this.mimeType = mimeType;
  }
  // lazy conversion with caching to avoid unnecessary conversion overhead:
  get base64() {
    if (this.base64Data == null) {
      this.base64Data = convertUint8ArrayToBase64(this.uint8ArrayData);
    }
    return this.base64Data;
  }
  // lazy conversion with caching to avoid unnecessary conversion overhead:
  get uint8Array() {
    if (this.uint8ArrayData == null) {
      this.uint8ArrayData = convertBase64ToUint8Array(this.base64Data);
    }
    return this.uint8ArrayData;
  }
};
var DefaultGeneratedFileWithType = class extends DefaultGeneratedFile {
  constructor(options) {
    super(options);
    this.type = "file";
  }
};
var imageMimeTypeSignatures = [
  {
    mimeType: "image/gif",
    bytesPrefix: [71, 73, 70],
    base64Prefix: "R0lG"
  },
  {
    mimeType: "image/png",
    bytesPrefix: [137, 80, 78, 71],
    base64Prefix: "iVBORw"
  },
  {
    mimeType: "image/jpeg",
    bytesPrefix: [255, 216],
    base64Prefix: "/9j/"
  },
  {
    mimeType: "image/webp",
    bytesPrefix: [82, 73, 70, 70],
    base64Prefix: "UklGRg"
  },
  {
    mimeType: "image/bmp",
    bytesPrefix: [66, 77],
    base64Prefix: "Qk"
  },
  {
    mimeType: "image/tiff",
    bytesPrefix: [73, 73, 42, 0],
    base64Prefix: "SUkqAA"
  },
  {
    mimeType: "image/tiff",
    bytesPrefix: [77, 77, 0, 42],
    base64Prefix: "TU0AKg"
  },
  {
    mimeType: "image/avif",
    bytesPrefix: [
      0,
      0,
      0,
      32,
      102,
      116,
      121,
      112,
      97,
      118,
      105,
      102
    ],
    base64Prefix: "AAAAIGZ0eXBhdmlm"
  },
  {
    mimeType: "image/heic",
    bytesPrefix: [
      0,
      0,
      0,
      32,
      102,
      116,
      121,
      112,
      104,
      101,
      105,
      99
    ],
    base64Prefix: "AAAAIGZ0eXBoZWlj"
  }
];
var stripID3 = (data) => {
  const bytes = typeof data === "string" ? convertBase64ToUint8Array(data) : data;
  const id3Size = (bytes[6] & 127) << 21 | (bytes[7] & 127) << 14 | (bytes[8] & 127) << 7 | bytes[9] & 127;
  return bytes.slice(id3Size + 10);
};
function stripID3TagsIfPresent(data) {
  const hasId3 = typeof data === "string" && data.startsWith("SUQz") || typeof data !== "string" && data.length > 10 && data[0] === 73 && // 'I'
  data[1] === 68 && // 'D'
  data[2] === 51;
  return hasId3 ? stripID3(data) : data;
}
function detectMimeType({
  data,
  signatures
}) {
  const processedData = stripID3TagsIfPresent(data);
  for (const signature of signatures) {
    if (typeof processedData === "string" ? processedData.startsWith(signature.base64Prefix) : processedData.length >= signature.bytesPrefix.length && signature.bytesPrefix.every(
      (byte, index) => processedData[index] === byte
    )) {
      return signature.mimeType;
    }
  }
  return void 0;
}
var name42 = "AI_NoObjectGeneratedError";
var marker42 = `vercel.ai.error.${name42}`;
var symbol42 = Symbol.for(marker42);
var _a42;
var NoObjectGeneratedError = class extends AISDKError {
  constructor({
    message = "No object generated.",
    cause,
    text: text2,
    response,
    usage,
    finishReason
  }) {
    super({ name: name42, message, cause });
    this[_a42] = true;
    this.text = text2;
    this.response = response;
    this.usage = usage;
    this.finishReason = finishReason;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker42);
  }
};
_a42 = symbol42;
var name52 = "AI_DownloadError";
var marker52 = `vercel.ai.error.${name52}`;
var symbol52 = Symbol.for(marker52);
var _a52;
var DownloadError = class extends AISDKError {
  constructor({
    url,
    statusCode,
    statusText,
    cause,
    message = cause == null ? `Failed to download ${url}: ${statusCode} ${statusText}` : `Failed to download ${url}: ${cause}`
  }) {
    super({ name: name52, message, cause });
    this[_a52] = true;
    this.url = url;
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker52);
  }
};
_a52 = symbol52;
async function download({ url }) {
  var _a17;
  const urlText = url.toString();
  try {
    const response = await fetch(urlText);
    if (!response.ok) {
      throw new DownloadError({
        url: urlText,
        statusCode: response.status,
        statusText: response.statusText
      });
    }
    return {
      data: new Uint8Array(await response.arrayBuffer()),
      mimeType: (_a17 = response.headers.get("content-type")) != null ? _a17 : void 0
    };
  } catch (error) {
    if (DownloadError.isInstance(error)) {
      throw error;
    }
    throw new DownloadError({ url: urlText, cause: error });
  }
}
var name62 = "AI_InvalidDataContentError";
var marker62 = `vercel.ai.error.${name62}`;
var symbol62 = Symbol.for(marker62);
var _a62;
var InvalidDataContentError = class extends AISDKError {
  constructor({
    content,
    cause,
    message = `Invalid data content. Expected a base64 string, Uint8Array, ArrayBuffer, or Buffer, but got ${typeof content}.`
  }) {
    super({ name: name62, message, cause });
    this[_a62] = true;
    this.content = content;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker62);
  }
};
_a62 = symbol62;
var dataContentSchema = external_exports.union([
  external_exports.string(),
  external_exports.instanceof(Uint8Array),
  external_exports.instanceof(ArrayBuffer),
  external_exports.custom(
    // Buffer might not be available in some environments such as CloudFlare:
    (value) => {
      var _a17, _b;
      return (_b = (_a17 = globalThis.Buffer) == null ? void 0 : _a17.isBuffer(value)) != null ? _b : false;
    },
    { message: "Must be a Buffer" }
  )
]);
function convertDataContentToBase64String(content) {
  if (typeof content === "string") {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return convertUint8ArrayToBase64(new Uint8Array(content));
  }
  return convertUint8ArrayToBase64(content);
}
function convertDataContentToUint8Array(content) {
  if (content instanceof Uint8Array) {
    return content;
  }
  if (typeof content === "string") {
    try {
      return convertBase64ToUint8Array(content);
    } catch (error) {
      throw new InvalidDataContentError({
        message: "Invalid data content. Content string is not a base64-encoded media.",
        content,
        cause: error
      });
    }
  }
  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }
  throw new InvalidDataContentError({ content });
}
function convertUint8ArrayToText(uint8Array) {
  try {
    return new TextDecoder().decode(uint8Array);
  } catch (error) {
    throw new Error("Error decoding Uint8Array to text");
  }
}
var name72 = "AI_InvalidMessageRoleError";
var marker72 = `vercel.ai.error.${name72}`;
var symbol72 = Symbol.for(marker72);
var _a72;
var InvalidMessageRoleError = class extends AISDKError {
  constructor({
    role,
    message = `Invalid message role: '${role}'. Must be one of: "system", "user", "assistant", "tool".`
  }) {
    super({ name: name72, message });
    this[_a72] = true;
    this.role = role;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker72);
  }
};
_a72 = symbol72;
function splitDataUrl(dataUrl) {
  try {
    const [header, base64Content] = dataUrl.split(",");
    return {
      mimeType: header.split(";")[0].split(":")[1],
      base64Content
    };
  } catch (error) {
    return {
      mimeType: void 0,
      base64Content: void 0
    };
  }
}
async function convertToLanguageModelPrompt({
  prompt,
  modelSupportsImageUrls = true,
  modelSupportsUrl = () => false,
  downloadImplementation = download
}) {
  const downloadedAssets = await downloadAssets(
    prompt.messages,
    downloadImplementation,
    modelSupportsImageUrls,
    modelSupportsUrl
  );
  return [
    ...prompt.system != null ? [{ role: "system", content: prompt.system }] : [],
    ...prompt.messages.map(
      (message) => convertToLanguageModelMessage(message, downloadedAssets)
    )
  ];
}
function convertToLanguageModelMessage(message, downloadedAssets) {
  var _a17, _b, _c, _d, _e, _f;
  const role = message.role;
  switch (role) {
    case "system": {
      return {
        role: "system",
        content: message.content,
        providerMetadata: (_a17 = message.providerOptions) != null ? _a17 : message.experimental_providerMetadata
      };
    }
    case "user": {
      if (typeof message.content === "string") {
        return {
          role: "user",
          content: [{ type: "text", text: message.content }],
          providerMetadata: (_b = message.providerOptions) != null ? _b : message.experimental_providerMetadata
        };
      }
      return {
        role: "user",
        content: message.content.map((part) => convertPartToLanguageModelPart(part, downloadedAssets)).filter((part) => part.type !== "text" || part.text !== ""),
        providerMetadata: (_c = message.providerOptions) != null ? _c : message.experimental_providerMetadata
      };
    }
    case "assistant": {
      if (typeof message.content === "string") {
        return {
          role: "assistant",
          content: [{ type: "text", text: message.content }],
          providerMetadata: (_d = message.providerOptions) != null ? _d : message.experimental_providerMetadata
        };
      }
      return {
        role: "assistant",
        content: message.content.filter(
          // remove empty text parts:
          (part) => part.type !== "text" || part.text !== ""
        ).map((part) => {
          var _a18;
          const providerOptions = (_a18 = part.providerOptions) != null ? _a18 : part.experimental_providerMetadata;
          switch (part.type) {
            case "file": {
              return {
                type: "file",
                data: part.data instanceof URL ? part.data : convertDataContentToBase64String(part.data),
                filename: part.filename,
                mimeType: part.mimeType,
                providerMetadata: providerOptions
              };
            }
            case "reasoning": {
              return {
                type: "reasoning",
                text: part.text,
                signature: part.signature,
                providerMetadata: providerOptions
              };
            }
            case "redacted-reasoning": {
              return {
                type: "redacted-reasoning",
                data: part.data,
                providerMetadata: providerOptions
              };
            }
            case "text": {
              return {
                type: "text",
                text: part.text,
                providerMetadata: providerOptions
              };
            }
            case "tool-call": {
              return {
                type: "tool-call",
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: part.args,
                providerMetadata: providerOptions
              };
            }
          }
        }),
        providerMetadata: (_e = message.providerOptions) != null ? _e : message.experimental_providerMetadata
      };
    }
    case "tool": {
      return {
        role: "tool",
        content: message.content.map((part) => {
          var _a18;
          return {
            type: "tool-result",
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            result: part.result,
            content: part.experimental_content,
            isError: part.isError,
            providerMetadata: (_a18 = part.providerOptions) != null ? _a18 : part.experimental_providerMetadata
          };
        }),
        providerMetadata: (_f = message.providerOptions) != null ? _f : message.experimental_providerMetadata
      };
    }
    default: {
      const _exhaustiveCheck = role;
      throw new InvalidMessageRoleError({ role: _exhaustiveCheck });
    }
  }
}
async function downloadAssets(messages, downloadImplementation, modelSupportsImageUrls, modelSupportsUrl) {
  const urls = messages.filter((message) => message.role === "user").map((message) => message.content).filter(
    (content) => Array.isArray(content)
  ).flat().filter(
    (part) => part.type === "image" || part.type === "file"
  ).filter(
    (part) => !(part.type === "image" && modelSupportsImageUrls === true)
  ).map((part) => part.type === "image" ? part.image : part.data).map(
    (part) => (
      // support string urls:
      typeof part === "string" && (part.startsWith("http:") || part.startsWith("https:")) ? new URL(part) : part
    )
  ).filter((image) => image instanceof URL).filter((url) => !modelSupportsUrl(url));
  const downloadedImages = await Promise.all(
    urls.map(async (url) => ({
      url,
      data: await downloadImplementation({ url })
    }))
  );
  return Object.fromEntries(
    downloadedImages.map(({ url, data }) => [url.toString(), data])
  );
}
function convertPartToLanguageModelPart(part, downloadedAssets) {
  var _a17, _b, _c, _d;
  if (part.type === "text") {
    return {
      type: "text",
      text: part.text,
      providerMetadata: (_a17 = part.providerOptions) != null ? _a17 : part.experimental_providerMetadata
    };
  }
  let mimeType = part.mimeType;
  let data;
  let content;
  let normalizedData;
  const type = part.type;
  switch (type) {
    case "image":
      data = part.image;
      break;
    case "file":
      data = part.data;
      break;
    default:
      throw new Error(`Unsupported part type: ${type}`);
  }
  try {
    content = typeof data === "string" ? new URL(data) : data;
  } catch (error) {
    content = data;
  }
  if (content instanceof URL) {
    if (content.protocol === "data:") {
      const { mimeType: dataUrlMimeType, base64Content } = splitDataUrl(
        content.toString()
      );
      if (dataUrlMimeType == null || base64Content == null) {
        throw new Error(`Invalid data URL format in part ${type}`);
      }
      mimeType = dataUrlMimeType;
      normalizedData = convertDataContentToUint8Array(base64Content);
    } else {
      const downloadedFile = downloadedAssets[content.toString()];
      if (downloadedFile) {
        normalizedData = downloadedFile.data;
        mimeType != null ? mimeType : mimeType = downloadedFile.mimeType;
      } else {
        normalizedData = content;
      }
    }
  } else {
    normalizedData = convertDataContentToUint8Array(content);
  }
  switch (type) {
    case "image": {
      if (normalizedData instanceof Uint8Array) {
        mimeType = (_b = detectMimeType({
          data: normalizedData,
          signatures: imageMimeTypeSignatures
        })) != null ? _b : mimeType;
      }
      return {
        type: "image",
        image: normalizedData,
        mimeType,
        providerMetadata: (_c = part.providerOptions) != null ? _c : part.experimental_providerMetadata
      };
    }
    case "file": {
      if (mimeType == null) {
        throw new Error(`Mime type is missing for file part`);
      }
      return {
        type: "file",
        data: normalizedData instanceof Uint8Array ? convertDataContentToBase64String(normalizedData) : normalizedData,
        filename: part.filename,
        mimeType,
        providerMetadata: (_d = part.providerOptions) != null ? _d : part.experimental_providerMetadata
      };
    }
  }
}
function prepareCallSettings({
  maxTokens,
  temperature,
  topP,
  topK,
  presencePenalty,
  frequencyPenalty,
  stopSequences,
  seed
}) {
  if (maxTokens != null) {
    if (!Number.isInteger(maxTokens)) {
      throw new InvalidArgumentError2({
        parameter: "maxTokens",
        value: maxTokens,
        message: "maxTokens must be an integer"
      });
    }
    if (maxTokens < 1) {
      throw new InvalidArgumentError2({
        parameter: "maxTokens",
        value: maxTokens,
        message: "maxTokens must be >= 1"
      });
    }
  }
  if (temperature != null) {
    if (typeof temperature !== "number") {
      throw new InvalidArgumentError2({
        parameter: "temperature",
        value: temperature,
        message: "temperature must be a number"
      });
    }
  }
  if (topP != null) {
    if (typeof topP !== "number") {
      throw new InvalidArgumentError2({
        parameter: "topP",
        value: topP,
        message: "topP must be a number"
      });
    }
  }
  if (topK != null) {
    if (typeof topK !== "number") {
      throw new InvalidArgumentError2({
        parameter: "topK",
        value: topK,
        message: "topK must be a number"
      });
    }
  }
  if (presencePenalty != null) {
    if (typeof presencePenalty !== "number") {
      throw new InvalidArgumentError2({
        parameter: "presencePenalty",
        value: presencePenalty,
        message: "presencePenalty must be a number"
      });
    }
  }
  if (frequencyPenalty != null) {
    if (typeof frequencyPenalty !== "number") {
      throw new InvalidArgumentError2({
        parameter: "frequencyPenalty",
        value: frequencyPenalty,
        message: "frequencyPenalty must be a number"
      });
    }
  }
  if (seed != null) {
    if (!Number.isInteger(seed)) {
      throw new InvalidArgumentError2({
        parameter: "seed",
        value: seed,
        message: "seed must be an integer"
      });
    }
  }
  return {
    maxTokens,
    // TODO v5 remove default 0 for temperature
    temperature: temperature != null ? temperature : 0,
    topP,
    topK,
    presencePenalty,
    frequencyPenalty,
    stopSequences: stopSequences != null && stopSequences.length > 0 ? stopSequences : void 0,
    seed
  };
}
function attachmentsToParts(attachments) {
  var _a17, _b, _c;
  const parts = [];
  for (const attachment of attachments) {
    let url;
    try {
      url = new URL(attachment.url);
    } catch (error) {
      throw new Error(`Invalid URL: ${attachment.url}`);
    }
    switch (url.protocol) {
      case "http:":
      case "https:": {
        if ((_a17 = attachment.contentType) == null ? void 0 : _a17.startsWith("image/")) {
          parts.push({ type: "image", image: url });
        } else {
          if (!attachment.contentType) {
            throw new Error(
              "If the attachment is not an image, it must specify a content type"
            );
          }
          parts.push({
            type: "file",
            data: url,
            mimeType: attachment.contentType
          });
        }
        break;
      }
      case "data:": {
        let header;
        let base64Content;
        let mimeType;
        try {
          [header, base64Content] = attachment.url.split(",");
          mimeType = header.split(";")[0].split(":")[1];
        } catch (error) {
          throw new Error(`Error processing data URL: ${attachment.url}`);
        }
        if (mimeType == null || base64Content == null) {
          throw new Error(`Invalid data URL format: ${attachment.url}`);
        }
        if ((_b = attachment.contentType) == null ? void 0 : _b.startsWith("image/")) {
          parts.push({
            type: "image",
            image: convertDataContentToUint8Array(base64Content)
          });
        } else if ((_c = attachment.contentType) == null ? void 0 : _c.startsWith("text/")) {
          parts.push({
            type: "text",
            text: convertUint8ArrayToText(
              convertDataContentToUint8Array(base64Content)
            )
          });
        } else {
          if (!attachment.contentType) {
            throw new Error(
              "If the attachment is not an image or text, it must specify a content type"
            );
          }
          parts.push({
            type: "file",
            data: base64Content,
            mimeType: attachment.contentType
          });
        }
        break;
      }
      default: {
        throw new Error(`Unsupported URL protocol: ${url.protocol}`);
      }
    }
  }
  return parts;
}
var name82 = "AI_MessageConversionError";
var marker82 = `vercel.ai.error.${name82}`;
var symbol82 = Symbol.for(marker82);
var _a82;
var MessageConversionError = class extends AISDKError {
  constructor({
    originalMessage,
    message
  }) {
    super({ name: name82, message });
    this[_a82] = true;
    this.originalMessage = originalMessage;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker82);
  }
};
_a82 = symbol82;
function convertToCoreMessages(messages, options) {
  var _a17, _b;
  const tools = (_a17 = options == null ? void 0 : options.tools) != null ? _a17 : {};
  const coreMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const isLastMessage = i === messages.length - 1;
    const { role, content, experimental_attachments } = message;
    switch (role) {
      case "system": {
        coreMessages.push({
          role: "system",
          content
        });
        break;
      }
      case "user": {
        if (message.parts == null) {
          coreMessages.push({
            role: "user",
            content: experimental_attachments ? [
              { type: "text", text: content },
              ...attachmentsToParts(experimental_attachments)
            ] : content
          });
        } else {
          const textParts = message.parts.filter((part) => part.type === "text").map((part) => ({
            type: "text",
            text: part.text
          }));
          coreMessages.push({
            role: "user",
            content: experimental_attachments ? [...textParts, ...attachmentsToParts(experimental_attachments)] : textParts
          });
        }
        break;
      }
      case "assistant": {
        if (message.parts != null) {
          let processBlock2 = function() {
            const content2 = [];
            for (const part of block) {
              switch (part.type) {
                case "file":
                case "text": {
                  content2.push(part);
                  break;
                }
                case "reasoning": {
                  for (const detail of part.details) {
                    switch (detail.type) {
                      case "text":
                        content2.push({
                          type: "reasoning",
                          text: detail.text,
                          signature: detail.signature
                        });
                        break;
                      case "redacted":
                        content2.push({
                          type: "redacted-reasoning",
                          data: detail.data
                        });
                        break;
                    }
                  }
                  break;
                }
                case "tool-invocation":
                  content2.push({
                    type: "tool-call",
                    toolCallId: part.toolInvocation.toolCallId,
                    toolName: part.toolInvocation.toolName,
                    args: part.toolInvocation.args
                  });
                  break;
                default: {
                  const _exhaustiveCheck = part;
                  throw new Error(`Unsupported part: ${_exhaustiveCheck}`);
                }
              }
            }
            coreMessages.push({
              role: "assistant",
              content: content2
            });
            const stepInvocations = block.filter(
              (part) => part.type === "tool-invocation"
            ).map((part) => part.toolInvocation);
            if (stepInvocations.length > 0) {
              coreMessages.push({
                role: "tool",
                content: stepInvocations.map(
                  (toolInvocation) => {
                    if (!("result" in toolInvocation)) {
                      throw new MessageConversionError({
                        originalMessage: message,
                        message: "ToolInvocation must have a result: " + JSON.stringify(toolInvocation)
                      });
                    }
                    const { toolCallId, toolName, result } = toolInvocation;
                    const tool2 = tools[toolName];
                    return (tool2 == null ? void 0 : tool2.experimental_toToolResultContent) != null ? {
                      type: "tool-result",
                      toolCallId,
                      toolName,
                      result: tool2.experimental_toToolResultContent(result),
                      experimental_content: tool2.experimental_toToolResultContent(result)
                    } : {
                      type: "tool-result",
                      toolCallId,
                      toolName,
                      result
                    };
                  }
                )
              });
            }
            block = [];
            blockHasToolInvocations = false;
            currentStep++;
          };
          var processBlock = processBlock2;
          let currentStep = 0;
          let blockHasToolInvocations = false;
          let block = [];
          for (const part of message.parts) {
            switch (part.type) {
              case "text": {
                if (blockHasToolInvocations) {
                  processBlock2();
                }
                block.push(part);
                break;
              }
              case "file":
              case "reasoning": {
                block.push(part);
                break;
              }
              case "tool-invocation": {
                if (((_b = part.toolInvocation.step) != null ? _b : 0) !== currentStep) {
                  processBlock2();
                }
                block.push(part);
                blockHasToolInvocations = true;
                break;
              }
            }
          }
          processBlock2();
          break;
        }
        const toolInvocations = message.toolInvocations;
        if (toolInvocations == null || toolInvocations.length === 0) {
          coreMessages.push({ role: "assistant", content });
          break;
        }
        const maxStep = toolInvocations.reduce((max, toolInvocation) => {
          var _a18;
          return Math.max(max, (_a18 = toolInvocation.step) != null ? _a18 : 0);
        }, 0);
        for (let i2 = 0; i2 <= maxStep; i2++) {
          const stepInvocations = toolInvocations.filter(
            (toolInvocation) => {
              var _a18;
              return ((_a18 = toolInvocation.step) != null ? _a18 : 0) === i2;
            }
          );
          if (stepInvocations.length === 0) {
            continue;
          }
          coreMessages.push({
            role: "assistant",
            content: [
              ...isLastMessage && content && i2 === 0 ? [{ type: "text", text: content }] : [],
              ...stepInvocations.map(
                ({ toolCallId, toolName, args }) => ({
                  type: "tool-call",
                  toolCallId,
                  toolName,
                  args
                })
              )
            ]
          });
          coreMessages.push({
            role: "tool",
            content: stepInvocations.map((toolInvocation) => {
              if (!("result" in toolInvocation)) {
                throw new MessageConversionError({
                  originalMessage: message,
                  message: "ToolInvocation must have a result: " + JSON.stringify(toolInvocation)
                });
              }
              const { toolCallId, toolName, result } = toolInvocation;
              const tool2 = tools[toolName];
              return (tool2 == null ? void 0 : tool2.experimental_toToolResultContent) != null ? {
                type: "tool-result",
                toolCallId,
                toolName,
                result: tool2.experimental_toToolResultContent(result),
                experimental_content: tool2.experimental_toToolResultContent(result)
              } : {
                type: "tool-result",
                toolCallId,
                toolName,
                result
              };
            })
          });
        }
        if (content && !isLastMessage) {
          coreMessages.push({ role: "assistant", content });
        }
        break;
      }
      case "data": {
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new MessageConversionError({
          originalMessage: message,
          message: `Unsupported role: ${_exhaustiveCheck}`
        });
      }
    }
  }
  return coreMessages;
}
var jsonValueSchema = external_exports.lazy(
  () => external_exports.union([
    external_exports.null(),
    external_exports.string(),
    external_exports.number(),
    external_exports.boolean(),
    external_exports.record(external_exports.string(), jsonValueSchema),
    external_exports.array(jsonValueSchema)
  ])
);
var providerMetadataSchema = external_exports.record(
  external_exports.string(),
  external_exports.record(external_exports.string(), jsonValueSchema)
);
var toolResultContentSchema = external_exports.array(
  external_exports.union([
    external_exports.object({ type: external_exports.literal("text"), text: external_exports.string() }),
    external_exports.object({
      type: external_exports.literal("image"),
      data: external_exports.string(),
      mimeType: external_exports.string().optional()
    })
  ])
);
var textPartSchema = external_exports.object({
  type: external_exports.literal("text"),
  text: external_exports.string(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var imagePartSchema = external_exports.object({
  type: external_exports.literal("image"),
  image: external_exports.union([dataContentSchema, external_exports.instanceof(URL)]),
  mimeType: external_exports.string().optional(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var filePartSchema = external_exports.object({
  type: external_exports.literal("file"),
  data: external_exports.union([dataContentSchema, external_exports.instanceof(URL)]),
  filename: external_exports.string().optional(),
  mimeType: external_exports.string(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var reasoningPartSchema = external_exports.object({
  type: external_exports.literal("reasoning"),
  text: external_exports.string(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var redactedReasoningPartSchema = external_exports.object({
  type: external_exports.literal("redacted-reasoning"),
  data: external_exports.string(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var toolCallPartSchema = external_exports.object({
  type: external_exports.literal("tool-call"),
  toolCallId: external_exports.string(),
  toolName: external_exports.string(),
  args: external_exports.unknown(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var toolResultPartSchema = external_exports.object({
  type: external_exports.literal("tool-result"),
  toolCallId: external_exports.string(),
  toolName: external_exports.string(),
  result: external_exports.unknown(),
  content: toolResultContentSchema.optional(),
  isError: external_exports.boolean().optional(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var coreSystemMessageSchema = external_exports.object({
  role: external_exports.literal("system"),
  content: external_exports.string(),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var coreUserMessageSchema = external_exports.object({
  role: external_exports.literal("user"),
  content: external_exports.union([
    external_exports.string(),
    external_exports.array(external_exports.union([textPartSchema, imagePartSchema, filePartSchema]))
  ]),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var coreAssistantMessageSchema = external_exports.object({
  role: external_exports.literal("assistant"),
  content: external_exports.union([
    external_exports.string(),
    external_exports.array(
      external_exports.union([
        textPartSchema,
        filePartSchema,
        reasoningPartSchema,
        redactedReasoningPartSchema,
        toolCallPartSchema
      ])
    )
  ]),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var coreToolMessageSchema = external_exports.object({
  role: external_exports.literal("tool"),
  content: external_exports.array(toolResultPartSchema),
  providerOptions: providerMetadataSchema.optional(),
  experimental_providerMetadata: providerMetadataSchema.optional()
});
var coreMessageSchema = external_exports.union([
  coreSystemMessageSchema,
  coreUserMessageSchema,
  coreAssistantMessageSchema,
  coreToolMessageSchema
]);
function standardizePrompt({
  prompt,
  tools
}) {
  if (prompt.prompt == null && prompt.messages == null) {
    throw new InvalidPromptError({
      prompt,
      message: "prompt or messages must be defined"
    });
  }
  if (prompt.prompt != null && prompt.messages != null) {
    throw new InvalidPromptError({
      prompt,
      message: "prompt and messages cannot be defined at the same time"
    });
  }
  if (prompt.system != null && typeof prompt.system !== "string") {
    throw new InvalidPromptError({
      prompt,
      message: "system must be a string"
    });
  }
  if (prompt.prompt != null) {
    if (typeof prompt.prompt !== "string") {
      throw new InvalidPromptError({
        prompt,
        message: "prompt must be a string"
      });
    }
    return {
      type: "prompt",
      system: prompt.system,
      messages: [
        {
          role: "user",
          content: prompt.prompt
        }
      ]
    };
  }
  if (prompt.messages != null) {
    const promptType = detectPromptType(prompt.messages);
    const messages = promptType === "ui-messages" ? convertToCoreMessages(prompt.messages, {
      tools
    }) : prompt.messages;
    if (messages.length === 0) {
      throw new InvalidPromptError({
        prompt,
        message: "messages must not be empty"
      });
    }
    const validationResult = safeValidateTypes({
      value: messages,
      schema: external_exports.array(coreMessageSchema)
    });
    if (!validationResult.success) {
      throw new InvalidPromptError({
        prompt,
        message: [
          "message must be a CoreMessage or a UI message",
          `Validation error: ${validationResult.error.message}`
        ].join("\n"),
        cause: validationResult.error
      });
    }
    return {
      type: "messages",
      messages,
      system: prompt.system
    };
  }
  throw new Error("unreachable");
}
function detectPromptType(prompt) {
  if (!Array.isArray(prompt)) {
    throw new InvalidPromptError({
      prompt,
      message: [
        "messages must be an array of CoreMessage or UIMessage",
        `Received non-array value: ${JSON.stringify(prompt)}`
      ].join("\n"),
      cause: prompt
    });
  }
  if (prompt.length === 0) {
    return "messages";
  }
  const characteristics = prompt.map(detectSingleMessageCharacteristics);
  if (characteristics.some((c) => c === "has-ui-specific-parts")) {
    return "ui-messages";
  }
  const nonMessageIndex = characteristics.findIndex(
    (c) => c !== "has-core-specific-parts" && c !== "message"
  );
  if (nonMessageIndex === -1) {
    return "messages";
  }
  throw new InvalidPromptError({
    prompt,
    message: [
      "messages must be an array of CoreMessage or UIMessage",
      `Received message of type: "${characteristics[nonMessageIndex]}" at index ${nonMessageIndex}`,
      `messages[${nonMessageIndex}]: ${JSON.stringify(prompt[nonMessageIndex])}`
    ].join("\n"),
    cause: prompt
  });
}
function detectSingleMessageCharacteristics(message) {
  if (typeof message === "object" && message !== null && (message.role === "function" || // UI-only role
  message.role === "data" || // UI-only role
  "toolInvocations" in message || // UI-specific field
  "parts" in message || // UI-specific field
  "experimental_attachments" in message)) {
    return "has-ui-specific-parts";
  } else if (typeof message === "object" && message !== null && "content" in message && (Array.isArray(message.content) || // Core messages can have array content
  "experimental_providerMetadata" in message || "providerOptions" in message)) {
    return "has-core-specific-parts";
  } else if (typeof message === "object" && message !== null && "role" in message && "content" in message && typeof message.content === "string" && ["system", "user", "assistant", "tool"].includes(message.role)) {
    return "message";
  } else {
    return "other";
  }
}
function calculateLanguageModelUsage({
  promptTokens,
  completionTokens
}) {
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
}
function addLanguageModelUsage(usage1, usage2) {
  return {
    promptTokens: usage1.promptTokens + usage2.promptTokens,
    completionTokens: usage1.completionTokens + usage2.completionTokens,
    totalTokens: usage1.totalTokens + usage2.totalTokens
  };
}
var DEFAULT_SCHEMA_PREFIX = "JSON schema:";
var DEFAULT_SCHEMA_SUFFIX = "You MUST answer with a JSON object that matches the JSON schema above.";
var DEFAULT_GENERIC_SUFFIX = "You MUST answer with JSON.";
function injectJsonInstruction({
  prompt,
  schema,
  schemaPrefix = schema != null ? DEFAULT_SCHEMA_PREFIX : void 0,
  schemaSuffix = schema != null ? DEFAULT_SCHEMA_SUFFIX : DEFAULT_GENERIC_SUFFIX
}) {
  return [
    prompt != null && prompt.length > 0 ? prompt : void 0,
    prompt != null && prompt.length > 0 ? "" : void 0,
    // add a newline if prompt is not null
    schemaPrefix,
    schema != null ? JSON.stringify(schema) : void 0,
    schemaSuffix
  ].filter((line) => line != null).join("\n");
}
function createAsyncIterableStream(source) {
  const stream = source.pipeThrough(new TransformStream());
  stream[Symbol.asyncIterator] = () => {
    const reader = stream.getReader();
    return {
      async next() {
        const { done, value } = await reader.read();
        return done ? { done: true, value: void 0 } : { done: false, value };
      }
    };
  };
  return stream;
}
function stringifyForTelemetry(prompt) {
  const processedPrompt = prompt.map((message) => {
    return {
      ...message,
      content: typeof message.content === "string" ? message.content : message.content.map(processPart)
    };
  });
  return JSON.stringify(processedPrompt);
}
function processPart(part) {
  if (part.type === "image") {
    return {
      ...part,
      image: part.image instanceof Uint8Array ? convertDataContentToBase64String(part.image) : part.image
    };
  }
  return part;
}
var originalGenerateId = createIdGenerator({ prefix: "aiobj", size: 24 });
var DelayedPromise = class {
  constructor() {
    this.status = { type: "pending" };
    this._resolve = void 0;
    this._reject = void 0;
  }
  get value() {
    if (this.promise) {
      return this.promise;
    }
    this.promise = new Promise((resolve, reject) => {
      if (this.status.type === "resolved") {
        resolve(this.status.value);
      } else if (this.status.type === "rejected") {
        reject(this.status.error);
      }
      this._resolve = resolve;
      this._reject = reject;
    });
    return this.promise;
  }
  resolve(value) {
    var _a17;
    this.status = { type: "resolved", value };
    if (this.promise) {
      (_a17 = this._resolve) == null ? void 0 : _a17.call(this, value);
    }
  }
  reject(error) {
    var _a17;
    this.status = { type: "rejected", error };
    if (this.promise) {
      (_a17 = this._reject) == null ? void 0 : _a17.call(this, error);
    }
  }
};
function createResolvablePromise() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject
  };
}
function createStitchableStream() {
  let innerStreamReaders = [];
  let controller = null;
  let isClosed = false;
  let waitForNewStream = createResolvablePromise();
  const processPull = async () => {
    if (isClosed && innerStreamReaders.length === 0) {
      controller == null ? void 0 : controller.close();
      return;
    }
    if (innerStreamReaders.length === 0) {
      waitForNewStream = createResolvablePromise();
      await waitForNewStream.promise;
      return processPull();
    }
    try {
      const { value, done } = await innerStreamReaders[0].read();
      if (done) {
        innerStreamReaders.shift();
        if (innerStreamReaders.length > 0) {
          await processPull();
        } else if (isClosed) {
          controller == null ? void 0 : controller.close();
        }
      } else {
        controller == null ? void 0 : controller.enqueue(value);
      }
    } catch (error) {
      controller == null ? void 0 : controller.error(error);
      innerStreamReaders.shift();
      if (isClosed && innerStreamReaders.length === 0) {
        controller == null ? void 0 : controller.close();
      }
    }
  };
  return {
    stream: new ReadableStream({
      start(controllerParam) {
        controller = controllerParam;
      },
      pull: processPull,
      async cancel() {
        for (const reader of innerStreamReaders) {
          await reader.cancel();
        }
        innerStreamReaders = [];
        isClosed = true;
      }
    }),
    addStream: (innerStream) => {
      if (isClosed) {
        throw new Error("Cannot add inner stream: outer stream is closed");
      }
      innerStreamReaders.push(innerStream.getReader());
      waitForNewStream.resolve();
    },
    /**
     * Gracefully close the outer stream. This will let the inner streams
     * finish processing and then close the outer stream.
     */
    close: () => {
      isClosed = true;
      waitForNewStream.resolve();
      if (innerStreamReaders.length === 0) {
        controller == null ? void 0 : controller.close();
      }
    },
    /**
     * Immediately close the outer stream. This will cancel all inner streams
     * and close the outer stream.
     */
    terminate: () => {
      isClosed = true;
      waitForNewStream.resolve();
      innerStreamReaders.forEach((reader) => reader.cancel());
      innerStreamReaders = [];
      controller == null ? void 0 : controller.close();
    }
  };
}
function now2() {
  var _a17, _b;
  return (_b = (_a17 = globalThis == null ? void 0 : globalThis.performance) == null ? void 0 : _a17.now()) != null ? _b : Date.now();
}
var originalGenerateId2 = createIdGenerator({ prefix: "aiobj", size: 24 });
var name92 = "AI_NoOutputSpecifiedError";
var marker92 = `vercel.ai.error.${name92}`;
var symbol92 = Symbol.for(marker92);
var _a92;
var NoOutputSpecifiedError = class extends AISDKError {
  // used in isInstance
  constructor({ message = "No output specified." } = {}) {
    super({ name: name92, message });
    this[_a92] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker92);
  }
};
_a92 = symbol92;
var name102 = "AI_ToolExecutionError";
var marker102 = `vercel.ai.error.${name102}`;
var symbol102 = Symbol.for(marker102);
var _a102;
var ToolExecutionError = class extends AISDKError {
  constructor({
    toolArgs,
    toolName,
    toolCallId,
    cause,
    message = `Error executing tool ${toolName}: ${getErrorMessage(cause)}`
  }) {
    super({ name: name102, message, cause });
    this[_a102] = true;
    this.toolArgs = toolArgs;
    this.toolName = toolName;
    this.toolCallId = toolCallId;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker102);
  }
};
_a102 = symbol102;
function isNonEmptyObject(object2) {
  return object2 != null && Object.keys(object2).length > 0;
}
function prepareToolsAndToolChoice({
  tools,
  toolChoice,
  activeTools
}) {
  if (!isNonEmptyObject(tools)) {
    return {
      tools: void 0,
      toolChoice: void 0
    };
  }
  const filteredTools = activeTools != null ? Object.entries(tools).filter(
    ([name17]) => activeTools.includes(name17)
  ) : Object.entries(tools);
  return {
    tools: filteredTools.map(([name17, tool2]) => {
      const toolType = tool2.type;
      switch (toolType) {
        case void 0:
        case "function":
          return {
            type: "function",
            name: name17,
            description: tool2.description,
            parameters: asSchema(tool2.parameters).jsonSchema
          };
        case "provider-defined":
          return {
            type: "provider-defined",
            name: name17,
            id: tool2.id,
            args: tool2.args
          };
        default: {
          const exhaustiveCheck = toolType;
          throw new Error(`Unsupported tool type: ${exhaustiveCheck}`);
        }
      }
    }),
    toolChoice: toolChoice == null ? { type: "auto" } : typeof toolChoice === "string" ? { type: toolChoice } : { type: "tool", toolName: toolChoice.toolName }
  };
}
var lastWhitespaceRegexp = /^([\s\S]*?)(\s+)(\S*)$/;
function splitOnLastWhitespace(text2) {
  const match2 = text2.match(lastWhitespaceRegexp);
  return match2 ? { prefix: match2[1], whitespace: match2[2], suffix: match2[3] } : void 0;
}
var name112 = "AI_InvalidToolArgumentsError";
var marker112 = `vercel.ai.error.${name112}`;
var symbol112 = Symbol.for(marker112);
var _a112;
var InvalidToolArgumentsError = class extends AISDKError {
  constructor({
    toolArgs,
    toolName,
    cause,
    message = `Invalid arguments for tool ${toolName}: ${getErrorMessage(
      cause
    )}`
  }) {
    super({ name: name112, message, cause });
    this[_a112] = true;
    this.toolArgs = toolArgs;
    this.toolName = toolName;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker112);
  }
};
_a112 = symbol112;
var name122 = "AI_NoSuchToolError";
var marker122 = `vercel.ai.error.${name122}`;
var symbol122 = Symbol.for(marker122);
var _a122;
var NoSuchToolError = class extends AISDKError {
  constructor({
    toolName,
    availableTools = void 0,
    message = `Model tried to call unavailable tool '${toolName}'. ${availableTools === void 0 ? "No tools are available." : `Available tools: ${availableTools.join(", ")}.`}`
  }) {
    super({ name: name122, message });
    this[_a122] = true;
    this.toolName = toolName;
    this.availableTools = availableTools;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker122);
  }
};
_a122 = symbol122;
var name132 = "AI_ToolCallRepairError";
var marker132 = `vercel.ai.error.${name132}`;
var symbol132 = Symbol.for(marker132);
var _a132;
var ToolCallRepairError = class extends AISDKError {
  constructor({
    cause,
    originalError,
    message = `Error repairing tool call: ${getErrorMessage(cause)}`
  }) {
    super({ name: name132, message, cause });
    this[_a132] = true;
    this.originalError = originalError;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker132);
  }
};
_a132 = symbol132;
async function parseToolCall({
  toolCall,
  tools,
  repairToolCall,
  system,
  messages
}) {
  if (tools == null) {
    throw new NoSuchToolError({ toolName: toolCall.toolName });
  }
  try {
    return await doParseToolCall({ toolCall, tools });
  } catch (error) {
    if (repairToolCall == null || !(NoSuchToolError.isInstance(error) || InvalidToolArgumentsError.isInstance(error))) {
      throw error;
    }
    let repairedToolCall = null;
    try {
      repairedToolCall = await repairToolCall({
        toolCall,
        tools,
        parameterSchema: ({ toolName }) => asSchema(tools[toolName].parameters).jsonSchema,
        system,
        messages,
        error
      });
    } catch (repairError) {
      throw new ToolCallRepairError({
        cause: repairError,
        originalError: error
      });
    }
    if (repairedToolCall == null) {
      throw error;
    }
    return await doParseToolCall({ toolCall: repairedToolCall, tools });
  }
}
async function doParseToolCall({
  toolCall,
  tools
}) {
  const toolName = toolCall.toolName;
  const tool2 = tools[toolName];
  if (tool2 == null) {
    throw new NoSuchToolError({
      toolName: toolCall.toolName,
      availableTools: Object.keys(tools)
    });
  }
  const schema = asSchema(tool2.parameters);
  const parseResult = toolCall.args.trim() === "" ? safeValidateTypes({ value: {}, schema }) : safeParseJSON({ text: toolCall.args, schema });
  if (parseResult.success === false) {
    throw new InvalidToolArgumentsError({
      toolName,
      toolArgs: toolCall.args,
      cause: parseResult.error
    });
  }
  return {
    type: "tool-call",
    toolCallId: toolCall.toolCallId,
    toolName,
    args: parseResult.value
  };
}
function asReasoningText(reasoning) {
  const reasoningText = reasoning.filter((part) => part.type === "text").map((part) => part.text).join("");
  return reasoningText.length > 0 ? reasoningText : void 0;
}
function toResponseMessages({
  text: text2 = "",
  files,
  reasoning,
  tools,
  toolCalls,
  toolResults,
  messageId,
  generateMessageId
}) {
  const responseMessages = [];
  const content = [];
  if (reasoning.length > 0) {
    content.push(
      ...reasoning.map(
        (part) => part.type === "text" ? { ...part, type: "reasoning" } : { ...part, type: "redacted-reasoning" }
      )
    );
  }
  if (files.length > 0) {
    content.push(
      ...files.map((file) => ({
        type: "file",
        data: file.base64,
        mimeType: file.mimeType
      }))
    );
  }
  if (text2.length > 0) {
    content.push({ type: "text", text: text2 });
  }
  if (toolCalls.length > 0) {
    content.push(...toolCalls);
  }
  if (content.length > 0) {
    responseMessages.push({
      role: "assistant",
      content,
      id: messageId
    });
  }
  if (toolResults.length > 0) {
    responseMessages.push({
      role: "tool",
      id: generateMessageId(),
      content: toolResults.map((toolResult) => {
        const tool2 = tools[toolResult.toolName];
        return (tool2 == null ? void 0 : tool2.experimental_toToolResultContent) != null ? {
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
          result: tool2.experimental_toToolResultContent(toolResult.result),
          experimental_content: tool2.experimental_toToolResultContent(
            toolResult.result
          )
        } : {
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
          result: toolResult.result
        };
      })
    });
  }
  return responseMessages;
}
var originalGenerateId3 = createIdGenerator({
  prefix: "aitxt",
  size: 24
});
var originalGenerateMessageId = createIdGenerator({
  prefix: "msg",
  size: 24
});
var output_exports = {};
__export2(output_exports, {
  object: () => object,
  text: () => text
});
var name142 = "AI_InvalidStreamPartError";
var marker142 = `vercel.ai.error.${name142}`;
var symbol142 = Symbol.for(marker142);
var _a142;
var InvalidStreamPartError = class extends AISDKError {
  constructor({
    chunk,
    message
  }) {
    super({ name: name142, message });
    this[_a142] = true;
    this.chunk = chunk;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker142);
  }
};
_a142 = symbol142;
var name15 = "AI_MCPClientError";
var marker152 = `vercel.ai.error.${name15}`;
var symbol152 = Symbol.for(marker152);
var _a152;
_a152 = symbol152;
var text = () => ({
  type: "text",
  responseFormat: () => ({ type: "text" }),
  injectIntoSystemPrompt({ system }) {
    return system;
  },
  parsePartial({ text: text2 }) {
    return { partial: text2 };
  },
  parseOutput({ text: text2 }) {
    return text2;
  }
});
var object = ({
  schema: inputSchema
}) => {
  const schema = asSchema(inputSchema);
  return {
    type: "object",
    responseFormat: ({ model }) => ({
      type: "json",
      schema: model.supportsStructuredOutputs ? schema.jsonSchema : void 0
    }),
    injectIntoSystemPrompt({ system, model }) {
      return model.supportsStructuredOutputs ? system : injectJsonInstruction({
        prompt: system,
        schema: schema.jsonSchema
      });
    },
    parsePartial({ text: text2 }) {
      const result = parsePartialJson(text2);
      switch (result.state) {
        case "failed-parse":
        case "undefined-input":
          return void 0;
        case "repaired-parse":
        case "successful-parse":
          return {
            // Note: currently no validation of partial results:
            partial: result.value
          };
        default: {
          const _exhaustiveCheck = result.state;
          throw new Error(`Unsupported parse state: ${_exhaustiveCheck}`);
        }
      }
    },
    parseOutput({ text: text2 }, context) {
      const parseResult = safeParseJSON({ text: text2 });
      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: could not parse the response.",
          cause: parseResult.error,
          text: text2,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason
        });
      }
      const validationResult = safeValidateTypes({
        value: parseResult.value,
        schema
      });
      if (!validationResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: response did not match schema.",
          cause: validationResult.error,
          text: text2,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason
        });
      }
      return validationResult.value;
    }
  };
};
function asArray(value) {
  return value === void 0 ? [] : Array.isArray(value) ? value : [value];
}
async function consumeStream({
  stream,
  onError
}) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done } = await reader.read();
      if (done)
        break;
    }
  } catch (error) {
    onError == null ? void 0 : onError(error);
  } finally {
    reader.releaseLock();
  }
}
function mergeStreams(stream1, stream2) {
  const reader1 = stream1.getReader();
  const reader2 = stream2.getReader();
  let lastRead1 = void 0;
  let lastRead2 = void 0;
  let stream1Done = false;
  let stream2Done = false;
  async function readStream1(controller) {
    try {
      if (lastRead1 == null) {
        lastRead1 = reader1.read();
      }
      const result = await lastRead1;
      lastRead1 = void 0;
      if (!result.done) {
        controller.enqueue(result.value);
      } else {
        controller.close();
      }
    } catch (error) {
      controller.error(error);
    }
  }
  async function readStream2(controller) {
    try {
      if (lastRead2 == null) {
        lastRead2 = reader2.read();
      }
      const result = await lastRead2;
      lastRead2 = void 0;
      if (!result.done) {
        controller.enqueue(result.value);
      } else {
        controller.close();
      }
    } catch (error) {
      controller.error(error);
    }
  }
  return new ReadableStream({
    async pull(controller) {
      try {
        if (stream1Done) {
          await readStream2(controller);
          return;
        }
        if (stream2Done) {
          await readStream1(controller);
          return;
        }
        if (lastRead1 == null) {
          lastRead1 = reader1.read();
        }
        if (lastRead2 == null) {
          lastRead2 = reader2.read();
        }
        const { result, reader } = await Promise.race([
          lastRead1.then((result2) => ({ result: result2, reader: reader1 })),
          lastRead2.then((result2) => ({ result: result2, reader: reader2 }))
        ]);
        if (!result.done) {
          controller.enqueue(result.value);
        }
        if (reader === reader1) {
          lastRead1 = void 0;
          if (result.done) {
            await readStream2(controller);
            stream1Done = true;
          }
        } else {
          lastRead2 = void 0;
          if (result.done) {
            stream2Done = true;
            await readStream1(controller);
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      reader1.cancel();
      reader2.cancel();
    }
  });
}
function runToolsTransformation({
  tools,
  generatorStream,
  toolCallStreaming,
  tracer,
  telemetry,
  system,
  messages,
  abortSignal,
  repairToolCall
}) {
  let toolResultsStreamController = null;
  const toolResultsStream = new ReadableStream({
    start(controller) {
      toolResultsStreamController = controller;
    }
  });
  const activeToolCalls = {};
  const outstandingToolResults = /* @__PURE__ */ new Set();
  let canClose = false;
  let finishChunk = void 0;
  function attemptClose() {
    if (canClose && outstandingToolResults.size === 0) {
      if (finishChunk != null) {
        toolResultsStreamController.enqueue(finishChunk);
      }
      toolResultsStreamController.close();
    }
  }
  const forwardStream = new TransformStream({
    async transform(chunk, controller) {
      const chunkType = chunk.type;
      switch (chunkType) {
        case "text-delta":
        case "reasoning":
        case "reasoning-signature":
        case "redacted-reasoning":
        case "source":
        case "response-metadata":
        case "error": {
          controller.enqueue(chunk);
          break;
        }
        case "file": {
          controller.enqueue(
            new DefaultGeneratedFileWithType({
              data: chunk.data,
              mimeType: chunk.mimeType
            })
          );
          break;
        }
        case "tool-call-delta": {
          if (toolCallStreaming) {
            if (!activeToolCalls[chunk.toolCallId]) {
              controller.enqueue({
                type: "tool-call-streaming-start",
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName
              });
              activeToolCalls[chunk.toolCallId] = true;
            }
            controller.enqueue({
              type: "tool-call-delta",
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              argsTextDelta: chunk.argsTextDelta
            });
          }
          break;
        }
        case "tool-call": {
          try {
            const toolCall = await parseToolCall({
              toolCall: chunk,
              tools,
              repairToolCall,
              system,
              messages
            });
            controller.enqueue(toolCall);
            const tool2 = tools[toolCall.toolName];
            if (tool2.execute != null) {
              const toolExecutionId = generateId();
              outstandingToolResults.add(toolExecutionId);
              recordSpan({
                name: "ai.toolCall",
                attributes: selectTelemetryAttributes({
                  telemetry,
                  attributes: {
                    ...assembleOperationName({
                      operationId: "ai.toolCall",
                      telemetry
                    }),
                    "ai.toolCall.name": toolCall.toolName,
                    "ai.toolCall.id": toolCall.toolCallId,
                    "ai.toolCall.args": {
                      output: () => JSON.stringify(toolCall.args)
                    }
                  }
                }),
                tracer,
                fn: async (span) => tool2.execute(toolCall.args, {
                  toolCallId: toolCall.toolCallId,
                  messages,
                  abortSignal
                }).then(
                  (result) => {
                    toolResultsStreamController.enqueue({
                      ...toolCall,
                      type: "tool-result",
                      result
                    });
                    outstandingToolResults.delete(toolExecutionId);
                    attemptClose();
                    try {
                      span.setAttributes(
                        selectTelemetryAttributes({
                          telemetry,
                          attributes: {
                            "ai.toolCall.result": {
                              output: () => JSON.stringify(result)
                            }
                          }
                        })
                      );
                    } catch (ignored) {
                    }
                  },
                  (error) => {
                    toolResultsStreamController.enqueue({
                      type: "error",
                      error: new ToolExecutionError({
                        toolCallId: toolCall.toolCallId,
                        toolName: toolCall.toolName,
                        toolArgs: toolCall.args,
                        cause: error
                      })
                    });
                    outstandingToolResults.delete(toolExecutionId);
                    attemptClose();
                  }
                )
              });
            }
          } catch (error) {
            toolResultsStreamController.enqueue({
              type: "error",
              error
            });
          }
          break;
        }
        case "finish": {
          finishChunk = {
            type: "finish",
            finishReason: chunk.finishReason,
            logprobs: chunk.logprobs,
            usage: calculateLanguageModelUsage(chunk.usage),
            experimental_providerMetadata: chunk.providerMetadata
          };
          break;
        }
        default: {
          const _exhaustiveCheck = chunkType;
          throw new Error(`Unhandled chunk type: ${_exhaustiveCheck}`);
        }
      }
    },
    flush() {
      canClose = true;
      attemptClose();
    }
  });
  return new ReadableStream({
    async start(controller) {
      return Promise.all([
        generatorStream.pipeThrough(forwardStream).pipeTo(
          new WritableStream({
            write(chunk) {
              controller.enqueue(chunk);
            },
            close() {
            }
          })
        ),
        toolResultsStream.pipeTo(
          new WritableStream({
            write(chunk) {
              controller.enqueue(chunk);
            },
            close() {
              controller.close();
            }
          })
        )
      ]);
    }
  });
}
var originalGenerateId4 = createIdGenerator({
  prefix: "aitxt",
  size: 24
});
var originalGenerateMessageId2 = createIdGenerator({
  prefix: "msg",
  size: 24
});
function streamText({
  model,
  tools,
  toolChoice,
  system,
  prompt,
  messages,
  maxRetries,
  abortSignal,
  headers,
  maxSteps = 1,
  experimental_generateMessageId: generateMessageId = originalGenerateMessageId2,
  experimental_output: output,
  experimental_continueSteps: continueSteps = false,
  experimental_telemetry: telemetry,
  experimental_providerMetadata,
  providerOptions = experimental_providerMetadata,
  experimental_toolCallStreaming = false,
  toolCallStreaming = experimental_toolCallStreaming,
  experimental_activeTools: activeTools,
  experimental_repairToolCall: repairToolCall,
  experimental_transform: transform,
  onChunk,
  onError,
  onFinish,
  onStepFinish,
  _internal: {
    now: now22 = now2,
    generateId: generateId3 = originalGenerateId4,
    currentDate = () => /* @__PURE__ */ new Date()
  } = {},
  ...settings
}) {
  return new DefaultStreamTextResult({
    model,
    telemetry,
    headers,
    settings,
    maxRetries,
    abortSignal,
    system,
    prompt,
    messages,
    tools,
    toolChoice,
    toolCallStreaming,
    transforms: asArray(transform),
    activeTools,
    repairToolCall,
    maxSteps,
    output,
    continueSteps,
    providerOptions,
    onChunk,
    onError,
    onFinish,
    onStepFinish,
    now: now22,
    currentDate,
    generateId: generateId3,
    generateMessageId
  });
}
function createOutputTransformStream(output) {
  if (!output) {
    return new TransformStream({
      transform(chunk, controller) {
        controller.enqueue({ part: chunk, partialOutput: void 0 });
      }
    });
  }
  let text2 = "";
  let textChunk = "";
  let lastPublishedJson = "";
  function publishTextChunk({
    controller,
    partialOutput = void 0
  }) {
    controller.enqueue({
      part: { type: "text-delta", textDelta: textChunk },
      partialOutput
    });
    textChunk = "";
  }
  return new TransformStream({
    transform(chunk, controller) {
      if (chunk.type === "step-finish") {
        publishTextChunk({ controller });
      }
      if (chunk.type !== "text-delta") {
        controller.enqueue({ part: chunk, partialOutput: void 0 });
        return;
      }
      text2 += chunk.textDelta;
      textChunk += chunk.textDelta;
      const result = output.parsePartial({ text: text2 });
      if (result != null) {
        const currentJson = JSON.stringify(result.partial);
        if (currentJson !== lastPublishedJson) {
          publishTextChunk({ controller, partialOutput: result.partial });
          lastPublishedJson = currentJson;
        }
      }
    },
    flush(controller) {
      if (textChunk.length > 0) {
        publishTextChunk({ controller });
      }
    }
  });
}
var DefaultStreamTextResult = class {
  constructor({
    model,
    telemetry,
    headers,
    settings,
    maxRetries: maxRetriesArg,
    abortSignal,
    system,
    prompt,
    messages,
    tools,
    toolChoice,
    toolCallStreaming,
    transforms,
    activeTools,
    repairToolCall,
    maxSteps,
    output,
    continueSteps,
    providerOptions,
    now: now22,
    currentDate,
    generateId: generateId3,
    generateMessageId,
    onChunk,
    onError,
    onFinish,
    onStepFinish
  }) {
    this.warningsPromise = new DelayedPromise();
    this.usagePromise = new DelayedPromise();
    this.finishReasonPromise = new DelayedPromise();
    this.providerMetadataPromise = new DelayedPromise();
    this.textPromise = new DelayedPromise();
    this.reasoningPromise = new DelayedPromise();
    this.reasoningDetailsPromise = new DelayedPromise();
    this.sourcesPromise = new DelayedPromise();
    this.filesPromise = new DelayedPromise();
    this.toolCallsPromise = new DelayedPromise();
    this.toolResultsPromise = new DelayedPromise();
    this.requestPromise = new DelayedPromise();
    this.responsePromise = new DelayedPromise();
    this.stepsPromise = new DelayedPromise();
    var _a17;
    if (maxSteps < 1) {
      throw new InvalidArgumentError2({
        parameter: "maxSteps",
        value: maxSteps,
        message: "maxSteps must be at least 1"
      });
    }
    this.output = output;
    let recordedStepText = "";
    let recordedContinuationText = "";
    let recordedFullText = "";
    let stepReasoning = [];
    let stepFiles = [];
    let activeReasoningText = void 0;
    let recordedStepSources = [];
    const recordedSources = [];
    const recordedResponse = {
      id: generateId3(),
      timestamp: currentDate(),
      modelId: model.modelId,
      messages: []
    };
    let recordedToolCalls = [];
    let recordedToolResults = [];
    let recordedFinishReason = void 0;
    let recordedUsage = void 0;
    let stepType = "initial";
    const recordedSteps = [];
    let rootSpan;
    const eventProcessor = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
        const { part } = chunk;
        if (part.type === "text-delta" || part.type === "reasoning" || part.type === "source" || part.type === "tool-call" || part.type === "tool-result" || part.type === "tool-call-streaming-start" || part.type === "tool-call-delta") {
          await (onChunk == null ? void 0 : onChunk({ chunk: part }));
        }
        if (part.type === "error") {
          await (onError == null ? void 0 : onError({ error: part.error }));
        }
        if (part.type === "text-delta") {
          recordedStepText += part.textDelta;
          recordedContinuationText += part.textDelta;
          recordedFullText += part.textDelta;
        }
        if (part.type === "reasoning") {
          if (activeReasoningText == null) {
            activeReasoningText = { type: "text", text: part.textDelta };
            stepReasoning.push(activeReasoningText);
          } else {
            activeReasoningText.text += part.textDelta;
          }
        }
        if (part.type === "reasoning-signature") {
          if (activeReasoningText == null) {
            throw new AISDKError({
              name: "InvalidStreamPart",
              message: "reasoning-signature without reasoning"
            });
          }
          activeReasoningText.signature = part.signature;
          activeReasoningText = void 0;
        }
        if (part.type === "redacted-reasoning") {
          stepReasoning.push({ type: "redacted", data: part.data });
        }
        if (part.type === "file") {
          stepFiles.push(part);
        }
        if (part.type === "source") {
          recordedSources.push(part.source);
          recordedStepSources.push(part.source);
        }
        if (part.type === "tool-call") {
          recordedToolCalls.push(part);
        }
        if (part.type === "tool-result") {
          recordedToolResults.push(part);
        }
        if (part.type === "step-finish") {
          const stepMessages = toResponseMessages({
            text: recordedContinuationText,
            files: stepFiles,
            reasoning: stepReasoning,
            tools: tools != null ? tools : {},
            toolCalls: recordedToolCalls,
            toolResults: recordedToolResults,
            messageId: part.messageId,
            generateMessageId
          });
          const currentStep = recordedSteps.length;
          let nextStepType = "done";
          if (currentStep + 1 < maxSteps) {
            if (continueSteps && part.finishReason === "length" && // only use continue when there are no tool calls:
            recordedToolCalls.length === 0) {
              nextStepType = "continue";
            } else if (
              // there are tool calls:
              recordedToolCalls.length > 0 && // all current tool calls have results:
              recordedToolResults.length === recordedToolCalls.length
            ) {
              nextStepType = "tool-result";
            }
          }
          const currentStepResult = {
            stepType,
            text: recordedStepText,
            reasoning: asReasoningText(stepReasoning),
            reasoningDetails: stepReasoning,
            files: stepFiles,
            sources: recordedStepSources,
            toolCalls: recordedToolCalls,
            toolResults: recordedToolResults,
            finishReason: part.finishReason,
            usage: part.usage,
            warnings: part.warnings,
            logprobs: part.logprobs,
            request: part.request,
            response: {
              ...part.response,
              messages: [...recordedResponse.messages, ...stepMessages]
            },
            providerMetadata: part.experimental_providerMetadata,
            experimental_providerMetadata: part.experimental_providerMetadata,
            isContinued: part.isContinued
          };
          await (onStepFinish == null ? void 0 : onStepFinish(currentStepResult));
          recordedSteps.push(currentStepResult);
          recordedToolCalls = [];
          recordedToolResults = [];
          recordedStepText = "";
          recordedStepSources = [];
          stepReasoning = [];
          stepFiles = [];
          activeReasoningText = void 0;
          if (nextStepType !== "done") {
            stepType = nextStepType;
          }
          if (nextStepType !== "continue") {
            recordedResponse.messages.push(...stepMessages);
            recordedContinuationText = "";
          }
        }
        if (part.type === "finish") {
          recordedResponse.id = part.response.id;
          recordedResponse.timestamp = part.response.timestamp;
          recordedResponse.modelId = part.response.modelId;
          recordedResponse.headers = part.response.headers;
          recordedUsage = part.usage;
          recordedFinishReason = part.finishReason;
        }
      },
      async flush(controller) {
        var _a18;
        try {
          if (recordedSteps.length === 0) {
            return;
          }
          const lastStep = recordedSteps[recordedSteps.length - 1];
          self.warningsPromise.resolve(lastStep.warnings);
          self.requestPromise.resolve(lastStep.request);
          self.responsePromise.resolve(lastStep.response);
          self.toolCallsPromise.resolve(lastStep.toolCalls);
          self.toolResultsPromise.resolve(lastStep.toolResults);
          self.providerMetadataPromise.resolve(
            lastStep.experimental_providerMetadata
          );
          self.reasoningPromise.resolve(lastStep.reasoning);
          self.reasoningDetailsPromise.resolve(lastStep.reasoningDetails);
          const finishReason = recordedFinishReason != null ? recordedFinishReason : "unknown";
          const usage = recordedUsage != null ? recordedUsage : {
            completionTokens: NaN,
            promptTokens: NaN,
            totalTokens: NaN
          };
          self.finishReasonPromise.resolve(finishReason);
          self.usagePromise.resolve(usage);
          self.textPromise.resolve(recordedFullText);
          self.sourcesPromise.resolve(recordedSources);
          self.filesPromise.resolve(lastStep.files);
          self.stepsPromise.resolve(recordedSteps);
          await (onFinish == null ? void 0 : onFinish({
            finishReason,
            logprobs: void 0,
            usage,
            text: recordedFullText,
            reasoning: lastStep.reasoning,
            reasoningDetails: lastStep.reasoningDetails,
            files: lastStep.files,
            sources: lastStep.sources,
            toolCalls: lastStep.toolCalls,
            toolResults: lastStep.toolResults,
            request: (_a18 = lastStep.request) != null ? _a18 : {},
            response: lastStep.response,
            warnings: lastStep.warnings,
            providerMetadata: lastStep.providerMetadata,
            experimental_providerMetadata: lastStep.experimental_providerMetadata,
            steps: recordedSteps
          }));
          rootSpan.setAttributes(
            selectTelemetryAttributes({
              telemetry,
              attributes: {
                "ai.response.finishReason": finishReason,
                "ai.response.text": { output: () => recordedFullText },
                "ai.response.toolCalls": {
                  output: () => {
                    var _a19;
                    return ((_a19 = lastStep.toolCalls) == null ? void 0 : _a19.length) ? JSON.stringify(lastStep.toolCalls) : void 0;
                  }
                },
                "ai.usage.promptTokens": usage.promptTokens,
                "ai.usage.completionTokens": usage.completionTokens
              }
            })
          );
        } catch (error) {
          controller.error(error);
        } finally {
          rootSpan.end();
        }
      }
    });
    const stitchableStream = createStitchableStream();
    this.addStream = stitchableStream.addStream;
    this.closeStream = stitchableStream.close;
    let stream = stitchableStream.stream;
    for (const transform of transforms) {
      stream = stream.pipeThrough(
        transform({
          tools,
          stopStream() {
            stitchableStream.terminate();
          }
        })
      );
    }
    this.baseStream = stream.pipeThrough(createOutputTransformStream(output)).pipeThrough(eventProcessor);
    const { maxRetries, retry } = prepareRetries({
      maxRetries: maxRetriesArg
    });
    const tracer = getTracer(telemetry);
    const baseTelemetryAttributes = getBaseTelemetryAttributes({
      model,
      telemetry,
      headers,
      settings: { ...settings, maxRetries }
    });
    const initialPrompt = standardizePrompt({
      prompt: {
        system: (_a17 = output == null ? void 0 : output.injectIntoSystemPrompt({ system, model })) != null ? _a17 : system,
        prompt,
        messages
      },
      tools
    });
    const self = this;
    recordSpan({
      name: "ai.streamText",
      attributes: selectTelemetryAttributes({
        telemetry,
        attributes: {
          ...assembleOperationName({ operationId: "ai.streamText", telemetry }),
          ...baseTelemetryAttributes,
          // specific settings that only make sense on the outer level:
          "ai.prompt": {
            input: () => JSON.stringify({ system, prompt, messages })
          },
          "ai.settings.maxSteps": maxSteps
        }
      }),
      tracer,
      endWhenDone: false,
      fn: async (rootSpanArg) => {
        rootSpan = rootSpanArg;
        async function streamStep({
          currentStep,
          responseMessages,
          usage,
          stepType: stepType2,
          previousStepText,
          hasLeadingWhitespace,
          messageId
        }) {
          var _a18;
          const promptFormat = responseMessages.length === 0 ? initialPrompt.type : "messages";
          const stepInputMessages = [
            ...initialPrompt.messages,
            ...responseMessages
          ];
          const promptMessages = await convertToLanguageModelPrompt({
            prompt: {
              type: promptFormat,
              system: initialPrompt.system,
              messages: stepInputMessages
            },
            modelSupportsImageUrls: model.supportsImageUrls,
            modelSupportsUrl: (_a18 = model.supportsUrl) == null ? void 0 : _a18.bind(model)
            // support 'this' context
          });
          const mode = {
            type: "regular",
            ...prepareToolsAndToolChoice({ tools, toolChoice, activeTools })
          };
          const {
            result: { stream: stream2, warnings, rawResponse, request },
            doStreamSpan,
            startTimestampMs
          } = await retry(
            () => recordSpan({
              name: "ai.streamText.doStream",
              attributes: selectTelemetryAttributes({
                telemetry,
                attributes: {
                  ...assembleOperationName({
                    operationId: "ai.streamText.doStream",
                    telemetry
                  }),
                  ...baseTelemetryAttributes,
                  "ai.prompt.format": {
                    input: () => promptFormat
                  },
                  "ai.prompt.messages": {
                    input: () => stringifyForTelemetry(promptMessages)
                  },
                  "ai.prompt.tools": {
                    // convert the language model level tools:
                    input: () => {
                      var _a19;
                      return (_a19 = mode.tools) == null ? void 0 : _a19.map((tool2) => JSON.stringify(tool2));
                    }
                  },
                  "ai.prompt.toolChoice": {
                    input: () => mode.toolChoice != null ? JSON.stringify(mode.toolChoice) : void 0
                  },
                  // standardized gen-ai llm span attributes:
                  "gen_ai.system": model.provider,
                  "gen_ai.request.model": model.modelId,
                  "gen_ai.request.frequency_penalty": settings.frequencyPenalty,
                  "gen_ai.request.max_tokens": settings.maxTokens,
                  "gen_ai.request.presence_penalty": settings.presencePenalty,
                  "gen_ai.request.stop_sequences": settings.stopSequences,
                  "gen_ai.request.temperature": settings.temperature,
                  "gen_ai.request.top_k": settings.topK,
                  "gen_ai.request.top_p": settings.topP
                }
              }),
              tracer,
              endWhenDone: false,
              fn: async (doStreamSpan2) => ({
                startTimestampMs: now22(),
                // get before the call
                doStreamSpan: doStreamSpan2,
                result: await model.doStream({
                  mode,
                  ...prepareCallSettings(settings),
                  inputFormat: promptFormat,
                  responseFormat: output == null ? void 0 : output.responseFormat({ model }),
                  prompt: promptMessages,
                  providerMetadata: providerOptions,
                  abortSignal,
                  headers
                })
              })
            })
          );
          const transformedStream = runToolsTransformation({
            tools,
            generatorStream: stream2,
            toolCallStreaming,
            tracer,
            telemetry,
            system,
            messages: stepInputMessages,
            repairToolCall,
            abortSignal
          });
          const stepRequest = request != null ? request : {};
          const stepToolCalls = [];
          const stepToolResults = [];
          const stepReasoning2 = [];
          const stepFiles2 = [];
          let activeReasoningText2 = void 0;
          let stepFinishReason = "unknown";
          let stepUsage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          };
          let stepProviderMetadata;
          let stepFirstChunk = true;
          let stepText = "";
          let fullStepText = stepType2 === "continue" ? previousStepText : "";
          let stepLogProbs;
          let stepResponse = {
            id: generateId3(),
            timestamp: currentDate(),
            modelId: model.modelId
          };
          let chunkBuffer = "";
          let chunkTextPublished = false;
          let inWhitespacePrefix = true;
          let hasWhitespaceSuffix = false;
          async function publishTextChunk({
            controller,
            chunk
          }) {
            controller.enqueue(chunk);
            stepText += chunk.textDelta;
            fullStepText += chunk.textDelta;
            chunkTextPublished = true;
            hasWhitespaceSuffix = chunk.textDelta.trimEnd() !== chunk.textDelta;
          }
          self.addStream(
            transformedStream.pipeThrough(
              new TransformStream({
                async transform(chunk, controller) {
                  var _a19, _b, _c;
                  if (stepFirstChunk) {
                    const msToFirstChunk = now22() - startTimestampMs;
                    stepFirstChunk = false;
                    doStreamSpan.addEvent("ai.stream.firstChunk", {
                      "ai.response.msToFirstChunk": msToFirstChunk
                    });
                    doStreamSpan.setAttributes({
                      "ai.response.msToFirstChunk": msToFirstChunk
                    });
                    controller.enqueue({
                      type: "step-start",
                      messageId,
                      request: stepRequest,
                      warnings: warnings != null ? warnings : []
                    });
                  }
                  if (chunk.type === "text-delta" && chunk.textDelta.length === 0) {
                    return;
                  }
                  const chunkType = chunk.type;
                  switch (chunkType) {
                    case "text-delta": {
                      if (continueSteps) {
                        const trimmedChunkText = inWhitespacePrefix && hasLeadingWhitespace ? chunk.textDelta.trimStart() : chunk.textDelta;
                        if (trimmedChunkText.length === 0) {
                          break;
                        }
                        inWhitespacePrefix = false;
                        chunkBuffer += trimmedChunkText;
                        const split = splitOnLastWhitespace(chunkBuffer);
                        if (split != null) {
                          chunkBuffer = split.suffix;
                          await publishTextChunk({
                            controller,
                            chunk: {
                              type: "text-delta",
                              textDelta: split.prefix + split.whitespace
                            }
                          });
                        }
                      } else {
                        await publishTextChunk({ controller, chunk });
                      }
                      break;
                    }
                    case "reasoning": {
                      controller.enqueue(chunk);
                      if (activeReasoningText2 == null) {
                        activeReasoningText2 = {
                          type: "text",
                          text: chunk.textDelta
                        };
                        stepReasoning2.push(activeReasoningText2);
                      } else {
                        activeReasoningText2.text += chunk.textDelta;
                      }
                      break;
                    }
                    case "reasoning-signature": {
                      controller.enqueue(chunk);
                      if (activeReasoningText2 == null) {
                        throw new InvalidStreamPartError({
                          chunk,
                          message: "reasoning-signature without reasoning"
                        });
                      }
                      activeReasoningText2.signature = chunk.signature;
                      activeReasoningText2 = void 0;
                      break;
                    }
                    case "redacted-reasoning": {
                      controller.enqueue(chunk);
                      stepReasoning2.push({
                        type: "redacted",
                        data: chunk.data
                      });
                      break;
                    }
                    case "tool-call": {
                      controller.enqueue(chunk);
                      stepToolCalls.push(chunk);
                      break;
                    }
                    case "tool-result": {
                      controller.enqueue(chunk);
                      stepToolResults.push(chunk);
                      break;
                    }
                    case "response-metadata": {
                      stepResponse = {
                        id: (_a19 = chunk.id) != null ? _a19 : stepResponse.id,
                        timestamp: (_b = chunk.timestamp) != null ? _b : stepResponse.timestamp,
                        modelId: (_c = chunk.modelId) != null ? _c : stepResponse.modelId
                      };
                      break;
                    }
                    case "finish": {
                      stepUsage = chunk.usage;
                      stepFinishReason = chunk.finishReason;
                      stepProviderMetadata = chunk.experimental_providerMetadata;
                      stepLogProbs = chunk.logprobs;
                      const msToFinish = now22() - startTimestampMs;
                      doStreamSpan.addEvent("ai.stream.finish");
                      doStreamSpan.setAttributes({
                        "ai.response.msToFinish": msToFinish,
                        "ai.response.avgCompletionTokensPerSecond": 1e3 * stepUsage.completionTokens / msToFinish
                      });
                      break;
                    }
                    case "file": {
                      stepFiles2.push(chunk);
                      controller.enqueue(chunk);
                      break;
                    }
                    case "source":
                    case "tool-call-streaming-start":
                    case "tool-call-delta": {
                      controller.enqueue(chunk);
                      break;
                    }
                    case "error": {
                      controller.enqueue(chunk);
                      stepFinishReason = "error";
                      break;
                    }
                    default: {
                      const exhaustiveCheck = chunkType;
                      throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
                    }
                  }
                },
                // invoke onFinish callback and resolve toolResults promise when the stream is about to close:
                async flush(controller) {
                  const stepToolCallsJson = stepToolCalls.length > 0 ? JSON.stringify(stepToolCalls) : void 0;
                  let nextStepType = "done";
                  if (currentStep + 1 < maxSteps) {
                    if (continueSteps && stepFinishReason === "length" && // only use continue when there are no tool calls:
                    stepToolCalls.length === 0) {
                      nextStepType = "continue";
                    } else if (
                      // there are tool calls:
                      stepToolCalls.length > 0 && // all current tool calls have results:
                      stepToolResults.length === stepToolCalls.length
                    ) {
                      nextStepType = "tool-result";
                    }
                  }
                  if (continueSteps && chunkBuffer.length > 0 && (nextStepType !== "continue" || // when the next step is a regular step, publish the buffer
                  stepType2 === "continue" && !chunkTextPublished)) {
                    await publishTextChunk({
                      controller,
                      chunk: {
                        type: "text-delta",
                        textDelta: chunkBuffer
                      }
                    });
                    chunkBuffer = "";
                  }
                  try {
                    doStreamSpan.setAttributes(
                      selectTelemetryAttributes({
                        telemetry,
                        attributes: {
                          "ai.response.finishReason": stepFinishReason,
                          "ai.response.text": { output: () => stepText },
                          "ai.response.toolCalls": {
                            output: () => stepToolCallsJson
                          },
                          "ai.response.id": stepResponse.id,
                          "ai.response.model": stepResponse.modelId,
                          "ai.response.timestamp": stepResponse.timestamp.toISOString(),
                          "ai.usage.promptTokens": stepUsage.promptTokens,
                          "ai.usage.completionTokens": stepUsage.completionTokens,
                          // standardized gen-ai llm span attributes:
                          "gen_ai.response.finish_reasons": [stepFinishReason],
                          "gen_ai.response.id": stepResponse.id,
                          "gen_ai.response.model": stepResponse.modelId,
                          "gen_ai.usage.input_tokens": stepUsage.promptTokens,
                          "gen_ai.usage.output_tokens": stepUsage.completionTokens
                        }
                      })
                    );
                  } catch (error) {
                  } finally {
                    doStreamSpan.end();
                  }
                  controller.enqueue({
                    type: "step-finish",
                    finishReason: stepFinishReason,
                    usage: stepUsage,
                    providerMetadata: stepProviderMetadata,
                    experimental_providerMetadata: stepProviderMetadata,
                    logprobs: stepLogProbs,
                    request: stepRequest,
                    response: {
                      ...stepResponse,
                      headers: rawResponse == null ? void 0 : rawResponse.headers
                    },
                    warnings,
                    isContinued: nextStepType === "continue",
                    messageId
                  });
                  const combinedUsage = addLanguageModelUsage(usage, stepUsage);
                  if (nextStepType === "done") {
                    controller.enqueue({
                      type: "finish",
                      finishReason: stepFinishReason,
                      usage: combinedUsage,
                      providerMetadata: stepProviderMetadata,
                      experimental_providerMetadata: stepProviderMetadata,
                      logprobs: stepLogProbs,
                      response: {
                        ...stepResponse,
                        headers: rawResponse == null ? void 0 : rawResponse.headers
                      }
                    });
                    self.closeStream();
                  } else {
                    if (stepType2 === "continue") {
                      const lastMessage = responseMessages[responseMessages.length - 1];
                      if (typeof lastMessage.content === "string") {
                        lastMessage.content += stepText;
                      } else {
                        lastMessage.content.push({
                          text: stepText,
                          type: "text"
                        });
                      }
                    } else {
                      responseMessages.push(
                        ...toResponseMessages({
                          text: stepText,
                          files: stepFiles2,
                          reasoning: stepReasoning2,
                          tools: tools != null ? tools : {},
                          toolCalls: stepToolCalls,
                          toolResults: stepToolResults,
                          messageId,
                          generateMessageId
                        })
                      );
                    }
                    await streamStep({
                      currentStep: currentStep + 1,
                      responseMessages,
                      usage: combinedUsage,
                      stepType: nextStepType,
                      previousStepText: fullStepText,
                      hasLeadingWhitespace: hasWhitespaceSuffix,
                      messageId: (
                        // keep the same id when continuing a step:
                        nextStepType === "continue" ? messageId : generateMessageId()
                      )
                    });
                  }
                }
              })
            )
          );
        }
        await streamStep({
          currentStep: 0,
          responseMessages: [],
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          },
          previousStepText: "",
          stepType: "initial",
          hasLeadingWhitespace: false,
          messageId: generateMessageId()
        });
      }
    }).catch((error) => {
      self.addStream(
        new ReadableStream({
          start(controller) {
            controller.enqueue({ type: "error", error });
            controller.close();
          }
        })
      );
      self.closeStream();
    });
  }
  get warnings() {
    return this.warningsPromise.value;
  }
  get usage() {
    return this.usagePromise.value;
  }
  get finishReason() {
    return this.finishReasonPromise.value;
  }
  get experimental_providerMetadata() {
    return this.providerMetadataPromise.value;
  }
  get providerMetadata() {
    return this.providerMetadataPromise.value;
  }
  get text() {
    return this.textPromise.value;
  }
  get reasoning() {
    return this.reasoningPromise.value;
  }
  get reasoningDetails() {
    return this.reasoningDetailsPromise.value;
  }
  get sources() {
    return this.sourcesPromise.value;
  }
  get files() {
    return this.filesPromise.value;
  }
  get toolCalls() {
    return this.toolCallsPromise.value;
  }
  get toolResults() {
    return this.toolResultsPromise.value;
  }
  get request() {
    return this.requestPromise.value;
  }
  get response() {
    return this.responsePromise.value;
  }
  get steps() {
    return this.stepsPromise.value;
  }
  /**
  Split out a new stream from the original stream.
  The original stream is replaced to allow for further splitting,
  since we do not know how many times the stream will be split.
  
  Note: this leads to buffering the stream content on the server.
  However, the LLM results are expected to be small enough to not cause issues.
     */
  teeStream() {
    const [stream1, stream2] = this.baseStream.tee();
    this.baseStream = stream2;
    return stream1;
  }
  get textStream() {
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream({
          transform({ part }, controller) {
            if (part.type === "text-delta") {
              controller.enqueue(part.textDelta);
            }
          }
        })
      )
    );
  }
  get fullStream() {
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream({
          transform({ part }, controller) {
            controller.enqueue(part);
          }
        })
      )
    );
  }
  async consumeStream(options) {
    var _a17;
    try {
      await consumeStream({
        stream: this.fullStream,
        onError: options == null ? void 0 : options.onError
      });
    } catch (error) {
      (_a17 = options == null ? void 0 : options.onError) == null ? void 0 : _a17.call(options, error);
    }
  }
  get experimental_partialOutputStream() {
    if (this.output == null) {
      throw new NoOutputSpecifiedError();
    }
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream({
          transform({ partialOutput }, controller) {
            if (partialOutput != null) {
              controller.enqueue(partialOutput);
            }
          }
        })
      )
    );
  }
  toDataStreamInternal({
    getErrorMessage: getErrorMessage5 = () => "An error occurred.",
    // mask error messages for safety by default
    sendUsage = true,
    sendReasoning = false,
    sendSources = false,
    experimental_sendFinish = true
  }) {
    return this.fullStream.pipeThrough(
      new TransformStream({
        transform: async (chunk, controller) => {
          const chunkType = chunk.type;
          switch (chunkType) {
            case "text-delta": {
              controller.enqueue(formatDataStreamPart("text", chunk.textDelta));
              break;
            }
            case "reasoning": {
              if (sendReasoning) {
                controller.enqueue(
                  formatDataStreamPart("reasoning", chunk.textDelta)
                );
              }
              break;
            }
            case "redacted-reasoning": {
              if (sendReasoning) {
                controller.enqueue(
                  formatDataStreamPart("redacted_reasoning", {
                    data: chunk.data
                  })
                );
              }
              break;
            }
            case "reasoning-signature": {
              if (sendReasoning) {
                controller.enqueue(
                  formatDataStreamPart("reasoning_signature", {
                    signature: chunk.signature
                  })
                );
              }
              break;
            }
            case "file": {
              controller.enqueue(
                formatDataStreamPart("file", {
                  mimeType: chunk.mimeType,
                  data: chunk.base64
                })
              );
              break;
            }
            case "source": {
              if (sendSources) {
                controller.enqueue(
                  formatDataStreamPart("source", chunk.source)
                );
              }
              break;
            }
            case "tool-call-streaming-start": {
              controller.enqueue(
                formatDataStreamPart("tool_call_streaming_start", {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName
                })
              );
              break;
            }
            case "tool-call-delta": {
              controller.enqueue(
                formatDataStreamPart("tool_call_delta", {
                  toolCallId: chunk.toolCallId,
                  argsTextDelta: chunk.argsTextDelta
                })
              );
              break;
            }
            case "tool-call": {
              controller.enqueue(
                formatDataStreamPart("tool_call", {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  args: chunk.args
                })
              );
              break;
            }
            case "tool-result": {
              controller.enqueue(
                formatDataStreamPart("tool_result", {
                  toolCallId: chunk.toolCallId,
                  result: chunk.result
                })
              );
              break;
            }
            case "error": {
              controller.enqueue(
                formatDataStreamPart("error", getErrorMessage5(chunk.error))
              );
              break;
            }
            case "step-start": {
              controller.enqueue(
                formatDataStreamPart("start_step", {
                  messageId: chunk.messageId
                })
              );
              break;
            }
            case "step-finish": {
              controller.enqueue(
                formatDataStreamPart("finish_step", {
                  finishReason: chunk.finishReason,
                  usage: sendUsage ? {
                    promptTokens: chunk.usage.promptTokens,
                    completionTokens: chunk.usage.completionTokens
                  } : void 0,
                  isContinued: chunk.isContinued
                })
              );
              break;
            }
            case "finish": {
              if (experimental_sendFinish) {
                controller.enqueue(
                  formatDataStreamPart("finish_message", {
                    finishReason: chunk.finishReason,
                    usage: sendUsage ? {
                      promptTokens: chunk.usage.promptTokens,
                      completionTokens: chunk.usage.completionTokens
                    } : void 0
                  })
                );
              }
              break;
            }
            default: {
              const exhaustiveCheck = chunkType;
              throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
            }
          }
        }
      })
    );
  }
  pipeDataStreamToResponse(response, {
    status,
    statusText,
    headers,
    data,
    getErrorMessage: getErrorMessage5,
    sendUsage,
    sendReasoning,
    sendSources,
    experimental_sendFinish
  } = {}) {
    writeToServerResponse({
      response,
      status,
      statusText,
      headers: prepareOutgoingHttpHeaders(headers, {
        contentType: "text/plain; charset=utf-8",
        dataStreamVersion: "v1"
      }),
      stream: this.toDataStream({
        data,
        getErrorMessage: getErrorMessage5,
        sendUsage,
        sendReasoning,
        sendSources,
        experimental_sendFinish
      })
    });
  }
  pipeTextStreamToResponse(response, init) {
    writeToServerResponse({
      response,
      status: init == null ? void 0 : init.status,
      statusText: init == null ? void 0 : init.statusText,
      headers: prepareOutgoingHttpHeaders(init == null ? void 0 : init.headers, {
        contentType: "text/plain; charset=utf-8"
      }),
      stream: this.textStream.pipeThrough(new TextEncoderStream())
    });
  }
  // TODO breaking change 5.0: remove pipeThrough(new TextEncoderStream())
  toDataStream(options) {
    const stream = this.toDataStreamInternal({
      getErrorMessage: options == null ? void 0 : options.getErrorMessage,
      sendUsage: options == null ? void 0 : options.sendUsage,
      sendReasoning: options == null ? void 0 : options.sendReasoning,
      sendSources: options == null ? void 0 : options.sendSources,
      experimental_sendFinish: options == null ? void 0 : options.experimental_sendFinish
    }).pipeThrough(new TextEncoderStream());
    return (options == null ? void 0 : options.data) ? mergeStreams(options == null ? void 0 : options.data.stream, stream) : stream;
  }
  mergeIntoDataStream(writer, options) {
    writer.merge(
      this.toDataStreamInternal({
        getErrorMessage: writer.onError,
        sendUsage: options == null ? void 0 : options.sendUsage,
        sendReasoning: options == null ? void 0 : options.sendReasoning,
        sendSources: options == null ? void 0 : options.sendSources,
        experimental_sendFinish: options == null ? void 0 : options.experimental_sendFinish
      })
    );
  }
  toDataStreamResponse({
    headers,
    status,
    statusText,
    data,
    getErrorMessage: getErrorMessage5,
    sendUsage,
    sendReasoning,
    sendSources,
    experimental_sendFinish
  } = {}) {
    return new Response(
      this.toDataStream({
        data,
        getErrorMessage: getErrorMessage5,
        sendUsage,
        sendReasoning,
        sendSources,
        experimental_sendFinish
      }),
      {
        status,
        statusText,
        headers: prepareResponseHeaders(headers, {
          contentType: "text/plain; charset=utf-8",
          dataStreamVersion: "v1"
        })
      }
    );
  }
  toTextStreamResponse(init) {
    var _a17;
    return new Response(this.textStream.pipeThrough(new TextEncoderStream()), {
      status: (_a17 = init == null ? void 0 : init.status) != null ? _a17 : 200,
      headers: prepareResponseHeaders(init == null ? void 0 : init.headers, {
        contentType: "text/plain; charset=utf-8"
      })
    });
  }
};
var name16 = "AI_NoSuchProviderError";
var marker16 = `vercel.ai.error.${name16}`;
var symbol16 = Symbol.for(marker16);
var _a16;
_a16 = symbol16;
function tool(tool2) {
  return tool2;
}
var ClientOrServerImplementationSchema = external_exports.object({
  name: external_exports.string(),
  version: external_exports.string()
}).passthrough();
var BaseParamsSchema = external_exports.object({
  _meta: external_exports.optional(external_exports.object({}).passthrough())
}).passthrough();
var ResultSchema = BaseParamsSchema;
var RequestSchema = external_exports.object({
  method: external_exports.string(),
  params: external_exports.optional(BaseParamsSchema)
});
var ServerCapabilitiesSchema = external_exports.object({
  experimental: external_exports.optional(external_exports.object({}).passthrough()),
  logging: external_exports.optional(external_exports.object({}).passthrough()),
  prompts: external_exports.optional(
    external_exports.object({
      listChanged: external_exports.optional(external_exports.boolean())
    }).passthrough()
  ),
  resources: external_exports.optional(
    external_exports.object({
      subscribe: external_exports.optional(external_exports.boolean()),
      listChanged: external_exports.optional(external_exports.boolean())
    }).passthrough()
  ),
  tools: external_exports.optional(
    external_exports.object({
      listChanged: external_exports.optional(external_exports.boolean())
    }).passthrough()
  )
}).passthrough();
var InitializeResultSchema = ResultSchema.extend({
  protocolVersion: external_exports.string(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ClientOrServerImplementationSchema,
  instructions: external_exports.optional(external_exports.string())
});
var PaginatedResultSchema = ResultSchema.extend({
  nextCursor: external_exports.optional(external_exports.string())
});
var ToolSchema = external_exports.object({
  name: external_exports.string(),
  description: external_exports.optional(external_exports.string()),
  inputSchema: external_exports.object({
    type: external_exports.literal("object"),
    properties: external_exports.optional(external_exports.object({}).passthrough())
  }).passthrough()
}).passthrough();
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: external_exports.array(ToolSchema)
});
var TextContentSchema = external_exports.object({
  type: external_exports.literal("text"),
  text: external_exports.string()
}).passthrough();
var ImageContentSchema = external_exports.object({
  type: external_exports.literal("image"),
  data: external_exports.string().base64(),
  mimeType: external_exports.string()
}).passthrough();
var ResourceContentsSchema = external_exports.object({
  /**
   * The URI of this resource.
   */
  uri: external_exports.string(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: external_exports.optional(external_exports.string())
}).passthrough();
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  text: external_exports.string()
});
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  blob: external_exports.string().base64()
});
var EmbeddedResourceSchema = external_exports.object({
  type: external_exports.literal("resource"),
  resource: external_exports.union([TextResourceContentsSchema, BlobResourceContentsSchema])
}).passthrough();
var CallToolResultSchema = ResultSchema.extend({
  content: external_exports.array(
    external_exports.union([TextContentSchema, ImageContentSchema, EmbeddedResourceSchema])
  ),
  isError: external_exports.boolean().default(false).optional()
}).or(
  ResultSchema.extend({
    toolResult: external_exports.unknown()
  })
);
var JSONRPC_VERSION = "2.0";
var JSONRPCRequestSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: external_exports.union([external_exports.string(), external_exports.number().int()])
}).merge(RequestSchema).strict();
var JSONRPCResponseSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: external_exports.union([external_exports.string(), external_exports.number().int()]),
  result: ResultSchema
}).strict();
var JSONRPCErrorSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION),
  id: external_exports.union([external_exports.string(), external_exports.number().int()]),
  error: external_exports.object({
    code: external_exports.number().int(),
    message: external_exports.string(),
    data: external_exports.optional(external_exports.unknown())
  })
}).strict();
var JSONRPCNotificationSchema = external_exports.object({
  jsonrpc: external_exports.literal(JSONRPC_VERSION)
}).merge(
  external_exports.object({
    method: external_exports.string(),
    params: external_exports.optional(BaseParamsSchema)
  })
).strict();
var JSONRPCMessageSchema = external_exports.union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResponseSchema,
  JSONRPCErrorSchema
]);
var langchain_adapter_exports = {};
__export2(langchain_adapter_exports, {
  mergeIntoDataStream: () => mergeIntoDataStream,
  toDataStream: () => toDataStream,
  toDataStreamResponse: () => toDataStreamResponse
});
function createCallbacksTransformer(callbacks = {}) {
  const textEncoder = new TextEncoder();
  let aggregatedResponse = "";
  return new TransformStream({
    async start() {
      if (callbacks.onStart)
        await callbacks.onStart();
    },
    async transform(message, controller) {
      controller.enqueue(textEncoder.encode(message));
      aggregatedResponse += message;
      if (callbacks.onToken)
        await callbacks.onToken(message);
      if (callbacks.onText && typeof message === "string") {
        await callbacks.onText(message);
      }
    },
    async flush() {
      if (callbacks.onCompletion) {
        await callbacks.onCompletion(aggregatedResponse);
      }
      if (callbacks.onFinal) {
        await callbacks.onFinal(aggregatedResponse);
      }
    }
  });
}
function toDataStreamInternal(stream, callbacks) {
  return stream.pipeThrough(
    new TransformStream({
      transform: async (value, controller) => {
        var _a17;
        if (typeof value === "string") {
          controller.enqueue(value);
          return;
        }
        if ("event" in value) {
          if (value.event === "on_chat_model_stream") {
            forwardAIMessageChunk(
              (_a17 = value.data) == null ? void 0 : _a17.chunk,
              controller
            );
          }
          return;
        }
        forwardAIMessageChunk(value, controller);
      }
    })
  ).pipeThrough(createCallbacksTransformer(callbacks)).pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream({
      transform: async (chunk, controller) => {
        controller.enqueue(formatDataStreamPart("text", chunk));
      }
    })
  );
}
function toDataStream(stream, callbacks) {
  return toDataStreamInternal(stream, callbacks).pipeThrough(
    new TextEncoderStream()
  );
}
function toDataStreamResponse(stream, options) {
  var _a17;
  const dataStream = toDataStreamInternal(
    stream,
    options == null ? void 0 : options.callbacks
  ).pipeThrough(new TextEncoderStream());
  const data = options == null ? void 0 : options.data;
  const init = options == null ? void 0 : options.init;
  const responseStream = data ? mergeStreams(data.stream, dataStream) : dataStream;
  return new Response(responseStream, {
    status: (_a17 = init == null ? void 0 : init.status) != null ? _a17 : 200,
    statusText: init == null ? void 0 : init.statusText,
    headers: prepareResponseHeaders(init == null ? void 0 : init.headers, {
      contentType: "text/plain; charset=utf-8",
      dataStreamVersion: "v1"
    })
  });
}
function mergeIntoDataStream(stream, options) {
  options.dataStream.merge(toDataStreamInternal(stream, options.callbacks));
}
function forwardAIMessageChunk(chunk, controller) {
  if (typeof chunk.content === "string") {
    controller.enqueue(chunk.content);
  } else {
    const content = chunk.content;
    for (const item of content) {
      if (item.type === "text") {
        controller.enqueue(item.text);
      }
    }
  }
}
var llamaindex_adapter_exports = {};
__export2(llamaindex_adapter_exports, {
  mergeIntoDataStream: () => mergeIntoDataStream2,
  toDataStream: () => toDataStream2,
  toDataStreamResponse: () => toDataStreamResponse2
});
function toDataStreamInternal2(stream, callbacks) {
  const trimStart = trimStartOfStream();
  return convertAsyncIteratorToReadableStream(stream[Symbol.asyncIterator]()).pipeThrough(
    new TransformStream({
      async transform(message, controller) {
        controller.enqueue(trimStart(message.delta));
      }
    })
  ).pipeThrough(createCallbacksTransformer(callbacks)).pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream({
      transform: async (chunk, controller) => {
        controller.enqueue(formatDataStreamPart("text", chunk));
      }
    })
  );
}
function toDataStream2(stream, callbacks) {
  return toDataStreamInternal2(stream, callbacks).pipeThrough(
    new TextEncoderStream()
  );
}
function toDataStreamResponse2(stream, options = {}) {
  var _a17;
  const { init, data, callbacks } = options;
  const dataStream = toDataStreamInternal2(stream, callbacks).pipeThrough(
    new TextEncoderStream()
  );
  const responseStream = data ? mergeStreams(data.stream, dataStream) : dataStream;
  return new Response(responseStream, {
    status: (_a17 = init == null ? void 0 : init.status) != null ? _a17 : 200,
    statusText: init == null ? void 0 : init.statusText,
    headers: prepareResponseHeaders(init == null ? void 0 : init.headers, {
      contentType: "text/plain; charset=utf-8",
      dataStreamVersion: "v1"
    })
  });
}
function mergeIntoDataStream2(stream, options) {
  options.dataStream.merge(toDataStreamInternal2(stream, options.callbacks));
}
function trimStartOfStream() {
  let isStreamStart = true;
  return (text2) => {
    if (isStreamStart) {
      text2 = text2.trimStart();
      if (text2)
        isStreamStart = false;
    }
    return text2;
  };
}
var HANGING_STREAM_WARNING_TIME_MS = 15 * 1e3;

// packages/layout-engine/src/index.ts
var import_d3_flextree = __toESM(require_d3_flextree(), 1);
var DENSITY = {
  comfortable: { gapX: 80, gapY: 40, nodeW: 212, nodeH: 60, pad: 20 },
  compact: { gapX: 52, gapY: 28, nodeW: 168, nodeH: 48, pad: 12 }
};
function nodeLayoutSize(node, dens, opts) {
  let w = dens.nodeW;
  let h = dens.nodeH;
  const hasMeta = Boolean(node.tags?.length) || Boolean(node.links?.length) || Boolean(node.dueAt) || Boolean(node.note);
  if (hasMeta) h += dens.nodeH * 0.4;
  else h += dens.nodeH * 0.25;
  const preset = node.stylePreset ?? "default";
  const asCard = Boolean(opts?.asCard) || preset === "card";
  if (asCard) {
    const w2 = dens.nodeW >= 200 ? 288 : 248;
    const gap = 10;
    let body = 0;
    if (node.note) body += 32 + gap;
    if (node.imageUrl) body += 68 + gap;
    if (node.tags?.length) body += 32 + gap;
    if (node.links?.length) body += 32 + gap;
    if (node.startAt != null) body += 32 + gap;
    if (node.dueAt != null) body += 32 + gap;
    if (node.pinned) body += 32 + gap;
    if (body > 0) body -= gap;
    const h2 = 36 + 24 + Math.max(body, 12);
    return { w: w2, h: Math.max(h2, dens.nodeW >= 200 ? 100 : 84) };
  }
  if (preset === "title") {
    w *= 1.2;
    h *= 1.2;
  } else if (preset === "decision") {
    w *= 1.1;
    h *= 1.15;
  } else if (preset === "note") {
    h *= 1.15;
  }
  if (node.imageUrl) {
    w = Math.max(w, dens.nodeW * 1.2);
    h += dens.nodeH * 1.7;
  }
  return { w, h };
}
function buildAdj2(edges) {
  const hierarchy = /* @__PURE__ */ new Map();
  const relation = /* @__PURE__ */ new Map();
  const addH = (from, to, primaryTo, order2) => {
    const list = hierarchy.get(from) ?? [];
    list.push({ other: to, primaryTo, order: order2 });
    hierarchy.set(from, list);
  };
  const addR = (a, b) => {
    const la = relation.get(a) ?? [];
    la.push(b);
    relation.set(a, la);
  };
  for (const e of edges) {
    if (e.deletedAt) continue;
    if (e.kind === "hierarchy") {
      addH(e.from, e.to, e.isPrimaryParent, e.order);
      addH(e.to, e.from, false, e.order);
    } else if (e.kind === "relation") {
      addR(e.from, e.to);
      addR(e.to, e.from);
    }
  }
  for (const [, list] of hierarchy) {
    list.sort((a, b) => {
      if (a.primaryTo !== b.primaryTo) return a.primaryTo ? -1 : 1;
      return a.order - b.order;
    });
  }
  return { hierarchy, relation };
}
function nodesHiddenByCollapse(nodes, edges) {
  const children = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy") continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  const hidden = /* @__PURE__ */ new Set();
  const queue = [];
  for (const n of nodes) {
    if (n.deletedAt || !n.collapsed) continue;
    for (const c of children.get(n.id) ?? []) queue.push(c);
  }
  while (queue.length) {
    const id = queue.shift();
    if (hidden.has(id)) continue;
    hidden.add(id);
    for (const c of children.get(id) ?? []) queue.push(c);
  }
  return hidden;
}
function spanningChildren(focusId, adj, nodesById, hidden) {
  const children = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set([focusId]);
  const queue = [focusId];
  const tryEnqueue = (other, kids) => {
    if (seen.has(other) || hidden.has(other)) return;
    const node = nodesById.get(other);
    if (!node || node.deletedAt) return;
    seen.add(other);
    kids.push(other);
    queue.push(other);
  };
  while (queue.length) {
    const cur = queue.shift();
    const curNode = nodesById.get(cur);
    if (curNode?.collapsed) continue;
    const kids = [];
    for (const n of adj.hierarchy.get(cur) ?? []) tryEnqueue(n.other, kids);
    for (const other of adj.relation.get(cur) ?? []) tryEnqueue(other, kids);
    if (kids.length) children.set(cur, kids);
  }
  return children;
}
function assignSides(focusId, nodesById, children) {
  const sideOf = /* @__PURE__ */ new Map();
  let left = 0;
  let right = 0;
  for (const id of children.get(focusId) ?? []) {
    const node = nodesById.get(id);
    if (!node || node.deletedAt) continue;
    let side;
    if (node.sidePref === -1) side = -1;
    else if (node.sidePref === 1) side = 1;
    else side = left <= right ? -1 : 1;
    sideOf.set(id, side);
    if (side === -1) left++;
    else right++;
  }
  return sideOf;
}
function buildSubtree(id, nodesById, children, dens, path3, asCard, childFilter) {
  if (path3.has(id)) return null;
  const node = nodesById.get(id);
  if (!node || node.deletedAt) return null;
  const nextPath = new Set(path3);
  nextPath.add(id);
  const kids = [];
  if (!node.collapsed) {
    for (const cid of children.get(id) ?? []) {
      if (childFilter && !childFilter(cid)) continue;
      const child = buildSubtree(
        cid,
        nodesById,
        children,
        dens,
        nextPath,
        asCard
      );
      if (child) kids.push(child);
    }
  }
  const box = nodeLayoutSize(node, dens, { asCard });
  return {
    id,
    // flextree size = full box + gutters (claim real space, not a rigid grid cell)
    size: [box.w + dens.gapX, box.h + dens.gapY],
    children: kids.length ? kids : void 0
  };
}
function layoutSideTree(tree, dens, side, positions) {
  const lay = (0, import_d3_flextree.flextree)().children((d) => d.children ?? null).nodeSize((d) => {
    const [boxW, boxH] = d.data.size;
    return [boxH, boxW];
  }).spacing(() => dens.gapY * 0.5);
  const root = lay.hierarchy(tree);
  lay(root);
  root.each((d) => {
    if (d.depth === 0) return;
    const data = d.data;
    positions[data.id] = {
      x: side * d.y,
      y: d.x
    };
  });
}
function resolveOverlaps(positions, sizes, fixed, pad, iterations = 60, active) {
  const ids = Object.keys(positions).filter((id) => sizes.has(id));
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i];
      const pa = positions[a];
      const sa = sizes.get(a);
      const aw = sa.w / 2 + pad;
      const ah = sa.h / 2 + pad;
      for (let j = i + 1; j < ids.length; j++) {
        const b = ids[j];
        if (active && !active.has(a) && !active.has(b)) continue;
        const pb = positions[b];
        const sb = sizes.get(b);
        const bw = sb.w / 2 + pad;
        const bh = sb.h / 2 + pad;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const ox = aw + bw - Math.abs(dx);
        const oy = ah + bh - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        const aFixed = fixed.has(a);
        const bFixed = fixed.has(b);
        if (aFixed && bFixed) continue;
        if (ox < oy) {
          const push = ox / 2 * (dx === 0 ? a < b ? 1 : -1 : Math.sign(dx) || 1);
          if (!aFixed && !bFixed) {
            pa.x -= push;
            pb.x += push;
          } else if (aFixed) {
            pb.x += push * 2;
          } else {
            pa.x -= push * 2;
          }
        } else {
          const push = oy / 2 * (dy === 0 ? a < b ? 1 : -1 : Math.sign(dy) || 1);
          if (!aFixed && !bFixed) {
            pa.y -= push;
            pb.y += push;
          } else if (aFixed) {
            pb.y += push * 2;
          } else {
            pa.y -= push * 2;
          }
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
}
function hierarchyFingerprint(edges) {
  const parts = [];
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy") continue;
    parts.push(
      `${e.from}>${e.to}:${e.isPrimaryParent ? 1 : 0}:${e.order}`
    );
  }
  parts.sort();
  return parts.join("|");
}
function layout(input) {
  const dens = DENSITY[input.density ?? "comfortable"];
  const asCard = input.nodeViewMode === "card";
  const nodesById = new Map(input.nodes.map((n) => [n.id, n]));
  if (!nodesById.has(input.focusNodeId)) return {};
  const hidden = nodesHiddenByCollapse(input.nodes, input.edges);
  hidden.delete(input.focusNodeId);
  const sizes = /* @__PURE__ */ new Map();
  for (const n of input.nodes) {
    if (n.deletedAt || hidden.has(n.id)) continue;
    sizes.set(n.id, nodeLayoutSize(n, dens, { asCard }));
  }
  const prev = input.prevPositions;
  const fp = hierarchyFingerprint(input.edges);
  const structureUnchanged = !input.structureChanged && Boolean(prev) && Boolean(input.prevHierarchyFp) && input.prevHierarchyFp === fp;
  const canReusePrev = structureUnchanged && input.nodes.some((n) => !n.deletedAt && !hidden.has(n.id) && prev[n.id]);
  if (canReusePrev && prev) {
    const positions2 = {};
    for (const n of input.nodes) {
      if (n.deletedAt || hidden.has(n.id)) continue;
      const p = prev[n.id];
      if (p) positions2[n.id] = { ...p };
    }
    const fixed2 = /* @__PURE__ */ new Set();
    const active = /* @__PURE__ */ new Set();
    for (const n of input.nodes) {
      if (hidden.has(n.id) || n.deletedAt) continue;
      if (!n.pinned) continue;
      const pinPos = n.pos ?? prev[n.id];
      if (!pinPos) continue;
      const before = positions2[n.id];
      positions2[n.id] = { ...pinPos };
      fixed2.add(n.id);
      if (!before || Math.abs(before.x - pinPos.x) > 0.5 || Math.abs(before.y - pinPos.y) > 0.5) {
        active.add(n.id);
      }
    }
    const focus = nodesById.get(input.focusNodeId);
    if (!(focus?.pinned && positions2[input.focusNodeId])) {
      positions2[input.focusNodeId] = { x: 0, y: 0 };
      fixed2.add(input.focusNodeId);
    } else {
      fixed2.add(input.focusNodeId);
    }
    const orphans2 = input.nodes.filter(
      (n) => !n.deletedAt && !hidden.has(n.id) && !positions2[n.id]
    );
    orphans2.forEach((n, i) => {
      const angle = i / Math.max(1, orphans2.length) * Math.PI * 2;
      const r = dens.nodeW + dens.gapX * 2;
      positions2[n.id] = {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      };
      active.add(n.id);
    });
    if (active.size) {
      resolveOverlaps(positions2, sizes, fixed2, dens.pad, 24, active);
      if (!(focus?.pinned && positions2[input.focusNodeId])) {
        positions2[input.focusNodeId] = { x: 0, y: 0 };
      }
      resolveOverlaps(positions2, sizes, fixed2, dens.pad, 12, active);
    } else if (!(focus?.pinned && positions2[input.focusNodeId])) {
      positions2[input.focusNodeId] = { x: 0, y: 0 };
    }
    for (const id of hidden) delete positions2[id];
    return positions2;
  }
  const adj = buildAdj2(input.edges);
  const children = spanningChildren(input.focusNodeId, adj, nodesById, hidden);
  const sideOf = assignSides(input.focusNodeId, nodesById, children);
  const positions = {
    [input.focusNodeId]: { x: 0, y: 0 }
  };
  for (const side of [-1, 1]) {
    const tree = buildSubtree(
      input.focusNodeId,
      nodesById,
      children,
      dens,
      /* @__PURE__ */ new Set(),
      asCard,
      (childId) => sideOf.get(childId) === side
    );
    if (!tree?.children?.length) continue;
    layoutSideTree(tree, dens, side, positions);
  }
  positions[input.focusNodeId] = { x: 0, y: 0 };
  if (prev) {
    for (const [id, p] of Object.entries(prev)) {
      if (hidden.has(id) || id === input.focusNodeId) continue;
      if (!positions[id]) continue;
      const node = nodesById.get(id);
      if (node?.pinned) continue;
      const sug = positions[id];
      const dist = Math.hypot(p.x - sug.x, p.y - sug.y);
      if (dist < dens.nodeW * 4) {
        positions[id] = { ...p };
      }
    }
  }
  const fixed = /* @__PURE__ */ new Set();
  for (const n of input.nodes) {
    if (hidden.has(n.id) || n.deletedAt) continue;
    if (!n.pinned) continue;
    const pinPos = n.pos ?? prev?.[n.id] ?? positions[n.id];
    if (!pinPos) continue;
    positions[n.id] = { ...pinPos };
    fixed.add(n.id);
  }
  const focusNode = nodesById.get(input.focusNodeId);
  if (!(focusNode?.pinned && positions[input.focusNodeId])) {
    positions[input.focusNodeId] = { x: 0, y: 0 };
  }
  fixed.add(input.focusNodeId);
  const placed = new Set(Object.keys(positions));
  const orphans = input.nodes.filter(
    (n) => !n.deletedAt && !hidden.has(n.id) && !placed.has(n.id)
  );
  orphans.forEach((n, i) => {
    if (prev?.[n.id]) {
      positions[n.id] = { ...prev[n.id] };
      return;
    }
    const angle = i / Math.max(1, orphans.length) * Math.PI * 2;
    const r = dens.nodeW + dens.gapX * 2 + Math.floor(i / 8) * dens.nodeW;
    positions[n.id] = {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    };
  });
  resolveOverlaps(positions, sizes, fixed, dens.pad);
  if (!(focusNode?.pinned && (focusNode.pos || prev?.[focusNode.id]))) {
    positions[input.focusNodeId] = { x: 0, y: 0 };
  }
  resolveOverlaps(positions, sizes, fixed, dens.pad, 20);
  for (const id of hidden) delete positions[id];
  return positions;
}

// apps/server/src/tools.ts
var activityByCanvas = /* @__PURE__ */ new Map();
function prepareOps(store, canvasId, rawOps) {
  if (!Array.isArray(rawOps)) {
    const parsed2 = parseOps(rawOps);
    return parsed2.ok ? { ok: true, ops: parsed2.ops, nodeIdMap: {} } : parsed2;
  }
  const g = store.loadCanvas(canvasId);
  const resolved = resolveWireOps(
    rawOps,
    [...g.nodes.values()],
    {
      anchorId: g.canvas.anchorNodeId ?? null,
      edges: [...g.edges.values()]
    }
  );
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      message: resolved.message,
      candidates: resolved.candidates,
      validTypes: OP_TYPES
    };
  }
  const parsed = parseOps(resolved.ops);
  if (!parsed.ok) return parsed;
  return { ok: true, ops: parsed.ops, nodeIdMap: resolved.nodeIdMap };
}
function parseSearchScope(raw2) {
  const v = String(raw2 ?? "text");
  if (v === "note" || v === "tags" || v === "all" || v === "text" || v === "description" || v === "edge_label" || v === "edge_note")
    return v;
  return "text";
}
function findVisibleHits(store, canvasId, query, scope, limit = 20) {
  const view = publicGraphView(store, canvasId);
  const visible = new Set(view.nodes.map((n) => n.id));
  const hits = store.search(canvasId, query, limit, scope).filter((h) => {
    if (h.kind === "edge") {
      return visible.has(h.from) && visible.has(h.to) && h.from !== view.anchorId && h.to !== view.anchorId;
    }
    return h.id !== view.anchorId && visible.has(h.id);
  });
  const ambiguous = hits.length > 1 && hits[0].score - (hits[1]?.score ?? 0) < 0.15;
  return { view, hits, ambiguous };
}
function candidateFromHit(h) {
  if (h.kind === "edge") {
    return {
      kind: "edge",
      edgeId: h.id,
      from: h.from,
      to: h.to,
      fromText: h.fromText,
      toText: h.toText,
      label: h.label,
      note: h.note,
      score: h.score,
      matchIn: h.matchIn
    };
  }
  return {
    kind: "node",
    id: h.id,
    text: h.text,
    score: h.score,
    matchIn: h.matchIn
  };
}
function exportMarkdown(nodes, edges, title, anchorId) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy" || !e.isPrimaryParent) continue;
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  for (const [from, list] of children) {
    list.sort((a, b) => {
      const oa = edges.find(
        (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.from === from && e.to === a && !e.deletedAt
      )?.order ?? 0;
      const ob = edges.find(
        (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.from === from && e.to === b && !e.deletedAt
      )?.order ?? 0;
      return oa - ob;
    });
  }
  const lines = [`# ${title}`, ""];
  const walk = (id, depth, path3) => {
    if (path3.has(id)) return;
    const n = byId.get(id);
    if (!n || n.deletedAt) return;
    const next = new Set(path3);
    next.add(id);
    if (id !== anchorId) {
      const pad = "  ".repeat(Math.max(0, depth));
      const icon = n.icon ? `[${n.icon}] ` : "";
      lines.push(`${pad}- ${icon}${n.text}`);
      if (n.note?.trim()) lines.push(`${pad}  > ${n.note.trim()}`);
      if (n.tags?.length) lines.push(`${pad}  tags: ${n.tags.join(", ")}`);
    }
    for (const cid of children.get(id) ?? []) {
      walk(cid, id === anchorId ? 0 : depth + 1, next);
    }
  };
  const roots = anchorId && children.get(anchorId)?.length ? children.get(anchorId) : nodes.filter((n) => !n.deletedAt && n.id !== anchorId).filter(
    (n) => !edges.some(
      (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.to === n.id && !e.deletedAt
    )
  ).map((n) => n.id);
  if (anchorId) walk(anchorId, 0, /* @__PURE__ */ new Set());
  else for (const id of roots) walk(id, 0, /* @__PURE__ */ new Set());
  const relations = edges.filter(
    (e) => e.kind === "relation" && !e.deletedAt && byId.has(e.from) && byId.has(e.to)
  );
  if (relations.length) {
    lines.push("", "## Relations", "");
    for (const e of relations) {
      const a = byId.get(e.from)?.text ?? e.from;
      const b = byId.get(e.to)?.text ?? e.to;
      const label = e.label ? ` (${e.label})` : "";
      lines.push(`- ${a} \u2192 ${b}${label}`);
    }
  }
  return `${lines.join("\n")}
`;
}
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function exportSvg(nodes, edges, positions, title, anchorId) {
  const visible = nodes.filter(
    (n) => !n.deletedAt && n.id !== anchorId && positions[n.id]
  );
  if (!visible.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><text x="20" y="40">${escapeXml(title)} (empty)</text></svg>`;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const boxW = 160;
  const boxH = 40;
  for (const n of visible) {
    const p = positions[n.id];
    minX = Math.min(minX, p.x - boxW / 2);
    maxX = Math.max(maxX, p.x + boxW / 2);
    minY = Math.min(minY, p.y - boxH / 2);
    maxY = Math.max(maxY, p.y + boxH / 2);
  }
  const pad = 48;
  const width = Math.ceil(maxX - minX + pad * 2);
  const height = Math.ceil(maxY - minY + pad * 2);
  const tx = (x) => x - minX + pad;
  const ty = (y) => y - minY + pad;
  const byId = new Set(visible.map((n) => n.id));
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#5e6ad2"/>
  </marker>
</defs>`,
    `<rect width="100%" height="100%" fill="#0f1117"/>`,
    `<text x="${pad}" y="28" fill="#a5adb8" font-size="14" font-family="sans-serif">${escapeXml(title)}</text>`
  ];
  for (const e of edges) {
    if (e.deletedAt || !byId.has(e.from) || !byId.has(e.to)) continue;
    const a = positions[e.from];
    const b = positions[e.to];
    const dash = e.lineStyle === "dotted" ? ' stroke-dasharray="2 4"' : e.kind === "relation" || e.lineStyle === "dashed" ? ' stroke-dasharray="6 4"' : "";
    const dir = e.direction ?? (e.kind === "relation" ? "forward" : "none");
    const markerEnd = dir === "forward" || dir === "both" ? ' marker-end="url(#arrow)"' : "";
    const markerStart = dir === "both" ? ' marker-start="url(#arrow)"' : "";
    parts.push(
      `<path d="M ${tx(a.x)} ${ty(a.y)} C ${tx((a.x + b.x) / 2)} ${ty(a.y)}, ${tx((a.x + b.x) / 2)} ${ty(b.y)}, ${tx(b.x)} ${ty(b.y)}" fill="none" stroke="#5e6ad2" stroke-width="${1.2 + ((e.weight ?? 1) - 1) * 0.6}"${dash}${markerEnd}${markerStart}/>`
    );
    if (e.label) {
      parts.push(
        `<text x="${tx((a.x + b.x) / 2)}" y="${ty((a.y + b.y) / 2) - 6}" fill="#7b838f" font-size="11" text-anchor="middle" font-family="sans-serif">${escapeXml(e.label)}</text>`
      );
    }
  }
  for (const n of visible) {
    const p = positions[n.id];
    const x = tx(p.x) - boxW / 2;
    const y = ty(p.y) - boxH / 2;
    const fill = n.accentColor ?? "#1b1e28";
    const label = n.text.slice(0, 18);
    parts.push(
      `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="10" fill="${escapeXml(fill)}" stroke="#5e6ad2" stroke-width="1.5"/>`,
      `<text x="${tx(p.x)}" y="${ty(p.y) + 4}" fill="#f4f5f7" font-size="12" text-anchor="middle" font-family="sans-serif">${escapeXml(label)}</text>`
    );
  }
  parts.push(`</svg>`);
  return parts.join("\n");
}
function setActivity(a) {
  activityByCanvas.set(a.canvasId, { ...a, updatedAt: now() });
}
function getActivity(canvasId) {
  return activityByCanvas.get(canvasId) ?? null;
}
var proposals = /* @__PURE__ */ new Map();
function listProposals(canvasId) {
  return [...proposals.values()].filter((p) => p.canvasId === canvasId).sort((a, b) => b.updatedAt - a.updatedAt);
}
function getProposal(id) {
  return proposals.get(id);
}
function createProposal(canvasId, baseRev, ops, rationale) {
  const id = newId2("p");
  const t = now();
  const rec = {
    id,
    canvasId,
    baseRev,
    rationale,
    status: "pending",
    revision: 1,
    ops,
    createdAt: t,
    updatedAt: t
  };
  proposals.set(id, rec);
  return rec;
}
function reviseProposal(id, ops, rationale) {
  const p = proposals.get(id);
  if (!p || p.status !== "pending") throw new Error("proposal not pending");
  p.ops = ops;
  p.rationale = rationale;
  p.revision += 1;
  p.updatedAt = now();
  return p;
}
function rejectProposal(id) {
  const p = proposals.get(id);
  if (!p) throw new Error("not found");
  p.status = "rejected";
  p.updatedAt = now();
  return p;
}
var HIGH_RISK = /* @__PURE__ */ new Set(["delete_node", "move_node", "set_primary_parent"]);
function isHighRisk(op) {
  return HIGH_RISK.has(op.type);
}
var layoutCache = /* @__PURE__ */ new Map();
function withLayout(store, canvasId) {
  const snap = store.getSnapshot(canvasId);
  const anchorId = snap.canvas.anchorNodeId ?? null;
  const layoutRoot = (anchorId && snap.nodes.some((n) => n.id === anchorId && !n.deletedAt) ? anchorId : null) ?? snap.canvas.focusNodeId ?? snap.nodes.find((n) => !n.deletedAt)?.id;
  const cached = layoutCache.get(canvasId);
  const density = snap.canvas.prefs.density;
  const nodeViewMode = snap.canvas.prefs.nodeViewMode ?? "card";
  const viewChanged = Boolean(cached) && (cached.density !== density || cached.nodeViewMode !== nodeViewMode);
  const positions = layoutRoot ? layout({
    nodes: snap.nodes,
    edges: snap.edges,
    focusNodeId: layoutRoot,
    density,
    nodeViewMode,
    prevPositions: cached?.positions,
    prevHierarchyFp: cached?.hierarchyFp,
    structureChanged: viewChanged
  }) : {};
  if (layoutRoot) {
    layoutCache.set(canvasId, {
      positions: { ...positions },
      hierarchyFp: hierarchyFingerprint(snap.edges),
      density,
      nodeViewMode
    });
  }
  return { snap, positions, anchorId };
}
function finalizeAutoFit(store, canvasId, padding = 50) {
  layoutCache.delete(canvasId);
  const { positions, anchorId } = withLayout(store, canvasId);
  const publicPositions2 = { ...positions };
  if (anchorId) delete publicPositions2[anchorId];
  const viewport = computeFitViewport(publicPositions2, { padding });
  store.updateViewport(canvasId, viewport);
  return viewport;
}
function estimateOverlaps(nodes, positions, nodeViewMode, anchorId) {
  const w = nodeViewMode === "card" ? 180 : 120;
  const h = nodeViewMode === "card" ? 72 : 36;
  const ids = nodes.filter((n) => !n.deletedAt && n.id !== anchorId && positions[n.id]).map((n) => n.id);
  const pairs = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const pa = positions[a];
      const pb = positions[b];
      const dx = Math.abs(pa.x - pb.x);
      const dy = Math.abs(pa.y - pb.y);
      if (dx < w && dy < h) {
        pairs.push({ a, b, dx, dy });
      }
    }
  }
  return pairs.slice(0, 40);
}
function layoutGraphPreview(_store, canvasId, graph) {
  const snap = toSnapshot(graph);
  const cached = layoutCache.get(canvasId);
  const anchorId = snap.canvas.anchorNodeId ?? null;
  const layoutRoot = (anchorId && snap.nodes.some((n) => n.id === anchorId && !n.deletedAt) ? anchorId : null) ?? snap.canvas.focusNodeId ?? snap.nodes.find((n) => !n.deletedAt)?.id;
  const density = snap.canvas.prefs.density;
  const nodeViewMode = snap.canvas.prefs.nodeViewMode ?? "card";
  const positions = layoutRoot ? layout({
    nodes: snap.nodes,
    edges: snap.edges,
    focusNodeId: layoutRoot,
    density,
    nodeViewMode,
    prevPositions: cached?.positions,
    prevHierarchyFp: cached?.hierarchyFp,
    structureChanged: true
  }) : {};
  return {
    snap,
    positions,
    anchorId,
    overlaps: estimateOverlaps(snap.nodes, positions, nodeViewMode, anchorId)
  };
}
function isPublicNode(n, anchorId) {
  return !n.deletedAt && n.id !== anchorId;
}
function publicGraphView(store, canvasId) {
  const { snap, positions, anchorId } = withLayout(store, canvasId);
  const nodes = snap.nodes.filter(
    (n) => isPublicNode(n, anchorId) && positions[n.id] != null
  );
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = snap.edges.filter(
    (e) => !e.deletedAt && e.from !== anchorId && e.to !== anchorId && nodeIds.has(e.from) && nodeIds.has(e.to)
  );
  const publicFocus = snap.canvas.focusNodeId && snap.canvas.focusNodeId !== anchorId ? snap.canvas.focusNodeId : nodes[0]?.id ?? null;
  return {
    snap,
    anchorId,
    nodes,
    edges,
    positions,
    publicFocus,
    canvas: {
      id: snap.canvas.id,
      title: snap.canvas.title,
      rev: snap.canvas.rev,
      focusNodeId: publicFocus,
      prefs: snap.canvas.prefs,
      agentMode: snap.canvas.agentMode
    }
  };
}
function buildSpatialContext(store, canvasId, opts) {
  const activity = getActivity(canvasId);
  const view = publicGraphView(store, canvasId);
  const { snap, positions, anchorId, nodes, edges } = view;
  const compact = opts?.compact !== false;
  let focusId = activity?.focusNodeId && activity.focusNodeId !== anchorId ? activity.focusNodeId : view.publicFocus;
  const selection = (activity?.selectionIds?.length ? activity.selectionIds.filter((id) => id !== anchorId) : focusId ? [focusId] : []).map((id) => nodes.find((n) => n.id === id)).filter(Boolean).map((n) => ({ id: n.id, text: n.text }));
  const vp = activity?.viewport ?? snap.canvas.viewport;
  const ranked = nodes.map((n) => {
    const p = positions[n.id] ?? { x: 0, y: 0 };
    const dx = p.x - (vp.x || 0);
    const dy = p.y - (vp.y || 0);
    return { n, d: dx * dx + dy * dy };
  }).sort((a, b) => a.d - b.d).slice(0, compact ? 60 : 80).map(({ n }) => {
    const base = {
      id: n.id,
      text: n.text,
      collapsed: n.collapsed || void 0,
      childCount: n.collapsed ? 0 : edges.filter(
        (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.from === n.id
      ).length,
      collapsedChildCount: n.collapsed ? edges.filter(
        (e) => e.kind === "hierarchy" && e.from === n.id
      ).length : void 0
    };
    if (n.alias) base.alias = n.alias;
    const fn = nodeFunction(n);
    if (fn) base.function = fn;
    return base;
  });
  const topIds = new Set(ranked.map((r) => r.id));
  const topLevelParent = anchorId;
  const periphery = snap.edges.filter(
    (e) => e.kind === "hierarchy" && e.isPrimaryParent && !e.deletedAt && e.from === topLevelParent && !topIds.has(e.to)
  ).slice(0, 12).map((e) => {
    const node = nodes.find((n) => n.id === e.to);
    const count = edges.filter(
      (x) => x.kind === "hierarchy" && x.isPrimaryParent && x.from === e.to
    ).length;
    return {
      clusterId: e.to,
      title: node?.text ?? e.to,
      nodeCount: count + 1
    };
  });
  const rankedIds = new Set(ranked.map((r) => r.id));
  const visibleEdges = edges.filter((e) => rankedIds.has(e.from) || rankedIds.has(e.to)).slice(0, compact ? 100 : 120).map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    label: e.label ?? null,
    isPrimaryParent: e.kind === "hierarchy" ? e.isPrimaryParent : void 0
  }));
  return {
    canvasId,
    rev: snap.canvas.rev,
    title: snap.canvas.title,
    focusId,
    agentMode: snap.canvas.agentMode,
    riskProfile: snap.canvas.prefs.riskProfile,
    compact,
    selection,
    viewport: {
      nodes: ranked,
      edgesHint: edges.length,
      edges: visibleEdges
    },
    periphery,
    rootAnchor: {
      visible: false,
      id: null,
      note: "No visible root. Do not search for a root node id. Top-level: omit parentId."
    },
    hint: "Top-level nodes: omit parentId (or parentId:null). There is no visible root node. Edge ids are in viewport.edges[].id for set_edge_label.",
    qaHint: "For graph Q&A use mindmap_query (neighbors|path|stats|orphans|missing_meta). mindmap_get_node / mindmap_get_edge for details; mindmap_highlight to flash path. Never invent facts not returned by tools.",
    pendingProposals: listProposals(canvasId).filter((p) => p.status === "pending").map((p) => ({ id: p.id, summary: p.rationale, opCount: p.ops.length }))
  };
}
function clientCanvasPayload(store, canvasId) {
  const view = publicGraphView(store, canvasId);
  return {
    canvas: view.canvas,
    nodes: view.nodes,
    edges: view.edges,
    positions: publicPositions(view.positions, view.anchorId)
  };
}
function publicPositions(positions, anchorId) {
  if (!anchorId) return { ...positions };
  const out = {};
  for (const [id, p] of Object.entries(positions)) {
    if (id !== anchorId) out[id] = p;
  }
  return out;
}
async function runTool(name17, rawArgs, ctx) {
  const canvasId = rawArgs.canvasId ?? ctx.defaultCanvasId;
  const noCanvasOk = /* @__PURE__ */ new Set([
    "mindmap_list_canvases",
    "mindmap_create_canvas",
    "mindmap_open_canvas",
    "mindmap_get_schema"
  ]);
  if (!canvasId && !noCanvasOk.has(name17)) {
    return {
      ok: false,
      error: "no_active_canvas",
      message: "No active canvas. Call mindmap_create_canvas or mindmap_open_canvas first (or pass canvasId). Query/find tools will open the \u601D\u7EF4\u5BFC\u56FE tab automatically."
    };
  }
  switch (name17) {
    case "mindmap_list_canvases":
      return {
        ok: true,
        canvases: ctx.store.listCanvases().map((c) => ({
          id: c.id,
          title: c.title,
          rev: c.rev
        }))
      };
    case "mindmap_create_canvas": {
      const title = String(rawArgs.title || "\u672A\u547D\u540D\u753B\u5E03");
      const rootText = rawArgs.rootText != null && String(rawArgs.rootText).trim() ? String(rawArgs.rootText) : void 0;
      const g = ctx.store.createCanvas(title, rootText);
      return {
        ok: true,
        canvas: { id: g.canvas.id, title: g.canvas.title, rev: g.canvas.rev },
        hint: "Canvas is empty visually. Create top-level nodes with {type:'create_node', text:'...'} (omit parentId). Use parentId only when nesting under an existing visible node."
      };
    }
    case "mindmap_open_canvas": {
      const id = String(rawArgs.canvasId || canvasId || "");
      if (!id) {
        return { ok: false, error: "canvasId_required", message: "canvasId required" };
      }
      try {
        const snap = ctx.store.getSnapshot(id);
        return {
          ok: true,
          canvas: { id: snap.canvas.id, title: snap.canvas.title, rev: snap.canvas.rev }
        };
      } catch {
        return { ok: false, error: "not_found", message: `canvas ${id} not found` };
      }
    }
    case "mindmap_delete_canvas": {
      ctx.store.hardDeleteCanvas(canvasId);
      return { ok: true, deleted: canvasId };
    }
    case "mindmap_get_context":
    case "mindmap_get_spatial_context": {
      const compact = rawArgs.compact === void 0 ? true : rawArgs.compact === true || String(rawArgs.compact) === "true";
      return {
        ok: true,
        ...buildSpatialContext(ctx.store, canvasId, { compact })
      };
    }
    case "mindmap_get_subgraph": {
      const view = publicGraphView(ctx.store, canvasId);
      const rootToken = rawArgs.rootId ?? rawArgs.root;
      let rootId;
      if (rootToken) {
        const resolved = resolveQueryNodeRef(view.nodes, String(rootToken), {
          anchorId: view.anchorId
        });
        if (!resolved.ok) {
          return {
            ok: false,
            error: resolved.error,
            message: resolved.message,
            candidates: "candidates" in resolved ? resolved.candidates : void 0
          };
        }
        rootId = resolved.id;
      } else {
        rootId = (getActivity(canvasId)?.focusNodeId !== view.anchorId ? getActivity(canvasId)?.focusNodeId : void 0) ?? view.publicFocus ?? void 0;
      }
      const depth = Math.min(3, Number(rawArgs.depth ?? 2));
      const edgeKindsRaw = String(rawArgs.edgeKinds ?? "hierarchy");
      const edgeKinds = edgeKindsRaw === "relation" || edgeKindsRaw === "all" ? edgeKindsRaw : "hierarchy";
      if (!rootId || rootId === view.anchorId) {
        return {
          ok: true,
          edgeKinds,
          nodes: view.nodes.slice(0, 40),
          edges: view.edges.filter(
            (e) => view.nodes.slice(0, 40).some((n) => n.id === e.from) && view.nodes.slice(0, 40).some((n) => n.id === e.to)
          ),
          hint: "No rootId; returned top visible nodes. Pass rootId (id|@alias|title). edgeKinds: hierarchy (default) | relation | all."
        };
      }
      const walkEdges = view.edges.filter((e) => {
        if (edgeKinds === "all") return true;
        return e.kind === edgeKinds;
      });
      const keep = /* @__PURE__ */ new Set([rootId]);
      let frontier = [rootId];
      for (let d = 0; d < depth; d++) {
        const next = [];
        for (const id of frontier) {
          for (const e of walkEdges) {
            let neighbor = null;
            if (edgeKinds === "hierarchy") {
              if (e.isPrimaryParent && e.from === id) neighbor = e.to;
            } else {
              if (e.from === id) neighbor = e.to;
              else if (e.to === id) neighbor = e.from;
            }
            if (!neighbor || keep.has(neighbor)) continue;
            keep.add(neighbor);
            next.push(neighbor);
          }
        }
        frontier = next;
      }
      if (keep.size > 150) {
        return {
          ok: false,
          error: "budget_exceeded",
          skeleton: {
            rootId,
            edgeKinds,
            nodeCount: keep.size,
            hint: "\u7F29\u5C0F depth \u6216\u5148 mindmap_find\uFF1B\u5173\u7CFB\u7F51\u53EF\u7528 edgeKinds:'relation' + depth:1"
          }
        };
      }
      const nodes = view.nodes.filter((n) => keep.has(n.id));
      const edges = walkEdges.filter(
        (e) => keep.has(e.from) && keep.has(e.to)
      );
      const hint = nodes.length <= 1 && edges.length === 0 && edgeKinds === "hierarchy" ? "No hierarchy children under this root. For relation networks pass edgeKinds:'relation' or 'all' (same as mindmap_query)." : void 0;
      return {
        ok: true,
        rootId,
        edgeKinds,
        depth,
        nodes,
        edges,
        ...hint ? { hint } : {}
      };
    }
    case "mindmap_find": {
      const query = String(rawArgs.query ?? "");
      const scope = parseSearchScope(rawArgs.searchScope ?? rawArgs.scope);
      const { hits, ambiguous } = findVisibleHits(
        ctx.store,
        canvasId,
        query,
        scope
      );
      return {
        ok: true,
        searchScope: scope,
        ambiguous,
        candidates: hits.map(candidateFromHit),
        quickActions: hits.slice(0, 8).map((h, index) => {
          if (h.kind === "edge") {
            return {
              index,
              action: "highlight",
              edgeId: h.id,
              tool: "mindmap_highlight",
              args: {
                canvasId,
                nodeIds: [h.from, h.to],
                edgeIds: [h.id]
              }
            };
          }
          return {
            index,
            action: "focus",
            nodeId: h.id,
            tool: "mindmap_focus",
            args: { nodeId: h.id, canvasId }
          };
        }),
        message: ambiguous ? "\u591A\u4E2A\u5019\u9009\u63A5\u8FD1\uFF0C\u8BF7\u5411\u7528\u6237\u786E\u8BA4\u540E\u518D\u6539\uFF0C\u7981\u6B62\u81EA\u884C\u6311\u9009\u3002\u786E\u8BA4\u540E\u76F4\u63A5 mindmap_focus({nodeId}) \u6216 mindmap_highlight\uFF08\u8FB9\uFF09\uFF0C\u53EF\u7528 quickActions[i].args" : hits.length === 0 ? scope === "edge_label" || scope === "edge_note" ? "\u65E0\u53EF\u89C1\u8FB9\u5339\u914D" : "\u65E0\u53EF\u89C1\u5339\u914D\uFF08\u6298\u53E0\u5206\u652F\u5185\u7684\u8282\u70B9\u4E0D\u4F1A\u51FA\u73B0\u5728\u7ED3\u679C\u4E2D\uFF1B\u5148\u5C55\u5F00\u518D\u641C\uFF09" : void 0
      };
    }
    case "mindmap_find_and_focus": {
      const query = String(rawArgs.query ?? "");
      const scope = parseSearchScope(rawArgs.searchScope ?? rawArgs.scope);
      const { hits, ambiguous } = findVisibleHits(
        ctx.store,
        canvasId,
        query,
        scope
      );
      const candidates = hits.map(candidateFromHit);
      if (!hits.length) {
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          ambiguous: false,
          candidates,
          message: "\u65E0\u53EF\u89C1\u5339\u914D"
        };
      }
      if (ambiguous) {
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          ambiguous: true,
          candidates,
          message: "\u591A\u4E2A\u5019\u9009\u63A5\u8FD1\uFF0C\u672A\u81EA\u52A8\u805A\u7126\uFF1B\u8BF7\u786E\u8BA4\u540E mindmap_focus / mindmap_highlight"
        };
      }
      const top = hits[0];
      if (top.kind === "edge") {
        ctx.broadcast({
          type: "canvas/highlight",
          canvasId,
          nodeIds: [top.from, top.to],
          edgeIds: [top.id],
          ttlMs: 5e3
        });
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          highlighted: true,
          edgeId: top.id,
          nodeIds: [top.from, top.to],
          ambiguous: false,
          candidates
        };
      }
      const nodeId = top.id;
      const result = ctx.store.applyChangeSet(
        canvasId,
        [{ type: "set_focus", nodeId }],
        { origin: "ai", summary: `find_and_focus ${query}` }
      );
      ctx.broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId
      });
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds: [nodeId]
      });
      return {
        ok: true,
        searchScope: scope,
        focused: true,
        focusNodeId: nodeId,
        ambiguous: false,
        candidates
      };
    }
    case "mindmap_export": {
      const format = String(rawArgs.format ?? "json").toLowerCase();
      const snap = ctx.store.getSnapshot(canvasId);
      const laid = withLayout(ctx.store, canvasId);
      const anchorId = snap.canvas.anchorNodeId ?? null;
      const publicNodes = snap.nodes.filter(
        (n) => !n.deletedAt && n.id !== anchorId
      );
      const publicEdges = snap.edges.filter((e) => !e.deletedAt);
      if (format === "md" || format === "markdown") {
        const markdown = exportMarkdown(
          snap.nodes,
          snap.edges,
          snap.canvas.title,
          anchorId
        );
        return {
          ok: true,
          format: "md",
          title: snap.canvas.title,
          markdown,
          nodeCount: publicNodes.length,
          edgeCount: publicEdges.length
        };
      }
      if (format === "json") {
        return {
          ok: true,
          format: "json",
          canvas: {
            id: snap.canvas.id,
            title: snap.canvas.title,
            prefs: snap.canvas.prefs,
            rev: snap.canvas.rev
          },
          nodes: publicNodes,
          edges: publicEdges,
          nodeIdMap: buildNodeIdMap(publicNodes)
        };
      }
      if (format === "svg" || format === "png") {
        const svg = exportSvg(
          snap.nodes,
          snap.edges,
          laid.positions,
          snap.canvas.title,
          anchorId
        );
        return {
          ok: true,
          format: format === "png" ? "svg" : "svg",
          title: snap.canvas.title,
          mimeType: "image/svg+xml",
          svg,
          nodeCount: publicNodes.length,
          edgeCount: publicEdges.length,
          hint: format === "png" ? "Agent export returns SVG (vector). For raster PNG use the web UI\u300C\u5BFC\u51FAPNG\u300D; SVG pastes into docs/PPT as well." : "SVG can be saved as .svg or opened in browser / Office."
        };
      }
      return {
        ok: false,
        error: "invalid_op",
        message: 'format must be "json" | "md" | "svg" (png \u2192 svg for agents; UI has raster PNG)'
      };
    }
    case "mindmap_get_node": {
      const view = publicGraphView(ctx.store, canvasId);
      const token = String(rawArgs.nodeId ?? rawArgs.node ?? "");
      const resolved = resolveQueryNodeRef(view.nodes, token, {
        anchorId: view.anchorId
      });
      if (!resolved.ok) {
        return {
          ok: false,
          error: resolved.error,
          message: resolved.message,
          candidates: "candidates" in resolved ? resolved.candidates : void 0
        };
      }
      const n = view.nodes.find((x) => x.id === resolved.id);
      if (!n) {
        return { ok: false, error: "not_found", message: `node ${resolved.id}` };
      }
      const fieldsRaw = rawArgs.fields;
      const wantAll = !Array.isArray(fieldsRaw) || fieldsRaw.length === 0 || fieldsRaw.includes("all");
      const out = {
        id: n.id,
        text: n.text,
        alias: n.alias,
        function: nodeFunction(n)
      };
      if (wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("description")) {
        out.description = n.description ?? null;
      }
      if (wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("note")) {
        out.note = n.note ?? null;
      }
      if (wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("tags")) {
        out.tags = n.tags ?? [];
      }
      if (wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("links")) {
        out.links = n.links ?? [];
      }
      return {
        ok: true,
        node: out,
        citedNodeIds: [n.id],
        hint: "Use function for short answers; request fields:['description'] for full structured meta."
      };
    }
    case "mindmap_get_edge": {
      const view = publicGraphView(ctx.store, canvasId);
      const edgeId = String(rawArgs.edgeId ?? rawArgs.id ?? "").trim();
      if (!edgeId) {
        return { ok: false, error: "invalid_op", message: "edgeId required" };
      }
      const e = view.edges.find((x) => x.id === edgeId && !x.deletedAt);
      if (!e) {
        return {
          ok: false,
          error: "not_found",
          message: `edge ${edgeId} not found`
        };
      }
      const fieldsRaw = rawArgs.fields;
      const wantAll = !Array.isArray(fieldsRaw) || fieldsRaw.length === 0 || fieldsRaw.includes("all");
      const wantLabel = wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("label");
      const wantMeta = wantAll || Array.isArray(fieldsRaw) && fieldsRaw.includes("meta");
      const fromN = view.nodes.find((n) => n.id === e.from);
      const toN = view.nodes.find((n) => n.id === e.to);
      const out = {
        id: e.id,
        from: e.from,
        to: e.to,
        fromText: fromN?.text ?? e.from,
        toText: toN?.text ?? e.to,
        kind: e.kind
      };
      if (wantLabel || wantAll) out.label = e.label ?? null;
      if (wantMeta || wantAll) {
        out.direction = e.direction ?? null;
        out.weight = e.weight ?? null;
        out.lineStyle = e.lineStyle ?? null;
      }
      if (wantAll) {
        out.note = e.note ?? null;
        out.tags = e.tags ?? [];
      }
      return {
        ok: true,
        edge: out,
        citedNodeIds: [e.from, e.to],
        citedEdgeIds: [e.id]
      };
    }
    case "mindmap_highlight": {
      const view = publicGraphView(ctx.store, canvasId);
      const nodeIdsRaw = Array.isArray(rawArgs.nodeIds) ? rawArgs.nodeIds : rawArgs.nodeId != null ? [rawArgs.nodeId] : [];
      const edgeIdsRaw = Array.isArray(rawArgs.edgeIds) ? rawArgs.edgeIds : rawArgs.edgeId != null ? [rawArgs.edgeId] : [];
      const nodeIds = [];
      for (const token of nodeIdsRaw) {
        const r = resolveQueryNodeRef(view.nodes, String(token), {
          anchorId: view.anchorId
        });
        if (r.ok) nodeIds.push(r.id);
      }
      const edgeIds = [];
      for (const eid of edgeIdsRaw) {
        const id = String(eid).trim();
        const e = view.edges.find((x) => x.id === id && !x.deletedAt);
        if (!e) continue;
        edgeIds.push(e.id);
        if (!nodeIds.includes(e.from)) nodeIds.push(e.from);
        if (!nodeIds.includes(e.to)) nodeIds.push(e.to);
      }
      if (!nodeIds.length && !edgeIds.length) {
        return {
          ok: false,
          error: "invalid_op",
          message: "nodeIds and/or edgeIds required"
        };
      }
      const style = rawArgs.style && typeof rawArgs.style === "object" ? rawArgs.style : void 0;
      const ttlMs = Math.max(
        500,
        Math.min(
          6e4,
          Number(rawArgs.ttlMs ?? rawArgs.duration ?? style?.duration ?? 5e3) || 5e3
        )
      );
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds,
        edgeIds,
        style: style ? {
          nodeColor: typeof style.nodeColor === "string" ? style.nodeColor : void 0,
          nodeGlow: style.nodeGlow !== false,
          edgeWidth: typeof style.edgeWidth === "number" ? style.edgeWidth : void 0,
          edgeColor: typeof style.edgeColor === "string" ? style.edgeColor : void 0
        } : void 0,
        ttlMs
      });
      return {
        ok: true,
        nodeIds,
        edgeIds,
        ttlMs,
        hint: "Transient highlight on the open canvas; does not mutate the graph."
      };
    }
    case "mindmap_query": {
      const view = publicGraphView(ctx.store, canvasId);
      const op = String(rawArgs.op ?? rawArgs.type ?? "").trim();
      const edgeKindsRaw = String(rawArgs.edgeKinds ?? "all");
      const edgeKinds = edgeKindsRaw === "hierarchy" || edgeKindsRaw === "relation" ? edgeKindsRaw : "all";
      const directionRaw = String(rawArgs.direction ?? "out");
      const direction = directionRaw === "in" || directionRaw === "both" ? directionRaw : "out";
      const resolveOne = (token, field) => {
        if (token == null || String(token).trim() === "") {
          return {
            ok: false,
            error: "invalid_op",
            message: `${field} required`
          };
        }
        const r = resolveQueryNodeRef(view.nodes, String(token), {
          anchorId: view.anchorId
        });
        if (!r.ok) {
          return {
            ok: false,
            error: r.error,
            message: r.message,
            candidates: "candidates" in r ? r.candidates : void 0
          };
        }
        return { ok: true, id: r.id };
      };
      if (op === "stats") {
        const edgeKindsRaw2 = String(rawArgs.edgeKinds ?? "all");
        const statsEdgeKinds = edgeKindsRaw2 === "hierarchy" || edgeKindsRaw2 === "relation" ? edgeKindsRaw2 : "all";
        return {
          ok: true,
          op,
          edgeKinds: statsEdgeKinds,
          stats: queryStats({
            nodes: view.nodes,
            edges: view.edges,
            edgeKinds: statsEdgeKinds
          }),
          hint: "connectedComponents = undirected components on edgeKinds. longestPath/mostConnected use same filter. orphanNodes + orphanDef explain isolates on that subgraph; when edgeKinds=relation also returns nodesWithoutRelation (same count). islands \u2248 connectedComponents.count."
        };
      }
      if (op === "orphans") {
        const r = queryOrphans({ nodes: view.nodes, edges: view.edges });
        return {
          ok: true,
          op,
          ...r,
          empty: r.nodes.length === 0,
          message: r.nodes.length === 0 ? "No orphan nodes in the visible graph." : void 0
        };
      }
      if (op === "missing_meta") {
        const r = queryMissingMeta({ nodes: view.nodes, edges: view.edges });
        return {
          ok: true,
          op,
          ...r,
          empty: r.nodesWithoutDescription.length === 0 && r.nodesWithoutFunction.length === 0 && r.edgesWithoutLabel.length === 0,
          hint: "nodesWithoutDescription = empty/missing description. nodesWithoutFunction = description exists but no function/summary field (complementary)."
        };
      }
      if (op === "neighbors") {
        const node = resolveOne(rawArgs.node ?? rawArgs.nodeId, "node");
        if (!node.ok) return node;
        const r = queryNeighbors({
          nodes: view.nodes,
          edges: view.edges,
          nodeId: node.id,
          depth: Number(rawArgs.depth ?? 1),
          direction: String(rawArgs.direction ?? "both") === "in" ? "in" : String(rawArgs.direction ?? "both") === "out" ? "out" : "both",
          edgeKinds
        });
        return {
          ok: true,
          op,
          ...r,
          empty: r.edges.length === 0,
          message: r.edges.length === 0 ? "No neighbors found for this node with the given filters." : void 0,
          hint: "Answer only from returned nodes/edges. Optional: mindmap_highlight({ nodeIds: citedNodeIds, edgeIds }) to flash on canvas."
        };
      }
      if (op === "path" || op === "between") {
        const from = resolveOne(rawArgs.from ?? rawArgs.fromId, "from");
        if (!from.ok) return from;
        const to = resolveOne(rawArgs.to ?? rawArgs.toId, "to");
        if (!to.ok) return to;
        const throughRelationNodes = rawArgs.throughRelationNodes === void 0 ? true : rawArgs.throughRelationNodes === true || String(rawArgs.throughRelationNodes) === "true";
        const maxHops = Number(
          rawArgs.maxHops ?? rawArgs.maxDepth ?? (throughRelationNodes ? 8 : 1)
        );
        const pathDirection = rawArgs.direction != null ? direction : throughRelationNodes ? "both" : "out";
        const r = queryPaths({
          nodes: view.nodes,
          edges: view.edges,
          fromId: from.id,
          toId: to.id,
          maxHops,
          maxPaths: Number(rawArgs.maxPaths ?? 5),
          direction: pathDirection,
          edgeKinds,
          throughRelationNodes
        });
        return {
          ok: true,
          op: "path",
          from: from.id,
          to: to.id,
          direction: pathDirection,
          directionNote: pathDirection === "both" ? "Search treats edges as undirected (default when throughRelationNodes). Pass direction:'out' for forward-only." : pathDirection === "out" ? "Search follows edge from\u2192to only." : "Search follows edge to\u2192from only.",
          ...r,
          citedEdgeIds: r.edges.map((e) => e.id),
          empty: r.paths.length === 0,
          message: r.paths.length === 0 ? "No path found in the graph between these nodes (with current filters)." : r.truncated ? `Showing ${r.pathsReturned}/${r.totalPathsFound} paths (maxPaths=${r.maxPaths}; ${r.omittedPaths} omitted).` : void 0,
          hint: r.truncated ? `truncated=true: pathsReturned=${r.pathsReturned}, totalPathsFound=${r.totalPathsFound}, omittedPaths=${r.omittedPaths}, maxPaths=${r.maxPaths}. Raise maxPaths (\u226420) for more. Use paths[].edges for meta; mindmap_highlight to flash.` : "Use paths[].edges for weight/lineStyle/note (edgeLabels kept for compat). Flash with mindmap_highlight({ nodeIds: citedNodeIds, edgeIds: citedEdgeIds }). If empty, say no path \u2014 do not invent."
        };
      }
      return {
        ok: false,
        error: "invalid_op",
        message: "mindmap_query op must be one of: neighbors | path | stats | orphans | missing_meta",
        validOps: ["neighbors", "path", "stats", "orphans", "missing_meta"]
      };
    }
    case "mindmap_get_schema":
      return {
        ok: true,
        ...OP_SCHEMA_DOC,
        tools: [
          "mindmap_list_canvases",
          "mindmap_create_canvas",
          "mindmap_open_canvas",
          "mindmap_delete_canvas",
          "mindmap_get_spatial_context",
          "mindmap_find",
          "mindmap_find_and_focus",
          "mindmap_export",
          "mindmap_get_subgraph",
          "mindmap_query",
          "mindmap_get_node",
          "mindmap_get_edge",
          "mindmap_highlight",
          "mindmap_apply_direct",
          "mindmap_propose",
          "mindmap_accept_proposal",
          "mindmap_reject_proposal",
          "mindmap_focus",
          "mindmap_undo",
          "mindmap_redo",
          "mindmap_history",
          "mindmap_snapshot",
          "mindmap_restore_snapshot",
          "mindmap_get_schema"
        ],
        searchScope: [
          "text",
          "note",
          "tags",
          "description",
          "edge_label",
          "edge_note",
          "all"
        ],
        nodeIcons: [
          "server",
          "database",
          "cloud",
          "person",
          "folder",
          "doc",
          "link",
          "warning",
          "check",
          "star",
          "gear",
          "globe"
        ],
        edgeLineStyles: ["solid", "dashed", "dotted"],
        edgeDirections: ["forward", "both", "none"],
        getSubgraph: {
          rootId: "id | @alias | unique title",
          edgeKinds: {
            values: ["hierarchy", "relation", "all"],
            default: "hierarchy",
            note: "hierarchy = primary-parent children only (tree zoom). relation|all = undirected neighborhood (\u5173\u7CFB\u7F51\u7EDC). Same enum as mindmap_query."
          },
          depth: "1\u20133 (default 2)"
        }
      };
    case "mindmap_propose": {
      const prepared = prepareOps(ctx.store, canvasId, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const rationale = String(rawArgs.rationale ?? "");
      const snap = ctx.store.getSnapshot(canvasId);
      const p = createProposal(canvasId, snap.canvas.rev, prepared.ops, rationale);
      ctx.broadcast({
        type: "proposal/updated",
        canvasId,
        proposalId: p.id
      });
      return {
        ok: true,
        proposalId: p.id,
        revision: p.revision,
        ops: p.ops,
        nodeIdMap: prepared.nodeIdMap,
        rationale,
        hint: "Call mindmap_accept_proposal with this proposalId after the user confirms. Do not self-accept \u2014 proposals require explicit accept (UI or mindmap_accept_proposal)."
      };
    }
    case "mindmap_revise_proposal": {
      const proposalId = String(rawArgs.proposalId);
      const prepared = prepareOps(ctx.store, canvasId, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const rationale = String(rawArgs.rationale ?? "");
      try {
        const p = reviseProposal(proposalId, prepared.ops, rationale);
        ctx.broadcast({
          type: "proposal/updated",
          canvasId: p.canvasId,
          proposalId: p.id
        });
        return {
          ok: true,
          proposalId: p.id,
          revision: p.revision,
          nodeIdMap: prepared.nodeIdMap
        };
      } catch (e) {
        return {
          ok: false,
          error: "proposal_not_pending",
          message: String(e)
        };
      }
    }
    case "mindmap_accept_proposal": {
      const proposalId = String(rawArgs.proposalId);
      const p = getProposal(proposalId);
      if (!p) {
        return {
          ok: false,
          error: "proposal_not_found",
          message: `No proposal ${proposalId}. Proposals are in-memory \u2014 recreate with mindmap_propose if the server restarted.`
        };
      }
      if (p.status !== "pending") {
        return {
          ok: false,
          error: "proposal_not_pending",
          message: `Proposal status is ${p.status}, not pending.`,
          status: p.status
        };
      }
      const snap = ctx.store.getSnapshot(p.canvasId);
      if (snap.canvas.rev - p.baseRev > 50) {
        p.status = "stale";
        return {
          ok: false,
          error: "proposal_stale",
          message: `Canvas rev drifted (${snap.canvas.rev - p.baseRev} > 50). Re-propose against current context.`
        };
      }
      try {
        const result = ctx.store.applyChangeSet(p.canvasId, p.ops, {
          origin: "ai",
          summary: p.rationale || "accept proposal"
        });
        p.status = "accepted";
        p.updatedAt = now();
        const fitViewport = result.autoFitPadding != null ? finalizeAutoFit(ctx.store, p.canvasId, result.autoFitPadding) : null;
        const laid = withLayout(ctx.store, p.canvasId);
        const anchorId = laid.anchorId;
        ctx.broadcast({
          type: "canvas/event",
          canvasId: p.canvasId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          fitViewport: fitViewport ?? void 0
        });
        return {
          ok: true,
          changeSetId: result.changeSetId,
          affected: result.affectedNodeIds.filter((id) => id !== anchorId),
          positions: publicPositions(laid.positions, anchorId),
          fitViewport: fitViewport ?? void 0
        };
      } catch (e) {
        return {
          ok: false,
          error: "invalid_op",
          message: String(e),
          validTypes: OP_TYPES,
          hint: "Proposal kept pending. Fix ops (must use `type`) and revise or re-propose.",
          proposalId: p.id,
          status: p.status
        };
      }
    }
    case "mindmap_reject_proposal": {
      try {
        const p = rejectProposal(String(rawArgs.proposalId));
        ctx.broadcast({ type: "proposal/updated", canvasId: p.canvasId, proposalId: p.id });
        return { ok: true, status: p.status };
      } catch (e) {
        return { ok: false, error: "proposal_not_found", message: String(e) };
      }
    }
    case "mindmap_apply_direct": {
      const prepared = prepareOps(ctx.store, canvasId, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const ops = prepared.ops;
      const snap = ctx.store.getSnapshot(canvasId);
      const strict = snap.canvas.prefs.riskProfile === "strict";
      const preview = rawArgs.preview === true || rawArgs.dryRun === true || String(rawArgs.preview ?? "") === "true";
      if (strict && !preview) {
        return {
          ok: false,
          error: "permission_denied",
          message: "\u4E25\u683C\u6863\u8BF7\u7528 mindmap_propose"
        };
      }
      if (ops.some(isHighRisk) && !preview) {
        return {
          ok: false,
          error: "permission_denied",
          message: "\u9AD8\u98CE\u9669\u64CD\u4F5C\uFF08delete_node / move_node / set_primary_parent\uFF09\u8BF7\u7528 mindmap_propose",
          highRisk: [...HIGH_RISK]
        };
      }
      if (preview) {
        try {
          const g = cloneGraph(ctx.store.loadCanvas(canvasId));
          const applied = applyOps(g, ops);
          const laid = layoutGraphPreview(ctx.store, canvasId, applied.graph);
          const anchorId = laid.anchorId;
          const affectedIds = applied.affectedNodeIds.filter(
            (id) => id !== anchorId
          );
          const nodeIdMap = {
            ...prepared.nodeIdMap,
            ...buildNodeIdMap(laid.snap.nodes, {
              anchorId,
              onlyIds: new Set(affectedIds)
            })
          };
          return {
            ok: true,
            preview: true,
            nodeIdMap,
            affected: affectedIds.map((id) => {
              const n = laid.snap.nodes.find((x) => x.id === id);
              return {
                id,
                version: n?.version,
                text: n?.text,
                alias: n?.alias
              };
            }),
            positions: publicPositions(laid.positions, anchorId),
            overlaps: laid.overlaps,
            overlapCount: laid.overlaps.length,
            hint: "Dry-run only \u2014 nothing persisted. Omit preview to apply."
          };
        } catch (e) {
          return {
            ok: false,
            error: "invalid_op",
            message: String(e),
            preview: true,
            validTypes: OP_TYPES
          };
        }
      }
      try {
        const result = ctx.store.applyChangeSet(canvasId, ops, {
          origin: "ai",
          summary: String(rawArgs.summary ?? "ai apply")
        });
        const fitViewport = result.autoFitPadding != null ? finalizeAutoFit(ctx.store, canvasId, result.autoFitPadding) : null;
        const payload = clientCanvasPayload(ctx.store, canvasId);
        const anchorId = result.snapshot.canvas.anchorNodeId;
        const affectedIds = result.affectedNodeIds.filter((id) => id !== anchorId);
        ctx.broadcast({
          type: "canvas/event",
          canvasId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          affectedNodeIds: affectedIds,
          fitViewport: fitViewport ?? void 0
        });
        const nodeIdMap = {
          ...prepared.nodeIdMap,
          ...buildNodeIdMap(result.snapshot.nodes, {
            anchorId,
            onlyIds: new Set(affectedIds)
          })
        };
        return {
          ok: true,
          changeSetId: result.changeSetId,
          nodeIdMap,
          affected: affectedIds.map((id) => {
            const n = result.snapshot.nodes.find((x) => x.id === id);
            return {
              id,
              version: n?.version,
              text: n?.text,
              alias: n?.alias
            };
          }),
          positions: payload.positions,
          fitViewport: fitViewport ?? void 0
        };
      } catch (e) {
        return {
          ok: false,
          error: "invalid_op",
          message: String(e),
          validTypes: OP_TYPES
        };
      }
    }
    case "mindmap_undo": {
      try {
        let changeSetId = rawArgs.changeSetId != null && String(rawArgs.changeSetId).length ? String(rawArgs.changeSetId) : null;
        if (!changeSetId) {
          if (!canvasId) {
            return {
              ok: false,
              error: "invalid_op",
              message: "mindmap_undo needs canvasId or changeSetId"
            };
          }
          changeSetId = ctx.store.latestUndoableChangeSetId(canvasId);
          if (!changeSetId) {
            return {
              ok: false,
              error: "nothing_to_undo",
              message: "No undoable change set on this canvas"
            };
          }
        }
        const result = ctx.store.undoChangeSet(changeSetId);
        const payload = clientCanvasPayload(ctx.store, result.snapshot.canvas.id);
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev
        });
        return {
          ok: true,
          undoneChangeSetId: changeSetId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          ...payload
        };
      } catch (e) {
        return {
          ok: false,
          error: "undo_failed",
          message: String(e),
          hint: "Pass changeSetId from apply_direct / accept_proposal, or omit to undo the latest change."
        };
      }
    }
    case "mindmap_redo": {
      try {
        if (!canvasId) {
          return {
            ok: false,
            error: "invalid_op",
            message: "mindmap_redo needs canvasId"
          };
        }
        const changeSetId = ctx.store.latestRedoableChangeSetId(canvasId);
        if (!changeSetId) {
          return {
            ok: false,
            error: "nothing_to_redo",
            message: "No redoable undo companion (latest change is not an undo). Undo first, then redo."
          };
        }
        const result = ctx.store.undoChangeSet(changeSetId);
        const payload = clientCanvasPayload(ctx.store, result.snapshot.canvas.id);
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev
        });
        return {
          ok: true,
          redoneViaChangeSetId: changeSetId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          ...payload
        };
      } catch (e) {
        return {
          ok: false,
          error: "redo_failed",
          message: String(e)
        };
      }
    }
    case "mindmap_history": {
      if (!canvasId) {
        return {
          ok: false,
          error: "invalid_op",
          message: "mindmap_history needs canvasId"
        };
      }
      const limit = Math.min(100, Math.max(1, Number(rawArgs.limit ?? 30) || 30));
      const changes = ctx.store.listChangeSets(canvasId, limit);
      const snapshots = ctx.store.listSnapshots(canvasId, 20);
      const latestUndo = ctx.store.latestUndoableChangeSetId(canvasId);
      const latestRedo = ctx.store.latestRedoableChangeSetId(canvasId);
      return {
        ok: true,
        changes,
        snapshots,
        latestUndoableChangeSetId: latestUndo,
        latestRedoableChangeSetId: latestRedo,
        hint: "Use mindmap_undo / mindmap_redo, or mindmap_restore_snapshot({snapshotId})."
      };
    }
    case "mindmap_snapshot": {
      if (!canvasId) {
        return {
          ok: false,
          error: "invalid_op",
          message: "mindmap_snapshot needs canvasId"
        };
      }
      const action = String(rawArgs.action ?? "create");
      if (action === "list") {
        return {
          ok: true,
          snapshots: ctx.store.listSnapshots(
            canvasId,
            Math.min(50, Number(rawArgs.limit ?? 20) || 20)
          )
        };
      }
      const named = ctx.store.createSnapshot(
        canvasId,
        String(rawArgs.name ?? "")
      );
      return { ok: true, ...named };
    }
    case "mindmap_restore_snapshot": {
      try {
        const snapshotId = String(rawArgs.snapshotId ?? "");
        if (!snapshotId) {
          return {
            ok: false,
            error: "invalid_op",
            message: "mindmap_restore_snapshot needs snapshotId"
          };
        }
        const result = ctx.store.restoreSnapshot(snapshotId);
        layoutCache.delete(result.snapshot.canvas.id);
        const payload = clientCanvasPayload(
          ctx.store,
          result.snapshot.canvas.id
        );
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev
        });
        return {
          ok: true,
          changeSetId: result.changeSetId,
          rev: result.rev,
          restoredSnapshotId: snapshotId,
          ...payload
        };
      } catch (e) {
        return {
          ok: false,
          error: "restore_failed",
          message: String(e)
        };
      }
    }
    case "mindmap_recent_changes":
      return {
        ok: true,
        changes: canvasId ? ctx.store.listChangeSets(canvasId, 20) : [],
        proposals: listProposals(canvasId)
      };
    case "mindmap_focus": {
      const nodeId = String(rawArgs.nodeId);
      const result = ctx.store.applyChangeSet(
        canvasId,
        [{ type: "set_focus", nodeId }],
        { origin: "ai", summary: "focus" }
      );
      ctx.broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId
      });
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds: [nodeId]
      });
      return { ok: true, focusNodeId: nodeId };
    }
    case "mindmap_set_mode": {
      const mode = String(rawArgs.mode ?? "edit");
      const g = ctx.store.loadCanvas(canvasId);
      g.canvas.agentMode = mode;
      ctx.store.applyChangeSet(
        canvasId,
        [{ type: "set_prefs", prefs: { ...g.canvas.prefs } }],
        { origin: "ai", summary: `mode ${mode}` }
      );
      g.canvas.agentMode = mode;
      return { ok: true, mode };
    }
    default:
      return { ok: false, error: "invalid_op", message: `unknown tool ${name17}` };
  }
}

// apps/server/src/chat.ts
function llmConfigured() {
  return Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
}
function llmStatus(sourceHint) {
  const configured = llmConfigured();
  const viaDsh = sourceHint === "dsh" || process.env.MINDMAP_LLM_SOURCE === "dsh" || Boolean(process.env.MINDMAP_DSH_PROVIDER);
  return {
    configured,
    source: viaDsh ? "dsh" : configured ? "env" : "none",
    provider: process.env.MINDMAP_DSH_PROVIDER || void 0,
    model: process.env.MINDMAP_DSH_MODEL || process.env.LLM_MODEL || "deepseek-chat",
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || void 0
  };
}
function getModel() {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "missing";
  const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1";
  const modelId = process.env.LLM_MODEL || "deepseek-chat";
  const provider = createOpenAI({ apiKey, baseURL });
  return provider(modelId);
}
var OpZ = external_exports.object({
  type: external_exports.string().describe("Op discriminator: create_node | link | update_text | \u2026 (NOT `op`)")
}).passthrough();
function createChatHandler(ctx) {
  return async function handleChat(body) {
    const canvasId = body.canvasId;
    const spatial = buildSpatialContext(ctx.store, canvasId);
    const system = `\u4F60\u662F Mind Map \u753B\u5E03\u4E0A\u7684 AI \u534F\u4F5C\u8005\u3002\u56FE\u662F\u552F\u4E00\u4E8B\u5B9E\u6E90\u3002
\u89C4\u5219\uFF1A
1. \u5148\u7528 mindmap_get_spatial_context / mindmap_find \u5B9A\u4F4D\uFF0C\u7981\u6B62\u81C6\u9020\u8282\u70B9 ID\u3002\u627E\u8FB9\u7528 searchScope=edge_label|edge_note\u3002
2. find \u8FD4\u56DE ambiguous=true \u65F6\u5FC5\u987B\u5411\u7528\u6237\u53CD\u95EE\uFF0C\u4E0D\u5F97\u81EA\u884C\u6311\u9009\u3002
3. \u5FEB\u901F\u6863(riskProfile=fast)\uFF1A\u4F4E\u98CE\u9669\u7528 mindmap_apply_direct\uFF08\u65B0\u5EFA\u3001\u6539\u6587\u672C\u3001\u5173\u8054\u3001\u6837\u5F0F\uFF09\uFF1B\u5220\u9664/\u6362\u7236\u7B49\u7528 mindmap_propose\u3002
4. \u4E25\u683C\u6863\uFF1A\u4E00\u5F8B propose\uFF0C\u7B49\u7528\u6237\u63A5\u53D7\u3002
5. \u7981\u6B62\u8F93\u51FA\u6574\u68F5\u6811 JSON \u8986\u76D6\uFF1B\u53EA\u63D0\u4EA4\u589E\u91CF ops\u3002\u6BCF\u4E2A op \u5FC5\u987B\u7528\u5B57\u6BB5 type\uFF08\u7981\u6B62\u7528 op\uFF09\u3002
6. \u5BF9\u8BDD\u91CC\u5148\u7528\u81EA\u7136\u8BED\u8A00\u8BF4\u660E\u4F60\u5728\u505A\u4EC0\u4E48\uFF1B\u5DE5\u5177\u4F1A\u6539\u56FE\u3002
7. \u7528\u6237\u82E5\u8BF4\u300C\u7279\u6717\u666E\u5BB6\u65CF\u300D\u7B49\u5173\u7CFB\u68B3\u7406\uFF1A\u56F4\u7ED5\u7126\u70B9\u521B\u5EFA\u4EBA\u7269\u8282\u70B9\u4E0E relation/hierarchy \u8FB9\uFF0C\u8FB9\u53EF\u5E26 label\uFF08\u5982\u914D\u5076\u3001\u5B50\u5973\uFF09\u3002link \u793A\u4F8B\uFF1A{"type":"link","from":"...","to":"...","kind":"relation","label":"\u914D\u5076"}\u3002
8. \u56FA\u5B9A\u5750\u6807\u7528 set_pinned \u6216 create_node \u5E26 pos\uFF1B\u4E0D\u786E\u5B9A\u65F6 mindmap_get_schema\u3002
9. \u8282\u70B9\u5C5E\u6027\uFF1A\u6807\u9898\u7528 update_text\uFF1B\u63CF\u8FF0/\u591A\u6807\u7B7E/\u591A\u94FE\u63A5/\u56FE\u7247URL/\u65F6\u95F4\u7528 update_node_meta\uFF08patch\uFF09\uFF1B\u8FB9\u7528 update_edge_meta \u6216 set_edge_label\u3002
10. \u8282\u70B9\u7C7B\u578B stylePreset\uFF1Adefault|card|title|decision|risk|note|muted\uFF08title \u4EC5\u753B\u5E03\u951A\u70B9\uFF0C\u52FF\u65B0\u5EFA\uFF1Bcard=\u65B0\u95FB\u5FEB\u7167\u5361\u7247\uFF0C\u914D\u56FE\u7528 imageUrl\u3001\u6458\u8981\u7528 note\u3001\u6765\u6E90\u7528 links\uFF09\u3002
11. \u540C\u7EA7\u6392\u5E8F\u7528 reorder\uFF1A\u4F18\u5148 {"type":"reorder","nodeId":"...","order":10}\uFF1B\u4E5F\u53EF\u7528 afterSiblingId\uFF08null=\u7F6E\u9876\uFF09\u3002
12. \u6298\u53E0 set_collapsed \u4F1A\u9690\u85CF\u8BE5\u8282\u70B9\u4E3B\u7236\u94FE\u4E0B\u7684\u5168\u90E8\u5B50\u5B59\u5E76\u91CD\u65B0\u5E03\u5C40\uFF1B\u5C55\u5F00\u540E\u6062\u590D\u3002
13. \u95EE\u56FE\uFF1A\u7528 mindmap_query\uFF08neighbors|path|stats|orphans|missing_meta\uFF09\uFF1B\u7B54\u5B8C\u53EF\u7528 mindmap_highlight \u9AD8\u4EAE\u8DEF\u5F84\uFF1B\u7EC6\u8282\u7528 mindmap_get_node / mindmap_get_edge\u3002\u7981\u6B62\u7F16\u9020\u56FE\u4E2D\u6CA1\u6709\u7684\u4E8B\u5B9E\u3002

\u5F53\u524D\u7A7A\u95F4\u4E0A\u4E0B\u6587\uFF08\u6458\u8981\uFF09\uFF1A
${JSON.stringify(spatial, null, 0).slice(0, 6e3)}
`;
    const toolCtx = { ...ctx, defaultCanvasId: canvasId };
    const result = streamText({
      model: getModel(),
      system,
      messages: body.messages,
      maxSteps: 10,
      tools: {
        mindmap_get_spatial_context: tool({
          description: "\u83B7\u53D6\u9009\u533A/\u89C6\u53E3/\u5916\u56F4\u7C07\u7B49\u7A7A\u95F4\u4E0A\u4E0B\u6587",
          parameters: external_exports.object({ canvasId: external_exports.string().optional() }),
          execute: async (args) => runTool("mindmap_get_spatial_context", args, toolCtx)
        }),
        mindmap_find: tool({
          description: "\u68C0\u7D22\u8282\u70B9\u6216\u8FB9\uFF1BsearchScope=text|note|tags|description|edge_label|edge_note|all\uFF1B\u53EF\u80FD\u8FD4\u56DE ambiguous",
          parameters: external_exports.object({
            query: external_exports.string(),
            searchScope: external_exports.enum([
              "text",
              "note",
              "tags",
              "description",
              "edge_label",
              "edge_note",
              "all"
            ]).optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_find", args, toolCtx)
        }),
        mindmap_query: tool({
          description: "\u56FE\u95EE\u7B54\uFF1Aneighbors|path|stats|orphans|missing_meta\u3002path \u542B paths[].edges\uFF1Bstats \u542B longestPath/mostConnected",
          parameters: external_exports.object({
            op: external_exports.enum(["neighbors", "path", "stats", "orphans", "missing_meta"]),
            node: external_exports.string().optional(),
            nodeId: external_exports.string().optional(),
            from: external_exports.string().optional(),
            to: external_exports.string().optional(),
            depth: external_exports.number().optional(),
            maxHops: external_exports.number().optional(),
            direction: external_exports.enum(["out", "in", "both"]).optional(),
            edgeKinds: external_exports.enum(["all", "hierarchy", "relation"]).optional(),
            throughRelationNodes: external_exports.boolean().optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_query", args, toolCtx)
        }),
        mindmap_get_node: tool({
          description: "\u8BFB\u5355\u4E2A\u8282\u70B9\u8BE6\u60C5\uFF08description/note/tags/links\uFF09",
          parameters: external_exports.object({
            nodeId: external_exports.string(),
            fields: external_exports.array(external_exports.enum(["all", "description", "note", "tags", "links"])).optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_get_node", args, toolCtx)
        }),
        mindmap_get_edge: tool({
          description: "\u8BFB\u5355\u6761\u8FB9\u8BE6\u60C5\uFF08label/weight/lineStyle/direction/note\uFF09",
          parameters: external_exports.object({
            edgeId: external_exports.string(),
            fields: external_exports.array(external_exports.enum(["all", "label", "meta"])).optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_get_edge", args, toolCtx)
        }),
        mindmap_highlight: tool({
          description: "\u5728\u753B\u5E03\u4E0A\u9AD8\u4EAE\u8282\u70B9/\u8FB9\uFF08\u4E34\u65F6\uFF0C\u4E0D\u6539\u56FE\uFF09\uFF1B\u95EE\u7B54\u540E\u53EF\u89C6\u5316\u8DEF\u5F84",
          parameters: external_exports.object({
            nodeIds: external_exports.array(external_exports.string()).optional(),
            edgeIds: external_exports.array(external_exports.string()).optional(),
            ttlMs: external_exports.number().optional(),
            style: external_exports.object({
              nodeColor: external_exports.string().optional(),
              nodeGlow: external_exports.boolean().optional(),
              edgeWidth: external_exports.number().optional(),
              edgeColor: external_exports.string().optional()
            }).optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_highlight", args, toolCtx)
        }),
        mindmap_get_subgraph: tool({
          description: "\u8BFB\u53D6\u4EE5\u67D0\u8282\u70B9\u4E3A\u6839\u7684\u5B50\u56FE\uFF08depth<=3\uFF09",
          parameters: external_exports.object({
            rootId: external_exports.string().optional(),
            depth: external_exports.number().optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_get_subgraph", args, toolCtx)
        }),
        mindmap_apply_direct: tool({
          description: "\u5FEB\u901F\u6863\u76F4\u63A5\u5E94\u7528\u4F4E\u98CE\u9669 ops",
          parameters: external_exports.object({
            ops: external_exports.array(OpZ),
            summary: external_exports.string().optional(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_apply_direct", args, toolCtx)
        }),
        mindmap_propose: tool({
          description: "\u63D0\u4EA4\u5F85\u786E\u8BA4\u63D0\u6848\uFF08\u9AD8\u98CE\u9669\u6216\u4E25\u683C\u6863\uFF09",
          parameters: external_exports.object({
            ops: external_exports.array(OpZ),
            rationale: external_exports.string(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_propose", args, toolCtx)
        }),
        mindmap_focus: tool({
          description: "\u79FB\u52A8\u89C6\u89C9\u7126\u70B9",
          parameters: external_exports.object({
            nodeId: external_exports.string(),
            canvasId: external_exports.string().optional()
          }),
          execute: async (args) => runTool("mindmap_focus", args, toolCtx)
        })
      }
    });
    return result;
  };
}

// apps/server/src/create-server.ts
function bridgeBase() {
  return (process.env.MINDMAP_DSH_BRIDGE || "").replace(/\/$/, "");
}
function internalToken() {
  return process.env.MINDMAP_INTERNAL_TOKEN || "";
}
async function callDshBridge(path3, init) {
  const base = bridgeBase();
  if (!base) throw new Error("DSH bridge not configured");
  const res = await fetch(`${base}${path3}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers ?? {}
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(body.message || body.error || `bridge ${res.status}`));
  }
  return body;
}
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var mindMapRoot = process.env.MINDMAP_ROOT ? path2.resolve(process.env.MINDMAP_ROOT) : path2.resolve(__dirname, "../../..");
function resolveWebDist(root = mindMapRoot) {
  if (process.env.MINDMAP_WEB_DIST) {
    return path2.resolve(process.env.MINDMAP_WEB_DIST);
  }
  const bundled = path2.join(root, "bundle", "web");
  if (fs2.existsSync(path2.join(bundled, "index.html"))) return bundled;
  return path2.join(root, "apps", "web", "dist");
}
function loadDotEnv(root = mindMapRoot) {
  try {
    const envPath = path2.join(root, ".env");
    if (!fs2.existsSync(envPath)) return;
    for (const line of fs2.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m || line.trimStart().startsWith("#")) continue;
      const key = m[1];
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = val;
    }
  } catch {
  }
}
function startMindMapServer(options = {}) {
  const root = options.root ?? mindMapRoot;
  loadDotEnv(root);
  const port = Number(options.port ?? process.env.PORT ?? 17890);
  const bind = options.bind ?? process.env.BIND ?? "127.0.0.1";
  const dataDir = options.dataDir ?? process.env.DATA_DIR ?? path2.join(root, "data");
  const dbPath = path2.join(dataDir, "mindmap.sqlite");
  const store = new SqliteGraphStore(dbPath);
  const app = new Hono2();
  app.use("*", cors({ origin: "*" }));
  const sockets = /* @__PURE__ */ new Set();
  function broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) ws.send(data);
    }
  }
  app.get(
    "/health",
    (c) => c.json({ ok: true, port, bind, dbPath, skins: listSkins().map((s) => s.id) })
  );
  app.get("/api/skins", (c) => c.json({ skins: listSkins() }));
  app.get(
    "/api/canvases",
    (c) => c.json({
      canvases: store.listCanvases().map((x) => ({
        id: x.id,
        title: x.title,
        focusNodeId: x.focusNodeId === x.anchorNodeId ? null : x.focusNodeId,
        viewport: x.viewport,
        prefs: x.prefs,
        rev: x.rev,
        agentMode: x.agentMode,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt
      }))
    })
  );
  app.post("/api/canvases", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const g = store.createCanvas(body.title, body.rootText);
    broadcast({ type: "canvas/created", canvasId: g.canvas.id });
    return c.json(clientCanvasPayload(store, g.canvas.id));
  });
  app.get("/api/canvases/:id", (c) => {
    const id = c.req.param("id");
    try {
      return c.json(clientCanvasPayload(store, id));
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });
  app.patch("/api/canvases/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    if (body.title) store.renameCanvas(id, body.title);
    if (body.viewport) store.updateViewport(id, body.viewport);
    return c.json({ canvas: store.loadCanvas(id).canvas });
  });
  app.delete("/api/canvases/:id", (c) => {
    const id = c.req.param("id");
    store.hardDeleteCanvas(id);
    broadcast({ type: "canvas/deleted", canvasId: id });
    return c.json({ ok: true });
  });
  app.post("/api/canvases/:id/ops", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const coercedOps = Array.isArray(body?.ops) ? body.ops.map((o) => coerceOpInput(o)) : body?.ops;
    const parsed = external_exports.object({
      ops: external_exports.array(OpSchema),
      origin: external_exports.enum(["user", "ai"]).default("user"),
      summary: external_exports.string().optional()
    }).safeParse({ ...body, ops: coercedOps });
    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          error: "invalid_op",
          message: "Each op needs field `type` (not `op`). Valid: create_node, link, update_text, set_pinned, \u2026",
          details: parsed.error.flatten()
        },
        400
      );
    }
    try {
      const result = store.applyChangeSet(id, parsed.data.ops, {
        origin: parsed.data.origin,
        summary: parsed.data.summary
      });
      const fitViewport = result.autoFitPadding != null ? finalizeAutoFit(store, id, result.autoFitPadding) : null;
      const payload = clientCanvasPayload(store, id);
      const preserveUnpinned = parsed.data.ops.every((o) => o.type === "set_pinned");
      broadcast({
        type: "canvas/event",
        canvasId: id,
        changeSetId: result.changeSetId,
        rev: result.rev,
        preserveUnpinned,
        affectedNodeIds: result.affectedNodeIds.filter(
          (nid) => nid !== result.snapshot.canvas.anchorNodeId
        ),
        fitViewport: fitViewport ?? void 0
      });
      return c.json({
        ok: true,
        changeSetId: result.changeSetId,
        rev: result.rev,
        affectedNodeIds: result.affectedNodeIds.filter(
          (nid) => nid !== result.snapshot.canvas.anchorNodeId
        ),
        fitViewport: fitViewport ?? void 0,
        ...payload
      });
    } catch (e) {
      if (e instanceof GraphError) {
        return c.json({ ok: false, error: e.code, message: e.message }, 409);
      }
      return c.json({ ok: false, error: "invalid_op", message: String(e) }, 400);
    }
  });
  app.post("/api/canvases/:id/undo", async (c) => {
    const canvasId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    try {
      let changeSetId = body.changeSetId;
      if (!changeSetId) {
        changeSetId = store.latestUndoableChangeSetId(canvasId) ?? void 0;
      }
      if (!changeSetId) {
        return c.json(
          { ok: false, error: "nothing_to_undo", message: "No undoable change set" },
          400
        );
      }
      const result = store.undoChangeSet(changeSetId);
      const payload = clientCanvasPayload(store, canvasId);
      broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId,
        rev: result.rev
      });
      return c.json({
        ok: true,
        undoneChangeSetId: changeSetId,
        changeSetId: result.changeSetId,
        rev: result.rev,
        ...payload
      });
    } catch (e) {
      return c.json({ ok: false, error: "undo_failed", message: String(e) }, 400);
    }
  });
  app.get("/api/canvases/:id/search", (c) => {
    const q = c.req.query("q") ?? "";
    const scopeRaw = c.req.query("scope") ?? "text";
    const scope = scopeRaw === "note" || scopeRaw === "tags" || scopeRaw === "description" || scopeRaw === "edge_label" || scopeRaw === "edge_note" || scopeRaw === "all" ? scopeRaw : "text";
    return c.json({ hits: store.search(c.req.param("id"), q, 20, scope) });
  });
  app.get("/api/canvases/:id/trash", (c) => {
    try {
      return c.json({ nodes: store.listDeletedNodes(c.req.param("id")) });
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });
  app.post("/api/canvases/:id/trash/:nodeId/restore", (c) => {
    try {
      const result = store.restoreNode(c.req.param("id"), c.req.param("nodeId"));
      broadcast({
        type: "canvas/event",
        canvasId: c.req.param("id"),
        changeSetId: result.changeSetId
      });
      return c.json({ ok: true, ...result });
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 400);
    }
  });
  app.post("/api/canvases/:id/activity", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    setActivity({
      canvasId: id,
      selectionIds: body.selectionIds ?? [],
      focusNodeId: body.focusNodeId ?? null,
      viewport: body.viewport ?? { x: 0, y: 0, zoom: 1 },
      updatedAt: Date.now()
    });
    return c.json({ ok: true });
  });
  app.get("/api/canvases/:id/proposals", (c) => {
    return c.json({ proposals: listProposals(c.req.param("id")) });
  });
  app.post("/api/canvases/:id/proposals/:pid/accept", async (c) => {
    const result = await runTool(
      "mindmap_accept_proposal",
      { proposalId: c.req.param("pid"), canvasId: c.req.param("id") },
      { store, broadcast, defaultCanvasId: c.req.param("id") }
    );
    return c.json(result);
  });
  app.post("/api/canvases/:id/proposals/:pid/reject", async (c) => {
    const result = await runTool(
      "mindmap_reject_proposal",
      { proposalId: c.req.param("pid") },
      { store, broadcast, defaultCanvasId: c.req.param("id") }
    );
    return c.json(result);
  });
  app.get("/api/canvases/:id/export.json", (c) => {
    try {
      const snap = store.getSnapshot(c.req.param("id"));
      return c.json(snap);
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });
  app.post("/api/tools/:name", async (c) => {
    const name17 = c.req.param("name");
    const args = await c.req.json().catch(() => ({}));
    try {
      const result = await runTool(name17, args, { store, broadcast });
      return c.json(result);
    } catch (e) {
      return c.json(
        { ok: false, error: "tool_error", message: String(e) },
        400
      );
    }
  });
  const handleChat = createChatHandler({ store, broadcast });
  async function sessionStatus(canvasId) {
    if (options.sessionBridge) {
      return { ...options.sessionBridge.status(canvasId), canvasUrl: `http://${bind}:${port}` };
    }
    if (bridgeBase()) {
      const q = canvasId ? `?canvasId=${encodeURIComponent(canvasId)}` : "";
      return callDshBridge(`/status${q}`);
    }
    return {
      ok: true,
      mode: llmConfigured() ? "legacy-env-llm" : "unconfigured",
      bound: false,
      sessionId: null,
      agents: false,
      message: "\u672A\u8FDE\u63A5 DSH\uFF1A\u8BF7\u901A\u8FC7 dsh-mind-map \u63D2\u4EF6\u542F\u52A8\uFF0C\u5BF9\u8BDD\u5C06\u955C\u50CF DSH \u4F1A\u8BDD"
    };
  }
  app.get("/api/session/status", async (c) => {
    try {
      const canvasId = c.req.query("canvasId") || void 0;
      return c.json(await sessionStatus(canvasId));
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });
  app.post("/api/session/prompt", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (!body.canvasId || !body.text?.trim()) {
      return c.json({ ok: false, message: "canvasId and text required" }, 400);
    }
    try {
      if (options.sessionBridge) {
        const result = await options.sessionBridge.prompt(body.canvasId, body.text);
        return c.json(result);
      }
      if (bridgeBase()) {
        const result = await callDshBridge("/prompt", {
          method: "POST",
          body: JSON.stringify({ canvasId: body.canvasId, text: body.text })
        });
        return c.json(result);
      }
      return c.json(
        {
          ok: false,
          error: "dsh_bridge_missing",
          message: "\u5BF9\u8BDD\u9700\u7ECF DSH \u4F1A\u8BDD\u3002\u8BF7\u7528 dsh-mind-map \u63D2\u4EF6\u542F\u52A8\u753B\u5E03\u670D\u52A1\u3002"
        },
        503
      );
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });
  app.get("/api/session/history", async (c) => {
    const canvasId = c.req.query("canvasId");
    if (!canvasId) return c.json({ ok: false, message: "canvasId required" }, 400);
    try {
      if (options.sessionBridge) {
        const hist = await options.sessionBridge.history(canvasId);
        return c.json({ ok: true, ...hist });
      }
      if (bridgeBase()) {
        const hist = await callDshBridge(
          `/history?canvasId=${encodeURIComponent(canvasId)}`
        );
        return c.json(hist);
      }
      return c.json({ ok: true, sessionId: null, messages: [] });
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });
  app.post("/api/session/ensure", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (!body.canvasId) return c.json({ ok: false, message: "canvasId required" }, 400);
    try {
      if (options.sessionBridge) {
        const st = options.sessionBridge.status(body.canvasId);
        if (st.bound) return c.json({ ok: true, sessionId: st.sessionId });
      }
      if (bridgeBase()) {
        const result = await callDshBridge("/ensure", {
          method: "POST",
          body: JSON.stringify({ canvasId: body.canvasId })
        });
        return c.json(result);
      }
      return c.json({ ok: false, message: "DSH bridge missing" }, 503);
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });
  app.post("/api/internal/session-event", async (c) => {
    const token = c.req.header("x-mindmap-token") || "";
    const expected = internalToken();
    if (expected && token !== expected) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }
    const body = await c.req.json().catch(() => ({}));
    if (!body.canvasId || !body.mirror) {
      return c.json({ ok: false, message: "canvasId and mirror required" }, 400);
    }
    broadcast({
      type: "session/mirror",
      canvasId: body.canvasId,
      mirror: body.mirror
    });
    return c.json({ ok: true });
  });
  const uploadsDir = path2.join(dataDir, "uploads");
  fs2.mkdirSync(uploadsDir, { recursive: true });
  app.post("/api/uploads", async (c) => {
    const body = await c.req.json().catch(() => null);
    const raw2 = String(body?.dataBase64 || "").trim();
    if (!raw2) {
      return c.json({ ok: false, message: "dataBase64 required" }, 400);
    }
    let b64 = raw2;
    let mime = String(body?.mimeType || "").trim().toLowerCase();
    const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(raw2);
    if (dataUrl) {
      mime = dataUrl[1].toLowerCase();
      b64 = dataUrl[2];
    }
    const allowed = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };
    const ext = allowed[mime];
    if (!ext) {
      return c.json(
        {
          ok: false,
          message: "\u4EC5\u652F\u6301 jpeg/png/webp/gif"
        },
        400
      );
    }
    let buf;
    try {
      buf = Buffer.from(b64, "base64");
    } catch {
      return c.json({ ok: false, message: "invalid base64" }, 400);
    }
    if (!buf.length || buf.length > 6 * 1024 * 1024) {
      return c.json({ ok: false, message: "\u56FE\u7247\u9700\u5C0F\u4E8E 6MB\uFF08\u538B\u7F29\u540E\uFF09" }, 400);
    }
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const name17 = `${id}.${ext}`;
    fs2.writeFileSync(path2.join(uploadsDir, name17), buf);
    const url = `/uploads/${name17}`;
    return c.json({ ok: true, url, mimeType: mime, bytes: buf.length });
  });
  app.get("/uploads/:name", (c) => {
    const name17 = c.req.param("name");
    if (!/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(name17)) {
      return c.notFound();
    }
    const fp = path2.join(uploadsDir, name17);
    if (!fs2.existsSync(fp)) return c.notFound();
    const lower = name17.toLowerCase();
    const mime = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : lower.endsWith(".gif") ? "image/gif" : "image/jpeg";
    const data = fs2.readFileSync(fp);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  });
  app.post("/api/chat", async (c) => {
    if (bridgeBase() || options.sessionBridge) {
      return c.json(
        {
          ok: false,
          error: "use_session_prompt",
          message: "\u8BF7\u4F7F\u7528 /api/session/prompt\uFF08DSH \u4F1A\u8BDD\u955C\u50CF\uFF09"
        },
        400
      );
    }
    if (!llmConfigured()) {
      return c.json(
        {
          ok: false,
          error: "llm_not_configured",
          message: "\u8BF7\u901A\u8FC7 DSH \u63D2\u4EF6 dsh-mind-map \u4F7F\u7528\u4F1A\u8BDD\u5BF9\u8BDD\uFF1B\u72EC\u7ACB\u8C03\u8BD5\u624D\u9700\u8981 LLM_API_KEY"
        },
        503
      );
    }
    const body = await c.req.json();
    if (!body.canvasId || !body.messages?.length) {
      return c.json({ ok: false, message: "canvasId and messages required" }, 400);
    }
    try {
      const result = await handleChat(body);
      return result.toDataStreamResponse();
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });
  app.get("/api/llm/status", async (c) => {
    try {
      const st = await sessionStatus();
      const dshOk = st.mode === "dsh-session" || Boolean(bridgeBase()) || Boolean(options.sessionBridge);
      return c.json({
        ...llmStatus(options.llmSource ?? (dshOk ? "dsh" : void 0)),
        configured: dshOk || llmConfigured(),
        session: st
      });
    } catch {
      return c.json({
        ...llmStatus(options.llmSource),
        configured: llmConfigured()
      });
    }
  });
  const webDistAbs = resolveWebDist(root);
  const webDistRel = path2.relative(process.cwd(), webDistAbs) || ".";
  if (fs2.existsSync(path2.join(webDistAbs, "index.html"))) {
    app.use(
      "/*",
      serveStatic({
        root: webDistAbs,
        index: "index.html"
      })
    );
    app.get("*", async (c) => {
      const p = c.req.path;
      if (p.startsWith("/api") || p === "/health" || p.startsWith("/ws") || p.startsWith("/uploads")) {
        return c.notFound();
      }
      const indexPath = path2.join(webDistAbs, "index.html");
      if (!fs2.existsSync(indexPath)) {
        return c.text(
          "Mind Map UI not built. From mind-map repo run: pnpm --filter @mind-map/web build && pnpm pack:plugin",
          503
        );
      }
      return c.html(fs2.readFileSync(indexPath, "utf8"));
    });
  } else {
    app.get(
      "/",
      (c) => c.text(
        `Mind Map UI missing (${webDistAbs}). Run: pnpm pack:plugin`,
        503
      )
    );
  }
  const server = serve({ fetch: app.fetch, port, hostname: bind }, (info) => {
    console.log(`[mind-map] http://${info.address}:${info.port}`);
    console.log(`[mind-map] db ${dbPath}`);
  });
  server.on("error", (err) => {
    console.error(`[mind-map] listen error: ${err.code || err.message}`);
    if (err.code === "EADDRINUSE") {
      console.error(
        `[mind-map] ${bind}:${port} is busy \u2014 stop the old process or change the port in DSH settings`
      );
    }
    process.exitCode = 1;
    try {
      store.close();
    } catch {
    }
    process.exit(1);
  });
  const wss = new import_websocket_server.default({ server, path: "/ws" });
  wss.on("error", (err) => {
    console.error(`[mind-map] ws error: ${String(err)}`);
  });
  wss.on("connection", (ws) => {
    sockets.add(ws);
    ws.send(JSON.stringify({ type: "hello", ok: true }));
    ws.on("message", (raw2) => {
      try {
        const msg = JSON.parse(String(raw2));
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {
      }
    });
    ws.on("close", () => sockets.delete(ws));
  });
  return {
    app,
    store,
    port,
    bind,
    dbPath,
    close: async () => {
      await new Promise((resolve) => {
        wss.close();
        server.close(() => resolve());
      });
      store.close();
    }
  };
}

// apps/server/src/index.ts
startMindMapServer();
