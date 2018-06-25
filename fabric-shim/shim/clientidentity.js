/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// const CLIArgs = require('command-line-args');
// const grpc = require('grpc');
// const path = require('path');
// const util = require('util');
const X509 = require('x509');
const jsrsasign = require('jsrsasign');
const Logger = require('fabric-shim/shim/logger');

const logger = Logger.getLogger('shim/chaincode.js');
// const Handler = require('fabric-shim/shim/handler');
// const Stub = require('fabric-shim/shim/stub');
// const fs = require('fs');



// special OID used by Fabric to save attributes in x.509 certificates
const FABRIC_CERT_ATTR_OID = '1.2.3.4.5.6.7.8.1';

/**
 * ClientIdentity represents information about the identity that submitted the
 * transaction. Chaincodes can use this class to obtain information about the submitting
 * identity including a unique ID, the MSP (Membership Service Provider) ID, and attributes.
 * Such information is useful in enforcing access control by the chaincode.
 *
 * @example
 * <caption>Check if the submitter is an auditor</caption>
 * const ClientIdentity = require('fabric-shim').ClientIdentity;
 *
 * let cid = new ClientIdentity(stub); // "stub" is the ChaincodeStub object passed to Init() and Invoke() methods
 * if (cid.assertAttributeValue('hf.role', 'auditor')) {
 *    // proceed to carry out auditing
 * }
 *
 * @class
 */
class ClientIdentity {
	/**
	 * Returns a new instance of ClientIdentity
	 * @param {ChaincodeStub} This is the stub object passed to Init() and Invoke() methods
	 */
	constructor(stub) {
		this.stub = stub;
		const signingId = stub.getCreator();

		this.mspId = signingId.getMspid();

		const idBytes = signingId.getIdBytes().toBuffer();
		const normalizedCert = this.normalizeX509(idBytes.toString());
		const cert = X509.parseCert(normalizedCert);
		this.cert = cert;

		this.attrs = {};
		if(cert && cert.extensions && cert.extensions[FABRIC_CERT_ATTR_OID]) {
			const attr_string = cert.extensions[FABRIC_CERT_ATTR_OID];
			const attr_object = JSON.parse(attr_string);
			const attrs = attr_object.attrs;
			this.attrs = attrs;
		}

		// assemble the unique ID based on certificate
		const x = new jsrsasign.X509();
		x.readCertPEM(normalizedCert);
		this.id = `x509::${x.getSubjectString()}::${x.getIssuerString()}`;
	}

	/**
	 * getID returns the ID associated with the invoking identity.  This ID
	 * is guaranteed to be unique within the MSP.
	 * @returns {string} A string in the format: "x509::{subject DN}::{issuer DN}"
	 */
	getID() {
		return this.id;
	}

	/**
	 * Returns the MSP ID of the invoking identity.
	 * @returns {string}
	 */
	getMSPID() {
		return this.mspId;
	}

	/**
	 * getAttributeValue returns the value of the client's attribute named `attrName`.
	 * If the invoking identity possesses the attribute, returns the value of the attribute.
	 * If the invoking identity does not possess the attribute, returns null.
	 * @param {string} attrName Name of the attribute to retrieve the value from the
	 *     identity's credentials (such as x.509 certificate for PKI-based MSPs).
	 * @returns {string | null} Value of the attribute or null if the invoking identity
	 *     does not possess the attribute.
	 */
	getAttributeValue(attrName) {
		const attr = this.attrs[attrName];
		if (attr) {return attr;}
		else {return null;}
	}

	/**
	 * assertAttributeValue verifies that the invoking identity has the attribute named `attrName`
	 * with a value of `attrValue`.
	 * @param {string} attrName Name of the attribute to retrieve the value from the
	 *     identity's credentials (such as x.509 certificate for PKI-based MSPs)
	 * @param {string} attrValue Expected value of the attribute
	 * @returns {boolean} True if the invoking identity possesses the attribute and the attribute
	 *     value matches the expected value. Otherwise, returns false.
	 */
	assertAttributeValue(attrName, attrValue) {
		const attr = this.getAttributeValue(attrName);
		if (attr === null)
		{return false;}
		else if (attrValue === attr)
		{return true;}
		else
		{return false;}
	}

	/**
	 * An object representing an x.509 certificate with the following structure:
	 * <br><pre>
	 * { subject: {
     *     countryName: 'US',
     *     postalCode: '10010',
     *     stateOrProvinceName: 'NY',
     *     localityName: 'New York',
     *     streetAddress: '902 Broadway, 4th Floor',
     *     organizationName: 'Nodejitsu',
     *     organizationalUnitName: 'PremiumSSL Wildcard',
     *     commonName: '*.nodejitsu.com'
     *   },
     *   issuer: {
     *     countryName: 'GB',
     *     stateOrProvinceName: 'Greater Manchester',
     *     localityName: 'Salford',
     *     organizationName: 'COMODO CA Limited',
     *     commonName: 'COMODO High-Assurance Secure Server CA'
     *   },
     *   notBefore: Sun Oct 28 2012 20:00:00 GMT-0400 (EDT),
     *   notAfter: Wed Nov 26 2014 18:59:59 GMT-0500 (EST),
     *   altNames: [ '*.nodejitsu.com', 'nodejitsu.com' ],
     *   signatureAlgorithm: 'sha1WithRSAEncryption',
     *   fingerPrint: 'E4:7E:24:8E:86:D2:BE:55:C0:4D:41:A1:C2:0E:06:96:56:B9:8E:EC',
     *   publicKey: {
     *     algorithm: 'rsaEncryption',
     *     e: '65537',
     *     n: '.......'
     *   }
     * }
	 * @typedef {object} X509Certificate
	 */

	/**
	 * getX509Certificate returns the X509 certificate associated with the invoking identity,
	 * or null if it was not identified by an X509 certificate, for instance if the MSP is
	 * implemented with an alternative to PKI such as [Identity Mixer]{@link https://jira.hyperledger.org/browse/FAB-5673}.
	 * @returns {X509Certificate | null}
	 */
	getX509Certificate() {
		return this.cert;
	}



	/*
	 * Make sure there's a start line with '-----BEGIN CERTIFICATE-----'
	 * and end line with '-----END CERTIFICATE-----', so as to be compliant
	 * with x509 parsers
	 */
	 normalizeX509(raw) {
		logger.debug(`[normalizeX509]raw cert: ${raw}`);
		const regex = /(\-\-\-\-\-\s*BEGIN ?[^-]+?\-\-\-\-\-)([\s\S]*)(\-\-\-\-\-\s*END ?[^-]+?\-\-\-\-\-)/;
		let matches = raw.match(regex);
		if (!matches || matches.length !== 4) {
			throw new Error('Failed to find start line or end line of the certificate.');
		}

		// remove the first element that is the whole match
		matches.shift();
		// remove LF or CR
		matches = matches.map((element) => {
			return element.trim();
		});

		// make sure '-----BEGIN CERTIFICATE-----' and '-----END CERTIFICATE-----' are in their own lines
		// and that it ends in a new line
		return matches.join('\n') + '\n';
	}

}




module.exports = ClientIdentity;
