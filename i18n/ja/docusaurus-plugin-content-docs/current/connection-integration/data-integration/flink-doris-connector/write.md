---
{
    "title": "Doris へのデータ書き込み",
    "language": "ja",
    "description": "Flink Doris Connector を使用して Stream Load 経由で Doris に書き込む方法を説明します。ストリーミングとバッチの書き込みモード、S3 TVF による書き込み、列の部分更新、Bitmap のインポート、指定列に基づく削除、Sink オプション、監視メトリクスを扱います。"
}
---

# Doris へのデータ書き込み

Flink Doris Connector は Flink 内でデータをバッチにまとめ、Stream Load を介して Doris に書き込みます。このページでは、書き込みモード、FlinkSQL を使用した書き込み、一般的な書き込みシナリオ、Sink オプションを説明します。DataStream API を使用した書き込みについては、[DataStream API](./datastream-api.md#sink) を参照してください。

## 書き込みモード {#write-modes}

データの書き込み時、Flink Doris Connector は Flink のメモリ内でデータをバッチにまとめ、Stream Load を介して Doris に一括インポートします。Connector には二つのバッチ処理モードがあり、デフォルトでは Flink Checkpoint に基づくストリーミング書き込みを使用します。

| 比較項目 | ストリーミング書き込み | バッチ書き込み |
| --- | --- | --- |
| トリガー条件 | Flink Checkpoint に依存し、Checkpoint の各サイクルで Doris に書き込む | Connector 内で時間とデータ量のしきい値に基づいて定期的にコミットする |
| 一貫性 | Exactly-Once | At-Least-Once。主キーモデルを使用すると Exactly-Once を保証できる |
| レイテンシー | Checkpoint 間隔に制約され、通常は高い | 独立したバッチ処理の仕組みにより、柔軟に調整できる |
| 障害許容性と復旧 | Flink の状態復旧と完全に一致する | 外部の重複排除ロジック（Doris の主キーによる重複排除など）に依存する |

- **ストリーミング書き込み**（デフォルト）：Checkpoint を有効にする必要があります。上流のデータはメモリ内に保持されるのではなく、Checkpoint の期間中も継続的に Doris に書き込まれ、二相コミットによって Exactly-Once が保証されます。ジョブの再起動時には、最新の Checkpoint または Savepoint から復旧する必要があります。そうしないと、ラベルの重複エラーで書き込みに失敗します（[FAQ](./faq.md) を参照）。
- **バッチ書き込み**：Connector 1.5.0 以降でサポートされています。Checkpoint に依存しません。データはメモリ内にキャッシュされ、`sink.buffer-flush.max-rows`、`sink.buffer-flush.max-bytes`、`sink.buffer-flush.interval` に従ってフラッシュされます。`'sink.enable.batch-mode' = 'true'` で有効にします。Exactly-Once は保証されません。Unique モデルを使用すると、べき等な書き込みを実現できます。

Stream Load のほか、`'sink.write-mode' = 'TVF'` を設定すると、データをまず S3 互換オブジェクトストレージに一時保存し、その後 S3 テーブル値関数を介して Doris にロードできます。[S3 TVF を使用した書き込み](#tvf)を参照してください。

## FlinkSQL による書き込み {#flink-sql}

Flink の [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) を使用して、上流から継続的に生成されるデータをシミュレートします。

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'datagen',
    'rows-per-second' = '1',
    'fields.name.length' = '20',
    'fields.id.min' = '1',
    'fields.id.max' = '100000',
    'fields.age.min' = '3',
    'fields.age.max' = '30'
);

-- doris sink
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '10.16.10.6:28737',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = 'password',
    'sink.label-prefix' = 'doris_label'
    -- 'sink.enable.batch-mode' = 'true'  Add this configuration to use batch write
);

INSERT INTO student_sink SELECT * FROM student_source;
```

## S3 TVF を使用した書き込み {#tvf}

TVF 書き込みモードでは、まずデータを JSON 形式で S3 オブジェクトストレージに一時保存し、その後 S3 テーブル値関数を介して Doris にインポートします。データ転送にオブジェクトストレージを使用したい場合や、Stream Load のネットワーク経路を利用できない場合に使用します。

使用前に、Flink と Doris の両方が S3 にアクセスできること、および Doris に対象テーブルがすでに存在することを確認してください。

```sql
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_tvf_sink (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'test.student_tvf',
    'username' = 'root',
    'password' = '',
    'sink.write-mode' = 'TVF',
    'sink.label-prefix' = 'student_tvf',
    'sink.s3.endpoint' = 'https://s3.example.com',
    'sink.s3.region' = 'us-east-1',
    'sink.s3.bucket' = 'staging-bucket',
    'sink.s3.prefix' = 'doris/student',
    'sink.s3.access-key' = 'access-key',
    'sink.s3.secret-key' = 'secret-key'
);

INSERT INTO student_tvf_sink VALUES (1, 'Alice', 18);
```

Connector は、S3 に一時保存したオブジェクトを自動的には削除しません。必要に応じて、オブジェクトストレージのライフサイクルポリシーを設定してください。

## 一般的な書き込みシナリオ

### 列の部分更新 {#partial-column-update}

列の部分更新を有効にするには、Stream Load パラメータ `partial_columns` を設定し、更新する列を `columns` に列挙します。テーブル側の要件については、[列の部分更新](../../../data-operate/update/partial-column-update.md)を参照してください。

```sql
CREATE TABLE doris_sink (
    id INT,
    name STRING,
    bank STRING,
    age int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'database.table',
    'username' = 'root',
    'password' = '',
    'sink.properties.format' = 'json',
    'sink.properties.read_json_by_line' = 'true',
    'sink.properties.columns' = 'id,name,bank,age', -- Columns to update
    'sink.properties.partial_columns' = 'true' -- Enable partial column update
);
```

### Bitmap データのインポート {#bitmap}

`to_bitmap` 関数を `sink.properties.columns` 内で使用し、整数列を Bitmap に変換します。

```sql
CREATE TABLE bitmap_sink (
    dt int,
    page string,
    user_id int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.bitmap_test',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label',
    'sink.properties.columns' = 'dt,page,user_id,user_id=to_bitmap(user_id)'
)
```

### 指定した列に基づくデータの削除 {#delete-by-column}

Kafka のメッセージでは、`{"op_type":"delete",data:{...}}` のように、特定のフィールドで操作種別を示すことがよくあります。このようなデータでは、`op_type=delete` のレコードを削除できます。

デフォルトでは、DorisSink は RowKind に基づいてイベント種別を区別します。CDC の場合はイベント種別を直接取得でき、隠し列 `__DORIS_DELETE_SIGN__` に値を設定して削除を実行します。Kafka の場合は、アプリケーションロジックで値を判定し、その値を隠し列に明示的に渡す必要があります。

```sql
-- For example, upstream data: {"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
CREATE TABLE KAFKA_SOURCE(
    data STRING,
    op_type STRING
) WITH (
    'connector' = 'kafka',
    ...
);

CREATE TABLE DORIS_SINK(
    id INT,
    name STRING,
    __DORIS_DELETE_SIGN__ INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'db.table',
    'username' = 'root',
    'password' = '',
    'sink.enable-delete' = 'false',        -- false means do not get the event type from RowKind
    'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of Stream Load
);

INSERT INTO DORIS_SINK
SELECT json_value(data, '$.id') as id,
    json_value(data, '$.name') as name,
    if(op_type = 'delete', 1, 0) as __DORIS_DELETE_SIGN__
from KAFKA_SOURCE;
```

### CDC 変更ログデータの書き込み {#cdc-changelog}

上流が Flink CDC または Debezium 形式の変更データの場合、DorisSink は RowKind によって挿入、更新、削除イベントを区別し、`sink.enable-delete` を介して削除イベントを Doris に同期します（Unique モデルが必要です）。完全な例については、[データベース全体の同期（Flink CDC）](./cdc-sync.md#single-table-sync)を参照してください。DataStream API では、`JsonDebeziumSchemaSerializer` を使用します。詳細は [Debezium 形式](./datastream-api.md#debezium)を参照してください。

## オプション {#options}

以下に Sink オプションを示します。共通の接続オプションは、[接続オプションと TLS](./connection.md#common-options)に記載されています。

| キー | デフォルト値 | 必須 | 説明 |
| --- | --- | --- | --- |
| sink.label-prefix | -- | Y | インポートに使用するラベルのプレフィックス。2PC を使用する場合、Flink の EOS セマンティクスを保証するため、グローバルに一意である必要があります。 |
| sink.properties.* | -- | N | Stream Load のインポートパラメータ。たとえば、`'sink.properties.column_separator' = ', '` は列区切り文字を定義します。`'sink.properties.escape_delimiters' = 'true'` は特殊文字を区切り文字として使用することを示し、`\x01` はバイナリの `0x01` に変換されます。JSON 形式のインポートでは、`'sink.properties.format' = 'json'`、`'sink.properties.read_json_by_line' = 'true'` を指定します。詳細なパラメータについては、[Stream Load](../../../data-operate/import/import-way/stream-load-manual.md#import-configuration-parameters)を参照してください。Group Commit モードでは、`'sink.properties.group_commit' = 'sync_mode'` によってグループコミットを同期モードに設定します。Flink Connector は 1.6.2 以降、インポート時の Group Commit の設定をサポートしています。使用方法と制限については、[Group Commit](../../../data-operate/import/load-best-practices/group-commit-manual.md)を参照してください。26.1.0 以降、Stream Load では gz 圧縮がデフォルトで有効です。`'sink.properties.compress_type' = ''` を設定すると無効にできます。 |
| sink.enable-delete | TRUE | N | 削除を有効にするかどうか。このオプションを使用するには、Doris テーブルでバッチ削除が有効である必要があり（Doris 0.15 以降ではデフォルトで有効）、Unique モデルのみをサポートします。 |
| sink.enable-2pc | TRUE | N | 二相コミット（2pc）を有効にするかどうか。デフォルトは true で、Exactly-Once セマンティクスを保証します。二相コミットについては、[Stream Load 2PC](../../../data-operate/transaction.md#streamload-2pc)を参照してください。 |
| sink.write-mode | STREAM_LOAD | N | 書き込みモード。サポートされる値は `STREAM_LOAD`、`STREAM_LOAD_BATCH`、`TVF` です。 |
| sink.s3.endpoint | -- | TVF 書き込みモードでのみ必須 | S3 互換オブジェクトストレージのエンドポイント。 |
| sink.s3.region | -- | TVF 書き込みモードでのみ必須 | オブジェクトストレージのリージョン。 |
| sink.s3.bucket | -- | TVF 書き込みモードでのみ必須 | ファイルの一時保存に使用するバケット。 |
| sink.s3.prefix | -- | TVF 書き込みモードでのみ必須 | 一時保存するファイルのオブジェクトキープレフィックス。プレフィックスに glob 文字は使用できません。 |
| sink.s3.access-key | -- | TVF 書き込みモードでのみ必須 | オブジェクトストレージのアクセスキー。 |
| sink.s3.secret-key | -- | TVF 書き込みモードでのみ必須 | オブジェクトストレージのシークレットキー。 |
| sink.s3.path-style-access | FALSE | N | TVF モードでパス形式のオブジェクトストレージアクセスを使用するかどうか。 |
| sink.buffer-size | 1MB | N | 書き込みデータのキャッシュバッファーのサイズ（バイト単位）。変更は推奨されません。デフォルト設定で十分です。 |
| sink.buffer-count | 3 | N | 書き込みデータのキャッシュバッファーの数。変更は推奨されません。デフォルト設定で十分です。 |
| sink.max-retries | 3 | N | Commit に失敗した後の最大再試行回数。デフォルトは 3 です。 |
| sink.enable.batch-mode | FALSE | N | バッチモードで Doris に書き込むかどうか。有効にすると、書き込みタイミングは Checkpoint に依存せず、`sink.buffer-flush.max-rows`、`sink.buffer-flush.max-bytes`、`sink.buffer-flush.interval` の各パラメータで制御されます。有効にした場合、Exactly-Once セマンティクスは保証されなくなります。Unique モデルを使用すると、べき等性を実現できます。 |
| sink.flush.queue-size | 2 | N | バッチモードでのキャッシュキューのサイズ。 |
| sink.buffer-flush.max-rows | 500000 | N | バッチモードで一つのバッチに書き込む最大行数。 |
| sink.buffer-flush.max-bytes | 100MB | N | バッチモードで一つのバッチに書き込む最大バイト数。 |
| sink.buffer-flush.interval | 10s | N | バッチモードでキャッシュを非同期にフラッシュする間隔。 |
| sink.ignore.update-before | TRUE | N | 更新前イベントを無視するかどうか。デフォルトでは無視します。 |

## 監視メトリクス {#metrics}

Flink は、Flink クラスターのメトリクスを監視するためのさまざまな [Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) を提供しています。以下は Flink Doris Connector によって追加される監視メトリクスです。

| 名前 | メトリクスの種類 | 説明 |
| --- | --- | --- |
| totalFlushLoadBytes | Counter | フラッシュされ、インポートされた総バイト数。 |
| flushTotalNumberRows | Counter | インポートされ、処理された総行数。 |
| totalFlushLoadedRows | Counter | 正常にインポートされた総行数。 |
| totalFlushTimeMs | Counter | インポートの正常な完了に要した合計時間。 |
| totalFlushSucceededNumber | Counter | 成功したインポートの回数。 |
| totalFlushFailedNumber | Counter | 失敗したインポートの回数。 |
| totalFlushFilteredRows | Counter | データ品質の基準を満たさない行の総数。 |
| totalFlushUnselectedRows | Counter | where 条件によって除外された行の総数。 |
| beginTxnTimeMs | Histogram | FE にトランザクションの開始を要求するのに要した時間（ミリ秒）。 |
| putDataTimeMs | Histogram | FE にインポートデータの実行計画を要求するのに要した時間。 |
| readDataTimeMs | Histogram | データの読み取りに要した時間。 |
| writeDataTimeMs | Histogram | データの書き込み処理に要した時間。 |
| commitAndPublishTimeMs | Histogram | FE にトランザクションのコミットと公開を要求するのに要した時間。 |
| loadTimeMs | Histogram | インポートの完了に要した時間。 |
