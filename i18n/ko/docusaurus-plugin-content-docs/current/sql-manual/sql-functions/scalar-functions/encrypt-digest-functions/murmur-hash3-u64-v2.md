---
{
    "title": "MURMUR_HASH3_U64_V2",
    "language": "ko",
    "description": "부호 없는 64비트 MurmurHash3 해시 값을 계산합니다."
}
---

## 설명 {#description}

부호 없는 64비트 MurmurHash3 해시 값을 계산하고 LARGEINT 타입으로 반환합니다. 부호 있는 버전은 [murmur_hash3_64_v2](./murmur-hash3-64-v2.md)를 참조하세요.

이 함수는 `MURMUR_HASH3_64_V2`의 구현을 재사용하고 결과를 부호 없는 64비트 범위(0~2^64-1)로 마스킹합니다. 이 결과는 부호 없는 값으로 해석했을 때 [표준 라이브러리](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64)의 구현과 일치합니다.

## 구문 {#syntax}

```sql
MURMUR_HASH3_U64_V2( <str> [ , <str> ... ] )
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                                  |
| --------- | ------------------------------------------------------------ |
| `<str>`   | 부호 없는 64비트 MurmurHash3 해시를 계산할 String 타입 값 |

## 반환 값 {#return-value}

입력 문자열의 부호 없는 64비트 MurmurHash3 해시 값을 LARGEINT 타입으로 반환합니다.

매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select murmur_hash3_u64_v2(null), murmur_hash3_u64_v2("hello"), murmur_hash3_u64_v2("hello", "world");
```

```text
+----------------------------+-------------------------------+----------------------------------------+
| murmur_hash3_u64_v2(null)  | murmur_hash3_u64_v2("hello")  | murmur_hash3_u64_v2("hello", "world")  |
+----------------------------+-------------------------------+----------------------------------------+
|                       NULL |          14688674573012802306 |                   17783800982478351481 |
+----------------------------+-------------------------------+----------------------------------------+
```


```sql
-- The function outputs an unsigned 64-bit integer.
SELECT
    mmhash3_64_v2,
    mmhash3_u64_v2,
    i64_to_ui64 = mmhash3_u64_v2 AS is_equal
FROM (
    SELECT
        murmur_hash3_64_v2('1013199993_1756808272') AS mmhash3_64_v2,
        murmur_hash3_u64_v2('1013199993_1756808272') AS mmhash3_u64_v2,
        CAST(murmur_hash3_64_v2('1013199993_1756808272') AS LARGEINT) & 18446744073709551615 AS i64_to_ui64
) t;
```
```text
+----------------------+----------------------+----------+
| mmhash3_64_v2        | mmhash3_u64_v2       | is_equal |
+----------------------+----------------------+----------+
| -2648103510258542450 | 15798640563451009166 |        1 |
+----------------------+----------------------+----------+
```
