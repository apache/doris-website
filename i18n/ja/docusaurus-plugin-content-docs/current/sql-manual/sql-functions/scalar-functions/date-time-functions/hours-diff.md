---
{
    "title": "HOURS_DIFF",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS の値の間にある、満了した時間数の差を計算します。"
}
---

## 説明

HOURS_DIFF 関数は、二つの `DATE`、`DATETIME`、または `TIMESTAMP_NS` の値について、開始時刻から終了時刻までに経過した満了時間数を計算します。日、月、年をまたぐ差も自動的に処理します。`DATE` 型の入力は 00:00:00 として扱います。

## 構文

```sql
HOURS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ

| パラメータ | 説明 |
| ---- | ---- |
| `<date_or_time_expr1>` | 終了時刻。DATE、DATETIME、TIMESTAMP_NS 型をサポートする有効な日付式です。具体的な日時と日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始時刻。DATE、DATETIME、TIMESTAMP_NS 型、および日時形式の文字列をサポートする有効な日付式です。 |

## 戻り値

BIGINT 型の値を返します。値は `<date_or_time_expr1>` と `<date_or_time_expr2>` の時間差を表します。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合は正の値を、前の場合は負の値を返します。
- いずれかの入力パラメータが NULL の場合は NULL を返します。
- 分以下の単位を含み、実際の差が一時間未満の場合、計算結果は一だけ減ります。

## 例

```sql

-- End time is later than start time, returns positive number
SELECT HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+

-- End time is earlier than start time, returns negative number
select hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                       -1 |
+----------------------------------------------------------+

-- Contains minute time, if actual difference is less than one hour, calculation result is reduced by one
select hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        0 |
+----------------------------------------------------------+

-- End time is date type, defaults to 00:00:00 start
select hours_diff('2023-12-31', '2023-12-30 12:00:00');
+-------------------------------------------------+
| hours_diff('2023-12-31', '2023-12-30 12:00:00') |
+-------------------------------------------------+
|                                              12 |
+-------------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_diff(null, '2023-10-01') ;
+--------------------------------+
| hours_diff(null, '2023-10-01') |
+--------------------------------+
|                           NULL |
+--------------------------------+

select hours_diff('2023-12-31', NULL);
+--------------------------------+
| hours_diff('2023-12-31', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+

```
