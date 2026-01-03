
export type Arch = 'x86_64' | 'aarch64' | 'armhf' | 'armel' | 'mips' | 'ppc64le';

export interface FileEntry {
  path: string;
  size: number;
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface PackageMetadata {
  id: string; // MD5 hash
  name: string;
  version: string;
  system: string;
  arch: string;
  filename: string;
  uploadDate: string;
  files: FileEntry[];
  verificationStatus?: VerificationStatus;
}

export interface PackageFilter {
  name: string;
  version: string;
  arch: string;
}
