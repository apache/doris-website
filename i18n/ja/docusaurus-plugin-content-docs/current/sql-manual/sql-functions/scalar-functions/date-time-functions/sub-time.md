---
{
    "title": "SUB_TIME",
    "language": "ja",
    "description": "指定した時間間隔を日付/時刻または時刻の式から減算します。時間間隔を表す引数が負の場合は、最初の引数にその時間間隔を加算することと同じです。"
}
---

## 説明

指定した時間間隔を日付/時刻または時刻の式から減算します。時間間隔を表す引数が負の場合は、最初の引数にその時間間隔を加算することと同じです。

## 構文

```sql
SUB_TIME(`<date_or_time_expr>`, `<time>`)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<date_or_time_expr>` | 有効な日付式。TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、DATE、TIME 型の入力に対応します。DATE 型の場合、時刻はその日の開始時刻（00:00:00）に変換されます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[TIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |
| `<time>` | `<date_or_time_expr>` から減算する時間を表す、有効な時刻式。負の値の場合は加算を意味します。TIME 型の入力に対応します。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒の精度が九桁に固定された `TIMESTAMP_NS` 型の値を返します。結果が戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<time>` を `<date_or_time_expr>` から減算した結果を返します。戻り値の型は最初の引数の型によって異なります。
- 最初の引数がタイムスタンプ型の場合、タイムスタンプ型を返します。
- 最初の引数が DATETIME 型の場合、DATETIME 型を返します。
- 最初の引数が TIME 型の場合、TIME 型を返します。

特別な場合：
- いずれかの引数が NULL の場合、NULL を返します。
- 最初の引数が TIME 型で、結果が TIME 型の範囲を超える場合、TIME 型の最大値（または最小値）を返します。
- 最初の引数が DATETIME 型または TIMESTAMPTZ 型で、結果が DATETIME 型の範囲を超える場合、エラーを返します。

## 例

```sql
-- Subtract time when the first parameter is datetime type
SELECT SUB_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 10:30:00                         |
+---------------------------------------------+

-- Subtract time when the first parameter is time type
SELECT SUB_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| SUB_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:04:40                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00'
select sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123');
+------------------------------------------------------+
| sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123') |
+------------------------------------------------------+
| 2025-10-10 12:59:59.877+08:00                        |
+------------------------------------------------------+
         
-- NULL parameter test
SELECT SUB_TIME(NULL, '01:00:00');
+----------------------------+
| SUB_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT SUB_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT SUB_TIME(NULL, NULL);
+----------------------+
| SUB_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT SUB_TIME(cast('835:30:00' as time), '-21:00:00');
+--------------------------------------------------+
| SUB_TIME(cast('835:30:00' as time), '-21:00:00') |
+--------------------------------------------------+
| 838:59:59                                        |
+--------------------------------------------------+

SELECT SUB_TIME(cast('-832:30:00' as time), '31:00:00');   
+---------------------------------------------------+
| SUB_TIME(cast('-832:30:00' as time), '31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT SUB_TIME('0000-01-01 00:00:00', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time

SELECT SUB_TIME('9999-12-31 23:59:59', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time
```
