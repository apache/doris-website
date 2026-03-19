---
{
  "title": "2階",
  "language": "ja",
  "description": "SECOND_FLOOR関数は、入力されたdatetime値を指定された秒の期間の最も近い値に切り下げます。originが指定された場合、それを基準として使用し、指定されていない場合、デフォルトの基準は0001-01-01 00:00:00です。DATETIME型の処理をサポートします。"
}
---
## 説明

SECOND_FLOOR関数は、入力されたdatetime値を指定された秒の期間の最も近い値に切り下げます。originが指定された場合はそれを基準として使用し、そうでなければ0001-01-01 00:00:00をデフォルトとします。この関数はDATETIME型の処理をサポートします。

日付計算式：
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から対象時刻までの期間数を表します。

## 構文

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 必須。入力datetime値。date/datetime/timestamptz型の入力をサポートします。具体的な形式については[timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | オプション。各期間を構成する秒数を示します。正の整数型（INT）をサポートします。デフォルトは1秒です。 |
| `<origin_datetime>` | オプション。アライメントの開始点。datetime型およびdatetime形式に準拠する文字列の入力をサポートします。指定されていない場合、デフォルトは0001-01-01T00:00:00です。 |

## 戻り値

TIMESTAMPTZ、DATETIME、またはDATE型の値を返します。入力datetimeに基づいて、指定された秒期間の最も近い値に切り下げた後の時間値を返します。戻り値の精度は入力datetimeパラメータの精度と一致します。

- 入力がTIMESTAMPTZ型の場合、まずlocal_timeに変換され（例：`2025-12-31 23:59:59+05:00`はセッション変数が`+08:00`の場合、local_time `2026-01-01 02:59:59`を表します）、その後SECOND_FLOOR計算を実行します。
- 入力時間値（`<date_or_time_expr>`と`<period>`）がTIMESTAMPTZとDATETIME型の両方を含む場合、出力はDATETIME型です。
- `<period>`が非正（≤0）の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが指定されていない場合、デフォルトで1秒期間になります。
- `<origin_datetime>`が指定されていない場合、デフォルトで0001-01-01 00:00:00を基準とします。
- 入力がDATE型（年、月、日のみを含む）の場合、時間部分はデフォルトで00:00:00になります。
- スケール付きdatetimeの場合、すべての小数点以下の桁は0に切り捨てられます。
- `<origin>`の日時が`<period>`より後の場合でも、上記の式に従って計算されますが、期間kは負の値になります。

## 例

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, downward rounding result with default starting point
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

-- Only with origin date and specified date
select second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+----------------------------------------------------------------+
| second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+----------------------------------------------------------------+
| 2023-07-13 22:28:17.123                                        |
+----------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_FLOOR
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

-- Period is non-positive, returns error
mysql> SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```
