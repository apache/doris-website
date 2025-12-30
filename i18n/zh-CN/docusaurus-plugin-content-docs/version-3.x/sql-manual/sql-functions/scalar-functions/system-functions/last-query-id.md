---
{
    "title": "LAST_QUERY_ID",
    "language": "zh-CN",
    "description": "获取当前用户上一次查询的 query id。"
}
---

## 描述

获取当前用户上一次查询的 query id。

## 语法

```sql
last_query_id()
```

## 返回值

返回当前用户上一次查询的 query id。

## 举例

```sql
select last_query_id();
```

```text
+-----------------------------------+
| last_query_id()                   |
+-----------------------------------+
| 128f913c3ec84a1e-b834bd0262cc090a |
+-----------------------------------+
```