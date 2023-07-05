import { DefaultAssetNamingStrategy, RequestContext } from '@vendure/core';
import { createHash } from 'crypto';
import path from 'path';

export class PrefixedAssetNamingStrategy extends DefaultAssetNamingStrategy {
    generateSourceFileName(ctx: RequestContext, originalFileName: string, conflictFileName?: string): string {
        const prefix = process.env.ASSET_PREFIX ?? ''
        const filename = super.generateSourceFileName(ctx, originalFileName, conflictFileName);
        return path.join(prefix, 'source', this.getHashedDir(filename), filename);
    }
    generatePreviewFileName(
        ctx: RequestContext,
        originalFileName: string,
        conflictFileName?: string,
    ): string {
        const prefix = process.env.ASSET_PREFIX ?? ''
        const filename = super.generatePreviewFileName(ctx, originalFileName, conflictFileName);
        return path.join(prefix, 'preview', this.getHashedDir(filename), filename);
    }

    private getHashedDir(filename: string): string {
        return createHash('md5').update(filename).digest('hex').slice(0, 2);
    }
}
