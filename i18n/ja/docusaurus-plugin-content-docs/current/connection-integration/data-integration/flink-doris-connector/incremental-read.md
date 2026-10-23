---
{
    "title": "Doris Changelog による増分読み取り",
    "language": "ja",
    "description": "changelog を有効にした Doris テーブルの行単位の変更を、Flink Doris Connector で継続的に読み取る方法。起動モード、変更タイプ、配信セマンティクス、オフセットテーブル、オプションについて説明します。"
}
---

# Doris Changelog による増分読み取り {#incremental-reading-with-doris-changelog}

changelog を有効にした Doris テーブル（`"changelog.enable" = "true"`）では、Flink Doris Connector を使用して行単位の変更を継続的に読み取れます。新しいコンシューマーでは、`initial` モードでまず現在のテーブルのスナップショットを読み取り、その後、増分読み取りに切り替えます。この切り替えに必要な変更が、ソーステーブルの changelog 保持期間内に残っている必要があります。

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

ジョブの開始後、`test.student_changelog_source` に対する変更は Flink の changelog レコードとして継続的に出力されます。新しいコンシューマーの起動モードは `source.scan.mode` で選択します。

| モード | 動作 |
| ---- | -------- |
| `snapshot` | 現在のスナップショットを読み取り、停止します。デフォルトのモードです。 |
| `initial` | 現在のスナップショットを読み取り、完了後に Doris changelog の継続的な読み取りへ切り替えます。 |
| `latest` | スナップショットを読み飛ばし、ジョブ開始後に生成された変更を読み取ります。 |
| `from-timestamp` | スナップショットを読み飛ばし、`source.scan.timestamp` で `yyyy-MM-dd HH:mm:ss` 形式で指定した時刻を含め、そこからの変更を読み取ります。 |

ジョブを再開する際は、保存済みの消費進捗が起動モードより優先されます。復旧時のルールについては、[Doris への消費進捗の公開](#offset-table) を参照してください。復元したオフセットと `from-timestamp` の開始位置には、どちらもソーステーブルの `changelog.ttl_seconds` が適用されます。期限切れ時の動作については、以下を参照してください。

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

必要な変更が期限切れになった場合、既存のオフセットから完全な増分復旧を行うことはできません。下流のデータを現在のソーステーブルと整合させる必要があるジョブでは、期限切れの Checkpoint または Savepoint を復元せずに、`source.scan.mode = 'initial'` で新たな初期読み込みを開始し、新しいスナップショットから下流のデータを再構築してください。オフセットテーブルを設定している場合は、保存済みのレコードがない新しい `source.changelog.consumer-id` を使用するか、`source.changelog.offset-table` と `source.changelog.consumer-id` の両方を削除してください。そうしないと、古い Flink の状態または外部オフセットが引き続き `initial` より優先され、新しい全体スナップショットが開始されません。

新しいスナップショットで再構築できるのは現在のテーブルの状態であり、期限切れになった過去のイベントは再現できません。`latest` または新しい時刻を指定した `from-timestamp` で開始した場合も、欠落した期間はスキップされます。これらのモードは、その期間をスキップしても問題がない場合、または欠落したデータを別途復旧した場合にのみ使用してください。

## 配信セマンティクスと重複排除 {#delivery}

必要な変更レコードがすべて Doris に保持されている間、Doris ソースは増分読み取りに対して少なくとも一回の配信を提供します。障害後には変更イベントが再生され、Flink のクエリ結果に影響する可能性があります。Flink の CDC イベント重複排除はデフォルトで無効です。使用するには、クエリを送信する前に次のオプションを設定します。

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

このオプションを有効にする場合、上の例のようにソーステーブルで主キーを宣言する必要があります。Flink は追加のステートフル演算子を使用して Flink changelog を正規化します。詳しくは [Flink 設定リファレンス](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) を参照してください。

Checkpoint は消費状態を保存し、CDC の重複排除は再生されたイベントを処理します。どちらも Doris changelog の期限切れを防ぐことはできず、期限切れによってすでに失われたイベントも復旧できません。

## 消費進捗を Doris に公開する（任意） {#offset-table}

任意のオフセットテーブルは、消費進捗の確認と、Checkpoint または Savepoint から復元しないジョブの自動再開のために、消費進捗を Doris に保存します。

ジョブを送信する前に、次のオフセットテーブルを作成します。`username` と `password` で設定した Doris アカウントには、このテーブルに対する `SELECT` 権限と `INSERT` 権限が必要です。

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

Flink Checkpoint を有効にしたまま、上の例のソーステーブルの `WITH` 句に次のオプションを追加します。

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.changelog.offset-table' = 'ops.flink_source_offsets',
'source.changelog.consumer-id' = 'student-sync'
```

ジョブの再起動時は、同じオフセットテーブルと `source.changelog.consumer-id` を使用してください。消費進捗が上書きされないよう、異なるジョブやソーステーブルには異なる ID を使用してください。

`offset_timestamp` は、次の増分読み取りでその位置を含めて読み取りを開始する位置です。Checkpoint が成功すると、Connector はその Checkpoint に反映された消費進捗を非同期で保存し、書き込みに失敗した場合は再試行します。保存済みの進捗は実際の進捗より遅れる場合があるため、再開時に一部のデータが再度読み取られる可能性があります。

進捗が公開されたら、Doris で照会します。

```sql
SELECT consumer_id, offset_timestamp
FROM ops.flink_source_offsets
WHERE consumer_id = 'student-sync';
```

結果の例：

```text
+--------------+---------------------+
| consumer_id  | offset_timestamp    |
+--------------+---------------------+
| student-sync | 2026-10-09 10:00:00 |
+--------------+---------------------+
```

開始位置は、次の順序で最初に一致したルールによって決まります。

| 条件 | 動作 |
| ---- | ---- |
| ジョブを Checkpoint または Savepoint から復元する | 保存済みの消費状態を使用します。 |
| オフセットテーブルに現在の `consumer-id` のレコードがある | 起動モードの開始位置より優先して、`offset_timestamp` から再開します。`initial` の場合もスナップショットをスキップします。 |
| オフセットテーブルが設定されていない、またはそのコンシューマーのレコードがない | `source.scan.mode` に従って開始します。 |

設定したオフセットテーブルが存在しないか読み取れない場合、またはそのコンシューマーのレコードが重複しているかタイムスタンプが無効な場合は、起動モードに切り替わることなく起動に失敗します。

オフセットテーブルに保存されるのは消費の開始位置だけで、下流の Flink オペレーターやシンクの状態は保存されません。それらの状態を復旧するには、Checkpoint または Savepoint を復元してください。期限切れのオフセットについては、[changelog の期限切れ後の復旧](#changelog-expiration-recovery) を参照してください。

## オプション {#options}

以下のオプションで増分読み取りを制御します。その他のソースオプションについては、[Doris からのデータ読み取り](./read.md#options) を参照してください。

| キー                         | デフォルト値 | 必須 | 説明                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | ソースの起動モード。指定できる値は `snapshot`、`initial`、`latest`、`from-timestamp` です。                                                           |
| source.scan.timestamp       | --            | N        | `from-timestamp` の場合に必須です。`yyyy-MM-dd HH:mm:ss` 形式で指定する、その時刻を含む開始時刻。保存済みの消費進捗が優先されます。詳しくは [復旧ルール](#offset-table) を参照してください。 |
| source.changelog.increment-type | detail    | N        | 変更タイプ。`detail`、`min_delta`、`append_only` を指定できます。開始位置が期限切れの場合、`detail` / `append_only` は期限切れの変更をスキップし、`min_delta` は失敗します。 |
| source.changelog.poll-interval | 10s        | N        | 新しい変更をポーリングする間隔。最小値は 1 秒です。                                                                                        |
| source.changelog.visible-wait-timeout | 5m         | N        | Doris がトランザクションの可視化待機タイムアウトエラーを返した後、Connector が同じ読み取り範囲を再試行する最大時間。再試行を無効にするには `0s` を設定します。負の値は無効です。 |
| source.changelog.offset-table  | --         | N        | 消費進捗を保存し、読み取りを再開するための Doris テーブル。事前に作成し、`database.table` 形式で指定します。`source.changelog.consumer-id` および `jdbc-url` とともに設定します。増分読み取りモードでのみサポートされます。 |
| source.changelog.consumer-id   | --         | N        | オフセットテーブル内で一意のコンシューマージョブ識別子。同じジョブを再起動する際は変更しないでください。 |
