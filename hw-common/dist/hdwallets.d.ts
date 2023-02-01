import type Common from '@ethereumjs/common';
import type { EIP1193Provider } from '@web3-onboard/common';
import type { CustomNetwork } from './types.js';
import type { providers } from 'ethers';
/**
 * Creates the common instance used for signing
 * transactions with hardware wallets
 * @returns the initialized common instance
 */
export declare const getCommon: ({ customNetwork, chainId }: {
    customNetwork?: CustomNetwork | undefined;
    chainId: number;
}) => Promise<Common>;
declare type StringifiedTransactionRequest = Omit<providers.TransactionRequest, 'nonce' | 'gasLimit' | 'gasPrice' | 'value' | 'maxPriorityFeePerGas' | 'maxFeePerGas'> & {
    nonce: string;
    gasLimit: string;
    gasPrice?: string;
    value: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
};
/**
 * Takes in TransactionRequest and converts all BigNumber values to strings
 * @param transaction
 * @returns a transaction where all BigNumber properties are now strings
 */
export declare const bigNumberFieldsToStrings: (transaction: providers.TransactionRequest) => StringifiedTransactionRequest;
/**
 * Helper method for hardware wallets to build an object
 * with a request method used for making rpc requests.
 * @param getRpcUrl - callback used to get the current chain's rpc url
 * @returns An object with a request method
 * to be called when making rpc requests
 */
export declare const getHardwareWalletProvider: (getRpcUrl: () => string) => {
    request: EIP1193Provider['request'];
};
export {};
