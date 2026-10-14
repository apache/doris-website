---
{
    "title": "DATEDIFF",
    "language": "ja",
    "description": "二つの DATE、DATETIME、TIMESTAMP_NS 値の間の日数差を計算します。"
}
---

## 概要

DATEDIFF 関数は、二つの `DATE`、`DATETIME`、または `TIMESTAMP_NS` 値の差を日単位で計算します。`expr2` を `expr1` から引いた日数を返します。この関数は日付部分のみを使用し、時刻部分の時、分、秒、小数秒を無視します。

この関数は、MySQL の [datediff 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_datediff) と同じ動作をします。

## 構文

```sql
DATEDIFF(<expr1>, <expr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | 減算される側の日付。`DATE`、`DATETIME`、`TIMESTAMP_NS` をサポートします。具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<expr2>` | 減算する側の日付。`DATE`、`DATETIME`、`TIMESTAMP_NS` をサポートします。 |

## 戻り値

expr1 - expr2 の値を日単位の INT 型で返します。

特殊なケース:
- expr1 が expr2 より大きい場合は正の数を返し、それ以外の場合は負の数を返します。
- いずれかのパラメータが NULL の場合は、NULL を返します。
- 時刻部分は無視します。

## 使用例

```sql
-- The two dates differ by 1 day (ignoring the time part)
select datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                                 1 |
+-----------------------------------------------------------------------------------+

-- The first date is earlier than the second date, returning a negative number
select datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                               -31 |
+-----------------------------------------------------------------------------------+

-- TIMESTAMP_NS can be used for either parameter
SELECT DATEDIFF(CAST('2024-01-02 00:00:00.000000001' AS TIMESTAMP_NS),
                CAST('2024-01-01 23:59:59.999999' AS DATETIME(6))) AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Any parameter is NULL
mysql> select datediff('2023-01-01', NULL);
+------------------------------+
| datediff('2023-01-01', NULL) |
+------------------------------+
|                         NULL |
+------------------------------+

-- If input datetime type, will ignore time part
select datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+

select datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
1 row in set (0.01 sec)
```
