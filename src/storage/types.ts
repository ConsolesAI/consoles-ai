// Base types for storage responses
export interface StorageUsage {
  storage_bytes: number;
  bandwidth_bytes: number;
  operations: number;
}

export interface StorageResponse {
  status: 'success';
  usage: StorageUsage;
}

// File-related types
export interface FileMetadata {
  folder?: string;
  tags?: string[];
  access?: 'public' | 'private';
}

export interface FileInfo extends StorageResponse {
  result: {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
    created: string;
    modified: string;
    metadata: FileMetadata;
  };
}

// Upload types
export interface UploadOptions {
  type: 'buffer' | 'url';
  content: Buffer | string;
  metadata?: FileMetadata;
}

export interface UploadResponse extends StorageResponse {
  result: {
    id: string;
    path: string;
    size: number;
    type: string;
  };
}

// List types
export interface ListResponse extends StorageResponse {
  result: {
    files: FileInfo[];
    total: number;
  };
}

// Search types
export interface SearchOptions {
  path?: string;
  tags?: string[];
  type?: string;
}

export interface SearchResponse extends StorageResponse {
  result: FileInfo[];
}

// Move types
export interface MoveOptions {
  from: string;
  to: string;
}

export interface MoveResponse extends StorageResponse {
  result: {
    moved: Array<{ from: string; to: string }>;
    total: number;
  };
}

// Tag update types
export interface UpdateTagsOptions {
  files: string;
  tags: string[];
}

export interface UpdateTagsResponse extends StorageResponse {
  result: {
    updated: string[];
    total: number;
  };
}

// Delete response
export interface DeleteResponse extends StorageResponse {
  result: {
    deleted: string[];
    total: number;
  };
}

// Folder operation types
export interface CheckFolderResponse extends StorageResponse {
  result: {
    exists: boolean;
  };
}

export interface CreateFolderResponse extends StorageResponse {
  result: {
    path: string;
  };
}

// Main interfaces
export interface Drive {
  upload(options: UploadOptions): Promise<UploadResponse>;
  file(path: string): File;
  list(path?: string): Promise<ListResponse>;
  search(options: SearchOptions): Promise<SearchResponse>;
  move(options: MoveOptions): Promise<MoveResponse>;
  updateTags(options: UpdateTagsOptions): Promise<UpdateTagsResponse>;
  delete(path: string): Promise<DeleteResponse>;
  uploadMany(files: UploadOptions[]): Promise<UploadResponse[]>;
  // Add methods for folder operations if needed
}

export interface File {
  get(): Promise<FileInfo>;
  makePublic(expires?: string): Promise<void>;
  makePrivate(): Promise<void>;
  isPublic(): Promise<boolean>;
  url(options?: { expires?: string }): Promise<{ url: string }>;
}

export interface Storage {
  drive(name: string): Drive;
  // Add methods for folder operations if needed
} 