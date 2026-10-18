---
{
    "title": "データロード FAQ",
    "language": "ja",
    "description": "問題の説明: データロード中に発生するデータ品質エラー。"
}
---

## データロードに関する一般的な FAQ {#general-load-faq}

### エラー「[DATA_QUALITY_ERROR] Encountered unqualified data」 {#error-data_quality_error-encountered-unqualified-data}
**問題の説明**: データロード中にデータ品質エラーが発生します。

**対処方法**:
- Stream Load と Insert Into の操作ではエラー URL が返されます。Broker Load の場合は、`Show Load` コマンドでエラー URL を確認できます。
- ブラウザーまたは curl コマンドでエラー URL にアクセスし、データ品質エラーの具体的な原因を確認します。
- strict_mode パラメータと max_filter_ratio パラメータを使用して、許容するエラー率を制御します。

### エラー「[E-235] Failed to init rowset builder」 {#error-e-235-failed-to-init-rowset-builder}
**問題の説明**: エラー -235 は、データロードの頻度が高すぎて適時に compaction が行われず、バージョン数の上限を超えた場合に発生します。

**対処方法**:
- データロードのバッチサイズを大きくし、データロードの頻度を下げます。
- `max_tablet_version_num` パラメータの値を `be.conf` で増やします。5000 を超えないことを推奨します。

### エラー「[E-238] Too many segments in rowset」 {#error-e-238-too-many-segments-in-rowset}
**問題の説明**: エラー -238 は、単一の rowset 内の segment 数が上限を超えた場合に発生します。

**主な原因**:
- テーブル作成時に設定した bucket 数が少なすぎます。
- データに偏りがあります。より均等に分散する bucket key の使用を検討してください。

### エラー「Transaction commit successfully, BUT data will be visible later」 {#error-transaction-commit-successfully-but-data-will-be-visible-later}
**問題の説明**: データロードは成功していますが、データが一時的に見えません。

**原因**: 通常は、システムリソースへの負荷によってトランザクションの publish が遅れているためです。

### エラー「Failed to commit kv txn [...] Transaction exceeds byte limit」 {#error-failed-to-commit-kv-txn--transaction-exceeds-byte-limit}
**問題の説明**: shared-nothing モードでは、単一のデータロードに関係する partition と tablet が多すぎると、トランザクションのサイズ上限を超えます。

**対処方法**:
- partition ごとにデータを分けてバッチでロードし、単一のデータロードに関係する partition の数を減らします。
- テーブル構造を最適化し、partition と tablet の数を減らします。

### CSV ファイルの最終列に余分な「\r」が入る {#extra-r-in-the-last-column-of-csv-file}
**問題の説明**: 通常は Windows の改行コードが原因です。

**対処方法**:
正しい行区切り文字を指定します: `-H "line_delimiter:\r\n"`

### 引用符を含む CSV データが null としてインポートされる {#csv-data-with-quotes-imported-as-null}
**問題の説明**: 引用符を含む CSV データが、インポート後に null になります。

**対処方法**:
`trim_double_quotes` パラメータを使用して、フィールドを囲む二重引用符を削除します。

## Stream Load {#stream-load}

### データロードが遅い原因 {#reasons-for-slow-loading}
- CPU、IO、メモリ、またはネットワークカードのリソースがボトルネックになっています。
- クライアントマシンと BE マシン間のネットワークが遅くなっています。クライアントから BE マシンへの ping の遅延を調べることで、初期診断ができます。
- Webserver のスレッド数がボトルネックになっています。単一の BE で同時に実行する Stream Load が多すぎると（be.conf の webserver_num_workers 設定を超えると）、スレッド数がボトルネックになることがあります。
- Memtable Flush のスレッド数がボトルネックになっています。BE メトリクス doris_be_flush_thread_pool_queue_size を確認し、キューへの滞留が深刻かどうかを調べてください。be.conf の flush_thread_num_per_store パラメータを増やすことで解消できます。

### 列名に含まれる特殊文字の扱い {#handling-special-characters-in-column-names}
列名に特殊文字が含まれる場合は、columns パラメータを指定する際に、バッククォートを含む単一引用符を使用します:
```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```

### Kafka Connect または Confluent 経由でデータロードする際の小さなバッチ {#small-batches-when-loading-through-kafka-connect-or-confluent}

Doris Kafka Connector のタスクが小さな Stream Load リクエストを頻繁に送信する場合は、タスクのバッファー設定を確認してください。たとえば、現在の設定が `buffer.count.records=10000` と `buffer.size.bytes=5000000` であれば、次のようにバッチを大きくして試すことを検討してください:

```properties
buffer.count.records=50000
buffer.size.bytes=104857600
```

これらは Doris Kafka Connector のオプションであり、Confluent 全般の設定ではありません。バッチのレコード数とバイト数のしきい値を制御します。バッファーを大きくするとデータロードのリクエスト数を減らせますが、Kafka Connect タスクでより多くのメモリが必要になり、遅延が増える可能性があります。どちらかのサイズのしきい値に達する前にバッチを flush できる `buffer.flush.time` も確認してください。使用している Connector のバージョンに対応するオプションとデフォルト値は、[Doris Kafka Connector](../connection-integration/data-integration/doris-kafka-connector.md) で確認してください。

## Routine Load {#routine-load}

### 主なバグ修正 {#major-bug-fixes}

| 問題の説明 | 発生条件 | 影響範囲 | 暫定的な対処方法 | 影響を受けるバージョン | 修正済みバージョン | 修正 PR |
|------------------|-------------------|--------------|-------------------|------------------|----------------|---------|
| Kafka への接続中に少なくとも一つのジョブがタイムアウトすると、他のジョブのインポートにも影響し、Routine Load 全体のインポートが遅くなります。 | Kafka への接続中に少なくとも一つのジョブがタイムアウトします。 | shared-nothing と shared-storage | 問題を解消するため、ジョブを停止するか手動で一時停止します。 | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530) |
| FE Master の再起動後にユーザーデータが失われる可能性があります。 | ジョブの offset が OFFSET_END に設定されており、FE が再起動されます。 | shared-storage | 消費モードを OFFSET_BEGINNING に変更します。 | 3.0.2-3.0.4 | 3.0.5 | [#46149](https://github.com/apache/doris/pull/46149) |
| インポート中に小さなトランザクションが大量に生成され、compaction が失敗して、-235 エラーが継続的に発生します。 | Doris によるデータの消費が速すぎるか、Kafka のデータが小さなバッチで流れてきます。 | shared-nothing と shared-storage | Routine Load ジョブを一時停止し、次のコマンドを実行します: `ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka のサードパーティーライブラリのデストラクタがハングし、データの消費に失敗します。 | Kafka topic の削除（ほかの条件でも発生する可能性があります）。 | shared-nothing と shared-storage | すべての BE ノードを再起動します。 | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913) |
| Routine Load のスケジューリングがハングします。 | FE が Meta Service でトランザクションを中止する際にタイムアウトが発生します。 | shared-storage | FE ノードを再起動します。 | <3.0.2 | 3.0.2 | [#41267](https://github.com/apache/doris/pull/41267) |
| Routine Load の再起動に関する問題が発生します。 | BE ノードを再起動します。 | shared-nothing と shared-storage | ジョブを手動で再開します。 | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#40728](https://github.com/apache/doris/pull/40728) |

### デフォルト設定の最適化 {#default-configuration-optimizations}

| 最適化の内容 | 適用バージョン | 対応する PR |
|---------------------|------------------|------------------|
| Routine Load のタイムアウト時間を延長しました。 | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| `max_batch_interval` のデフォルト値を調整しました。 | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491) |
| `max_batch_interval` に対する制限を撤廃しました。 | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071) |
| `max_batch_rows` と `max_batch_size` のデフォルト値を調整しました。 | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632) |

### 可観測性の最適化 {#observability-optimizations}

| 最適化の内容 | 適用バージョン | 対応する PR |
|---------------------|------------------|------------------|
| 可観測性に関するメトリクスを追加しました。 | 3.0.5 | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### エラー「failed to get latest offset」 {#error-failed-to-get-latest-offset}
**問題の説明**: Routine Load が Kafka の最新の offset を取得できません。

**主な原因**:
- 通常は Kafka とのネットワーク接続の問題が原因です。ping または telnet を使用して Kafka のドメイン名への接続を確認してください。
- サードパーティーライブラリのバグによるタイムアウトです。エラー: java.util.concurrent.TimeoutException: Waited X seconds

### エラー「failed to get partition meta: Local:'Broker transport failure」 {#error-failed-to-get-partition-meta-localbroker-transport-failure}
**問題の説明**: Routine Load が Kafka Topic Partition Meta を取得できません。

**主な原因**:
- 通常は Kafka とのネットワーク接続の問題が原因です。ping または telnet を使用して Kafka のドメイン名への接続を確認してください。
- ドメイン名を使用している場合は、/etc/hosts にドメイン名のマッピングを設定してみてください。

### エラー「Broker: Offset out of range」 {#error-broker-offset-out-of-range}
**問題の説明**: 消費対象の offset が Kafka に存在しません。Kafka によって削除された可能性があります。

**対処方法**:
- 消費を開始する新しい offset を指定する必要があります。たとえば、offset を OFFSET_BEGINNING に設定します。
- インポート速度に応じて、log.retention.hours や log.retention.bytes など、Kafka のログ削除に関するパラメータを適切に設定する必要があります。
