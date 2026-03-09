---
{
  "title": "WINDOW_FUNNEL",
  "language": "ja",
  "description": "WINDOWFUNNEL関数は、指定された時間窓内でイベントチェーンを検索し、最大値を計算することにより、ユーザー行動シーケンスを分析します"
}
---
## 概要

WINDOW_FUNNEL関数は、指定された時間ウィンドウ内でイベントチェーンを検索し、イベントチェーンで完了したステップの最大数を計算することで、ユーザー行動シーケンスを分析します。この関数は、Webサイト訪問から最終購入までのユーザーコンバージョン分析など、コンバージョンファネル分析に特に有用です。

この関数は以下のアルゴリズムに従って動作します：

- 関数はチェーン内の最初の条件をトリガーするデータを検索し、イベントカウンターを1に設定します。これがスライディングウィンドウが開始される瞬間です。
- チェーンからのイベントがウィンドウ内で順次発生した場合、カウンターがインクリメントされます。イベントのシーケンスが中断された場合、カウンターはインクリメントされません。
- データが異なる完了ポイントで複数のイベントチェーンを持つ場合、関数は最も長いチェーンのサイズのみを出力します。

## 構文

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<window>` | window は秒単位の時間ウィンドウの長さです |
| `<mode>` | 合計4つのモードがあります：`default`、`deduplication`、`fixed`、`increase`。詳細については、以下の**Mode**を参照してください。 |
| `<timestamp>` | timestamp はDATETIME型の列を指定し、スライディング時間ウィンドウはこれに対して動作します |
| `<event_n>` | evnet_n はeventID = 1004のようなboolean式です |

**Mode**

    - `default`：デフォルトモード。

    - `deduplication`：同じイベントがイベントシーケンスに対して成立する場合、そのような繰り返しイベントは以降の処理を中断します。例：配列パラメータが[event1='A', event2='B', event3='C', event4='D']で、元のイベントチェーンが"A-B-C-B-D"の場合。イベントBが繰り返されるため、フィルタされたイベントチェーンは"A-B-C"のみとなり、最大イベントレベルは3になります。

    - `fixed`：他のイベントの介入を許可しません。例：配列パラメータが[event1='A', event2='B', event3='C', event4='D']で、元のイベントチェーンがA->B->D->Cの場合、DでA->B->Cの検索を停止し、最大イベントレベルは2になります。

    - `increase`：厳密に増加するタイムスタンプを持つイベントにのみ条件を適用します。

## 戻り値
指定された時間ウィンドウ内で完了した連続ステップの最大数を表す整数を返します。

## 例

### example1: default mode

`default`モードを使用して、`5`分の時間ウィンドウで異なる`user_id`に対応する連続イベントの最大数を見つけます：

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
`uesr_id=100123`の場合、`payment`イベントが発生した時刻が時間窓を超えているため、マッチしたイベントチェーンは`login-visit-order`です。

### example2: deduplicationモード

`deduplication`モードを使用して、異なるuser_idに対応する連続イベントの最大数を1時間の時間窓で見つけます：

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
    (100123, 'order', '2022-05-14 10:04:00', "HONOR", 4),
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
`uesr_id=100123`の場合、`visit`イベントにマッチした後、`login`イベントが繰り返し出現するため、マッチしたイベントチェーンは`login-visit`となります。

### example3: fixedモード

`fixed`モードを使用して、異なる`user_id`に対応する連続イベントの最大数を調べます。時間窓は`1`時間です：

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
    (100123, 'order', '2022-05-14 10:03:00', "HONOR", 4),
    (100123, 'login2', '2022-05-14 10:04:00', 'HONOR', 3),
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
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
`uesr_id=100123`の場合、`order`イベントをマッチした後、`login2`イベントによってイベントチェーンが中断されるため、マッチしたイベントチェーンは`login-visit-order`となります。

### example4: increaseモード

`increase`モードを使用して、異なる`user_id`に対応する連続イベントの最大数を、`1`時間のタイムウィンドウで見つけ出します：

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
    (100123, 'order', '2022-05-14 10:04:00', "HONOR", 4),
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
`uesr_id=100123`の場合、`payment`イベントのタイムスタンプと`order`イベントのタイムスタンプが同じ秒で発生し、増分されないため、マッチしたイベントチェーンは`login-visit-order`です。
