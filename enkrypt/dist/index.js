import { createEIP1193Provider } from '@web3-onboard/common';
function enkrypt() {
    if (typeof window === 'undefined')
        return () => null;
    return () => {
        return {
            label: 'Enkrypt',
            getIcon: async () => (await import('./icon.js')).default,
            getInterface: async () => {
                const enkryptExists = window.hasOwnProperty('enkrypt');
                if (enkryptExists) {
                    const enkryptProvider = window.enkrypt.providers
                        .ethereum;
                    const addListener = enkryptProvider.on.bind(enkryptProvider);
                    enkryptProvider.on = (event, func) => {
                        addListener(event, func);
                    };
                    const provider = createEIP1193Provider(enkryptProvider);
                    provider.removeListener = (event, func) => { };
                    return {
                        provider
                    };
                }
                else {
                    window.open('https://enkrypt.com', '_blank');
                    throw new Error('Please Install Enkrypt to use this wallet');
                }
            }
        };
    };
}
export default enkrypt;
