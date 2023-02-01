import type { WalletState } from './types.js';
declare function setChain(options: {
    chainId: string | number;
    chainNamespace?: string;
    wallet?: WalletState['label'];
}): Promise<boolean>;
export default setChain;
