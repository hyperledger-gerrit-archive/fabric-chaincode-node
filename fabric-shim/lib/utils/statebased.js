/*
# Copyright Zhao Chaoyi. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const grpc = require('grpc');
const path = require('path');

const _policiesProto = grpc.load({
	root: path.join(__dirname, '../protos'),
	file: 'common/policies.proto'
}).common;

const _principalProto = grpc.load({
	root: path.join(__dirname, '../protos'),
	file: 'msp/msp_principal.proto'
}).common;

const ROLE_TYPE_MEMBER = 'MEMBER';
const ROLE_TYPE_PEER = 'PEER';

// class KeyEndorsementPolicy implements the KeyEndorsementPolicy
class KeyEndorsementPolicy {
	// policy: Buffer
	constructor(policy) {
		this.orgs = {};
		if (policy) {
			const spe = _policiesProto.SignaturePolicyEnvelope.decode(policy);
			this._setMspIdsFromSPE(spe);
		}
	}

	// returns the endorsement policy as bytes
	getPolicy() {
		const spe = this._getPolicyFromMspId();
		return spe.toBuffer();
	}

	addOrgs(role, ...neworgs) {
		let mspRole;
		switch (role) {
		case ROLE_TYPE_MEMBER:
			mspRole = _principalProto.MSPRole.MSPRoleType.MEMBER;
			break;
		case ROLE_TYPE_PEER:
			mspRole = _principalProto.MSPRole.MSPRoleType.PEER;
			break;
		default:
			throw new Error(`role type ${role} does not exist`);
		}

		// add new orgs
		// test for one new org, multiple new orgs
		neworgs.forEach(neworg => {
			this.orgs[neworg] = mspRole;
		});
	}

	delOrgs(...delorgs) {
		delorgs.forEach(delorg => {
			delete this.orgs[delorg];
		});
	}

	/**
	 * listOrgs returns an array of channel orgs that are required to endorse changes
	 * @return {string[]} the list of channel orgs that are required to endorse changes
	 */
	listOrgs() {
		return Object.keys(this.orgs);
	}

	_setMspIdsFromSPE(signaturePolicyEnvelope) {
		// iterate over the identities in this envelope
		signaturePolicyEnvelope.identities.forEach(identity => {
			// this imlementation only supports the ROLE type
			/* istanbul ignore else */
			if (identity.PrincipalClassification === _principalProto.MSPPrincipal.ROLE) {
				const msprole = _principalProto.MSPRole.decode(identity.principal);
				this.orgs[msprole.msp_identifier] = msprole.role;
			}
		});
	}

	/**
	 * Internal used only. construct the policy from all orgs' mspIds.
	 * the policy requires exactly 1 signature from all of the principals.
	 * @returns {_policiesProto.SignaturePolicyEnvelope} return the SignaturePolicyEnvelope instance
	 */
	_getPolicyFromMspId() {
		const mspIds = this.listOrgs();
		const principals = [];
		const sigsPolicies = [];
		mspIds.forEach((mspId, i) => {
			const mspRole = new _principalProto.MSPRole();
			mspRole.setRole(this.orgs[mspId]);
			mspRole.setMspIdentifier(mspId);
			const principal = new _principalProto.MSPPrincipal();
			principal.setPrincipalClassification(_principalProto.MSPPrincipal.Classification.ROLE);
			principal.setPrincipal(mspRole.toBuffer());
			principals.push(principal);

			const signedBy = new _policiesProto.SignaturePolicy();
			signedBy.set('signed_by', i);
			sigsPolicies.push(signedBy);
		});

		// create the policy: it requires exactly 1 signature from all of the principals
		const allOf = new _policiesProto.SignaturePolicy.NOutOf();
		allOf.setN(mspIds.length);
		allOf.setRules(sigsPolicies);

		const noutof = new _policiesProto.SignaturePolicy();
		noutof.set('n_out_of', allOf);

		const spe = new _policiesProto.SignaturePolicyEnvelope();
		spe.setVersion(0);
		spe.setRule(noutof);
		spe.setIdentities(principals);
		return spe;
	}
}

module.exports.KeyEndorsementPolicy = KeyEndorsementPolicy;
