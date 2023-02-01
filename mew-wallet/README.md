# @web3-onboard/mew-wallet

## Wallet module for connecting Mew wallet through web3-onboard

### Install

**NPM**
`npm i @web3-onboard/core @web3-onboard/mew-wallet`

**Yarn**
`yarn add @web3-onboard/core @web3-onboard/mew-wallet`

## Usage

```typescript
import Onboard from '@web3-onboard/core'
import mewWallet from '@web3-onboard/mew-wallet'

const mewWalletModule = mewWallet()

const onboard = Onboard({
  // ... other Onboard options
  wallets: [
    mewWalletModule
    //... other wallets
  ]
})

const connectedWallets = await onboard.connectWallet()
console.log(connectedWallets)
```
