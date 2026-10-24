var Colyseus = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/colyseus.js/lib/legacy.js
  var require_legacy = __commonJS({
    "node_modules/colyseus.js/lib/legacy.js"() {
      if (!ArrayBuffer.isView) {
        ArrayBuffer.isView = (a) => {
          return a !== null && typeof a === "object" && a.buffer instanceof ArrayBuffer;
        };
      }
      if (typeof globalThis === "undefined" && typeof window !== "undefined") {
        window["globalThis"] = window;
      }
    }
  });

  // node_modules/colyseus.js/lib/errors/ServerError.js
  var require_ServerError = __commonJS({
    "node_modules/colyseus.js/lib/errors/ServerError.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ServerError = exports.CloseCode = void 0;
      var CloseCode;
      (function(CloseCode2) {
        CloseCode2[CloseCode2["CONSENTED"] = 4e3] = "CONSENTED";
        CloseCode2[CloseCode2["DEVMODE_RESTART"] = 4010] = "DEVMODE_RESTART";
      })(CloseCode = exports.CloseCode || (exports.CloseCode = {}));
      var ServerError = class extends Error {
        constructor(code, message) {
          super(message);
          this.name = "ServerError";
          this.code = code;
        }
      };
      exports.ServerError = ServerError;
    }
  });

  // node_modules/colyseus.js/lib/msgpack/index.js
  var require_msgpack = __commonJS({
    "node_modules/colyseus.js/lib/msgpack/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decode = exports.encode = void 0;
      function Decoder(buffer, offset) {
        this._offset = offset;
        if (buffer instanceof ArrayBuffer) {
          this._buffer = buffer;
          this._view = new DataView(this._buffer);
        } else if (ArrayBuffer.isView(buffer)) {
          this._buffer = buffer.buffer;
          this._view = new DataView(this._buffer, buffer.byteOffset, buffer.byteLength);
        } else {
          throw new Error("Invalid argument");
        }
      }
      function utf8Read(view, offset, length) {
        var string = "", chr = 0;
        for (var i = offset, end = offset + length; i < end; i++) {
          var byte = view.getUint8(i);
          if ((byte & 128) === 0) {
            string += String.fromCharCode(byte);
            continue;
          }
          if ((byte & 224) === 192) {
            string += String.fromCharCode((byte & 31) << 6 | view.getUint8(++i) & 63);
            continue;
          }
          if ((byte & 240) === 224) {
            string += String.fromCharCode((byte & 15) << 12 | (view.getUint8(++i) & 63) << 6 | (view.getUint8(++i) & 63) << 0);
            continue;
          }
          if ((byte & 248) === 240) {
            chr = (byte & 7) << 18 | (view.getUint8(++i) & 63) << 12 | (view.getUint8(++i) & 63) << 6 | (view.getUint8(++i) & 63) << 0;
            if (chr >= 65536) {
              chr -= 65536;
              string += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
            } else {
              string += String.fromCharCode(chr);
            }
            continue;
          }
          throw new Error("Invalid byte " + byte.toString(16));
        }
        return string;
      }
      Decoder.prototype._array = function(length) {
        var value = new Array(length);
        for (var i = 0; i < length; i++) {
          value[i] = this._parse();
        }
        return value;
      };
      Decoder.prototype._map = function(length) {
        var key = "", value = {};
        for (var i = 0; i < length; i++) {
          key = this._parse();
          value[key] = this._parse();
        }
        return value;
      };
      Decoder.prototype._str = function(length) {
        var value = utf8Read(this._view, this._offset, length);
        this._offset += length;
        return value;
      };
      Decoder.prototype._bin = function(length) {
        var value = this._buffer.slice(this._offset, this._offset + length);
        this._offset += length;
        return value;
      };
      Decoder.prototype._parse = function() {
        var prefix = this._view.getUint8(this._offset++);
        var value, length = 0, type = 0, hi = 0, lo = 0;
        if (prefix < 192) {
          if (prefix < 128) {
            return prefix;
          }
          if (prefix < 144) {
            return this._map(prefix & 15);
          }
          if (prefix < 160) {
            return this._array(prefix & 15);
          }
          return this._str(prefix & 31);
        }
        if (prefix > 223) {
          return (255 - prefix + 1) * -1;
        }
        switch (prefix) {
          // nil
          case 192:
            return null;
          // false
          case 194:
            return false;
          // true
          case 195:
            return true;
          // bin
          case 196:
            length = this._view.getUint8(this._offset);
            this._offset += 1;
            return this._bin(length);
          case 197:
            length = this._view.getUint16(this._offset);
            this._offset += 2;
            return this._bin(length);
          case 198:
            length = this._view.getUint32(this._offset);
            this._offset += 4;
            return this._bin(length);
          // ext
          case 199:
            length = this._view.getUint8(this._offset);
            type = this._view.getInt8(this._offset + 1);
            this._offset += 2;
            if (type === -1) {
              var ns = this._view.getUint32(this._offset);
              hi = this._view.getInt32(this._offset + 4);
              lo = this._view.getUint32(this._offset + 8);
              this._offset += 12;
              return new Date((hi * 4294967296 + lo) * 1e3 + ns / 1e6);
            }
            return [type, this._bin(length)];
          case 200:
            length = this._view.getUint16(this._offset);
            type = this._view.getInt8(this._offset + 2);
            this._offset += 3;
            return [type, this._bin(length)];
          case 201:
            length = this._view.getUint32(this._offset);
            type = this._view.getInt8(this._offset + 4);
            this._offset += 5;
            return [type, this._bin(length)];
          // float
          case 202:
            value = this._view.getFloat32(this._offset);
            this._offset += 4;
            return value;
          case 203:
            value = this._view.getFloat64(this._offset);
            this._offset += 8;
            return value;
          // uint
          case 204:
            value = this._view.getUint8(this._offset);
            this._offset += 1;
            return value;
          case 205:
            value = this._view.getUint16(this._offset);
            this._offset += 2;
            return value;
          case 206:
            value = this._view.getUint32(this._offset);
            this._offset += 4;
            return value;
          case 207:
            hi = this._view.getUint32(this._offset) * Math.pow(2, 32);
            lo = this._view.getUint32(this._offset + 4);
            this._offset += 8;
            return hi + lo;
          // int
          case 208:
            value = this._view.getInt8(this._offset);
            this._offset += 1;
            return value;
          case 209:
            value = this._view.getInt16(this._offset);
            this._offset += 2;
            return value;
          case 210:
            value = this._view.getInt32(this._offset);
            this._offset += 4;
            return value;
          case 211:
            hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
            lo = this._view.getUint32(this._offset + 4);
            this._offset += 8;
            return hi + lo;
          // fixext
          case 212:
            type = this._view.getInt8(this._offset);
            this._offset += 1;
            if (type === 0) {
              this._offset += 1;
              return void 0;
            }
            return [type, this._bin(1)];
          case 213:
            type = this._view.getInt8(this._offset);
            this._offset += 1;
            return [type, this._bin(2)];
          case 214:
            type = this._view.getInt8(this._offset);
            this._offset += 1;
            if (type === -1) {
              value = this._view.getUint32(this._offset);
              this._offset += 4;
              return new Date(value * 1e3);
            }
            return [type, this._bin(4)];
          case 215:
            type = this._view.getInt8(this._offset);
            this._offset += 1;
            if (type === 0) {
              hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
              lo = this._view.getUint32(this._offset + 4);
              this._offset += 8;
              return new Date(hi + lo);
            }
            if (type === -1) {
              hi = this._view.getUint32(this._offset);
              lo = this._view.getUint32(this._offset + 4);
              this._offset += 8;
              var s = (hi & 3) * 4294967296 + lo;
              return new Date(s * 1e3 + (hi >>> 2) / 1e6);
            }
            return [type, this._bin(8)];
          case 216:
            type = this._view.getInt8(this._offset);
            this._offset += 1;
            return [type, this._bin(16)];
          // str
          case 217:
            length = this._view.getUint8(this._offset);
            this._offset += 1;
            return this._str(length);
          case 218:
            length = this._view.getUint16(this._offset);
            this._offset += 2;
            return this._str(length);
          case 219:
            length = this._view.getUint32(this._offset);
            this._offset += 4;
            return this._str(length);
          // array
          case 220:
            length = this._view.getUint16(this._offset);
            this._offset += 2;
            return this._array(length);
          case 221:
            length = this._view.getUint32(this._offset);
            this._offset += 4;
            return this._array(length);
          // map
          case 222:
            length = this._view.getUint16(this._offset);
            this._offset += 2;
            return this._map(length);
          case 223:
            length = this._view.getUint32(this._offset);
            this._offset += 4;
            return this._map(length);
        }
        throw new Error("Could not parse");
      };
      function decode(buffer, offset = 0) {
        var decoder = new Decoder(buffer, offset);
        var value = decoder._parse();
        if (decoder._offset !== buffer.byteLength) {
          throw new Error(buffer.byteLength - decoder._offset + " trailing bytes");
        }
        return value;
      }
      exports.decode = decode;
      var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
      var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
      function utf8Write(view, offset, str) {
        var c = 0;
        for (var i = 0, l = str.length; i < l; i++) {
          c = str.charCodeAt(i);
          if (c < 128) {
            view.setUint8(offset++, c);
          } else if (c < 2048) {
            view.setUint8(offset++, 192 | c >> 6);
            view.setUint8(offset++, 128 | c & 63);
          } else if (c < 55296 || c >= 57344) {
            view.setUint8(offset++, 224 | c >> 12);
            view.setUint8(offset++, 128 | c >> 6 & 63);
            view.setUint8(offset++, 128 | c & 63);
          } else {
            i++;
            c = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
            view.setUint8(offset++, 240 | c >> 18);
            view.setUint8(offset++, 128 | c >> 12 & 63);
            view.setUint8(offset++, 128 | c >> 6 & 63);
            view.setUint8(offset++, 128 | c & 63);
          }
        }
      }
      function utf8Length(str) {
        var c = 0, length = 0;
        for (var i = 0, l = str.length; i < l; i++) {
          c = str.charCodeAt(i);
          if (c < 128) {
            length += 1;
          } else if (c < 2048) {
            length += 2;
          } else if (c < 55296 || c >= 57344) {
            length += 3;
          } else {
            i++;
            length += 4;
          }
        }
        return length;
      }
      function _encode(bytes, defers, value) {
        var type = typeof value, i = 0, l = 0, hi = 0, lo = 0, length = 0, size = 0;
        if (type === "string") {
          length = utf8Length(value);
          if (length < 32) {
            bytes.push(length | 160);
            size = 1;
          } else if (length < 256) {
            bytes.push(217, length);
            size = 2;
          } else if (length < 65536) {
            bytes.push(218, length >> 8, length);
            size = 3;
          } else if (length < 4294967296) {
            bytes.push(219, length >> 24, length >> 16, length >> 8, length);
            size = 5;
          } else {
            throw new Error("String too long");
          }
          defers.push({ _str: value, _length: length, _offset: bytes.length });
          return size + length;
        }
        if (type === "number") {
          if (Math.floor(value) !== value || !isFinite(value)) {
            bytes.push(203);
            defers.push({ _float: value, _length: 8, _offset: bytes.length });
            return 9;
          }
          if (value >= 0) {
            if (value < 128) {
              bytes.push(value);
              return 1;
            }
            if (value < 256) {
              bytes.push(204, value);
              return 2;
            }
            if (value < 65536) {
              bytes.push(205, value >> 8, value);
              return 3;
            }
            if (value < 4294967296) {
              bytes.push(206, value >> 24, value >> 16, value >> 8, value);
              return 5;
            }
            hi = value / Math.pow(2, 32) >> 0;
            lo = value >>> 0;
            bytes.push(207, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
            return 9;
          } else {
            if (value >= -32) {
              bytes.push(value);
              return 1;
            }
            if (value >= -128) {
              bytes.push(208, value);
              return 2;
            }
            if (value >= -32768) {
              bytes.push(209, value >> 8, value);
              return 3;
            }
            if (value >= -2147483648) {
              bytes.push(210, value >> 24, value >> 16, value >> 8, value);
              return 5;
            }
            hi = Math.floor(value / Math.pow(2, 32));
            lo = value >>> 0;
            bytes.push(211, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
            return 9;
          }
        }
        if (type === "object") {
          if (value === null) {
            bytes.push(192);
            return 1;
          }
          if (Array.isArray(value)) {
            length = value.length;
            if (length < 16) {
              bytes.push(length | 144);
              size = 1;
            } else if (length < 65536) {
              bytes.push(220, length >> 8, length);
              size = 3;
            } else if (length < 4294967296) {
              bytes.push(221, length >> 24, length >> 16, length >> 8, length);
              size = 5;
            } else {
              throw new Error("Array too large");
            }
            for (i = 0; i < length; i++) {
              size += _encode(bytes, defers, value[i]);
            }
            return size;
          }
          if (value instanceof Date) {
            var ms = value.getTime();
            var s = Math.floor(ms / 1e3);
            var ns = (ms - s * 1e3) * 1e6;
            if (s >= 0 && ns >= 0 && s <= TIMESTAMP64_MAX_SEC) {
              if (ns === 0 && s <= TIMESTAMP32_MAX_SEC) {
                bytes.push(214, 255, s >> 24, s >> 16, s >> 8, s);
                return 6;
              } else {
                hi = s / 4294967296;
                lo = s & 4294967295;
                bytes.push(215, 255, ns >> 22, ns >> 14, ns >> 6, hi, lo >> 24, lo >> 16, lo >> 8, lo);
                return 10;
              }
            } else {
              hi = Math.floor(s / 4294967296);
              lo = s >>> 0;
              bytes.push(199, 12, 255, ns >> 24, ns >> 16, ns >> 8, ns, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
              return 15;
            }
          }
          if (value instanceof ArrayBuffer) {
            length = value.byteLength;
            if (length < 256) {
              bytes.push(196, length);
              size = 2;
            } else if (length < 65536) {
              bytes.push(197, length >> 8, length);
              size = 3;
            } else if (length < 4294967296) {
              bytes.push(198, length >> 24, length >> 16, length >> 8, length);
              size = 5;
            } else {
              throw new Error("Buffer too large");
            }
            defers.push({ _bin: value, _length: length, _offset: bytes.length });
            return size + length;
          }
          if (typeof value.toJSON === "function") {
            return _encode(bytes, defers, value.toJSON());
          }
          var keys = [], key = "";
          var allKeys = Object.keys(value);
          for (i = 0, l = allKeys.length; i < l; i++) {
            key = allKeys[i];
            if (value[key] !== void 0 && typeof value[key] !== "function") {
              keys.push(key);
            }
          }
          length = keys.length;
          if (length < 16) {
            bytes.push(length | 128);
            size = 1;
          } else if (length < 65536) {
            bytes.push(222, length >> 8, length);
            size = 3;
          } else if (length < 4294967296) {
            bytes.push(223, length >> 24, length >> 16, length >> 8, length);
            size = 5;
          } else {
            throw new Error("Object too large");
          }
          for (i = 0; i < length; i++) {
            key = keys[i];
            size += _encode(bytes, defers, key);
            size += _encode(bytes, defers, value[key]);
          }
          return size;
        }
        if (type === "boolean") {
          bytes.push(value ? 195 : 194);
          return 1;
        }
        if (type === "undefined") {
          bytes.push(192);
          return 1;
        }
        if (typeof value.toJSON === "function") {
          return _encode(bytes, defers, value.toJSON());
        }
        throw new Error("Could not encode");
      }
      function encode(value) {
        var bytes = [];
        var defers = [];
        var size = _encode(bytes, defers, value);
        var buf = new ArrayBuffer(size);
        var view = new DataView(buf);
        var deferIndex = 0;
        var deferWritten = 0;
        var nextOffset = -1;
        if (defers.length > 0) {
          nextOffset = defers[0]._offset;
        }
        var defer, deferLength = 0, offset = 0;
        for (var i = 0, l = bytes.length; i < l; i++) {
          view.setUint8(deferWritten + i, bytes[i]);
          if (i + 1 !== nextOffset) {
            continue;
          }
          defer = defers[deferIndex];
          deferLength = defer._length;
          offset = deferWritten + nextOffset;
          if (defer._bin) {
            var bin = new Uint8Array(defer._bin);
            for (var j = 0; j < deferLength; j++) {
              view.setUint8(offset + j, bin[j]);
            }
          } else if (defer._str) {
            utf8Write(view, offset, defer._str);
          } else if (defer._float !== void 0) {
            view.setFloat64(offset, defer._float);
          }
          deferIndex++;
          deferWritten += deferLength;
          if (defers[deferIndex]) {
            nextOffset = defers[deferIndex]._offset;
          }
        }
        return buf;
      }
      exports.encode = encode;
    }
  });

  // node_modules/colyseus.js/node_modules/ws/browser.js
  var require_browser = __commonJS({
    "node_modules/colyseus.js/node_modules/ws/browser.js"(exports, module) {
      "use strict";
      module.exports = function() {
        throw new Error(
          "ws does not work in the browser. Browser clients must use the native WebSocket object"
        );
      };
    }
  });

  // node_modules/colyseus.js/lib/transport/WebSocketTransport.js
  var require_WebSocketTransport = __commonJS({
    "node_modules/colyseus.js/lib/transport/WebSocketTransport.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.WebSocketTransport = void 0;
      var ws_1 = __importDefault(require_browser());
      var WebSocket = globalThis.WebSocket || ws_1.default;
      var WebSocketTransport = class {
        constructor(events) {
          this.events = events;
        }
        send(data) {
          if (data instanceof ArrayBuffer) {
            this.ws.send(data);
          } else if (Array.isArray(data)) {
            this.ws.send(new Uint8Array(data).buffer);
          }
        }
        /**
         * @param url URL to connect to
         * @param headers custom headers to send with the connection (only supported in Node.js. Web Browsers do not allow setting custom headers)
         */
        connect(url, headers) {
          try {
            this.ws = new WebSocket(url, { headers, protocols: this.protocols });
          } catch (e) {
            this.ws = new WebSocket(url, this.protocols);
          }
          this.ws.binaryType = "arraybuffer";
          this.ws.onopen = this.events.onopen;
          this.ws.onmessage = this.events.onmessage;
          this.ws.onclose = this.events.onclose;
          this.ws.onerror = this.events.onerror;
        }
        close(code, reason) {
          this.ws.close(code, reason);
        }
        get isOpen() {
          return this.ws.readyState === WebSocket.OPEN;
        }
      };
      exports.WebSocketTransport = WebSocketTransport;
    }
  });

  // node_modules/colyseus.js/lib/Connection.js
  var require_Connection = __commonJS({
    "node_modules/colyseus.js/lib/Connection.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Connection = void 0;
      var WebSocketTransport_1 = require_WebSocketTransport();
      var Connection = class {
        constructor() {
          this.events = {};
          this.transport = new WebSocketTransport_1.WebSocketTransport(this.events);
        }
        send(data) {
          this.transport.send(data);
        }
        connect(url, options) {
          this.transport.connect(url, options);
        }
        close(code, reason) {
          this.transport.close(code, reason);
        }
        get isOpen() {
          return this.transport.isOpen;
        }
      };
      exports.Connection = Connection;
    }
  });

  // node_modules/colyseus.js/lib/Protocol.js
  var require_Protocol = __commonJS({
    "node_modules/colyseus.js/lib/Protocol.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.utf8Length = exports.utf8Read = exports.ErrorCode = exports.Protocol = void 0;
      var Protocol;
      (function(Protocol2) {
        Protocol2[Protocol2["HANDSHAKE"] = 9] = "HANDSHAKE";
        Protocol2[Protocol2["JOIN_ROOM"] = 10] = "JOIN_ROOM";
        Protocol2[Protocol2["ERROR"] = 11] = "ERROR";
        Protocol2[Protocol2["LEAVE_ROOM"] = 12] = "LEAVE_ROOM";
        Protocol2[Protocol2["ROOM_DATA"] = 13] = "ROOM_DATA";
        Protocol2[Protocol2["ROOM_STATE"] = 14] = "ROOM_STATE";
        Protocol2[Protocol2["ROOM_STATE_PATCH"] = 15] = "ROOM_STATE_PATCH";
        Protocol2[Protocol2["ROOM_DATA_SCHEMA"] = 16] = "ROOM_DATA_SCHEMA";
        Protocol2[Protocol2["ROOM_DATA_BYTES"] = 17] = "ROOM_DATA_BYTES";
      })(Protocol = exports.Protocol || (exports.Protocol = {}));
      var ErrorCode;
      (function(ErrorCode2) {
        ErrorCode2[ErrorCode2["MATCHMAKE_NO_HANDLER"] = 4210] = "MATCHMAKE_NO_HANDLER";
        ErrorCode2[ErrorCode2["MATCHMAKE_INVALID_CRITERIA"] = 4211] = "MATCHMAKE_INVALID_CRITERIA";
        ErrorCode2[ErrorCode2["MATCHMAKE_INVALID_ROOM_ID"] = 4212] = "MATCHMAKE_INVALID_ROOM_ID";
        ErrorCode2[ErrorCode2["MATCHMAKE_UNHANDLED"] = 4213] = "MATCHMAKE_UNHANDLED";
        ErrorCode2[ErrorCode2["MATCHMAKE_EXPIRED"] = 4214] = "MATCHMAKE_EXPIRED";
        ErrorCode2[ErrorCode2["AUTH_FAILED"] = 4215] = "AUTH_FAILED";
        ErrorCode2[ErrorCode2["APPLICATION_ERROR"] = 4216] = "APPLICATION_ERROR";
      })(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
      function utf8Read(view, offset) {
        const length = view[offset++];
        var string = "", chr = 0;
        for (var i = offset, end = offset + length; i < end; i++) {
          var byte = view[i];
          if ((byte & 128) === 0) {
            string += String.fromCharCode(byte);
            continue;
          }
          if ((byte & 224) === 192) {
            string += String.fromCharCode((byte & 31) << 6 | view[++i] & 63);
            continue;
          }
          if ((byte & 240) === 224) {
            string += String.fromCharCode((byte & 15) << 12 | (view[++i] & 63) << 6 | (view[++i] & 63) << 0);
            continue;
          }
          if ((byte & 248) === 240) {
            chr = (byte & 7) << 18 | (view[++i] & 63) << 12 | (view[++i] & 63) << 6 | (view[++i] & 63) << 0;
            if (chr >= 65536) {
              chr -= 65536;
              string += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
            } else {
              string += String.fromCharCode(chr);
            }
            continue;
          }
          throw new Error("Invalid byte " + byte.toString(16));
        }
        return string;
      }
      exports.utf8Read = utf8Read;
      function utf8Length(str = "") {
        let c = 0;
        let length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
          c = str.charCodeAt(i);
          if (c < 128) {
            length += 1;
          } else if (c < 2048) {
            length += 2;
          } else if (c < 55296 || c >= 57344) {
            length += 3;
          } else {
            i++;
            length += 4;
          }
        }
        return length + 1;
      }
      exports.utf8Length = utf8Length;
    }
  });

  // node_modules/colyseus.js/lib/serializer/Serializer.js
  var require_Serializer = __commonJS({
    "node_modules/colyseus.js/lib/serializer/Serializer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getSerializer = exports.registerSerializer = void 0;
      var serializers = {};
      function registerSerializer(id, serializer) {
        serializers[id] = serializer;
      }
      exports.registerSerializer = registerSerializer;
      function getSerializer(id) {
        const serializer = serializers[id];
        if (!serializer) {
          throw new Error("missing serializer: " + id);
        }
        return serializer;
      }
      exports.getSerializer = getSerializer;
    }
  });

  // node_modules/colyseus.js/lib/core/nanoevents.js
  var require_nanoevents = __commonJS({
    "node_modules/colyseus.js/lib/core/nanoevents.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createNanoEvents = void 0;
      var createNanoEvents = () => ({
        emit(event, ...args) {
          let callbacks = this.events[event] || [];
          for (let i = 0, length = callbacks.length; i < length; i++) {
            callbacks[i](...args);
          }
        },
        events: {},
        on(event, cb) {
          var _a;
          ((_a = this.events[event]) === null || _a === void 0 ? void 0 : _a.push(cb)) || (this.events[event] = [cb]);
          return () => {
            var _a2;
            this.events[event] = (_a2 = this.events[event]) === null || _a2 === void 0 ? void 0 : _a2.filter((i) => cb !== i);
          };
        }
      });
      exports.createNanoEvents = createNanoEvents;
    }
  });

  // node_modules/colyseus.js/lib/core/signal.js
  var require_signal = __commonJS({
    "node_modules/colyseus.js/lib/core/signal.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createSignal = exports.EventEmitter = void 0;
      var EventEmitter = class {
        constructor() {
          this.handlers = [];
        }
        register(cb, once = false) {
          this.handlers.push(cb);
          return this;
        }
        invoke(...args) {
          this.handlers.forEach((handler) => handler.apply(this, args));
        }
        invokeAsync(...args) {
          return Promise.all(this.handlers.map((handler) => handler.apply(this, args)));
        }
        remove(cb) {
          const index = this.handlers.indexOf(cb);
          this.handlers[index] = this.handlers[this.handlers.length - 1];
          this.handlers.pop();
        }
        clear() {
          this.handlers = [];
        }
      };
      exports.EventEmitter = EventEmitter;
      function createSignal() {
        const emitter = new EventEmitter();
        function register(cb) {
          return emitter.register(cb, this === null);
        }
        ;
        register.once = (cb) => {
          const callback = function(...args) {
            cb.apply(this, args);
            emitter.remove(callback);
          };
          emitter.register(callback);
        };
        register.remove = (cb) => emitter.remove(cb);
        register.invoke = (...args) => emitter.invoke(...args);
        register.invokeAsync = (...args) => emitter.invokeAsync(...args);
        register.clear = () => emitter.clear();
        return register;
      }
      exports.createSignal = createSignal;
    }
  });

  // node_modules/@colyseus/schema/build/umd/index.js
  var require_umd = __commonJS({
    "node_modules/@colyseus/schema/build/umd/index.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.schema = {}));
      })(exports, (function(exports2) {
        "use strict";
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        function __extends(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
        function __decorate(decorators, target, key, desc) {
          var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
          if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
          else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
          return c > 3 && r && Object.defineProperty(target, key, r), r;
        }
        function __spreadArray(to, from, pack) {
          if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
              if (!ar) ar = Array.prototype.slice.call(from, 0, i);
              ar[i] = from[i];
            }
          }
          return to.concat(ar || Array.prototype.slice.call(from));
        }
        typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
          var e = new Error(message);
          return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
        };
        var SWITCH_TO_STRUCTURE = 255;
        var TYPE_ID = 213;
        exports2.OPERATION = void 0;
        (function(OPERATION) {
          OPERATION[OPERATION["ADD"] = 128] = "ADD";
          OPERATION[OPERATION["REPLACE"] = 0] = "REPLACE";
          OPERATION[OPERATION["DELETE"] = 64] = "DELETE";
          OPERATION[OPERATION["DELETE_AND_ADD"] = 192] = "DELETE_AND_ADD";
          OPERATION[OPERATION["TOUCH"] = 1] = "TOUCH";
          OPERATION[OPERATION["CLEAR"] = 10] = "CLEAR";
        })(exports2.OPERATION || (exports2.OPERATION = {}));
        var ChangeTree = (
          /** @class */
          (function() {
            function ChangeTree2(ref, parent, root) {
              this.changed = false;
              this.changes = /* @__PURE__ */ new Map();
              this.allChanges = /* @__PURE__ */ new Set();
              this.caches = {};
              this.currentCustomOperation = 0;
              this.ref = ref;
              this.setParent(parent, root);
            }
            ChangeTree2.prototype.setParent = function(parent, root, parentIndex) {
              var _this = this;
              if (!this.indexes) {
                this.indexes = this.ref instanceof Schema ? this.ref["_definition"].indexes : {};
              }
              this.parent = parent;
              this.parentIndex = parentIndex;
              if (!root) {
                return;
              }
              this.root = root;
              if (this.ref instanceof Schema) {
                var definition = this.ref["_definition"];
                for (var field in definition.schema) {
                  var value = this.ref[field];
                  if (value && value["$changes"]) {
                    var parentIndex_1 = definition.indexes[field];
                    value["$changes"].setParent(this.ref, root, parentIndex_1);
                  }
                }
              } else if (typeof this.ref === "object") {
                this.ref.forEach(function(value2, key) {
                  if (value2 instanceof Schema) {
                    var changeTreee = value2["$changes"];
                    var parentIndex_2 = _this.ref["$changes"].indexes[key];
                    changeTreee.setParent(_this.ref, _this.root, parentIndex_2);
                  }
                });
              }
            };
            ChangeTree2.prototype.operation = function(op) {
              this.changes.set(--this.currentCustomOperation, op);
            };
            ChangeTree2.prototype.change = function(fieldName, operation) {
              if (operation === void 0) {
                operation = exports2.OPERATION.ADD;
              }
              var index = typeof fieldName === "number" ? fieldName : this.indexes[fieldName];
              this.assertValidIndex(index, fieldName);
              var previousChange = this.changes.get(index);
              if (!previousChange || previousChange.op === exports2.OPERATION.DELETE || previousChange.op === exports2.OPERATION.TOUCH) {
                this.changes.set(index, {
                  op: !previousChange ? operation : previousChange.op === exports2.OPERATION.DELETE ? exports2.OPERATION.DELETE_AND_ADD : operation,
                  // : OPERATION.REPLACE,
                  index
                });
              }
              this.allChanges.add(index);
              this.changed = true;
              this.touchParents();
            };
            ChangeTree2.prototype.touch = function(fieldName) {
              var index = typeof fieldName === "number" ? fieldName : this.indexes[fieldName];
              this.assertValidIndex(index, fieldName);
              if (!this.changes.has(index)) {
                this.changes.set(index, { op: exports2.OPERATION.TOUCH, index });
              }
              this.allChanges.add(index);
              this.touchParents();
            };
            ChangeTree2.prototype.touchParents = function() {
              if (this.parent) {
                this.parent["$changes"].touch(this.parentIndex);
              }
            };
            ChangeTree2.prototype.getType = function(index) {
              if (this.ref["_definition"]) {
                var definition = this.ref["_definition"];
                return definition.schema[definition.fieldsByIndex[index]];
              } else {
                var definition = this.parent["_definition"];
                var parentType = definition.schema[definition.fieldsByIndex[this.parentIndex]];
                return Object.values(parentType)[0];
              }
            };
            ChangeTree2.prototype.getChildrenFilter = function() {
              var childFilters = this.parent["_definition"].childFilters;
              return childFilters && childFilters[this.parentIndex];
            };
            ChangeTree2.prototype.getValue = function(index) {
              return this.ref["getByIndex"](index);
            };
            ChangeTree2.prototype.delete = function(fieldName) {
              var index = typeof fieldName === "number" ? fieldName : this.indexes[fieldName];
              if (index === void 0) {
                console.warn("@colyseus/schema ".concat(this.ref.constructor.name, ": trying to delete non-existing index: ").concat(fieldName, " (").concat(index, ")"));
                return;
              }
              var previousValue = this.getValue(index);
              this.changes.set(index, { op: exports2.OPERATION.DELETE, index });
              this.allChanges.delete(index);
              delete this.caches[index];
              if (previousValue && previousValue["$changes"]) {
                previousValue["$changes"].parent = void 0;
              }
              this.changed = true;
              this.touchParents();
            };
            ChangeTree2.prototype.discard = function(changed, discardAll) {
              var _this = this;
              if (changed === void 0) {
                changed = false;
              }
              if (discardAll === void 0) {
                discardAll = false;
              }
              if (!(this.ref instanceof Schema)) {
                this.changes.forEach(function(change) {
                  if (change.op === exports2.OPERATION.DELETE) {
                    var index = _this.ref["getIndex"](change.index);
                    delete _this.indexes[index];
                  }
                });
              }
              this.changes.clear();
              this.changed = changed;
              if (discardAll) {
                this.allChanges.clear();
              }
              this.currentCustomOperation = 0;
            };
            ChangeTree2.prototype.discardAll = function() {
              var _this = this;
              this.changes.forEach(function(change) {
                var value = _this.getValue(change.index);
                if (value && value["$changes"]) {
                  value["$changes"].discardAll();
                }
              });
              this.discard();
            };
            ChangeTree2.prototype.cache = function(field, cachedBytes) {
              this.caches[field] = cachedBytes;
            };
            ChangeTree2.prototype.clone = function() {
              return new ChangeTree2(this.ref, this.parent, this.root);
            };
            ChangeTree2.prototype.ensureRefId = function() {
              if (this.refId !== void 0) {
                return;
              }
              this.refId = this.root.getNextUniqueId();
            };
            ChangeTree2.prototype.assertValidIndex = function(index, fieldName) {
              if (index === void 0) {
                throw new Error('ChangeTree: missing index for field "'.concat(fieldName, '"'));
              }
            };
            return ChangeTree2;
          })()
        );
        function addCallback($callbacks, op, callback, existing) {
          if (!$callbacks[op]) {
            $callbacks[op] = [];
          }
          $callbacks[op].push(callback);
          existing === null || existing === void 0 ? void 0 : existing.forEach(function(item, key) {
            return callback(item, key);
          });
          return function() {
            return spliceOne($callbacks[op], $callbacks[op].indexOf(callback));
          };
        }
        function removeChildRefs(changes) {
          var _this = this;
          var needRemoveRef = typeof this.$changes.getType() !== "string";
          this.$items.forEach(function(item, key) {
            changes.push({
              refId: _this.$changes.refId,
              op: exports2.OPERATION.DELETE,
              field: key,
              value: void 0,
              previousValue: item
            });
            if (needRemoveRef) {
              _this.$changes.root.removeRef(item["$changes"].refId);
            }
          });
        }
        function spliceOne(arr, index) {
          if (index === -1 || index >= arr.length) {
            return false;
          }
          var len = arr.length - 1;
          for (var i = index; i < len; i++) {
            arr[i] = arr[i + 1];
          }
          arr.length = len;
          return true;
        }
        var DEFAULT_SORT = function(a, b) {
          var A = a.toString();
          var B = b.toString();
          if (A < B)
            return -1;
          else if (A > B)
            return 1;
          else
            return 0;
        };
        function getArrayProxy(value) {
          value["$proxy"] = true;
          value = new Proxy(value, {
            get: function(obj, prop) {
              if (typeof prop !== "symbol" && !isNaN(prop)) {
                return obj.at(prop);
              } else {
                return obj[prop];
              }
            },
            set: function(obj, prop, setValue) {
              if (typeof prop !== "symbol" && !isNaN(prop)) {
                var indexes = Array.from(obj["$items"].keys());
                var key = parseInt(indexes[prop] || prop);
                if (setValue === void 0 || setValue === null) {
                  obj.deleteAt(key);
                } else {
                  obj.setAt(key, setValue);
                }
              } else {
                obj[prop] = setValue;
              }
              return true;
            },
            deleteProperty: function(obj, prop) {
              if (typeof prop === "number") {
                obj.deleteAt(prop);
              } else {
                delete obj[prop];
              }
              return true;
            },
            has: function(obj, key) {
              if (typeof key !== "symbol" && !isNaN(Number(key))) {
                return obj["$items"].has(Number(key));
              }
              return Reflect.has(obj, key);
            }
          });
          return value;
        }
        var ArraySchema = (
          /** @class */
          (function() {
            function ArraySchema2() {
              var items = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
              }
              this.$changes = new ChangeTree(this);
              this.$items = /* @__PURE__ */ new Map();
              this.$indexes = /* @__PURE__ */ new Map();
              this.$refId = 0;
              this.push.apply(this, items);
            }
            ArraySchema2.prototype.onAdd = function(callback, triggerAll) {
              if (triggerAll === void 0) {
                triggerAll = true;
              }
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.ADD, callback, triggerAll ? this.$items : void 0);
            };
            ArraySchema2.prototype.onRemove = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.DELETE, callback);
            };
            ArraySchema2.prototype.onChange = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.REPLACE, callback);
            };
            ArraySchema2.is = function(type2) {
              return (
                // type format: ["string"]
                Array.isArray(type2) || // type format: { array: "string" }
                type2["array"] !== void 0
              );
            };
            Object.defineProperty(ArraySchema2.prototype, "length", {
              get: function() {
                return this.$items.size;
              },
              set: function(value) {
                if (value === 0) {
                  this.clear();
                } else {
                  this.splice(value, this.length - value);
                }
              },
              enumerable: false,
              configurable: true
            });
            ArraySchema2.prototype.push = function() {
              var _this = this;
              var values = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                values[_i] = arguments[_i];
              }
              var lastIndex;
              values.forEach(function(value) {
                lastIndex = _this.$refId++;
                _this.setAt(lastIndex, value);
              });
              return lastIndex;
            };
            ArraySchema2.prototype.pop = function() {
              var key = Array.from(this.$indexes.values()).pop();
              if (key === void 0) {
                return void 0;
              }
              this.$changes.delete(key);
              this.$indexes.delete(key);
              var value = this.$items.get(key);
              this.$items.delete(key);
              return value;
            };
            ArraySchema2.prototype.at = function(index) {
              index = Math.trunc(index) || 0;
              if (index < 0)
                index += this.length;
              if (index < 0 || index >= this.length)
                return void 0;
              var key = Array.from(this.$items.keys())[index];
              return this.$items.get(key);
            };
            ArraySchema2.prototype.setAt = function(index, value) {
              var _a, _b;
              if (value === void 0 || value === null) {
                console.error("ArraySchema items cannot be null nor undefined; Use `deleteAt(index)` instead.");
                return;
              }
              if (this.$items.get(index) === value) {
                return;
              }
              if (value["$changes"] !== void 0) {
                value["$changes"].setParent(this, this.$changes.root, index);
              }
              var operation = (_b = (_a = this.$changes.indexes[index]) === null || _a === void 0 ? void 0 : _a.op) !== null && _b !== void 0 ? _b : exports2.OPERATION.ADD;
              this.$changes.indexes[index] = index;
              this.$indexes.set(index, index);
              this.$items.set(index, value);
              this.$changes.change(index, operation);
            };
            ArraySchema2.prototype.deleteAt = function(index) {
              var key = Array.from(this.$items.keys())[index];
              if (key === void 0) {
                return false;
              }
              return this.$deleteAt(key);
            };
            ArraySchema2.prototype.$deleteAt = function(index) {
              this.$changes.delete(index);
              this.$indexes.delete(index);
              return this.$items.delete(index);
            };
            ArraySchema2.prototype.clear = function(changes) {
              this.$changes.discard(true, true);
              this.$changes.indexes = {};
              this.$indexes.clear();
              if (changes) {
                removeChildRefs.call(this, changes);
              }
              this.$items.clear();
              this.$changes.operation({ index: 0, op: exports2.OPERATION.CLEAR });
              this.$changes.touchParents();
            };
            ArraySchema2.prototype.concat = function() {
              var _a;
              var items = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
              }
              return new (ArraySchema2.bind.apply(ArraySchema2, __spreadArray([void 0], (_a = Array.from(this.$items.values())).concat.apply(_a, items), false)))();
            };
            ArraySchema2.prototype.join = function(separator) {
              return Array.from(this.$items.values()).join(separator);
            };
            ArraySchema2.prototype.reverse = function() {
              var _this = this;
              var indexes = Array.from(this.$items.keys());
              var reversedItems = Array.from(this.$items.values()).reverse();
              reversedItems.forEach(function(item, i) {
                _this.setAt(indexes[i], item);
              });
              return this;
            };
            ArraySchema2.prototype.shift = function() {
              var indexes = Array.from(this.$items.keys());
              var shiftAt = indexes.shift();
              if (shiftAt === void 0) {
                return void 0;
              }
              var value = this.$items.get(shiftAt);
              this.$deleteAt(shiftAt);
              return value;
            };
            ArraySchema2.prototype.slice = function(start, end) {
              var sliced = new ArraySchema2();
              sliced.push.apply(sliced, Array.from(this.$items.values()).slice(start, end));
              return sliced;
            };
            ArraySchema2.prototype.sort = function(compareFn) {
              var _this = this;
              if (compareFn === void 0) {
                compareFn = DEFAULT_SORT;
              }
              var indexes = Array.from(this.$items.keys());
              var sortedItems = Array.from(this.$items.values()).sort(compareFn);
              sortedItems.forEach(function(item, i) {
                _this.setAt(indexes[i], item);
              });
              return this;
            };
            ArraySchema2.prototype.splice = function(start, deleteCount) {
              if (deleteCount === void 0) {
                deleteCount = this.length - start;
              }
              var items = [];
              for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
              }
              var indexes = Array.from(this.$items.keys());
              var removedItems = [];
              for (var i = start; i < start + deleteCount; i++) {
                removedItems.push(this.$items.get(indexes[i]));
                this.$deleteAt(indexes[i]);
              }
              for (var i = 0; i < items.length; i++) {
                this.setAt(start + i, items[i]);
              }
              return removedItems;
            };
            ArraySchema2.prototype.unshift = function() {
              var _this = this;
              var items = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
              }
              var length = this.length;
              var addedLength = items.length;
              var previousValues = Array.from(this.$items.values());
              items.forEach(function(item, i) {
                _this.setAt(i, item);
              });
              previousValues.forEach(function(previousValue, i) {
                _this.setAt(addedLength + i, previousValue);
              });
              return length + addedLength;
            };
            ArraySchema2.prototype.indexOf = function(searchElement, fromIndex) {
              return Array.from(this.$items.values()).indexOf(searchElement, fromIndex);
            };
            ArraySchema2.prototype.lastIndexOf = function(searchElement, fromIndex) {
              if (fromIndex === void 0) {
                fromIndex = this.length - 1;
              }
              return Array.from(this.$items.values()).lastIndexOf(searchElement, fromIndex);
            };
            ArraySchema2.prototype.every = function(callbackfn, thisArg) {
              return Array.from(this.$items.values()).every(callbackfn, thisArg);
            };
            ArraySchema2.prototype.some = function(callbackfn, thisArg) {
              return Array.from(this.$items.values()).some(callbackfn, thisArg);
            };
            ArraySchema2.prototype.forEach = function(callbackfn, thisArg) {
              Array.from(this.$items.values()).forEach(callbackfn, thisArg);
            };
            ArraySchema2.prototype.map = function(callbackfn, thisArg) {
              return Array.from(this.$items.values()).map(callbackfn, thisArg);
            };
            ArraySchema2.prototype.filter = function(callbackfn, thisArg) {
              return Array.from(this.$items.values()).filter(callbackfn, thisArg);
            };
            ArraySchema2.prototype.reduce = function(callbackfn, initialValue) {
              return Array.prototype.reduce.apply(Array.from(this.$items.values()), arguments);
            };
            ArraySchema2.prototype.reduceRight = function(callbackfn, initialValue) {
              return Array.prototype.reduceRight.apply(Array.from(this.$items.values()), arguments);
            };
            ArraySchema2.prototype.find = function(predicate, thisArg) {
              return Array.from(this.$items.values()).find(predicate, thisArg);
            };
            ArraySchema2.prototype.findIndex = function(predicate, thisArg) {
              return Array.from(this.$items.values()).findIndex(predicate, thisArg);
            };
            ArraySchema2.prototype.fill = function(value, start, end) {
              throw new Error("ArraySchema#fill() not implemented");
            };
            ArraySchema2.prototype.copyWithin = function(target, start, end) {
              throw new Error("ArraySchema#copyWithin() not implemented");
            };
            ArraySchema2.prototype.toString = function() {
              return this.$items.toString();
            };
            ArraySchema2.prototype.toLocaleString = function() {
              return this.$items.toLocaleString();
            };
            ArraySchema2.prototype[Symbol.iterator] = function() {
              return Array.from(this.$items.values())[Symbol.iterator]();
            };
            Object.defineProperty(ArraySchema2, Symbol.species, {
              get: function() {
                return ArraySchema2;
              },
              enumerable: false,
              configurable: true
            });
            ArraySchema2.prototype.entries = function() {
              return this.$items.entries();
            };
            ArraySchema2.prototype.keys = function() {
              return this.$items.keys();
            };
            ArraySchema2.prototype.values = function() {
              return this.$items.values();
            };
            ArraySchema2.prototype.includes = function(searchElement, fromIndex) {
              return Array.from(this.$items.values()).includes(searchElement, fromIndex);
            };
            ArraySchema2.prototype.flatMap = function(callback, thisArg) {
              throw new Error("ArraySchema#flatMap() is not supported.");
            };
            ArraySchema2.prototype.flat = function(depth) {
              throw new Error("ArraySchema#flat() is not supported.");
            };
            ArraySchema2.prototype.findLast = function() {
              var arr = Array.from(this.$items.values());
              return arr.findLast.apply(arr, arguments);
            };
            ArraySchema2.prototype.findLastIndex = function() {
              var arr = Array.from(this.$items.values());
              return arr.findLastIndex.apply(arr, arguments);
            };
            ArraySchema2.prototype.with = function(index, value) {
              var copy = Array.from(this.$items.values());
              copy[index] = value;
              return new (ArraySchema2.bind.apply(ArraySchema2, __spreadArray([void 0], copy, false)))();
            };
            ArraySchema2.prototype.toReversed = function() {
              return Array.from(this.$items.values()).reverse();
            };
            ArraySchema2.prototype.toSorted = function(compareFn) {
              return Array.from(this.$items.values()).sort(compareFn);
            };
            ArraySchema2.prototype.toSpliced = function(start, deleteCount) {
              var copy = Array.from(this.$items.values());
              return copy.toSpliced.apply(copy, arguments);
            };
            ArraySchema2.prototype.setIndex = function(index, key) {
              this.$indexes.set(index, key);
            };
            ArraySchema2.prototype.getIndex = function(index) {
              return this.$indexes.get(index);
            };
            ArraySchema2.prototype.getByIndex = function(index) {
              return this.$items.get(this.$indexes.get(index));
            };
            ArraySchema2.prototype.deleteByIndex = function(index) {
              var key = this.$indexes.get(index);
              this.$items.delete(key);
              this.$indexes.delete(index);
            };
            ArraySchema2.prototype.toArray = function() {
              return Array.from(this.$items.values());
            };
            ArraySchema2.prototype.toJSON = function() {
              return this.toArray().map(function(value) {
                return typeof value["toJSON"] === "function" ? value["toJSON"]() : value;
              });
            };
            ArraySchema2.prototype.clone = function(isDecoding) {
              var cloned;
              if (isDecoding) {
                cloned = new (ArraySchema2.bind.apply(ArraySchema2, __spreadArray([void 0], Array.from(this.$items.values()), false)))();
              } else {
                cloned = new (ArraySchema2.bind.apply(ArraySchema2, __spreadArray([void 0], this.map(function(item) {
                  return item["$changes"] ? item.clone() : item;
                }), false)))();
              }
              return cloned;
            };
            return ArraySchema2;
          })()
        );
        function getMapProxy(value) {
          value["$proxy"] = true;
          value = new Proxy(value, {
            get: function(obj, prop) {
              if (typeof prop !== "symbol" && // accessing properties
              typeof obj[prop] === "undefined") {
                return obj.get(prop);
              } else {
                return obj[prop];
              }
            },
            set: function(obj, prop, setValue) {
              if (typeof prop !== "symbol" && (prop.indexOf("$") === -1 && prop !== "onAdd" && prop !== "onRemove" && prop !== "onChange")) {
                obj.set(prop, setValue);
              } else {
                obj[prop] = setValue;
              }
              return true;
            },
            deleteProperty: function(obj, prop) {
              obj.delete(prop);
              return true;
            }
          });
          return value;
        }
        var MapSchema = (
          /** @class */
          (function() {
            function MapSchema2(initialValues) {
              var _this = this;
              this.$changes = new ChangeTree(this);
              this.$items = /* @__PURE__ */ new Map();
              this.$indexes = /* @__PURE__ */ new Map();
              this.$refId = 0;
              if (initialValues) {
                if (initialValues instanceof Map || initialValues instanceof MapSchema2) {
                  initialValues.forEach(function(v, k2) {
                    return _this.set(k2, v);
                  });
                } else {
                  for (var k in initialValues) {
                    this.set(k, initialValues[k]);
                  }
                }
              }
            }
            MapSchema2.prototype.onAdd = function(callback, triggerAll) {
              if (triggerAll === void 0) {
                triggerAll = true;
              }
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.ADD, callback, triggerAll ? this.$items : void 0);
            };
            MapSchema2.prototype.onRemove = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.DELETE, callback);
            };
            MapSchema2.prototype.onChange = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.REPLACE, callback);
            };
            MapSchema2.is = function(type2) {
              return type2["map"] !== void 0;
            };
            MapSchema2.prototype[Symbol.iterator] = function() {
              return this.$items[Symbol.iterator]();
            };
            Object.defineProperty(MapSchema2.prototype, Symbol.toStringTag, {
              get: function() {
                return this.$items[Symbol.toStringTag];
              },
              enumerable: false,
              configurable: true
            });
            Object.defineProperty(MapSchema2, Symbol.species, {
              get: function() {
                return MapSchema2;
              },
              enumerable: false,
              configurable: true
            });
            MapSchema2.prototype.set = function(key, value) {
              if (value === void 0 || value === null) {
                throw new Error("MapSchema#set('".concat(key, "', ").concat(value, "): trying to set ").concat(value, " value on '").concat(key, "'."));
              }
              key = key.toString();
              var hasIndex = typeof this.$changes.indexes[key] !== "undefined";
              var index = hasIndex ? this.$changes.indexes[key] : this.$refId++;
              var operation = hasIndex ? exports2.OPERATION.REPLACE : exports2.OPERATION.ADD;
              var isRef = value["$changes"] !== void 0;
              if (isRef) {
                value["$changes"].setParent(this, this.$changes.root, index);
              }
              if (!hasIndex) {
                this.$changes.indexes[key] = index;
                this.$indexes.set(index, key);
              } else if (!isRef && this.$items.get(key) === value) {
                return;
              } else if (isRef && // if is schema, force ADD operation if value differ from previous one.
              this.$items.get(key) !== value) {
                operation = exports2.OPERATION.ADD;
              }
              this.$items.set(key, value);
              this.$changes.change(key, operation);
              return this;
            };
            MapSchema2.prototype.get = function(key) {
              return this.$items.get(key);
            };
            MapSchema2.prototype.delete = function(key) {
              this.$changes.delete(key.toString());
              return this.$items.delete(key);
            };
            MapSchema2.prototype.clear = function(changes) {
              this.$changes.discard(true, true);
              this.$changes.indexes = {};
              this.$indexes.clear();
              if (changes) {
                removeChildRefs.call(this, changes);
              }
              this.$items.clear();
              this.$changes.operation({ index: 0, op: exports2.OPERATION.CLEAR });
              this.$changes.touchParents();
            };
            MapSchema2.prototype.has = function(key) {
              return this.$items.has(key);
            };
            MapSchema2.prototype.forEach = function(callbackfn) {
              this.$items.forEach(callbackfn);
            };
            MapSchema2.prototype.entries = function() {
              return this.$items.entries();
            };
            MapSchema2.prototype.keys = function() {
              return this.$items.keys();
            };
            MapSchema2.prototype.values = function() {
              return this.$items.values();
            };
            Object.defineProperty(MapSchema2.prototype, "size", {
              get: function() {
                return this.$items.size;
              },
              enumerable: false,
              configurable: true
            });
            MapSchema2.prototype.setIndex = function(index, key) {
              this.$indexes.set(index, key);
            };
            MapSchema2.prototype.getIndex = function(index) {
              return this.$indexes.get(index);
            };
            MapSchema2.prototype.getByIndex = function(index) {
              return this.$items.get(this.$indexes.get(index));
            };
            MapSchema2.prototype.deleteByIndex = function(index) {
              var key = this.$indexes.get(index);
              this.$items.delete(key);
              this.$indexes.delete(index);
            };
            MapSchema2.prototype.toJSON = function() {
              var map = {};
              this.forEach(function(value, key) {
                map[key] = typeof value["toJSON"] === "function" ? value["toJSON"]() : value;
              });
              return map;
            };
            MapSchema2.prototype.clone = function(isDecoding) {
              var cloned;
              if (isDecoding) {
                cloned = Object.assign(new MapSchema2(), this);
              } else {
                cloned = new MapSchema2();
                this.forEach(function(value, key) {
                  if (value["$changes"]) {
                    cloned.set(key, value["clone"]());
                  } else {
                    cloned.set(key, value);
                  }
                });
              }
              return cloned;
            };
            return MapSchema2;
          })()
        );
        var registeredTypes = {};
        function registerType(identifier, definition) {
          registeredTypes[identifier] = definition;
        }
        function getType(identifier) {
          return registeredTypes[identifier];
        }
        var SchemaDefinition = (
          /** @class */
          (function() {
            function SchemaDefinition2() {
              this.indexes = {};
              this.fieldsByIndex = {};
              this.deprecated = {};
              this.descriptors = {};
            }
            SchemaDefinition2.create = function(parent) {
              var definition = new SchemaDefinition2();
              definition.schema = Object.assign({}, parent && parent.schema || {});
              definition.indexes = Object.assign({}, parent && parent.indexes || {});
              definition.fieldsByIndex = Object.assign({}, parent && parent.fieldsByIndex || {});
              definition.descriptors = Object.assign({}, parent && parent.descriptors || {});
              definition.deprecated = Object.assign({}, parent && parent.deprecated || {});
              return definition;
            };
            SchemaDefinition2.prototype.addField = function(field, type2) {
              var index = this.getNextFieldIndex();
              this.fieldsByIndex[index] = field;
              this.indexes[field] = index;
              this.schema[field] = Array.isArray(type2) ? { array: type2[0] } : type2;
            };
            SchemaDefinition2.prototype.hasField = function(field) {
              return this.indexes[field] !== void 0;
            };
            SchemaDefinition2.prototype.addFilter = function(field, cb) {
              if (!this.filters) {
                this.filters = {};
                this.indexesWithFilters = [];
              }
              this.filters[this.indexes[field]] = cb;
              this.indexesWithFilters.push(this.indexes[field]);
              return true;
            };
            SchemaDefinition2.prototype.addChildrenFilter = function(field, cb) {
              var index = this.indexes[field];
              var type2 = this.schema[field];
              if (getType(Object.keys(type2)[0])) {
                if (!this.childFilters) {
                  this.childFilters = {};
                }
                this.childFilters[index] = cb;
                return true;
              } else {
                console.warn("@filterChildren: field '".concat(field, "' can't have children. Ignoring filter."));
              }
            };
            SchemaDefinition2.prototype.getChildrenFilter = function(field) {
              return this.childFilters && this.childFilters[this.indexes[field]];
            };
            SchemaDefinition2.prototype.getNextFieldIndex = function() {
              return Object.keys(this.schema || {}).length;
            };
            return SchemaDefinition2;
          })()
        );
        function hasFilter(klass) {
          return klass._context && klass._context.useFilters;
        }
        var Context = (
          /** @class */
          (function() {
            function Context2() {
              this.types = {};
              this.schemas = /* @__PURE__ */ new Map();
              this.useFilters = false;
            }
            Context2.prototype.has = function(schema) {
              return this.schemas.has(schema);
            };
            Context2.prototype.get = function(typeid) {
              return this.types[typeid];
            };
            Context2.prototype.add = function(schema, typeid) {
              if (typeid === void 0) {
                typeid = this.schemas.size;
              }
              schema._definition = SchemaDefinition.create(schema._definition);
              schema._typeid = typeid;
              this.types[typeid] = schema;
              this.schemas.set(schema, typeid);
            };
            Context2.create = function(options) {
              if (options === void 0) {
                options = {};
              }
              return function(definition) {
                if (!options.context) {
                  options.context = new Context2();
                }
                return type(definition, options);
              };
            };
            return Context2;
          })()
        );
        var globalContext = new Context();
        function type(type2, options) {
          if (options === void 0) {
            options = {};
          }
          return function(target, field) {
            var context = options.context || globalContext;
            var constructor = target.constructor;
            constructor._context = context;
            if (!type2) {
              throw new Error("".concat(constructor.name, ': @type() reference provided for "').concat(field, `" is undefined. Make sure you don't have any circular dependencies.`));
            }
            if (!context.has(constructor)) {
              context.add(constructor);
            }
            var definition = constructor._definition;
            definition.addField(field, type2);
            if (definition.descriptors[field]) {
              if (definition.deprecated[field]) {
                return;
              } else {
                try {
                  throw new Error("@colyseus/schema: Duplicate '".concat(field, "' definition on '").concat(constructor.name, "'.\nCheck @type() annotation"));
                } catch (e) {
                  var definitionAtLine = e.stack.split("\n")[4].trim();
                  throw new Error("".concat(e.message, " ").concat(definitionAtLine));
                }
              }
            }
            var isArray = ArraySchema.is(type2);
            var isMap = !isArray && MapSchema.is(type2);
            if (typeof type2 !== "string" && !Schema.is(type2)) {
              var childType = Object.values(type2)[0];
              if (typeof childType !== "string" && !context.has(childType)) {
                context.add(childType);
              }
            }
            if (options.manual) {
              definition.descriptors[field] = {
                enumerable: true,
                configurable: true,
                writable: true
              };
              return;
            }
            var fieldCached = "_".concat(field);
            definition.descriptors[fieldCached] = {
              enumerable: false,
              configurable: false,
              writable: true
            };
            definition.descriptors[field] = {
              get: function() {
                return this[fieldCached];
              },
              set: function(value) {
                if (value === this[fieldCached]) {
                  return;
                }
                if (value !== void 0 && value !== null) {
                  if (isArray && !(value instanceof ArraySchema)) {
                    value = new (ArraySchema.bind.apply(ArraySchema, __spreadArray([void 0], value, false)))();
                  }
                  if (isMap && !(value instanceof MapSchema)) {
                    value = new MapSchema(value);
                  }
                  if (value["$proxy"] === void 0) {
                    if (isMap) {
                      value = getMapProxy(value);
                    } else if (isArray) {
                      value = getArrayProxy(value);
                    }
                  }
                  this.$changes.change(field);
                  if (value["$changes"]) {
                    value["$changes"].setParent(this, this.$changes.root, this._definition.indexes[field]);
                  }
                } else if (this[fieldCached] !== void 0) {
                  this.$changes.delete(field);
                }
                this[fieldCached] = value;
              },
              enumerable: true,
              configurable: true
            };
          };
        }
        function filter(cb) {
          return function(target, field) {
            var constructor = target.constructor;
            var definition = constructor._definition;
            if (definition.addFilter(field, cb)) {
              constructor._context.useFilters = true;
            }
          };
        }
        function filterChildren(cb) {
          return function(target, field) {
            var constructor = target.constructor;
            var definition = constructor._definition;
            if (definition.addChildrenFilter(field, cb)) {
              constructor._context.useFilters = true;
            }
          };
        }
        function deprecated(throws) {
          if (throws === void 0) {
            throws = true;
          }
          return function(target, field) {
            var constructor = target.constructor;
            var definition = constructor._definition;
            definition.deprecated[field] = true;
            if (throws) {
              definition.descriptors[field] = {
                get: function() {
                  throw new Error("".concat(field, " is deprecated."));
                },
                set: function(value) {
                },
                enumerable: false,
                configurable: true
              };
            }
          };
        }
        function defineTypes(target, fields, options) {
          if (options === void 0) {
            options = {};
          }
          if (!options.context) {
            options.context = target._context || options.context || globalContext;
          }
          for (var field in fields) {
            type(fields[field], options)(target.prototype, field);
          }
          return target;
        }
        function utf8Length(str) {
          var c = 0, length = 0;
          for (var i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 128) {
              length += 1;
            } else if (c < 2048) {
              length += 2;
            } else if (c < 55296 || c >= 57344) {
              length += 3;
            } else {
              i++;
              length += 4;
            }
          }
          return length;
        }
        function utf8Write(view, offset, str) {
          var c = 0;
          for (var i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 128) {
              view[offset++] = c;
            } else if (c < 2048) {
              view[offset++] = 192 | c >> 6;
              view[offset++] = 128 | c & 63;
            } else if (c < 55296 || c >= 57344) {
              view[offset++] = 224 | c >> 12;
              view[offset++] = 128 | c >> 6 & 63;
              view[offset++] = 128 | c & 63;
            } else {
              i++;
              c = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
              view[offset++] = 240 | c >> 18;
              view[offset++] = 128 | c >> 12 & 63;
              view[offset++] = 128 | c >> 6 & 63;
              view[offset++] = 128 | c & 63;
            }
          }
        }
        function int8$1(bytes, value) {
          bytes.push(value & 255);
        }
        function uint8$1(bytes, value) {
          bytes.push(value & 255);
        }
        function int16$1(bytes, value) {
          bytes.push(value & 255);
          bytes.push(value >> 8 & 255);
        }
        function uint16$1(bytes, value) {
          bytes.push(value & 255);
          bytes.push(value >> 8 & 255);
        }
        function int32$1(bytes, value) {
          bytes.push(value & 255);
          bytes.push(value >> 8 & 255);
          bytes.push(value >> 16 & 255);
          bytes.push(value >> 24 & 255);
        }
        function uint32$1(bytes, value) {
          var b4 = value >> 24;
          var b3 = value >> 16;
          var b2 = value >> 8;
          var b1 = value;
          bytes.push(b1 & 255);
          bytes.push(b2 & 255);
          bytes.push(b3 & 255);
          bytes.push(b4 & 255);
        }
        function int64$1(bytes, value) {
          var high = Math.floor(value / Math.pow(2, 32));
          var low = value >>> 0;
          uint32$1(bytes, low);
          uint32$1(bytes, high);
        }
        function uint64$1(bytes, value) {
          var high = value / Math.pow(2, 32) >> 0;
          var low = value >>> 0;
          uint32$1(bytes, low);
          uint32$1(bytes, high);
        }
        function float32$1(bytes, value) {
          writeFloat32(bytes, value);
        }
        function float64$1(bytes, value) {
          writeFloat64(bytes, value);
        }
        var _int32$1 = new Int32Array(2);
        var _float32$1 = new Float32Array(_int32$1.buffer);
        var _float64$1 = new Float64Array(_int32$1.buffer);
        function writeFloat32(bytes, value) {
          _float32$1[0] = value;
          int32$1(bytes, _int32$1[0]);
        }
        function writeFloat64(bytes, value) {
          _float64$1[0] = value;
          int32$1(bytes, _int32$1[0]);
          int32$1(bytes, _int32$1[1]);
        }
        function boolean$1(bytes, value) {
          return uint8$1(bytes, value ? 1 : 0);
        }
        function string$1(bytes, value) {
          if (!value) {
            value = "";
          }
          var length = utf8Length(value);
          var size = 0;
          if (length < 32) {
            bytes.push(length | 160);
            size = 1;
          } else if (length < 256) {
            bytes.push(217);
            uint8$1(bytes, length);
            size = 2;
          } else if (length < 65536) {
            bytes.push(218);
            uint16$1(bytes, length);
            size = 3;
          } else if (length < 4294967296) {
            bytes.push(219);
            uint32$1(bytes, length);
            size = 5;
          } else {
            throw new Error("String too long");
          }
          utf8Write(bytes, bytes.length, value);
          return size + length;
        }
        function number$1(bytes, value) {
          if (isNaN(value)) {
            return number$1(bytes, 0);
          } else if (!isFinite(value)) {
            return number$1(bytes, value > 0 ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER);
          } else if (value !== (value | 0)) {
            bytes.push(203);
            writeFloat64(bytes, value);
            return 9;
          }
          if (value >= 0) {
            if (value < 128) {
              uint8$1(bytes, value);
              return 1;
            }
            if (value < 256) {
              bytes.push(204);
              uint8$1(bytes, value);
              return 2;
            }
            if (value < 65536) {
              bytes.push(205);
              uint16$1(bytes, value);
              return 3;
            }
            if (value < 4294967296) {
              bytes.push(206);
              uint32$1(bytes, value);
              return 5;
            }
            bytes.push(207);
            uint64$1(bytes, value);
            return 9;
          } else {
            if (value >= -32) {
              bytes.push(224 | value + 32);
              return 1;
            }
            if (value >= -128) {
              bytes.push(208);
              int8$1(bytes, value);
              return 2;
            }
            if (value >= -32768) {
              bytes.push(209);
              int16$1(bytes, value);
              return 3;
            }
            if (value >= -2147483648) {
              bytes.push(210);
              int32$1(bytes, value);
              return 5;
            }
            bytes.push(211);
            int64$1(bytes, value);
            return 9;
          }
        }
        var encode = /* @__PURE__ */ Object.freeze({
          __proto__: null,
          boolean: boolean$1,
          float32: float32$1,
          float64: float64$1,
          int16: int16$1,
          int32: int32$1,
          int64: int64$1,
          int8: int8$1,
          number: number$1,
          string: string$1,
          uint16: uint16$1,
          uint32: uint32$1,
          uint64: uint64$1,
          uint8: uint8$1,
          utf8Write,
          writeFloat32,
          writeFloat64
        });
        function utf8Read(bytes, offset, length) {
          var string2 = "", chr = 0;
          for (var i = offset, end = offset + length; i < end; i++) {
            var byte = bytes[i];
            if ((byte & 128) === 0) {
              string2 += String.fromCharCode(byte);
              continue;
            }
            if ((byte & 224) === 192) {
              string2 += String.fromCharCode((byte & 31) << 6 | bytes[++i] & 63);
              continue;
            }
            if ((byte & 240) === 224) {
              string2 += String.fromCharCode((byte & 15) << 12 | (bytes[++i] & 63) << 6 | (bytes[++i] & 63) << 0);
              continue;
            }
            if ((byte & 248) === 240) {
              chr = (byte & 7) << 18 | (bytes[++i] & 63) << 12 | (bytes[++i] & 63) << 6 | (bytes[++i] & 63) << 0;
              if (chr >= 65536) {
                chr -= 65536;
                string2 += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
              } else {
                string2 += String.fromCharCode(chr);
              }
              continue;
            }
            console.error("Invalid byte " + byte.toString(16));
          }
          return string2;
        }
        function int8(bytes, it) {
          return uint8(bytes, it) << 24 >> 24;
        }
        function uint8(bytes, it) {
          return bytes[it.offset++];
        }
        function int16(bytes, it) {
          return uint16(bytes, it) << 16 >> 16;
        }
        function uint16(bytes, it) {
          return bytes[it.offset++] | bytes[it.offset++] << 8;
        }
        function int32(bytes, it) {
          return bytes[it.offset++] | bytes[it.offset++] << 8 | bytes[it.offset++] << 16 | bytes[it.offset++] << 24;
        }
        function uint32(bytes, it) {
          return int32(bytes, it) >>> 0;
        }
        function float32(bytes, it) {
          return readFloat32(bytes, it);
        }
        function float64(bytes, it) {
          return readFloat64(bytes, it);
        }
        function int64(bytes, it) {
          var low = uint32(bytes, it);
          var high = int32(bytes, it) * Math.pow(2, 32);
          return high + low;
        }
        function uint64(bytes, it) {
          var low = uint32(bytes, it);
          var high = uint32(bytes, it) * Math.pow(2, 32);
          return high + low;
        }
        var _int32 = new Int32Array(2);
        var _float32 = new Float32Array(_int32.buffer);
        var _float64 = new Float64Array(_int32.buffer);
        function readFloat32(bytes, it) {
          _int32[0] = int32(bytes, it);
          return _float32[0];
        }
        function readFloat64(bytes, it) {
          _int32[0] = int32(bytes, it);
          _int32[1] = int32(bytes, it);
          return _float64[0];
        }
        function boolean(bytes, it) {
          return uint8(bytes, it) > 0;
        }
        function string(bytes, it) {
          var prefix = bytes[it.offset++];
          var length;
          if (prefix < 192) {
            length = prefix & 31;
          } else if (prefix === 217) {
            length = uint8(bytes, it);
          } else if (prefix === 218) {
            length = uint16(bytes, it);
          } else if (prefix === 219) {
            length = uint32(bytes, it);
          }
          var value = utf8Read(bytes, it.offset, length);
          it.offset += length;
          return value;
        }
        function stringCheck(bytes, it) {
          var prefix = bytes[it.offset];
          return (
            // fixstr
            prefix < 192 && prefix > 160 || // str 8
            prefix === 217 || // str 16
            prefix === 218 || // str 32
            prefix === 219
          );
        }
        function number(bytes, it) {
          var prefix = bytes[it.offset++];
          if (prefix < 128) {
            return prefix;
          } else if (prefix === 202) {
            return readFloat32(bytes, it);
          } else if (prefix === 203) {
            return readFloat64(bytes, it);
          } else if (prefix === 204) {
            return uint8(bytes, it);
          } else if (prefix === 205) {
            return uint16(bytes, it);
          } else if (prefix === 206) {
            return uint32(bytes, it);
          } else if (prefix === 207) {
            return uint64(bytes, it);
          } else if (prefix === 208) {
            return int8(bytes, it);
          } else if (prefix === 209) {
            return int16(bytes, it);
          } else if (prefix === 210) {
            return int32(bytes, it);
          } else if (prefix === 211) {
            return int64(bytes, it);
          } else if (prefix > 223) {
            return (255 - prefix + 1) * -1;
          }
        }
        function numberCheck(bytes, it) {
          var prefix = bytes[it.offset];
          return prefix < 128 || prefix >= 202 && prefix <= 211;
        }
        function arrayCheck(bytes, it) {
          return bytes[it.offset] < 160;
        }
        function switchStructureCheck(bytes, it) {
          return (
            // previous byte should be `SWITCH_TO_STRUCTURE`
            bytes[it.offset - 1] === SWITCH_TO_STRUCTURE && // next byte should be a number
            (bytes[it.offset] < 128 || bytes[it.offset] >= 202 && bytes[it.offset] <= 211)
          );
        }
        var decode = /* @__PURE__ */ Object.freeze({
          __proto__: null,
          arrayCheck,
          boolean,
          float32,
          float64,
          int16,
          int32,
          int64,
          int8,
          number,
          numberCheck,
          readFloat32,
          readFloat64,
          string,
          stringCheck,
          switchStructureCheck,
          uint16,
          uint32,
          uint64,
          uint8
        });
        var CollectionSchema = (
          /** @class */
          (function() {
            function CollectionSchema2(initialValues) {
              var _this = this;
              this.$changes = new ChangeTree(this);
              this.$items = /* @__PURE__ */ new Map();
              this.$indexes = /* @__PURE__ */ new Map();
              this.$refId = 0;
              if (initialValues) {
                initialValues.forEach(function(v) {
                  return _this.add(v);
                });
              }
            }
            CollectionSchema2.prototype.onAdd = function(callback, triggerAll) {
              if (triggerAll === void 0) {
                triggerAll = true;
              }
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.ADD, callback, triggerAll ? this.$items : void 0);
            };
            CollectionSchema2.prototype.onRemove = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.DELETE, callback);
            };
            CollectionSchema2.prototype.onChange = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.REPLACE, callback);
            };
            CollectionSchema2.is = function(type2) {
              return type2["collection"] !== void 0;
            };
            CollectionSchema2.prototype.add = function(value) {
              var index = this.$refId++;
              var isRef = value["$changes"] !== void 0;
              if (isRef) {
                value["$changes"].setParent(this, this.$changes.root, index);
              }
              this.$changes.indexes[index] = index;
              this.$indexes.set(index, index);
              this.$items.set(index, value);
              this.$changes.change(index);
              return index;
            };
            CollectionSchema2.prototype.at = function(index) {
              var key = Array.from(this.$items.keys())[index];
              return this.$items.get(key);
            };
            CollectionSchema2.prototype.entries = function() {
              return this.$items.entries();
            };
            CollectionSchema2.prototype.delete = function(item) {
              var entries = this.$items.entries();
              var index;
              var entry;
              while (entry = entries.next()) {
                if (entry.done) {
                  break;
                }
                if (item === entry.value[1]) {
                  index = entry.value[0];
                  break;
                }
              }
              if (index === void 0) {
                return false;
              }
              this.$changes.delete(index);
              this.$indexes.delete(index);
              return this.$items.delete(index);
            };
            CollectionSchema2.prototype.clear = function(changes) {
              this.$changes.discard(true, true);
              this.$changes.indexes = {};
              this.$indexes.clear();
              if (changes) {
                removeChildRefs.call(this, changes);
              }
              this.$items.clear();
              this.$changes.operation({ index: 0, op: exports2.OPERATION.CLEAR });
              this.$changes.touchParents();
            };
            CollectionSchema2.prototype.has = function(value) {
              return Array.from(this.$items.values()).some(function(v) {
                return v === value;
              });
            };
            CollectionSchema2.prototype.forEach = function(callbackfn) {
              var _this = this;
              this.$items.forEach(function(value, key, _) {
                return callbackfn(value, key, _this);
              });
            };
            CollectionSchema2.prototype.values = function() {
              return this.$items.values();
            };
            Object.defineProperty(CollectionSchema2.prototype, "size", {
              get: function() {
                return this.$items.size;
              },
              enumerable: false,
              configurable: true
            });
            CollectionSchema2.prototype.setIndex = function(index, key) {
              this.$indexes.set(index, key);
            };
            CollectionSchema2.prototype.getIndex = function(index) {
              return this.$indexes.get(index);
            };
            CollectionSchema2.prototype.getByIndex = function(index) {
              return this.$items.get(this.$indexes.get(index));
            };
            CollectionSchema2.prototype.deleteByIndex = function(index) {
              var key = this.$indexes.get(index);
              this.$items.delete(key);
              this.$indexes.delete(index);
            };
            CollectionSchema2.prototype.toArray = function() {
              return Array.from(this.$items.values());
            };
            CollectionSchema2.prototype.toJSON = function() {
              var values = [];
              this.forEach(function(value, key) {
                values.push(typeof value["toJSON"] === "function" ? value["toJSON"]() : value);
              });
              return values;
            };
            CollectionSchema2.prototype.clone = function(isDecoding) {
              var cloned;
              if (isDecoding) {
                cloned = Object.assign(new CollectionSchema2(), this);
              } else {
                cloned = new CollectionSchema2();
                this.forEach(function(value) {
                  if (value["$changes"]) {
                    cloned.add(value["clone"]());
                  } else {
                    cloned.add(value);
                  }
                });
              }
              return cloned;
            };
            return CollectionSchema2;
          })()
        );
        var SetSchema = (
          /** @class */
          (function() {
            function SetSchema2(initialValues) {
              var _this = this;
              this.$changes = new ChangeTree(this);
              this.$items = /* @__PURE__ */ new Map();
              this.$indexes = /* @__PURE__ */ new Map();
              this.$refId = 0;
              if (initialValues) {
                initialValues.forEach(function(v) {
                  return _this.add(v);
                });
              }
            }
            SetSchema2.prototype.onAdd = function(callback, triggerAll) {
              if (triggerAll === void 0) {
                triggerAll = true;
              }
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.ADD, callback, triggerAll ? this.$items : void 0);
            };
            SetSchema2.prototype.onRemove = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.DELETE, callback);
            };
            SetSchema2.prototype.onChange = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = []), exports2.OPERATION.REPLACE, callback);
            };
            SetSchema2.is = function(type2) {
              return type2["set"] !== void 0;
            };
            SetSchema2.prototype.add = function(value) {
              var _a, _b;
              if (this.has(value)) {
                return false;
              }
              var index = this.$refId++;
              if (value["$changes"] !== void 0) {
                value["$changes"].setParent(this, this.$changes.root, index);
              }
              var operation = (_b = (_a = this.$changes.indexes[index]) === null || _a === void 0 ? void 0 : _a.op) !== null && _b !== void 0 ? _b : exports2.OPERATION.ADD;
              this.$changes.indexes[index] = index;
              this.$indexes.set(index, index);
              this.$items.set(index, value);
              this.$changes.change(index, operation);
              return index;
            };
            SetSchema2.prototype.entries = function() {
              return this.$items.entries();
            };
            SetSchema2.prototype.delete = function(item) {
              var entries = this.$items.entries();
              var index;
              var entry;
              while (entry = entries.next()) {
                if (entry.done) {
                  break;
                }
                if (item === entry.value[1]) {
                  index = entry.value[0];
                  break;
                }
              }
              if (index === void 0) {
                return false;
              }
              this.$changes.delete(index);
              this.$indexes.delete(index);
              return this.$items.delete(index);
            };
            SetSchema2.prototype.clear = function(changes) {
              this.$changes.discard(true, true);
              this.$changes.indexes = {};
              this.$indexes.clear();
              if (changes) {
                removeChildRefs.call(this, changes);
              }
              this.$items.clear();
              this.$changes.operation({ index: 0, op: exports2.OPERATION.CLEAR });
              this.$changes.touchParents();
            };
            SetSchema2.prototype.has = function(value) {
              var values = this.$items.values();
              var has = false;
              var entry;
              while (entry = values.next()) {
                if (entry.done) {
                  break;
                }
                if (value === entry.value) {
                  has = true;
                  break;
                }
              }
              return has;
            };
            SetSchema2.prototype.forEach = function(callbackfn) {
              var _this = this;
              this.$items.forEach(function(value, key, _) {
                return callbackfn(value, key, _this);
              });
            };
            SetSchema2.prototype.values = function() {
              return this.$items.values();
            };
            Object.defineProperty(SetSchema2.prototype, "size", {
              get: function() {
                return this.$items.size;
              },
              enumerable: false,
              configurable: true
            });
            SetSchema2.prototype.setIndex = function(index, key) {
              this.$indexes.set(index, key);
            };
            SetSchema2.prototype.getIndex = function(index) {
              return this.$indexes.get(index);
            };
            SetSchema2.prototype.getByIndex = function(index) {
              return this.$items.get(this.$indexes.get(index));
            };
            SetSchema2.prototype.deleteByIndex = function(index) {
              var key = this.$indexes.get(index);
              this.$items.delete(key);
              this.$indexes.delete(index);
            };
            SetSchema2.prototype.toArray = function() {
              return Array.from(this.$items.values());
            };
            SetSchema2.prototype.toJSON = function() {
              var values = [];
              this.forEach(function(value, key) {
                values.push(typeof value["toJSON"] === "function" ? value["toJSON"]() : value);
              });
              return values;
            };
            SetSchema2.prototype.clone = function(isDecoding) {
              var cloned;
              if (isDecoding) {
                cloned = Object.assign(new SetSchema2(), this);
              } else {
                cloned = new SetSchema2();
                this.forEach(function(value) {
                  if (value["$changes"]) {
                    cloned.add(value["clone"]());
                  } else {
                    cloned.add(value);
                  }
                });
              }
              return cloned;
            };
            return SetSchema2;
          })()
        );
        var ClientState = (
          /** @class */
          (function() {
            function ClientState2() {
              this.refIds = /* @__PURE__ */ new WeakSet();
              this.containerIndexes = /* @__PURE__ */ new WeakMap();
            }
            ClientState2.prototype.addRefId = function(changeTree) {
              if (!this.refIds.has(changeTree)) {
                this.refIds.add(changeTree);
                this.containerIndexes.set(changeTree, /* @__PURE__ */ new Set());
              }
            };
            ClientState2.get = function(client) {
              if (client.$filterState === void 0) {
                client.$filterState = new ClientState2();
              }
              return client.$filterState;
            };
            return ClientState2;
          })()
        );
        var ReferenceTracker = (
          /** @class */
          (function() {
            function ReferenceTracker2() {
              this.refs = /* @__PURE__ */ new Map();
              this.refCounts = {};
              this.deletedRefs = /* @__PURE__ */ new Set();
              this.nextUniqueId = 0;
            }
            ReferenceTracker2.prototype.getNextUniqueId = function() {
              return this.nextUniqueId++;
            };
            ReferenceTracker2.prototype.addRef = function(refId, ref, incrementCount) {
              if (incrementCount === void 0) {
                incrementCount = true;
              }
              this.refs.set(refId, ref);
              if (incrementCount) {
                this.refCounts[refId] = (this.refCounts[refId] || 0) + 1;
              }
            };
            ReferenceTracker2.prototype.removeRef = function(refId) {
              var refCount = this.refCounts[refId];
              if (refCount === void 0) {
                console.warn("trying to remove reference ".concat(refId, " that doesn't exist"));
                return;
              }
              if (refCount === 0) {
                console.warn("trying to remove reference ".concat(refId, " with 0 refCount"));
                return;
              }
              this.refCounts[refId] = refCount - 1;
              this.deletedRefs.add(refId);
            };
            ReferenceTracker2.prototype.clearRefs = function() {
              this.refs.clear();
              this.deletedRefs.clear();
              this.refCounts = {};
            };
            ReferenceTracker2.prototype.garbageCollectDeletedRefs = function() {
              var _this = this;
              this.deletedRefs.forEach(function(refId) {
                if (_this.refCounts[refId] > 0) {
                  return;
                }
                var ref = _this.refs.get(refId);
                if (ref instanceof Schema) {
                  for (var fieldName in ref["_definition"].schema) {
                    if (typeof ref["_definition"].schema[fieldName] !== "string" && ref[fieldName] && ref[fieldName]["$changes"]) {
                      _this.removeRef(ref[fieldName]["$changes"].refId);
                    }
                  }
                } else {
                  var definition = ref["$changes"].parent._definition;
                  var type2 = definition.schema[definition.fieldsByIndex[ref["$changes"].parentIndex]];
                  if (typeof Object.values(type2)[0] === "function") {
                    Array.from(ref.values()).forEach(function(child) {
                      return _this.removeRef(child["$changes"].refId);
                    });
                  }
                }
                _this.refs.delete(refId);
                delete _this.refCounts[refId];
              });
              this.deletedRefs.clear();
            };
            return ReferenceTracker2;
          })()
        );
        var EncodeSchemaError = (
          /** @class */
          (function(_super) {
            __extends(EncodeSchemaError2, _super);
            function EncodeSchemaError2() {
              return _super !== null && _super.apply(this, arguments) || this;
            }
            return EncodeSchemaError2;
          })(Error)
        );
        function assertType(value, type2, klass, field) {
          var typeofTarget;
          var allowNull = false;
          switch (type2) {
            case "number":
            case "int8":
            case "uint8":
            case "int16":
            case "uint16":
            case "int32":
            case "uint32":
            case "int64":
            case "uint64":
            case "float32":
            case "float64":
              typeofTarget = "number";
              if (isNaN(value)) {
                console.log('trying to encode "NaN" in '.concat(klass.constructor.name, "#").concat(field));
              }
              break;
            case "string":
              typeofTarget = "string";
              allowNull = true;
              break;
            case "boolean":
              return;
          }
          if (typeof value !== typeofTarget && (!allowNull || allowNull && value !== null)) {
            var foundValue = "'".concat(JSON.stringify(value), "'").concat(value && value.constructor && " (".concat(value.constructor.name, ")") || "");
            throw new EncodeSchemaError("a '".concat(typeofTarget, "' was expected, but ").concat(foundValue, " was provided in ").concat(klass.constructor.name, "#").concat(field));
          }
        }
        function assertInstanceType(value, type2, klass, field) {
          if (!(value instanceof type2)) {
            throw new EncodeSchemaError("a '".concat(type2.name, "' was expected, but '").concat(value.constructor.name, "' was provided in ").concat(klass.constructor.name, "#").concat(field));
          }
        }
        function encodePrimitiveType(type2, bytes, value, klass, field) {
          assertType(value, type2, klass, field);
          var encodeFunc = encode[type2];
          if (encodeFunc) {
            encodeFunc(bytes, value);
          } else {
            throw new EncodeSchemaError("a '".concat(type2, "' was expected, but ").concat(value, " was provided in ").concat(klass.constructor.name, "#").concat(field));
          }
        }
        function decodePrimitiveType(type2, bytes, it) {
          return decode[type2](bytes, it);
        }
        var Schema = (
          /** @class */
          (function() {
            function Schema2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              Object.defineProperties(this, {
                $changes: {
                  value: new ChangeTree(this, void 0, new ReferenceTracker()),
                  enumerable: false,
                  writable: true
                },
                // $listeners: {
                //     value: undefined,
                //     enumerable: false,
                //     writable: true
                // },
                $callbacks: {
                  value: void 0,
                  enumerable: false,
                  writable: true
                }
              });
              var descriptors = this._definition.descriptors;
              if (descriptors) {
                Object.defineProperties(this, descriptors);
              }
              if (args[0]) {
                this.assign(args[0]);
              }
            }
            Schema2.onError = function(e) {
              console.error(e);
            };
            Schema2.is = function(type2) {
              return type2["_definition"] && type2["_definition"].schema !== void 0;
            };
            Schema2.prototype.onChange = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.REPLACE, callback);
            };
            Schema2.prototype.onRemove = function(callback) {
              return addCallback(this.$callbacks || (this.$callbacks = {}), exports2.OPERATION.DELETE, callback);
            };
            Schema2.prototype.assign = function(props) {
              Object.assign(this, props);
              return this;
            };
            Object.defineProperty(Schema2.prototype, "_definition", {
              get: function() {
                return this.constructor._definition;
              },
              enumerable: false,
              configurable: true
            });
            Schema2.prototype.setDirty = function(property, operation) {
              this.$changes.change(property, operation);
            };
            Schema2.prototype.listen = function(prop, callback, immediate) {
              var _this = this;
              if (immediate === void 0) {
                immediate = true;
              }
              if (!this.$callbacks) {
                this.$callbacks = {};
              }
              if (!this.$callbacks[prop]) {
                this.$callbacks[prop] = [];
              }
              this.$callbacks[prop].push(callback);
              if (immediate && this[prop] !== void 0) {
                callback(this[prop], void 0);
              }
              return function() {
                return spliceOne(_this.$callbacks[prop], _this.$callbacks[prop].indexOf(callback));
              };
            };
            Schema2.prototype.decode = function(bytes, it, ref) {
              if (it === void 0) {
                it = { offset: 0 };
              }
              if (ref === void 0) {
                ref = this;
              }
              var allChanges = [];
              var $root = this.$changes.root;
              var totalBytes = bytes.length;
              var refId = 0;
              $root.refs.set(refId, this);
              while (it.offset < totalBytes) {
                var byte = bytes[it.offset++];
                if (byte == SWITCH_TO_STRUCTURE) {
                  refId = number(bytes, it);
                  var nextRef = $root.refs.get(refId);
                  if (!nextRef) {
                    throw new Error('"refId" not found: '.concat(refId));
                  }
                  ref = nextRef;
                  continue;
                }
                var changeTree = ref["$changes"];
                var isSchema = ref["_definition"] !== void 0;
                var operation = isSchema ? byte >> 6 << 6 : byte;
                if (operation === exports2.OPERATION.CLEAR) {
                  ref.clear(allChanges);
                  continue;
                }
                var fieldIndex = isSchema ? byte % (operation || 255) : number(bytes, it);
                var fieldName = isSchema ? ref["_definition"].fieldsByIndex[fieldIndex] : "";
                var type2 = changeTree.getType(fieldIndex);
                var value = void 0;
                var previousValue = void 0;
                var dynamicIndex = void 0;
                if (!isSchema) {
                  previousValue = ref["getByIndex"](fieldIndex);
                  if ((operation & exports2.OPERATION.ADD) === exports2.OPERATION.ADD) {
                    dynamicIndex = ref instanceof MapSchema ? string(bytes, it) : fieldIndex;
                    ref["setIndex"](fieldIndex, dynamicIndex);
                  } else {
                    dynamicIndex = ref["getIndex"](fieldIndex);
                  }
                } else {
                  previousValue = ref["_".concat(fieldName)];
                }
                if ((operation & exports2.OPERATION.DELETE) === exports2.OPERATION.DELETE) {
                  if (operation !== exports2.OPERATION.DELETE_AND_ADD) {
                    ref["deleteByIndex"](fieldIndex);
                  }
                  if (previousValue && previousValue["$changes"]) {
                    $root.removeRef(previousValue["$changes"].refId);
                  }
                  value = null;
                }
                if (fieldName === void 0) {
                  console.warn("@colyseus/schema: definition mismatch");
                  var nextIterator = { offset: it.offset };
                  while (it.offset < totalBytes) {
                    if (switchStructureCheck(bytes, it)) {
                      nextIterator.offset = it.offset + 1;
                      if ($root.refs.has(number(bytes, nextIterator))) {
                        break;
                      }
                    }
                    it.offset++;
                  }
                  continue;
                } else if (operation === exports2.OPERATION.DELETE) ;
                else if (Schema2.is(type2)) {
                  var refId_1 = number(bytes, it);
                  value = $root.refs.get(refId_1);
                  if (operation !== exports2.OPERATION.REPLACE) {
                    var childType = this.getSchemaType(bytes, it, type2);
                    if (!value) {
                      value = this.createTypeInstance(childType);
                      value.$changes.refId = refId_1;
                      if (previousValue) {
                        value.$callbacks = previousValue.$callbacks;
                        if (previousValue["$changes"].refId && refId_1 !== previousValue["$changes"].refId) {
                          $root.removeRef(previousValue["$changes"].refId);
                        }
                      }
                    }
                    $root.addRef(refId_1, value, value !== previousValue);
                  }
                } else if (typeof type2 === "string") {
                  value = decodePrimitiveType(type2, bytes, it);
                } else {
                  var typeDef = getType(Object.keys(type2)[0]);
                  var refId_2 = number(bytes, it);
                  var valueRef = $root.refs.has(refId_2) ? previousValue || $root.refs.get(refId_2) : new typeDef.constructor();
                  value = valueRef.clone(true);
                  value.$changes.refId = refId_2;
                  if (previousValue) {
                    value["$callbacks"] = previousValue["$callbacks"];
                    if (previousValue["$changes"].refId && refId_2 !== previousValue["$changes"].refId) {
                      $root.removeRef(previousValue["$changes"].refId);
                      var entries = previousValue.entries();
                      var iter = void 0;
                      while ((iter = entries.next()) && !iter.done) {
                        var _a = iter.value, key = _a[0], value_1 = _a[1];
                        allChanges.push({
                          refId: refId_2,
                          op: exports2.OPERATION.DELETE,
                          field: key,
                          value: void 0,
                          previousValue: value_1
                        });
                      }
                    }
                  }
                  $root.addRef(refId_2, value, valueRef !== previousValue);
                }
                if (value !== null && value !== void 0) {
                  if (value["$changes"]) {
                    value["$changes"].setParent(changeTree.ref, changeTree.root, fieldIndex);
                  }
                  if (ref instanceof Schema2) {
                    ref[fieldName] = value;
                  } else if (ref instanceof MapSchema) {
                    var key = dynamicIndex;
                    ref["$items"].set(key, value);
                    ref["$changes"].allChanges.add(fieldIndex);
                  } else if (ref instanceof ArraySchema) {
                    ref.setAt(fieldIndex, value);
                  } else if (ref instanceof CollectionSchema) {
                    var index = ref.add(value);
                    ref["setIndex"](fieldIndex, index);
                  } else if (ref instanceof SetSchema) {
                    var index = ref.add(value);
                    if (index !== false) {
                      ref["setIndex"](fieldIndex, index);
                    }
                  }
                }
                if (previousValue !== value) {
                  allChanges.push({
                    refId,
                    op: operation,
                    field: fieldName,
                    dynamicIndex,
                    value,
                    previousValue
                  });
                }
              }
              this._triggerChanges(allChanges);
              $root.garbageCollectDeletedRefs();
              return allChanges;
            };
            Schema2.prototype.encode = function(encodeAll, bytes, useFilters) {
              if (encodeAll === void 0) {
                encodeAll = false;
              }
              if (bytes === void 0) {
                bytes = [];
              }
              if (useFilters === void 0) {
                useFilters = false;
              }
              var rootChangeTree = this.$changes;
              var refIdsVisited = /* @__PURE__ */ new WeakSet();
              var changeTrees = [rootChangeTree];
              var numChangeTrees = 1;
              for (var i = 0; i < numChangeTrees; i++) {
                var changeTree = changeTrees[i];
                var ref = changeTree.ref;
                var isSchema = ref instanceof Schema2;
                changeTree.ensureRefId();
                refIdsVisited.add(changeTree);
                if (changeTree !== rootChangeTree && (changeTree.changed || encodeAll)) {
                  uint8$1(bytes, SWITCH_TO_STRUCTURE);
                  number$1(bytes, changeTree.refId);
                }
                var changes = encodeAll ? Array.from(changeTree.allChanges) : Array.from(changeTree.changes.values());
                for (var j = 0, cl = changes.length; j < cl; j++) {
                  var operation = encodeAll ? { op: exports2.OPERATION.ADD, index: changes[j] } : changes[j];
                  var fieldIndex = operation.index;
                  var field = isSchema ? ref["_definition"].fieldsByIndex && ref["_definition"].fieldsByIndex[fieldIndex] : fieldIndex;
                  var beginIndex = bytes.length;
                  if (operation.op !== exports2.OPERATION.TOUCH) {
                    if (isSchema) {
                      uint8$1(bytes, fieldIndex | operation.op);
                    } else {
                      uint8$1(bytes, operation.op);
                      if (operation.op === exports2.OPERATION.CLEAR) {
                        continue;
                      }
                      number$1(bytes, fieldIndex);
                    }
                  }
                  if (!isSchema && (operation.op & exports2.OPERATION.ADD) == exports2.OPERATION.ADD) {
                    if (ref instanceof MapSchema) {
                      var dynamicIndex = changeTree.ref["$indexes"].get(fieldIndex);
                      string$1(bytes, dynamicIndex);
                    }
                  }
                  if (operation.op === exports2.OPERATION.DELETE) {
                    continue;
                  }
                  var type2 = changeTree.getType(fieldIndex);
                  var value = changeTree.getValue(fieldIndex);
                  if (value && value["$changes"] && !refIdsVisited.has(value["$changes"])) {
                    changeTrees.push(value["$changes"]);
                    value["$changes"].ensureRefId();
                    numChangeTrees++;
                  }
                  if (operation.op === exports2.OPERATION.TOUCH) {
                    continue;
                  }
                  if (Schema2.is(type2)) {
                    assertInstanceType(value, type2, ref, field);
                    number$1(bytes, value.$changes.refId);
                    if ((operation.op & exports2.OPERATION.ADD) === exports2.OPERATION.ADD) {
                      this.tryEncodeTypeId(bytes, type2, value.constructor);
                    }
                  } else if (typeof type2 === "string") {
                    encodePrimitiveType(type2, bytes, value, ref, field);
                  } else {
                    var definition = getType(Object.keys(type2)[0]);
                    assertInstanceType(ref["_".concat(field)], definition.constructor, ref, field);
                    number$1(bytes, value.$changes.refId);
                  }
                  if (useFilters) {
                    changeTree.cache(fieldIndex, bytes.slice(beginIndex));
                  }
                }
                if (!encodeAll && !useFilters) {
                  changeTree.discard();
                }
              }
              return bytes;
            };
            Schema2.prototype.encodeAll = function(useFilters) {
              return this.encode(true, [], useFilters);
            };
            Schema2.prototype.applyFilters = function(client, encodeAll) {
              var _a, _b;
              if (encodeAll === void 0) {
                encodeAll = false;
              }
              var root = this;
              var refIdsDissallowed = /* @__PURE__ */ new Set();
              var $filterState = ClientState.get(client);
              var changeTrees = [this.$changes];
              var numChangeTrees = 1;
              var filteredBytes = [];
              var _loop_1 = function(i2) {
                var changeTree = changeTrees[i2];
                if (refIdsDissallowed.has(changeTree.refId)) {
                  return "continue";
                }
                var ref = changeTree.ref;
                var isSchema = ref instanceof Schema2;
                uint8$1(filteredBytes, SWITCH_TO_STRUCTURE);
                number$1(filteredBytes, changeTree.refId);
                var clientHasRefId = $filterState.refIds.has(changeTree);
                var isEncodeAll = encodeAll || !clientHasRefId;
                $filterState.addRefId(changeTree);
                var containerIndexes = $filterState.containerIndexes.get(changeTree);
                var changes = isEncodeAll ? Array.from(changeTree.allChanges) : Array.from(changeTree.changes.values());
                if (!encodeAll && isSchema && ref._definition.indexesWithFilters) {
                  var indexesWithFilters = ref._definition.indexesWithFilters;
                  indexesWithFilters.forEach(function(indexWithFilter) {
                    if (!containerIndexes.has(indexWithFilter) && changeTree.allChanges.has(indexWithFilter)) {
                      if (isEncodeAll) {
                        changes.push(indexWithFilter);
                      } else {
                        changes.push({ op: exports2.OPERATION.ADD, index: indexWithFilter });
                      }
                    }
                  });
                }
                for (var j = 0, cl = changes.length; j < cl; j++) {
                  var change = isEncodeAll ? { op: exports2.OPERATION.ADD, index: changes[j] } : changes[j];
                  if (change.op === exports2.OPERATION.CLEAR) {
                    uint8$1(filteredBytes, change.op);
                    continue;
                  }
                  var fieldIndex = change.index;
                  if (change.op === exports2.OPERATION.DELETE) {
                    if (isSchema) {
                      uint8$1(filteredBytes, change.op | fieldIndex);
                    } else {
                      uint8$1(filteredBytes, change.op);
                      number$1(filteredBytes, fieldIndex);
                    }
                    continue;
                  }
                  var value = changeTree.getValue(fieldIndex);
                  var type2 = changeTree.getType(fieldIndex);
                  if (isSchema) {
                    var filter2 = ref._definition.filters && ref._definition.filters[fieldIndex];
                    if (filter2 && !filter2.call(ref, client, value, root)) {
                      if (value && value["$changes"]) {
                        refIdsDissallowed.add(value["$changes"].refId);
                      }
                      continue;
                    }
                  } else {
                    var parent = changeTree.parent;
                    var filter2 = changeTree.getChildrenFilter();
                    if (filter2 && !filter2.call(parent, client, ref["$indexes"].get(fieldIndex), value, root)) {
                      if (value && value["$changes"]) {
                        refIdsDissallowed.add(value["$changes"].refId);
                      }
                      continue;
                    }
                  }
                  if (value["$changes"]) {
                    changeTrees.push(value["$changes"]);
                    numChangeTrees++;
                  }
                  if (change.op !== exports2.OPERATION.TOUCH) {
                    if (change.op === exports2.OPERATION.ADD || isSchema) {
                      filteredBytes.push.apply(filteredBytes, (_a = changeTree.caches[fieldIndex]) !== null && _a !== void 0 ? _a : []);
                      containerIndexes.add(fieldIndex);
                    } else {
                      if (containerIndexes.has(fieldIndex)) {
                        filteredBytes.push.apply(filteredBytes, (_b = changeTree.caches[fieldIndex]) !== null && _b !== void 0 ? _b : []);
                      } else {
                        containerIndexes.add(fieldIndex);
                        uint8$1(filteredBytes, exports2.OPERATION.ADD);
                        number$1(filteredBytes, fieldIndex);
                        if (ref instanceof MapSchema) {
                          var dynamicIndex = changeTree.ref["$indexes"].get(fieldIndex);
                          string$1(filteredBytes, dynamicIndex);
                        }
                        if (value["$changes"]) {
                          number$1(filteredBytes, value["$changes"].refId);
                        } else {
                          encode[type2](filteredBytes, value);
                        }
                      }
                    }
                  } else if (value["$changes"] && !isSchema) {
                    uint8$1(filteredBytes, exports2.OPERATION.ADD);
                    number$1(filteredBytes, fieldIndex);
                    if (ref instanceof MapSchema) {
                      var dynamicIndex = changeTree.ref["$indexes"].get(fieldIndex);
                      string$1(filteredBytes, dynamicIndex);
                    }
                    number$1(filteredBytes, value["$changes"].refId);
                  }
                }
              };
              for (var i = 0; i < numChangeTrees; i++) {
                _loop_1(i);
              }
              return filteredBytes;
            };
            Schema2.prototype.clone = function() {
              var _a;
              var cloned = new this.constructor();
              var schema = this._definition.schema;
              for (var field in schema) {
                if (typeof this[field] === "object" && typeof ((_a = this[field]) === null || _a === void 0 ? void 0 : _a.clone) === "function") {
                  cloned[field] = this[field].clone();
                } else {
                  cloned[field] = this[field];
                }
              }
              return cloned;
            };
            Schema2.prototype.toJSON = function() {
              var schema = this._definition.schema;
              var deprecated2 = this._definition.deprecated;
              var obj = {};
              for (var field in schema) {
                if (!deprecated2[field] && this[field] !== null && typeof this[field] !== "undefined") {
                  obj[field] = typeof this[field]["toJSON"] === "function" ? this[field]["toJSON"]() : this["_".concat(field)];
                }
              }
              return obj;
            };
            Schema2.prototype.discardAllChanges = function() {
              this.$changes.discardAll();
            };
            Schema2.prototype.getByIndex = function(index) {
              return this[this._definition.fieldsByIndex[index]];
            };
            Schema2.prototype.deleteByIndex = function(index) {
              this[this._definition.fieldsByIndex[index]] = void 0;
            };
            Schema2.prototype.tryEncodeTypeId = function(bytes, type2, targetType) {
              if (type2._typeid !== targetType._typeid) {
                uint8$1(bytes, TYPE_ID);
                number$1(bytes, targetType._typeid);
              }
            };
            Schema2.prototype.getSchemaType = function(bytes, it, defaultType) {
              var type2;
              if (bytes[it.offset] === TYPE_ID) {
                it.offset++;
                type2 = this.constructor._context.get(number(bytes, it));
              }
              return type2 || defaultType;
            };
            Schema2.prototype.createTypeInstance = function(type2) {
              var instance = new type2();
              instance.$changes.root = this.$changes.root;
              return instance;
            };
            Schema2.prototype._triggerChanges = function(changes) {
              var _a, _b, _c, _d, _e, _f, _g, _h, _j;
              var uniqueRefIds = /* @__PURE__ */ new Set();
              var $refs = this.$changes.root.refs;
              var _loop_2 = function(i2) {
                var change = changes[i2];
                var refId = change.refId;
                var ref = $refs.get(refId);
                var $callbacks = ref["$callbacks"];
                if ((change.op & exports2.OPERATION.DELETE) === exports2.OPERATION.DELETE && change.previousValue instanceof Schema2) {
                  (_b = (_a = change.previousValue["$callbacks"]) === null || _a === void 0 ? void 0 : _a[exports2.OPERATION.DELETE]) === null || _b === void 0 ? void 0 : _b.forEach(function(callback) {
                    return callback();
                  });
                }
                if (!$callbacks) {
                  return "continue";
                }
                if (ref instanceof Schema2) {
                  if (!uniqueRefIds.has(refId)) {
                    try {
                      (_c = $callbacks === null || $callbacks === void 0 ? void 0 : $callbacks[exports2.OPERATION.REPLACE]) === null || _c === void 0 ? void 0 : _c.forEach(function(callback) {
                        return callback();
                      });
                    } catch (e) {
                      Schema2.onError(e);
                    }
                  }
                  try {
                    if ($callbacks.hasOwnProperty(change.field)) {
                      (_d = $callbacks[change.field]) === null || _d === void 0 ? void 0 : _d.forEach(function(callback) {
                        return callback(change.value, change.previousValue);
                      });
                    }
                  } catch (e) {
                    Schema2.onError(e);
                  }
                } else {
                  if (change.op === exports2.OPERATION.ADD && change.previousValue === void 0) {
                    (_e = $callbacks[exports2.OPERATION.ADD]) === null || _e === void 0 ? void 0 : _e.forEach(function(callback) {
                      var _a2;
                      return callback(change.value, (_a2 = change.dynamicIndex) !== null && _a2 !== void 0 ? _a2 : change.field);
                    });
                  } else if (change.op === exports2.OPERATION.DELETE) {
                    if (change.previousValue !== void 0) {
                      (_f = $callbacks[exports2.OPERATION.DELETE]) === null || _f === void 0 ? void 0 : _f.forEach(function(callback) {
                        var _a2;
                        return callback(change.previousValue, (_a2 = change.dynamicIndex) !== null && _a2 !== void 0 ? _a2 : change.field);
                      });
                    }
                  } else if (change.op === exports2.OPERATION.DELETE_AND_ADD) {
                    if (change.previousValue !== void 0) {
                      (_g = $callbacks[exports2.OPERATION.DELETE]) === null || _g === void 0 ? void 0 : _g.forEach(function(callback) {
                        var _a2;
                        return callback(change.previousValue, (_a2 = change.dynamicIndex) !== null && _a2 !== void 0 ? _a2 : change.field);
                      });
                    }
                    (_h = $callbacks[exports2.OPERATION.ADD]) === null || _h === void 0 ? void 0 : _h.forEach(function(callback) {
                      var _a2;
                      return callback(change.value, (_a2 = change.dynamicIndex) !== null && _a2 !== void 0 ? _a2 : change.field);
                    });
                  }
                  if (change.value !== change.previousValue) {
                    (_j = $callbacks[exports2.OPERATION.REPLACE]) === null || _j === void 0 ? void 0 : _j.forEach(function(callback) {
                      var _a2;
                      return callback(change.value, (_a2 = change.dynamicIndex) !== null && _a2 !== void 0 ? _a2 : change.field);
                    });
                  }
                }
                uniqueRefIds.add(refId);
              };
              for (var i = 0; i < changes.length; i++) {
                _loop_2(i);
              }
            };
            Schema2._definition = SchemaDefinition.create();
            return Schema2;
          })()
        );
        function dumpChanges(schema) {
          var changeTrees = [schema["$changes"]];
          var numChangeTrees = 1;
          var dump = {};
          var currentStructure = dump;
          var _loop_1 = function(i2) {
            var changeTree = changeTrees[i2];
            changeTree.changes.forEach(function(change) {
              var ref = changeTree.ref;
              var fieldIndex = change.index;
              var field = ref["_definition"] ? ref["_definition"].fieldsByIndex[fieldIndex] : ref["$indexes"].get(fieldIndex);
              currentStructure[field] = changeTree.getValue(fieldIndex);
            });
          };
          for (var i = 0; i < numChangeTrees; i++) {
            _loop_1(i);
          }
          return dump;
        }
        var reflectionContext = { context: new Context() };
        var ReflectionField = (
          /** @class */
          (function(_super) {
            __extends(ReflectionField2, _super);
            function ReflectionField2() {
              return _super !== null && _super.apply(this, arguments) || this;
            }
            __decorate([
              type("string", reflectionContext)
            ], ReflectionField2.prototype, "name", void 0);
            __decorate([
              type("string", reflectionContext)
            ], ReflectionField2.prototype, "type", void 0);
            __decorate([
              type("number", reflectionContext)
            ], ReflectionField2.prototype, "referencedType", void 0);
            return ReflectionField2;
          })(Schema)
        );
        var ReflectionType = (
          /** @class */
          (function(_super) {
            __extends(ReflectionType2, _super);
            function ReflectionType2() {
              var _this = _super !== null && _super.apply(this, arguments) || this;
              _this.fields = new ArraySchema();
              return _this;
            }
            __decorate([
              type("number", reflectionContext)
            ], ReflectionType2.prototype, "id", void 0);
            __decorate([
              type([ReflectionField], reflectionContext)
            ], ReflectionType2.prototype, "fields", void 0);
            return ReflectionType2;
          })(Schema)
        );
        var Reflection = (
          /** @class */
          (function(_super) {
            __extends(Reflection2, _super);
            function Reflection2() {
              var _this = _super !== null && _super.apply(this, arguments) || this;
              _this.types = new ArraySchema();
              return _this;
            }
            Reflection2.encode = function(instance) {
              var _a;
              var rootSchemaType = instance.constructor;
              var reflection = new Reflection2();
              reflection.rootType = rootSchemaType._typeid;
              var buildType = function(currentType, schema) {
                for (var fieldName in schema) {
                  var field = new ReflectionField();
                  field.name = fieldName;
                  var fieldType = void 0;
                  if (typeof schema[fieldName] === "string") {
                    fieldType = schema[fieldName];
                  } else {
                    var type_1 = schema[fieldName];
                    var childTypeSchema = void 0;
                    if (Schema.is(type_1)) {
                      fieldType = "ref";
                      childTypeSchema = schema[fieldName];
                    } else {
                      fieldType = Object.keys(type_1)[0];
                      if (typeof type_1[fieldType] === "string") {
                        fieldType += ":" + type_1[fieldType];
                      } else {
                        childTypeSchema = type_1[fieldType];
                      }
                    }
                    field.referencedType = childTypeSchema ? childTypeSchema._typeid : -1;
                  }
                  field.type = fieldType;
                  currentType.fields.push(field);
                }
                reflection.types.push(currentType);
              };
              var types = (_a = rootSchemaType._context) === null || _a === void 0 ? void 0 : _a.types;
              for (var typeid in types) {
                var type_2 = new ReflectionType();
                type_2.id = Number(typeid);
                buildType(type_2, types[typeid]._definition.schema);
              }
              return reflection.encodeAll();
            };
            Reflection2.decode = function(bytes, it) {
              var context = new Context();
              var reflection = new Reflection2();
              reflection.decode(bytes, it);
              var schemaTypes = reflection.types.reduce(function(types, reflectionType) {
                var schema = (
                  /** @class */
                  (function(_super2) {
                    __extends(_, _super2);
                    function _() {
                      return _super2 !== null && _super2.apply(this, arguments) || this;
                    }
                    return _;
                  })(Schema)
                );
                var typeid = reflectionType.id;
                types[typeid] = schema;
                context.add(schema, typeid);
                return types;
              }, {});
              reflection.types.forEach(function(reflectionType) {
                var schemaType = schemaTypes[reflectionType.id];
                reflectionType.fields.forEach(function(field) {
                  var _a;
                  if (field.referencedType !== void 0) {
                    var fieldType2 = field.type;
                    var refType = schemaTypes[field.referencedType];
                    if (!refType) {
                      var typeInfo = field.type.split(":");
                      fieldType2 = typeInfo[0];
                      refType = typeInfo[1];
                    }
                    if (fieldType2 === "ref") {
                      type(refType, { context })(schemaType.prototype, field.name);
                    } else {
                      type((_a = {}, _a[fieldType2] = refType, _a), { context })(schemaType.prototype, field.name);
                    }
                  } else {
                    type(field.type, { context })(schemaType.prototype, field.name);
                  }
                });
              });
              var rootType = schemaTypes[reflection.rootType];
              var rootInstance = new rootType();
              for (var fieldName in rootType._definition.schema) {
                var fieldType = rootType._definition.schema[fieldName];
                if (typeof fieldType !== "string") {
                  rootInstance[fieldName] = typeof fieldType === "function" ? new fieldType() : new (getType(Object.keys(fieldType)[0])).constructor();
                }
              }
              return rootInstance;
            };
            __decorate([
              type([ReflectionType], reflectionContext)
            ], Reflection2.prototype, "types", void 0);
            __decorate([
              type("number", reflectionContext)
            ], Reflection2.prototype, "rootType", void 0);
            return Reflection2;
          })(Schema)
        );
        registerType("map", { constructor: MapSchema });
        registerType("array", { constructor: ArraySchema });
        registerType("set", { constructor: SetSchema });
        registerType("collection", { constructor: CollectionSchema });
        exports2.ArraySchema = ArraySchema;
        exports2.CollectionSchema = CollectionSchema;
        exports2.Context = Context;
        exports2.MapSchema = MapSchema;
        exports2.Reflection = Reflection;
        exports2.ReflectionField = ReflectionField;
        exports2.ReflectionType = ReflectionType;
        exports2.Schema = Schema;
        exports2.SchemaDefinition = SchemaDefinition;
        exports2.SetSchema = SetSchema;
        exports2.decode = decode;
        exports2.defineTypes = defineTypes;
        exports2.deprecated = deprecated;
        exports2.dumpChanges = dumpChanges;
        exports2.encode = encode;
        exports2.filter = filter;
        exports2.filterChildren = filterChildren;
        exports2.hasFilter = hasFilter;
        exports2.registerType = registerType;
        exports2.type = type;
      }));
    }
  });

  // node_modules/colyseus.js/lib/Room.js
  var require_Room = __commonJS({
    "node_modules/colyseus.js/lib/Room.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        }
        __setModuleDefault(result, mod);
        return result;
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Room = void 0;
      var msgpack = __importStar(require_msgpack());
      var Connection_1 = require_Connection();
      var Protocol_1 = require_Protocol();
      var Serializer_1 = require_Serializer();
      var nanoevents_1 = require_nanoevents();
      var signal_1 = require_signal();
      var schema_1 = require_umd();
      var ServerError_1 = require_ServerError();
      var Room = class _Room {
        constructor(name, rootSchema) {
          this.onStateChange = (0, signal_1.createSignal)();
          this.onError = (0, signal_1.createSignal)();
          this.onLeave = (0, signal_1.createSignal)();
          this.onJoin = (0, signal_1.createSignal)();
          this.hasJoined = false;
          this.onMessageHandlers = (0, nanoevents_1.createNanoEvents)();
          this.roomId = null;
          this.name = name;
          if (rootSchema) {
            this.serializer = new ((0, Serializer_1.getSerializer)("schema"))();
            this.rootSchema = rootSchema;
            this.serializer.state = new rootSchema();
          }
          this.onError((code, message) => {
            var _a;
            return (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `colyseus.js - onError => (${code}) ${message}`);
          });
          this.onLeave(() => this.removeAllListeners());
        }
        // TODO: deprecate me on version 1.0
        get id() {
          return this.roomId;
        }
        connect(endpoint, devModeCloseCallback, room = this, headers) {
          const connection = new Connection_1.Connection();
          room.connection = connection;
          connection.events.onmessage = _Room.prototype.onMessageCallback.bind(room);
          connection.events.onclose = function(e) {
            var _a;
            if (!room.hasJoined) {
              (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `Room connection was closed unexpectedly (${e.code}): ${e.reason}`);
              room.onError.invoke(e.code, e.reason);
              return;
            }
            if (e.code === ServerError_1.CloseCode.DEVMODE_RESTART && devModeCloseCallback) {
              devModeCloseCallback();
            } else {
              room.onLeave.invoke(e.code, e.reason);
              room.destroy();
            }
          };
          connection.events.onerror = function(e) {
            var _a;
            (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `Room, onError (${e.code}): ${e.reason}`);
            room.onError.invoke(e.code, e.reason);
          };
          connection.connect(endpoint, headers);
        }
        leave(consented = true) {
          return new Promise((resolve) => {
            this.onLeave((code) => resolve(code));
            if (this.connection) {
              if (consented) {
                this.connection.send([Protocol_1.Protocol.LEAVE_ROOM]);
              } else {
                this.connection.close();
              }
            } else {
              this.onLeave.invoke(ServerError_1.CloseCode.CONSENTED);
            }
          });
        }
        onMessage(type, callback) {
          return this.onMessageHandlers.on(this.getMessageHandlerKey(type), callback);
        }
        send(type, message) {
          const initialBytes = [Protocol_1.Protocol.ROOM_DATA];
          if (typeof type === "string") {
            schema_1.encode.string(initialBytes, type);
          } else {
            schema_1.encode.number(initialBytes, type);
          }
          let arr;
          if (message !== void 0) {
            const encoded = msgpack.encode(message);
            arr = new Uint8Array(initialBytes.length + encoded.byteLength);
            arr.set(new Uint8Array(initialBytes), 0);
            arr.set(new Uint8Array(encoded), initialBytes.length);
          } else {
            arr = new Uint8Array(initialBytes);
          }
          this.connection.send(arr.buffer);
        }
        sendBytes(type, bytes) {
          const initialBytes = [Protocol_1.Protocol.ROOM_DATA_BYTES];
          if (typeof type === "string") {
            schema_1.encode.string(initialBytes, type);
          } else {
            schema_1.encode.number(initialBytes, type);
          }
          let arr;
          arr = new Uint8Array(initialBytes.length + (bytes.byteLength || bytes.length));
          arr.set(new Uint8Array(initialBytes), 0);
          arr.set(new Uint8Array(bytes), initialBytes.length);
          this.connection.send(arr.buffer);
        }
        get state() {
          return this.serializer.getState();
        }
        removeAllListeners() {
          this.onJoin.clear();
          this.onStateChange.clear();
          this.onError.clear();
          this.onLeave.clear();
          this.onMessageHandlers.events = {};
        }
        onMessageCallback(event) {
          const bytes = Array.from(new Uint8Array(event.data));
          const code = bytes[0];
          if (code === Protocol_1.Protocol.JOIN_ROOM) {
            let offset = 1;
            const reconnectionToken = (0, Protocol_1.utf8Read)(bytes, offset);
            offset += (0, Protocol_1.utf8Length)(reconnectionToken);
            this.serializerId = (0, Protocol_1.utf8Read)(bytes, offset);
            offset += (0, Protocol_1.utf8Length)(this.serializerId);
            if (!this.serializer) {
              const serializer = (0, Serializer_1.getSerializer)(this.serializerId);
              this.serializer = new serializer();
            }
            if (bytes.length > offset && this.serializer.handshake) {
              this.serializer.handshake(bytes, { offset });
            }
            this.reconnectionToken = `${this.roomId}:${reconnectionToken}`;
            this.hasJoined = true;
            this.onJoin.invoke();
            this.connection.send([Protocol_1.Protocol.JOIN_ROOM]);
          } else if (code === Protocol_1.Protocol.ERROR) {
            const it = { offset: 1 };
            const code2 = schema_1.decode.number(bytes, it);
            const message = schema_1.decode.string(bytes, it);
            this.onError.invoke(code2, message);
          } else if (code === Protocol_1.Protocol.LEAVE_ROOM) {
            this.leave();
          } else if (code === Protocol_1.Protocol.ROOM_DATA_SCHEMA) {
            const it = { offset: 1 };
            const context = this.serializer.getState().constructor._context;
            const type = context.get(schema_1.decode.number(bytes, it));
            const message = new type();
            message.decode(bytes, it);
            this.dispatchMessage(type, message);
          } else if (code === Protocol_1.Protocol.ROOM_STATE) {
            bytes.shift();
            this.setState(bytes);
          } else if (code === Protocol_1.Protocol.ROOM_STATE_PATCH) {
            bytes.shift();
            this.patch(bytes);
          } else if (code === Protocol_1.Protocol.ROOM_DATA) {
            const it = { offset: 1 };
            const type = schema_1.decode.stringCheck(bytes, it) ? schema_1.decode.string(bytes, it) : schema_1.decode.number(bytes, it);
            const message = bytes.length > it.offset ? msgpack.decode(event.data, it.offset) : void 0;
            this.dispatchMessage(type, message);
          } else if (code === Protocol_1.Protocol.ROOM_DATA_BYTES) {
            const it = { offset: 1 };
            const type = schema_1.decode.stringCheck(bytes, it) ? schema_1.decode.string(bytes, it) : schema_1.decode.number(bytes, it);
            this.dispatchMessage(type, new Uint8Array(bytes.slice(it.offset)));
          }
        }
        setState(encodedState) {
          this.serializer.setState(encodedState);
          this.onStateChange.invoke(this.serializer.getState());
        }
        patch(binaryPatch) {
          this.serializer.patch(binaryPatch);
          this.onStateChange.invoke(this.serializer.getState());
        }
        dispatchMessage(type, message) {
          var _a;
          const messageType = this.getMessageHandlerKey(type);
          if (this.onMessageHandlers.events[messageType]) {
            this.onMessageHandlers.emit(messageType, message);
          } else if (this.onMessageHandlers.events["*"]) {
            this.onMessageHandlers.emit("*", type, message);
          } else {
            (_a = console.warn) === null || _a === void 0 ? void 0 : _a.call(console, `colyseus.js: onMessage() not registered for type '${type}'.`);
          }
        }
        destroy() {
          if (this.serializer) {
            this.serializer.teardown();
          }
        }
        getMessageHandlerKey(type) {
          switch (typeof type) {
            // typeof Schema
            case "function":
              return `$${type._typeid}`;
            // string
            case "string":
              return type;
            // number
            case "number":
              return `i${type}`;
            default:
              throw new Error("invalid message type.");
          }
        }
      };
      exports.Room = Room;
    }
  });

  // node_modules/httpie/xhr/index.mjs
  var xhr_exports = {};
  __export(xhr_exports, {
    del: () => del,
    get: () => get,
    patch: () => patch,
    post: () => post,
    put: () => put,
    send: () => send
  });
  function apply(src, tar) {
    tar.headers = src.headers || {};
    tar.statusMessage = src.statusText;
    tar.statusCode = src.status;
    tar.data = src.response;
  }
  function send(method, uri, opts) {
    return new Promise(function(res, rej) {
      opts = opts || {};
      var req = new XMLHttpRequest();
      var k, tmp, arr, str = opts.body;
      var headers = opts.headers || {};
      if (opts.timeout) req.timeout = opts.timeout;
      req.ontimeout = req.onerror = function(err) {
        err.timeout = err.type == "timeout";
        rej(err);
      };
      req.open(method, uri.href || uri);
      req.onload = function() {
        arr = req.getAllResponseHeaders().trim().split(/[\r\n]+/);
        apply(req, req);
        while (tmp = arr.shift()) {
          tmp = tmp.split(": ");
          req.headers[tmp.shift().toLowerCase()] = tmp.join(": ");
        }
        tmp = req.headers["content-type"];
        if (tmp && !!~tmp.indexOf("application/json")) {
          try {
            req.data = JSON.parse(req.data, opts.reviver);
          } catch (err) {
            apply(req, err);
            return rej(err);
          }
        }
        (req.status >= 400 ? rej : res)(req);
      };
      if (typeof FormData < "u" && str instanceof FormData) {
      } else if (str && typeof str == "object") {
        headers["content-type"] = "application/json";
        str = JSON.stringify(str);
      }
      req.withCredentials = !!opts.withCredentials;
      for (k in headers) {
        req.setRequestHeader(k, headers[k]);
      }
      req.send(str);
    });
  }
  var get, post, patch, del, put;
  var init_xhr = __esm({
    "node_modules/httpie/xhr/index.mjs"() {
      get = /* @__PURE__ */ send.bind(send, "GET");
      post = /* @__PURE__ */ send.bind(send, "POST");
      patch = /* @__PURE__ */ send.bind(send, "PATCH");
      del = /* @__PURE__ */ send.bind(send, "DELETE");
      put = /* @__PURE__ */ send.bind(send, "PUT");
    }
  });

  // node_modules/colyseus.js/lib/HTTP.js
  var require_HTTP = __commonJS({
    "node_modules/colyseus.js/lib/HTTP.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        }
        __setModuleDefault(result, mod);
        return result;
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.HTTP = void 0;
      var ServerError_1 = require_ServerError();
      var httpie = __importStar((init_xhr(), __toCommonJS(xhr_exports)));
      var HTTP = class {
        constructor(client, headers = {}) {
          this.client = client;
          this.headers = headers;
        }
        get(path, options = {}) {
          return this.request("get", path, options);
        }
        post(path, options = {}) {
          return this.request("post", path, options);
        }
        del(path, options = {}) {
          return this.request("del", path, options);
        }
        put(path, options = {}) {
          return this.request("put", path, options);
        }
        request(method, path, options = {}) {
          return httpie[method](this.client["getHttpEndpoint"](path), this.getOptions(options)).catch((e) => {
            var _a;
            const status = e.statusCode;
            const message = ((_a = e.data) === null || _a === void 0 ? void 0 : _a.error) || e.statusMessage || e.message;
            if (!status && !message) {
              throw e;
            }
            throw new ServerError_1.ServerError(status, message);
          });
        }
        getOptions(options) {
          options.headers = Object.assign({}, this.headers, options.headers);
          if (this.authToken) {
            options.headers["Authorization"] = `Bearer ${this.authToken}`;
          }
          if (typeof cc !== "undefined" && cc.sys && cc.sys.isNative) {
          } else {
            options.withCredentials = true;
          }
          return options;
        }
      };
      exports.HTTP = HTTP;
    }
  });

  // node_modules/colyseus.js/lib/Storage.js
  var require_Storage = __commonJS({
    "node_modules/colyseus.js/lib/Storage.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getItem = exports.removeItem = exports.setItem = void 0;
      var storage;
      function getStorage() {
        if (!storage) {
          try {
            storage = typeof cc !== "undefined" && cc.sys && cc.sys.localStorage ? cc.sys.localStorage : window.localStorage;
          } catch (e) {
          }
        }
        if (!storage) {
          storage = {
            cache: {},
            setItem: function(key, value) {
              this.cache[key] = value;
            },
            getItem: function(key) {
              this.cache[key];
            },
            removeItem: function(key) {
              delete this.cache[key];
            }
          };
        }
        return storage;
      }
      function setItem(key, value) {
        getStorage().setItem(key, value);
      }
      exports.setItem = setItem;
      function removeItem(key) {
        getStorage().removeItem(key);
      }
      exports.removeItem = removeItem;
      function getItem(key, callback) {
        const value = getStorage().getItem(key);
        if (typeof Promise === "undefined" || // old browsers
        !(value instanceof Promise)) {
          callback(value);
        } else {
          value.then((id) => callback(id));
        }
      }
      exports.getItem = getItem;
    }
  });

  // node_modules/colyseus.js/lib/Auth.js
  var require_Auth = __commonJS({
    "node_modules/colyseus.js/lib/Auth.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
      };
      var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
      };
      var _Auth__initialized;
      var _Auth__initializationPromise;
      var _Auth__signInWindow;
      var _Auth__events;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Auth = void 0;
      var Storage_1 = require_Storage();
      var nanoevents_1 = require_nanoevents();
      var Auth = class {
        constructor(http) {
          this.http = http;
          this.settings = {
            path: "/auth",
            key: "colyseus-auth-token"
          };
          _Auth__initialized.set(this, false);
          _Auth__initializationPromise.set(this, void 0);
          _Auth__signInWindow.set(this, void 0);
          _Auth__events.set(this, (0, nanoevents_1.createNanoEvents)());
          (0, Storage_1.getItem)(this.settings.key, (token) => this.token = token);
        }
        set token(token) {
          this.http.authToken = token;
        }
        get token() {
          return this.http.authToken;
        }
        onChange(callback) {
          const unbindChange = __classPrivateFieldGet(this, _Auth__events, "f").on("change", callback);
          if (!__classPrivateFieldGet(this, _Auth__initialized, "f")) {
            __classPrivateFieldSet(this, _Auth__initializationPromise, new Promise((resolve, reject) => {
              this.getUserData().then((userData) => {
                this.emitChange(Object.assign(Object.assign({}, userData), { token: this.token }));
              }).catch((e) => {
                this.emitChange({ user: null, token: void 0 });
              }).finally(() => {
                resolve();
              });
            }), "f");
          }
          __classPrivateFieldSet(this, _Auth__initialized, true, "f");
          return unbindChange;
        }
        getUserData() {
          return __awaiter(this, void 0, void 0, function* () {
            if (this.token) {
              return (yield this.http.get(`${this.settings.path}/userdata`)).data;
            } else {
              throw new Error("missing auth.token");
            }
          });
        }
        registerWithEmailAndPassword(email, password, options) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = (yield this.http.post(`${this.settings.path}/register`, {
              body: { email, password, options }
            })).data;
            this.emitChange(data);
            return data;
          });
        }
        signInWithEmailAndPassword(email, password) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = (yield this.http.post(`${this.settings.path}/login`, {
              body: { email, password }
            })).data;
            this.emitChange(data);
            return data;
          });
        }
        signInAnonymously(options) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = (yield this.http.post(`${this.settings.path}/anonymous`, {
              body: { options }
            })).data;
            this.emitChange(data);
            return data;
          });
        }
        sendPasswordResetEmail(email) {
          return __awaiter(this, void 0, void 0, function* () {
            return (yield this.http.post(`${this.settings.path}/forgot-password`, {
              body: { email }
            })).data;
          });
        }
        signInWithProvider(providerName, settings = {}) {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
              const w = settings.width || 480;
              const h = settings.height || 768;
              const upgradingToken = this.token ? `?token=${this.token}` : "";
              const title = `Login with ${providerName[0].toUpperCase() + providerName.substring(1)}`;
              const url = this.http["client"]["getHttpEndpoint"](`${settings.prefix || `${this.settings.path}/provider`}/${providerName}${upgradingToken}`);
              const left = screen.width / 2 - w / 2;
              const top = screen.height / 2 - h / 2;
              __classPrivateFieldSet(this, _Auth__signInWindow, window.open(url, title, "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + w + ", height=" + h + ", top=" + top + ", left=" + left), "f");
              const onMessage = (event) => {
                if (event.data.user === void 0 && event.data.token === void 0) {
                  return;
                }
                clearInterval(rejectionChecker);
                __classPrivateFieldGet(this, _Auth__signInWindow, "f").close();
                __classPrivateFieldSet(this, _Auth__signInWindow, void 0, "f");
                window.removeEventListener("message", onMessage);
                if (event.data.error !== void 0) {
                  reject(event.data.error);
                } else {
                  resolve(event.data);
                  this.emitChange(event.data);
                }
              };
              const rejectionChecker = setInterval(() => {
                if (!__classPrivateFieldGet(this, _Auth__signInWindow, "f") || __classPrivateFieldGet(this, _Auth__signInWindow, "f").closed) {
                  __classPrivateFieldSet(this, _Auth__signInWindow, void 0, "f");
                  reject("cancelled");
                  window.removeEventListener("message", onMessage);
                }
              }, 200);
              window.addEventListener("message", onMessage);
            });
          });
        }
        signOut() {
          return __awaiter(this, void 0, void 0, function* () {
            this.emitChange({ user: null, token: null });
          });
        }
        emitChange(authData) {
          if (authData.token !== void 0) {
            this.token = authData.token;
            if (authData.token === null) {
              (0, Storage_1.removeItem)(this.settings.key);
            } else {
              (0, Storage_1.setItem)(this.settings.key, authData.token);
            }
          }
          __classPrivateFieldGet(this, _Auth__events, "f").emit("change", authData);
        }
      };
      exports.Auth = Auth;
      _Auth__initialized = /* @__PURE__ */ new WeakMap(), _Auth__initializationPromise = /* @__PURE__ */ new WeakMap(), _Auth__signInWindow = /* @__PURE__ */ new WeakMap(), _Auth__events = /* @__PURE__ */ new WeakMap();
    }
  });

  // node_modules/colyseus.js/lib/3rd_party/discord.js
  var require_discord = __commonJS({
    "node_modules/colyseus.js/lib/3rd_party/discord.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.discordURLBuilder = void 0;
      function discordURLBuilder(url) {
        var _a;
        const localHostname = ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) || "localhost";
        const remoteHostnameSplitted = url.hostname.split(".");
        const subdomain = !url.hostname.includes("trycloudflare.com") && // ignore cloudflared subdomains
        !url.hostname.includes("discordsays.com") && // ignore discordsays.com subdomains
        remoteHostnameSplitted.length > 2 ? `/${remoteHostnameSplitted[0]}` : "";
        return url.pathname.startsWith("/.proxy") ? `${url.protocol}//${localHostname}${subdomain}${url.pathname}${url.search}` : `${url.protocol}//${localHostname}/.proxy/colyseus${subdomain}${url.pathname}${url.search}`;
      }
      exports.discordURLBuilder = discordURLBuilder;
    }
  });

  // node_modules/colyseus.js/lib/Client.js
  var require_Client = __commonJS({
    "node_modules/colyseus.js/lib/Client.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      var _a;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Client = exports.MatchMakeError = void 0;
      var ServerError_1 = require_ServerError();
      var Room_1 = require_Room();
      var HTTP_1 = require_HTTP();
      var Auth_1 = require_Auth();
      var discord_1 = require_discord();
      var MatchMakeError = class _MatchMakeError extends Error {
        constructor(message, code) {
          super(message);
          this.code = code;
          Object.setPrototypeOf(this, _MatchMakeError.prototype);
        }
      };
      exports.MatchMakeError = MatchMakeError;
      var DEFAULT_ENDPOINT = typeof window !== "undefined" && typeof ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) !== "undefined" ? `${window.location.protocol.replace("http", "ws")}//${window.location.hostname}${window.location.port && `:${window.location.port}`}` : "ws://127.0.0.1:2567";
      var Client2 = class {
        constructor(settings = DEFAULT_ENDPOINT, options) {
          var _a2, _b;
          if (typeof settings === "string") {
            const url = settings.startsWith("/") ? new URL(settings, DEFAULT_ENDPOINT) : new URL(settings);
            const secure = url.protocol === "https:" || url.protocol === "wss:";
            const port = Number(url.port || (secure ? 443 : 80));
            this.settings = {
              hostname: url.hostname,
              pathname: url.pathname,
              port,
              secure
            };
          } else {
            if (settings.port === void 0) {
              settings.port = settings.secure ? 443 : 80;
            }
            if (settings.pathname === void 0) {
              settings.pathname = "";
            }
            this.settings = settings;
          }
          if (this.settings.pathname.endsWith("/")) {
            this.settings.pathname = this.settings.pathname.slice(0, -1);
          }
          this.http = new HTTP_1.HTTP(this, (options === null || options === void 0 ? void 0 : options.headers) || {});
          this.auth = new Auth_1.Auth(this.http);
          this.urlBuilder = options === null || options === void 0 ? void 0 : options.urlBuilder;
          if (!this.urlBuilder && typeof window !== "undefined" && ((_b = (_a2 = window === null || window === void 0 ? void 0 : window.location) === null || _a2 === void 0 ? void 0 : _a2.hostname) === null || _b === void 0 ? void 0 : _b.includes("discordsays.com"))) {
            this.urlBuilder = discord_1.discordURLBuilder;
            console.log("Colyseus SDK: Discord Embedded SDK detected. Using custom URL builder.");
          }
        }
        joinOrCreate(roomName, options = {}, rootSchema) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest("joinOrCreate", roomName, options, rootSchema);
          });
        }
        create(roomName, options = {}, rootSchema) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest("create", roomName, options, rootSchema);
          });
        }
        join(roomName, options = {}, rootSchema) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest("join", roomName, options, rootSchema);
          });
        }
        joinById(roomId, options = {}, rootSchema) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest("joinById", roomId, options, rootSchema);
          });
        }
        /**
         * Re-establish connection with a room this client was previously connected to.
         *
         * @param reconnectionToken The `room.reconnectionToken` from previously connected room.
         * @param rootSchema (optional) Concrete root schema definition
         * @returns Promise<Room>
         */
        reconnect(reconnectionToken, rootSchema) {
          return __awaiter(this, void 0, void 0, function* () {
            if (typeof reconnectionToken === "string" && typeof rootSchema === "string") {
              throw new Error("DEPRECATED: .reconnect() now only accepts 'reconnectionToken' as argument.\nYou can get this token from previously connected `room.reconnectionToken`");
            }
            const [roomId, token] = reconnectionToken.split(":");
            if (!roomId || !token) {
              throw new Error("Invalid reconnection token format.\nThe format should be roomId:reconnectionToken");
            }
            return yield this.createMatchMakeRequest("reconnect", roomId, { reconnectionToken: token }, rootSchema);
          });
        }
        getAvailableRooms(roomName = "") {
          return __awaiter(this, void 0, void 0, function* () {
            return (yield this.http.get(`matchmake/${roomName}`, {
              headers: {
                "Accept": "application/json"
              }
            })).data;
          });
        }
        consumeSeatReservation(response, rootSchema, reuseRoomInstance) {
          return __awaiter(this, void 0, void 0, function* () {
            const room = this.createRoom(response.room.name, rootSchema);
            room.roomId = response.room.roomId;
            room.sessionId = response.sessionId;
            const options = { sessionId: room.sessionId };
            if (response.reconnectionToken) {
              options.reconnectionToken = response.reconnectionToken;
            }
            const targetRoom = reuseRoomInstance || room;
            room.connect(this.buildEndpoint(response.room, options), response.devMode && (() => __awaiter(this, void 0, void 0, function* () {
              console.info(`[Colyseus devMode]: ${String.fromCodePoint(128260)} Re-establishing connection with room id '${room.roomId}'...`);
              let retryCount = 0;
              let retryMaxRetries = 8;
              const retryReconnection = () => __awaiter(this, void 0, void 0, function* () {
                retryCount++;
                try {
                  yield this.consumeSeatReservation(response, rootSchema, targetRoom);
                  console.info(`[Colyseus devMode]: ${String.fromCodePoint(9989)} Successfully re-established connection with room '${room.roomId}'`);
                } catch (e) {
                  if (retryCount < retryMaxRetries) {
                    console.info(`[Colyseus devMode]: ${String.fromCodePoint(128260)} retrying... (${retryCount} out of ${retryMaxRetries})`);
                    setTimeout(retryReconnection, 2e3);
                  } else {
                    console.info(`[Colyseus devMode]: ${String.fromCodePoint(10060)} Failed to reconnect. Is your server running? Please check server logs.`);
                  }
                }
              });
              setTimeout(retryReconnection, 2e3);
            })), targetRoom, this.http.headers);
            return new Promise((resolve, reject) => {
              const onError = (code, message) => reject(new ServerError_1.ServerError(code, message));
              targetRoom.onError.once(onError);
              targetRoom["onJoin"].once(() => {
                targetRoom.onError.remove(onError);
                resolve(targetRoom);
              });
            });
          });
        }
        createMatchMakeRequest(method, roomName, options = {}, rootSchema, reuseRoomInstance) {
          return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.http.post(`matchmake/${method}/${roomName}`, {
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
              },
              body: JSON.stringify(options)
            })).data;
            if (response.error) {
              throw new MatchMakeError(response.error, response.code);
            }
            if (method === "reconnect") {
              response.reconnectionToken = options.reconnectionToken;
            }
            return yield this.consumeSeatReservation(response, rootSchema, reuseRoomInstance);
          });
        }
        createRoom(roomName, rootSchema) {
          return new Room_1.Room(roomName, rootSchema);
        }
        buildEndpoint(room, options = {}) {
          const params = [];
          for (const name in options) {
            if (!options.hasOwnProperty(name)) {
              continue;
            }
            params.push(`${name}=${options[name]}`);
          }
          let endpoint = this.settings.secure ? "wss://" : "ws://";
          if (room.publicAddress) {
            endpoint += `${room.publicAddress}`;
          } else {
            endpoint += `${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}`;
          }
          const endpointURL = `${endpoint}/${room.processId}/${room.roomId}?${params.join("&")}`;
          return this.urlBuilder ? this.urlBuilder(new URL(endpointURL)) : endpointURL;
        }
        getHttpEndpoint(segments = "") {
          const path = segments.startsWith("/") ? segments : `/${segments}`;
          const endpointURL = `${this.settings.secure ? "https" : "http"}://${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}${path}`;
          return this.urlBuilder ? this.urlBuilder(new URL(endpointURL)) : endpointURL;
        }
        getEndpointPort() {
          return this.settings.port !== 80 && this.settings.port !== 443 ? `:${this.settings.port}` : "";
        }
      };
      exports.Client = Client2;
    }
  });

  // node_modules/colyseus.js/lib/serializer/SchemaSerializer.js
  var require_SchemaSerializer = __commonJS({
    "node_modules/colyseus.js/lib/serializer/SchemaSerializer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SchemaSerializer = void 0;
      var schema_1 = require_umd();
      var SchemaSerializer = class {
        setState(rawState) {
          return this.state.decode(rawState);
        }
        getState() {
          return this.state;
        }
        patch(patches) {
          return this.state.decode(patches);
        }
        teardown() {
          var _a, _b;
          (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a["$changes"]) === null || _b === void 0 ? void 0 : _b.root.clearRefs();
        }
        handshake(bytes, it) {
          if (this.state) {
            const reflection = new schema_1.Reflection();
            reflection.decode(bytes, it);
          } else {
            this.state = schema_1.Reflection.decode(bytes, it);
          }
        }
      };
      exports.SchemaSerializer = SchemaSerializer;
    }
  });

  // node_modules/colyseus.js/lib/serializer/NoneSerializer.js
  var require_NoneSerializer = __commonJS({
    "node_modules/colyseus.js/lib/serializer/NoneSerializer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.NoneSerializer = void 0;
      var NoneSerializer = class {
        setState(rawState) {
        }
        getState() {
          return null;
        }
        patch(patches) {
        }
        teardown() {
        }
        handshake(bytes) {
        }
      };
      exports.NoneSerializer = NoneSerializer;
    }
  });

  // node_modules/colyseus.js/lib/index.js
  var require_lib = __commonJS({
    "node_modules/colyseus.js/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SchemaSerializer = exports.registerSerializer = exports.Auth = exports.Room = exports.ErrorCode = exports.Protocol = exports.MatchMakeError = exports.Client = void 0;
      require_legacy();
      var Client_1 = require_Client();
      Object.defineProperty(exports, "Client", { enumerable: true, get: function() {
        return Client_1.Client;
      } });
      Object.defineProperty(exports, "MatchMakeError", { enumerable: true, get: function() {
        return Client_1.MatchMakeError;
      } });
      var Protocol_1 = require_Protocol();
      Object.defineProperty(exports, "Protocol", { enumerable: true, get: function() {
        return Protocol_1.Protocol;
      } });
      Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function() {
        return Protocol_1.ErrorCode;
      } });
      var Room_1 = require_Room();
      Object.defineProperty(exports, "Room", { enumerable: true, get: function() {
        return Room_1.Room;
      } });
      var Auth_1 = require_Auth();
      Object.defineProperty(exports, "Auth", { enumerable: true, get: function() {
        return Auth_1.Auth;
      } });
      var SchemaSerializer_1 = require_SchemaSerializer();
      Object.defineProperty(exports, "SchemaSerializer", { enumerable: true, get: function() {
        return SchemaSerializer_1.SchemaSerializer;
      } });
      var NoneSerializer_1 = require_NoneSerializer();
      var Serializer_1 = require_Serializer();
      Object.defineProperty(exports, "registerSerializer", { enumerable: true, get: function() {
        return Serializer_1.registerSerializer;
      } });
      (0, Serializer_1.registerSerializer)("schema", SchemaSerializer_1.SchemaSerializer);
      (0, Serializer_1.registerSerializer)("none", NoneSerializer_1.NoneSerializer);
    }
  });

  // client-entry.js
  var client_entry_exports = {};
  __export(client_entry_exports, {
    Client: () => import_colyseus.Client
  });
  var import_colyseus = __toESM(require_lib());
  return __toCommonJS(client_entry_exports);
})();
