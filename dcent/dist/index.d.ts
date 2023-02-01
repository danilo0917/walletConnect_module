import type { WalletInit, Platform } from '@web3-onboard/common';
import type { CustomNetwork } from '@web3-onboard/hw-common';
declare function dcent({ customNetwork, filter }?: {
    customNetwork?: CustomNetwork;
    filter?: Platform[];
}): WalletInit;
export default dcent;
