import { createEIP1193Provider } from '@web3-onboard/common';
function zealWallet() {
    if (typeof window === 'undefined')
        return () => null;
    return () => ({
        label: 'Zeal',
        injectedNamespace: 'zeal',
        checkProviderIdentity: ({ provider }) => {
            !!provider && !!provider['isZeal'];
        },
        getIcon: async () => (await import('./icon.js')).default,
        getInterface: async () => {
            if (window.hasOwnProperty('zeal') &&
                'isZeal' in window.zeal &&
                window.zeal.isZeal) {
                return {
                    provider: createEIP1193Provider(window.zeal)
                };
            }
            else {
                window.open('https://www.zeal.app/', '_blank');
                throw new Error('Please Install Zeall to use this wallet');
            }
        },
        platforms: ['desktop']
    });
}
export default zealWallet;
