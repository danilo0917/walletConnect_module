import type { WalletInit } from '@web3-onboard/common';
interface SequenceOptions {
    appName?: string;
    network?: number | string;
}
declare function sequence(options?: SequenceOptions): WalletInit;
export default sequence;
