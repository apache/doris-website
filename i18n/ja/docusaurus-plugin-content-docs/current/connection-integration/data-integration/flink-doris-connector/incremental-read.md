---
{
    "title": "Doris Changelog による増分読み取り",
    "language": "ja",
    "description": "changelog を有効にした Doris テーブルの行単位の変更を、Flink Doris Connector で継続的に読み取る方法。起動モード、変更タイプ、配信セマンティクス、オフセットテーブル、オプションについて説明します。"
}
---

# Doris Changelog による増分読み取り {#incremental-reading-with-doris-changelog}

changelog を有効にした Doris テーブル（`"changelog.enable" = "true"`）では、Flink Doris Connector を使用して行単位の変更を継続的に読み取れます。`initial` モードでは、Connector はまず現在のテーブルのスナップショットを読み取り、その後、増分読み取りに切り替えます。この切り替えに必要な変更が、ソーステーブルの changelog 保持期間内に残っている必要があります。

:::info バージョン要件
この機能には Flink Doris Connector 26.4.0 以降と Doris 5.0.0 以降が必要です。Doris changelog は Doris 5.0.0 の実験的機能であり、FE の設定で `enable_feature_changelog = true` を指定して有効にする必要があります。テーブルでの有効化方法、対応するテーブルモデル、制限事項については、[Changelog](../../../data-operate/incremental/changelog.md) を参照してください。
:::

## 例 {#example}

まず、Doris のソーステーブルを作成するときに changelog を有効にします。利用側で更新前の行イメージが必要な場合は、`changelog.need_historical_value` の設定が必要です。

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_changelog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);

INSERT INTO test.student_changelog_source VALUES (1, 'Alice', 18);
```

次に、Flink Checkpoint を有効にし、Doris のソーステーブルを作成します。

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_changelog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_changelog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_changelog;
```

## 起動モード {#scan-mode}

ジョブの開始後、`test.student_changelog_source` に対する変更は Flink の changelog レコードとして継続的に出力されます。起動モードは `source.scan.mode` で選択します。

| モード | 動作 |
| ---- | -------- |
| `snapshot` | 現在のスナップショットを読み取り、停止します。デフォルトのモードです。 |
| `initial` | 現在のスナップショットを読み取り、完了後に Doris changelog の継続的な読み取りへ切り替えます。 |
| `latest` | スナップショットを読み飛ばし、ジョブ開始後に生成された変更を読み取ります。 |
| `from-timestamp` | スナップショットを読み飛ばし、`source.scan.timestamp` で `yyyy-MM-dd HH:mm:ss` 形式で指定した時刻を含め、そこからの変更を読み取ります。 |

Flink Checkpoint または Savepoint から復元すると、Connector は保存済みの消費状態から再開します。`source.scan.mode` や `source.scan.timestamp` を変更しても、その状態はリセットされません。復元したオフセットと `from-timestamp` の開始位置には、どちらもソーステーブルの `changelog.ttl_seconds` が適用されます。期限切れ時の動作については、以下を参照してください。

## 変更タイプ {#increment-type}

デフォルトでは、Connector は `detail` モードで行全体の変更を出力します。最小限の変更セットを取得するには `source.changelog.increment-type` を `min_delta` に、追加イベントのみを取得するには `append_only` に設定します。

Connector は Doris の `@incr` クエリを使用して変更を読み取ります。指定した開始位置が `changelog.ttl_seconds` に従って期限切れになっている場合、動作は変更タイプによって異なります。

| 変更タイプ | 開始位置が期限切れの場合の動作 |
| ---- | ---- |
| `detail`（デフォルト）、`append_only` | Doris は実際の開始位置を保持されている最初の TSO に移し、期限切れの変更をスキップします。ジョブは期限切れエラーなしで続行できますが、それらの変更は出力に含まれません。 |
| `min_delta` | 不完全な差分を返す代わりに、読み取りが `Changelog offset has expired according to changelog.ttl_seconds` というエラーで失敗します。 |

これらの規則は、通常の消費中、初期スナップショットの後、保存済みの状態から復元するときに適用されます。ジョブが実行中であることや Checkpoint が成功したことは、変更が期限切れになっていないことの証明にはなりません。`source.changelog.visible-wait-timeout` は期限切れエラーを再試行しません。

## 注意事項 {#notes}

- 増分読み取りには Arrow Flight SQL を使用します。Connector はデフォルトでこれを有効にし、ポートを自動検出します。
- Flink Checkpoint を有効にしてください。
- Doris の `changelog.ttl_seconds` のデフォルトは `86400` 秒（一日）で、`0` より大きい値にする必要があります。期限切れの判定は Flink ジョブやその Checkpoint を待ちません。TTL を増やしても、物理的に削除されたレコードは復元できません。
- TTL には、初期スナップショットの所要時間、消費の遅れ、障害から復旧して追いつくまでに必要な時間を、余裕を持って含めてください。古い Checkpoint または Savepoint から復元する場合も含め、ジョブがまだ必要とする最も古い変更の経過時間を監視してください。
- 自動的な物理削除を行うには、BE でも `enable_feature_changelog = true` を有効にし、自動 compaction を有効にしておきます。物理削除が完了する前でも、増分クエリは期限切れのレコードを除外します。[Changelog の保持と削除](../../../data-operate/incremental/changelog.md#retention-and-cleanup) を参照してください。
- 増分読み取りでは、Doris は読み取り範囲内でソーステーブルに影響する進行中のトランザクションが完了するまで待ちます。待機がタイムアウトすると、読み取りはエラーを返します。Connector が同じ読み取り範囲を再試行するのはこのエラーの場合だけで、最大 `source.changelog.visible-wait-timeout`（デフォルト: `5m`）まで再試行します。Connector の再試行を無効にするには `0s` を設定します。その他のエラーでは直ちに失敗します。

### changelog の期限切れ後の復旧 {#changelog-expiration-recovery}

必要な変更が期限切れになった場合、既存のオフセットから完全な増分復旧を行うことはできません。下流のデータを現在のソーステーブルと整合させる必要があるジョブでは、期限切れの Checkpoint または Savepoint を復元せずに、`source.scan.mode = 'initial'` で新たな初期読み込みを開始し、新しいスナップショットから下流のデータを再構築してください。古い状態を復元しながら `initial` を設定しても、新しい全体スナップショットは開始されず、保存済みの状態から再開します。

新しいスナップショットで再構築できるのは現在のテーブルの状態であり、期限切れになった過去のイベントは再現できません。`latest` または新しい時刻を指定した `from-timestamp` で開始した場合も、欠落した期間はスキップされます。これらのモードは、その期間をスキップしても問題がない場合、または欠落したデータを別途復旧した場合にのみ使用してください。

## 配信セマンティクスと重複排除 {#delivery}

必要な変更レコードがすべて Doris に保持されている間、Doris ソースは増分読み取りに対して少なくとも一回の配信を提供します。障害後には変更イベントが再生され、Flink のクエリ結果に影響する可能性があります。Flink の CDC イベント重複排除はデフォルトで無効です。使用するには、クエリを送信する前に次のオプションを設定します。

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

このオプションを有効にする場合、上の例のようにソーステーブルで主キーを宣言する必要があります。Flink は追加のステートフル演算子を使用して Flink changelog を正規化します。詳しくは [Flink 設定リファレンス](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) を参照してください。

Checkpoint は消費状態を保存し、CDC の重複排除は再生されたイベントを処理します。どちらも Doris changelog の期限切れを防ぐことはできず、期限切れによってすでに失われたイベントも復旧できません。

## 消費進捗を Doris に公開する（任意） {#offset-table}

消費進捗は Flink Checkpoint の状態に保存されます。任意のオフセットテーブルは、完了した Checkpoint に反映された進捗を確認するためだけに使用します。ジョブの開始時や再起動時に消費を自動的に再開するために、Connector がこのテーブルを読み取ることはありません。

Doris で消費進捗を照会するには、次のオフセットテーブルを作成します。

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
'source.changelog.offset-table' = 'ops.flink_source_offsets',
'source.changelog.consumer-id' = 'student-sync'
```

`source.changelog.consumer-id` は、オフセットテーブル内で消費側のジョブを識別します。同じジョブの進捗を追跡するには、再起動後も値を変更しないでください。

Flink Checkpoint または Savepoint から復元できず、保存された `offset_timestamp` 以降に必要な変更がすべて保持されている場合は、その値を `source.scan.timestamp` にコピーし、`source.scan.mode` を `from-timestamp` に設定すると、そのオフセットから手動で再開できます。期限切れになっている場合は、[changelog の期限切れ後の復旧](#changelog-expiration-recovery) に従ってください。期限切れのタイムスタンプをコピーしても、欠落した変更は復元されません。たとえば、次のタイムスタンプがまだ保持期間内にある場合は、以下のように設定します。

```sql
'source.scan.mode' = 'from-timestamp',
'source.scan.timestamp' = '2026-10-09 10:00:00'
```

## オプション {#options}

以下のオプションで増分読み取りを制御します。その他のソースオプションについては、[Doris からのデータ読み取り](./read.md#options) を参照してください。

| キー                         | デフォルト値 | 必須 | 説明                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | ソースの起動モード。指定できる値は `snapshot`、`initial`、`latest`、`from-timestamp` です。                                                           |
| source.scan.timestamp       | --            | N        | `yyyy-MM-dd HH:mm:ss` 形式の、指定時刻を含む開始時刻。`from-timestamp` の場合にのみ必須です。開始位置が期限切れの場合は、[変更タイプ](#increment-type) に記載された動作に従います。期限切れの変更は復旧できません。 |
| source.changelog.increment-type | detail    | N        | 変更タイプ。`detail`、`min_delta`、`append_only` を指定できます。開始位置が期限切れの場合、`detail` / `append_only` は期限切れの変更をスキップし、`min_delta` は失敗します。 |
| source.changelog.poll-interval | 10s        | N        | 新しい変更をポーリングする間隔。最小値は 1 秒です。                                                                                        |
| source.changelog.visible-wait-timeout | 5m         | N        | Doris がトランザクションの可視化待機タイムアウトエラーを返した後、Connector が同じ読み取り範囲を再試行する最大時間。再試行を無効にするには `0s` を設定します。負の値は無効です。 |
| source.changelog.offset-table  | --         | N        | 完了した Checkpoint に反映されたオフセットを確認用に公開する Doris テーブル。`database.table` 形式で指定します。自動復旧には使用しません。`source.changelog.consumer-id` および `jdbc-url` とともに設定します。 |
| source.changelog.consumer-id   | --         | N        | `source.changelog.offset-table` に書き込む、変更しない消費者識別子。                                                                                |
