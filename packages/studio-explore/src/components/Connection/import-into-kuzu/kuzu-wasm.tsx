import { Utils } from '@graphscope/studio-components';
import { getDriver as getKuzuDriver, KuzuDriver } from '@graphscope/studio-driver';
import React from 'react';
import { Typography, Tag, Flex } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
const { storage } = Utils;

const getDriver = async () => {
  const language = storage.get<'cypher' | 'gremlin'>('query_language') || 'cypher';
  const endpoint = storage.get<string>('query_endpoint') || '';
  const username = storage.get<string>('query_username');
  const password = storage.get<string>('query_password');
  return getKuzuDriver({
    language,
    endpoint,
    username,
    password,
  }) as Promise<KuzuDriver>;
};
const __TEMP = {};
export const setFiles = (dataset_id: string, params) => {
  __TEMP[dataset_id] = params;
};
const getFiles = (dataset_id: string) => {
  return __TEMP[dataset_id];
};

export const useKuzuGraph = async (dataset_id: string) => {
  const driver = await getDriver();
  const exist = await driver.existDataset(dataset_id);
  if (exist) {
    return {
      success: true,
      message: 'Successfully connect to the existing IndexedDB',
    };
  }
  // 新的实例，需要清除默认的样式
  localStorage.removeItem('GRAPH__STYLE');
  const res = await createKuzuGraph(dataset_id);
  return res;
};

export const createKuzuGraph = async (dataset_id: string) => {
  const driver = await getDriver();
  //@ts-ignore
  const { files, schema } = await getFiles(dataset_id);
  await driver.use(dataset_id);
  await driver.createSchema(schema);
  const logs = await driver.loadGraph(files);
  const error = [...logs.nodes, ...logs.edges].some(item => item.success === false);

  if (error) {
    return {
      success: false,
      message: (
        <Flex vertical gap={16}>
          <Typography.Title level={3} style={{ margin: '0px' }}>
            Load Failed
          </Typography.Title>

          {[...logs.nodes, ...logs.edges].map(item => {
            const type = item.success ? 'success' : 'error';
            const icon = item.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />;
            return (
              <Typography.Text type="secondary" key={item.name} italic>
                <Tag color={type} icon={icon}>
                  {item.name}
                </Tag>
                {item.message}
              </Typography.Text>
            );
          })}
        </Flex>
      ),
    };
  }
  // return await driver.writeBack();
  await driver.writeBack();
  return await driver.close();
};
