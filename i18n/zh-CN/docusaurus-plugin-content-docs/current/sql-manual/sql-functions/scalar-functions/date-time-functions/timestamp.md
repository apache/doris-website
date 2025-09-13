---
{
    "title": "TIMESTAMP",
    "language": "zh-CN"
}
---

## 描述

TIMESTAMP 将 datetime 字符串转换为 DATETIME 类型

具体 datetime 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion).

该函数与 mysql 中的 [timestamp 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp) 有些差异，doris 暂不支持带有第二个 time 参数进行日期时间增减。

## 语法

```sql
TIMESTAMP(string)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `string` | 日期时间字符串或者 datetime 类型 |

## 返回值

返回类型为 DATETIME。

- 若输入为 date 字符串,则时间被设置为 00:00:00
- 若输入日期时间无效，返回 NULL
- 输入 NULL，返回 NULL
## 举例

```sql
-- 将字符串转换为 DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');
```

```text
+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+
```

```sql
---输入 date 字符串
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+
```

```sql
---若输入日期时间无效，返回 NULL
SELECT TIMESTAMP('2019-01-41 12:00:00');
+----------------------------------+
| TIMESTAMP('2019-01-41 12:00:00') |
+----------------------------------+
| NULL                             |
+----------------------------------+

--输入 NULL,返回 NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+

```
