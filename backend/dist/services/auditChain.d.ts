interface AuditLogInput {
    eventType: string;
    actorId: string;
    applicationId?: string;
    payload?: any;
}
declare class AuditChainService {
    private stableStringify;
    log(input: AuditLogInput): Promise<void>;
    /**
     * Verify the full chain integrity (SHA3-256 Merkle chain)
     */
    verify(): Promise<{
        valid: boolean;
        brokenAt?: number;
        totalEntries: number;
    }>;
}
export declare const auditChainService: AuditChainService;
export {};
//# sourceMappingURL=auditChain.d.ts.map