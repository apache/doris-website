---
{
    "title": "RETENTION",
    "language": "ko",
    "description": "retention 함수는 특정 조건의 충족 여부를 나타내는 Bool 타입 조건을 1개에서 32개까지 인수로 받습니다 "
}
---

## 설명 {#description}

`retention` 함수는 이벤트에서 특정 조건이 충족되었는지를 나타내는 Bool 타입 조건을 1개에서 32개까지 인수로 받습니다. 어떤 조건이든 인수로 지정할 수 있습니다.

첫 번째 조건을 제외한 나머지 조건은 첫 번째 조건과 쌍으로 평가됩니다. 두 번째 결과는 첫 번째와 두 번째 조건이 모두 true일 때 true가 되고, 세 번째 결과는 첫 번째와 세 번째 조건이 모두 true일 때 true가 되는 식입니다.

간단히 말해, 반환값 배열의 첫 번째 원소는 `event_1`이 true인지 false인지를 나타내고, 두 번째 원소는 `event_1`과 `event_2`가 모두 true인지를 나타냅니다. 세 번째 원소는 `event_1`이 true이고 `event_3`도 true인지를 나타내며, 이후도 같은 방식으로 이어집니다. `event_1`이 false이면 모든 원소가 false인 배열을 반환합니다.

## 구문 {#syntax}

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<event_n>` | `n`번째 이벤트 조건으로, Bool 타입입니다. |

## 반환값 {#returned-value}
- true: 조건을 충족합니다.
- false: 조건을 충족하지 않습니다.
최대 길이가 32인 Bool 배열을 반환하며, 최종 출력 배열의 길이는 입력 매개변수 개수와 같습니다.
집계에 참여하는 데이터가 없으면 NULL 값을 반환합니다.
여러 열이 계산에 사용되는 경우, 어느 열이든 NULL 값이 있으면 해당 NULL 값이 있는 행은 집계 계산에서 제외되어 바로 삭제됩니다.
계산에 사용되는 열에 IFNULL 함수를 적용하여 NULL 값을 처리할 수 있습니다. 자세한 내용은 아래 예제를 참고하세요.

## 예제 {#examples}

1. 샘플 테이블 생성 및 샘플 데이터 삽입

```sql
CREATE TABLE retention_test(
    `uid` int COMMENT 'user id', 
    `date` datetime COMMENT 'date time' 
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test values 
(0, '2022-10-12'),
(0, '2022-10-13'),
(0, '2022-10-14'),
(1, '2022-10-12'),
(1, '2022-10-13'),
(2, '2022-10-12');
```

2. 사용자 retention 계산

```sql
SELECT 
    uid,     
    RETENTION(date = '2022-10-12') AS r,
    RETENTION(date = '2022-10-12', date = '2022-10-13') AS r2,
    RETENTION(date = '2022-10-12', date = '2022-10-13', date = '2022-10-14') AS r3 
FROM retention_test 
GROUP BY uid 
ORDER BY uid ASC;
```

```text
+------+------+--------+-----------+
| uid  | r    | r2     | r3        |
+------+------+--------+-----------+
|    0 | [1]  | [1, 1] | [1, 1, 1] |
|    1 | [1]  | [1, 1] | [1, 1, 0] |
|    2 | [1]  | [1, 0] | [1, 0, 0] |
+------+------+--------+-----------+
```

3. 특수한 경우의 NULL 값 처리를 위해 테이블을 다시 생성하고 데이터 삽입

```sql
CREATE TABLE retention_test2(
    `uid` int, 
    `flag` boolean,
    `flag2` boolean
) DUPLICATE KEY(uid) 
DISTRIBUTED BY HASH(uid) BUCKETS AUTO
PROPERTIES ( 
    "replication_allocation" = "tag.location.default: 1"
);

INSERT into retention_test2 values (0, false, false), (1, true,  NULL);

SELECT * from retention_test2;
```

```text
+------+------+-------+
| uid  | flag | flag2 |
+------+------+-------+
|    0 |    1 |  NULL |
|    1 |    0 |     0 |
+------+------+-------+
```


4. 빈 테이블에서 계산을 수행하면 집계에 참여하는 데이터가 없으므로 NULL 값을 반환합니다.

```sql
SELECT RETENTION(date = '2022-10-12') AS r FROM retention_test2 where uid is NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```

5. flag 열만 계산에 사용됩니다. uid = 0인 행에서 flag가 true이므로 1을 반환합니다.

```sql
select retention(flag) from retention_test2;
```

```text
+-----------------+
| retention(flag) |
+-----------------+
| [1]             |
+-----------------+
```

6. flag와 flag2 열이 계산에 사용되는 경우, uid = 0인 행은 flag2가 NULL이므로 집계 계산에서 제외됩니다. uid = 1인 행만 집계에 참여하므로 반환값은 0입니다.

```sql
select retention(flag,flag2) from retention_test2;
```

```text
+-----------------------+
| retention(flag,flag2) |
+-----------------------+
| [0, 0]                |
+-----------------------+
```

7. NULL 값 문제를 해결하려면 IFNULL 함수를 사용하여 NULL을 false로 변환할 수 있습니다. 이렇게 하면 uid = 0인 행과 uid = 1인 행이 모두 집계 계산에 포함됩니다.

```sql
select retention(flag,IFNULL(flag2,false)) from retention_test2;;
```

```text
+-------------------------------------+
| retention(flag,IFNULL(flag2,false)) |
+-------------------------------------+
| [1, 0]                              |
+-------------------------------------+
```
