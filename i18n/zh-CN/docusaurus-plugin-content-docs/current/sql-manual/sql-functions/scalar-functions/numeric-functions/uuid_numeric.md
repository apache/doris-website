---
{
    "title": "UUID_NUMERIC",
    "language": "zh-CN",
    "description": "返回一个 LARGEINT 类型的 uuid"
}
---

## 描述

返回一个 `LARGEINT` 类型的 `uuid`

本函数继续返回 LARGEINT，新增的原生 [UUID 类型](../../../basic-element/sql-data-types/uuid.md) 不改变这一行为。需要原生 UUID 值时，使用 [UUID_V4](../uuid-functions/uuid-v4.md) 或 [UUID_V7](../uuid-functions/uuid-v7.md)。

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
