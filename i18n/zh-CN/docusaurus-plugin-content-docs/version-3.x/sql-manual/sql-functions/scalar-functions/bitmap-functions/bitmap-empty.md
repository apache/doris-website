---
{
    "title": "BITMAP_EMPTY",
    "language": "zh-CN",
    "description": "构建一个空 BITMAP。主要用于 insert 或 stream load 时填充默认值。例如："
}
---

## 描述

构建一个空 BITMAP。主要用于 insert 或 stream load 时填充默认值。例如：

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```

## 语法

```sql
BITMAP_EMPTY()
```

## 返回值

返回一个无元素的空 BITMAP。

## 举例

```sql
select bitmap_to_string(bitmap_empty());
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_count(bitmap_empty());
```

```text
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```