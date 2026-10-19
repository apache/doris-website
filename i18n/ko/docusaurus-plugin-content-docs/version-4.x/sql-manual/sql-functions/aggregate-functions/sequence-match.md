---
{
    "title": "SEQUENCE_MATCH",
    "language": "ko",
    "description": "시퀀스에 패턴과 일치하는 이벤트 체인이 포함되어 있는지 확인합니다."
}
---

## 설명 {#description}

시퀀스에 패턴과 일치하는 이벤트 체인이 포함되어 있는지 확인합니다.

**경고!**

같은 초에 발생한 이벤트는 시퀀스 내 순서가 정해져 있지 않을 수 있으며, 이로 인해 결과가 달라질 수 있습니다.


## 구문 {#syntax}

```sql
SEQUENCE_MATCH(<pattern>, <timestamp>, <cond_1> [, <cond_2>, ..., <cond_n>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<pattern>` | 패턴 문자열입니다. 아래의 **패턴 구문**을 참조하세요. String 타입을 지원합니다. |
| `<timestamp>` | 시간 데이터가 포함된 것으로 간주하는 열입니다. Date, DateTime 타입을 지원합니다. |
| `<cond_n>` | 이벤트 체인을 정의하는 조건입니다. Bool 타입을 지원합니다. 조건 인수는 최대 32개까지 전달할 수 있습니다. 함수는 이 조건에 정의된 이벤트만 고려합니다. 시퀀스에 조건에 정의되지 않은 데이터가 있으면 건너뜁니다. |

**패턴 구문**

- `(?N)` — N번째 위치의 조건 인수와 일치합니다. 조건 번호의 범위는 `[1, 32]`입니다. 예를 들어, `(?1)`은 `cond1` 매개변수에 전달된 인수와 일치합니다.

- `.*` — 임의 개수의 이벤트와 일치합니다. 패턴의 이 요소와 일치시키기 위해 조건 인수를 지정할 필요는 없습니다.

- `(?t operator value)` — 두 이벤트 사이에 있어야 하는 시간 간격을 초 단위로 설정합니다.

- `t`는 두 시각의 차이를 초 단위로 나타낸 값으로 정의합니다. 예를 들어, 패턴 `(?1)(?t>1800)(?2)`는 서로 1800초 넘게 떨어져 발생한 이벤트와 일치합니다. 패턴 `(?1)(?t>10000)(?2)`는 서로 10000초 넘게 떨어져 발생한 이벤트와 일치합니다. 이 이벤트들 사이에는 임의의 이벤트가 개수에 제한 없이 존재할 수 있습니다. `>=`, `>`, `<`, `<=`, `==` 연산자를 사용할 수 있습니다.

## 반환값 {#return-value}

1: 패턴과 일치하는 경우입니다.

0: 패턴과 일치하지 않는 경우입니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}

**일치하는 예제**

```sql
CREATE TABLE sequence_match_test1(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test1(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 13:28:02', 2),
(3, '2022-11-02 16:15:01', 1),
(4, '2022-11-02 19:05:04', 2),
(5, '2022-11-02 20:08:44', 3); 


SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 3) as c1,
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>=3600)(?2)', date, number = 1, number = 2) as c3
FROM sequence_match_test1;
```

```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
|    1 |    1 |    1 |
+------+------+------+
```

**일치하지 않는 예제**

```sql
CREATE TABLE sequence_match_test2(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test2(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT 
sequence_match('(?1)(?2)', date, number = 1, number = 2) as c1,
sequence_match('(?1)(?2).*', date, number = 1, number = 2) as c2,
sequence_match('(?1)(?t>3600)(?2)', date, number = 1, number = 7) as c3
FROM sequence_match_test2;
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
CREATE TABLE sequence_match_test3(
    `uid` int COMMENT 'user id',
    `date` datetime COMMENT 'date time', 
    `number` int NULL COMMENT 'number' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_num" = "1"
); 

INSERT INTO sequence_match_test3(uid, date, number) values
(1, '2022-11-02 10:41:00', 1),
(2, '2022-11-02 11:41:00', 7),
(3, '2022-11-02 16:15:01', 3),
(4, '2022-11-02 19:05:04', 4),
(5, '2022-11-02 21:24:12', 5);

SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5)
FROM sequence_match_test3;
```

```text
+----------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5) |
+----------------------------------------------------------------+
|                                                              1 |
+----------------------------------------------------------------+
```

아주 간단한 예제입니다. 함수는 숫자 5가 숫자 1 뒤에 오는 이벤트 체인을 찾았습니다. 그 사이에 있는 숫자 7,3,4는 이벤트로 정의되어 있지 않아 건너뛰었습니다. 예제에 제시된 이벤트 체인을 검색할 때 이 숫자도 고려하려면 해당 숫자에 대한 조건을 만들어야 합니다.

이제 다음 쿼리를 실행합니다.

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 4)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 4) |
+------------------------------------------------------------------------------+
|                                                                            0 |
+------------------------------------------------------------------------------+
```

결과가 다소 혼란스러울 수 있습니다. 이 경우에는 숫자 4에 해당하는 이벤트가 1과 5 사이에 발생했기 때문에 함수가 패턴과 일치하는 이벤트 체인을 찾지 못했습니다. 같은 상황에서 숫자 6에 대한 조건을 검사했다면 시퀀스는 패턴과 일치했을 것입니다.

```sql
SELECT sequence_match('(?1)(?2)', date, number = 1, number = 5, number = 6)
FROM sequence_match_test3;
```

```text
+------------------------------------------------------------------------------+
| sequence_match('(?1)(?2)', `date`, `number` = 1, `number` = 5, `number` = 6) |
+------------------------------------------------------------------------------+
|                                                                            1 |
+------------------------------------------------------------------------------+
```
