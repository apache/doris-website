---
{
  "title": "COSINE_DISTANCE",
  "description": "2つのベクトル間のコサイン距離を計算します（ベクトル値は座標です）",
  "language": "ja"
}
---
## デスクリプション

2つのベクトル間のコサイン距離を計算します（ベクトル値は座標です）

## Syntax

```sql
COSINE_DISTANCE(<array1>, <array2>)
```
## パラメータ

| Parameter | デスクリプション |
|---|--|
| `<array1>` | 最初のベクトル（ベクトル値は座標）。入力配列のサブタイプは：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。要素数はarray2と一致する必要があります |
| `<array2>` | 2番目のベクトル（ベクトル値は座標）。入力配列のサブタイプは：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。要素数はarray1と一致する必要があります |

## Return Value

2つのベクトル間のコサイン距離を返します（ベクトル値は座標）。入力配列がNULLの場合、または配列内の要素がNULLの場合、NULLが返されます。

## Example

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```
```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|            0.007722123286332261 |           0.0015396467945875125 |
+---------------------------------+---------------------------------+
```
