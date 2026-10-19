---
{
    "title": "SHA1",
    "language": "ko",
    "description": "SHA1 알고리즘을 사용하여 정보의 해시 값을 계산합니다."
}
---

## 설명 {#description}

SHA1 알고리즘을 사용하여 정보의 해시 값을 계산합니다.

## 별칭 {#alias}
SHA

## 구문 {#syntax}

``` sql
SHA1( <input> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명         |
|-----------|-------------|
| `<input>`   | sha1 값을 계산할 입력값으로, 문자열 및 바이너리 타입을 허용합니다. |

## 반환 값 {#return-value}

입력 문자열의 sha1 값을 반환합니다.


## 예제 {#examples}

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
SELECT SHA1(vb), SHA1(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+------------------------------------------+------------------------------------------+
| SHA1(vb)                                 | SHA1(vc)                                 |
+------------------------------------------+------------------------------------------+
| a9993e364706816aba3e25717850c26c9cd0d89d | a9993e364706816aba3e25717850c26c9cd0d89d |
| 66b27417d37e024c46526c2f6d358a754fc552f3 | 66b27417d37e024c46526c2f6d358a754fc552f3 |
| NULL                                     | NULL                                     |
+------------------------------------------+------------------------------------------+
```
