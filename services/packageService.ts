
import { PackageMetadata, VerificationStatus, PackageFilter, GlobalStats } from '../types.ts';

const API_BASE = 'https://develop.819819.xyz/api';

async function handleJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(0, lastBrace + 1));
      } catch (innerError) {
        throw new Error(`Failed to parse JSON`);
      }
    }
    throw e;
  }
}

const mapPackage = (pkg: any): PackageMetadata => ({
  id: pkg.id,
  name: pkg.name,
  version: pkg.version,
  system: pkg.system,
  arch: pkg.architecture || pkg.arch,
  filename: pkg.original_filename,
  uploadDate: pkg.upload_time,
  totalSize: pkg.total_size || 0,
  fileCount: pkg.file_count || 0,
  downloadCount: pkg.download_count || 0,
  lastCheckTime: pkg.last_check_time,
  lastDownloadTime: pkg.last_download_time,
  verificationStatus: pkg.check_status as VerificationStatus,
  files: [],
  matchedFiles: pkg.matched_files ? pkg.matched_files.map((f: any) => ({
    path: f.file_path,
    name: f.file_name,
    size: f.file_size,
    downloadCount: f.download_count,
    lastDownloadTime: f.last_download_time
  })) : undefined
});

export const packageService = {
  parseFilename(filename: string): Partial<PackageMetadata> | null {
    const regex = /^(.+)-([^-]+)-(linux)-([^-.]+)\.(zip|tar\.gz)$/i;
    const match = filename.match(regex);
    if (!match) return null;
    return { name: match[1], version: match[2], system: match[3], arch: match[4] };
  },

  async getPackages(): Promise<PackageMetadata[]> {
    const response = await fetch(`${API_BASE}/packages`);
    const data = await handleJsonResponse(response);
    return data.packages.map(mapPackage);
  },

  async searchPackages(filter: PackageFilter): Promise<PackageMetadata[]> {
    // If searching by file, use the dedicated endpoint provided by the user
    if (filter.filePath) {
      const response = await fetch(`${API_BASE}/packages/files/search?filename=${encodeURIComponent(filter.filePath)}`);
      const data = await handleJsonResponse(response);
      return (data.packages || []).map(mapPackage);
    }

    // Otherwise use standard package search
    const params = new URLSearchParams();
    if (filter.name) params.append('name', filter.name);
    if (filter.version) params.append('version', filter.version);
    if (filter.arch && filter.arch !== 'all') params.append('architecture', filter.arch);

    const response = await fetch(`${API_BASE}/packages/search?${params.toString()}`);
    const data = await handleJsonResponse(response);
    return (data.packages || []).map(mapPackage);
  },

  async getStatistics(): Promise<GlobalStats> {
    const response = await fetch(`${API_BASE}/packages/statistics`);
    const data = await handleJsonResponse(response);
    return data.statistics;
  },

  async uploadPackage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/packages/upload`, { method: 'POST', body: formData });
    return await handleJsonResponse(response);
  },

  async getPackageById(id: string): Promise<PackageMetadata> {
    const response = await fetch(`${API_BASE}/packages/${id}`);
    const data = await handleJsonResponse(response);
    const pkg = mapPackage(data.package);
    pkg.files = data.files || [];
    return pkg;
  },

  async verifyPackage(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/packages/${id}/check`);
    return await handleJsonResponse(response);
  },

  async verifyPackages(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.verifyPackage(id);
    }
  },

  async verifyAllPackages(): Promise<any> {
    const response = await fetch(`${API_BASE}/packages/check-all`, { method: 'POST' });
    return await handleJsonResponse(response);
  },

  async downloadPackage(id: string, filename: string) {
    window.open(`${API_BASE}/packages/${id}/download`, '_blank');
  },

  async downloadFile(packageId: string, filePath: string) {
    window.open(`${API_BASE}/packages/${packageId}/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
  },

  async deletePackage(id: string): Promise<void> {
    await fetch(`${API_BASE}/packages/${id}`, { method: 'DELETE' });
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await fetch(`${API_BASE}/packages/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_ids: ids }),
    });
  },

  async clearAll(): Promise<void> {
    await fetch(`${API_BASE}/packages/delete-all`, { method: 'DELETE' });
  }
};