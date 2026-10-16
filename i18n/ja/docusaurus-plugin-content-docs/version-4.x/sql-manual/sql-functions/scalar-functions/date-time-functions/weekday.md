---
{
    "title": "WEEKDAY",
    "language": "ja",
    "description": "WEEKDAY 関数は、日付の曜日を表すインデックス値を返します。月曜日は 0、火曜日は 1、日曜日は 6 です。"
}
---

## 説明

WEEKDAY 関数は、日付の曜日を表すインデックス値を返します。月曜日は 0、火曜日は 1、日曜日は 6 です。

WEEKDAY と DAYOFWEEK の違いは次のとおりです。
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```

この関数の動作は、MySQL の [WEEKDAY 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekday) と同じです。

## 構文
```sql
WEEKDAY(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr>` | 入力する日時の値。DATE 型と DATETIME 型をサポートします。日時と日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値
日付の曜日に対応するインデックス値を INT 型で返します。

- 入力が NULL の場合、NULL を返します。

## 使用例

```sql
-- 2023-10-09 is Monday, returns 0
SELECT WEEKDAY('2023-10-09'); 
+-------------------------+
| WEEKDAY('2023-10-09')   |
+-------------------------+
| 0                       |
+-------------------------+

-- 2023-10-15 is Sunday, returns 6
SELECT WEEKDAY('2023-10-15 18:30:00'); 
+----------------------------------+
| WEEKDAY('2023-10-15 18:30:00')   |
+----------------------------------+
| 6                                |
+----------------------------------+

-- Input is NULL, returns NULL
SELECT WEEKDAY(NULL);
+---------------+
| WEEKDAY(NULL) |
+---------------+
|          NULL |
+---------------+
```
