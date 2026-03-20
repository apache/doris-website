---
{
  "title": "ARRAY_REMOVE",
  "description": "配列から指定されたすべての要素を削除します",
  "language": "ja"
}
---
## 説明

配列から指定されたすべての要素を削除します

## 構文

```sql
ARRAY_REMOVE(<arr>, <val>)
```
## パラメータ

| Parameter | デスクリプション |
|--|--|
| `<arr>` | 対応する配列 |
| `<val>` | 指定する要素 |

## Return Value

指定されたすべての要素を削除した後の配列を返します。入力パラメータがNULLの場合、NULLを返します

## Example

```sql
SELECT ARRAY_REMOVE(['test', NULL, 'value'], 'value');
```
```text
+------------------------------------------------+
| array_remove(['test', NULL, 'value'], 'value') |
+------------------------------------------------+
| ["test", null]                                 |
+------------------------------------------------+
```
