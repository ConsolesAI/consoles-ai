import {
  Storage as IStorage,
  Drive as IDrive,
  File as IFile,
  UploadOptions,
  UploadResponse,
  ListResponse,
  SearchOptions,
  SearchResponse,
  MoveOptions,
  MoveResponse,
  UpdateTagsOptions,
  UpdateTagsResponse,
  DeleteResponse,
  FileInfo
} from './types';

export class Storage implements IStorage {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  drive(name: string): IDrive {
    return new Drive(name, this.apiKey);
  }

  async upload({ type, content, metadata }) {
    const { folder, tags } = metadata;

    // Check if folder path is provided and contains a slash
    if (folder && folder.includes('/')) {
      // Check if the folder exists
      const folderExists = await this.checkFolderExists(folder);

      // Create the folder if it doesn't exist
      if (!folderExists) {
        await this.createFolder(folder);
      }
    }

    // Proceed with the upload
    // existing upload logic...
  }

  async checkFolderExists(folderPath): Promise<boolean> {
    // Logic to check if the folder exists
    // This could involve an API call to list folders or a metadata check
    // Return true if exists, false otherwise

    // Example implementation (replace with actual logic)
    const response = await fetch(`https://api.consoles.ai/v1/storage/check-folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath })
    });

    const result = await response.json();
    return result.exists; // Assuming the API returns an 'exists' boolean
  }

  async createFolder(folderPath) {
    // Logic to create the folder
    // This could involve an API call to create a new folder
  }
}

class Drive implements IDrive {
  private name: string;
  private apiKey: string;

  constructor(name: string, apiKey: string) {
    this.name = name;
    this.apiKey = apiKey;
  }

  async upload(options: UploadOptions): Promise<UploadResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        ...options
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: {
        id: result.id,
        path: result.path,
        size: result.size,
        type: result.type
      },
      usage: result.usage
    };
  }

  file(path: string): IFile {
    return new File(this.name, path, this.apiKey);
  }

  async list(path?: string): Promise<ListResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        path
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: {
        files: result.files,
        total: result.total
      },
      usage: result.usage
    };
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        ...options
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: result.files,
      usage: result.usage
    };
  }

  async move(options: MoveOptions): Promise<MoveResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/move', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        ...options
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: {
        moved: result.moved,
        total: result.total
      },
      usage: result.usage
    };
  }

  async updateTags(options: UpdateTagsOptions): Promise<UpdateTagsResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/tags', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        ...options
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: {
        updated: result.updated,
        total: result.total
      },
      usage: result.usage
    };
  }

  async delete(path: string): Promise<DeleteResponse> {
    const response = await fetch('https://api.consoles.ai/v1/storage/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.name,
        path
      })
    });
    const result = await response.json();
    return {
      status: 'success',
      result: {
        deleted: result.deleted,
        total: result.total
      },
      usage: result.usage
    };
  }

  async uploadMany(files: UploadOptions[]): Promise<UploadResponse[]> {
    return Promise.all(files.map(options => this.upload(options)));
  }
}

class File implements IFile {
  private drive: string;
  private path: string;
  private apiKey: string;

  constructor(drive: string, path: string, apiKey: string) {
    this.drive = drive;
    this.path = path;
    this.apiKey = apiKey;
  }

  async get(): Promise<FileInfo> {
    const response = await fetch('https://api.consoles.ai/v1/storage/fileinfo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.drive,
        path: this.path
      })
    });
    return await response.json();
  }

  async makePublic(expires?: string): Promise<void> {
    await fetch('https://api.consoles.ai/v1/storage/access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.drive,
        path: this.path,
        access: 'public',
        expires
      })
    });
  }

  async makePrivate(): Promise<void> {
    await fetch('https://api.consoles.ai/v1/storage/access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.drive,
        path: this.path,
        access: 'private'
      })
    });
  }

  async isPublic(): Promise<boolean> {
    const info = await this.get();
    return info.result.metadata.access === 'public';
  }

  async url(options?: { expires?: string }): Promise<{ url: string }> {
    const response = await fetch('https://api.consoles.ai/v1/storage/url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        drive: this.drive,
        path: this.path,
        ...options
      })
    });
    return await response.json();
  }
}

// Export types
export * from './types';