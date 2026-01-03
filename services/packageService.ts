
import { PackageMetadata, VerificationStatus, FileEntry, PackageFilter } from '../types';

const API_BASE = '/api';

// Helper to handle robust JSON parsing from fetch responses
async function handleJsonResponse(response: Response) {
  const text = await response.text();
  try {
    // Attempt to parse the full trimmed text
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("JSON Parse Error. Raw response:", text);
    
    // Fallback: If there is trailing junk (like a script injected by a proxy), 
    // try to extract the valid JSON part by finding the last closing brace or bracket
    const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(0, lastBrace + 1));
      } catch (innerError) {
        throw new Error(`Failed to parse JSON: ${text.substring(0, 40)}...`);
      }
    }
    throw e;
  }
}

// Map backend check_status to frontend VerificationStatus
const mapStatus = (status: string): VerificationStatus => {
  switch (status) {
    case 'valid': return VerificationStatus.SUCCESS;
    case 'invalid': return VerificationStatus.FAILED;
    case 'checking': return VerificationStatus.VERIFYING;
    default: return VerificationStatus.PENDING;
  }
};

export const packageService = {
  // Parse filename locally for UI feedback before upload
  parseFilename(filename: string): Partial<PackageMetadata> | null {
    const regex = /^(.+)-([^-]+)-(linux)-([^-.]+)\.(zip|tar\.gz)$/i;
    const match = filename.match(regex);
    if (!match) return null;

    return {
      name: match[1],
      version: match[2],
      system: match[3],
      arch: match[4]
    };
  },

  async getPackages(): Promise<PackageMetadata[]> {
    const response = await fetch(`${API_BASE}/packages`);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Failed to fetch packages');
    
    return data.packages.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      system: pkg.system,
      arch: pkg.architecture,
      filename: pkg.original_filename,
      uploadDate: pkg.upload_time,
      verificationStatus: mapStatus(pkg.check_status),
      files: []
    }));
  },

  async searchPackages(filter: PackageFilter): Promise<PackageMetadata[]> {
    const params = new URLSearchParams();
    if (filter.query) params.append('name', filter.query);
    if (filter.arch && filter.arch !== 'all') params.append('architecture', filter.arch);

    const response = await fetch(`${API_BASE}/packages/search?${params.toString()}`);
    if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
    
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Search failed');

    return data.packages.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      system: pkg.system,
      arch: pkg.architecture,
      verificationStatus: mapStatus(pkg.check_status),
      files: []
    }));
  },

  async uploadPackage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/packages/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data;
  },

  async getPackageById(id: string): Promise<PackageMetadata> {
    const response = await fetch(`${API_BASE}/packages/${id}`);
    if (!response.ok) throw new Error(`Fetch package failed with status ${response.status}`);
    
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Failed to fetch package details');

    return {
      id: data.package.id,
      name: data.package.name,
      version: data.package.version,
      system: data.package.system,
      arch: data.package.architecture,
      filename: data.package.original_filename,
      uploadDate: data.package.upload_time,
      verificationStatus: mapStatus(data.package.check_status),
      files: data.files || []
    };
  },

  async verifyPackage(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/packages/${id}/check`);
    const data = await handleJsonResponse(response);
    return data.valid === true;
  },

  async deletePackage(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/packages/${id}`, {
      method: 'DELETE',
    });
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Delete failed');
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/packages/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_ids: ids }),
    });
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Batch delete failed');
  },

  async clearAll(): Promise<void> {
    const response = await fetch(`${API_BASE}/packages/delete-all`, {
      method: 'DELETE',
    });
    const data = await handleJsonResponse(response);
    if (!data.success) throw new Error(data.error || 'Clear all failed');
  }
};
