import { sha3_256 } from 'js-sha3';

const amount = 25000;
const utrNumber = "UTR123456789012";

const p1 = `{"amount":25000,"utrNumber":"UTR123456789012"}`;
const p2 = `{"utrNumber":"UTR123456789012","amount":25000}`;

console.log(`Hash p1: ${sha3_256(p1)}`);
console.log(`Hash p2: ${sha3_256(p2)}`);

const target = "a654ff59a1e053498eb47524531f3c37a5189ee09d180ab925a5f276ce0808aa";
if (sha3_256(p1) === target) console.log('MATCH P1');
if (sha3_256(p2) === target) console.log('MATCH P2');
