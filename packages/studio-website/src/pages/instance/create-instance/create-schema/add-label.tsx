import * as React from 'react';
import { Button, Segmented } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';
import { useContext } from '../useContext';
import Schema from './schema';
const AddLabel = () => {
  const { store, updateStore } = useContext();
  const { nodeList, edgeList, currentType, nodeItems, edgeItems, detail } = store;
  const nodeEdgeChange = (val: string): void => {
    updateStore(draft => {
      draft.currentType = val == 'Nodes' ? 'node' : 'edge';
    });
    if (currentType == 'edge') {
      updateStore(draft => {
        draft.edgeActiveKey = edgeList[0]?.key;
      });
    }
  };
  const add = () => {
    if (currentType == 'node') {
      const newActiveKey = uuidv4();
      const node = [
        ...nodeList,
        {
          label: 'undefine',
          children: <Schema newActiveKey={newActiveKey} deleteNode={deleteNode} />,
          key: newActiveKey,
        },
      ];
      updateStore(draft => {
        draft.nodeActiveKey = newActiveKey;
        draft.nodeList = node;
      });
    } else {
      const newActiveKey = uuidv4();
      const node = [
        ...edgeList,
        {
          label: 'undefine',
          children: <Schema newActiveKey={newActiveKey} deleteNode={deleteNode} />,
          key: newActiveKey,
        },
      ];
      updateStore(draft => {
        draft.edgeActiveKey = newActiveKey;
        draft.edgeList = node;
      });
    }
  };
  const deleteNode = (val: string, key: string) => {
    let data = val == 'Node' ? cloneDeep(nodeList) : cloneDeep(edgeList);
    const newPanes = data.filter(pane => pane.key !== key);
    if (val == 'Node') {
      const nodedata: { [x: string]: any } = cloneDeep(nodeItems);
      Object.entries(nodedata).map((keys, i) => {
        if (keys[0] == key) {
          delete nodedata[key];
        }
      });
      const activeKey = Object.keys(nodedata)[Object.keys(nodedata).length - 1];
      updateStore(draft => {
        draft.nodeList = newPanes;
        draft.nodeItems = nodedata;
        draft.nodeActiveKey = activeKey;
      });
    } else {
      const edgedata: { [x: string]: any } = cloneDeep(edgeItems);
      Object.entries(edgedata).map((keys, i) => {
        if (keys[0] == key) {
          delete edgedata[key];
        }
      });
      const activeKey = Object.keys(edgedata)[Object.keys(edgedata).length - 1];
      updateStore(draft => {
        draft.edgeList = newPanes;
        draft.edgeItems = edgedata;
        draft.edgeActiveKey = activeKey;
      });
    }
  };
  const nodeEddgeLength = () => {
    if (currentType == 'node') {
      return nodeList.length;
    } else {
      return edgeList.length;
    }
  };
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Segmented defaultValue="Nodes" options={['Nodes', 'Edges']} style={{ marginBottom: '16px' }} onChange={e => nodeEdgeChange(e)} />
        {nodeEddgeLength() > 0 ? (
          <Button type="dashed" onClick={add} disabled={detail}>
            + Add {currentType == 'node' ? 'Node' : 'Edge'}
          </Button>
        ) : null}
      </div>
      {nodeEddgeLength() == 0 ? (
        <Button disabled={detail} style={{ width: '100%', color: '#1650ff' }} type="dashed" onClick={add}>
          + Add {currentType == 'node' ? 'Node' : 'Edge'}
        </Button>
      ) : null}
    </>
  );
};
export default AddLabel;