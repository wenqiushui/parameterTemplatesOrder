/**
 * 文件系统监视器服务
 *
 * 该服务负责监视模板文件夹中的文件变化，并在检测到变化时自动更新模板注册
 * 它只在服务器端运行，在浏览器环境中不执行任何操作
 */

import path from 'path';
import { scanTemplateFiles, registerAllTemplates } from '@/lib/templates/discovery';

// 文件变更事件处理器类型
type FileChangeHandler = (filePath: string) => Promise<void>;

// 文件监视器服务
class FileWatcherService {
  private watcher: any = null;
  private isWatching: boolean = false;
  private changeListeners: (() => void)[] = [];

  // 启动文件监视器
  async start(): Promise<void> {
    // 只在服务器端执行
    if (typeof window !== 'undefined') {
      console.log('File watcher not started: running in browser environment');
      return;
    }

    if (this.isWatching) {
      console.log('File watcher is already running');
      return;
    }

    try {
      // 动态导入 chokidar（只在服务器端）
      const chokidar = await import('chokidar');
      
      // 模板目录路径
      const templatesDir = path.join(process.cwd(), 'lib', 'templates');
      console.log(`Starting file watcher for directory: ${templatesDir}`);
      
      // 创建监视器
      this.watcher = chokidar.watch(`${templatesDir}/*Template.ts`, {
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true
      });
      
      // 监听文件变化
      this.watcher
        .on('add', this.handleFileChange.bind(this))
        .on('change', this.handleFileChange.bind(this))
        .on('unlink', this.handleFileRemove.bind(this));
      
      this.isWatching = true;
      console.log('File watcher started');
    } catch (error) {
      console.error('Error starting file watcher:', error);
    }
  }
  
  // 停止文件监视器
  stop(): void {
    if (!this.isWatching || !this.watcher) {
      return;
    }
    
    this.watcher.close();
    this.watcher = null;
    this.isWatching = false;
    console.log('File watcher stopped');
  }
  
  // 注册变更监听器
  registerChangeListener(listener: () => void): void {
    this.changeListeners.push(listener);
  }
  
  // 移除变更监听器
  removeChangeListener(listener: () => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index !== -1) {
      this.changeListeners.splice(index, 1);
    }
  }
  
  // 通知所有监听器
  private notifyListeners(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in file change listener:', error);
      }
    }
  }
  
  // 处理文件变化
  private async handleFileChange(filePath: string): Promise<void> {
    console.log(`Template file changed: ${filePath}`);
    
    // 扫描模板文件
    await scanTemplateFiles();
    
    // 重新注册所有模板
    await registerAllTemplates();
    
    // 通知监听器
    this.notifyListeners();
  }
  
  // 处理文件删除
  private async handleFileRemove(filePath: string): Promise<void> {
    console.log(`Template file removed: ${filePath}`);
    
    // 扫描模板文件
    await scanTemplateFiles();
    
    // 重新注册所有模板
    await registerAllTemplates();
    
    // 通知监听器
    this.notifyListeners();
  }
}

// 创建单例实例
export const fileWatcherService = new FileWatcherService();

// 在服务器端启动文件监视器
if (typeof window === 'undefined') {
  fileWatcherService.start().catch(error => {
    console.error('Failed to start file watcher:', error);
  });
}
