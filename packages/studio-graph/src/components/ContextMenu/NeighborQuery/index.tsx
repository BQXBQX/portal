import React, { useRef } from 'react';
import { Typography, Button, Menu } from 'antd';
import { useContext } from '../../../hooks/useContext';
import { Utils } from '@graphscope/studio-components';
import { getDataMap } from '../../Prepare/utils';
import { handleExpand, applyStatus } from './utils';
import type { ForceGraphInstance } from 'force-graph';
interface INeighborQueryProps {
  onQuery: (params: any) => Promise<any>;
}

const getScript = (ids, dataMap) => {};

const CommonNeighbor: React.FunctionComponent<INeighborQueryProps> = props => {
  const { onQuery } = props;
  const { store, updateStore } = useContext();
  const { nodeStatus, schema, dataMap, emitter, graph } = store;
  const MenuRef = useRef<HTMLDivElement>(null);

  const selectId =
    Object.keys(nodeStatus).filter(key => {
      return nodeStatus[key].selected;
    })[0] || '';

  const selectNode = dataMap[selectId] || {};

  const relatedEdges = schema.edges.filter(item => {
    return item.source === selectNode.label;
  });
  const itemChildren = relatedEdges.map(item => {
    const { source, target, label } = item;
    if (source === target) {
      return {
        key: `(a:${source})-[b:${label}]-(c:${target})`,
        label: `[${label}]-(${target})`,
      };
    }
    return {
      key: `(a:${source})-[b:${label}]->(c:${target})`,
      label: `[${label}]->(${target})`,
    };
  });

  const extraItems =
    relatedEdges.length > 1
      ? [
          {
            key: `(a)-[b]-(c)`,
            label: `All Neighbors`,
          },
        ]
      : [];
  const items = [
    {
      key: 'NeighborQuery',
      // icon: <ShareAltOutlined />,
      label: 'NeighborQuery',
      children: [...extraItems, ...itemChildren],
    },
  ];

  const onClick = async ({ key }) => {
    emitter?.emit('canvas:click');
    updateStore(draft => {
      draft.isLoading = true;
    });
    const { name, title } = selectNode.properties;
    let script = '';
    if (name) {
      script = `
      MATCH ${key}
        WHERE a.name = "${name}"
        RETURN a, b, c
      `;
    }
    if (title) {
      script = `
      MATCH ${key}
        WHERE a.title = "${title}"
        RETURN a, b, c
      `;
    }

    const res = await onQuery({
      script,
      language: 'cypher',
    });

    if (res.nodes.length > 0 && graph) {
      const { nodeStatus, edgeStatus } = applyStatus(res, item => {
        return { selected: true };
      });
      const newData = handleExpand(graph, res, selectId);
      updateStore(draft => {
        draft.data = newData;
        draft.dataMap = getDataMap(newData);
        draft.nodeStatus = nodeStatus;
        draft.edgeStatus = edgeStatus;
        draft.isLoading = false;
      });
    }
  };
  if (itemChildren.length === 0) {
    return null;
  }
  return (
    <div ref={MenuRef}>
      <Menu
        getPopupContainer={node => {
          if (MenuRef.current) {
            return MenuRef.current;
          }
          return node;
        }}
        onClick={onClick}
        style={{ margin: '0px', padding: '0px', width: '103%' }}
        mode="vertical"
        items={items}
      />
    </div>
  );
};

export default CommonNeighbor;