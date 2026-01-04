export type Arch = 'x86_64' | 'aarch64' | 'armhf' | 'armel' | 'mips' | 'ppc64le';

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  downloadCount?: number;
  lastDownloadTime?: string;
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFYING = 'checking',
  SUCCESS = 'valid',
  FAILED = 'invalid'
}

export interface PackageMetadata {
  id: string;
  name: string;
  version: string;
  system: string;
  arch: string;
  filename: string;
  uploadDate: string;
  totalSize: number;
  fileCount: number;
  downloadCount: number;
  lastCheckTime: string | null;
  lastDownloadTime: string | null;
  verificationStatus: VerificationStatus;
  files: FileEntry[];
}

export interface StatItem {
  architecture?: string;
  system?: string;
  status?: string;
  package_count: number;
  total_size: number;
  total_size_human: string;
  download_count: number;
}

export interface GlobalStats {
  summary: {
    total_packages: number;
    total_size: number;
    total_size_human: string;
    total_files: number;
    total_downloads: number;
    avg_file_size: number;
    avg_package_size: number;
  };
  by_architecture: StatItem[];
  by_system: StatItem[];
}

export interface PackageFilter {
  name: string;
  version: string;
  arch: string;
}
