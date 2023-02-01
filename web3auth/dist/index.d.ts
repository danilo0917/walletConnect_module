import type { WalletInit } from '@web3-onboard/common';
import type { Web3AuthCoreOptions } from '@web3auth/core';
import type { ModalConfig } from '@web3auth/modal';
import type { CustomChainConfig } from '@web3auth/base';
type Web3AuthModuleOptions = Omit<Web3AuthCoreOptions, 'chainConfig'> & {
    chainConfig?: Partial<CustomChainConfig> & Pick<CustomChainConfig, 'chainNamespace'>;
    modalConfig?: Record<string, ModalConfig> | undefined;
    loginModalZIndex?: string;
};
declare function web3auth(options: Web3AuthModuleOptions): WalletInit;
export default web3auth;
