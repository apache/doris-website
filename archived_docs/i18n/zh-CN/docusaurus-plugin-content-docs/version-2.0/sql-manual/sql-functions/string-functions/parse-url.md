---
{
    "title": "PARSE_URL",
    "language": "zh-CN"
}
---

## parse_url
## 描述
## 语法

`VARCHAR  parse_url(VARCHAR url, VARCHAR  name)`


在 url 解析出 name 对应的字段，name 可选项为：'PROTOCOL', 'HOST', 'PATH', 'REF', 'AUTHORITY', 'FILE', 'USERINFO', 'PORT', 'QUERY'，将结果返回。

```
mysql> SELECT parse_url ('https://doris.apache.org/', 'HOST');
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

如果想获取 QUERY 中的特定参数，可使用[extract_url_parameter](../string-functions/extract-url-parameter)。

### keywords
    PARSE URL
