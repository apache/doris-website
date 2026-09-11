---
{
    "title": "UUID_V7_TO_DATETIME",
    "language": "zh-CN",
    "description": "提取 UUID v7 中的 Unix 毫秒时间戳并转换为指定时区的日期时间；输入为 `NULL` 时返回 `NULL`。"
}
---

## 描述

提取 UUID v7 中的 Unix 毫秒时间戳并转换为指定时区的日期时间；输入为 `NULL` 时返回 `NULL`。

## 别名

`UUIDv7ToDateTime`.

## 语法

```sql
UUID_V7_TO_DATETIME(<uuid> [, <time_zone>])
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<uuid>` | UUID 类型的值。 |
| `<time_zone>` | 可选，常量字符串，例如 `UTC`、`Asia/Shanghai` 或 `+08:00`；默认使用会话变量 `time_zone`。不允许逐行变化的时区，无效时区报错。 |

## 返回值

返回 `DATETIME(3)` 类型。输入 UUID 或显式时区为 `NULL` 时返回 `NULL`；转换后的时间超出 DATETIME 范围时也返回 `NULL`。版本字段不是 7 时，返回 Unix 纪元（1970-01-01 00:00:00 UTC）在所选时区的日期时间，不返回 `NULL`。该函数不验证 UUID 变体位。

## 示例

```sql
SET time_zone = 'UTC';
SELECT UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID)) AS session_time,
       UUID_V7_TO_DATETIME(CAST('00000000-0001-7000-8000-000000000000' AS UUID), 'Asia/Shanghai') AS shanghai_time;
```

```text
+-------------------------+-------------------------+
| session_time            | shanghai_time           |
+-------------------------+-------------------------+
| 1970-01-01 00:00:00.001 | 1970-01-01 08:00:00.001 |
+-------------------------+-------------------------+
```

```sql
SELECT UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), 'UTC') AS non_v7,
       UUID_V7_TO_DATETIME(CAST(NULL AS UUID), 'UTC') AS null_input,
       UUID_V7_TO_DATETIME(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID), NULL) AS null_zone,
       UUID_V7_TO_DATETIME(CAST('ffffffff-ffff-7000-8000-000000000000' AS UUID), 'UTC') AS out_of_range;
```

```text
+-------------------------+------------+-----------+--------------+
| non_v7                  | null_input | null_zone | out_of_range |
+-------------------------+------------+-----------+--------------+
| 1970-01-01 00:00:00.000 | NULL       | NULL      | NULL         |
+-------------------------+------------+-----------+--------------+
```
