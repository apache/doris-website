---
{
    "title": "PARSE_URL",
    "language": "zh-CN",
    "description": "PARSEURL 函数主要用于解析 URL 字符串，并从中提取各种组成部分，如协议、主机、路径、查询参数等。"
}
---

## 描述

PARSE_URL 函数主要用于解析 URL 字符串，并从中提取各种组成部分，如协议、主机、路径、查询参数等。

## 语法

```sql
PARSE_URL( <url>, <name> )
```

## 参数

| 参数       | 说明                                                                                               |
|----------|--------------------------------------------------------------------------------------------------|
| `<url>`  | 需要被解析的 URL                                                                                       |
| `<name>` | 需要提取的部分，可选的值有`PROTOCOL`，`HOST`，`PATH`，`REF`，`AUTHORITY`，`FILE`，`USERINFO`，`PORT`，`QUERY`（不区分大小写） |

## 返回值

返回`<url>`指定的部分。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- `<name>`传入其他非法值，则会报错

## 举例

```sql
SELECT parse_url ('https://doris.apache.org/', 'HOST');
```

```text
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

```sql
SELECT parse_url ('https://doris.apache.org/', null);
```

```text
+----------------------------------------------+
| parse_url('https://doris.apache.org/', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

## 相关命令

如果想获取 QUERY 中的特定参数，可使用[extract_url_parameter](./extract-url-parameter.md)。
