import type { ISchema, StyleConfig } from './typing';
import { useThemeContainer } from '@graphscope/studio-components';
import { Utils } from '@graphscope/studio-components';
import {
  colors,
  sizes,
  widths,
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_EDGE_WIDTH,
  DEFAULT_NODE_SISE,
} from '../../graph/const';
const { storage } = Utils;
export function getStyleConfig(schema: ISchema, graphId: string) {
  const localStyle = storage.get<{ nodeStyle: StyleConfig; edgeStyle: StyleConfig }>(`GRAPH_${graphId}_STYLE`);
  if (localStyle) {
    return localStyle;
  }
  const defaultStyle = {
    nodeStyle: {},
    edgeStyle: {},
  };

  schema.nodes.forEach((item, index) => {
    const { label } = item;
    defaultStyle.nodeStyle[label] = {
      label: item.label,
      size: DEFAULT_NODE_SISE,
      color: colors[index],
      caption: Object.keys(item.properties || {})[0] || '',
      captionStatus: 'hidden',
    };
  });
  schema.edges.forEach((item, index) => {
    const { label } = item;
    defaultStyle.edgeStyle[label] = {
      label: item.label,
      size: DEFAULT_EDGE_WIDTH,
      color: DEFAULT_EDGE_COLOR,
      caption: Object.keys(item.properties || {})[0] || '',
      captionStatus: 'hidden',
    };
  });

  return defaultStyle;
}

export function getDataMap(data) {
  const dataMap = {};
  data.nodes.forEach(node => {
    const { id } = node;
    dataMap[id] = {
      ...node,
      neighbors: [],
      links: [],
    };
  });
  data.edges.forEach(edge => {
    const { source, target, id } = edge;
    dataMap[id] = edge;
    const sourceNode = dataMap[source];
    const targetNode = dataMap[target];
    sourceNode.neighbors.push(target);
    targetNode.neighbors.push(source);
    sourceNode.links.push(id);
    targetNode.links.push(id);
  });
  return dataMap;
}