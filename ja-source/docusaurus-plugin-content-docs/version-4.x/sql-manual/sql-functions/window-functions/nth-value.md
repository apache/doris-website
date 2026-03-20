---
{
  "title": "NTH_VALUE",
  "description": "NTHVALUE()は、ウィンドウパーティション内の順序付けられたデータセットにおいて、N番目の値を返すために使用されるウィンドウ関数です。",
  "language": "ja"
}
---
## デスクリプション

NTH_VALUE()は、ウィンドウパーティション内の順序付けられたデータセットからN番目の値を返すために使用されるウィンドウ関数です。Nがウィンドウの有効なサイズを超える場合、結果としてNULLを返します。

## Syntax

```sql
NTH_VALUE(<expr>, <offset>)
```
## パラメータ
| パラメータ           | 説明                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | 値を取得する対象の式。サポートされている型: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                                    |
| offset         | bigint型。パラメータoffsetは0より大きい正の整数である必要があり、取得するN番目の要素の値を示します。開始インデックスは1です。                                    |

## 戻り値

入力式と同じデータ型を返します。

## 例

```sql
WITH example_data AS (
    SELECT 1 as column1, 66 as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, 66, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, 66, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    NTH_VALUE(column2, 2) OVER (
        PARTITION BY column1 
        ORDER BY column2
        ROWS BETWEEN 1 preceding and 1 following
    ) as nth
FROM example_data
ORDER BY column1, column2;
```
```text
+------------+---------+---------+------+
| group_name | column1 | column2 | nth  |
+------------+---------+---------+------+
| A          |       1 |      10 |   20 |
| A          |       1 |      20 |   20 |
| A          |       1 |      66 |   66 |
| A          |       1 |      66 |   66 |
| B          |       2 |      30 |   40 |
| B          |       2 |      40 |   40 |
| B          |       2 |      66 |   66 |
+------------+---------+---------+------+
```
