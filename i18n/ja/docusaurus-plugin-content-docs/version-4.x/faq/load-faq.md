---
{
    "title": "ロードに関する FAQ",
    "language": "ja",
    "description": "問題の説明：データのロード中にデータ品質エラーが発生します。"
}
---

## ロード全般の FAQ

### エラー「[DATA_QUALITY_ERROR] Encountered unqualified data」
**問題の説明**：データのロード中にデータ品質エラーが発生します。

**解決方法**：
- Stream Load と Insert Into ではエラー URL が返されます。Broker Load では `Show Load` コマンドでエラー URL を確認できます。
- ブラウザーまたは curl コマンドでエラー URL にアクセスし、データ品質エラーの具体的な原因を確認します。
- strict_mode と max_filter_ratio パラメーターを使用して、許容するエラー率を制御します。

### エラー「[E-235] Failed to init rowset builder」
**問題の説明**：ロード頻度が高すぎてデータのコンパクションが間に合わず、バージョン数の上限を超えると、エラー -235 が発生します。

**解決方法**：
- ロードのバッチサイズを増やし、ロード頻度を下げます。
- `max_tablet_version_num` パラメーターを `be.conf` で増やします。5000 を超えないことを推奨します。

### エラー「[E-238] Too many segments in rowset」
**問題の説明**：単一の rowset に含まれる segment 数が上限を超えると、エラー -238 が発生します。

**主な原因**：
- テーブル作成時に設定したバケット数が少なすぎます。
- データに偏りがあります。より均等に分散するバケットキーの使用を検討してください。

### エラー「Transaction commit successfully, BUT data will be visible later」
**問題の説明**：データのロードは成功していますが、一時的にデータが参照できません。

**原因**：通常は、システムのリソース負荷によってトランザクションの publish が遅延するためです。

### エラー「Failed to commit kv txn [...] Transaction exceeds byte limit」
**問題の説明**：シェアードナッシングモードで、単一のロードに関与するパーティションと tablet が多すぎると、トランザクションのサイズ上限を超えます。

**解決方法**：
- パーティションごとにデータを分割してロードし、各ロードに関与するパーティション数を減らします。
- テーブル構造を最適化し、パーティションと tablet の数を減らします。

### CSV ファイルの最終列に余分な「\r」が含まれる
**問題の説明**：通常は Windows 形式の改行が原因です。

**解決方法**：
正しい行区切り文字を指定します：`-H "line_delimiter:\r\n"`

### 引用符付きの CSV データが null としてインポートされる
**問題の説明**：引用符付きの CSV データがインポート後に null になります。

**解決方法**：
`trim_double_quotes` パラメーターを使用して、フィールドを囲む二重引用符を削除します。

## Stream Load

### ロードが遅い原因
- CPU、IO、メモリ、またはネットワークインターフェースのリソースがボトルネックになっています。
- クライアントマシンと BE マシン間のネットワークが遅くなっています。クライアントから BE マシンへの ping の遅延を確認すると、初期診断に役立ちます。
- Webserver のスレッド数がボトルネックになっています。一台の BE で同時に実行する Stream Load が多すぎると（be.conf の webserver_num_workers 設定を超えると）、スレッド数がボトルネックになる場合があります。
- Memtable Flush のスレッド数がボトルネックになっています。BE のメトリクス doris_be_flush_thread_pool_queue_size を確認し、キューでの待機が著しいかどうかを調べてください。be.conf の flush_thread_num_per_store パラメーターを増やすと解消できます。

### 列名に含まれる特殊文字の扱い
列名に特殊文字が含まれる場合は、バッククォートと一重引用符を使用して columns パラメーターを指定します：
```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```

## Routine Load 

### 主なバグ修正

| 問題の説明 | 発生条件 | 影響範囲 | 暫定的な対処方法 | 影響を受けるバージョン | 修正されたバージョン | 修正 PR |
|------------------|-------------------|--------------|-------------------|------------------|----------------|---------|
| Kafka への接続中に少なくとも一つのジョブがタイムアウトすると、ほかのジョブのインポートにも影響し、Routine Load 全体のインポートが遅くなります。 | Kafka への接続中に少なくとも一つのジョブがタイムアウトします。 | シェアードナッシングとシェアードストレージ | 問題のジョブを停止するか、手動で一時停止します。 | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530) |
| FE Master の再起動後にユーザーデータが失われる可能性があります。 | ジョブのオフセットが OFFSET_END に設定されている状態で FE を再起動します。 | シェアードストレージ | 消費モードを OFFSET_BEGINNING に変更します。 | 3.0.2-3.0.4 | 3.0.5 | [#46149](https://github.com/apache/doris/pull/46149) |
| インポート中に小さなトランザクションが大量に生成され、コンパクションに失敗して -235 エラーが継続的に発生します。 | Doris がデータを速く消費しすぎるか、Kafka のデータフローが小さなバッチに分かれています。 | シェアードナッシングとシェアードストレージ | Routine Load ジョブを一時停止し、次のコマンドを実行します：`ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka のサードパーティーライブラリのデストラクターがハングし、データを消費できなくなります。 | Kafka トピックの削除（ほかの条件でも発生する可能性があります）。 | シェアードナッシングとシェアードストレージ | すべての BE ノードを再起動します。 | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913) |
| Routine Load のスケジューリングがハングします。 | FE が Meta Service でトランザクションを中止する際にタイムアウトします。 | シェアードストレージ | FE ノードを再起動します。 | <3.0.2 | 3.0.2 | [#41267](https://github.com/apache/doris/pull/41267) |
| Routine Load の再起動時に問題が発生します。 | BE ノードを再起動します。 | シェアードナッシングとシェアードストレージ | ジョブを手動で再開します。 | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#40728](https://github.com/apache/doris/pull/40728) |

### デフォルト設定の最適化

| 最適化の内容 | 適用バージョン | 対応する PR |
|---------------------|------------------|------------------|
| Routine Load のタイムアウト時間が延長されました。 | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| `max_batch_interval` のデフォルト値が調整されました。 | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491) |
| `max_batch_interval` の制限が撤廃されました。 | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071) |
| `max_batch_rows` と `max_batch_size` のデフォルト値が調整されました。 | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632) |

### 可観測性の改善

| 最適化の内容 | 適用バージョン | 対応する PR |
|---------------------|------------------|------------------|
| 可観測性に関するメトリクスが追加されました。 | 3.0.5 | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### エラー「failed to get latest offset」
**問題の説明**：Routine Load が Kafka の最新オフセットを取得できません。

**主な原因**：
- 通常は Kafka とのネットワーク接続に問題があります。Kafka のドメイン名に対して ping または telnet を実行して確認してください。
- サードパーティーライブラリのバグによるタイムアウトです。エラー：java.util.concurrent.TimeoutException: Waited X seconds

### エラー「failed to get partition meta: Local:'Broker transport failure」
**問題の説明**：Routine Load が Kafka トピックのパーティションメタデータを取得できません。

**主な原因**：
- 通常は Kafka とのネットワーク接続に問題があります。Kafka のドメイン名に対して ping または telnet を実行して確認してください。
- ドメイン名を使用している場合は、/etc/hosts にドメイン名のマッピングを設定してみてください。

### エラー「Broker: Offset out of range」
**問題の説明**：消費対象のオフセットが Kafka に存在しません。Kafka によって削除された可能性があります。

**解決方法**：
- 消費を開始する新しいオフセットを指定します。たとえば、オフセットを OFFSET_BEGINNING に設定します。
- インポート速度に応じて、log.retention.hours や log.retention.bytes などの Kafka ログのクリーンアップパラメーターを適切に設定します。
