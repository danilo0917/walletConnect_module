function coinbaseWallet({ darkMode = false } = {}) {
    return () => {
        return {
            label: 'Coinbase Wallet',
            getIcon: async () => (await import('./icon.js')).default,
            getInterface: async ({ chains, appMetadata }) => {
                const [chain] = chains;
                const { name, icon } = appMetadata || {};
                // according to https://github.com/wagmi-dev/wagmi/issues/383
                // @coinbase/wallet-sdk export double default fields
                // so we need to detect it to get the real constructor
                const { default: CoinbaseWalletSDK } = await import('@coinbase/wallet-sdk');
                const CoinbaseWalletSDKConstructor = (CoinbaseWalletSDK.default
                    ? CoinbaseWalletSDK.default
                    : CoinbaseWalletSDK);
                const base64 = window.btoa(icon || '');
                const appLogoUrl = `data:image/svg+xml;base64,${base64}`;
                const instance = new CoinbaseWalletSDKConstructor({
                    appName: name || '',
                    appLogoUrl,
                    darkMode
                });
                const coinbaseWalletProvider = instance.makeWeb3Provider(chain.rpcUrl, parseInt(chain.id));
                // patch the chainChanged event
                const on = coinbaseWalletProvider.on.bind(coinbaseWalletProvider);
                coinbaseWalletProvider.on = (event, listener) => {
                    on(event, val => {
                        if (event === 'chainChanged') {
                            listener(`0x${val.toString(16)}`);
                            return;
                        }
                        listener(val);
                    });
                    return coinbaseWalletProvider;
                };
                return {
                    provider: coinbaseWalletProvider,
                    instance
                };
            }
        };
    };
}
export default coinbaseWallet;
