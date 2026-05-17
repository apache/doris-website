---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "zh-CN",
    "description": "获取当前时间并返回为 TIME 类型。"
}
---

## 描述

获取当前时间并返回为 TIME 类型。

## 别名

- CURRENT_TIME

## 语法

```sql
CURTIME([<precision>])
```

## 参数

| 参数            | 说明                                                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 可选参数，表示返回值的小数秒部分的精度，该参数需为 0 到 6 的常量值。默认为 0，即不返回小数秒部分。 |


## 返回值

返回当前时间，类型为 TIME。

## 示例

```sql
mysql> select curtime();
+----------------+
| curtime()      |
+----------------+
| 15:25:47       |
+----------------+
```

```sql
mysql> select curtime(0);
+------------+
| curtime(0) |
+------------+
| 13:15:27   |
+------------+
```

```sql
mysql> select curtime(4);
+---------------+
| curtime(4)    |
+---------------+
| 15:31:03.8958 |
+---------------+
```

```sql
mysql> select curtime(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = The precision must be between 0 and 6
```