---
{
  "title": "CRC32",
  "description": "CRC32を使用して結果を計算します。",
  "language": "ja"
}
---
## 説明

CRC32を使用して結果を計算します。

## 構文

```sql
CRC32( <str> )
```
## パラメータ

| parameter | description |
| -- | -- |
| `<str>` | CRC計算に使用される値 |

## Return Value

この文字列のCyclic Redundancy Check値を返します。

## Examples

```sql
select crc32("abc"),crc32("中国");
```
```text
+--------------+-----------------+
| crc32('abc') | crc32('中国')   |
+--------------+-----------------+
|    891568578 |       737014929 |
+--------------+-----------------+
```
