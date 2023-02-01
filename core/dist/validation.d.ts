import { type ChainId, type DecimalChainId, type WalletInit, type WalletModule, type ValidateReturn } from '@web3-onboard/common';
import type { InitOptions, WalletState, ConnectOptions, DisconnectOptions, ConnectOptionsString, AccountCenter, TransactionHandlerReturn, NotifyOptions, Notification, CustomNotification, CustomNotificationUpdate, Notify, PreflightNotificationsOptions, ConnectModalOptions } from './types.js';
export declare function validateWallet(data: WalletState | Partial<WalletState>): ValidateReturn;
export declare function validateInitOptions(data: InitOptions): ValidateReturn;
export declare function validateWalletModule(data: WalletModule): ValidateReturn;
export declare function validateConnectOptions(data: ConnectOptions | ConnectOptionsString): ValidateReturn;
export declare function validateDisconnectOptions(data: DisconnectOptions): ValidateReturn;
export declare function validateString(str: string, label?: string): ValidateReturn;
export declare function validateSetChainOptions(data: {
    chainId: ChainId | DecimalChainId;
    chainNamespace?: string;
    wallet?: WalletState['label'];
}): ValidateReturn;
export declare function validateAccountCenterUpdate(data: AccountCenter | Partial<AccountCenter>): ValidateReturn;
export declare function validateConnectModalUpdate(data: ConnectModalOptions | Partial<ConnectModalOptions>): ValidateReturn;
export declare function validateWalletInit(data: WalletInit[]): ValidateReturn;
export declare function validateLocale(data: string): ValidateReturn;
export declare function validateNotify(data: Partial<Notify>): ValidateReturn;
export declare function validateNotifyOptions(data: Partial<NotifyOptions>): ValidateReturn;
export declare function validateTransactionHandlerReturn(data: TransactionHandlerReturn): ValidateReturn;
export declare function validateNotification(data: Notification): ValidateReturn;
export declare function validatePreflightNotifications(data: PreflightNotificationsOptions): ValidateReturn;
export declare function validateCustomNotificationUpdate(data: CustomNotificationUpdate): ValidateReturn;
export declare function validateCustomNotification(data: CustomNotification): ValidateReturn;
export declare function validateUpdateBalances(data: WalletState[]): ValidateReturn;
