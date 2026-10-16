---
{
    "title": "WINDOW_FUNNEL",
    "language": "ja",
    "description": "WINDOWFUNNEL 関数は、指定された時間枠内のイベント連鎖を検索し、完了したステップの最大数を計算してユーザーの行動シーケンスを分析します。"
}
---

## 説明

WINDOW_FUNNEL 関数は、指定された時間枠内でイベントの連鎖を検索し、連鎖内で完了したステップの最大数を計算することで、ユーザーの行動シーケンスを分析します。Web サイトへの訪問から最終的な購入までのコンバージョンを分析するなど、コンバージョンファネルの分析に特に役立ちます。

この関数は次のアルゴリズムで動作します。

- 連鎖の最初の条件を満たすデータを検索し、イベントカウンターを 1 に設定します。この時点でスライディングウィンドウが開始します。
- ウィンドウ内で連鎖のイベントが順番に発生すると、カウンターが増加します。イベントの順序が崩れた場合、カウンターは増加しません。
- データに到達ステップの異なる複数のイベント連鎖がある場合、最長の連鎖の長さだけを出力します。

## 構文

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<window>` | 時間枠の長さを秒単位で指定します。 |
| `<mode>` | `default`、`deduplication`、`fixed`、`increase` の四つのモードがあります。詳細は以下の **モード** を参照してください。 |
| `<timestamp>` | スライディングウィンドウで使用するタイムスタンプ列です。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートします。 |
| `<event_n>` | eventID = 1004 のようなブール式です。 |

**モード**

    - `default`: Standard funnel calculation. Doris searches for the longest event chain that matches the specified order within the time window. Events that do not match any condition are ignored.

    - `deduplication`: Based on `default`, but an event that has already been matched in the current chain cannot appear again. For example, if the condition list is [event1='A', event2='B', event3='C', event4='D'] and the original event chain is `A-B-C-B-D`, the second `B` breaks the chain, so the matched event chain is `A-B-C` and the max level is `3`.

    - `fixed`: The chain must advance in the specified order and cannot skip intermediate steps. If an event that matches a later condition appears before its immediate predecessor is matched, the chain stops. Events that do not match any condition are ignored and do not break the chain. For example, with [event1='A', event2='B', event3='C', event4='D'], `A-B-D-C` returns `A-B` and level `2`; with `A-B-X-C-D` (`X` matches none of the conditions), Doris returns `A-B-C-D`.

    - `increase`: Based on `default`, but matched events must have strictly increasing timestamps. If two matched events have the same timestamp, the later event cannot advance the chain.

## 戻り値
指定した時間枠内で順番に完了したステップの最大数を表す整数を返します。

## 使用例

### 例 1: default モード

`default` モードを使用し、各 `user_id` に対応する連続したイベントの最大数を、`5` 分の時間枠で求めます。

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

`user_id=100123` では、`payment` イベントの発生時刻が時間枠を超えているため、一致したイベント連鎖は `login-visit-order` です。

### 例 2: deduplication モード

`deduplication` モードを使用し、時間枠を 1 時間として、各 user_id に対応する連続したイベントの最大数を求めます。

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
`user_id=100123` では、`visit` イベントに一致した後に `login` イベントが再び現れるため、一致したイベント連鎖は `login-visit` です。

### 例 3: fixed モード

`fixed` モードを使用し、各 `user_id` に対応する連続したイベントの最大数を、`1` 時間の時間枠で求めます。

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
`user_id=100123` では、`login2` はファネルのどの条件にも一致しないため、`fixed` モードの連鎖を途切れさせません。一致したイベント連鎖は `login-visit-order-payment` です。

### 例 4: increase モード

`increase` モードを使用し、各 `user_id` に対応する連続したイベントの最大数を、`1` 時間の時間枠で求めます。

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
`user_id=100123` では、`payment` イベントと `order` イベントのタイムスタンプが同じ秒で増加していないため、一致したイベント連鎖は `login-visit-order` です。
