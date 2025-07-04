---
{
    "title": "JSON_UNQUOTE",
    "language": "zh-CN"
}
---

## json_unquote
## 描述
## 语法

`VARCHAR json_unquote(VARCHAR)`

这个函数将去掉 JSON 值中的引号，并将结果作为 utf8mb4 字符串返回。如果参数为 NULL，则返回 NULL。

在字符串中显示的如下转义序列将被识别，对于所有其他转义序列，反斜杠将被忽略。

| 转义序列 | 序列表示的字符                |
|----------|-------------------------------|
| `\"`       | 双引号 "                      |
| `\b`       | 退格字符                      |
| `\f`       | 换页符                        |
| `\n`       | 换行符                        |
| `\r`       | 回车符                        |
| `\t`       | 制表符                        |
| `\\`       | 反斜杠 `\`                     |
| `\uxxxx`   | Unicode 值 XXXX 的 UTF-8 字节 |



## 举例

```sql
mysql> SELECT json_unquote('"doris"');
+-------------------------+
| json_unquote('"doris"') |
+-------------------------+
| doris                   |
+-------------------------+
```
```sql
mysql> SELECT json_unquote('[1, 2, 3]');
+---------------------------+
| json_unquote('[1, 2, 3]') |
+---------------------------+
| [1, 2, 3]                 |
+---------------------------+
```
```sql
mysql> SELECT json_unquote(null);
+--------------------+
| json_unquote(NULL) |
+--------------------+
| NULL               |
+--------------------+
```
```sql
mysql> SELECT json_unquote('"\\ttest"');
+--------------------------+
| json_unquote('"\ttest"') |
+--------------------------+
|       test                    |
+--------------------------+
```

### keywords
json,unquote,json_unquote
