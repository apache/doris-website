---
{
    "title": "XXHASH_64",
    "language": "ko",
    "description": "입력 문자열 또는 바이너리의 64비트 xxhash 값을 계산합니다."
}
---

## 설명 {#description}

입력 문자열 또는 바이너리의 64비트 xxhash 값을 계산합니다.

- 참고: 테스트 결과, `xxhash_64`의 성능은 `murmur_hash3_64`의 약 두 배이므로, 해시 값을 계산할 때는 `xxhash_64`를 `murmur_hash3_64` 대신 사용하는 것을 권장합니다.

## 구문 {#syntax}

```sql
XXHASH_64( <input> [ , <input> ... ] )
```

## 매개변수 {#parameters}

| 매개변수 | 설명      |
|-----------|------------------|
| `<input>`   | 64비트 xxhash 값을 계산할 입력으로, 문자열 및 바이너리 타입을 허용합니다. |

## 반환 값 {#return-value}

입력 문자열의 64비트 xxhash 값을 반환합니다.

## 예제 {#examples}

```sql
select xxhash_64(NULL), xxhash_64("hello"), xxhash_64("hello", "world");
```

```text
+-----------------+----------------------+-----------------------------+
| xxhash_64(NULL) | xxhash_64('hello')   | xxhash_64('hello', 'world') |
+-----------------+----------------------+-----------------------------+
|            NULL | -7685981735718036227 |         7001965798170371843 |
+-----------------+----------------------+-----------------------------+
```

```sql
-- vb (VarBinary) and vc (VarChar) used the same string during insertion.
SELECT * FROM mysql_catalog.binary_test.binary_test;
```
```text
+------+------------+------+
| id   | vb         | vc   |
+------+------------+------+
|    1 | 0x616263   | abc  |
|    2 | 0x78797A   | xyz  |
|    3 | NULL       | NULL |
+------+------------+------+
```
```sql
SELECT XXHASH_64(vb), XXHASH_64(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------------+---------------------+
| XXHASH_64(vb)       | XXHASH_64(vc)       |
+---------------------+---------------------+
| 8696274497037089104 | 8696274497037089104 |
| 7095089596068863775 | 7095089596068863775 |
|                NULL |                NULL |
+---------------------+---------------------+
```
