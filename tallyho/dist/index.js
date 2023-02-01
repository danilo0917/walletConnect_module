import { createEIP1193Provider } from '@web3-onboard/common';
import detectEthereumProvider from 'tallyho-detect-provider';
import TallyHoOnboarding from 'tallyho-onboarding';
function tallyHoWallet() {
    if (typeof window === 'undefined')
        return () => null;
    return () => {
        return {
            label: 'Tally Ho Wallet',
            injectedNamespace: 'tally',
            checkProviderIdentity: ({ provider }) => {
                !!provider && !!provider['isTally'];
            },
            getIcon: async () => (await import('./icon.js')).default,
            getInterface: async () => {
                const provider = await detectEthereumProvider({ mustBeTallyHo: true });
                if (!provider) {
                    const onboarding = new TallyHoOnboarding();
                    onboarding.startOnboarding();
                    throw new Error('Please install Tally Ho to use this wallet');
                }
                else {
                    return { provider: createEIP1193Provider(window.tally) };
                }
            },
            platforms: ['desktop']
        };
    };
}
export default tallyHoWallet;
