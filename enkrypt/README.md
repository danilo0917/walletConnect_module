# @web3-onboard/enkrypt

## Wallet module for connecting Enkrypt wallet through web3-onboard

### Install

**NPM**
`npm i @web3-onboard/core @web3-onboard/enkrypt`

**Yarn**
`yarn add @web3-onboard/core @web3-onboard/enkrypt`

## Usage

```typescript
import Onboard from '@web3-onboard/core'
import enrkypt from '@web3-onboard/enkrypt'

const enrkyptModule = enrkypt()

const onboard = Onboard({
  // ... other Onboard options
  wallets: [
    enrkyptModule
    //... other wallets
  ]
})

const connectedWallets = await onboard.connectWallet()
console.log(connectedWallets)
```
