const DEFAULT_BASE_PATH = "m/44'/60'/0'/0";
const basePaths = [
    {
        label: 'Keystone',
        value: DEFAULT_BASE_PATH
    }
];
const assets = [
    {
        label: 'ETH'
    }
];
const getAccount = async (keyring, provider, index) => {
    const address = (await keyring.addAccounts())[index];
    const derivationPath = await keyring._pathFromAddress(address);
    return {
        derivationPath,
        address,
        balance: {
            asset: '',
            value: await provider.getBalance(address)
        }
    };
};
const generateAccounts = async (keyring, provider) => {
    const accounts = [];
    let zeroBalanceAccounts = 0, index = 0;
    while (zeroBalanceAccounts < 5) {
        const account = await getAccount(keyring, provider, index);
        if (account.balance.value.isZero()) {
            zeroBalanceAccounts++;
            accounts.push(account);
        }
        else {
            accounts.push(account);
            // Reset the number of 0 balance accounts
            zeroBalanceAccounts = 0;
        }
        index++;
    }
    return accounts;
};
function keystone({ customNetwork, filter } = {}) {
    const getIcon = async () => (await import('./icon.js')).default;
    return ({ device }) => {
        let accounts;
        const filtered = Array.isArray(filter) &&
            (filter.includes(device.type) || filter.includes(device.os.name));
        if (filtered)
            return null;
        return {
            label: 'Keystone',
            getIcon,
            getInterface: async ({ EventEmitter, chains }) => {
                const { StaticJsonRpcProvider } = await import('@ethersproject/providers');
                let { default: AirGappedKeyring } = await import('@keystonehq/eth-keyring');
                // Super weird esm issue where the default export is an object with a property default on it
                // if that is the case then we just grab the default value
                AirGappedKeyring =
                    'default' in AirGappedKeyring
                        ? // @ts-ignore
                            AirGappedKeyring.default
                        : AirGappedKeyring;
                const { TransactionFactory: Transaction } = await import('@ethereumjs/tx');
                const { createEIP1193Provider, ProviderRpcError, ProviderRpcErrorCode } = await import('@web3-onboard/common');
                const { accountSelect, getCommon, bigNumberFieldsToStrings, getHardwareWalletProvider } = await import('@web3-onboard/hw-common');
                const keyring = AirGappedKeyring.getEmptyKeyring();
                await keyring.readKeyring();
                const eventEmitter = new EventEmitter();
                let ethersProvider;
                let currentChain = chains[0];
                const scanAccounts = async ({ chainId }) => {
                    currentChain =
                        chains.find(({ id }) => id === chainId) || currentChain;
                    ethersProvider = new StaticJsonRpcProvider(currentChain.rpcUrl);
                    return generateAccounts(keyring, ethersProvider);
                };
                const getAccounts = async () => {
                    accounts = await accountSelect({
                        basePaths,
                        assets,
                        chains,
                        scanAccounts,
                        supportsCustomPath: false
                    });
                    if (accounts.length) {
                        eventEmitter.emit('accountsChanged', [accounts[0].address]);
                    }
                    return accounts;
                };
                const signMessage = (address, message) => {
                    if (!(accounts && accounts.length && accounts.length > 0))
                        throw new Error('No account selected. Must call eth_requestAccounts first.');
                    const account = accounts.find(account => account.address === address) || accounts[0];
                    return keyring.signMessage(account.address, message);
                };
                const keystoneProvider = getHardwareWalletProvider(() => currentChain.rpcUrl);
                const provider = createEIP1193Provider(keystoneProvider, {
                    eth_requestAccounts: async () => {
                        // Triggers the account select modal if no accounts have been selected
                        const accounts = await getAccounts();
                        if (accounts.length === 0) {
                            throw new ProviderRpcError({
                                code: ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED,
                                message: 'User rejected the request.'
                            });
                        }
                        return accounts[0] ? [accounts[0].address] : [];
                    },
                    eth_selectAccounts: async () => {
                        const accounts = await getAccounts();
                        return accounts.map(({ address }) => address);
                    },
                    eth_accounts: async () => accounts && accounts[0].address ? [accounts[0].address] : [],
                    eth_chainId: async () => currentChain.id,
                    eth_signTransaction: async ({ params: [transactionObject] }) => {
                        if (!accounts)
                            throw new Error('No account selected. Must call eth_requestAccounts first.');
                        if (!transactionObject)
                            throw new ProviderRpcError({
                                message: 'Invalid method parameters',
                                code: ProviderRpcErrorCode.INVALID_PARAMS,
                                data: transactionObject
                            });
                        const account = accounts.find(account => account.address === transactionObject.from) || accounts[0];
                        const { address: from } = account;
                        // Set the `from` field to the currently selected account
                        transactionObject = { ...transactionObject, from };
                        const chainId = currentChain.hasOwnProperty('id')
                            ? Number.parseInt(currentChain.id)
                            : 1;
                        const common = await getCommon({ customNetwork, chainId });
                        transactionObject.gasLimit =
                            transactionObject.gas || transactionObject.gasLimit;
                        // 'gas' is an invalid property for the TransactionRequest type
                        delete transactionObject.gas;
                        const signer = ethersProvider.getSigner(from);
                        let populatedTransaction = bigNumberFieldsToStrings(await signer.populateTransaction(transactionObject));
                        const transaction = Transaction.fromTxData(populatedTransaction, {
                            common,
                            freeze: false
                        });
                        let signedTx;
                        try {
                            // @ts-ignore
                            signedTx = await keyring.signTransaction(from, transaction);
                        }
                        catch (error) {
                            if (error.message && error.message.message) {
                                throw new Error(error.message.message);
                            }
                            else {
                                throw new Error(error);
                            }
                        }
                        return `0x${signedTx.serialize().toString('hex')}`;
                    },
                    eth_sendTransaction: async ({ baseRequest, params }) => {
                        const signedTx = await provider.request({
                            method: 'eth_signTransaction',
                            params
                        });
                        const transactionHash = await baseRequest({
                            method: 'eth_sendRawTransaction',
                            params: [signedTx]
                        });
                        return transactionHash;
                    },
                    eth_sign: async ({ params: [address, message] }) => signMessage(address, message),
                    personal_sign: async ({ params: [message, address] }) => signMessage(address, message),
                    eth_signTypedData: async ({ params: [address, typedData] }) => {
                        if (!(accounts && accounts.length && accounts.length > 0))
                            throw new Error('No account selected. Must call eth_requestAccounts first.');
                        const account = accounts.find(account => account.address === address) ||
                            accounts[0];
                        return keyring.signTypedData(account.address, typedData);
                    },
                    wallet_switchEthereumChain: async ({ params: [{ chainId }] }) => {
                        currentChain =
                            chains.find(({ id }) => id === chainId) || currentChain;
                        if (!currentChain)
                            throw new Error('chain must be set before switching');
                        eventEmitter.emit('chainChanged', currentChain.id);
                        return null;
                    },
                    wallet_addEthereumChain: null
                });
                provider.on = eventEmitter.on.bind(eventEmitter);
                return {
                    provider
                };
            }
        };
    };
}
export default keystone;
