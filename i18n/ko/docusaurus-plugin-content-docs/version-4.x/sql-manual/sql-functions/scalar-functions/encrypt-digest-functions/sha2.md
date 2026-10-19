---
{
    "title": "SHA2",
    "language": "ko",
    "description": "SHA2를 사용하여 정보의 다이제스트를 생성합니다."
}
---

## 설명 {#description}

SHA2를 사용하여 정보의 다이제스트를 생성합니다.

## 구문 {#syntax}

```sql
SHA2( <input>, <digest_length>)
```

## 매개변수 {#parameters}

| 매개변수         | 설명                |
|-------------------|----------------------------|
| `<input>`           | 암호화할 내용. 문자열 및 바이너리 타입을 지원합니다      |
| `<digest_length>` | 다이제스트 길이. 224, 256, 384, 512를 지원하며 상수여야 합니다 |

## 반환 값 {#return-value}

입력 문자열의 sha2 값을 반환합니다.

## 예제 {#examples}

```sql
select sha2('abc', 224), sha2('abc', 384), sha2(NULL, 512);
```

```text
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| sha2('abc', 224)                                         | sha2('abc', 384)                                                                                 | sha2(NULL, 512) |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 | NULL            |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
```

```SQL
select sha2('abc', 225);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = sha2 functions only support digest length of [224, 256, 384, 512]
```

두 번째 인수(`<digest_length>`)는 리터럴이어야 합니다. 값이 유효하더라도 컬럼 참조를 전달하면 실패합니다:

```sql
-- setup
CREATE TABLE str (k0 VARCHAR(64), k1 INT)
DISTRIBUTED BY HASH(k0) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO str VALUES ('hello', 224), ('world', 256);
```

```SQL
select sha2('str', k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

```SQL
select sha2(k0, k1) from str;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = the second parameter of sha2 must be a literal but got: k1
```

다음 두 예제는 동작을 설명하기 위한 예제입니다. 이 예제에는 `mysql_catalog`라는 이름의 외부 MySQL Catalog와 그 안의 `binary_test.binary_test`가 필요하며, 대부분의 클러스터에는 이러한 구성이 설정되어 있지 않습니다. 이 예제는 실제 바이트가 같으면 `SHA2`가 `VARBINARY` 컬럼과 `VARCHAR` 컬럼에 대해 동일한 다이제스트를 생성한다는 것을 보여 줍니다.

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
SELECT SHA2(vb, 224), SHA2(vc, 224) FROM mysql_catalog.binary_test.binary_test;
```
```text
+----------------------------------------------------------+----------------------------------------------------------+
| SHA2(vb, 224)                                            | SHA2(vc, 224)                                            |
+----------------------------------------------------------+----------------------------------------------------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 |
| 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 | 30e90f1cd0ceff8eb3dd6a540a605c0666f841d35de63c57e4dd2877 |
| NULL                                                     | NULL                                                     |
+----------------------------------------------------------+----------------------------------------------------------+
```
