---
{
  "title": "YEAR_CEIL",
  "language": "ja",
  "description": "指定された時間間隔期間の最も近い切り上げ時刻に日付を変換します。"
}
---
## year_ceil
### 説明
#### 構文

```sql
DATETIME YEAR_CEIL(DATETIME datetime)
DATETIME YEAR_CEIL(DATETIME datetime, DATETIME origin)
DATETIME YEAR_CEIL(DATETIME datetime, INT period)
DATETIME YEAR_CEIL(DATETIME datetime, INT period, DATETIME origin)
```
指定された時間間隔期間の最も近い切り上げ時刻に日付を変換します。

- datetime: 有効な日付式。
- period: 各サイクルが何年で構成されるかを指定します。
- origin: 0001-01-01T00:00:00から開始。

### example

```
mysql> select year_ceil("2023-07-13 22:28:18", 5);
+------------------------------------------------------------+
| year_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2025-01-01 00:00:00                                        |
+------------------------------------------------------------+
1 row in set (0.02 sec)
```
### keywords

    YEAR_CEIL, YEAR, CEIL

### ベストプラクティス

[date_ceil](./date-ceil)も参照してください
