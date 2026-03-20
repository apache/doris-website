---
{
  "title": "FAQ を読み込み",
  "language": "ja",
  "description": "問題説明：ローディング中のデータ品質エラー。"
}
---
## 汎用ロードFAQ

### エラー "[DATA_QUALITY_ERROR] Encountered unqualified data"
**問題の説明**: ロード中のデータ品質エラー。

**解決策**:
- Stream LoadとInsert Into操作ではエラーURLが返されます。Broker Loadの場合は`Show Load`コマンドでエラーURLを確認できます。
- ブラウザまたはcurlコマンドを使用してエラーURLにアクセスし、具体的なデータ品質エラーの理由を確認してください。
- strict_modeとmax_filter_ratioパラメータを使用して、許容可能なエラー率を制御してください。

### エラー "[E-235] Failed to init rowset builder"
**問題の説明**: ロード頻度が高すぎてデータが時間内にコンパクションされず、バージョン制限を超えた場合にエラー-235が発生します。

**解決策**:
- データロードのバッチサイズを増やし、ロード頻度を減らしてください。
- `be.conf`の`max_tablet_version_num`パラメータを増やしてください。5000を超えないことを推奨します。

### エラー "[E-238] Too many segments in rowset"
**問題の説明**: 単一のrowset下のセグメント数が制限を超えた場合にエラー-238が発生します。

**よくある原因**:
- テーブル作成時に設定されたバケット数が少なすぎます。
- データスキューが発生しています。よりバランスの取れたバケットキーの使用を検討してください。

### エラー "Transaction commit successfully, BUT data will be visible later"
**問題の説明**: データロードは成功したが、一時的に表示されません。

**原因**: 通常、システムリソース圧迫によるトランザクションパブリッシュ遅延が原因です。

### エラー "Failed to commit kv txn [...] Transaction exceeds byte limit"
**問題の説明**: shared-nothingモードで、単一のロードで関与するパーティションとタブレットが多すぎて、トランザクションサイズ制限を超えています。

**解決策**:
- パーティション別にバッチでデータをロードし、単一ロードで関与するパーティション数を削減してください。
- テーブル構造を最適化してパーティションとタブレット数を削減してください。

### CSVファイルの最後の列に余分な"\r"
**問題の説明**: 通常、Windows改行文字が原因です。

**解決策**:
正しい行区切り文字を指定してください: `-H "line_delimiter:\r\n"`

### 引用符付きCSVデータがnullとしてインポートされる
**問題の説明**: 引用符付きCSVデータがインポート後にnullになります。

**解決策**:
`trim_double_quotes`パラメータを使用してフィールド周りの二重引用符を削除してください。

## Stream Load

### ロードが遅い理由
- CPU、IO、メモリ、またはネットワークカードリソースのボトルネック。
- クライアントマシンとBEマシン間のネットワークが遅い場合、クライアントからBEマシンへのpingレイテンシを通じて初期診断できます。
- Webサーバースレッド数のボトルネック。単一のBEで同時Stream Load数が多すぎる場合（be.confのwebserver_num_workers設定を超える場合）、スレッド数のボトルネックが発生する可能性があります。
- Memtable Flushスレッド数のボトルネック。BEメトリクスdoris_be_flush_thread_pool_queue_sizeを確認して、キューイングが深刻かどうかを確認してください。be.confのflush_thread_num_per_storeパラメータを増やすことで解決できます。

### 列名の特殊文字の処理
列名に特殊文字が含まれる場合、バッククォート付きのシングルクォートを使用してcolumnsパラメータを指定してください:

```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```
## Routine Load 

### 主要なバグ修正

| 問題の説明 | 発生条件 | 影響範囲 | 一時的な解決策 | 影響を受けるバージョン | 修正されたバージョン | 修正PR |
|------------------|-------------------|--------------|-------------------|------------------|----------------|---------|
| 少なくとも1つのジョブがKafkaへの接続でタイムアウトすると、他のジョブのインポートに影響を与え、グローバルなRoutine Loadインポートが遅くなる。 | 少なくとも1つのジョブがKafkaへの接続でタイムアウトする。 | Shared-nothingおよびshared-storage | ジョブを停止するか手動で一時停止して問題を解決する。 | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530) |
| FE Masterの再起動後にユーザーデータが失われる可能性がある。 | ジョブのオフセットがOFFSET_ENDに設定され、FEが再起動される。 | Shared-storage | 消費モードをOFFSET_BEGINNINGに変更する。 | 3.0.2-3.0.4 | 3.0.5 | [#46149](https://github.com/apache/doris/pull/46149) |
| インポート中に大量の小さなトランザクションが生成され、compactionが失敗し、継続的な-235エラーが発生する。 | Dorisがデータを高速で消費するか、Kafkaデータフローが小さなバッチで処理される。 | Shared-nothingおよびshared-storage | Routine Loadジョブを一時停止し、次のコマンドを実行する：`ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafkaサードパーティライブラリのデストラクタがハングし、データ消費が失敗する。 | Kafkaトピックの削除（他の条件の可能性もある）。 | Shared-nothingおよびshared-storage | すべてのBEノードを再起動する。 | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913) |
| Routine Loadスケジューリングがハングする。 | FEがMeta Serviceでトランザクションを中止する際にタイムアウトが発生する。 | Shared-storage | FEノードを再起動する。 | <3.0.2 | 3.0.2 | [#41267](https://github.com/apache/doris/pull/41267) |
| Routine Load再起動の問題。 | BEノードの再起動。 | Shared-nothingおよびshared-storage | ジョブを手動で再開する。 | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#3727](https://github.com/apache/doris/pull/40728) |

### デフォルト設定の最適化

| 最適化内容 | 適用バージョン | 対応するPR |
|---------------------|------------------|------------------|
| Routine Loadのタイムアウト時間を延長した。 | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| `max_batch_interval`のデフォルト値を調整した。 | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491) |
| `max_batch_interval`の制限を削除した。 | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071) |
| `max_batch_rows`と`max_batch_size`のデフォルト値を調整した。 | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632) |

### 可観測性の最適化

| 最適化内容 | 適用バージョン | 対応するPR |
|---------------------|------------------|------------------|
| 可観測性関連のメトリクスを追加した。 | 3.0.5 | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### エラー「failed to get latest offset」
**問題の説明**：Routine LoadでKafkaの最新オフセットを取得できない。

**一般的な原因**：
- 通常はKafkaとのネットワーク接続の問題が原因。Kafkaのドメイン名にpingやtelnetでテストして確認する。
- サードパーティライブラリのバグによるタイムアウト、エラー：java.util.concurrent.TimeoutException: Waited X seconds

### エラー「failed to get partition meta: Local:'Broker transport failure」
**問題の説明**：Routine LoadでKafka Topic Partition Metaを取得できない。

**一般的な原因**：
- 通常はKafkaとのネットワーク接続の問題が原因。Kafkaのドメイン名にpingやtelnetでテストして確認する。
- ドメイン名を使用している場合は、/etc/hostsでドメイン名マッピングを設定してみる

### エラー「Broker: Offset out of range」
**問題の説明**：消費するオフセットがKafkaに存在しない。Kafkaによってクリーンアップされた可能性がある。

**解決策**：
- 消費する新しいオフセットを指定する必要がある。例：オフセットをOFFSET_BEGINNINGに設定する。
- インポート速度に基づいて適切なKafkaログクリーンアップパラメータを設定する必要がある：log.retention.hours、log.retention.bytesなど。
