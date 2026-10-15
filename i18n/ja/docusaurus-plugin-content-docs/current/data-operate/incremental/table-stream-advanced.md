---
{
    "title": "Table Stream の高度な機能",
    "language": "ja",
    "description": "Doris Table Stream の高度な機能：パーティション単位のオフセットと LAG、@snapshot() と @reset()、ディメンションテーブルとの整合性のある結合、同時消費、ベーステーブルの DDL による影響、エラー。",
    "keywords": [
        "Table Stream の高度な機能",
        "table_stream_consumption",
        "LAG",
        "CONSUMPTION_STATUS",
        "パーティション単位の消費オフセット",
        "パーティションごとの消費",
        "@snapshot()",
        "@reset()",
        "スナップショット読み取り",
        "全件再ロード",
        "ディメンションテーブルとの増分結合",
        "同時消費",
        "target offset already consumed",
        "cloud_table_stream_max_partitions_per_insert",
        "IS_STALE",
        "STALE_REASON",
        "DROP STREAM FORCE",
        "Stream の監視とアラート",
        "消費の復旧",
        "ベーステーブルのスキーマ変更が Stream に及ぼす影響"
    ]
}
---

<!-- Knowledge type: Operations guide + Operations manual -->
<!-- Use cases: Consuming large tables partition by partition / Incremental joins with dimension tables / Rebuilding downstream / Operating consumption pipelines -->

このページは、[Table Stream の基本](table-stream)を読んでいることを前提としています。例では、そのページの `orders` テーブルと `orders_stream` を使用します。

## ユースケース {#use-cases}

<!-- Knowledge type: Navigation -->

| 目的 | 参照するセクション |
|---|---|
| パーティションごとの消費位置と未処理量を確認する、または大きなテーブルのアクティブなパーティションだけを消費する | [パーティション単位の消費オフセット](#partition-level-consumption-offsets) |
| 消費前にデータを照合する、または破損した下流テーブルを再構築する | [スナップショット読み取り @snapshot()](#snapshot-reads-snapshot) |
| 下流側のデータを全件再ロードしてから、現在の時点以降の変更を増分消費する | [リセット @reset()](#reset-reset) |
| 注文の変更を users テーブルと結合し、ディメンションの状態を消費サイクルに合わせる | [ディメンションテーブルとの結合](#joining-dimension-tables) |
| 複数の下流システムに提供する、一つの文で複数のテーブルを消費する、または並列に消費する | [複数の Stream と同時消費](#multiple-streams-and-concurrent-consumption) |
| ベーステーブルでカラムやパーティションを追加したり、切り詰め、置換、削除したりした場合に Stream がどうなるかを確認する | [ベーステーブルの変更による影響](#effect-of-base-table-changes) |
| 未処理量のアラートを設定する、または消費ジョブの失敗後に復旧する | [監視と復旧](#monitoring-and-recovery) |
| エラーメッセージの原因と対処方法を調べる | [よくあるエラー](#common-errors) |

## パーティション単位の消費オフセット {#partition-level-consumption-offsets}

<!-- Knowledge type: Behavior rules + Operations monitoring -->
<!-- Use cases: Checking consumption progress / Consuming large tables partition by partition -->

Stream のオフセットはベーステーブルのパーティションごとに保持され、`information_schema.table_stream_consumption` の各行が一つのパーティションに対応します。

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260912 | 469015470080000000 | 0         |         1789180806000 |
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```

| カラム | 説明 |
|---|---|
| `UNIT` | 消費単位、つまりパーティション名です。明示的なパーティションを持たないテーブルには、テーブルと同じ名前のパーティションが一つあります |
| `CONSUMPTION_STATUS` | そのパーティションで消費済みの最終コミットタイムスタンプ（TSO）です。`N/A` は一度も消費されていないことを示します |
| `LAG` | パーティションの最新のコミット済み TSO と消費済み TSO の差です。`0` は未処理データがないことを、`N/A` はデータがあるものの一度も消費されていないことを示します |
| `LAST_CONSUMPTION_TIME` | パーティションの直近の消費時刻（ミリ秒単位のタイムスタンプ）です。`-1` は一度も消費されていないことを示します |

TSO の上位ビットはミリ秒単位の物理時刻、下位 18 ビットは論理カウンターです。そのため、`LAG` を 262144（2 の 18 乗）で割ると、未処理時間のおおよそのミリ秒数になります。上の例では、`p20260914` は約 1 秒遅れています。

### パーティションごとの消費 {#consuming-by-partition}

大きなテーブルの変更が少数のアクティブなパーティションに集中している場合は、`PARTITION` 句でそのパーティションだけを消費します。オフセットが進むのは、消費したパーティションだけです。

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream PARTITION (p20260914)
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

一つの文で同じ Stream の異なるパーティションを複数参照した場合は、オフセットの更新が一つにまとめられます。

ストレージとコンピュートの分離型モードでは、一つの `INSERT` で消費できるパーティション数は FE の設定 `cloud_table_stream_max_partitions_per_insert`（デフォルトは 10000）を超えられません。超えると `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` というエラーになります。`PARTITION` を使って分割して消費してください。

### パーティションの追加と削除 {#adding-and-removing-partitions}

- Stream の作成後に追加されたパーティション（動的パーティショニングや自動パーティショニングによるものも含む）は、すべてのデータが変更として出力されます。そのパーティションを初めて消費するときは、先頭から読み取ります。
- パーティションを削除すると、そのオフセットレコードは FE によって定期的にクリーンアップされます（`table_stream_partition_offset_cleanup_interval_second`、デフォルトは 3600 秒）。手動操作は不要です。削除されたパーティションの未消費の変更も一緒に消えます。

## スナップショット読み取り @snapshot() {#snapshot-reads-snapshot}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Reconciliation before consuming / Rebuilding downstream / Reading the base table image before the pending changes -->

`<stream>@snapshot()` は、Stream の**現在の消費オフセット時点**におけるベーステーブルのイメージを返します。つまり、今回まだ消費していない変更が発生する前のベーステーブルの状態です。

```sql
SELECT order_id, status, amount FROM orders_stream@snapshot() ORDER BY order_id;
```

[Table Stream の基本](table-stream#consumption-types)のデータを例にします。Stream の作成時点でベーステーブルには注文 1、2、3 があり、その後、注文 1 が更新され、注文 2 が削除され、注文 4 が挿入されました。まだ何も消費していない場合、`@snapshot()` は更新前の注文 1 と注文 2、3 を返します。一方、通常の読み取りでは、これらの変更が返されます。関係は **スナップショット + 未消費の変更 = ベーステーブルの現在の状態** です。

`@snapshot()` の特徴は次のとおりです。

- オフセットを進めません。結果を `INSERT INTO ... SELECT FROM <stream>@snapshot()` で別のテーブルに書き込んでも進みません。
- テーブルのイメージを返し、`__DORIS_STREAM_*` 仮想カラムは提供しません。
- イメージはパーティションごとに、そのパーティションの消費オフセット時点で取得されます。
- `show_initial_rows = true` の Stream では、一度も消費されていないパーティションのスナップショットは空です。消費は「何もない」状態から始まり、既存のデータはすべて未消費の変更に含まれます。

主な用途は次のとおりです。

| 用途 | 方法 |
|---|---|
| データの照合 | 消費前に `@snapshot()` の結果を下流テーブルと比較し、下流側が前回の消費後のベーステーブルの状態と一致することを確認してから、今回の変更を消費します |
| 下流テーブルの再構築 | 下流テーブルが破損した場合、`@snapshot()` から消費オフセットに対応する状態を復元し、その後は通常どおり消費を続けます。オフセット以降の変更を飛ばしたり、二重に処理したりしません |
| 増分結合で使う「変更前」のイメージ | 後述の[ディメンションテーブルとの結合](#joining-dimension-tables)を参照してください |

## リセット @reset() {#reset-reset}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Full reload of downstream / Skipping the accumulated backlog -->

`<stream>@reset()` は、ベーステーブルの**現在の**全件イメージを返します。通常の `SELECT` で読み取るだけならデータを表示するのみです。`INSERT INTO ... SELECT FROM <stream>@reset()` で消費すると、Stream のすべてのパーティションのオフセットが現在の時点まで進みます。それ以降、Stream はこの消費の後に発生した変更だけを出力します。

```sql
-- Clear downstream, reload it in full, and advance the offset to now
TRUNCATE TABLE dwd_orders;
INSERT INTO dwd_orders
SELECT order_id, status, amount FROM orders_stream@reset();

-- Continue with incremental consumption
SELECT COUNT(*) FROM orders_stream;   -- 0
```

主な用途は次のとおりです。

- 下流側を再び全件同期し、現在の時点から増分消費を続ける場合。
- Stream を `show_initial_rows = false` で作成したものの、既存のデータも同期する必要が生じた場合。
- Stream に未処理の変更がたまりすぎて、下流側で過去の変更が不要になったため、現在の時点まで一気に進める場合。

`@snapshot()` と同様に、`@reset()` は `__DORIS_STREAM_*` 仮想カラムを提供しません。

## 三つの読み取り形式の比較 {#comparison-of-the-three-read-forms}

<!-- Knowledge type: Comparison -->

| | `<stream>` | `<stream>@snapshot()` | `<stream>@reset()` |
|---|---|---|---|
| 返す内容 | 消費オフセット以降の変更 | 消費オフセット時点のベーステーブルのイメージ | ベーステーブルの現在の全件イメージ |
| 通常の `SELECT` でオフセットが進むか | いいえ | いいえ | いいえ |
| `INSERT INTO ... SELECT` でオフセットが進むか | はい。読み取りの上限まで進みます | いいえ | はい。すべてのパーティションが現在の時点まで進みます |
| `__DORIS_STREAM_*` 仮想カラム | あり | なし | なし |
| 主な用途 | 増分消費 | データの照合、下流テーブルの再構築、増分結合で使う「変更前」のイメージ | 全件再ロード、未処理の変更のスキップ |

## ディメンションテーブルとの結合 {#joining-dimension-tables}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Joining incremental data with dimension tables / Aligning the dimension state with the consumption cadence -->

Stream はほかのテーブルと直接結合できます。この場合、ディメンションテーブルは現在の状態で読み取られます。

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

ディメンションテーブル自体も変化し、その状態を消費サイクルに合わせる必要がある場合は、ディメンションテーブルにも Stream を作成し、同じ消費ジョブで使用します。

| 読み取り形式 | 返されるディメンションテーブルの状態 |
|---|---|
| `users_stream@snapshot()` | 前回の消費時点のディメンションテーブルのイメージ |
| `users_stream` | 前回の消費以降のディメンションテーブルの変更 |
| `users_stream@reset()` | ディメンションテーブルの現在のイメージ |

たとえば、注文の変更を前回の消費時点のユーザー情報と結合し、users テーブルの変更は別途処理します。

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users_stream@snapshot() AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

この文で進むのは `orders_stream` のオフセットだけです。`users_stream` のオフセットは、`users_stream` を消費する文で進みます。二つの Stream の消費サイクルは、ジョブのオーケストレーションによって決まります。

## 複数の Stream と同時消費 {#multiple-streams-and-concurrent-consumption}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Several downstream systems / Parallel consumption / Consumption concurrent with writes -->

| シナリオ | 動作 | 推奨事項 |
|---|---|---|
| 一つのベーステーブルに複数の Stream | Stream ごとに独自のオフセットを保持し、相互に影響しません | 下流システムごとに Stream を作成し、それぞれのペースで消費できます |
| 一つの文で複数の Stream を消費 | たとえば、二つのテーブルの変更を UNION でまとめて一つの対象テーブルに書き込む場合、関係するすべての Stream のオフセットが同じトランザクション内で進みます | - |
| 一つの Stream に複数のコンシューマー | 二つのセッションが同じ Stream の同じパーティションを同時に消費すると、後からコミットするトランザクションは `target offset already consumed` で失敗し、ロールバックされます | Stream の各パーティションを同時に消費するコンシューマーは一つにしてください。並列化する場合は、パーティションごとにジョブを分けるか、コンシューマーごとに別の Stream を作成します |
| 書き込みと同時に消費 | Stream の消費中もベーステーブルには通常どおり書き込めます。消費する文は開始時点でコミット済みの変更を読み取り、それ以降にコミットされた書き込みは次回の消費に残します | - |

## ベーステーブルの変更による影響 {#effect-of-base-table-changes}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Assessing the effect on Streams before running DDL on the base table -->

| ベーステーブルの操作 | Stream への影響 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Stream のカラムは自動的に同期されます。新しいカラムは、その後の変更レコードに実際の値を持ちます。削除されたカラムは出力されなくなります |
| `ADD PARTITION`、動的パーティショニング、自動パーティショニング | 新しいパーティションは先頭から消費され、すべてのデータが変更として出力されます |
| `DROP PARTITION` | パーティションの未消費の変更はパーティションとともに消え、オフセットレコードは FE によって定期的にクリーンアップされます |
| `TRUNCATE TABLE` / `TRUNCATE PARTITION` | 切り詰められたパーティションには新しいパーティション ID が割り当てられ、その後に書き込まれたデータは先頭から変更として出力されます。切り詰め前の未消費の変更は消えます。ほかのパーティションには影響しません |
| `REPLACE PARTITION`（一時パーティションとの置換） | 置換後のパーティションは先頭から消費され、置換前のパーティションの未消費の変更は消えます |
| テーブルまたはパーティションの `RENAME` | 影響はありません。Stream は ID でベーステーブルを参照します |
| `REPLACE WITH TABLE` | Stream は元のテーブルオブジェクト（置換後は別の名前になったテーブル）を引き続き参照します。通常、これは意図した動作ではありません。ベーステーブルを置換した後に Stream を削除して作り直してください |
| ベーステーブルの `DROP TABLE` | Stream は残りますが、読み取れなくなります。`DROP STREAM ... FORCE` で削除してください |
| `DROP DATABASE` | そのデータベース内の Stream は一緒に削除されます。ベーステーブルが削除されたデータベースにあった、別のデータベース内の Stream は残るため、こちらも `FORCE` で削除する必要があります |

Row Binlog を有効にしたベーステーブルで許可されない DDL（`MODIFY COLUMN` など）については、[Row Binlog](row-binlog#ddl-restrictions)を参照してください。

## 監視と復旧 {#monitoring-and-recovery}

<!-- Knowledge type: Operations manual -->
<!-- Use cases: Alerting on the consumption pipeline / Handling failed consumption jobs -->

### 監視 {#monitoring}

IVM が作成した内部 Stream も、これらのシステムテーブルに表示されます。状態と未処理量は確認できますが、手動で消費、リセット、削除しないでください。マテリアライズドビューの更新タスクと [IVM の運用ガイド](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)を通じて管理してください。

| 監視項目 | 情報源 | 備考 |
|---|---|---|
| 未処理量 | `LAG`（`information_schema.table_stream_consumption`） | 定期的に照会し、値がゼロ以外のままか増え続けるパーティションに対してアラートを設定します |
| 状態 | `ENABLED`、`IS_STALE`、`STALE_REASON`（`information_schema.table_streams`） | Stream の状態は示しますが、現行の実装では TTL の期限切れを報告しません。ベーステーブルの `binlog.ttl_seconds` に対する消費遅延を監視し、オフセットの期限切れエラーを確認してください。[保持とクリーンアップ](row-binlog#retention-and-cleanup)も参照してください |
| 消費履歴 | `LAST_CONSUMPTION_TIME`（`information_schema.table_stream_consumption`） | 消費ジョブが予定どおり実行されているかを確認できます |

### 復旧 {#recovery}

| 状況 | 対処方法 |
|---|---|
| 消費する文が失敗した | オフセットは変わりません。必要な変更がまだ保持期間内にあるうちに再実行してください |
| `binlog.ttl_seconds` に基づき、必要な変更の保持期間が切れた | `@reset()` で下流側を全件再ロードし、オフセットを合わせ直してください。期限切れのオフセットに対して `min_delta` の読み取りは失敗しますが、`detail` と `append_only` は期限切れの変更をスキップします |
| 消費は成功したが、スケジューラーに記録されなかった | 再実行すると次のバッチの変更を読み取り、前回のバッチを再び消費することはありません。繰り返し実行しても副作用が生じないようにするには、対象テーブルに Unique Key モデルを使用してください。主キーによる書き込みは自然に冪等になります |
| 下流側のデータが正しくなく、再構築が必要 | `@snapshot()` で消費オフセットに対応する状態を復元して増分消費を続けるか、`@reset()` で全件再ロードしてオフセットも現在の時点まで進めてください |
| FE の再起動または master の切り替え | オフセットはメタデータに永続化され、再起動後も消費を続けられます |

## よくあるエラー {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| エラーメッセージ | 原因 | 対処方法 |
|---|---|---|
| `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | FE で `enable_table_stream` が有効になっていません | `fe.conf` を更新し、FE を再起動してください |
| `Insert plan with Table stream failed. should enable binlog feature in FE config.` | FE で `enable_feature_binlog` が有効になっていません | `fe.conf` を更新し、FE を再起動してください |
| `Base Olap table ... need to enable row binlog for table stream` | ベーステーブルで Row Binlog が有効になっていません | `binlog.enable` と `binlog.format = ROW` を指定してベーステーブルを作り直してください |
| `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true` | `min_delta`（デフォルトのタイプ）には変更前のイメージが必要です | ベーステーブルで `binlog.need_historical_value` を有効にするか、`append_only` を使用してください |
| `not supported type: xxx` | `type` の値が無効です | `append_only` / `min_delta` / `detail` を使用してください |
| `target offset already consumed` | 同じパーティションが同時に消費され、このトランザクションのコミット前にオフセットが進められました | 再実行して次のバッチを読み取ってください。同時に消費するコンシューマーを避けてください |
| `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` | 分離型モードで明示的なトランザクション内または Group Commit で消費しているか、書き込み先が内部テーブルではありません | 通常の `INSERT INTO ... SELECT` を使用してください |
| `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` | 一つの文で消費するパーティションが多すぎます | `PARTITION` で分割して消費するか、設定値を引き上げてください |
| `Cloud Table Stream only supports DROP STREAM ... FORCE` | 分離型モードで `DROP STREAM` を `FORCE` なしで実行しました | `DROP STREAM ... FORCE` を使用してください |
| `Unknown column '__DORIS_STREAM_CHANGE_TYPE_COL__' ...` | `@snapshot()` / `@reset()` で仮想カラムを参照しました | イメージの読み取りでは仮想カラムは提供されません |
