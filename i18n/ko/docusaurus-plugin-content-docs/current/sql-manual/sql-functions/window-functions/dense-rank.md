---
{
    "title": "DENSE_RANK",
    "language": "ko",
    "description": "DENSERANK()는 그룹 내 순위를 계산하는 데 사용하는 윈도우 함수입니다. RANK()와 달리 DENSERANK()는 건너뛰는 번호 없이 연속된 순위를 반환합니다."
}
---

## 설명 {#description}

DENSE_RANK()는 그룹 내 순위를 계산하는 데 사용하는 윈도우 함수입니다. RANK()와 달리 DENSE_RANK()는 건너뛰는 번호 없이 연속된 순위를 반환합니다. 순위는 1부터 시작하여 차례로 증가합니다. 값이 같으면 같은 순위가 부여됩니다.

## 구문 {#syntax}

```sql
DENSE_RANK()
```

## 반환값 {#return-value}

1부터 시작하는 BIGINT 타입의 순위 값을 반환합니다.

## 예제 {#examples}

준비: `int_t` 테이블을 생성하고 예제에 사용할 행의 데이터 적재를 수행합니다:

```sql
CREATE TABLE int_t (x INT, y INT)
DISTRIBUTED BY HASH(x) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO int_t VALUES
    (1, 1), (1, 2), (1, 2),
    (2, 1), (2, 2), (2, 3),
    (3, 1), (3, 1), (3, 2);
```

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

파티션 내에서 값이 같으면 같은 순위가 부여되며, 순위는 건너뛰는 번호 없이 연속됩니다(이 점이 `DENSE_RANK`와 `RANK`의 차이입니다):

```text
+------+------+------+
| x    | y    | rank |
+------+------+------+
|    1 |    1 |    1 |
|    1 |    2 |    2 |
|    1 |    2 |    2 |
|    2 |    1 |    1 |
|    2 |    2 |    2 |
|    2 |    3 |    3 |
|    3 |    1 |    1 |
|    3 |    1 |    1 |
|    3 |    2 |    2 |
+------+------+------+
```
