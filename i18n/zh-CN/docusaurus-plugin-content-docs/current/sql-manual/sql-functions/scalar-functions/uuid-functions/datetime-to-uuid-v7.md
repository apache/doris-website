---
{
    "title": "DATETIME_TO_UUID_V7",
    "language": "zh-CN",
    "description": "根据日期时间生成原生 UUID v7；输入为 `NULL` 时返回 `NULL`。"
}
---

## 描述

根据日期时间生成原生 UUID v7；输入为 `NULL` 时返回 `NULL`。

## 别名

`dateTimeToUUIDv7`.

## 使用说明

该函数使用独立于 `UUID_V7()` 的计数器，不保证跨 BE 的全局顺序，也不能作为时间的确定性编码。连续相同输入的计数器溢出时，编码时间增加 1 毫秒。

## 语法

```sql
DATETIME_TO_UUID_V7(<datetime>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<datetime>` | DATETIME 类型的值，可带小数秒精度；按会话变量 `time_zone` 解释。 |

## 返回值

返回 `UUID` 类型。输入为 `NULL`、无效日期或转换为 UTC 后早于 Unix 纪元时返回 `NULL`。小于毫秒的部分直接截断。函数是非确定性的：相同时间的重复调用会重新生成 UUID。

## 示例

```sql
SET time_zone = 'UTC';
SELECT UUID_VERSION(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6)))) AS version,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('2026-09-10 12:34:56.789123' AS DATETIME(6))), 'UTC') AS restored;
```

```text
+---------+-------------------------+
| version | restored                |
+---------+-------------------------+
| 7       | 2026-09-10 12:34:56.789 |
+---------+-------------------------+
```

```sql
SET time_zone = 'UTC';
SELECT DATETIME_TO_UUID_V7(CAST(NULL AS DATETIME)) AS null_input,
       DATETIME_TO_UUID_V7(CAST('1969-12-31 23:59:59' AS DATETIME)) AS before_epoch,
       UUID_V7_TO_DATETIME(DATETIME_TO_UUID_V7(CAST('1970-01-01 00:00:00' AS DATETIME)), 'UTC') AS epoch;
```

```text
+------------+--------------+-------------------------+
| null_input | before_epoch | epoch                   |
+------------+--------------+-------------------------+
| NULL       | NULL         | 1970-01-01 00:00:00.000 |
+------------+--------------+-------------------------+
```
