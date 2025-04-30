'use client';

import React from 'react';
import { Button, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

/**
 * 清除缓存按钮组件
 */
const ClearCacheButton: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  const handleClearCache = async () => {
    try {
      setLoading(true);
      
      // 清除 IndexedDB 缓存
      const clearIndexedDB = async () => {
        try {
          const databases = await window.indexedDB.databases();
          for (const db of databases) {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
              console.log(`Deleted IndexedDB database: ${db.name}`);
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
      const results = await Promise.all([
        clearIndexedDB(),
        clearLocalStorage(),
        clearSessionStorage()
      ]);

      const allSuccess = results.every(result => result);
      
      if (allSuccess) {
        message.success('缓存已成功清除，页面将在 3 秒后刷新');
        // 3 秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        message.warning('部分缓存清除失败，请查看控制台获取详细信息');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      message.error('清除缓存时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      type="primary" 
      danger 
      icon={<ClearOutlined />} 
      onClick={handleClearCache}
      loading={loading}
    >
      清除缓存
    </Button>
  );
};

export default ClearCacheButton;
