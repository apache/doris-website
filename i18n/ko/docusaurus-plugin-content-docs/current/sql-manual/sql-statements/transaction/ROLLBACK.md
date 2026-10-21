---
{
    "title": "ROLLBACK",
    "language": "ko",
    "description": "명시적 트랜잭션을 롤백합니다. BEGIN과 함께 사용합니다."
}
---

## 설명 {#description}

명시적 트랜잭션을 롤백합니다. [BEGIN](./BEGIN)과 함께 사용합니다.

## 구문 {#syntax}

```sql
ROLLBACK
```

## 사용 시 주의 사항 {#usage-notes}

- 명시적 트랜잭션을 시작하지 않은 경우, 이 명령을 실행해도 아무런 효과가 없습니다.

## 예제 {#examples}

다음 예제에서는 `test`라는 테이블을 생성하고 트랜잭션을 시작한 다음, 두 행의 데이터를 삽입하고 트랜잭션을 롤백한 후 쿼리를 실행합니다.

```sql
CREATE TABLE `test` (
  `ID` int NOT NULL,
  `NAME` varchar(100) NULL,
  `SCORE` int NULL
) ENGINE=OLAP
DUPLICATE KEY(`ID`)
DISTRIBUTED BY HASH(`ID`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

BEGIN;
INSERT INTO test VALUES(1, 'Bob', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
ROLLBACK;
SELECT * FROM test;
```
