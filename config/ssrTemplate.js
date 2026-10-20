const { getAssetOrigin } = require('./asset-origin');
const assetOrigin = JSON.stringify(getAssetOrigin());
const assetBase = require('../scripts/publish/shared-assets.cjs').enabled() ? '/' : null;
const assetBaseExpression = assetBase ? JSON.stringify(assetBase) : 'it.baseUrl';

module.exports = {
    ssrTemplate: `<!DOCTYPE html>
<html <%~ it.htmlAttributes %>>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="generator" content="Docusaurus v<%= it.version %>">
    <% if (it.noIndex) { %>
      <meta name="robots" content="noindex, nofollow" />
    <% } %>
    <%~ it.headTags %>
    <% it.metaAttributes.forEach((metaAttribute) => { %>
      <%~ metaAttribute %>
    <% }); %>
    <% it.stylesheets.forEach((stylesheet) => { %>
      <link rel="stylesheet" href="<%= ${assetOrigin} %><%= ${assetBaseExpression} %><%= stylesheet %>" />
    <% }); %>
    <% it.scripts.forEach((script) => { %>
      <link rel="preload" href="<%= ${assetOrigin} %><%= ${assetBaseExpression} %><%= script %>" as="script">
    <% }); %>
  </head>
  <body <%~ it.bodyAttributes %>>
    <%~ it.preBodyTags %>
    <div id="__docusaurus"><%~ it.appHtml %></div>
    <% it.scripts.forEach((script) => { %>
      <script src="<%= ${assetOrigin} %><%= ${assetBaseExpression} %><%= script %>"></script>
    <% }); %>
    <%~ it.postBodyTags %>
  </body>
</html>`,
};
