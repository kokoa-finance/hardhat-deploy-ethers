"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const ethers_provider_wrapper_1 = require("../src/ethers-provider-wrapper");
const helpers_1 = require("./helpers");
describe("Ethers provider wrapper", function () {
    let realProvider;
    let wrapper;
    helpers_1.useEnvironment("hardhat-project");
    beforeEach(function () {
        realProvider = new ethers_1.ethers.providers.JsonRpcProvider();
        wrapper = new ethers_provider_wrapper_1.EthersProviderWrapper(this.env.network.provider);
    });
    it("Should return the same as the real provider", async function () {
        const response = await realProvider.send("eth_accounts", []);
        const response2 = await wrapper.send("eth_accounts", []);
        chai_1.assert.deepEqual(response, response2);
    });
    it("Should return the same error", async function () {
        this.skip();
        // We disable this test for RskJ
        // See: https://github.com/rsksmart/rskj/issues/876
        const version = await this.env.network.provider.send("web3_clientVersion");
        if (version.includes("RskJ")) {
            this.skip();
        }
        try {
            await realProvider.send("error_please", []);
            chai_1.assert.fail("Ethers provider should have failed");
        }
        catch (err) {
            try {
                await wrapper.send("error_please", []);
                chai_1.assert.fail("Wrapped provider should have failed");
            }
            catch (err2) {
                chai_1.assert.deepEqual(err2.message, err.message);
            }
        }
    });
});
//# sourceMappingURL=ethers-provider-wrapper.js.map