---
{
"title": "EXTRACT_URL_PARAMETER",
"language": "zh-CN"
}
---

## extract_url_parameter
## 描述
## 语法

`VARCHAR  extract_url_parameter(VARCHAR url, VARCHAR  name)`


返回 URL 中“name”参数的值（如果存在）。否则为空字符串。
如果有许多具有此名称的参数，则返回第一个出现的参数。
此函数的工作假设参数名称在 URL 中的编码方式与在传递参数中的编码方式完全相同。

```
mysql> SELECT extract_url_parameter ("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2");
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```

如果想获取 URL 中的其他部分，可以使用[parse_url](../string-functions/parse-url)。

### keywords
    EXTRACT URL PARAMETER
