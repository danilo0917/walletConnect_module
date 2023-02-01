import type { WalletInit } from '@web3-onboard/common';
interface WalletConnectOptions {
    bridge?: string;
    qrcodeModalOptions?: {
        mobileLinks: string[];
    };
    connectFirstChainId?: boolean;
}
declare function walletConnect(options?: WalletConnectOptions): WalletInit;
export default walletConnect;
