---
{
  "title": "CURTIME,CURRENT_TIME",
  "description": "現在の時刻を取得し、TIME型として返します。",
  "language": "ja"
}
---
## 説明

現在時刻を取得し、TIME型として返します。

## エイリアス

- CURTIME
- CURRENT_TIME

## 構文

```sql
CURTIME()
```
## 戻り値

現在時刻を返します。

## 例

```sql
mysql> select current_time();
```
```text
+----------------+
| current_time() |
+----------------+
| 15:25:47       |
+----------------+
```
