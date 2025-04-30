import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button, Card, Table, Spin, Divider } from 'antd';
import ConfigViewer from '@/components/product/ConfigViewer';

// 获取配置比较数据
async function getComparisonData(configIds) {
  try {
    // 获取配置详情
    const configs = await Promise.all(
      configIds.map(async (id) => {
        const config = await db.modelConfig.findUnique({
          where: { id },
          include: {
            model: true
          }
        });
        
        if (!config) return null;
        
        return {
          id: config.id,
          name: config.name,
          modelId: config.modelId,
          modelName: config.model.name,
          materialOverrides: JSON.parse(config.materialOverrides),
          createdAt: config.createdAt
        };
      })
    );
    
    // 过滤掉不存在的配置
    const validConfigs = configs.filter(Boolean);
    
    if (validConfigs.length === 0) {
      return null;
    }
    
    // 确保所有配置都是同一个模型
    const modelId = validConfigs[0].modelId;
    if (!validConfigs.every(config => config.modelId === modelId)) {
      throw new Error('Cannot compare configurations from different models');
    }
    
    // 获取模型详情
    const model = await db.model.findUnique({
      where: { id: modelId },
      include: {
        template: true
      }
    });
    
    // 构建比较数据
    return {
      model: {
        id: model.id,
        name: model.name,
        templateId: model.templateId,
        templateName: model.template.name,
        params: JSON.parse(model.params)
      },
      configs: validConfigs
    };
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    return null;
  }
}

export default async function ComparePage({ params }) {
  // 解析配置 ID
  const configIds = params.ids;
  
  // 获取比较数据
  const comparisonData = await getComparisonData(configIds);
  
  if (!comparisonData) {
    notFound();
  }
  
  // 构建比较表格的列
  const columns = [
    {
      title: '属性',
      dataIndex: 'property',
      key: 'property',
      width: 200
    },
    ...comparisonData.configs.map(config => ({
      title: config.name,
      dataIndex: config.id,
      key: config.id
    }))
  ];
  
  // 构建比较表格的数据
  const dataSource = [];
  
  // 添加基本信息
  dataSource.push({
    key: 'name',
    property: '配置名称',
    ...Object.fromEntries(comparisonData.configs.map(config => [config.id, config.name]))
  });
  
  dataSource.push({
    key: 'createdAt',
    property: '创建时间',
    ...Object.fromEntries(comparisonData.configs.map(config => [
      config.id, 
      new Date(config.createdAt).toLocaleString()
    ]))
  });
  
  // 添加材质覆盖信息
  const allMaterialKeys = new Set();
  comparisonData.configs.forEach(config => {
    Object.keys(config.materialOverrides).forEach(key => {
      allMaterialKeys.add(key);
    });
  });
  
  allMaterialKeys.forEach(key => {
    dataSource.push({
      key: `material_${key}`,
      property: `材质: ${key}`,
      ...Object.fromEntries(comparisonData.configs.map(config => [
        config.id, 
        config.materialOverrides[key] || '默认'
      ]))
    });
  });
  
  return (
    <div className="compare-page" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>配置比较</h1>
        <Link href={`/product/${comparisonData.model.id}`}>
          <Button>返回产品</Button>
        </Link>
      </div>
      
      <Card title={`产品: ${comparisonData.model.name}`} style={{ marginBottom: '20px' }}>
        <p><strong>模板:</strong> {comparisonData.model.templateName}</p>
      </Card>
      
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载比较数据中..." /></div>}>
        <div className="viewers-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${comparisonData.configs.length}, 1fr)`,
          gap: '20px',
          marginBottom: '30px'
        }}>
          {comparisonData.configs.map(config => (
            <div key={config.id} style={{ textAlign: 'center' }}>
              <h3>{config.name}</h3>
              <ConfigViewer configId={config.id} width={300} height={300} />
            </div>
          ))}
        </div>
        
        <Divider>详细比较</Divider>
        
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          pagination={false}
          bordered
          rowClassName={(record, index) => {
            // 检查该行是否有差异
            const values = comparisonData.configs.map(config => record[config.id]);
            const hasDifference = new Set(values).size > 1;
            return hasDifference ? 'highlight-row' : '';
          }}
        />
      </Suspense>
    </div>
  );
}
