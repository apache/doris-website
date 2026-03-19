---
{
  "title": "ARRAY_REPEAT",
  "language": "ja",
  "description": "n個の繰り返し要素を含む配列を生成する"
}
---
## 説明

n回繰り返される要素を含む配列を生成します

## 構文

```sql
ARRAY_REPEAT(<element>, <n>)
```
## パラメータ

| Parameter | Description |
|--|--|
| `<n>` | 桁数 |
| `<element>` | 要素の指定 |

## 戻り値

n個の繰り返し要素を含む配列を返します。array_with_constantはarray_repeatと同じ機能を持ち、hive構文形式との互換性のために使用されます。

## 例

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
