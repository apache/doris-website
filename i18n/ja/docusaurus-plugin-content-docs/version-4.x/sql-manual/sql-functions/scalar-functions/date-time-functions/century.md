---
{
    "title": "CENTURY",
    "language": "ja",
    "description": "指定した日付が属する世紀を返します。入力が無効な場合、またはサポートされる範囲外の場合は NULL を返します。"
}
---

## 説明  
指定した日付が属する世紀を返します。  
入力が無効な場合、またはサポートされる範囲外の場合は NULL を返します。

## 構文  
```sql
CENTURY(`<date_or_time_expr>`)
```

## パラメータ
| パラメータ     | 説明                                                   |
| ------------- | ------------------------------------------------------------- |
| `<date_or_time_expr>` | 世紀を計算する対象の日付または日時の式。 |

## 戻り値
入力した日付が属する世紀を表す整数（INT）を返します。たとえば、1901 年から 2000 年までは 20 世紀に属します。入力が NULL または無効な日付の場合は NULL を返します。

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
