---
{
  "title": "ARRAY_WITH_CONSTANT",
  "description": "n個の繰り返し要素を含む配列を生成します",
  "language": "ja"
}
---
## 説明

n個の繰り返し要素を含む配列を生成します

## 構文

```sql
ARRAY_WITH_CONSTANT(<n>, <element>)
```
## パラメータ

| Parameter | デスクリプション |
|--|--|
| `<n>` | 桁数 |
| `<element>` | 要素の指定 |

## Return Value

n個の繰り返し要素を含む配列を返します。array_repeatはarray_with_constantと同じ機能を持ち、hive構文形式との互換性を保つために使用されます。

## Example

```sql
SELECT ARRAY_WITH_CONSTANT(2, "hello"),ARRAY_WITH_CONSTANT(3, 12345);
```
```text
+---------------------------------+-------------------------------+
| array_with_constant(2, 'hello') | array_with_constant(3, 12345) |
+---------------------------------+-------------------------------+
| ["hello", "hello"]              | [12345, 12345, 12345]         |
+---------------------------------+-------------------------------+
```
