---
{
  "title": "QUARTER",
  "description": "この関数は、指定された日付が属する四半期（1から4）を返します。各四半期は3か月で構成されます：",
  "language": "ja"
}
---
## 説明

この関数は、指定された日付が属する四半期（1から4）を返します。各四半期は3ヶ月で構成されます：
- 第1四半期：1月から3月
- 第2四半期：4月から6月
- 第3四半期：7月から9月
- 第4四半期：10月から12月

この関数はMySQLの[quarter function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter)と一致しています。

## 構文

```sql
QUARTER(`<date_or_time_expr>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付またはdatetime値。日付/datetimeタイプをサポートします。特定のdatetimeおよび日付フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## Return Value

- 入力日付が属する四半期を表すTINYINTを返します。範囲は1から4です。
- 入力値がNULLの場合、関数はNULLを返します。

## Examples

```sql
-- Quarter 1 (January-March)
SELECT QUARTER('2025-01-16') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Including time component (does not affect result)
SELECT QUARTER('2025-01-16 01:11:10') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Quarter 2 (April-June)
SELECT QUARTER('2023-05-20') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

-- Quarter 3 (July-September)
SELECT QUARTER('2024-09-30 23:59:59') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Quarter 4 (October-December)
SELECT QUARTER('2022-12-01') AS result;
+--------+
| result |
+--------+
|      4 |
+--------+

-- Input is NULL (returns NULL)
SELECT QUARTER(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
