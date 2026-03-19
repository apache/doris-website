---
{
  "title": "ARRAY_REPEAT",
  "description": "n個の繰り返し要素を含む配列を生成します",
  "language": "ja"
}
---
## 説明

n個の繰り返し要素を含む配列を生成します

## 構文

```sql
ARRAY_REPEAT(<element>, <n>)
```
## パラメータ

| Parameter | デスクリプション |
|--|--|
| `<n>` | 桁数 |
| `<element>` | 要素の指定 |

## Return Value

n個の繰り返し要素を含む配列を返します。array_with_constantはarray_repeatと同じ機能を持ち、hive構文形式との互換性のために使用されます。

## Example

```sql
SELECT ARRAY_REPEAT("hello", 2),ARRAY_REPEAT(12345, 3);
```
```text
+--------------------------+------------------------+
| array_repeat('hello', 2) | array_repeat(12345, 3) |
+--------------------------+------------------------+
| ["hello", "hello"]       | [12345, 12345, 12345]  |
+--------------------------+------------------------+
```
