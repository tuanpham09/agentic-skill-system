import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import type {
  RegistrySearchResult,
  RegistryResolveResult,
} from '../types/index.js';

export class RegistryClient {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  async search(query: string, limit = 10): Promise<RegistrySearchResult[]> {
    const url = `${this.baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Registry search failed: ${res.status}`);
    const data = (await res.json()) as { results: RegistrySearchResult[] };
    return data.results;
  }

  async resolve(
    name: string,
    version = 'latest'
  ): Promise<RegistryResolveResult> {
    const url = `${this.baseUrl}/api/v1/skills/${encodeURIComponent(name)}/${version}`;
    const res = await fetch(url);
    if (res.status === 404) {
      throw new NotFoundError(
        `Skill '${name}' not found in registry.\n` +
          `→ Run 'agentic-skill search ${name}' to find similar skills.`
      );
    }
    if (!res.ok) throw new Error(`Registry error: ${res.status}`);
    return res.json() as Promise<RegistryResolveResult>;
  }

  async download(downloadUrl: string, destPath: string): Promise<void> {
    mkdirSync(destPath, { recursive: true });
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    if (!res.body) throw new Error('Empty response body');

    // Stream to disk
    const zipPath = `${destPath}.zip`;
    const writer = createWriteStream(zipPath);
    // @ts-expect-error ReadableStream type mismatch between fetch and Node
    await pipeline(res.body, writer);
    return;
  }

  async publish(bundlePath: string): Promise<{ name: string; version: string; url: string }> {
    if (!this.token) {
      throw new AuthError(
        'Not authenticated.\n→ Run: agentic-skill login'
      );
    }

    const { createReadStream } = await import('fs');
    const { basename } = await import('path');

    const formData = new FormData();
    const fileStream = createReadStream(bundlePath);
    // Node 18+ FormData supports Blob
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk as Buffer);
    }
    const blob = new Blob([Buffer.concat(chunks)]);
    formData.append('bundle', blob, basename(bundlePath));

    const res = await fetch(`${this.baseUrl}/api/v1/skills`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });

    if (res.status === 401) throw new AuthError('Token invalid or expired.\n→ Run: agentic-skill login');
    if (res.status === 409) {
      const body = (await res.json()) as { error: string };
      throw new Error(body.error);
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Publish failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<{ name: string; version: string; url: string }>;
  }

  async getToken(
    username: string,
    password: string
  ): Promise<{ token: string; expiresAt: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401) throw new AuthError('Invalid credentials.');
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    return res.json() as Promise<{ token: string; expiresAt: string }>;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
