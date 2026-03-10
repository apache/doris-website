---
{
  "title": "ARRAY_POPBACK",
  "language": "ja",
  "description": "配列から最後の要素を削除する。"
}
---
## description

配列から最後の要素を削除します。

## Syntax

```sql
ARRAY_POPBACK(<arr>)
```
## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<arr>` | ARRAY配列 |

## 戻り値

最後の要素を削除した後の配列を返します。特殊なケース:
- 入力パラメータがNULLの場合、NULLを返します。

## 例

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
