import { default as Kuzu } from '@kuzu/kuzu-wasm';
import { Utils } from '@graphscope/studio-components';

interface IKuzuResult {
  Database: (params: any) => Promise<any>;
  Connection: (db: any) => Promise<any>;
  FS: Promise<any>;
  execute: (query: string) => Promise<any>;
}

interface IKuzuDatabase {
  close: () => Promise<void>;
}

interface IKuzuConnection {
  execute: (query: string) => Promise<any>;
  close: () => Promise<void>;
}

export class KuzuDriver {
  private kuzu: typeof Kuzu;
  private db: IKuzuDatabase | null;
  private conn: IKuzuConnection | null;
  private FS: any;
  schema: { nodes: never[]; edges: never[] };

  constructor() {
    this.kuzu = Kuzu;
    this.db = null;
    this.conn = null;
    this.FS = null;
    this.schema = { nodes: [], edges: [] };
  }

  async initialize(): Promise<void> {
    const result: IKuzuResult = await this.kuzu();
    //@ts-ignore
    this.db = await result.Database('test', 0, 10, false, false, 4194304 * 16 * 4);
    this.conn = await result.Connection(this.db);
    this.FS = result.FS;

    this.FS?.mkdir('data');
  }

  async executeQuery(queries) {
    let result_list: string[] = [];
    if (queries instanceof Array) {
      for (const query of queries) {
        let partial_result = await this.executeSingleQuery(query);
        result_list = result_list.concat(partial_result);
      }
    } else {
      let partial_result = await this.executeSingleQuery(queries);
      result_list = result_list.concat(partial_result);
    }

    return result_list;
  }

  async executeSingleQuery(query) {
    let result_list: string[] = [];
    try {
      let query_list = query.split(';');

      query_list.forEach(query => {
        query = query.trim();
        if (query != '') {
          if (query.startsWith('#') || query.startsWith('//')) return;
          console.log('execute: ', query);
          const query_result = this.conn?.execute(query);
          if (typeof query_result === 'undefined') {
            result_list.push('');
          } else {
            result_list.push(query_result.toString());
          }
        }
      });
    } catch (error) {
      console.log('execute error');
    }

    return result_list;
  }

  typeConvert(input_type: string) {
    const input_type_upper = input_type.toUpperCase();
    switch (input_type_upper) {
      case 'DT_STRING':
        return 'STRING';
      case 'DT_DOUBLE':
        return 'DOUBLE';
      case 'DT_SIGNED_INT32':
        return 'INT32';
      case 'DT_SIGNED_INT64':
        return 'INT64';
      default:
        return 'STRING';
    }
  }

  async createSchema(schema: { nodes: any[]; edges: any[] }): Promise<void> {
    const { nodes, edges } = schema;
    //@ts-ignore
    window.KUZU_SCHEMA = schema;
    //@ts-ignore
    this.schema = schema;

    const node_scripts = nodes.map(node => {
      const { label, properties } = node;
      let property_scripts = properties.map(property => {
        const { name, type, primaryKey } = property;
        return `${name} ${this.typeConvert(type)}`;
      });
      const primary_keys = properties
        .map(property => {
          const { name, type, primaryKey } = property;
          if (primaryKey) {
            return `PRIMARY KEY (${name})`;
          }
          return null;
        })
        .filter(key => key !== null);
      const final_property_scripts = property_scripts.concat(primary_keys);
      return `CREATE NODE TABLE ${label} (${final_property_scripts.join(', ')});`;
    });
    const edge_scripts = edges.map(edge => {
      const { label, source, target, properties } = edge;
      const property_scripts = properties.map(property => {
        const { name, type } = property;
        return `${name} ${this.typeConvert(type)}`;
      });
      if (property_scripts.length === 0) {
        return `CREATE REL TABLE ${label} (FROM ${source} TO ${target});`;
      }
      return `CREATE REL TABLE ${label} (FROM ${source} TO ${target} , ${property_scripts.join(', ')});`;
    });

    /** execute */
    let result: any[] = [];

    for (let i = 0; i < node_scripts.length; i++) {
      console.log('create nodes script: ', node_scripts[i]);
      const res = await this.conn?.execute(node_scripts[i]);
      result.push(res.toString());
    }
    for (let i = 0; i < edge_scripts.length; i++) {
      console.log('create edges script: ', edge_scripts[i]);
      const res = await this.conn?.execute(edge_scripts[i]);
      result.push(res.toString());
    }

    console.log('Schema created: ', result);
  }
  async uploadCsvFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      if (file) {
          const reader = new FileReader();
          reader.onload = async e => {
              try {
                  //@ts-ignore
                  var fileData = new Uint8Array(e.target.result);
                  var fileName = file.name;
                  var filePath = 'data/' + fileName;
                  var label_name = file.name.split('.')[0];
                  await this.FS.writeFile(filePath, fileData);
                  var res;
                  res = await this.conn?.execute(
                      `COPY ${label_name} FROM "${filePath}" (HEADER=true, DELIM="|", ESCAPE='"', QUOTE='"');`,
                  );
                  console.log('File uploaded successfully!', filePath)
                  resolve(res);  // Resolve the Promise
              } catch (error) {
                  reject(error);  // Reject the Promise on error
              }
          };

          reader.onerror = (error) => {
              reject(error); // Handle error case
          };

          reader.readAsArrayBuffer(file);
      } else {
          reject(new Error('No file provided'));
      }
    });
  }
  async loadGraph(data_files: File[]): Promise<any> {
    console.log(this.schema)
    for (const node of this.schema.nodes) {
      const file = data_files.find(item => {
        //@ts-ignore
        return item.name === node.label + '.csv';
      });
      if (file) {
        console.log('node: ', file.name);
        await this.uploadCsvFile(file).then(res => {
          console.log('Response received:', res.toString());
        });
      }
    }
    for (const edge of this.schema.edges) {
      const file = data_files.find(item => {
        //@ts-ignore
        return item.name === edge.label + '.csv';
      });
      if (file) {
        console.log('edge: ', file.name);
        await this.uploadCsvFile(file).then(res => {
          console.log('Response received:', res.toString());
        });
      }
    }
    return true;
  }

  async insertData(query: string): Promise<void> {
    console.log('Inserting data...');
    const insertResult = await this.executeQuery(query);
    console.log('Data inserted: ', insertResult);
  }

  async queryData(query: string): Promise<any> {
    console.time('Query cost');
    // const queryResult = await this.executeQuery(query);
    const queryResult = await this.conn?.execute(query);
    console.timeEnd('Query cost');
    try {
      const data = JSON.parse(queryResult.table.toString());
      console.log('data', data);
      const nodes: any[] = [];
      const edges: any[] = [];

      data.map(record => {
        Object.values(record).map(item => {
          //@ts-ignore
          const { _ID, _SRC, _DST, _LABEL, ...others } = item;
          const isEdge = _SRC && _DST;
          const { offset, table } = _ID;
          const id = `${table}_${offset}`;

          if (isEdge) {
            const source = `${_SRC.table}_${_SRC.offset}`;
            const target = `${_DST.table}_${_DST.offset}`;
            edges.push({
              id,
              label: _LABEL,
              source,
              target,
              properties: {
                ...others,
              },
            });
          } else {
            nodes.push({
              id,
              label: _LABEL,
              properties: {
                ...others,
              },
            });
          }
        });
      });
      const _nodes = Utils.uniqueElementsBy(nodes, (a, b) => {
        return a.id === b.id;
      });
      const _edges = Utils.uniqueElementsBy(edges, (a, b) => {
        return a.id === b.id;
      });
      return { nodes: _nodes, edges: _edges };
    } catch (error) {
      return {
        nodes: [],
        edges: [],
      };
    }
  }

  async close(): Promise<void> {
    if (this.conn) {
      await this.conn.close();
      console.log('Connection closed.');
    }
    if (this.db) {
      await this.db.close();
      console.log('Database closed.');
    }
  }
}