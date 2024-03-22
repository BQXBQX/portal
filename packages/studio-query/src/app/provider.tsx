import { ConfigProvider, theme as AntdTheme } from 'antd';
import { IntlProvider } from 'react-intl';
import React from 'react';
import locales from '../locales';

export default function Provider(props) {
  const { locale, theme, children } = props;
  const { primaryColor, mode, inputNumber = '6px' } = theme;
  //@ts-ignore
  const messages = locales[locale];
  const isLightMode = mode === 'defaultAlgorithm';
  return (
    <IntlProvider messages={messages} locale={locale}>
      <ConfigProvider
        theme={{
          // 1. 单独使用暗色算法
          algorithm: isLightMode ? AntdTheme.defaultAlgorithm : AntdTheme.darkAlgorithm,
          components: {
            Table: {
              headerBg: isLightMode ? '#fff' : '#161616',
              headerColor: isLightMode ? 'rgba(0, 0, 0, 0.45)' : '#DBDBDB',
              headerSplitColor: isLightMode ? '#fff' : '#161616',
            },
          },
          token: {
            colorPrimary: primaryColor,
            /** custom */
            colorBgLayout: isLightMode ? '#f5f7f9' : '#161616',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </IntlProvider>
  );
}