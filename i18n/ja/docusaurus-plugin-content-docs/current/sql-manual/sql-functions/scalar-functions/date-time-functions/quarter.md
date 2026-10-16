---
{
    "title": "QUARTER",
    "language": "ja",
    "description": "指定した日付が属する四半期（1～4）を返します。各四半期は次の三か月で構成されます。"
}
---

## 説明

指定した日付が属する四半期（1～4）を返します。各四半期は次の三か月で構成されます。
- 第 1 四半期：一月～三月
- 第 2 四半期：四月～六月
- 第 3 四半期：七月～九月
- 第 4 四半期：十月～十二月

この関数は MySQL の [QUARTER 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter)と同じ動作をします。

## 構文

```sql
QUARTER(`<date_or_time_expr>`)
```

## パラメーター

| パラメーター | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付または日時の値。DATE、DATETIME、TIMESTAMP_NS 型をサポートします。日時と日付の具体的な形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と [DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

- 入力した日付が属する四半期を表す、1～4 の TINYINT 型の値を返します。
- 入力値が NULL の場合は NULL を返します。

## 例

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
