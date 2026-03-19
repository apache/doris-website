---
{
  "title": "ARRAY_POPFRONT",
  "description": "配列から最初の要素を削除します。",
  "language": "ja"
}
---
## description

配列から最初の要素を削除します。

## Syntax

```sql
ARRAY_POPFRONT(<arr>)
```
## パラメータ

| Parameter | デスクリプション |
| --- | --- |
| `<arr>` | ARRAY配列 |

## Return Value

最初の要素を削除した後の配列を返します。特別なケース：
- 入力パラメータがNULLの場合、NULLを返します。



## example

```sql
select array_popfront(['test', NULL, 'value']);
```
```text
+-----------------------------------------------------+
| array_popfront(ARRAY('test', NULL, 'value'))        |
+-----------------------------------------------------+
| [NULL, "value"]                                       |
+-----------------------------------------------------+
```
