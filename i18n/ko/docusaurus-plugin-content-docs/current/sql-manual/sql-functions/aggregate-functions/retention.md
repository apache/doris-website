---
{
    "title": "RETENTION",
    "language": "ko",
    "description": "retention 함수는 특정 조건의 충족 여부를 나타내는 Bool 타입 조건을 1개에서 32개까지 인수로 받습니다. "
}
---

## 설명 {#description}

`retention` 함수는 이벤트에 대해 특정 조건이 충족되었는지를 나타내는 Bool 타입 조건을 1개에서 32개까지 인수로 받습니다. 어떤 조건이든 인수로 지정할 수 있습니다.

첫 번째 조건을 제외한 각 조건은 첫 번째 조건과 쌍으로 적용됩니다. 첫 번째와 두 번째 조건이 모두 true이면 두 번째 결과가 true이고, 첫 번째와 세 번째 조건이 모두 true이면 세 번째 결과가 true이며, 이후도 같은 방식입니다.

간단히 말해 반환 배열의 첫 번째 요소는 `event_1`의 참과 거짓을 나타냅니다. 두 번째 요소는 `event_1`과 `event_2`가 모두 참인지, 세 번째 요소는 `event_1`과 `event_3`가 모두 참인지 나타내며, 이후도 같은 방식입니다. `event_1`이 false이면 모든 요소가 false인 배열을 반환합니다.

## 구문 {#syntax}

```sql
RETENTION(<event_1> [, <event_2>, ... , <event_n>]);
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<event_n>` | `n`번째 이벤트 조건입니다. 타입은 Bool입니다. |

## 반환값 {#returned-value}
- true: 조건을 충족합니다.
- false: 조건을 충족하지 않습니다.
최대 길이가 32인 Bool 배열을 반환하며, 최종 출력 배열의 길이는 입력 매개변수의 개수와 같습니다.
집계에 참여하는 데이터가 없으면 NULL을 반환합니다.
여러 열이 계산에 참여할 때 어느 한 열에 NULL 값이 있으면 해당 행은 집계 계산에 참여하지 않고 제외됩니다.
계산 대상 열에 IFNULL 함수를 사용하여 NULL 값을 처리할 수 있습니다. 자세한 내용은 아래 예제를 참조하세요.

## 예제 {#examples}

1. 예제 테이블을 만들고 예제 데이터를 삽입합니다.

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

2. 사용자 유지율을 계산합니다.

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

3. 특수한 경우의 NULL 값을 처리하기 위해 테이블을 다시 만들고 데이터를 삽입합니다.

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

INSERT into retention_test2 values (0, true, NULL), (1, false, false);

SELECT * FROM retention_test2 ORDER BY uid;
```

```text
+------+------+-------+
| uid  | flag | flag2 |
+------+------+-------+
|    0 |    1 |  NULL |
|    1 |    0 |     0 |
+------+------+-------+
```


4. 빈 테이블을 계산할 때는 집계에 참여하는 데이터가 없으므로 NULL을 반환합니다.

```sql
SELECT RETENTION(flag) AS r FROM retention_test2 WHERE uid IS NULL;
```

```text
+------+
| r    |
+------+
| NULL |
+------+
```

5. 계산에 flag 열만 참여합니다. uid = 0일 때 flag가 true이므로 1을 반환합니다.

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

6. flag와 flag2 열이 계산에 참여할 때 uid = 0인 행은 flag2가 NULL이므로 집계 계산에서 제외됩니다. uid = 1인 행만 집계에 참여하여 0을 반환합니다.

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

7. NULL 값 문제를 해결하려면 IFNULL 함수로 NULL을 false로 변환할 수 있습니다. 그러면 uid = 0인 행과 uid = 1인 행이 모두 집계 계산에 참여합니다.

```sql
select retention(flag,IFNULL(flag2,false)) from retention_test2;
```

```text
+-------------------------------------+
| retention(flag,IFNULL(flag2,false)) |
+-------------------------------------+
| [1, 0]                              |
+-------------------------------------+
```
