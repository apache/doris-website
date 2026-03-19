---
{
  "title": "ARRAY_SIZE",
  "description": "配列内の要素数を数える",
  "language": "ja"
}
---
## 説明

配列内の要素数を数える

## エイリアス

- SIZE
- CARDINALITY

## 構文

```sql
ARRAY_SIZE(<arr>) 
```
## パラメータ

| Parameter | デスクリプション |
|--|--|
| `<arr>` | 計算対象の配列 |

## Return Value

配列内の要素数を返します。入力配列がNULLの場合、NULLを返します。

## Example

```sql
SELECT ARRAY_SIZE(['a', 'b', 'c']),ARRAY_SIZE(NULL),ARRAY_SIZE([]);
```
```text
+------------------------------+---------------------+-----------------+
| cardinality(['a', 'b', 'c']) | cardinality(NULL)   | cardinality([]) |
+------------------------------+---------------------+-----------------+
|                            3 |                NULL |               0 |
+------------------------------+---------------------+-----------------+
```
