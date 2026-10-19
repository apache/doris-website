---
{
    "title": "SEQUENCE_COUNT",
    "language": "ko",
    "description": "패턴과 일치하는 이벤트 체인의 개수를 셉니다. 이 함수는 서로 겹치지 않는 이벤트 체인을 검색합니다."
}
---

## 설명 {#description}

패턴과 일치하는 이벤트 체인의 개수를 셉니다. 이 함수는 서로 겹치지 않는 이벤트 체인을 검색합니다. 현재 체인이 일치하면 그 이후부터 다음 체인을 검색합니다.

**경고!**

같은 초에 발생한 이벤트는 시퀀스에 배치되는 순서가 정해져 있지 않아 결과에 영향을 줄 수 있습니다.

## 구문 {#syntax}

```sql
SEQUENCE_COUNT(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>]);
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<pattern>` | 패턴 문자열입니다. 아래의 **패턴 구문**을 참조하세요. String 타입을 지원합니다. |
| `<timestamp>` | 시간 데이터를 포함하는 것으로 간주되는 컬럼입니다. Date, DateTime 타입을 지원합니다. |
| `<cond_n>` | 이벤트 체인을 설명하는 조건입니다. Bool 타입을 지원합니다. 조건 인수는 최대 32개까지 전달할 수 있습니다. 이 함수는 이러한 조건에 명시된 이벤트만 고려합니다. 시퀀스에 조건에 명시되지 않은 데이터가 있으면 건너뜁니다. |

**패턴 구문**

- `(?N)`은 N번째 위치의 조건 인수와 일치합니다. 조건에는 `[1, 32]` 범위의 번호가 지정됩니다. 예를 들어, `(?1)`은 `cond_1` 매개변수에 전달된 인수와 일치합니다.

- `.*`는 임의 개수의 이벤트와 일치합니다. 패턴의 이 요소를 세는 데는 조건 인수가 필요하지 않습니다.

- `(?t operator value)`는 두 이벤트 사이에 필요한 시간 간격을 초 단위로 설정합니다.

- `t`를 두 시각의 차이를 초 단위로 나타낸 값으로 정의합니다. 예를 들어, 패턴 `(?1)(?t>1800)(?2)`는 서로 1800초를 초과하는 간격으로 발생하는 이벤트와 일치합니다. 패턴 `(?1)(?t>10000)(?2)`는 서로 10000초를 초과하는 간격으로 발생하는 이벤트와 일치합니다. 이 이벤트들 사이에는 임의의 이벤트가 개수에 제한 없이 있을 수 있습니다. `>=`, `>`, `<`, `<=`, `==` 연산자를 사용할 수 있습니다.


## 반환 값 {#return-value}

패턴과 일치하는, 서로 겹치지 않는 이벤트 체인의 개수입니다.
그룹에 유효한 데이터가 없으면 0을 반환합니다.

## 예제 {#examples}

**일치하는 예제**

```sql
-- Create sample table
CREATE TABLE sequence_count_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test1(uid, date, number) values 
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 

-- Query example
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 3) as c1,
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_count_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    2 |    2 |
+------+------+------+
```

**일치하지 않는 예제**

```sql
-- Create sample table
CREATE TABLE sequence_count_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- Query example
SELECT
    SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 2) as c1,
    SEQUENCE_COUNT('(?1)(?2).*', date, number = 1, number = 2) as c2,
    SEQUENCE_COUNT('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_count_test2;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    0 |    0 |    0 |
+------+------+------+
```

**특수한 예제**

```sql
-- Create sample table
CREATE TABLE sequence_count_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

-- Insert sample data
INSERT INTO sequence_count_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

-- Query example
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5) FROM sequence_count_test3;
```

```text
+----------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

아주 간단한 예제입니다. 함수는 number 값이 5인 이벤트가 number 값이 1인 이벤트 뒤에 오는 이벤트 체인을 찾았습니다. 그 사이에 있는 number 값 7,3,4는 이벤트로 명시되지 않았으므로 건너뛰었습니다. 예제의 이벤트 체인을 검색할 때 이 값도 고려하려면 해당 값에 대한 조건을 추가해야 합니다.

이제 다음 쿼리를 실행합니다.

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 4) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

결과가 다소 혼란스러울 수 있습니다. 이 경우 number 값이 4인 이벤트가 1과 5 사이에 발생했기 때문에 함수는 패턴과 일치하는 이벤트 체인을 찾지 못했습니다. 같은 상황에서 number 값이 6인 조건을 확인했다면 해당 패턴이 집계됩니다.

```sql
SELECT SEQUENCE_COUNT('(?1)(?2)', date, number = 1, number = 5, number = 6) FROM sequence_count_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_count('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
