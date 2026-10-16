---
{
    "title": "ADD_TIME",
    "language": "ja",
    "description": "指定した時間間隔を日時式または時刻式に加算します。第二引数が負の場合は、第一引数からその時間間隔を減算した結果と同じになります。"
}
---

## 説明

指定した時間間隔を日時式または時刻式に加算します。第二引数が負の場合は、第一引数からその時間間隔を減算した結果と同じになります。

## 構文

```sql
ADD_TIME(`<date_or_time_expr>`, `<time>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<date_or_time_expr>` | 有効な日付式。TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、DATE、TIME 型を指定できます。DATE 型の場合は、その日の開始時刻（00:00:00）に変換されます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[TIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |
| `<time>` | 有効な時刻式。`<date_or_time_expr>` に加算する時間の値を表します。負の場合は減算を意味します。TIME 型を指定できます。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、秒の小数部が固定の九桁精度である `TIMESTAMP_NS` 型を返します。結果が戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<time>` を `<date_or_time_expr>` に加算した結果を返します。戻り値の型は第一引数の型によって異なります。
- 第一引数が TIMESTAMPTZ 型の場合は、TIMESTAMPTZ 型を返します。
- 第一引数が DATETIME 型の場合は、DATETIME 型を返します。
- 第一引数が TIME 型の場合は、TIME 型を返します。

特別な場合：
- いずれかの入力引数が NULL の場合は、NULL を返します。
- 第一引数が TIME 型で、結果が TIME 型の範囲を超える場合は、最大値（または最小値）を返します。
- 第一引数が DATETIME 型または TIMESTAMPTZ 型で、結果が DATETIME 型の範囲を超える場合は、エラーが発生します。

## 例

```sql
-- Add time when the first parameter is datetime type
SELECT ADD_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 13:30:00                         |
+---------------------------------------------+

-- Add time when the first parameter is time type
SELECT ADD_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| ADD_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:26:00                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00';
SELECT ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03');
+-----------------------------------------------------------+
| ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03') |
+-----------------------------------------------------------+
| 2025-10-10 17:24:36.123457+08:00                          |
+-----------------------------------------------------------+
         
-- NULL parameter test
SELECT ADD_TIME(NULL, '01:00:00');
+----------------------------+
| ADD_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT ADD_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT ADD_TIME(NULL, NULL);
+----------------------+
| ADD_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT ADD_TIME(cast('835:30:00' as time), '21:00:00'); 
+-------------------------------------------------+
| ADD_TIME(cast('835:30:00' as time), '21:00:00') |
+-------------------------------------------------+
| 838:59:59                                       |
+-------------------------------------------------+

SELECT ADD_TIME(cast('-832:30:00' as time), '-31:00:00');   
+---------------------------------------------------+
| ADD_TIME(cast('-832:30:00' as time), '-31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT ADD_TIME('9999-12-31 23:59:59', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time

SELECT ADD_TIME('0000-01-01 00:00:00', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time
```
