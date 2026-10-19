---
{
    "title": "MD5",
    "language": "ko",
    "description": "문자열 또는 바이너리의 MD5 128비트 체크섬을 계산합니다."
}
---

## 설명 {#description}

문자열 또는 바이너리의 MD5 128비트 체크섬을 계산합니다.

## 구문 {#syntax}

```sql
MD5( <input> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<input>` | MD5 값을 계산할 입력값으로, 문자열 및 바이너리 타입을 지원합니다. |

## 반환값 {#return-value}

문자열의 MD5 값을 반환합니다.

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
SELECT MD5(vb), MD5(vc) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------+----------------------------------+
| MD5(vb)                          | MD5(vc)                          |
+----------------------------------+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 | 900150983cd24fb0d6963f7d28e17f72 |
| d16fb36f0911f878998c136191af705e | d16fb36f0911f878998c136191af705e |
| NULL                             | NULL                             |
+----------------------------------+----------------------------------+
```
