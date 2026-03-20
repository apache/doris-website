---
{
  "title": "SECOND_FLOOR",
  "description": "secondfloor関数は、入力されたdatetime値を指定された秒の期間の最も近い値に切り下げます。originが指定された場合、",
  "language": "ja"
}
---
## 説明

second_floor関数は、入力されたdatetime値を指定された秒間隔の最も近い下位の値に丸めます。originが指定された場合は、それを基準として使用します。指定されていない場合は、デフォルトで0001-01-01 00:00:00を使用します。

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

| Parameter | デスクリプション |
| --------- | ----------- |
| `<datetime>` | 必須。入力となるdatetime値。datetime型をサポートします。具体的なdatetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください |
| `<period>` | オプション。各期間を構成する秒数を示します。正の整数型（INT）をサポートします。デフォルトは1秒です。 |
| `<origin_datetime>` | オプション。アライメントの開始点。datetime型をサポートします。指定されない場合、デフォルトは0001-01-01T00:00:00です。 |

## Return Value

DATETIME型の値を返し、入力されたdatetimeに基づいて、指定された秒の期間の最も近い値に切り捨てられた時間値を表します。戻り値の精度は入力のdatetimeパラメータの精度と一致します。

- `<period>`が非正数（≤0）の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが指定されない場合、デフォルトで1秒の期間になります。
- `<origin_datetime>`が指定されない場合、デフォルトで0001-01-01 00:00:00を基準とします。
- 入力がDATE型の場合（年、月、日のみを含む）、その時間部分はデフォルトで00:00:00になります。
- スケールを持つdatetimeの場合、すべての小数点以下は0に切り捨てられます。
- `<origin>`の日時が`<period>`より後の場合でも、上記の式に従って計算されますが、期間kは負の値になります。

## Examples

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
