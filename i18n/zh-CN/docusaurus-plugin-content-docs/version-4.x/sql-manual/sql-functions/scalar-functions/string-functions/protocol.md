---
{
    "title": "PROTOCOL",
    "language": "zh-CN",
    "description": "PROTOCOL 函数主要用于提取 URL 字符串中的协议部分。"
}
---

## 描述

PROTOCOL 函数主要用于提取 URL 字符串中的协议部分。

## 语法

```sql
PROTOCOL( <url> )
```

## 参数

| 参数      | 说明         |
|---------|------------|
| `<url>` | 需要被解析的 URL |

## 返回值

返回`<url>`中的协议部分。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT protocol('https://doris.apache.org/');
```

```text
+---------------------------------------+
| protocol('https://doris.apache.org/') |
+---------------------------------------+
| https                                 |
+---------------------------------------+
```

```sql
SELECT protocol(null);
```

```text
+----------------+
| protocol(NULL) |
+----------------+
| NULL           |
+----------------+
```

## 相关命令

如果想提取 URL 中的其他部分，可使用[parse_url](./parse-url.md)。
