import type { CustomNetwork, Platform, WalletInit } from '@web3-onboard/common';
declare function keystone({ customNetwork, filter }?: {
    customNetwork?: CustomNetwork;
    filter?: Platform[];
}): WalletInit;
export default keystone;
