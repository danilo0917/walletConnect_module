import { createEIP1193Provider } from '@web3-onboard/common';
import { InjectedNameSpace, ProviderIdentityFlag, ProviderLabel } from './types.js';
const UNSUPPORTED_METHOD = null;
function getInjectedInterface(identity, checkOtherProviderFlags) {
    return async () => ({
        provider: (window.ethereum.providers &&
            Array.isArray(window.ethereum.providers)
            ? getInterfaceFromProvidersArray(identity, checkOtherProviderFlags)
            : window.ethereum)
    });
}
function getInterfaceFromProvidersArray(identity, checkOtherProviderFlags) {
    return window.ethereum.providers.find(provider => {
        return checkOtherProviderFlags
            ? !!provider[identity] && !otherProviderFlagsExist(identity, provider)
            : !!provider[identity];
    });
}
function otherProviderFlagsExist(identity, provider) {
    const otherProviderFlags = Object.values(ProviderIdentityFlag).filter(id => id !== identity && id !== ProviderIdentityFlag.Detected);
    return otherProviderFlags.some(id => !!provider[id]);
}
const metamask = {
    label: ProviderLabel.MetaMask,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider &&
        !!provider[ProviderIdentityFlag.MetaMask] &&
        !otherProviderFlagsExist(ProviderIdentityFlag.MetaMask, provider),
    getIcon: async () => (await import('./icons/metamask.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.MetaMask, true),
    platforms: ['all']
};
const exodus = {
    label: ProviderLabel.Exodus,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Exodus],
    getIcon: async () => (await import('./icons/exodus.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.Exodus),
    platforms: ['all']
};
const brave = {
    label: ProviderLabel.Brave,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.BraveWallet],
    getIcon: async () => (await import('./icons/brave.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.BraveWallet),
    platforms: ['all']
};
const binance = {
    label: ProviderLabel.Binance,
    injectedNamespace: InjectedNameSpace.Binance,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Binance],
    getIcon: async () => (await import('./icons/binance.js')).default,
    getInterface: async () => {
        // Replace the provider as the BNB provider is readonly
        let tempBNBProvider = {
            ...window.BinanceChain
        };
        window.BinanceChain = tempBNBProvider;
        const addListener = window.BinanceChain.on.bind(window.BinanceChain);
        window.BinanceChain.on = (event, func) => {
            // intercept chainChanged event and format string
            if (event === 'chainChanged') {
                addListener(event, (chainId) => {
                    const cb = func;
                    cb(`0x${parseInt(chainId).toString(16)}`);
                });
            }
            else {
                addListener(event, func);
            }
        };
        const provider = createEIP1193Provider(window.BinanceChain, {
            eth_chainId: ({ baseRequest }) => baseRequest({ method: 'eth_chainId' }).then(id => `0x${parseInt(id).toString(16)}`),
            // Unsupported method -- will throw error
            eth_selectAccounts: UNSUPPORTED_METHOD,
            wallet_switchEthereumChain: UNSUPPORTED_METHOD
        });
        provider.removeListener = (event, func) => { };
        return {
            provider
        };
    },
    platforms: ['desktop']
};
const coinbase = {
    label: ProviderLabel.Coinbase,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => (!!provider && !!provider[ProviderIdentityFlag.Coinbase]) ||
        (!!provider && !!provider[ProviderIdentityFlag.CoinbaseExtension]),
    getIcon: async () => (await import('./icons/coinbase.js')).default,
    getInterface: async () => {
        const { provider } = await getInjectedInterface(ProviderIdentityFlag.CoinbaseExtension)();
        const addListener = provider.on.bind(provider);
        provider.on = (event, func) => {
            // intercept chainChanged event and format string
            if (event === 'chainChanged') {
                addListener(event, (chainId) => {
                    const cb = func;
                    cb(`0x${parseInt(chainId).toString(16)}`);
                });
            }
            else {
                addListener(event, func);
            }
        };
        return { provider };
    },
    platforms: ['all']
};
const detected = {
    label: ProviderLabel.Detected,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Detected],
    getIcon: async () => (await import('./icons/detected.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['all']
};
const trust = {
    label: ProviderLabel.Trust,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider &&
        !!provider[ProviderIdentityFlag.Trust] &&
        !!provider &&
        !provider[ProviderIdentityFlag.TokenPocket],
    getIcon: async () => (await import('./icons/trust.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const opera = {
    label: ProviderLabel.Opera,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Opera],
    getIcon: async () => (await import('./icons/opera.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            eth_requestAccounts: async ({ baseRequest }) => baseRequest({ method: 'eth_accounts' }),
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['all']
};
const status = {
    label: ProviderLabel.Status,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Status],
    getIcon: async () => (await import('./icons/status.js')).default,
    getInterface: async () => {
        const provider = window.ethereum;
        return {
            provider
        };
    },
    platforms: ['mobile']
};
const alphawallet = {
    label: ProviderLabel.AlphaWallet,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.AlphaWallet],
    getIcon: async () => (await import('./icons/alphawallet.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const atoken = {
    label: ProviderLabel.AToken,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.AToken],
    getIcon: async () => (await import('./icons/atoken.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['mobile']
};
const bitpie = {
    label: ProviderLabel.Bitpie,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: () => !!window.Bitpie,
    getIcon: async () => (await import('./icons/bitpie.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const blockwallet = {
    label: ProviderLabel.BlockWallet,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.BlockWallet],
    getIcon: async () => (await import('./icons/blockwallet.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.BlockWallet),
    platforms: ['desktop']
};
const frame = {
    label: ProviderLabel.Frame,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Frame],
    getIcon: async () => (await import('./icons/frame.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['desktop']
};
const huobiwallet = {
    label: ProviderLabel.HuobiWallet,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.HuobiWallet],
    getIcon: async () => (await import('./icons/huobiwallet.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const hyperpay = {
    label: ProviderLabel.HyperPay,
    injectedNamespace: InjectedNameSpace.Ethereum,
    // Note: The property `hiWallet` is as of now the only known way of identifying hyperpay
    // wallet as it is a direct clone of metamask. `checkProviderIdentity` implementation is subject to
    // future changes
    checkProviderIdentity: () => !!window.hiWallet,
    getIcon: async () => (await import('./icons/hyperpay.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const imtoken = {
    label: ProviderLabel.ImToken,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.ImToken],
    getIcon: async () => (await import('./icons/imtoken.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const liquality = {
    label: ProviderLabel.Liquality,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Liquality],
    getIcon: async () => (await import('./icons/liquality.js')).default,
    getInterface: async () => {
        const provider = createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        });
        provider.removeListener = (event, func) => { };
        return { provider };
    },
    platforms: ['desktop']
};
const meetone = {
    label: ProviderLabel.MeetOne,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && provider[ProviderIdentityFlag.MeetOne] === 'MEETONE',
    getIcon: async () => (await import('./icons/meetone.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['mobile']
};
const mykey = {
    label: ProviderLabel.MyKey,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.MyKey],
    getIcon: async () => (await import('./icons/mykey.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['mobile']
};
const ownbit = {
    label: ProviderLabel.OwnBit,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.OwnBit],
    getIcon: async () => (await import('./icons/ownbit.js')).default,
    getInterface: async () => {
        const provider = createEIP1193Provider(window.ethereum, {
            eth_chainId: ({ baseRequest }) => baseRequest({ method: 'eth_chainId' }).then(id => `0x${parseInt(id).toString(16)}`),
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        });
        provider.removeListener = (event, listener) => { };
        provider.on = (event, listener) => { };
        return { provider };
    },
    platforms: ['mobile']
};
const tokenpocket = {
    label: ProviderLabel.TokenPocket,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider &&
        !!provider[ProviderIdentityFlag.TokenPocket] &&
        !provider[ProviderIdentityFlag.TP],
    getIcon: async () => (await import('./icons/tokenpocket.js')).default,
    getInterface: async ({ EventEmitter }) => {
        const emitter = new EventEmitter();
        const provider = createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: ({ baseRequest, params }) => {
                emitter.emit('chainChanged', params[0].chainId);
                return baseRequest({
                    method: 'wallet_switchEthereumChain',
                    params
                });
            },
            eth_selectAccounts: UNSUPPORTED_METHOD
        });
        provider.on = emitter.on.bind(emitter);
        return {
            provider
        };
    },
    platforms: ['all']
};
const tp = {
    label: ProviderLabel.TP,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.TP],
    getIcon: async () => (await import('./icons/tp.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum, {
            wallet_switchEthereumChain: UNSUPPORTED_METHOD,
            eth_selectAccounts: UNSUPPORTED_METHOD
        })
    }),
    platforms: ['mobile']
};
const xdefi = {
    label: ProviderLabel.XDEFI,
    injectedNamespace: InjectedNameSpace.XFI,
    checkProviderIdentity: ({ provider }) => provider &&
        provider.ethereum &&
        provider.ethereum[ProviderIdentityFlag.XDEFI],
    getIcon: async () => (await import('./icons/xdefi.js')).default,
    getInterface: async () => ({
        provider: window.xfi && window.xfi.ethereum
    }),
    platforms: ['all']
};
const oneInch = {
    label: ProviderLabel.OneInch,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.OneInch],
    getIcon: async () => (await import('./icons/oneInch.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum)
    }),
    platforms: ['mobile']
};
const tokenary = {
    label: ProviderLabel.Tokenary,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Tokenary],
    getIcon: async () => (await import('./icons/tokenary.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum)
    }),
    platforms: ['all']
};
const tally = {
    label: ProviderLabel.Tally,
    injectedNamespace: InjectedNameSpace.Tally,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Tally],
    getIcon: async () => (await import('./icons/tallywallet.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.tally)
    }),
    platforms: ['desktop']
};
const zeal = {
    label: ProviderLabel.Zeal,
    injectedNamespace: InjectedNameSpace.Zeal,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Zeal],
    getIcon: async () => (await import('./icons/zeal.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.zeal)
    }),
    platforms: ['desktop']
};
const rabby = {
    label: ProviderLabel.Rabby,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Rabby],
    getIcon: async () => (await import('./icons/rabby.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.ethereum)
    }),
    platforms: ['desktop']
};
const mathwallet = {
    label: ProviderLabel.MathWallet,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.MathWallet],
    getIcon: async () => (await import('./icons/mathwallet.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.MathWallet),
    platforms: ['all']
};
const gamestop = {
    label: ProviderLabel.GameStop,
    injectedNamespace: InjectedNameSpace.GameStop,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.GameStop],
    getIcon: async () => (await import('./icons/gamestop.js')).default,
    getInterface: async () => {
        const provider = createEIP1193Provider(window.gamestop, {
            eth_chainId: ({ baseRequest }) => baseRequest({ method: 'eth_chainId' }).then(id => `0x${parseInt(id).toString(16)}`),
            wallet_switchEthereumChain: UNSUPPORTED_METHOD
        });
        provider.removeListener = (event, listener) => { };
        provider.on = (event, listener) => { };
        return { provider };
    },
    platforms: ['desktop']
};
const bitkeep = {
    label: ProviderLabel.BitKeep,
    injectedNamespace: InjectedNameSpace.BitKeep,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider['ethereum'][ProviderIdentityFlag.BitKeep],
    getIcon: async () => (await import('./icons/bitkeep.js')).default,
    getInterface: async () => ({
        provider: window.bitkeep && window.bitkeep.ethereum
    }),
    platforms: ['all']
};
const sequence = {
    label: ProviderLabel.Sequence,
    injectedNamespace: InjectedNameSpace.Ethereum,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Sequence],
    getIcon: async () => (await import('./icons/sequence.js')).default,
    getInterface: async () => ({
        provider: window.ethereum
    }),
    platforms: ['all']
};
const core = {
    label: ProviderLabel.Core,
    injectedNamespace: InjectedNameSpace.Avalanche,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider[ProviderIdentityFlag.Core],
    getIcon: async () => (await import('./icons/core.js')).default,
    getInterface: getInjectedInterface(ProviderIdentityFlag.Core),
    // Core wallet is only tested in chrome or chromium browser
    platforms: ['desktop', 'Chrome', 'Chromium', 'Microsoft Edge']
};
const bitski = {
    label: ProviderLabel.Bitski,
    injectedNamespace: InjectedNameSpace.Bitski,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider.getProvider && !!provider.getProvider().isBitski,
    getIcon: async () => (await import('./icons/bitski.js')).default,
    getInterface: async () => ({
        provider: window.Bitski && window.Bitski.getProvider && window.Bitski.getProvider()
    }),
    platforms: ['all']
};
const enkrypt = {
    label: ProviderLabel.Enkrypt,
    injectedNamespace: InjectedNameSpace.Enkrypt,
    checkProviderIdentity: ({ provider }) => !!provider && !!provider.providers && !!provider.providers.ethereum,
    getIcon: async () => (await import('./icons/enkrypt.js')).default,
    getInterface: async () => {
        const addListener = window.enkrypt.providers.ethereum.on.bind(window.enkrypt.providers.ethereum);
        window.enkrypt.providers.ethereum.on = (event, func) => {
            // intercept chainChanged event and format string
            if (event === 'chainChanged') {
                addListener(event, (chainId) => {
                    const cb = func;
                    cb(`0x${parseInt(chainId).toString(16)}`);
                });
            }
            else {
                addListener(event, func);
            }
        };
        const provider = createEIP1193Provider(window.enkrypt.providers.ethereum, {
            eth_chainId: ({ baseRequest }) => baseRequest({ method: 'eth_chainId' }).then(id => `0x${parseInt(id).toString(16)}`)
        });
        provider.removeListener = (event, func) => { };
        return {
            provider
        };
    },
    platforms: ['all']
};
const phantom = {
    label: ProviderLabel.Phantom,
    injectedNamespace: InjectedNameSpace.Phantom,
    checkProviderIdentity: ({ provider }) => !!provider &&
        !!provider['ethereum'] &&
        !!provider['ethereum'][ProviderIdentityFlag.Phantom],
    getIcon: async () => (await import('./icons/phantom.js')).default,
    getInterface: async () => ({
        provider: createEIP1193Provider(window.phantom.ethereum)
    }),
    platforms: ['all']
};
const wallets = [
    zeal,
    exodus,
    metamask,
    binance,
    coinbase,
    detected,
    trust,
    opera,
    status,
    alphawallet,
    atoken,
    bitpie,
    blockwallet,
    brave,
    frame,
    huobiwallet,
    hyperpay,
    imtoken,
    liquality,
    meetone,
    mykey,
    ownbit,
    tokenpocket,
    tp,
    xdefi,
    oneInch,
    tokenary,
    tally,
    rabby,
    mathwallet,
    gamestop,
    bitkeep,
    sequence,
    core,
    bitski,
    enkrypt,
    phantom
];
export default wallets;
