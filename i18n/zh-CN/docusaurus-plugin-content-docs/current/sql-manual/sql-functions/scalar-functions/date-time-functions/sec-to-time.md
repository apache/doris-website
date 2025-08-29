---
{
    "title": "SEC_TO_TIME",
    "language": "zh-CN"
}
---

## 描述
SEC_TO_TIME 函数用于将以秒为单位的数值转换为 TIME 类型，返回格式为 HH:MM:SS。该函数将输入的秒数解析为从一天起点时间（00:00:00）开始计算的时间偏移量，支持处理正负秒数及超出一天的时间范围。

该函数与 mysql 中的 [sec_to_time 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time) 行为一致

## 语法

```sql
SEC_TO_TIME(<seconds>)
```

## 参数

| 参数            | 说明                                                |
|---------------|---------------------------------------------------|
| `<seconds>` | 必填，输入的秒数，表示从一天起点时间（00:00:00）开始计算的秒数，支持正整数或负整数类型。 |

## 返回值
返回一个秒数转换为 TIME 类型的值
- 若输入秒数超出 TIME 类型的有效范围（-838:59:59 至 838:59:59，对应秒数范围 -3023999 至 3023999），返回错误；
- 若输入为 NULL，返回 NULL；
- 若输入为小数，会自动截断为整数（如 3661.9 按 3661 处理）。

## 举例
```sql
--- 正数秒数（当天时间）
SELECT SEC_TO_TIME(59738) AS result;
+----------+
| result   |
+----------+
| 16:35:38 |
+----------+

--- 超出一天的秒数（自动转换为多小时）
SELECT SEC_TO_TIME(90061) AS result;
+----------+
| result   |
+----------+
| 25:01:01 |
+----------+

--- 负数秒数（前一天的时间）
SELECT SEC_TO_TIME(-3600) AS result;
+----------+
| result   |
+----------+
| -01:00:00 |
+----------+

--- 零秒（起点时间）
SELECT SEC_TO_TIME(0) AS result;
+----------+
| result   |
+----------+
| 00:00:00 |
+----------+

--- 小数秒数（自动截断）
SELECT SEC_TO_TIME(3661.9) AS result;
+----------+
| result   |
+----------+
| 01:01:01 |
+----------+

--- 输入为NULL（返回NULL）
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- 超出TIME类型范围，返回错误
SELECT SEC_TO_TIME(30245000) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function SEC_TO_TIME Argument value 30245000 is out of Time range
```