import type { Chain, AccountAddress } from '@web3-onboard/common';
import type { BigNumber } from 'ethers';
export interface CustomNetwork {
    networkId: number;
    genesis: GenesisBlock;
    hardforks: Hardfork[];
    bootstrapNodes: BootstrapNode[];
}
export interface GenesisBlock {
    hash: string;
    timestamp: string | null;
    gasLimit: number;
    difficulty: number;
    nonce: string;
    extraData: string;
    stateRoot: string;
}
export interface Hardfork {
    name: string;
    block: number | null;
}
export interface BootstrapNode {
    ip: string;
    port: number | string;
    network?: string;
    chainId?: number;
    id: string;
    location: string;
    comment: string;
}
export declare type AccountSelectAPI = (options: SelectAccountOptions) => Promise<Account>;
export declare type SelectAccountOptions = {
    basePaths: BasePath[];
    assets: Asset[];
    chains: Chain[];
    scanAccounts: ScanAccounts;
    supportsCustomPath?: boolean;
};
export declare type BasePath = {
    label: string;
    value: DerivationPath;
};
export declare type DerivationPath = string;
export declare type Asset = {
    label: string;
    address?: string;
};
export declare type ScanAccounts = (options: ScanAccountsOptions) => Promise<Account[]>;
export declare type ScanAccountsOptions = {
    derivationPath: DerivationPath;
    chainId: Chain['id'];
    asset: Asset;
};
export declare type Account = {
    address: AccountAddress;
    derivationPath: DerivationPath;
    balance: {
        asset: Asset['label'];
        value: BigNumber;
    };
};
export declare type AccountsList = {
    all: Account[];
    filtered: Account[];
};
