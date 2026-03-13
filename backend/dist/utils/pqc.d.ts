/**
 * STUB: Post-Quantum Cryptography (PQC) integration
 *
 * In production, this module would wrap `node-oqs` (or a similar liboqs-based Node addon)
 * to perform post-quantum key encapsulation (using ML-KEM / CRYSTALS-Kyber) and
 * digital signatures (using ML-DSA / CRYSTALS-Dilithium) for secure document signing
 * and audit chain verification against future quantum attacks.
 */
export declare class PQCManager {
    /**
     * Generates a keypair using FIPS 203 ML-KEM-768
     */
    static generateKyberKeyPair(): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    /**
     * Signs document content using FIPS 204 ML-DSA-65
     */
    static signDocument(contentHash: string, privateKey: string): Promise<string>;
    /**
     * Verifies a digital signature using FIPS 204 ML-DSA-65
     */
    static verifySignature(contentHash: string, signature: string, publicKey: string): Promise<boolean>;
}
//# sourceMappingURL=pqc.d.ts.map