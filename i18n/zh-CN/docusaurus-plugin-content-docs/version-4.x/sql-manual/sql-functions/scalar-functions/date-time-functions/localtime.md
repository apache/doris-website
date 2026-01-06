---
{
    "title": "LOCALTIME,LOCALTIMESTAMP",
    "language": "zh-CN",
    "description": "函数用于获取当前系统时间，返回值为日期时间类型（DATETIME）。可以选择性地指定精度以调整返回值的小数秒部分的位数。"
}
---

## 描述
函数用于获取当前系统时间，返回值为日期时间类型（`DATETIME`）。可以选择性地指定精度以调整返回值的小数秒部分的位数。

该函数与 mysql 中的 [localtime 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_localtime) 行为一致。

## Alias

- NOW()

## 语法

```sql
LOCALTIME([`<precision>`])
LOCALTIMESTAMP([`<precision>`]))    
```

## 参数

| 参数            | 说明                                                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 可选参数，表示返回值的小数秒部分的精度，取值范围为 0 到 6。默认为 0，即不返回小数秒部分。 |

## 返回值
- 返回当前系统时间，类型为 `DATETIME`
- 如果指定的 `<precision>` 超出范围（如为负数或大于 6），函数会返回错误。

## 举例

```sql

--jdk 17 版本，可以支持六位精度
mysql> select LOCALTIME(),LOCALTIME(3),LOCALTIME(6);
+---------------------+-------------------------+----------------------------+
| LOCALTIME()         | LOCALTIME(3)            | LOCALTIME(6)               |
+---------------------+-------------------------+----------------------------+
| 2025-08-11 11:04:49 | 2025-08-11 11:04:49.535 | 2025-08-11 11:04:49.535992 |
+---------------------+-------------------------+----------------------------+

---输入参数为 NULL，返回 NULL
mysql> select LOCALTIME(NULL);
+-----------------+
| LOCALTIME(NULL) |
+-----------------+
| NULL            |
+-----------------+

---不在精度范围内，报错
mysql> select LOCALTIME(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
mysql> select LOCALTIME(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: 7
```