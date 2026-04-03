---
{
  "title": "ARRAY_POPFRONT",
  "language": "ja",
  "description": "配列から最初の要素を削除する。"
}
---
## description

配列から最初の要素を削除します。

### Syntax

```sql
ARRAY_POPFRONT(<arr>)
```
## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<arr>` | ARRAY配列 |

## 戻り値

最初の要素を削除した後の配列を返します。特殊なケース:
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
