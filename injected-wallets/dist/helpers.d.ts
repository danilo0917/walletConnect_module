import { ProviderRpcErrorCode, WalletModule } from '@web3-onboard/common';
export declare class ProviderRpcError extends Error {
    message: string;
    code: ProviderRpcErrorCode | number;
    data?: unknown;
    constructor(error: Pick<ProviderRpcError, 'message' | 'code' | 'data'>);
}
export declare const remove: ({ detected, metamask }: {
    detected: boolean;
    metamask: boolean;
}) => ({ label }: Partial<WalletModule>) => boolean;
