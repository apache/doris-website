---
{
  "title": "ARRAY_PUSHFRONT",
  "description": "配列の先頭に値を追加する",
  "language": "ja"
}
---
## デスクリプション

配列の先頭に値を追加します

## Syntax

```sql
ARRAY_PUSHFRONT(<arr>, <value>)
```
## パラメータ

| Parameter | デスクリプション |
|--|---|
| `<arr>` | 対応する配列 |
| `<value>` | 追加される値 |

## Return Value

値を追加した後の配列を返します

## Example

```sql
SELECT ARRAY_PUSHFRONT([1, 2], 3),ARRAY_PUSHFRONT([3, 4], 6);
```
```text
+----------------------------+----------------------------+
| array_pushfront([1, 2], 3) | array_pushfront([3, 4], 6) |
+----------------------------+----------------------------+
| [3, 1, 2]                  | [6, 3, 4]                  |
+----------------------------+----------------------------+
```
