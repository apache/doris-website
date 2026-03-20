---
{
  "title": "WINDOW_FUNNEL",
  "description": "WINDOWFUNNEL関数は、指定された時間ウィンドウ内でイベントチェーンを検索し、最大値を計算することによって、ユーザー行動シーケンスを分析します",
  "language": "ja"
}
---
## デスクリプション

WINDOW_FUNNEL関数は、指定された時間ウィンドウ内でイベントチェーンを検索し、イベントチェーンで完了したステップの最大数を計算することで、ユーザー行動シーケンスを分析します。この関数は、ウェブサイト訪問から最終購入までのユーザーコンバージョンの分析など、コンバージョンファネル分析に特に有用です。

関数は以下のアルゴリズムに従って動作します：

- 関数はチェーン内の最初の条件をトリガーするデータを検索し、イベントカウンターを1に設定します。これがスライディングウィンドウが開始される瞬間です。
- チェーンからのイベントがウィンドウ内で順次発生した場合、カウンターが増分されます。イベントのシーケンスが中断された場合、カウンターは増分されません。
- データが異なる完了時点で複数のイベントチェーンを持つ場合、関数は最も長いチェーンのサイズのみを出力します。

## Syntax

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<window>` | windowは秒単位の時間ウィンドウの長さです |
| `<mode>` | 全部で4つのモードがあります：`default`、`deduplication`、`fixed`、`increase`。詳細については、以下の**Mode**を参照してください。 |
| `<timestamp>` | timestampはDATETIME型の列を指定します。スライディング時間ウィンドウがこの列に対して動作します |
| `<event_n>` | evnet_nはeventID = 1004のようなboolean式です |

**Mode**

    - `default`：デフォルトモード。

    - `deduplication`：イベントの連続で同じイベントが発生した場合、そのような繰り返しイベントは以降の処理を中断します。例：配列パラメータが[event1='A', event2='B', event3='C', event4='D']で、元のイベントチェーンが「A-B-C-B-D」の場合。イベントBが繰り返されるため、フィルタリングされたイベントチェーンは「A-B-C」のみになり、最大イベントレベルは3になります。

    - `fixed`：他のイベントの介入を許可しません。例：配列パラメータが[event1='A', event2='B', event3='C', event4='D']で、元のイベントチェーンがA->B->D->Cの場合、Dの箇所でA->B->Cの検索を停止し、最大イベントレベルは2になります。

    - `increase`：厳密に増加するタイムスタンプを持つイベントのみに条件を適用します。

## 戻り値
指定された時間ウィンドウ内で完了した連続ステップの最大数を表す整数を返します。

## Examples

### example1: default mode

`default`モードを使用して、異なる`user_id`に対応する連続イベントの最大数を、`5`分の時間ウィンドウで見つけます：

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
`uesr_id=100123`の場合、`payment`イベントが発生した時間がタイムウィンドウを超えているため、マッチしたイベントチェーンは`login-visit-order`です。

### example2: deduplificationモード

`deduplication`モードを使用して、1時間のタイムウィンドウで、異なるuser_idに対応する連続イベントの最大数を見つけます：

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

`fixed`モードを使用して、異なる`user_id`に対応する連続イベントの最大数を、`1`時間のタイムウィンドウで見つけ出します：

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
`uesr_id=100123`の場合、`order`イベントにマッチした後、イベントチェーンは`login2`イベントによって中断されるため、マッチしたイベントチェーンは`login-visit-order`となります。

### example4: increaseモード

`increase`モードを使用して、異なる`user_id`に対応する連続イベントの最大数を見つけます。時間ウィンドウは`1`時間です：

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
`uesr_id=100123`の場合、`payment`イベントのタイムスタンプと`order`イベントのタイムスタンプが同じ秒に発生し、増加していないため、マッチしたイベントチェーンは`login-visit-order`となります。
