---
{
    "title": "UUID_NUMERIC",
    "language": "zh-CN",
    "description": "返回一个 LARGEINT 类型的 uuid"
}
---

## 描述

返回一个 `LARGEINT` 类型的 `uuid`

## 语法

```sql
UUID_NUMERIC()
```

## 返回值

返回一个 `LARGEINT` 类型的 `uuid`。注意 `LARGEINT` 是一个 Int128，所以 `uuid_numeric()` 可能会得到负值。

## 举例

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
