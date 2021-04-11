"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("hardhat/plugins");
const pluginName = "hardhat-deploy-ethers";
async function _getSigner(hre, signer) {
    const { SignerWithAddress: SignerWithAddressImpl } = await Promise.resolve().then(() => __importStar(require("./signer-with-address")));
    let ethersSigner;
    if (signer === undefined) {
        const signers = await hre.ethers.getSigners();
        if (signers.length > 0) {
            ethersSigner = signers[0];
        }
    }
    else if (typeof signer === "string") {
        ethersSigner = await SignerWithAddressImpl.create(hre.ethers.provider.getSigner(signer));
    }
    else {
        ethersSigner = await SignerWithAddressImpl.create(signer);
    }
    return ethersSigner;
}
async function _getArtifact(hre, name) {
    const deployments = hre.deployments;
    if (deployments !== undefined) {
        return deployments.getArtifact(name);
    }
    return hre.artifacts.readArtifact(name);
}
async function getSignerOrNull(hre, address) {
    if (!address) {
        throw new Error("need to specify address");
    }
    const signer = await _getSigner(hre, address);
    if (signer === undefined) {
        return null;
    }
    else {
        return signer;
    }
}
exports.getSignerOrNull = getSignerOrNull;
async function getSigner(hre, address) {
    const signer = await getSignerOrNull(hre, address);
    if (!signer) {
        throw new Error(`no signer for ${address}`);
    }
    return signer;
}
exports.getSigner = getSigner;
async function getSigners(hre) {
    const { SignerWithAddress: SignerWithAddressImpl } = await Promise.resolve().then(() => __importStar(require("./signer-with-address")));
    const accounts = await hre.ethers.provider.listAccounts();
    const signers = accounts.map((account) => hre.ethers.provider.getSigner(account));
    const signersWithAddress = await Promise.all(signers.map(SignerWithAddressImpl.create));
    return signersWithAddress;
}
exports.getSigners = getSigners;
async function getNamedSigners(hre) {
    const getNamedAccounts = hre.getNamedAccounts;
    if (getNamedAccounts !== undefined) {
        const namedAccounts = (await getNamedAccounts());
        const namedSigners = {};
        for (const name of Object.keys(namedAccounts)) {
            try {
                const address = namedAccounts[name];
                if (address) {
                    const signer = await _getSigner(hre, address); // TODO cache ?
                    if (signer) {
                        namedSigners[name] = signer;
                    }
                }
            }
            catch (e) { }
        }
        return namedSigners;
    }
    throw new Error(`No Deployment Plugin Installed, try 'import "harhdat-deploy"'`);
}
exports.getNamedSigners = getNamedSigners;
async function getUnnamedSigners(hre) {
    const getUnnamedAccounts = hre.getUnnamedAccounts;
    if (getUnnamedAccounts !== undefined) {
        const unnamedAccounts = (await getUnnamedAccounts());
        const unnamedSigners = [];
        for (const address of unnamedAccounts) {
            if (address) {
                try {
                    const signer = await _getSigner(hre, address);
                    if (signer) {
                        unnamedSigners.push(signer); // TODO cache ?
                    }
                }
                catch (e) { }
            }
        }
        return unnamedSigners;
    }
    throw new Error(`No Deployment Plugin Installed, try 'import "harhdat-deploy"'`);
}
exports.getUnnamedSigners = getUnnamedSigners;
async function getNamedSignerOrNull(hre, name) {
    const getNamedAccounts = hre.getNamedAccounts;
    if (getNamedAccounts !== undefined) {
        const namedAccounts = (await getNamedAccounts());
        const address = namedAccounts[name];
        if (!address) {
            throw new Error(`no account named ${name}`);
        }
        const signer = await _getSigner(hre, address);
        if (signer) {
            return signer;
        }
        return null;
    }
    throw new Error(`No Deployment Plugin Installed, try 'import "harhdat-deploy"'`);
}
exports.getNamedSignerOrNull = getNamedSignerOrNull;
async function getNamedSigner(hre, name) {
    const signer = await getNamedSignerOrNull(hre, name);
    if (!signer) {
        throw new Error(`no signer for ${name}`);
    }
    return signer;
}
exports.getNamedSigner = getNamedSigner;
async function getContractFactory(hre, nameOrAbi, bytecodeOrFactoryOptions, signer) {
    if (typeof nameOrAbi === "string") {
        return getContractFactoryByName(hre, nameOrAbi, bytecodeOrFactoryOptions);
    }
    // will fallback on signers[0]
    // if (!signer) {
    //   throw new Error("need to specify signer or address");
    // }
    return getContractFactoryByAbiAndBytecode(hre, nameOrAbi, bytecodeOrFactoryOptions, signer);
}
exports.getContractFactory = getContractFactory;
function isFactoryOptions(signerOrOptions) {
    const { Signer } = require("ethers");
    if (signerOrOptions === undefined || signerOrOptions instanceof Signer) {
        return false;
    }
    return true;
}
async function getContractFactoryByName(hre, contractName, signerOrOptions) {
    const artifact = await _getArtifact(hre, contractName);
    let libraries = {};
    let signer;
    if (isFactoryOptions(signerOrOptions)) {
        signer = signerOrOptions.signer;
        libraries = signerOrOptions.libraries ?? {};
    }
    else {
        signer = signerOrOptions;
    }
    if (artifact.bytecode === "0x") {
        throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `You are trying to create a contract factory for the contract ${contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${contractName} as its interface use the "getContractAt" function instead.`);
    }
    const linkedBytecode = await collectLibrariesAndLink(artifact, libraries);
    return getContractFactoryByAbiAndBytecode(hre, artifact.abi, linkedBytecode, signer);
}
async function collectLibrariesAndLink(artifact, libraries) {
    const { utils } = require("ethers");
    const neededLibraries = [];
    for (const [sourceName, sourceLibraries] of Object.entries(artifact.linkReferences)) {
        for (const libName of Object.keys(sourceLibraries)) {
            neededLibraries.push({ sourceName, libName });
        }
    }
    const linksToApply = new Map();
    for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
        if (!utils.isAddress(linkedLibraryAddress)) {
            throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `You tried to link the contract ${artifact.contractName} with the library ${linkedLibraryName}, but provided this invalid address: ${linkedLibraryAddress}`);
        }
        const matchingNeededLibraries = neededLibraries.filter((lib) => {
            return (lib.libName === linkedLibraryName ||
                `${lib.sourceName}:${lib.libName}` === linkedLibraryName);
        });
        if (matchingNeededLibraries.length === 0) {
            let detailedMessage;
            if (neededLibraries.length > 0) {
                const libraryFQNames = neededLibraries
                    .map((lib) => `${lib.sourceName}:${lib.libName}`)
                    .map((x) => `* ${x}`)
                    .join("\n");
                detailedMessage = `The libraries needed are:
${libraryFQNames}`;
            }
            else {
                detailedMessage = "This contract doesn't need linking any libraries.";
            }
            throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `You tried to link the contract ${artifact.contractName} with ${linkedLibraryName}, which is not one of its libraries.
${detailedMessage}`);
        }
        if (matchingNeededLibraries.length > 1) {
            const matchingNeededLibrariesFQNs = matchingNeededLibraries
                .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
                .map((x) => `* ${x}`)
                .join("\n");
            throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `The library name ${linkedLibraryName} is ambiguous for the contract ${artifact.contractName}.
It may resolve to one of the following libraries:
${matchingNeededLibrariesFQNs}

To fix this, choose one of these fully qualified library names and replace where appropriate.`);
        }
        const [neededLibrary] = matchingNeededLibraries;
        const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;
        // The only way for this library to be already mapped is
        // for it to be given twice in the libraries user input:
        // once as a library name and another as a fully qualified library name.
        if (linksToApply.has(neededLibraryFQN)) {
            throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.
Remove one of them and review your library links before proceeding.`);
        }
        linksToApply.set(neededLibraryFQN, {
            sourceName: neededLibrary.sourceName,
            libraryName: neededLibrary.libName,
            address: linkedLibraryAddress,
        });
    }
    if (linksToApply.size < neededLibraries.length) {
        const missingLibraries = neededLibraries
            .map((lib) => `${lib.sourceName}:${lib.libName}`)
            .filter((libFQName) => !linksToApply.has(libFQName))
            .map((x) => `* ${x}`)
            .join("\n");
        throw new plugins_1.NomicLabsHardhatPluginError(pluginName, `The contract ${artifact.contractName} is missing links for the following libraries:
${missingLibraries}

Learn more about linking contracts at https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking
`);
    }
    return linkBytecode(artifact, [...linksToApply.values()]);
}
async function getContractFactoryByAbiAndBytecode(hre, abi, bytecode, signer) {
    const { ContractFactory } = require("ethers");
    // will fallback on signers[0]
    // if (!signer) {
    //   throw new Error("need to specify signer or address");
    // }
    const ethersSigner = await _getSigner(hre, signer);
    const abiWithAddedGas = addGasToAbiMethodsIfNecessary(hre.network.config, abi);
    return new ContractFactory(abiWithAddedGas, bytecode, ethersSigner);
}
async function getContractAt(hre, nameOrAbi, address, signer) {
    const { Contract } = require("ethers");
    if (typeof nameOrAbi === "string") {
        const artifact = await hre.artifacts.readArtifact(nameOrAbi);
        const factory = await getContractFactoryByAbiAndBytecode(hre, artifact.abi, "0x", signer);
        return factory.attach(address);
    }
    const ethersSigner = await _getSigner(hre, signer);
    const abiWithAddedGas = addGasToAbiMethodsIfNecessary(hre.network.config, nameOrAbi);
    return new Contract(address, abiWithAddedGas, ethersSigner || hre.ethers.provider);
}
exports.getContractAt = getContractAt;
async function getContract(env, contractName, signer) {
    const contract = await getContractOrNull(env, contractName, signer);
    if (contract === null) {
        throw new Error(`No Contract deployed with name ${contractName}`);
    }
    return contract;
}
exports.getContract = getContract;
async function getContractOrNull(env, contractName, signer) {
    const deployments = env.deployments;
    if (deployments !== undefined) {
        const get = deployments.getOrNull;
        const contract = (await get(contractName));
        if (contract === undefined) {
            return null;
        }
        return getContractAt(env, contract.abi, contract.address, signer);
    }
    throw new Error(`No Deployment Plugin Installed, try 'import "harhdat-deploy"'`);
}
exports.getContractOrNull = getContractOrNull;
// This helper adds a `gas` field to the ABI function elements if the network
// is set up to use a fixed amount of gas.
// This is done so that ethers doesn't automatically estimate gas limits on
// every call.
function addGasToAbiMethodsIfNecessary(networkConfig, abi) {
    const { BigNumber } = require("ethers");
    if (networkConfig.gas === "auto" || networkConfig.gas === undefined) {
        return abi;
    }
    // ethers adds 21000 to whatever the abi `gas` field has. This may lead to
    // OOG errors, as people may set the default gas to the same value as the
    // block gas limit, especially on Hardhat Network.
    // To avoid this, we substract 21000.
    // HOTFIX: We substract 1M for now. See: https://github.com/ethers-io/ethers.js/issues/1058#issuecomment-703175279
    const gasLimit = BigNumber.from(networkConfig.gas).sub(1000000).toHexString();
    const modifiedAbi = [];
    for (const abiElement of abi) {
        if (abiElement.type !== "function") {
            modifiedAbi.push(abiElement);
            continue;
        }
        modifiedAbi.push({
            ...abiElement,
            gas: gasLimit,
        });
    }
    return modifiedAbi;
}
function linkBytecode(artifact, libraries) {
    let bytecode = artifact.bytecode;
    // TODO: measure performance impact
    for (const { sourceName, libraryName, address } of libraries) {
        const linkReferences = artifact.linkReferences[sourceName][libraryName];
        for (const { start, length } of linkReferences) {
            bytecode =
                bytecode.substr(0, 2 + start * 2) +
                    address.substr(2) +
                    bytecode.substr(2 + (start + length) * 2);
        }
    }
    return bytecode;
}
//# sourceMappingURL=helpers.js.map