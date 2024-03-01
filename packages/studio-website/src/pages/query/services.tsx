import { CypherDriver, CypherSchemaData } from '@graphscope/studio-query';
import type { IStudioQueryProps } from '@graphscope/studio-query';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { GraphApiFactory, GraphApi, GraphApiFp, ServiceApiFactory } from '@graphscope/studio-server';
import { transformSchema } from './utils/schema';
import { handleError, handleResponse } from '@/components/utils/handleServer';

const DB_QUERY_HISTORY = localforage.createInstance({
  name: 'DB_QUERY_HISTORY',
});
const DB_QUERY_SAVED = localforage.createInstance({
  name: 'DB_QUERY_SAVED',
});

/** 删除历史记录 */
export async function deleteHistoryStatements(ids: string[]) {
  ids.forEach(id => {
    DB_QUERY_HISTORY.removeItem(id);
  });
  return;
}

let driver: any;

export interface IStatement {
  id: string;
  script: string;
}

export const queryInfo = async () => {
  const result = await ServiceApiFactory(undefined, location.origin)
    .getServiceStatus()
    .then(res => handleResponse(res))
    .catch(error => handleError(error));
  console.log('res', result);

  if (result) {
    const { cypher } = result.sdk_endpoints!;
    if (cypher && !driver) {
      driver = new CypherDriver(cypher);
    }
  }

  return result;
};
export const queryGraphSchema = async (name: string): Promise<CypherSchemaData> => {
  const schema = await GraphApiFactory(undefined, location.origin)
    .getSchema(name)
    .then(res => handleResponse(res))
    .catch(error => handleError(error));

  if (schema) {
    const cypherSchema = transformSchema(schema);
    //@ts-ignore
    return cypherSchema;
  }
  return {
    nodes: [],
    edges: [],
  };
};

export const queryStatements: IStudioQueryProps['queryStatements'] = async type => {
  const result: IStatement[] = [];
  if (type === 'history') {
    await DB_QUERY_HISTORY.iterate((item: IStatement) => {
      if (item) {
        result.push(item);
      }
    });
  }
  if (type === 'saved') {
    await DB_QUERY_SAVED.iterate((item: IStatement) => {
      if (item) {
        result.push(item);
      }
    });
  }
  if (type === 'store-procedure') {
    return [];
  }
  return result;
};

export const deleteStatements: IStudioQueryProps['deleteStatements'] = async (type, ids) => {
  if (type === 'history') {
    ids.forEach(id => {
      DB_QUERY_HISTORY.removeItem(id);
    });
    return true;
  }
  if (type === 'saved') {
    ids.forEach(id => {
      DB_QUERY_SAVED.removeItem(id);
    });
    return true;
  }
  return false;
};

export const createStatements: IStudioQueryProps['createStatements'] = async (type, params) => {
  if (type === 'history') {
    const { id } = params;
    await DB_QUERY_HISTORY.setItem(id, params);
    return true;
  }
  if (type === 'saved') {
    const { id } = params;
    await DB_QUERY_SAVED.setItem(id, params);
    return true;
  }
  return false;
};

export const queryGraphData = async (params: IStatement) => {
  createStatements('history', params);
  return driver && driver.queryCypher(params.script);
};