// Polyfill Web Crypto in Jest Node environment
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeCrypto = require('crypto')
if (!globalThis.crypto) {
  ;(globalThis as any).crypto = nodeCrypto.webcrypto
}
