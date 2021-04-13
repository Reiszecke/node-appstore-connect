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
exports.Client = exports.DownloadSalesReportFrequency = void 0;
const got = require('got');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const utils = require('./utils');
const gunzip = utils.gunzip;
const isNil = utils.isNil;
const readCSV = utils.readCSV;
/**
 * The frequence of a report.
 */
var DownloadSalesReportFrequency;
(function (DownloadSalesReportFrequency) {
    /**
     * Daily
     */
    DownloadSalesReportFrequency["Daily"] = "DAILY";
    /**
     * Monthly
     */
    DownloadSalesReportFrequency["Monthly"] = "MONTHLY";
    /**
     * Weekly
     */
    DownloadSalesReportFrequency["Weekly"] = "WEEKLY";
    /**
     * Yearly
     */
    DownloadSalesReportFrequency["Yearly"] = "YEARLY";
})(DownloadSalesReportFrequency = exports.DownloadSalesReportFrequency || (exports.DownloadSalesReportFrequency = {}));
/**
 * A client for the App Store Connect API.
 */
class Client {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ClientOptions} options The options.
     */
    constructor(options) {
        this.options = options;
    }
    _getBearerToken() {
        if (isNil(this._bearerToken)) {
            const NOW = Math.round((new Date()).getTime() / 1000);
            let expriresIn = this.options.expriresIn;
            if (isNaN(expriresIn)) {
                expriresIn = 1200;
            }
            const PAYLOAD = {
                'iss': this.options.issuerId,
                'exp': NOW + expriresIn,
                'aud': 'appstoreconnect-v1'
            };
            const SIGN_OPTS = {
                'algorithm': 'ES256',
                'header': {
                    'alg': 'ES256',
                    'kid': this.options.apiKey,
                    'typ': 'JWT'
                }
            };
            this._bearerToken = jwt.sign(PAYLOAD, this.options.privateKey, SIGN_OPTS);
        }
        return this._bearerToken;
    }
    /**
     * Downloads a summary of a sales report.
     *
     * @param {DownloadSalesReportSummaryOptions} opts The options.
     *
     * @return {Promise<SalesReportRow[]>} The promise with the rows.
     */
    async downloadSalesReportSummary(opts) {
        let reportDate = opts.date;
        if (isNil(reportDate)) {
            reportDate = moment();
        }
        if (!moment.isMoment(reportDate)) {
            reportDate = moment(reportDate);
        }
        let frequency = opts.frequency;
        if (isNil(frequency)) {
            frequency = DownloadSalesReportFrequency.Weekly;
        }
        let filterReportDate;
        switch (frequency) {
            case DownloadSalesReportFrequency.Weekly:
                reportDate = moment(reportDate.toDate()).endOf('isoWeek');
                filterReportDate = reportDate.format('YYYY-MM-DD');
                break;
            case DownloadSalesReportFrequency.Monthly:
                filterReportDate = reportDate.format('YYYY-MM');
                break;
            case DownloadSalesReportFrequency.Yearly:
                filterReportDate = reportDate.format('YYYY');
                break;
            default:
                filterReportDate = reportDate.format('YYYY-MM-DD');
                break;
        }
        const TOKEN = this._getBearerToken();
        const urlString = `https://api.appstoreconnect.apple.com/v1/salesReports?filter[frequency]=${frequency}&filter[reportDate]=${filterReportDate}&filter[reportSubType]=SUMMARY&filter[reportType]=SALES&filter[vendorNumber]=${opts.vendorId}&filter[version]=1_0`;
        console.log(urlString);
        const RESPONSE = await got.get(urlString, {
            'headers': {
                'Authorization': 'Bearer ' + TOKEN,
                'Accept': 'application/a-gzip'
            },
            //'encoding': null,
            'responseType': 'buffer',
            'throwHttpErrors': false,
        });
        //console.log(RESPONSE.body)
        console.log(RESPONSE.body.length);
        console.log(RESPONSE.statusCode);
        if (200 !== RESPONSE.statusCode) {
            if (404 === RESPONSE.statusCode) {
                return [];
            }
            throw new Error(`Unexpected Response: [${RESPONSE.statusCode}] '${RESPONSE.body}'`);
        }
        const ZIPPED_CSV = RESPONSE.body;
        console.log("ZIPPED_CSV");
        //console.log(ZIPPED_CSV)
        const ALL_ROWS = await readCSV(await gunzip(ZIPPED_CSV, 'utf8'));
        const ROWS = [];
        const FILTER = isNil(opts.filter) ?
            () => true : opts.filter;
        for (const R of ALL_ROWS) {
            if (await Promise.resolve(FILTER(R))) {
                ROWS.push(R);
            }
        }
        return ROWS;
    }
    /**
     * Returns a summary of app downloads.
     *
     * @param {GetAppDownloadsOptions} opts The options.
     *
     * @return {Promise<GetAppDownloadsResult>} The promise with the result.
     */
    async getAppDownloads(opts) {
        const CSV = await this.downloadSalesReportSummary(opts);
        const RESULT = {
            apps: {},
        };
        for (const R of CSV) {
            let item = RESULT.apps[R.SKU];
            if (isNil(item)) {
                RESULT.apps[R.SKU] = item = {
                    downloads: 0,
                };
            }
            let units = parseInt(R.Units);
            item.downloads += isNaN(units) ?
                0 : units;
        }
        return RESULT;
    }
}
exports.Client = Client;
//# sourceMappingURL=index.js.map