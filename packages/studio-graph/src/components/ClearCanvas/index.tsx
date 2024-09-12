import * as React from 'react';
import { Tooltip, Button } from 'antd';
import { FileTextOutlined, ClearOutlined } from '@ant-design/icons';
import { useContext } from '../../hooks/useContext';
import { Utils } from '@graphscope/studio-components';
interface IReportProps {}

const ClearCanvas: React.FunctionComponent<IReportProps> = props => {
  const { updateStore } = useContext();

  const handleClick = () => {
    updateStore(draft => {
      draft.data = { nodes: [], edges: [] };
      draft.source = { nodes: [], edges: [] };
    });
  };
  return (
    <Tooltip title="Clear Canvas" placement="left">
      <Button onClick={handleClick} icon={<ClearOutlined />} type="text"></Button>
    </Tooltip>
  );
};

export default ClearCanvas;