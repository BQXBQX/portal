import { IApi } from 'umi';

export default (api: IApi) => {
  api.modifyHTML($ => {
    $('head').append([
      `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      `,
    ]);
    return $;
  });
};