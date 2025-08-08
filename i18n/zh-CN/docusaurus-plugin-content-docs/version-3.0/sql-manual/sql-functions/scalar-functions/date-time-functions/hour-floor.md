---
{
    "title": "HOUR_FLOOR",
    "language": "zh-CN"
}
---

## 描述

HOUR_FLOOR 函数用于将输入的日期时间值向下取整到指定小时周期的最近时刻。例如，若指定周期为 5 小时，函数会将输入时间调整为该周期内的起始整点时刻.

## 语法

```sql
HOUR_FLOOR(<datetime>)
HOUR_FLOOR(<datetime>, <origin>)
HOUR_FLOOR(<datetime>, <period>)
HOUR_FLOOR(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<datetime>` | 参数是合法的日期表达式，支持输入 datetime 类型和符合日期时间格式的字符串,具体 datetime  格式请查看 [datetime的转换](https://doris.apache.org/zh-CN/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion/) |
| `<period>` | 	可选参数，指定周期长度（单位：小时），为正整数（如 2、6、12）。默认值为 1，表示每 1 小时一个周期。|
|` <origin>` | 开始的时间起点，如果不填，默认是 0001-01-01T00:00:00 |

## 返回值

返回 DATETIME 类型的值，表示向下取整后的最近周期时刻。

- 若输入的 `period` 为非正整数，返回 NULL。
- 若 `origin` 或 `datetime` 为无效日期时间（如 '2023-02-30'），返回 NULL。
- 若是任意参数为 NULL ,结果返回 NULL.
- origin 或 datetime 带有 scale,返回结果带有 scale

## 举例

```sql

-- 按5小时周期向下取整，默认起点为0001-01-01 00:00:00

mysql> select hour_floor("2023-07-13 22:28:18", 5);

+--------------------------------------+
| hour_floor("2023-07-13 22:28:18", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- 以2023-07-13 08:00为起点，按4小时周期划分

mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+---------------------+
| custom_origin       |
+---------------------+
| 2023-07-13 16:00:00 |
+---------------------+

---origin 或 datetime 带有 scale,返回结果带有 scale
mysql> select hour_floor('2023-07-13 19:30:00.123', 4, '2023-07-03 08:00:00') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.000 |
+-------------------------+

mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-03 08:00:00.123') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.123 |
+-------------------------+

-- 输入任一参数为 NULL（返回NULL）
mysql> select hour_floor(null, 6) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

---period 为负数，返回 NULL
mysql> select hour_floor('2023-12-31 23:59:59', -3);
+---------------------------------------+
| hour_floor('2023-12-31 23:59:59', -3) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

---origin 或者 datetime 无效，结果返回 NULL
mysql> select hour_floor('2025-07-13 19:30:00', 4, '2023-07-32 08:00:00') as custom_origin;
+---------------+
| custom_origin |
+---------------+
| NULL          |
+---------------+

mysql> select hour_floor('2025-07-32 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+---------------+
| custom_origin |
+---------------+
| NULL          |
+---------------+


```