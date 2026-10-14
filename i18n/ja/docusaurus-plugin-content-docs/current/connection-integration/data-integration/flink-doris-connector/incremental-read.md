---
{
    "title": "Doris Binlog を使用した増分読み取り",
    "language": "ja",
    "description": "ROW 形式の Binlog を有効にした Doris テーブルの行単位の変更を、Flink Doris Connector で継続的に読み取る方法を説明します。開始モード、変更タイプ、配信セマンティクス、オフセットテーブル、オプションを扱います。"
}
---

# Doris Binlog を使用した増分読み取り {#incremental-reading-with-doris-binlog}

ROW 形式の Binlog を有効にした Doris テーブルでは、Flink Doris Connector を使用して行単位の変更を継続的に読み取れます。`initial` モードでは、Connector はまず現在のテーブルのスナップショットを読み取り、その後、増分読み取りに切り替えます。この切り替えに必要な変更は、ソーステーブルの Binlog 保持期間内に残っている必要があります。

:::info バージョン要件
この機能には Flink Doris Connector 26.3.0 以降と Doris 5.0.0 以降が必要です。Row Binlog は Doris 5.0.0 の実験的機能であり、FE の設定で `enable_feature_binlog = true` を指定して有効にする必要があります。テーブルでの有効化方法、対応するテーブルモデル、制限事項については、[Row Binlog](../../../data-operate/incremental/row-binlog.md) を参照してください。
:::

## 例 {#example}

まず、Doris のソーステーブルで ROW 形式の Binlog を有効にします。コンシューマーが更新前の行の値を必要とする場合は、`binlog.need_historical_value` が必要です。

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_binlog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);

INSERT INTO test.student_binlog_source VALUES (1, 'Alice', 18);
```

次に、Flink Checkpoint を有効にして、Doris のソーステーブルを作成します。

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_binlog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_binlog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_binlog;
```

## 開始モード {#scan-mode}

ジョブの開始後、`test.student_binlog_source` に対する変更は Flink の変更ログレコードとして継続的に出力されます。開始モードは `source.scan.mode` で選択します。

| モード | 動作 |
| ---- | ---- |
| `snapshot` | 現在のスナップショットを読み取って停止します。デフォルトのモードです。 |
| `initial` | 現在のスナップショットを読み取り、完了後に Binlog の継続的な読み取りに切り替えます。 |
| `latest` | スナップショットをスキップし、ジョブの開始後に生成された変更を読み取ります。 |
| `from-timestamp` | スナップショットをスキップし、`source.scan.timestamp` で `yyyy-MM-dd HH:mm:ss` 形式で指定した時刻を含め、その時刻以降の変更を読み取ります。 |

Flink Checkpoint または Savepoint から復元する場合、Connector は保存済みの消費状態から再開します。`source.scan.mode` または `source.scan.timestamp` を変更しても、その状態はリセットされません。復元したオフセットと `from-timestamp` の開始時刻には、どちらもソーステーブルの `binlog.ttl_seconds` が適用されます。有効期限が切れた場合の動作は後述します。

## 変更タイプ {#increment-type}

デフォルトでは、Connector は `detail` モードで行全体の変更を出力します。最小限の変更セットを取得するには `source.binlog.increment-type` を `min_delta` に、追加イベントのみを取得するには `append_only` に設定します。

Connector は Doris の `@incr` クエリを使用して変更を読み取ります。要求した開始位置が `binlog.ttl_seconds` に従って期限切れになっている場合、動作は変更タイプによって異なります。

| 変更タイプ | 開始位置が期限切れの場合の動作 |
| ---- | ---- |
| `detail`（デフォルト）、`append_only` | Doris は実際の開始位置を保持されている最初の TSO に進め、期限切れの変更をスキップします。ジョブは期限切れエラーなしで続行できますが、スキップされた変更は出力に含まれません。 |
| `min_delta` | 不完全な差分変更を返す代わりに、読み取りは `Row binlog offset has expired according to binlog.ttl_seconds` エラーで失敗します。 |

これらの規則は、通常の消費中、初期スナップショットの後、保存済みの状態から復元するときに適用されます。ジョブが実行中であることや Checkpoint が成功したことは、変更が期限切れになっていない証拠にはなりません。`source.binlog.visible-wait-timeout` は期限切れエラーを再試行しません。

## 注意事項 {#notes}

- 増分読み取りには Arrow Flight SQL を使用します。Connector はこれをデフォルトで有効にし、ポートを自動的に検出します。
- Flink Checkpoint を有効にしてください。
- Doris の `binlog.ttl_seconds` のデフォルト値は `86400` 秒（一日）で、`0` より大きくする必要があります。有効期限は Flink ジョブやその Checkpoint を待たずに適用されます。TTL を延長しても、物理的に削除されたレコードは復元できません。
- 初期スナップショットの所要時間、消費の遅れ、障害から復旧して追いつくまでに必要な時間を、余裕を持ってカバーできる TTL を設定してください。古い Checkpoint または Savepoint から復元する場合も含め、ジョブが引き続き必要とする最も古い変更の経過時間を監視してください。
- 物理的な自動クリーンアップを行うには、BE でも `enable_feature_binlog = true` を有効にし、自動 compaction を有効のままにしてください。物理的なクリーンアップが完了する前でも、増分クエリは期限切れのレコードを除外します。[Row Binlog の保持とクリーンアップ](../../../data-operate/incremental/row-binlog.md#retention-and-cleanup) を参照してください。
- Binlog の増分読み取りでは、Doris は読み取り範囲内でソーステーブルに影響する処理中のトランザクションが完了するまで待機します。待機がタイムアウトすると、読み取りはエラーを返します。Connector はこのエラーに限り、同じ読み取り範囲を `source.binlog.visible-wait-timeout`（デフォルト: `5m`）まで再試行します。`0s` に設定すると Connector の再試行を無効にします。その他のエラーでは直ちに失敗します。

### Binlog の期限切れ後の復旧 {#binlog-expiration-recovery}

必要な変更が期限切れになった場合、既存のオフセットから完全な増分復旧はできません。下流のデータを現在のソーステーブルと整合させる必要があるジョブでは、期限切れになった Checkpoint や Savepoint を復元せずに、`source.scan.mode = 'initial'` で新たに初期読み取りを開始し、新しいスナップショットから下流のデータを再構築してください。`initial` を設定しても、古い状態を復元すると、新しいスナップショットを最初から読み取る代わりに保存済みの状態から再開します。

新しいスナップショットで再構築できるのは現在のテーブル状態であり、期限切れになった過去のイベントは再現できません。`latest` またはより新しい `from-timestamp` で開始した場合も、欠落した期間はスキップされます。これらのモードは、その期間のスキップが許容される場合、または欠落したデータを別の方法で復旧済みの場合にのみ使用してください。

## 配信セマンティクスと重複排除 {#delivery}

Doris Binlog Source は、必要な変更レコードがすべて Doris に保持されている間、少なくとも一度の配信（at-least-once）を提供します。障害後に変更イベントが再送され、Flink のクエリ結果に影響することがあります。Flink の CDC イベント重複排除はデフォルトで無効です。使用するには、クエリを送信する前に次のオプションを設定します。

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

このオプションを有効にする場合、上記の例のように、ソーステーブルで主キーを宣言する必要があります。Flink は追加のステートフルなオペレーターを使用して変更ログを正規化します。詳しくは [Flink の設定リファレンス](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) を参照してください。

Checkpoint は消費状態を保存し、CDC の重複排除は再送されたイベントを処理します。どちらも Doris Binlog の期限切れを防ぐことはできず、期限切れで失われたイベントを復旧することもできません。

## Doris への消費進捗の記録（任意） {#offset-table}

消費進捗は Flink Checkpoint の状態に保存されます。任意で使用できるオフセットテーブルは、完了した Checkpoint に対応する進捗を確認するためだけのものです。Connector はジョブの開始時や再起動時に、このテーブルを読み取って消費を自動的に再開することはありません。

Doris で消費進捗を確認するには、次のオフセットテーブルを作成します。

```sql
CREATE DATABASE IF NOT EXISTS ops;

CREATE TABLE ops.flink_source_offsets (
    consumer_id VARCHAR(256) NOT NULL,
    offset_timestamp DATETIME NOT NULL,
    update_time DATETIMEV2(3) NOT NULL
)
UNIQUE KEY(consumer_id)
DISTRIBUTED BY HASH(consumer_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.binlog.offset-table' = 'ops.flink_source_offsets',
'source.binlog.consumer-id' = 'student-sync'
```

`source.binlog.consumer-id` は、オフセットテーブル内のコンシューマージョブを識別します。同じジョブの再起動後も進捗を追跡できるよう、この値を変更しないでください。

Flink Checkpoint または Savepoint から復元できず、保存された `offset_timestamp` 以降に必要な変更がすべて保持されている場合は、その値を `source.scan.timestamp` にコピーし、`source.scan.mode` を `from-timestamp` に設定することで、当該オフセットから手動で再開できます。期限切れの場合は、[Binlog の期限切れ後の復旧](#binlog-expiration-recovery) に従ってください。期限切れのタイムスタンプをコピーしても、欠落した変更は復旧できません。たとえば、次のタイムスタンプがまだ保持期間内にある場合は、以下のように設定します。

```sql
'source.scan.mode' = 'from-timestamp',
'source.scan.timestamp' = '2026-10-09 10:00:00'
```

## オプション {#options}

以下のオプションで増分読み取りを制御します。その他のソースオプションは、[Doris からのデータ読み取り](./read.md#options) に記載されています。

| キー | デフォルト値 | 必須 | 説明 |
| --- | --- | --- | --- |
| source.scan.mode | snapshot | N | ソースの開始モード。指定できる値は `snapshot`、`initial`、`latest`、`from-timestamp` です。 |
| source.scan.timestamp | -- | N | `yyyy-MM-dd HH:mm:ss` 形式で指定する読み取り開始時刻。この時刻の変更も読み取ります。`from-timestamp` の場合にのみ必須です。開始位置が期限切れの場合は、[変更タイプ](#increment-type) に記載した動作に従います。期限切れの変更は復旧できません。 |
| source.binlog.increment-type | detail | N | Binlog の変更タイプ: `detail`、`min_delta`、`append_only`。開始位置が期限切れの場合、`detail` / `append_only` は期限切れの変更をスキップし、`min_delta` は失敗します。 |
| source.binlog.poll-interval | 10s | N | 新しい Binlog データをポーリングする間隔。最小値は 1 秒です。 |
| source.binlog.visible-wait-timeout | 5m | N | Doris がトランザクションの可視性待機タイムアウトエラーを返した後、Connector が同じ読み取り範囲を再試行する最大時間。`0s` に設定すると再試行を無効にします。負の値は無効です。 |
| source.binlog.offset-table | -- | N | 完了した Checkpoint に対応するオフセットを確認用に記録する Doris テーブル。`database.table` 形式で指定します。自動復旧には使用しません。`source.binlog.consumer-id` と `jdbc-url` も設定してください。 |
| source.binlog.consumer-id | -- | N | `source.binlog.offset-table` に書き込む、再起動後も同じ値を使うコンシューマー識別子。 |
