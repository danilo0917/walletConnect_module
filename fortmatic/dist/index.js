function fortmatic(options) {
    const { apiKey } = options;
    return () => {
        return {
            label: 'Fortmatic',
            getIcon: async () => (await import('./icon.js')).default,
            getInterface: async ({ EventEmitter, BigNumber, chains }) => {
                const { default: Fortmatic } = await import('fortmatic');
                const { createEIP1193Provider, ProviderRpcErrorCode, ProviderRpcError } = await import('@web3-onboard/common');
                const emitter = new EventEmitter();
                let instance = new Fortmatic(apiKey, {
                    chainId: parseInt(chains[0].id),
                    rpcUrl: chains[0].rpcUrl
                });
                let fortmaticProvider = instance.getProvider();
                let provider;
                function patchProvider() {
                    const patchedProvider = createEIP1193Provider(fortmaticProvider, {
                        eth_requestAccounts: async () => {
                            try {
                                const accounts = await instance.user.login();
                                return accounts;
                            }
                            catch (error) {
                                const { code } = error;
                                if (code === -32603) {
                                    throw new ProviderRpcError({
                                        code: ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED,
                                        message: 'Account access rejected'
                                    });
                                }
                                return [];
                            }
                        },
                        eth_selectAccounts: null,
                        eth_getBalance: async () => {
                            const [balance] = await instance.user.getBalances();
                            return balance
                                ? BigNumber.from(balance.crypto_amount)
                                    .mul('1000000000000000000')
                                    .toString()
                                : '0';
                        },
                        wallet_switchEthereumChain: async ({ params }) => {
                            const chain = chains.find(({ id }) => id === params[0].chainId);
                            if (!chain)
                                throw new Error('chain must be set before switching');
                            // re-instantiate instance with new network
                            instance = new Fortmatic(apiKey, {
                                chainId: parseInt(chain.id),
                                rpcUrl: chain.rpcUrl
                            });
                            // get the provider again
                            fortmaticProvider = instance.getProvider();
                            emitter.emit('chainChanged', chain.id);
                            // patch the provider
                            patchProvider();
                            return null;
                        }
                    });
                    if (!provider) {
                        patchedProvider.on = emitter.on.bind(emitter);
                        patchedProvider.disconnect = () => () => instance.user.logout();
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
                    instance
                };
            }
        };
    };
}
export default fortmatic;
