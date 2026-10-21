---
{
    "title": "Lateral View",
    "language": "ko",
    "description": "Doris LATERAL VIEW는 EXPLODE와 같은 생성 함수와 함께 단일 행을 여러 행으로 확장하여 열을 행으로 변환하는 SQL 쿼리를 지원합니다.",
    "keywords": [
        "Doris LATERAL VIEW",
        "열을 행으로 변환",
        "EXPLODE",
        "행을 열로 변환",
        "배열 확장",
        "lateral view explode",
        "SQL에서 한 행을 여러 행으로 변환"
    ]
}
---

<!-- Knowledge type: Syntax reference -->
<!-- Applicable scenario: Array/collection type expansion queries, column to row -->

`LATERAL VIEW`는 Doris에서 제공하는 열을 행으로 변환하는 구문입니다. 생성 함수(예: `EXPLODE`)와 함께 사용하면 행에 있는 컬렉션 타입의 필드를 여러 행으로 확장한 다음, 확장된 결과를 가상 테이블로 간주하여 원래 행과 조인합니다.

## 활용 시나리오 {#applicable-scenarios}

데이터 행에 배열이나 리스트처럼 열거할 수 있는 컬렉션이 포함되어 있고, SQL 쿼리에서 분석하기 위해 컬렉션의 각 요소를 별도의 행으로 분리하려는 경우 `LATERAL VIEW`를 사용할 수 있습니다. 대표적인 활용 시나리오는 다음과 같습니다:

- 행의 배열 필드를 확장하여 각 요소를 원래의 다른 열과 함께 출력합니다.
- 컬렉션의 각 요소에 대해 개별적으로 집계, 필터링 또는 다른 테이블과의 조인을 수행합니다.
- 생성 함수(예: `EXPLODE`, `EXPLODE_SPLIT`)의 출력을 쿼리에서 가상 테이블로 사용합니다.

## 구문 {#syntax}

```sql
LATERAL VIEW generator_function ( expression [, ...] ) table_identifier AS column_identifier [, ...]
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `generator_function` | `EXPLODE` 또는 `EXPLODE_SPLIT`과 같은 생성 함수입니다. |
| `table_identifier` | `generator_function`이 생성한 가상 테이블의 별칭입니다. |
| `column_identifier` | 출력 행의 이름을 지정하는 데 사용하는 열 별칭입니다. 열 별칭의 수는 생성 함수가 반환하는 열의 수와 일치해야 합니다. |

## 사용 예제 {#usage-example}

다음 예제는 `LATERAL VIEW`를 사용하여 열을 행으로 변환하는 쿼리를 수행하는 방법을 보여 줍니다.

### 1. 데이터 준비 {#1-prepare-the-data}

`person` 테이블을 생성하고 테스트 데이터 여러 행을 삽입합니다:

```sql
CREATE TABLE `person` (
  `id` int(11) NULL,
  `name` text NULL,
  `age` int(11) NULL,
  `class` int(11) NULL,
  `address` text NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"in_memory" = "false",
"storage_format" = "V2",
"disable_auto_compaction" = "false"
);

INSERT INTO person VALUES
    (100, 'John', 30, 1, 'Street 1'),
    (200, 'Mary', NULL, 1, 'Street 2'),
    (300, 'Mike', 80, 3, 'Street 3'),
    (400, 'Dan', 50, 4, 'Street 4');
```

### 2. LATERAL VIEW 쿼리 실행 {#2-run-the-lateral-view-query}

`LATERAL VIEW`를 `EXPLODE` 함수와 함께 사용하여 배열 `ARRAY(30, 60)`의 각 요소와 `person` 테이블의 각 행을 데카르트 곱 방식으로 확장합니다:

```sql
SELECT * FROM person
LATERAL VIEW EXPLODE(ARRAY(30, 60)) tableName AS c_age;
```

### 3. 결과 확인 {#3-view-the-result}

쿼리 결과에는 `person` 테이블의 각 행과 `EXPLODE`가 생성한 각 행의 조합이 포함됩니다:

```sql
+------+------+------+-------+----------+-------+
| id   | name | age  | class | address  | c_age |
+------+------+------+-------+----------+-------+
|  100 | John |   30 |     1 | Street 1 |    30 |
|  100 | John |   30 |     1 | Street 1 |    60 |
|  200 | Mary | NULL |     1 | Street 2 |    30 |
|  200 | Mary | NULL |     1 | Street 2 |    60 |
|  300 | Mike |   80 |     3 | Street 3 |    30 |
|  300 | Mike |   80 |     3 | Street 3 |    60 |
|  400 | Dan  |   50 |     4 | Street 4 |    30 |
|  400 | Dan  |   50 |     4 | Street 4 |    60 |
+------+------+------+-------+----------+-------+
8 rows in set (0.12 sec)
```
