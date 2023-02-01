import Joi from 'joi';

const userEmail = Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null);
const magicOptions = Joi.object({
    apiKey: Joi.string().required(),
    userEmail: userEmail
});
const validate = (validator, data) => {
    const result = validator.validate(data);
    return result.error ? result : null;
};
const validateMagicInitOptions = (data) => {
    return validate(magicOptions, data);
};
const validateUserEmail = (email) => {
    return validate(userEmail, email);
};

function magic(options) {
    if (options) {
        const error = validateMagicInitOptions(options);
        if (error) {
            throw error;
        }
    }
    const { apiKey, userEmail } = options;
    const walletName = 'Magic Wallet';
    return () => {
        return {
            label: walletName,
            getIcon: async () => (await import('./icon-87babf0a.js')).default,
            getInterface: async ({ EventEmitter, BigNumber, chains }) => {
                const { Magic, RPCErrorCode } = await import('magic-sdk');
                const loginModal = (await import('./login-modal-978933b3.js')).default;
                const brandingHTML = (await import('./branding-111ba967.js')).default;
                const { createEIP1193Provider, ProviderRpcErrorCode, ProviderRpcError } = await import('@web3-onboard/common');
                const emitter = new EventEmitter();
                if (!chains.length)
                    throw new Error('At least one Chain must be passed to onboard in order to connect');
                let currentChain = chains[0];
                let customNodeOptions = {
                    chainId: parseInt(currentChain.id),
                    rpcUrl: currentChain.rpcUrl
                };
                let magicInstance = new Magic(apiKey, {
                    network: customNodeOptions
                });
                let loggedIn;
                const loginWithEmail = async (emailAddress) => {
                    try {
                        await magicInstance.auth.loginWithMagicLink({ email: emailAddress });
                        return await magicInstance.user.isLoggedIn();
                    }
                    catch (err) {
                        throw new Error(`An error occurred while connecting your Magic wallet, please try again: ${err}`);
                    }
                };
                const handleLogin = async () => {
                    loggedIn = await loginModal({
                        walletName: walletName,
                        brandingHTMLString: brandingHTML,
                        emailLoginFunction: loginWithEmail
                    });
                };
                let magicProvider = magicInstance.rpcProvider;
                let provider;
                let activeAddress;
                function patchProvider() {
                    const patchedProvider = createEIP1193Provider(magicProvider, {
                        eth_requestAccounts: async ({ baseRequest }) => {
                            try {
                                if (userEmail)
                                    loggedIn = await loginWithEmail(userEmail);
                                if (!loggedIn)
                                    await handleLogin();
                                const accounts = await baseRequest({ method: 'eth_accounts' });
                                activeAddress = accounts[0];
                                return accounts;
                            }
                            catch (error) {
                                const { code } = error;
                                if (code === RPCErrorCode.InternalError) {
                                    throw new ProviderRpcError({
                                        code: ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED,
                                        message: 'Account access rejected'
                                    });
                                }
                                return [];
                            }
                        },
                        eth_selectAccounts: null,
                        eth_getBalance: async ({ baseRequest }) => {
                            const balance = await baseRequest({
                                method: 'eth_getBalance',
                                params: [activeAddress, 'latest']
                            });
                            return balance
                                ? BigNumber.from(balance).mul('1000000000000000000').toString()
                                : '0';
                        },
                        wallet_switchEthereumChain: async ({ params }) => {
                            const chain = chains.find(({ id }) => id === params[0].chainId);
                            if (!chain)
                                throw new Error('Chain must be set before switching');
                            currentChain = chain;
                            // re-instantiate instance with new network
                            customNodeOptions = {
                                chainId: parseInt(currentChain.id),
                                rpcUrl: currentChain.rpcUrl
                            };
                            magicInstance = new Magic(apiKey, {
                                network: customNodeOptions
                            });
                            magicProvider = magicInstance.rpcProvider;
                            emitter.emit('chainChanged', currentChain.id);
                            patchProvider();
                            return null;
                        },
                        eth_sign: async ({ params }) => {
                            const receipt = await magicProvider.send('eth_sign', params);
                            return receipt &&
                                receipt.hasOwnProperty('tx') &&
                                receipt.tx.hasOwnProperty('hash')
                                ? receipt.tx.hash
                                : '';
                        },
                        eth_signTypedData: async ({ params }) => {
                            const receipt = await magicProvider.send('eth_sign', params);
                            return receipt &&
                                receipt.hasOwnProperty('tx') &&
                                receipt.tx.hasOwnProperty('hash')
                                ? receipt.tx.hash
                                : '';
                        },
                        eth_chainId: async () => currentChain && currentChain.hasOwnProperty('id')
                            ? currentChain.id
                            : '0x1',
                        eth_signTransaction: async ({ params: [transactionObject] }) => {
                            let destination;
                            if (transactionObject.hasOwnProperty('to')) {
                                destination = transactionObject.to;
                            }
                            const receipt = await magicProvider.send('eth_signTransaction', [
                                {
                                    ...transactionObject,
                                    nonce: transactionObject.hasOwnProperty('nonce') &&
                                        typeof transactionObject.nonce === 'number'
                                        ? parseInt(transactionObject.nonce)
                                        : '',
                                    from: activeAddress,
                                    to: destination
                                }
                            ]);
                            return receipt &&
                                receipt.hasOwnProperty('tx') &&
                                receipt.tx.hasOwnProperty('hash')
                                ? receipt.tx.hash
                                : '';
                        }
                    });
                    if (!provider) {
                        patchedProvider.on = emitter.on.bind(emitter);
                        patchedProvider.disconnect = () => magicInstance.user.logout();
                        return patchedProvider;
                    }
                    else {
                        provider.request = patchedProvider.request.bind(patchedProvider);
                        // @ts-ignore - bind old methods for backwards compat
                        provider.send = patchedProvider.send.bind(patchedProvider);
                        // @ts-ignore - bind old methods for backwards compat
                        provider.sendAsync = patchedProvider.sendAsync.bind(patchedProvider);
                        return provider;
                    }
                }
                provider = patchProvider();
                return {
                    provider,
                    instance: magicInstance
                };
            }
        };
    };
}

export { magic as m, validateUserEmail as v };
