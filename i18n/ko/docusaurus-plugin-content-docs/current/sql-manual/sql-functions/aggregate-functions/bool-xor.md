---
{
    "title": "BOOL_XOR",
    "language": "ko",
    "description": "표현식의 NULL이 아닌 모든 값에 대해 논리 XOR 집계를 수행합니다."
}
---

## 설명 {#description}

표현식의 NULL이 아닌 모든 값에 대해 논리 XOR 집계를 수행합니다.

## 별칭 {#alias}

- BOOLXOR_AGG

## 구문 {#syntax}

```text
BOOL_XOR(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 논리 XOR로 집계할 표현식입니다. BOOLEAN 타입과 0/non-0 규칙(0은 FALSE, non-0은 TRUE)에 따라 boolean으로 변환할 수 있는 숫자 타입을 지원합니다. |

## 반환값 {#return-value}

반환값의 타입은 BOOLEAN입니다. NULL이 아닌 모든 값 중 TRUE가 하나만 있으면 TRUE를 반환하고, 그 외에는 FALSE를 반환합니다.

표현식의 모든 값이 NULL이거나 표현식이 비어 있으면 이 함수는 NULL을 반환합니다.

## 예제 {#examples}

테이블 초기화:
```sql
CREATE TABLE IF NOT EXISTS test_boolean_agg (
     id INT,
     c1 BOOLEAN,
     c2 BOOLEAN,
     c3 BOOLEAN,
     c4 BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO test_boolean_agg (id, c1, c2, c3, c4) values 
(1, true, true, true, false),
(2, true, false, false, false),
(3, true, true, false, false),
(4, true, false, false, false);
```

### 집계 함수 {#aggregate-function}

```sql
SELECT BOOLXOR_AGG(c1), BOOLXOR_AGG(c2), BOOLXOR_AGG(c3), BOOLXOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| BOOLXOR_AGG(c1) | BOOLXOR_AGG(c2) | BOOLXOR_AGG(c3) | BOOLXOR_AGG(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               0 |               0 |               1 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

BOOL_XOR는 숫자 타입도 입력받으며, 영이 아닌 값은 TRUE로 처리합니다:
```sql
CREATE TABLE test_numeric_and_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_and_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_XOR(c_int) AS bool_xor_int,
    BOOL_XOR(c_float) AS bool_xor_float,
    BOOL_XOR(c_decimal) AS bool_xor_decimal,
    BOOL_XOR(c_bool) AS bool_xor_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_xor_int | bool_xor_float | bool_xor_decimal | bool_xor_bool |
+--------------+----------------+------------------+---------------+
|            0 |              0 |                1 |          NULL |
+--------------+----------------+------------------+---------------+
```

### 윈도우 함수 {#window-function}
다음 예제는 (id > 2) 조건에 따라 행을 두 그룹으로 나누고,
윈도우 집계 결과를 표시합니다:
```sql
SELECT * FROM test_boolean_agg;
```
```text
+------+------+------+------+------+
| id   | c1   | c2   | c3   | c4   |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
```sql
SELECT
    id,
    BOOLXOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLXOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLXOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLXOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    0 |    1 |    1 |    0 |
|    2 |    0 |    1 |    1 |    0 |
|    3 |    0 |    1 |    0 |    0 |
|    4 |    0 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### 오류 예제: {#error-example}
```sql
SELECT BOOL_XOR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_xor requires a boolean or numeric argument
``` 
