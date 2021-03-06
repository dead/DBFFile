"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(require('fs'));
var _ = require("lodash");
var moment = require("moment");
var MemoFile = require("memo_file");
var pathNode = require("path");
// For information about the dBase III file format, see:
// http://www.dbf2002.com/dbf-file-format.html
// http://www.dbase.com/KnowledgeBase/int/db7_file_fmt.htm
/** Open an existing DBF file. */
function open(path) {
    return openDBF(path);
}
exports.open = open;
/** Create a new DBF file with no records. */
function create(path, fields) {
    return createDBF(path, fields);
}
exports.create = create;
/** Represents a DBF file. */
var DBFFile = /** @class */ (function () {
    function DBFFile() {
        /** Full path to the DBF file. */
        this.path = null;
        /** Total number of records in the DBF file. */
        this.recordCount = null;
        /** Metadata for all fields defined in the DBF file. */
        this.fields = null;
    }
    /** Append the specified records to this DBF file. */
    DBFFile.prototype.append = function (records) {
        return appendToDBF(this, records);
    };
    /** Read a subset of records from this DBF file. */
    DBFFile.prototype.readRecords = function (maxRows) {
        if (maxRows === void 0) { maxRows = 10000000; }
        return readRecordsFromDBF(this, maxRows);
    };
    DBFFile.prototype.updateRecord = function (RECNO, data) {
        return updateRecordFromDBF(this, RECNO, data);
    };
    return DBFFile;
}());
exports.DBFFile = DBFFile;
//-------------------- Private implementation starts here --------------------
var openDBF = function (path) { return __awaiter(_this, void 0, void 0, function () {
    var fd, buffer, fileVersion, recordCount, headerLength, recordLength, fields, type, field, _memoFile, extname, memoFilePath, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 7, 10]);
                return [4 /*yield*/, (fs.openAsync(path, 'r'))];
            case 1:
                fd = _a.sent();
                buffer = new Buffer(32);
                // Read various properties from the header record.
                return [4 /*yield*/, (fs.readAsync(fd, buffer, 0, 32, 0))];
            case 2:
                // Read various properties from the header record.
                _a.sent();
                fileVersion = buffer.readInt8(0);
                recordCount = buffer.readInt32LE(4);
                headerLength = buffer.readInt16LE(8);
                recordLength = buffer.readInt16LE(10);
                fields = [];
                _a.label = 3;
            case 3:
                if (!(headerLength > 32 + fields.length * 32)) return [3 /*break*/, 5];
                return [4 /*yield*/, (fs.readAsync(fd, buffer, 0, 32, 32 + fields.length * 32))];
            case 4:
                _a.sent();
                if (buffer.readUInt8(0) === 0x0D)
                    return [3 /*break*/, 5];
                type = String.fromCharCode(buffer[0x0B]);
                field = {
                    name: buffer.toString('utf8', 0, 10).split('\0')[0],
                    type: type,
                    size: type === 'C' ? buffer.readInt16LE(0x10) : buffer.readUInt8(0x10),
                    decs: type === 'C' ? 0 : buffer.readUInt8(0x11)
                };
                assert(fields.every(function (f) { return f.name !== field.name; }), "Duplicate field name: '" + field.name + "'");
                fields.push(field);
                return [3 /*break*/, 3];
            case 5:
                _memoFile = null;
                if (fields.map(function (f) { return f.type == 'M'; }).length > 0) {
                    extname = pathNode.extname(path);
                    memoFilePath = path.replace(extname, '.fpt');
                    if (fs.existsSync(memoFilePath)) {
                        _memoFile = new MemoFile(memoFilePath);
                    }
                }
                // Parse the header terminator.
                return [4 /*yield*/, (fs.readAsync(fd, buffer, 0, 1, 32 + fields.length * 32))];
            case 6:
                // Parse the header terminator.
                _a.sent();
                assert(buffer[0] === 0x0d, 'Invalid DBF: Expected header terminator');
                // Validate the record length.
                assert(recordLength === calcRecordLength(fields), 'Invalid DBF: Incorrect record length');
                result = new DBFFile();
                result.path = path;
                result.recordCount = recordCount;
                result.fields = fields;
                result._recordsRead = 0;
                result._headerLength = headerLength;
                result._recordLength = recordLength;
                result._ignoreDeleted = true;
                result._returnNull = true;
                result._returnDate = true;
                result._memoFile = _memoFile;
                return [2 /*return*/, result];
            case 7:
                if (!fd) return [3 /*break*/, 9];
                return [4 /*yield*/, (fs.closeAsync(fd))];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9: return [7 /*endfinally*/];
            case 10: return [2 /*return*/];
        }
    });
}); };
var createDBF = function (path, fields) { return __awaiter(_this, void 0, void 0, function () {
    var fd, buffer, now, headerLength, recordLength, i, name, type, size, decs, j, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 8, 11]);
                // Validate the field metadata.
                validateFields(fields);
                return [4 /*yield*/, (fs.openAsync(path, 'wx'))];
            case 1:
                fd = _a.sent();
                buffer = new Buffer(32);
                // Write the header structure up to the field descriptors.
                buffer.writeUInt8(0x03, 0x00); // Version (set to dBase III)
                now = new Date();
                buffer.writeUInt8(now.getFullYear() - 1900, 0x01); // YY (year minus 1900)
                buffer.writeUInt8(now.getMonth(), 0x02); // MM
                buffer.writeUInt8(now.getDate(), 0x03); // DD
                buffer.writeInt32LE(0, 0x04); // Number of records (set to zero)
                headerLength = 34 + (fields.length * 32);
                buffer.writeUInt16LE(headerLength, 0x08); // Length of header structure
                recordLength = calcRecordLength(fields);
                buffer.writeUInt16LE(recordLength, 0x0A); // Length of each record
                buffer.writeUInt32LE(0, 0x0C); // Reserved/unused (set to zero)
                buffer.writeUInt32LE(0, 0x10); // Reserved/unused (set to zero)
                buffer.writeUInt32LE(0, 0x14); // Reserved/unused (set to zero)
                buffer.writeUInt32LE(0, 0x18); // Reserved/unused (set to zero)
                buffer.writeUInt32LE(0, 0x1C); // Reserved/unused (set to zero)
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, 32, 0))];
            case 2:
                _a.sent();
                i = 0;
                _a.label = 3;
            case 3:
                if (!(i < fields.length)) return [3 /*break*/, 6];
                name = fields[i].name, type = fields[i].type, size = fields[i].size, decs = fields[i].decs || 0;
                buffer.write(name, 0, name.length, 'utf8'); // Field name (up to 10 chars)
                for (j = name.length; j < 11; ++j) { // null terminator(s)
                    buffer.writeUInt8(0, j);
                }
                buffer.writeUInt8(type.charCodeAt(0), 0x0B); // Field type
                buffer.writeUInt32LE(0, 0x0C); // Field data address (set to zero)
                if (type !== 'C') {
                    buffer.writeUInt8(size, 0x10); // Field length
                    buffer.writeUInt8(decs, 0x11); // Decimal count
                }
                else {
                    buffer.writeUInt16LE(size, 0x10);
                }
                buffer.writeUInt16LE(0, 0x12); // Reserved (set to zero)
                buffer.writeUInt8(0x01, 0x14); // Work area ID (always 01h for dBase III)
                buffer.writeUInt16LE(0, 0x15); // Reserved (set to zero)
                buffer.writeUInt8(0, 0x17); // Flag for SET fields (set to zero)
                buffer.writeUInt32LE(0, 0x18); // Reserved (set to zero)
                buffer.writeUInt32LE(0, 0x1C); // Reserved (set to zero)
                buffer.writeUInt8(0, 0x1F); // Index field flag (set to zero)
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, 32, 32 + i * 32))];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                ++i;
                return [3 /*break*/, 3];
            case 6:
                // Write the header terminator and EOF marker.
                buffer.writeUInt8(0x0D, 0); // Header terminator
                buffer.writeUInt8(0x00, 1); // Null byte (unnecessary but common, accounted for in header length)
                buffer.writeUInt8(0x1A, 2); // EOF marker
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, 3, 32 + fields.length * 32))];
            case 7:
                _a.sent();
                result = new DBFFile();
                result.path = path;
                result.recordCount = 0;
                result.fields = _.cloneDeep(fields);
                result._recordsRead = 0;
                result._headerLength = headerLength;
                result._recordLength = recordLength;
                result._ignoreDeleted = true;
                result._returnNull = true;
                result._returnDate = true;
                return [2 /*return*/, result];
            case 8:
                if (!fd) return [3 /*break*/, 10];
                return [4 /*yield*/, (fs.closeAsync(fd))];
            case 9:
                _a.sent();
                _a.label = 10;
            case 10: return [7 /*endfinally*/];
            case 11: return [2 /*return*/];
        }
    });
}); };
var updateRecordFromDBF = function (dbf, RECNO, data) { return __awaiter(_this, void 0, void 0, function () {
    var fd, recordLength, buffer, currentPosition, offset, j, field, value, k, byte;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 4, 7]);
                return [4 /*yield*/, (fs.openAsync(dbf.path, 'r+'))];
            case 1:
                fd = _a.sent();
                recordLength = calcRecordLength(dbf.fields);
                buffer = new Buffer(recordLength);
                currentPosition = dbf._headerLength + ((RECNO - 1) * recordLength);
                return [4 /*yield*/, (fs.readAsync(fd, buffer, 0, recordLength, currentPosition))];
            case 2:
                _a.sent();
                offset = 0;
                offset++;
                for (j = 0; j < dbf.fields.length; ++j) {
                    field = dbf.fields[j];
                    if (data[field.name]) {
                        value = data[field.name];
                        switch (field.type) {
                            case 'C': // Text
                                for (k = 0; k < field.size; ++k) {
                                    byte = k < value.length ? value.charCodeAt(k) : 0x20;
                                    buffer.writeUInt8(byte, offset++);
                                }
                                break;
                            case 'N': // Number
                                value = value.toString();
                                value = value.slice(0, field.size);
                                while (value.length < field.size)
                                    value = ' ' + value;
                                buffer.write(value, offset, field.size, 'utf8');
                                break;
                            case 'L': // Boolean
                                buffer.writeUInt8(value ? 0x54 /* 'T' */ : 0x46 /* 'F' */, offset++);
                                break;
                            case 'D': // Date
                                value = value ? moment(value).format('YYYYMMDD') : '        ';
                                buffer.write(value, offset, 8, 'utf8');
                                break;
                            case 'I': // Integer
                                buffer.writeInt32LE(value, offset);
                                break;
                            default:
                                throw new Error("Type '" + field.type + "' is not supported");
                        }
                    }
                    offset += field.size;
                }
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, recordLength, currentPosition))];
            case 3:
                _a.sent();
                return [3 /*break*/, 7];
            case 4:
                if (!fd) return [3 /*break*/, 6];
                return [4 /*yield*/, (fs.closeAsync(fd))];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6: return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
var appendToDBF = function (dbf, records) { return __awaiter(_this, void 0, void 0, function () {
    var fd, recordLength, buffer, currentPosition, i, record, offset, j, field, value, raw, k, byte;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 8, 11]);
                return [4 /*yield*/, (fs.openAsync(dbf.path, 'r+'))];
            case 1:
                fd = _a.sent();
                recordLength = calcRecordLength(dbf.fields);
                buffer = new Buffer(recordLength + 4);
                currentPosition = dbf._headerLength + dbf.recordCount * recordLength;
                i = 0;
                _a.label = 2;
            case 2:
                if (!(i < records.length)) return [3 /*break*/, 5];
                record = records[i];
                validateRecord(dbf.fields, record);
                offset = 0;
                buffer.writeUInt8(0x20, offset++); // Record deleted flag
                // Write each field in the record.
                for (j = 0; j < dbf.fields.length; ++j) {
                    field = dbf.fields[j];
                    value = records[i][field.name];
                    if (value === null || typeof value === 'undefined')
                        value = '';
                    raw = records[i]._raw && records[i]._raw[field.name];
                    if (raw && Buffer.isBuffer(raw) && raw.length === field.size) {
                        raw.copy(buffer, offset);
                        offset += field.size;
                        continue;
                    }
                    // Encode the field in the buffer, according to its type.
                    switch (field.type) {
                        case 'C': // Text
                            for (k = 0; k < field.size; ++k) {
                                byte = k < value.length ? value.charCodeAt(k) : 0x20;
                                buffer.writeUInt8(byte, offset++);
                            }
                            break;
                        case 'N': // Number
                            value = value.toString();
                            value = value.slice(0, field.size);
                            while (value.length < field.size)
                                value = ' ' + value;
                            buffer.write(value, offset, field.size, 'utf8');
                            offset += field.size;
                            break;
                        case 'L': // Boolean
                            buffer.writeUInt8(value ? 0x54 /* 'T' */ : 0x46 /* 'F' */, offset++);
                            break;
                        case 'D': // Date
                            value = value ? moment(value).format('YYYYMMDD') : '        ';
                            buffer.write(value, offset, 8, 'utf8');
                            offset += 8;
                            break;
                        case 'I': // Integer
                            buffer.writeInt32LE(value, offset);
                            offset += field.size;
                            break;
                        default:
                            throw new Error("Type '" + field.type + "' is not supported");
                    }
                }
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, recordLength, currentPosition))];
            case 3:
                _a.sent();
                currentPosition += recordLength;
                _a.label = 4;
            case 4:
                ++i;
                return [3 /*break*/, 2];
            case 5:
                // Write a new EOF marker.
                buffer.writeUInt8(0x1A, 0);
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, 1, currentPosition))];
            case 6:
                _a.sent();
                // Update the record count in the file and in the DBFFile instance.
                dbf.recordCount += records.length;
                buffer.writeInt32LE(dbf.recordCount, 0);
                return [4 /*yield*/, (fs.writeAsync(fd, buffer, 0, 4, 0x04))];
            case 7:
                _a.sent();
                // Return the same DBFFile instance.
                return [2 /*return*/, dbf];
            case 8:
                if (!fd) return [3 /*break*/, 10];
                return [4 /*yield*/, (fs.closeAsync(fd))];
            case 9:
                _a.sent();
                _a.label = 10;
            case 10: return [7 /*endfinally*/];
            case 11: return [2 /*return*/];
        }
    });
}); };
var readRecordsFromDBF = function (dbf, maxRows) { return __awaiter(_this, void 0, void 0, function () {
    var fd, rowsInBuffer, recordLength, buffer, currentPosition, substr, rows, recordNumber, maxRows1, maxRows2, rowsToRead, i, offset, row, isDeleted, j, field, len, value, c;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, , 5, 8]);
                return [4 /*yield*/, (fs.openAsync(dbf.path, 'r'))];
            case 1:
                fd = _a.sent();
                rowsInBuffer = 1000;
                recordLength = dbf._recordLength;
                buffer = new Buffer(recordLength * rowsInBuffer);
                currentPosition = dbf._headerLength + recordLength * dbf._recordsRead;
                substr = function (start, count) { return buffer.toString('binary', start, start + count); };
                rows = [];
                recordNumber = dbf._recordsRead;
                _a.label = 2;
            case 2:
                if (!true) return [3 /*break*/, 4];
                maxRows1 = dbf.recordCount - dbf._recordsRead;
                maxRows2 = maxRows - rows.length;
                rowsToRead = maxRows1 < maxRows2 ? maxRows1 : maxRows2;
                if (rowsToRead > rowsInBuffer)
                    rowsToRead = rowsInBuffer;
                // Quit when no more rows to read.
                if (rowsToRead === 0)
                    return [3 /*break*/, 4];
                // Read the chunk of rows into the buffer.
                return [4 /*yield*/, (fs.readAsync(fd, buffer, 0, recordLength * rowsToRead, currentPosition))];
            case 3:
                // Read the chunk of rows into the buffer.
                _a.sent();
                dbf._recordsRead += rowsToRead;
                currentPosition += recordLength * rowsToRead;
                // Parse each row.
                for (i = 0, offset = 0; i < rowsToRead; ++i) {
                    recordNumber++;
                    row = { _raw: {}, RECNO: recordNumber, DELETED: false };
                    isDeleted = (buffer[offset++] === 0x2a);
                    if (isDeleted && dbf._ignoreDeleted) {
                        offset += recordLength - 1;
                        continue;
                    }
                    row.DELETED = isDeleted;
                    // Parse each field.
                    for (j = 0; j < dbf.fields.length; ++j) {
                        field = dbf.fields[j];
                        len = field.size, value = null;
                        // Keep raw buffer data for each field value.
                        // row._raw[field.name] = buffer.slice(offset, offset + field.size);
                        // Decode the field from the buffer, according to its type.
                        switch (field.type) {
                            case 'C': // Text
                                while (len > 0 && buffer[offset + len - 1] === 0x20)
                                    --len;
                                value = substr(offset, len);
                                offset += field.size;
                                break;
                            case 'N': // Number
                                while (len > 0 && buffer[offset] === 0x20)
                                    ++offset, --len;
                                value = len > 0 ? parseFloat(substr(offset, len)) : (dbf._returnNull ? null : 0.0);
                                offset += len;
                                break;
                            case 'L': // Boolean
                                c = String.fromCharCode(buffer[offset++]);
                                value = 'TtYy'.indexOf(c) >= 0 ? true : ('FfNn'.indexOf(c) >= 0 ? false : (dbf._returnNull ? null : false));
                                break;
                            case 'D': // Date
                                value = buffer[offset] === 0x20 ? (dbf._returnNull ?
                                    null :
                                    (dbf._returnDate ?
                                        moment.utc("1900-01-01", "YYYYMMDD").toDate() :
                                        "1900-01-01")) :
                                    (dbf._returnDate ?
                                        moment.utc(substr(offset, 8), "YYYYMMDD").toDate() :
                                        moment.utc(substr(offset, 8), "YYYYMMDD").format("YYYY-MM-DD"));
                                offset += 8;
                                break;
                            case 'I': // Integer
                                value = buffer.readInt32LE(offset);
                                offset += field.size;
                                break;
                            case 'M': // Memo
                                while (len > 0 && buffer[offset] === 0x20)
                                    ++offset, --len;
                                value = len > 0 ? parseFloat(substr(offset, len)) : (dbf._returnNull ? null : 0.0);
                                offset += len;
                                if (!isNaN(value) && dbf._memoFile) {
                                    value = dbf._memoFile.getBlockContentAt(value);
                                }
                                break;
                            default:
                                throw new Error("Type '" + field.type + "' is not supported");
                        }
                        row[field.name] = value;
                    }
                    //add the row to the result.
                    rows.push(row);
                }
                // Allocate a new buffer, so that all the raw buffer slices created above arent't invalidated.
                buffer = new Buffer(recordLength * rowsInBuffer);
                return [3 /*break*/, 2];
            case 4: 
            // Return all the rows that were read.
            return [2 /*return*/, rows];
            case 5:
                if (!fd) return [3 /*break*/, 7];
                return [4 /*yield*/, (fs.closeAsync(fd))];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7: return [7 /*endfinally*/];
            case 8: return [2 /*return*/];
        }
    });
}); };
function validateFields(fields) {
    if (fields.length > 2046)
        throw new Error('Too many fields (maximum is 2046)');
    for (var i = 0; i < fields.length; ++i) {
        var name = fields[i].name, type = fields[i].type, size = fields[i].size, decs = fields[i].decs;
        if (!_.isString(name))
            throw new Error('Name must be a string');
        if (!_.isString(type) || type.length !== 1)
            throw new Error('Type must be a single character');
        if (!_.isNumber(size))
            throw new Error('Size must be a number');
        if (decs && !_.isNumber(decs))
            throw new Error('Decs must be null, or a number');
        if (name.length < 1)
            throw new Error("Field name '" + name + "' is too short (minimum is 1 char)");
        if (name.length > 10)
            throw new Error("Field name '" + name + "' is too long (maximum is 10 chars)");
        if (['C', 'N', 'L', 'D', 'I'].indexOf(type) === -1)
            throw new Error("Type '" + type + "' is not supported");
        if (size < 1)
            throw new Error('Field size is too small (minimum is 1)');
        if (type === 'C' && size > 65535)
            throw new Error('Field size is too large (maximum is 65535)');
        if (type === 'N' && size > 20)
            throw new Error('Field size is too large (maximum is 20)');
        if (type === 'L' && size !== 1)
            throw new Error('Invalid field size (must be 1)');
        if (type === 'D' && size !== 8)
            throw new Error('Invalid field size (must be 8)');
        if (type === 'I' && size !== 4)
            throw new Error('Invalid field size (must be 4)');
        if (decs && decs > 15)
            throw new Error('Decimal count is too large (maximum is 15)');
    }
}
function validateRecord(fields, record) {
    for (var i = 0; i < fields.length; ++i) {
        var name = fields[i].name, type = fields[i].type;
        var value = record[name];
        // Always allow null values
        if (value === null || typeof value === 'undefined')
            continue;
        // Perform type-specific checks
        if (type === 'C') {
            if (!_.isString(value))
                throw new Error('Expected a string');
            if (value.length > 255)
                throw new Error('Text is too long (maximum length is 255 chars)');
        }
        else if (type === 'N') {
            if (!_.isNumber(value))
                throw new Error('Expected a number');
        }
        else if (type === 'D') {
            if (!_.isDate(value))
                throw new Error('Expected a date');
        }
    }
}
function calcRecordLength(fields) {
    var len = 1; // 'Record deleted flag' adds one byte
    for (var i = 0; i < fields.length; ++i)
        len += fields[i].size;
    return len;
}
//# sourceMappingURL=dbf-file.js.map