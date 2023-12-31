import type { HtmlRenderType } from '../types';

export function htmlRender(params?: HtmlRenderType): string {
  const { style, script, editor } = params ?? {};
  return `
<html>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no'>
${style ?? ''}
</head>
<body>
  ${editor ?? ''}
  ${script ?? ''}
  <script src='https://unpkg.com/blockly/blockly.min.js' defer></script>
</body>
</html>
`;
}
