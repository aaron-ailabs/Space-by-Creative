import { SandboxProvider } from './types';
import { SandboxFactory } from './factory';

interface SandboxInfo {
  sandboxId: string;
  provider: SandboxProvider;
  createdAt: Date;
  lastAccessed: Date;
}

class SpaceSandboxManager {
  private sandboxes: Map<string, SandboxInfo> = new Map();
  private activeSandboxId: string | null = null;

  async getOrCreateProvider(sandboxId: string): Promise<SandboxProvider> {
    const existing = this.sandboxes.get(sandboxId);
    if (existing) {
      existing.lastAccessed = new Date();
      return existing.provider;
    }

    try {
      const provider = SandboxFactory.create();
      if (provider.constructor.name === 'E2BProvider') {
        const reconnected = await (provider as any).reconnect(sandboxId);
        if (reconnected) {
          this.registerSandbox(sandboxId, provider);
          return provider;
        }
      }
      return provider;
    } catch (error) {
      console.error(`[SpaceSandboxManager] Error reconnecting to sandbox ${sandboxId}:`, error);
      throw error;
    }
  }

  registerSandbox(sandboxId: string, provider: SandboxProvider): void {
    this.sandboxes.set(sandboxId, {
      sandboxId,
      provider,
      createdAt: new Date(),
      lastAccessed: new Date()
    });
    this.activeSandboxId = sandboxId;
  }

  getActiveProvider(): SandboxProvider | null {
    if (!this.activeSandboxId) return null;
    const sandbox = this.sandboxes.get(this.activeSandboxId);
    if (sandbox) {
      sandbox.lastAccessed = new Date();
      return sandbox.provider;
    }
    return null;
  }

  async terminateSandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      try {
        await sandbox.provider.terminate();
      } catch (error) {
        console.error(`[SpaceSandboxManager] Error terminating sandbox ${sandboxId}:`, error);
      }
      this.sandboxes.delete(sandboxId);
      if (this.activeSandboxId === sandboxId) this.activeSandboxId = null;
    }
  }

  async terminateAll(): Promise<void> {
    const promises = Array.from(this.sandboxes.values()).map(sandbox => 
      sandbox.provider.terminate().catch(err => 
        console.error(`[SpaceSandboxManager] Error terminating sandbox ${sandbox.sandboxId}:`, err)
      )
    );
    await Promise.all(promises);
    this.sandboxes.clear();
    this.activeSandboxId = null;
  }
}

export const spaceSandboxManager = new SpaceSandboxManager();
