---
{
    "title": "Table Stream の高度な機能",
    "language": "ja",
    "description": "Doris Table Stream の高度な機能：パーティション単位のオフセットと LAG、@snapshot() と @reset()、整合性を保つディメンションテーブルとの結合、同時実行、ベーステーブルの DDL の影響、エラー。",
    "keywords": [
        "Table Stream の高度な機能",
        "table_stream_consumption",
        "LAG",
        "CONSUMPTION_STATUS",
        "パーティション単位の消費オフセット",
        "パーティション単位の消費",
        "@snapshot()",
        "@reset()",
        "スナップショット読み取り",
        "全件再データロード",
        "ディメンションテーブルとの増分結合",
        "同時消費",
        "target offset already consumed",
        "cloud_table_stream_max_partitions_per_insert",
        "IS_STALE",
        "STALE_REASON",
        "DROP STREAM FORCE",
        "Stream の監視とアラート",
        "消費の復旧",
        "ベーステーブルのスキーマ変更が Stream に与える影響"
    ]
}
---

<!-- Knowledge type: Operations guide + Operations manual -->
<!-- Use cases: Consuming large tables partition by partition / Incremental joins with dimension tables / Rebuilding downstream / Operating consumption pipelines -->

このページでは、[Table Stream の基本](table-stream)を読んでいることを前提とします。例では、そこで使用した `orders` テーブルと `orders_stream` を再利用します。

## ユースケース {#use-cases}

<!-- Knowledge type: Navigation -->

| 目的 | セクション |
|---|---|
| 各パーティションの消費済み位置と未消費データ量を確認し、大きなテーブルのアクティブなパーティションだけを消費する | [パーティション単位の消費オフセット](#partition-level-consumption-offsets) |
| 消費前に照合する、または破損した下流テーブルを再構築する | [スナップショット読み取り @snapshot()](#snapshot-reads-snapshot) |
| 下流を全件再データロードし、現在位置から増分消費を続ける | [リセット @reset()](#reset-reset) |
| 注文の変更を、消費の周期に合わせた状態の users テーブルと結合する | [ディメンションテーブルとの結合](#joining-dimension-tables) |
| 複数の下流システムにデータを提供する、ひとつのステートメントで複数のテーブルを消費する、または並列に消費する | [複数の Stream と同時消費](#multiple-streams-and-concurrent-consumption) |
| ベーステーブルでカラムやパーティションを追加した場合、または切り詰め、置き換え、削除した場合に Stream がどうなるかを確認する | [ベーステーブルの変更による影響](#effect-of-base-table-changes) |
| 未消費データのアラートを設定する、または消費ジョブの失敗後に復旧する | [監視と復旧](#monitoring-and-recovery) |
| エラーメッセージの原因と対処方法を調べる | [よくあるエラー](#common-errors) |

## パーティション単位の消費オフセット {#partition-level-consumption-offsets}

<!-- Knowledge type: Behavior rules + Operations monitoring -->
<!-- Use cases: Checking consumption progress / Consuming large tables partition by partition -->

Stream のオフセットはベーステーブルのパーティションごとに保持され、`information_schema.table_stream_consumption` の各行はひとつのパーティションに対応します。

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
| `UNIT` | 消費単位、つまりパーティション名。明示的なパーティションを持たないテーブルには、テーブル名を付けた単一のパーティションがあります |
| `CONSUMPTION_STATUS` | そのパーティションで消費済みの位置を示すコミットタイムスタンプ（TSO）。`N/A` は、そのパーティションがまだ一度も消費されていないことを意味します |
| `LAG` | パーティションの最新のコミット済み TSO と消費済み TSO の差。`0` は未消費データがないこと、`N/A` はデータがあるものの、まだ一度も消費されていないことを意味します |
| `LAST_CONSUMPTION_TIME` | そのパーティションを最後に消費した時刻（ミリ秒単位のタイムスタンプ）。`-1` は未消費を意味します |

TSO の上位ビットはミリ秒単位の物理時刻、下位 18 ビットは論理カウンターです。そのため、`LAG` を 262144（2 の 18 乗）で割ると、未消費データの遅延をミリ秒単位でおおよそ把握できます。上の例では、`p20260914` は約 1 秒遅れています。

### パーティション単位で消費する {#consuming-by-partition}

大きなテーブルの変更が少数のアクティブなパーティションに集中する場合は、`PARTITION` 句を使って対象のパーティションだけを消費します。オフセットが進むのは、消費したパーティションだけです。

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream PARTITION (p20260914)
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

ひとつのステートメントで同じ Stream の異なるパーティションを複数参照した場合、オフセットの更新はひとつにまとめられます。

コンピュートとストレージを分離したモードでは、ひとつの `INSERT` で消費できるパーティション数は FE の設定 `cloud_table_stream_max_partitions_per_insert`（デフォルトは 10000）を超えられません。超えると `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` で失敗します。`PARTITION` を使って分割して消費してください。

### パーティションの追加と削除 {#adding-and-removing-partitions}

- Stream の作成後に追加されたパーティション（動的パーティショニングや自動パーティショニングによって作成されたものを含む）では、すべてのデータが変更として出力されます。そのパーティションの初回の消費は先頭から読み取ります。
- パーティションを削除すると、そのオフセットレコードは FE によって定期的にクリーンアップされます（`table_stream_partition_offset_cleanup_interval_second`、デフォルトは 3600 秒）。手動での操作は不要です。削除したパーティションの未消費の変更も消失します。

## スナップショット読み取り @snapshot() {#snapshot-reads-snapshot}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Reconciliation before consuming / Rebuilding downstream / Reading the base table image before the pending changes -->

`<stream>@snapshot()` は、Stream の**現在の消費オフセット時点**におけるベーステーブルのイメージを返します。つまり、今回まだ消費していない変更が起こる前のベーステーブルの状態です。

```sql
SELECT order_id, status, amount FROM orders_stream@snapshot() ORDER BY order_id;
```

[Table Stream の基本](table-stream#consumption-types)のデータを例にします。Stream の作成時、ベーステーブルには注文 1、2、3 があります。その後、注文 1 が更新され、注文 2 が削除され、注文 4 が挿入されましたが、まだ何も消費されていません。`@snapshot()` は引き続き注文 1（更新前）、2、3 を返し、通常の読み取りはこれらの変更を返します。関係は、**スナップショット + 未消費の変更 = ベーステーブルの現在の状態**です。

`@snapshot()` の特徴は次のとおりです。

- オフセットは進みません。`INSERT INTO ... SELECT FROM <stream>@snapshot()` で結果を別のテーブルに書き込んでも進みません。
- テーブルのイメージを返し、`__DORIS_STREAM_*` 仮想カラムは提供しません。
- イメージはパーティションごとに、それぞれの消費オフセット時点で取得されます。
- `show_initial_rows = true` の Stream では、一度も消費されていないパーティションのスナップショットは空です（「何もない」状態から消費が始まり、既存のデータはすべて未消費の変更に含まれます）。

主な用途は次のとおりです。

| 用途 | 方法 |
|---|---|
| 照合 | 消費前に `@snapshot()` の結果と下流テーブルを比較し、下流が前回の消費後のベーステーブルの状態と一致することを確認してから、今回の変更を消費します |
| 下流の再構築 | 下流テーブルが破損した場合、`@snapshot()` を使って消費オフセットに対応する状態に復元し、その後は通常どおり消費を続けます。オフセット以降の変更がスキップされたり、重複して処理されたりすることはありません |
| 増分結合における「変更前」のイメージ | 後述の[ディメンションテーブルとの結合](#joining-dimension-tables)を参照してください |

## リセット @reset() {#reset-reset}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Full reload of downstream / Skipping the accumulated backlog -->

`<stream>@reset()` はベーステーブルの**現在の**全体イメージを返します。通常の `SELECT` で読み取るだけならデータを表示するだけです。`INSERT INTO ... SELECT FROM <stream>@reset()` で消費すると、Stream のすべてのパーティションのオフセットが現在位置まで進みます。その後、Stream が出力するのは、この消費より後に発生した変更だけです。

```sql
-- Clear downstream, reload it in full, and advance the offset to now
TRUNCATE TABLE dwd_orders;
INSERT INTO dwd_orders
SELECT order_id, status, amount FROM orders_stream@reset();

-- Continue with incremental consumption
SELECT COUNT(*) FROM orders_stream;   -- 0
```

主な用途は次のとおりです。

- 下流で再度全件同期を行い、現在位置から増分消費を続ける場合。
- Stream を `show_initial_rows = false` で作成したものの、既存のデータも同期する必要が生じた場合。
- Stream に未消費の変更が大量に蓄積され、下流で過去の変更が不要になったため、現在位置まで進めたい場合。

`@snapshot()` と同様に、`@reset()` も `__DORIS_STREAM_*` 仮想カラムを提供しません。

## 読み取り形式の比較 {#comparison-of-the-three-read-forms}

<!-- Knowledge type: Comparison -->

| | `<stream>` | `<stream>@snapshot()` | `<stream>@reset()` |
|---|---|---|---|
| 返す内容 | 消費オフセット以降の変更 | 消費オフセット時点のベーステーブルのイメージ | ベーステーブルの現在の全体イメージ |
| 通常の `SELECT` でオフセットが進むか | いいえ | いいえ | いいえ |
| `INSERT INTO ... SELECT` でオフセットが進むか | はい。読み取りの上限まで進みます | いいえ | はい。すべてのパーティションで現在位置まで進みます |
| `__DORIS_STREAM_*` 仮想カラム | あり | なし | なし |
| 主な用途 | 増分消費 | 照合、下流の再構築、増分結合における「変更前」のイメージ | 全件再データロード、未消費の変更のスキップ |

## ディメンションテーブルとの結合 {#joining-dimension-tables}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Joining incremental data with dimension tables / Aligning the dimension state with the consumption cadence -->

Stream はほかのテーブルと直接結合できます。ディメンションテーブルは現在の状態で読み取られます。

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

ディメンションテーブル自体も変更され、その状態を消費の周期に合わせる必要がある場合は、ディメンションテーブルにも Stream を作成し、同じ消費ジョブで使用します。

| 読み取り形式 | 返されるディメンションテーブルの状態 |
|---|---|
| `users_stream@snapshot()` | 前回の消費時点のディメンションテーブルのイメージ |
| `users_stream` | 前回の消費以降のディメンションテーブルの変更 |
| `users_stream@reset()` | ディメンションテーブルの現在のイメージ |

たとえば、注文の変更を前回の消費時点におけるユーザー情報と結合し、users テーブルの変更は別途処理します。

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users_stream@snapshot() AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

このステートメントで進むのは `orders_stream` のオフセットだけです。`users_stream` のオフセットは、`users_stream` を消費するステートメントによって進みます。両方の Stream の消費周期は、ジョブのオーケストレーションで決まります。

## 複数の Stream と同時消費 {#multiple-streams-and-concurrent-consumption}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Several downstream systems / Parallel consumption / Consumption concurrent with writes -->

| シナリオ | 動作 | 推奨事項 |
|---|---|---|
| ひとつのベーステーブルに複数の Stream がある | 各 Stream は独自のオフセットを保持し、互いに影響しません | 下流システムごとに Stream を作成し、それぞれのペースで消費できます |
| ひとつのステートメントで複数の Stream を消費する | たとえば、複数のテーブルの変更を UNION でひとつのターゲットテーブルにまとめる場合、関係するすべての Stream のオフセットが同じトランザクションで進みます | - |
| ひとつの Stream に複数のコンシューマーがある | 複数のセッションが同じ Stream の同じパーティションを同時に消費すると、後からコミットするトランザクションは `target offset already consumed` で失敗し、ロールバックされます | Stream の各パーティションに対し、同時に実行されるコンシューマーをひとつだけにしてください。並列化する場合は、ジョブをパーティションごとに分割するか、コンシューマーごとに別の Stream を作成します |
| 消費と書き込みが同時に行われる | Stream の消費中も、ベーステーブルには通常どおり書き込めます。消費ステートメントは開始時点でコミット済みの変更を読み取り、それ以降にコミットされた書き込みは次回の消費対象になります | - |

## ベーステーブルの変更による影響 {#effect-of-base-table-changes}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Assessing the effect on Streams before running DDL on the base table -->

| ベーステーブルの操作 | Stream への影響 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Stream のカラムは自動的に同期されます。新しいカラムは以降の変更レコードで実際の値を持ち、削除されたカラムは出力されなくなります |
| `ADD PARTITION`、動的パーティショニング、自動パーティショニング | 新しいパーティションは先頭から消費され、そのすべてのデータが変更として出力されます |
| `DROP PARTITION` | そのパーティションの未消費の変更はパーティションとともに消失し、オフセットレコードは FE によって定期的にクリーンアップされます |
| `TRUNCATE TABLE` / `TRUNCATE PARTITION` | 切り詰められたパーティションには新しいパーティション ID が割り当てられ、その後に書き込まれたデータは先頭から変更として出力されます。切り詰め前の未消費の変更は消失します。ほかのパーティションには影響しません |
| `REPLACE PARTITION`（一時パーティションによる置き換え） | 置き換え後のパーティションは先頭から消費され、置き換え前のパーティションの未消費の変更は消失します |
| テーブルまたはパーティションの `RENAME` | 影響はありません。Stream は ID でベーステーブルを参照します |
| `REPLACE WITH TABLE` | Stream は元のテーブルオブジェクト（別の名前が付いたテーブル）を参照し続けます。通常、これは意図した動作ではありません。ベーステーブルを置き換えた後、Stream を削除して再作成してください |
| ベーステーブルに対する `DROP TABLE` | Stream は残りますが、読み取れなくなります。`DROP STREAM ... FORCE` で削除してください |
| `DROP DATABASE` | そのデータベース内の Stream はデータベースとともに削除されます。別のデータベースにあり、削除されたデータベース内のテーブルをベーステーブルとしていた Stream は残るため、`FORCE` を使って削除する必要があります |

changelog が有効なベーステーブルで許可されない DDL（`MODIFY COLUMN` など）については、[Changelog](changelog#ddl-restrictions)を参照してください。

## 監視と復旧 {#monitoring-and-recovery}

<!-- Knowledge type: Operations manual -->
<!-- Use cases: Alerting on the consumption pipeline / Handling failed consumption jobs -->

### 監視 {#monitoring}

IVM が作成した内部 Stream も、これらのシステムテーブルに表示されます。その状態や未消費データ量は確認できますが、手動で消費、リセット、削除しないでください。マテリアライズドビューの更新タスクと[IVM の運用ガイド](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)を通じて扱ってください。

| 監視対象 | 参照元 | 備考 |
|---|---|---|
| 未消費データ量 | `information_schema.table_stream_consumption` の `LAG` | 定期的にクエリを実行し、値がゼロ以外のまま、または増加し続けるパーティションにアラートを設定します |
| 状態 | `information_schema.table_streams` の `ENABLED`、`IS_STALE`、`STALE_REASON` | Stream の状態を示しますが、現在の実装では TTL の期限切れは報告しません。ベーステーブルの `changelog.ttl_seconds` に照らして消費の遅延を監視し、オフセットの期限切れエラーを確認してください。[保持とクリーンアップ](changelog#retention-and-cleanup)を参照してください |
| 消費履歴 | `information_schema.table_stream_consumption` の `LAST_CONSUMPTION_TIME` | 消費ジョブが予定どおり実行されているかを確認できます |

### 復旧 {#recovery}

| 状況 | 対処方法 |
|---|---|
| 消費ステートメントが失敗した | オフセットは変わりません。必要な変更が保持期間内に残っている間に再実行してください |
| 必要な変更が `changelog.ttl_seconds` に従って期限切れになった | `@reset()` を使って下流を全件再データロードし、オフセットを合わせ直してください。期限切れのオフセットでは `min_delta` の読み取りは失敗します。`detail` と `append_only` は期限切れの変更をスキップします |
| 消費には成功したが、スケジューラーに記録されなかった | 再実行すると次の変更バッチを読み取り、前回のバッチを再び消費することはありません。再実行による副作用を完全になくすには、ターゲットテーブルに Unique Key モデルを使ってください（主キーによる書き込みは自然に冪等になります） |
| 下流のデータが誤っており、再構築が必要 | `@snapshot()` を使って消費オフセットに対応する状態を復元し、増分消費を続けてください。または、`@reset()` で全件再データロードすると、オフセットも現在位置まで進みます |
| FE の再起動またはマスターの切り替え | オフセットはメタデータに永続化されており、再起動後も消費を続けられます |

## よくあるエラー {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| エラーメッセージ | 原因 | 対処方法 |
|---|---|---|
| `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | FE で `enable_table_stream` が有効になっていません | `fe.conf` を更新し、FE を再起動してください |
| `Insert plan with Table stream failed. should enable changelog feature in FE config.` | FE で `enable_feature_changelog` が有効になっていません | `fe.conf` を更新し、FE を再起動してください |
| `Base Olap table ... need to enable changelog for table stream` | ベーステーブルで Changelog が有効になっていません | `"changelog.enable" = "true"` を指定してベーステーブルを再作成してください |
| `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` | `min_delta`（デフォルトのタイプ）には変更前のイメージが必要です | `changelog.need_historical_value` を有効にしてベーステーブルを再作成するか、`append_only` を使用してください |
| `not supported type: xxx` | `type` の値が無効です | `append_only` / `min_delta` / `detail` を使用してください |
| `target offset already consumed` | 同じパーティションが同時に消費され、このトランザクションのコミット前にオフセットが進みました | 再実行して次のバッチを読み取り、同時に消費するコンシューマーを避けてください |
| `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` | 分離モードで明示的なトランザクション内または Group Commit を使って消費しているか、ターゲットが内部テーブルではありません | 通常の `INSERT INTO ... SELECT` を使用してください |
| `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` | ひとつのステートメントで扱うパーティションが多すぎます | `PARTITION` を使って分割して消費するか、設定値を引き上げてください |
| `Cloud Table Stream only supports DROP STREAM ... FORCE` | 分離モードで `FORCE` を付けずに `DROP STREAM` を実行しています | `DROP STREAM ... FORCE` を使用してください |
| `Unknown column '__DORIS_STREAM_CHANGE_TYPE_COL__' ...` | `@snapshot()` / `@reset()` で仮想カラムを参照しています | イメージの読み取りでは仮想カラムは提供されません |
