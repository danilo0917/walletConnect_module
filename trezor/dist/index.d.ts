import type { CustomNetwork, Platform, WalletInit } from '@web3-onboard/common';
interface TrezorOptions {
    email: string;
    appUrl: string;
    customNetwork?: CustomNetwork;
    filter?: Platform[];
}
declare function trezor(options: TrezorOptions): WalletInit;
export default trezor;
