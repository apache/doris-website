---
{
  "title": "センチュリー",
  "language": "ja",
  "description": "指定された日付の世紀を返します。入力が無効または サポート範囲外の場合、NULLを返します。"
}
---
## 説明
指定された日付の世紀を返します。
入力が無効または対応範囲外の場合、NULLを返します。

## 構文

```sql
CENTURY(`<date_or_time_expr>`)
```
## パラメータ
| Parameter     | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `<date_or_time_expr>` | 世紀を計算する日付またはdatetime式。 |

## 戻り値
入力日付の世紀を表すinteger（INT）を返します。例えば、1901年から2000年は20世紀に属します。入力がNULLまたは無効な日付の場合、NULLを返します。

## 例

```sql
-- Extract the century from a DATE type
SELECT CENTURY('2024-01-01') AS century_date;
+-----------------+
| century_date    |
+-----------------+
| 21              |
+-----------------+

-- Extract the century from a DATETIME type (ignoring hours, minutes, and seconds)
SELECT CENTURY('2024-05-20 14:30:25') AS century_datetime;
+----------------------+ 
| century_datetime     |
+----------------------+
| 21                   |
+----------------------+

-- Input is NULL (returns NULL)
SELECT CENTURY(NULL) AS null_input;
+----------------+
| null_input     |
+----------------+
| NULL           |
+----------------+

-- Invalid date input (returns NULL)
SELECT CENTURY('10000-01-01') AS invalid_date;
+-------------------+
| invalid_date      |
+-------------------+
| NULL              |
+-------------------+


```
