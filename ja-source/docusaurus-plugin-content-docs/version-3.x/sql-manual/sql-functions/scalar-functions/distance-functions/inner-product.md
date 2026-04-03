---
{
  "title": "INNER_PRODUCT",
  "description": "同じサイズの2つのベクトルのスカラー積を計算します",
  "language": "ja"
}
---
## 説明

同じサイズの2つのベクトルのスカラー積を計算します

## 構文

```sql
INNER_PRODUCT(<array1>, <array2>)
```
## パラメータ

| Parameter | デスクリプション |
| -- |--|
| `<array1>` | 最初のベクトル。入力配列のサブタイプは次をサポートします：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。要素数はarray2と一致している必要があります |
| `<array2>` | 2番目のベクトル。入力配列のサブタイプは次をサポートします：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。要素数はarray1と一致している必要があります |

## Return Value

同じサイズの2つのベクトルのスカラー積を返します。入力配列がNULLの場合、または配列内の任意の要素がNULLの場合、NULLが返されます。

## Examples

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```
```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```
