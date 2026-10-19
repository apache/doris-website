---
{
    "title": "WINDOW_FUNNEL",
    "language": "ko",
    "description": "WINDOWFUNNEL 함수는 지정된 시간 윈도우 내에서 이벤트 체인을 검색하고 최댓값을 계산하여 사용자 행동 시퀀스를 분석합니다."
}
---

## 설명 {#description}

WINDOW_FUNNEL 함수는 지정된 시간 윈도우 내에서 이벤트 체인을 검색하고 이벤트 체인에서 완료된 단계의 최대 개수를 계산하여 사용자 행동 시퀀스를 분석합니다. 이 함수는 웹사이트 방문부터 최종 구매까지의 사용자 전환 과정을 분석하는 등 전환 퍼널 분석에 특히 유용합니다.

함수는 다음 알고리즘에 따라 동작합니다.

- 함수는 체인의 첫 번째 조건을 충족하는 데이터를 찾아 이벤트 카운터를 1로 설정합니다. 이 시점부터 슬라이딩 윈도우가 시작됩니다.
- 윈도우 내에서 체인의 이벤트가 순서대로 발생하면 카운터가 증가합니다. 이벤트 순서가 어긋나면 카운터가 증가하지 않습니다.
- 데이터에 완료 단계가 서로 다른 이벤트 체인이 여러 개 있으면 함수는 가장 긴 체인의 길이만 출력합니다.

## 구문 {#syntax}

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<window>` | window는 시간 윈도우의 길이이며 단위는 초입니다. |
| `<mode>` | 모드는 `default`, `deduplication`, `fixed`, `increase`의 총 네 가지입니다. 자세한 내용은 아래 **모드**를 참조하세요. |
| `<timestamp>` | 슬라이딩 윈도우에서 사용하는 타임스탬프 컬럼입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. |
| `<event_n>` | evnet_n은 eventID = 1004와 같은 불리언 표현식입니다. |

**모드**

    - `default`: Standard funnel calculation. Doris searches for the longest event chain that matches the specified order within the time window. Events that do not match any condition are ignored.

    - `deduplication`: Based on `default`, but an event that has already been matched in the current chain cannot appear again. For example, if the condition list is [event1='A', event2='B', event3='C', event4='D'] and the original event chain is `A-B-C-B-D`, the second `B` breaks the chain, so the matched event chain is `A-B-C` and the max level is `3`.

    - `fixed`: The chain must advance in the specified order and cannot skip intermediate steps. If an event that matches a later condition appears before its immediate predecessor is matched, the chain stops. Events that do not match any condition are ignored and do not break the chain. For example, with [event1='A', event2='B', event3='C', event4='D'], `A-B-D-C` returns `A-B` and level `2`; with `A-B-X-C-D` (`X` matches none of the conditions), Doris returns `A-B-C-D`.

    - `increase`: Based on `default`, but matched events must have strictly increasing timestamps. If two matched events have the same timestamp, the later event cannot advance the chain.

## 반환 값 {#return-value}
지정된 시간 윈도우 내에서 연속으로 완료된 단계의 최대 개수를 나타내는 정수를 반환합니다.

## 예제 {#examples}

### 예제1: default 모드 {#example1-default-mode}

`default` 모드를 사용하여 서로 다른 `user_id`별로 `5`분의 시간 윈도우 내에서 연속으로 발생한 이벤트의 최대 개수를 구합니다.

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 3),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        300,
        "default",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```

`user_id=100123`의 경우 `payment` 이벤트가 발생한 시점이 시간 윈도우를 벗어나므로 일치하는 이벤트 체인은 `login-visit-order`입니다.

### 예제2: deduplication 모드 {#example2-deduplication-mode}

`deduplication` 모드를 사용하여 서로 다른 user_ids별로 1시간의 시간 윈도우 내에서 연속으로 발생한 이벤트의 최대 개수를 구합니다.

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'login', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "deduplication",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     2 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
`user_id=100123`의 경우 `visit` 이벤트가 일치한 후 `login` 이벤트가 다시 나타나므로 일치하는 이벤트 체인은 `login-visit`입니다.

### 예제3: fixed 모드 {#example3-fixed-mode}

`fixed` 모드를 사용하여 서로 다른 `user_id`별로 `1`시간의 시간 윈도우 내에서 연속으로 발생한 이벤트의 최대 개수를 구합니다.

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'login2', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "fixed",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     4 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
`user_id=100123`의 경우 `login2`는 퍼널의 어떤 조건과도 일치하지 않으므로 `fixed` 체인을 끊지 않습니다. 일치하는 이벤트 체인은 `login-visit-order-payment`입니다.

### 예제4: increase 모드 {#example4-increase-mode}

`increase` 모드를 사용하여 서로 다른 `user_id`별로 `1`시간의 시간 윈도우 내에서 연속으로 발생한 이벤트의 최대 개수를 구합니다.

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:04:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "increase",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
`user_id=100123`의 경우 `payment` 이벤트와 `order` 이벤트의 타임스탬프가 같은 초에 해당하여 카운터가 증가하지 않으므로 일치하는 이벤트 체인은 `login-visit-order`입니다.
