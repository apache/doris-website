---
{
    "title": "FIRST_VALUE",
    "language": "ja",
    "description": "FIRSTVALUE() は、ウィンドウパーティション内で並べ替えられた値の集合から最初の値を返すウィンドウ関数です。"
}
---

## 説明

FIRST_VALUE() は、ウィンドウパーティション内で並べ替えられた値の集合から最初の値を返すウィンドウ関数です。NULL 値の扱いは IGNORE NULL オプションで制御できます。

## 構文

```sql
FIRST_VALUE(expr[, ignore_null])
```

## パラメータ
| パラメータ           | 説明                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | 最初の値を取得する式。対応する型: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap |
| ignore_null         | 省略可能な Boolean 型の引数。設定すると NULL 値を無視し、最初の NULL でない値を返します。 |

## 戻り値

入力式と同じデータ型の値を返します。

## 例

```sql
WITH example_data AS (
    SELECT 1 as column1, NULL as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, NULL, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, NULL, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS first_value_default,
    FIRST_VALUE(column2, true) OVER (
        PARTITION BY column1 
        ORDER BY column2
    ) AS first_value_ignore_null
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+---------------------+-------------------------+
| group_name | column1 | column2 | first_value_default | first_value_ignore_null |
+------------+---------+---------+---------------------+-------------------------+
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |      10 |                  10 |                      10 |
| A          |       1 |      20 |                  10 |                      10 |
| B          |       2 |    NULL |                  30 |                    NULL |
| B          |       2 |      30 |                  30 |                      30 |
| B          |       2 |      40 |                  30 |                      30 |
+------------+---------+---------+---------------------+-------------------------+
```
