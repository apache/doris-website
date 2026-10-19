---
{
    "title": "XXHASH_32",
    "language": "ko",
    "description": "입력 문자열 또는 바이너리의 32비트 xxhash 값을 계산합니다."
}
---

## 설명 {#description}

입력 문자열 또는 바이너리의 32비트 xxhash 값을 계산합니다.

## 구문 {#syntax}

```sql
XXHASH_32( <input> [ , <input> ... ] )
```

## 매개변수 {#parameters}

| 매개변수 | 설명      |
|-----------|------------------|
| `<input>`   | 32비트 xxhash 값을 계산할 입력으로, 문자열 및 바이너리 타입을 허용합니다. |

## 반환값 {#return-value}

입력 문자열의 32비트 xxhash 값을 반환합니다.

## 예제 {#examples}

```sql
select xxhash_32(NULL), xxhash_32("hello"), xxhash_32("hello", "world");
```

```text
+-----------------+--------------------+-----------------------------+
| xxhash_32(NULL) | xxhash_32('hello') | xxhash_32('hello', 'world') |
+-----------------+--------------------+-----------------------------+
|            NULL |          -83855367 |                  -920844969 |
+-----------------+--------------------+-----------------------------+
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
SELECT XXHASH_32(vb), XXHASH_32(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+---------------+---------------+
| XXHASH_32(vb) | XXHASH_32(vc) |
+---------------+---------------+
|     852579327 |     852579327 |
|    -242012205 |    -242012205 |
|          NULL |          NULL |
+---------------+---------------+
```
