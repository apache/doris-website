---
{
    "title": "URL 函数概述",
    "language": "zh-CN",
    "description": "查找用于提取 URL 组成部分、处理域名以及进行 URL 编解码的函数。"
}
---

# URL 函数概述

URL 函数用于提取域名、协议、查询参数等组成部分，或对 URL 字符串进行编码和解码。各函数的语法、输入要求和示例见下表中的参考页面。

| 函数 | 用途 |
| --- | --- |
| [DOMAIN](../string-functions/domain.md) | 提取 URL 中的域名。 |
| [DOMAIN_WITHOUT_WWW](../string-functions/domain-without-www.md) | 提取域名并去掉开头的 `www.`。 |
| [TOP_LEVEL_DOMAIN](../string-functions/top-level-domain.md) | 提取顶级域名。 |
| [FIRST_SIGNIFICANT_SUBDOMAIN](../string-functions/first-significant-subdomain.md) | 提取第一个有效子域名。 |
| [CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN](../string-functions/cut-to-first-significant-subdomain.md) | 保留从顶级域名到第一个有效子域名的部分。 |
| [PROTOCOL](../string-functions/protocol.md) | 提取 URL 的协议部分。 |
| [PARSE_URL](../string-functions/parse-url.md) | 提取指定的 URL 组成部分。 |
| [EXTRACT_URL_PARAMETER](../string-functions/extract-url-parameter.md) | 提取指定名称的 URL 查询参数。 |
| [URL_ENCODE](../string-functions/url-encode.md) | 对字符串进行 URL 编码。 |
| [URL_DECODE](../string-functions/url-decode.md) | 对经过 URL 编码的字符串进行解码。 |
