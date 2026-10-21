---
{
    "title": "BOOL_OR",
    "language": "ko",
    "description": "표현식에서 NULL이 아닌 모든 값에 대해 논리 OR 집계를 수행합니다."
}
---

## 설명 {#description}

표현식에서 NULL이 아닌 모든 값에 대해 논리 OR 집계를 수행합니다.

## 별칭 {#alias}

- BOOLOR_AGG

## 구문 {#syntax}

```text
BOOL_OR(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 논리 OR로 집계할 표현식입니다. BOOLEAN 타입과 0/non-0 규칙(0은 FALSE, 0이 아닌 값은 TRUE)에 따라 boolean으로 변환할 수 있는 숫자 타입을 지원합니다. |

## 반환 값 {#return-value}

반환 값의 타입은 BOOLEAN입니다. NULL이 아닌 값 중 하나 이상이 TRUE이면 TRUE를 반환하고, 그렇지 않으면 FALSE를 반환합니다.

표현식의 모든 값이 NULL이거나 표현식이 비어 있으면 함수는 NULL을 반환합니다.

## 예제 {#examples}

준비 :
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

### 집계 함수: {#aggregate-function}
```sql
SELECT BOOLOR_AGG(c1), BOOLOR_AGG(c2), BOOLOR_AGG(c3), BOOLOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+----------------+----------------+----------------+----------------+
| BOOLOR_AGG(c1) | BOOLOR_AGG(c2) | BOOLOR_AGG(c3) | BOOLOR_AGG(c4) |
+----------------+----------------+----------------+----------------+
|              1 |              1 |              1 |              0 |
+----------------+----------------+----------------+----------------+
```


BOOL_OR는 숫자 타입도 지원하며, 영이 아닌 값은 `TRUE`로 처리됩니다:
```sql
CREATE TABLE test_numeric_or_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_or_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_OR(c_int) AS bool_or_int,
    BOOL_OR(c_float) AS bool_or_float,
    BOOL_OR(c_decimal) AS bool_or_decimal,
    BOOL_OR(c_bool) AS bool_or_bool
FROM test_numeric_or_null;
```
```text
+-------------+---------------+-----------------+--------------+
| bool_or_int | bool_or_float | bool_or_decimal | bool_or_bool |
+-------------+---------------+-----------------+--------------+
|           1 |             1 |               1 |         NULL |
+-------------+---------------+-----------------+--------------+
```

### 윈도우 함수: {#window-function}
다음 예제는 (id > 2) 조건에 따라 행을
두 그룹으로 분할하고, 윈도우 집계 결과를 표시합니다:
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
    BOOLOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    1 |    1 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### 오류 예제: {#error-example}
```sql
SELECT BOOL_OR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_or requires a boolean or numeric argument
```
