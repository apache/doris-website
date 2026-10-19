---
{
    "title": "MURMUR_HASH3_64_V2",
    "language": "ko",
    "description": "부호 있는 64비트 MurmurHash3 해시 값을 계산합니다."
}
---

## 설명 {#description}

부호 있는 64비트 MurmurHash3 해시 값을 계산합니다. 부호 없는 버전은 [murmur_hash3_u64_v2](./murmur-hash3-u64-v2.md)를 참조하세요.

`MURMUR_HASH3_64`와의 차이점은 이 버전이 MurmurHash3의 128비트 처리 함수를 재사용하여 첫 번째 64비트 해시 값만 출력한다는 점입니다. 이는 [표준 라이브러리](https://mmh3.readthedocs.io/en/latest/api.html#mmh3.hash64)의 구현과 일치합니다.

참고: 테스트 결과, `xxhash_64`의 성능은 `murmur_hash3_64`의 약 2배입니다. 따라서 해시 값을 계산할 때는 `xxhash_64`를 `murmur_hash3_64` 대신 사용하는 것이 좋습니다.

## 구문 {#syntax}

```sql
MURMUR_HASH3_64_V2( <str> [ , <str> ... ] )
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                           |
| --------- | ----------------------------------------------------- |
| `<str>`   | 64비트 MurmurHash3 해시를 계산할 값 |

## 반환 값 {#return-value}

입력 문자열의 64비트 MurmurHash3 해시 값을 반환합니다.

매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select murmur_hash3_64_v2(null), murmur_hash3_64_v2("hello"), murmur_hash3_64_v2("hello", "world");
```

```text
+--------------------------+-----------------------------+--------------------------------------+
| murmur_hash3_64_v2(null) | murmur_hash3_64_v2("hello") | murmur_hash3_64_v2("hello", "world") |
+--------------------------+-----------------------------+--------------------------------------+
|                     NULL |        -3758069500696749310 |                  -662943091231200135 |
+--------------------------+-----------------------------+--------------------------------------+
```

```sql
-- The function outputs a signed 64-bit integer.
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
