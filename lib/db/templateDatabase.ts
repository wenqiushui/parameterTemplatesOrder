import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  generationMode: 'browser' | 'server' | 'external';
  parameterSchema: string; // JSON string
  defaultParameters: string; // JSON string
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateDependencyRecord {
  templateId: string;
  dependencyId: string;
  parameterMapping: string; // JSON string
}

export interface TemplateCodeRecord {
  templateId: string;
  version: string;
  code: string;
  createdAt: number;
}

export interface TemplateThumbnailRecord {
  templateId: string;
  version: string;
  thumbnailPath: string;
  createdAt: number;
}

class TemplateDatabase {
  private db: Database | null = null;
  private static instance: TemplateDatabase;

  private constructor() {}

  public static getInstance(): TemplateDatabase {
    if (!TemplateDatabase.instance) {
      TemplateDatabase.instance = new TemplateDatabase();
    }
    return TemplateDatabase.instance;
  }

  public async connect(): Promise<void> {
    if (this.db) return;

    const dbDir = path.resolve(process.cwd(), 'data');
    const dbPath = path.resolve(dbDir, 'templates.db');
    
    // 确保数据目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // 创建模板表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS Templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        generationMode TEXT NOT NULL,
        parameterSchema TEXT NOT NULL,
        defaultParameters TEXT NOT NULL,
        version TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    // 创建模板依赖表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS TemplateDependencies (
        templateId TEXT NOT NULL,
        dependencyId TEXT NOT NULL,
        parameterMapping TEXT,
        PRIMARY KEY (templateId, dependencyId),
        FOREIGN KEY (templateId) REFERENCES Templates(id),
        FOREIGN KEY (dependencyId) REFERENCES Templates(id)
      );
    `);

    // 创建模板代码表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS TemplateCode (
        templateId TEXT NOT NULL,
        version TEXT NOT NULL,
        code TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        PRIMARY KEY (templateId, version),
        FOREIGN KEY (templateId) REFERENCES Templates(id)
      );
    `);

    // 创建模板缩略图表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS TemplateThumbnails (
        templateId TEXT NOT NULL,
        version TEXT NOT NULL,
        thumbnailPath TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        PRIMARY KEY (templateId, version),
        FOREIGN KEY (templateId) REFERENCES Templates(id)
      );
    `);
  }

  // 模板操作
  public async getAllTemplates(): Promise<TemplateRecord[]> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.all<TemplateRecord[]>('SELECT * FROM Templates');
  }

  public async getTemplateById(id: string): Promise<TemplateRecord | undefined> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.get<TemplateRecord>('SELECT * FROM Templates WHERE id = ?', id);
  }

  public async createTemplate(template: Omit<TemplateRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    const now = Date.now();
    
    await this.db.run(
      `INSERT INTO Templates (id, name, description, generationMode, parameterSchema, defaultParameters, version, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      template.id,
      template.name,
      template.description,
      template.generationMode,
      template.parameterSchema,
      template.defaultParameters,
      template.version,
      now,
      now
    );
  }

  public async updateTemplate(template: Omit<TemplateRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    await this.db.run(
      `UPDATE Templates 
       SET name = ?, description = ?, generationMode = ?, parameterSchema = ?, defaultParameters = ?, version = ?, updatedAt = ?
       WHERE id = ?`,
      template.name,
      template.description,
      template.generationMode,
      template.parameterSchema,
      template.defaultParameters,
      template.version,
      Date.now(),
      template.id
    );
  }

  // 模板依赖操作
  public async getTemplateDependencies(templateId: string): Promise<TemplateDependencyRecord[]> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.all<TemplateDependencyRecord[]>(
      'SELECT * FROM TemplateDependencies WHERE templateId = ?',
      templateId
    );
  }

  public async addTemplateDependency(dependency: TemplateDependencyRecord): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    await this.db.run(
      `INSERT INTO TemplateDependencies (templateId, dependencyId, parameterMapping)
       VALUES (?, ?, ?)`,
      dependency.templateId,
      dependency.dependencyId,
      dependency.parameterMapping
    );
  }

  // 模板代码操作
  public async getTemplateCode(templateId: string, version: string): Promise<TemplateCodeRecord | undefined> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.get<TemplateCodeRecord>(
      'SELECT * FROM TemplateCode WHERE templateId = ? AND version = ?',
      templateId,
      version
    );
  }

  public async saveTemplateCode(code: Omit<TemplateCodeRecord, 'createdAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    await this.db.run(
      `INSERT OR REPLACE INTO TemplateCode (templateId, version, code, createdAt)
       VALUES (?, ?, ?, ?)`,
      code.templateId,
      code.version,
      code.code,
      Date.now()
    );
  }

  // 模板缩略图操作
  public async getTemplateThumbnail(templateId: string, version: string): Promise<TemplateThumbnailRecord | undefined> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.get<TemplateThumbnailRecord>(
      'SELECT * FROM TemplateThumbnails WHERE templateId = ? AND version = ?',
      templateId,
      version
    );
  }

  public async saveTemplateThumbnail(thumbnail: Omit<TemplateThumbnailRecord, 'createdAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    await this.db.run(
      `INSERT OR REPLACE INTO TemplateThumbnails (templateId, version, thumbnailPath, createdAt)
       VALUES (?, ?, ?, ?)`,
      thumbnail.templateId,
      thumbnail.version,
      thumbnail.thumbnailPath,
      Date.now()
    );
  }

  // 高级查询
  public async searchTemplates(query: string): Promise<TemplateRecord[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const searchTerm = `%${query}%`;
    
    return this.db.all<TemplateRecord[]>(
      `SELECT * FROM Templates 
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY name`,
      searchTerm,
      searchTerm
    );
  }

  public async getTemplatesByGenerationMode(mode: string): Promise<TemplateRecord[]> {
    if (!this.db) throw new Error('Database not connected');
    
    return this.db.all<TemplateRecord[]>(
      'SELECT * FROM Templates WHERE generationMode = ? ORDER BY name',
      mode
    );
  }

  public async getTemplatesWithDependencies(): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const templates = await this.getAllTemplates();
    
    const result = [];
    
    for (const template of templates) {
      const dependencies = await this.getTemplateDependencies(template.id);
      
      result.push({
        ...template,
        dependencies: dependencies.map(dep => dep.dependencyId),
        parameterMappings: dependencies.reduce((acc, dep) => {
          acc[dep.dependencyId] = JSON.parse(dep.parameterMapping || '{}');
          return acc;
        }, {} as Record<string, any>)
      });
    }
    
    return result;
  }
}

export const templateDatabase = TemplateDatabase.getInstance();
