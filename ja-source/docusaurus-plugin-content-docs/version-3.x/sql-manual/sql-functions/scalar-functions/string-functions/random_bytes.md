---
{
  "title": "RANDOM_BYTES",
  "description": "RANDOMBYTES関数は、指定された長さのランダムなバイト列を生成するために使用されます。",
  "language": "ja"
}
---
## 説明

RANDOM_BYTES関数は、指定された長さのランダムなバイト列を生成するために使用されます。

## 構文

```sql
RANDOM_BYTES( <len> )
```
## パラメータ

| Parameter | デスクリプション                                                                                                                                               |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<len>`   | このパラメータは生成されるランダムバイトシーケンスの長さを指定します。この値は0より大きい必要があり、そうでなければエラーが発生します。 |

## Return Value

指定された長さのランダムバイトシーケンスを16進数でエンコードして返します。特殊なケース：

- いずれかのパラメータがNULLの場合、NULLが返されます。

## Examples

```sql
select random_bytes(7);
```
```text
+------------------+
| random_bytes(7)  |
+------------------+
| 0x869684a082ab4b |
+------------------+
```
```sql
select random_bytes(-1);
```
```text
(1105, 'errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.')
```
