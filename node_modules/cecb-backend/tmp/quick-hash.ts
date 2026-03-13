import { sha3_256 } from 'js-sha3';
const p = { "email": "admin@cecb.cg.gov.in" };
console.log(`JSON: ${JSON.stringify(p)}`);
console.log(`Hash: ${sha3_256(JSON.stringify(p))}`);
