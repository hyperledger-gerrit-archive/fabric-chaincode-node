/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use-strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const utils = require('./utils');
const {SHORT_STEP, MED_STEP, LONG_STEP} = utils.TIMEOUTS;

describe('Typescript chaincode', () => {
    const suite = 'annotations';

    before(async function () {
        this.timeout(LONG_STEP);

        return utils.installAndInstantiate(suite);
    });


    describe('Scenario', () => {

        it('should write an asset', async function () {
            this.timeout(MED_STEP);
            await utils.invoke(suite, 'TestContract:createAsset', ['GLD', 'GOLD_BAR', '100']);
            const payload = JSON.parse(await utils.query(suite, 'TestContract:getAsset', ['GLD']));
            expect(payload).to.eql({id: 'GLD', name: 'GOLD_BAR', value: 100});
        });

        it('should handle the getMetadata', async function () {
            this.timeout(SHORT_STEP);
            const payload = JSON.parse(await utils.query(suite, 'org.hyperledger.fabric:GetMetadata'));

            const schema = fs.readFileSync(path.join(__dirname, '../../fabric-contract-api/schema/contract-schema.json'));

            const ajv = new Ajv({schemaId: 'id'});
            ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

            if (!ajv.validate(JSON.parse(schema), payload)) {
                throw new Error('Expected generated metadata to match the schema');
            }

            const expectedMetadata = fs.readFileSync(path.join(__dirname, './annotations/src/test_contract/expected-metadata.json'));
            expect(payload).to.eql(JSON.parse(expectedMetadata));
        });

    });

});
