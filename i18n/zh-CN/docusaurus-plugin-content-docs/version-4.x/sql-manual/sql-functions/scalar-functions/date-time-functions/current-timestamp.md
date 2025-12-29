---
{
    "title": "CURRENT_TIMESTAMP",
    "language": "zh-CN",
    "description": "函数用于获取当前系统时间，返回值为日期时间类型(DATETIME)，可以选择性地指定精度以调整返回值的小数秒部分的位数。"
}
---

## 描述
函数用于获取当前系统时间，返回值为日期时间类型(`DATETIME`)，可以选择性地指定精度以调整返回值的小数秒部分的位数。

## 别名

- NOW()

## 语法

```sql
CURRENT_TIMESTAMP([<precision>])
```

## 参数

| 参数            | 说明                                                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 可选参数，表示返回值的小数秒部分的精度。取值范围为 0 到 6。默认为 0, 即不返回小数秒部分。 |

## 返回值

- 返回当前系统时间,类型为 `DATETIME`
- 如果指定的 `<precision>` 超出范围（如为负数或大于 6），函数会返回错误。
- 如果输入 NULL, 返回 NULL

## 举例

```sql
--不同精度返回结果
select CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(6);
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:26:01 | 2025-01-23 11:26:01.771 | 2025-01-23 11:26:01.771000 |
+---------------------+-------------------------+----------------------------+

--输入 NULL，返回 NULL
select CURRENT_TIMESTAMP(NULL);
+-------------------------+
| CURRENT_TIMESTAMP(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+

--输入不在 精度范围内，抛出错误
select CURRENT_TIMESTAMP(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1

select CURRENT_TIMESTAMP(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: 7
```