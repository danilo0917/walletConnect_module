import type { ExternalProvider } from '@ethersproject/providers';
import { EIP1193Provider, WalletModule, ProviderAccounts, Platform, Device } from '@web3-onboard/common';
/**
 * The `ProviderIdentityFlag` is a property on an injected provider
 * that uniquely identifies that provider
 */
export declare enum ProviderIdentityFlag {
    AlphaWallet = "isAlphaWallet",
    AToken = "isAToken",
    Binance = "bbcSignTx",
    Bitpie = "isBitpie",
    BlockWallet = "isBlockWallet",
    Coinbase = "isToshi",
    CoinbaseExtension = "isCoinbaseWallet",
    Detected = "request",
    Dcent = "isDcentWallet",
    Exodus = "isExodus",
    Frame = "isFrame",
    HuobiWallet = "isHbWallet",
    HyperPay = "isHyperPay",
    ImToken = "isImToken",
    Liquality = "isLiquality",
    MeetOne = "wallet",
    MetaMask = "isMetaMask",
    MyKey = "isMYKEY",
    OwnBit = "isOwnbit",
    Status = "isStatus",
    Trust = "isTrust",
    TokenPocket = "isTokenPocket",
    TP = "isTp",
    WalletIo = "isWalletIO",
    XDEFI = "isXDEFI",
    OneInch = "isOneInchIOSWallet",
    Tokenary = "isTokenary",
    Tally = "isTally",
    BraveWallet = "isBraveWallet",
    Rabby = "isRabby",
    MathWallet = "isMathWallet",
    GameStop = "isGamestop",
    BitKeep = "isBitKeep",
    Sequence = "isSequence",
    Core = "isAvalanche",
    Opera = "isOpera",
    Bitski = "isBitski",
    Enkrypt = "isEnkrypt",
    Zeal = "isZeal",
    Phantom = "isPhantom"
}
export declare enum ProviderLabel {
    AlphaWallet = "AlphaWallet",
    AToken = "AToken",
    Binance = "Binance Smart Wallet",
    Bitpie = "Bitpie",
    Bitski = "Bitski",
    BlockWallet = "BlockWallet",
    Brave = "Brave Wallet",
    Coinbase = "Coinbase Wallet",
    Dcent = "D'CENT",
    Detected = "Detected Wallet",
    Exodus = "Exodus",
    Frame = "Frame",
    HuobiWallet = "Huobi Wallet",
    HyperPay = "HyperPay",
    ImToken = "imToken",
    Liquality = "Liquality",
    MeetOne = "MeetOne",
    MetaMask = "MetaMask",
    MyKey = "MyKey",
    Opera = "Opera Wallet",
    OwnBit = "OwnBit",
    Status = "Status Wallet",
    Trust = "Trust Wallet",
    TokenPocket = "TokenPocket",
    TP = "TP Wallet",
    WalletIo = "Wallet.io",
    XDEFI = "XDEFI Wallet",
    OneInch = "1inch Wallet",
    Tokenary = "Tokenary Wallet",
    Tally = "Tally Ho Wallet",
    Rabby = "Rabby",
    MathWallet = "MathWallet",
    GameStop = "GameStop Wallet",
    BitKeep = "BitKeep",
    Sequence = "Sequence",
    Core = "Core",
    Enkrypt = "Enkrypt",
    Zeal = "Zeal",
    Phantom = "Phantom"
}
export interface MeetOneProvider extends ExternalProvider {
    wallet?: string;
}
export interface BinanceProvider extends EIP1193Provider {
    bbcSignTx: () => void;
    requestAccounts: () => Promise<ProviderAccounts>;
    isUnlocked: boolean;
}
export declare enum InjectedNameSpace {
    Ethereum = "ethereum",
    Binance = "BinanceChain",
    Tally = "tally",
    Web3 = "web3",
    Arbitrum = "arbitrum",
    XFI = "xfi",
    GameStop = "gamestop",
    BitKeep = "bitkeep",
    Avalanche = "avalanche",
    Bitski = "Bitski",
    Enkrypt = "enkrypt",
    Zeal = "zeal",
    Phantom = "phantom"
}
export interface CustomWindow extends Window {
    BinanceChain: BinanceProvider;
    ethereum: InjectedProvider;
    tally: InjectedProvider;
    zeal: InjectedProvider;
    web3: ExternalProvider | MeetOneProvider;
    arbitrum: InjectedProvider;
    xfi: {
        ethereum: InjectedProvider;
    };
    gamestop: InjectedProvider;
    bitkeep: {
        ethereum: InjectedProvider;
    };
    avalanche: InjectedProvider;
    Bitski: {
        getProvider(): InjectedProvider;
    };
    enkrypt: {
        providers: {
            ethereum: InjectedProvider;
        };
    };
    phantom: {
        ethereum: InjectedProvider;
    };
}
export type InjectedProvider = ExternalProvider & BinanceProvider & MeetOneProvider & Record<string, boolean> & Record<string, InjectedProvider[]>;
export type WalletFilters = {
    [key in ProviderLabel | string]?: Platform[] | boolean;
};
export interface InjectedWalletOptions {
    custom?: InjectedWalletModule[];
    filter?: WalletFilters;
}
export interface InjectedWalletModule extends WalletModule {
    injectedNamespace: InjectedNameSpace;
    checkProviderIdentity: (helpers: {
        provider: any;
        device: Device;
    }) => boolean;
    platforms: Platform[];
}
