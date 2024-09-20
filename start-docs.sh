set -eo pipefail

echo "starting Docs..."

# clone common docs to versioned_docs
cp -rf benchmark versioned_docs/version-3.0
cp -rf ecosystem versioned_docs/version-3.0
cp -rf faq versioned_docs/version-3.0
cp -rf releasenotes versioned_docs/version-3.0
cp -rf gettingStarted versioned_docs/version-3.0
cp -rf benchmark versioned_docs/version-2.1
cp -rf ecosystem versioned_docs/version-2.1
cp -rf faq versioned_docs/version-2.1
cp -rf releasenotes versioned_docs/version-2.1
cp -rf gettingStarted versioned_docs/version-2.1
cp -rf benchmark versioned_docs/version-2.0
cp -rf ecosystem versioned_docs/version-2.0
cp -rf faq versioned_docs/version-2.0
cp -rf releasenotes versioned_docs/version-2.0
cp -rf gettingStarted versioned_docs/version-2.0
cp -rf benchmark versioned_docs/version-1.2
cp -rf ecosystem versioned_docs/version-1.2
cp -rf faq versioned_docs/version-1.2
cp -rf releasenotes versioned_docs/version-1.2
cp -rf gettingStarted versioned_docs/version-1.2
cp -rf benchmark docs
cp -rf ecosystem docs
cp -rf faq docs
cp -rf releasenotes docs
cp -rf gettingStarted docs
cp -rf common_docs_zh/benchmark i18n/zh-CN/docusaurus-plugin-content-docs/current
cp -rf common_docs_zh/ecosystem i18n/zh-CN/docusaurus-plugin-content-docs/current
cp -rf common_docs_zh/faq i18n/zh-CN/docusaurus-plugin-content-docs/current
cp -rf common_docs_zh/releasenotes i18n/zh-CN/docusaurus-plugin-content-docs/current
cp -rf common_docs_zh/gettingStarted i18n/zh-CN/docusaurus-plugin-content-docs/current
cp -rf common_docs_zh/benchmark i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2
cp -rf common_docs_zh/ecosystem i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2
cp -rf common_docs_zh/faq i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2
cp -rf common_docs_zh/releasenotes i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2
cp -rf common_docs_zh/gettingStarted i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2
cp -rf common_docs_zh/benchmark i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0
cp -rf common_docs_zh/ecosystem i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0
cp -rf common_docs_zh/faq i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0
cp -rf common_docs_zh/releasenotes i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0
cp -rf common_docs_zh/gettingStarted i18n/zh-CN/docusaurus-plugin-content-docs/version-2.0
cp -rf common_docs_zh/benchmark i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1
cp -rf common_docs_zh/ecosystem i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1
cp -rf common_docs_zh/faq i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1
cp -rf common_docs_zh/releasenotes i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1
cp -rf common_docs_zh/gettingStarted i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1
cp -rf common_docs_zh/benchmark i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0
cp -rf common_docs_zh/ecosystem i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0
cp -rf common_docs_zh/faq i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0
cp -rf common_docs_zh/releasenotes i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0
cp -rf common_docs_zh/gettingStarted i18n/zh-CN/docusaurus-plugin-content-docs/version-3.0
if [ "$1" = "zh-CN" ]; then
  yarn start:zh-CN
else
  yarn start
fi


echo "***************************************"
echo "Docs started success"
echo "***************************************"