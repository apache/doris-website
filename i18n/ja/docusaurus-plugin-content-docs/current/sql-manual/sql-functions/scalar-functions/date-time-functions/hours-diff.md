---
{
  "title": "HOURS_DIFF",
  "language": "ja",
  "description": "HOURSDIFF関数は、2つのdatetimeまたはdate値間の時間差を計算します、"
}
---
## 説明

HOURS_DIFF関数は、2つのdatetimeまたはdate値の間の時間差を計算し、開始時刻から終了時刻までの経過時間数を表します。この関数はDATEとDATETIMEの両方の入力タイプをサポートし、日、月、年をまたいだ時間差の計算を自動的に処理し、整数の結果を返します。入力がDATEタイプ（年、月、日のみを含む）の場合、時刻部分はデフォルトで00:00:00になります。

## 構文

```sql
HOURS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```
## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr1>` | 終了時刻。date/datetimeタイプをサポートする有効な日付式。具体的なdatetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<date_or_time_expr2>` | 開始時刻。date/datetimeタイプとdatetime形式の文字列をサポートする有効な日付式 |

## Return Value

BIGINTタイプを返します。`<date_or_time_expr1>`と`<date_or_time_expr2>`の間の時間差を表します。

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より後の場合は正の数を返し、前の場合は負の数を返します。
- 入力パラメータのいずれかがNULLの場合、NULLを返します。
- 分以下の単位を含め、実際の差が1時間未満の場合、計算結果は1減らされます。

## Examples

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
