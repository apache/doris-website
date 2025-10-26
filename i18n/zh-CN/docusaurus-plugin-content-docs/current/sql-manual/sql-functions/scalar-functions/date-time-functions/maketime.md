---
{
    "title": "MAKETIME",
    "language": "zh-CN"
}
---

## 描述

返回根据`hour`, `minute`, `second`组合出的时间值

该函数与 mysql 中的 [makedate 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_maketime) 行为一致。

## 语法

```sql
MAKETIME(`<hour>`, `<minute>`, `<second>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `hour` | 	时间的小时部分，支持整数类型(BIGINT)。取值范围被限制在 [-838, 838], 若输入值超过该范围，则自动修正为最接近的边界值。 |
| `minute` | 时间的分钟部分，支持整数类型(BITINT)。允许的取值范围为 [0, 59]。 |
| `second` | 时间的秒数部分，支持整数(BIGINT)和小数类型(DOUBLE)。允许的取值范围为 [0, 60), 支持小数点后六位精度，若超过六位，会自动进行四舍五入。 |

## 返回值

返回一个TIME 类型的值，格式为 `hour:minute:second`。当输入的`seconde`为整数类型，输出值精度为 0，当其为小数类型时，输出值精度为最大精度 6。

- 若`minute` 或 `second` 超过允许范围，返回 NULL
- 任一参数为 NULL，返回 NULL

## 举例

```sql
SELECT `hour`, `minute`, `sec`, MAKETIME(`hour`, `minute`, `sec`) AS ans FROM `test_maketime`;
```
```text
+-------+--------+---------+-------------------+
| hour  | minute | sec     | ans               |
+-------+--------+---------+-------------------+
|    12 |     15 |      30 | 12:15:30.000000   |
|   111 |      0 | 23.1235 | 111:00:23.123457  |
|  1234 |     11 |       4 | 838:59:59.000000  |
| -1234 |      6 |      52 | -838:59:59.000000 |
|    20 |     60 |      12 | NULL              |
|    14 |     51 |      66 | NULL              |
|  NULL |     15 |      16 | NULL              |
|     7 |   NULL |       8 | NULL              |
|     1 |      2 |    NULL | NULL              |
|    23 |    -40 |      12 | NULL              |
|    20 |      6 |     -12 | NULL              |
+-------+--------+---------+-------------------+
```

```sql
SELECT `hour`, `minute`, MAKETIME(`hour`, `minute`, 27) AS ans FROM `test_maketime`;
```
```text
+-------+--------+------------+
| hour  | minute | ans        |
+-------+--------+------------+
|    12 |     15 | 12:15:27   |
|   111 |      0 | 111:00:27  |
|  1234 |     11 | 838:59:59  |
| -1234 |      6 | -838:59:59 |
|    20 |     60 | NULL       |
|    14 |     51 | 14:51:27   |
|  NULL |     15 | NULL       |
|     7 |   NULL | NULL       |
|     1 |      2 | 01:02:27   |
|    23 |    -40 | NULL       |
|    20 |      6 | 20:06:27   |
+-------+--------+------------+
```
