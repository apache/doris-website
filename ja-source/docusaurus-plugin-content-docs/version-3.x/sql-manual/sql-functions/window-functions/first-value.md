---
{
  "title": "FIRST_VALUE",
  "description": "FIRSTVALUE()は、ウィンドウパーティション内の順序付けられた値のセットから最初の値を返すウィンドウ関数です。",
  "language": "ja"
}
---
## 説明

FIRST_VALUE()は、ウィンドウパーティション内の順序付けされた値セットにおいて最初の値を返すウィンドウ関数です。null値の処理は、IGNORE NULLSオプションを使用して制御できます。

## 構文

```sql
FIRST_VALUE(expr[, ignore_null])
```
## パラメータ
| Parameter           | デスクリプション                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | 最初の値を取得する対象の式                                                                    |
| ignore_null         | オプション。設定された場合、null値は無視され、最初の非null値が返される                                     |

## 戻り値

入力式と同じデータ型を返します。

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
