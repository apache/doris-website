---
{
  "title": "ARRAY_WITH_CONSTANT",
  "language": "ja",
  "description": "n個の繰り返し要素を含む配列を生成する"
}
---
## 説明

n個の繰り返し要素を含む配列を生成します

## 構文

```sql
ARRAY_WITH_CONSTANT(<n>, <element>)
```
## パラメータ

| Parameter | Description |
|--|--|
| `<n>` | 桁数 |
| `<element>` | 要素の指定 |

## 戻り値

n回繰り返された要素を含む配列を返します。array_repeatはarray_with_constantと同じ機能を持ち、hive構文形式との互換性のために使用されます。

## 例

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
