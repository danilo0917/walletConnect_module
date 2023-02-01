# @web3-onboard/walletconnect

## Wallet module for connecting Wallet Connect hardware wallets to web3-onboard

### Install

`npm i @web3-onboard/core @web3-onboard/walletconnect`

## Options

```typescript
type WalletConnectOptions = {
  bridge?: string // default = 'https://bridge.walletconnect.org'
  qrcodeModalOptions?: {
    mobileLinks: string[] // set the order and list of mobile linking wallets
  }
  connectFirstChainId?: boolean // if true, connects to the first network chain provided
}
```

## Usage

```typescript
import Onboard from '@web3-onboard/core'
import walletConnectModule from '@web3-onboard/walletconnect'

// initialize the module with options
const walletConnect = walletConnectModule({
  bridge: 'YOUR_CUSTOM_BRIDGE_SERVER',
  qrcodeModalOptions: {
    mobileLinks: ['rainbow', 'metamask', 'argent', 'trust', 'imtoken', 'pillar']
  },
  connectFirstChainId: true
})

// can also initialize with no options...
// const walletConnect = walletConnectModule()

const onboard = Onboard({
  // ... other Onboard options
  wallets: [
    walletConnect
    //... other wallets
  ]
})

const connectedWallets = await onboard.connectWallet()
console.log(connectedWallets)
```
