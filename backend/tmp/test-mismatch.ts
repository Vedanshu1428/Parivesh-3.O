import { sha3_256 } from 'js-sha3';

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',') + '}';
}

const p1 = { "utr": "UTR123456789", "amount": 5000 };
const p2 = { "utrNumber": "UTR123456789", "amount": 5000 };

console.log(`Stable p1 (utr):       ${stableStringify(p1)}`);
console.log(`Hash p1:               ${sha3_256(stableStringify(p1))}`);
console.log(`Stable p2 (utrNumber): ${stableStringify(p2)}`);
console.log(`Hash p2:               ${sha3_256(stableStringify(p2))}`);
