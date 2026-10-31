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


在url解析出name对应的字段，name可选项为：'PROTOCOL', 'HOST', 'PATH', 'REF', 'AUTHORITY', 'FILE', 'USERINFO', 'PORT', 'QUERY'，将结果返回。

```
mysql> SELECT parse_url ('https://doris.apache.org/', 'HOST');
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

如果想获取 QUERY 中的特定参数，可使用[extract_url_parameter](./extract-url-parameter.md)。

### keywords
    PARSE URL
