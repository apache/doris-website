---
{
    "title": "UTC_TIMESTAMP",
    "language": "zh-CN"
}
---

## utc_timestamp
## 描述
## 语法

`DATETIME UTC_TIMESTAMP()`


返回当前UTC日期和时间在 "YYYY-MM-DD HH:MM:SS" 或

"YYYYMMDDHHMMSS"格式的一个值

根据该函数是否用在字符串或数字语境中

## 举例

```
mysql> select utc_timestamp(),utc_timestamp() + 1;
+---------------------+---------------------+
| utc_timestamp()     | utc_timestamp() + 1 |
+---------------------+---------------------+
| 2019-07-10 12:31:18 |      20190710123119 |
+---------------------+---------------------+
```

### keywords

    UTC_TIMESTAMP,UTC,TIMESTAMP
