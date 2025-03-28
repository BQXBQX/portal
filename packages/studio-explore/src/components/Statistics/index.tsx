import * as React from 'react';
import { Flex, Divider } from 'antd';
import Properties from './Properties';

interface IUploadProps {
  children?: React.ReactNode;
}
interface IFilterOptions {
  id: string;
  property: string;
  chartType: 'HISTOGRAM' | 'SELECT' | 'PIE' | 'WORDCLOUD' | 'NONE' | 'DATE' | 'COLUMN';
  chartData?: Map<string | number, number>;
}
const Statistics: React.FunctionComponent<IUploadProps> = props => {
  return (
    <Flex vertical>
      <Properties />
    </Flex>
  );
};

export default Statistics;
