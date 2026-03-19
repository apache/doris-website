---
{
  "title": "ARRAY_POPBACK",
  "description": "配列から最後の要素を削除します。",
  "language": "ja"
}
---
## description

配列から最後の要素を削除します。

## Syntax

```sql
ARRAY_POPBACK(<arr>)
```
## パラメータ

| Parameter | デスクリプション |
| --- | --- |
| `<arr>` | ARRAY配列 |

## Return Value

最後の要素を削除した配列を返します。特殊ケース：
- 入力パラメータがNULLの場合、NULLを返します。

## example

```sql
select array_popback(['test', NULL, 'value']);
```
```text
+-----------------------------------------------------+
| array_popback(ARRAY('test', NULL, 'value'))         |
+-----------------------------------------------------+
| ["test", NULL]                                        |
+-----------------------------------------------------+
```
