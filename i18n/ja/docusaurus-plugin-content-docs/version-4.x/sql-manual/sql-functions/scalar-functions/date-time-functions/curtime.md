---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "ja",
    "description": "現在時刻を取得し、TIME 型で返します。"
}
---

## 説明

現在時刻を取得し、TIME 型で返します。

この関数の動作は、MySQL の [CURTIME 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curtime) と同じです。

## 別名

- CURRENT_TIME

## 構文

```sql
CURTIME([<precision>])
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<precision>` | 省略可能。戻り値の小数秒部分の精度を指定します。0 から 6 までの定数値である必要があります。デフォルトは 0 で、小数秒部分は返されません。 |

## 戻り値

現在時刻を TIME 型で返します。

## 例

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
