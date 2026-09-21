---
{
    "title": "UUID_VERSION",
    "language": "zh-CN",
    "description": "提取 UUID 的 4 位版本字段；输入为 `NULL` 时返回 `NULL`。"
}
---

## 描述

提取 UUID 的 4 位版本字段；输入为 `NULL` 时返回 `NULL`。

## 语法

```sql
UUID_VERSION(<uuid>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<uuid>` | UUID 类型的值。 |

## 返回值

返回 `TINYINT` 类型，范围为 0–15。该函数只读取版本位，不验证 UUID 的变体或是否符合某个版本规范。全零 UUID 返回 0，全一 UUID 返回 15；输入为 `NULL` 时返回 `NULL`。

## 示例

```sql
SELECT UUID_VERSION(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS v4,
       UUID_VERSION(CAST('018f0f59-1010-7abc-9234-001122334455' AS UUID)) AS v7,
       UUID_VERSION(CAST('00000000-0000-0000-0000-000000000000' AS UUID)) AS zero_version,
       UUID_VERSION(CAST('ffffffff-ffff-ffff-ffff-ffffffffffff' AS UUID)) AS max_version,
       UUID_VERSION(CAST(NULL AS UUID)) AS null_version;
```

```text
+----+----+--------------+-------------+--------------+
| v4 | v7 | zero_version | max_version | null_version |
+----+----+--------------+-------------+--------------+
| 4  | 7  | 0            | 15          | NULL         |
+----+----+--------------+-------------+--------------+
```
