---
{
  "title": "UTC_TIMESTAMP",
  "language": "ja",
  "description": "現在のUTC日時を\"YYYY-MM-DD HH: MM: SS\"形式で返すか、または"
}
---
## utc_timestamp
### 説明
#### 構文

`DATETIME UTC_TIMESTAMP()`


現在のUTC日付と時刻を"YYYY-MM-DD HH: MM: SS"または

"YYYYMMDDHMMSS"形式の値で返します

関数が文字列コンテキストまたは数値コンテキストのどちらで使用されるかによって異なります

### 例

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
