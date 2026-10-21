---
{
    "title": "MURMUR_HASH3_32",
    "language": "ko",
    "description": "32비트 murmur3 해시 값을 계산합니다"
}
---

## 설명 {#description}

32비트 murmur3 해시 값을 계산합니다

- 참고: 해시 값을 계산할 때는 `xxhash_32`를 `murmur_hash3_32` 대신 사용하는 것을 권장합니다.

## 구문 {#syntax}

```sql
MURMUR_HASH3_32( <str> [ , <str> ... ] )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------| -- |
| `<str>`   | 계산할 32비트 murmur3 해시 값 |

## 반환 값 {#return-value}

입력 문자열의 32비트 murmur3 해시 값을 반환합니다.

-매개변수가 NULL이면 NULL을 반환합니다

## 예제 {#examples}

```sql
select murmur_hash3_32(null), murmur_hash3_32("hello"), murmur_hash3_32("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_32(NULL) | murmur_hash3_32('hello') | murmur_hash3_32('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |               1321743225 |                         984713481 |
+-----------------------+--------------------------+-----------------------------------+
```
