---
{
    "title": "NOW",
    "language": "zh-CN",
    "description": "NOW 函数用于获取当前系统的日期时间，返回值为 DATETIME 类型。支持通过可选参数指定小数秒的精度，以调整返回结果中微秒部分的位数。"
}
---

## 描述
`NOW` 函数用于获取当前系统的日期时间，返回值为 `DATETIME` 类型。支持通过可选参数指定小数秒的精度，以调整返回结果中微秒部分的位数。

该函数与 mysql 的 [now 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_now) 行为一致。

# 别名

- current_timestamp()

## 语法

```sql
NOW([`<precision>`])
```

## 参数

| 参数            | 说明                                                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| ``<precision>`` | 可选参数，表示返回值的小数秒部分的精度，取值范围为 0 到 6。默认为 0，即不返回小数秒部分。。 |

## 返回值

返回当前系统时间，类型为 `DATETIME`.
- 如果指定的 ``<precision>`` 超出范围（如为负数或大于 6），函数会返回错误。

## 举例

```sql
---获取当前时间
select NOW(),NOW(3),NOW(6);
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+

--- 无效精度（超出范围，报错）
SELECT NOW(7) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Invalid precision for NOW function. Precision must be between 0 and 6.

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
```