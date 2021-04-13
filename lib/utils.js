"use strict";
/**
 * This file is part of the node-appstore-connect distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * node-appstore-connect is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * node-appstore-connect is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCSV = exports.isNil = exports.gunzip = void 0;
const csv = require("csv-parser");
const zlib = require("zlib");
function gunzip(input, encoding) {
    return new Promise((resolve, reject) => {
        try {
            zlib.gunzip(input, (err, unzipped) => {
                try {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(isNil(encoding) ?
                            unzipped : unzipped.toString(encoding));
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.gunzip = gunzip;
/**
 * Checks if a value is (null) or (undefined).
 *
 * @param {unknown} val The value to check.
 *
 * @return {boolean} Is (null) or (undefined).
 */
function isNil(val) {
    return null === val ||
        'undefined' === typeof val;
}
exports.isNil = isNil;
/**
 * Parses data as CSV.
 *
 * @param {any} data The data to parse.
 *
 * @return {Promise<TRow[]>} The promise with the rows.
 */
function readCSV(data) {
    return new Promise((resolve, reject) => {
        try {
            const ROWS = [];
            const CSV_PARSER = csv({
                separator: "\t"
            });
            CSV_PARSER.once('error', (err) => {
                reject(err);
            });
            CSV_PARSER.once('end', () => {
                resolve(ROWS);
            });
            CSV_PARSER.on('readable', function () {
                try {
                    let r;
                    while (r = CSV_PARSER.read()) {
                        ROWS.push(r);
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            CSV_PARSER.write(data);
            CSV_PARSER.end();
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.readCSV = readCSV;
//# sourceMappingURL=utils.js.map