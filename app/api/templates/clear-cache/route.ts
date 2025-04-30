/**
 * 清除模板缓存 API 端点
 */

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 返回一个清除缓存的脚本
    const clearCacheScript = `
      // 清除 IndexedDB 缓存
      const clearIndexedDB = async () => {
        try {
          const databases = await window.indexedDB.databases();
          for (const db of databases) {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
              console.log(\`Deleted IndexedDB database: \${db.name}\`);
            }
          }
          return true;
        } catch (error) {
          console.error('Error clearing IndexedDB:', error);
          return false;
        }
      };

      // 清除 localStorage 缓存
      const clearLocalStorage = () => {
        try {
          window.localStorage.clear();
          console.log('Cleared localStorage');
          return true;
        } catch (error) {
          console.error('Error clearing localStorage:', error);
          return false;
        }
      };

      // 清除 sessionStorage 缓存
      const clearSessionStorage = () => {
        try {
          window.sessionStorage.clear();
          console.log('Cleared sessionStorage');
          return true;
        } catch (error) {
          console.error('Error clearing sessionStorage:', error);
          return false;
        }
      };

      // 执行清除操作
      Promise.all([
        clearIndexedDB(),
        clearLocalStorage(),
        clearSessionStorage()
      ]).then(results => {
        const allSuccess = results.every(result => result);
        if (allSuccess) {
          alert('缓存已成功清除，请刷新页面');
        } else {
          alert('部分缓存清除失败，请查看控制台获取详细信息');
        }
      });
    `;

    return new NextResponse(clearCacheScript, {
      headers: {
        'Content-Type': 'application/javascript'
      }
    });
  } catch (error: any) {
    console.error('Error in clear-cache API:', error);
    return NextResponse.json(
      { error: 'Failed to generate clear cache script', message: error.message },
      { status: 500 }
    );
  }
}
