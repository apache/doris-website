---
{
  "title": "リリース 3.1.2",
  "language": "ja",
  "description": "#56276"
}
---
## 新機能

### Storage と Compression

- **設定可能なテーブル compression タイプ** — テーブルごとに特定の compression アルゴリズムを選択できます。

[#56276](https://github.com/apache/doris/pull/56276)

- **適応的な compaction write caching** — base compaction rowset flush 中に write caching を動的に調整します。

[#56278](https://github.com/apache/doris/pull/56278)

### Cloud と Object Storage

- **Cloud mode query freshness 制御** — データの latency と consistency の間にユーザー定義の tolerance を追加します。

[#56390](https://github.com/apache/doris/pull/56390)

- **Object storage endpoint validation の緩和** — private または custom の storage endpoint を有効にします。

[#56641](https://github.com/apache/doris/pull/56641)

### Datalake

- **Datalake の OSS サポート** **VPC** **Endpoints (**`dlf/datalake-vpc`**)**.

[#56476](https://github.com/apache/doris/pull/56476)

- **AWS Glue カタログ** が IAM AssumeRole 経由で S3 にアクセスできるようになりました。

[#57036](https://github.com/apache/doris/pull/57036)

- **S3 Client** が credential 管理を改善するため `CustomAwsCredentialsProviderChain` を使用するように更新されました。

[#56943](https://github.com/apache/doris/pull/56943)

### 機能拡張

- **Java UDF** が IP type をサポートするようになりました。

[#56346](https://github.com/apache/doris/pull/56346)

- **BE REST** **API** に monitoring 用の `RunningTasks` output が追加されました。

[#56781](https://github.com/apache/doris/pull/56781)

- **Transaction monitoring** に BRPC write-amplification metrics が追加されました。

[#56832](https://github.com/apache/doris/pull/56832)

## 最適化

### Query Execution と Planner

- **`COUNT(\*)`** optimization** — scan load を削減するために最小の column を自動的に選択します。

[#56483](https://github.com/apache/doris/pull/56483)

- **Compaction** が throughput を向上させるために空の rowset をスキップします。

[#56768](https://github.com/apache/doris/pull/56768)

- **Warmup statistics** に視認性を向上させる "skipped rowset" metric が追加されました。

[#56373](https://github.com/apache/doris/pull/56373)

### Storage Layer

- **Variant column cache が追加** され、sparse column の読み取りが高速化されます。

[#56730](https://github.com/apache/doris/pull/56730)

- **Segment footer** が latency を削減するため Index Page Cache にキャッシュされるようになりました。

[#56459](https://github.com/apache/doris/pull/56459)

- **Recycler** が throughput を向上させるために並列 cleanup task をサポートします。

[#56573](https://github.com/apache/doris/pull/56573)

### Datalake

- **Paimon Time Travel** が改善され、schema mismatch が修正されました。

[#56338](https://github.com/apache/doris/pull/56338)

- **Iceberg scan error messages が改良** され、nested namespace がサポートされました。

[#56370](https://github.com/apache/doris/pull/56370), [#57035](https://github.com/apache/doris/pull/57035)

- **Legacy DLF catalog properties が削除されました。**

[#56196](https://github.com/apache/doris/pull/56196), [#56505](https://github.com/apache/doris/pull/56505)

- **JSON** **Load** が line ベースのデータに対して row-by-row parsing mode をデフォルトで使用するようになりました。

[#56736](https://github.com/apache/doris/pull/56736)

## バグ修正

### Datalake

- **Iceberg system table classloader** error を修正しました。

[#56220](https://github.com/apache/doris/pull/56220)

- partition 値が存在しない場合の **Iceberg partition table** failure を修正しました。

[#57043](https://github.com/apache/doris/pull/57043)

- **S3A catalog** が IAM AssumeRole profile を適切に使用しない問題を修正しました。

[#56250](https://github.com/apache/doris/pull/56250)

- multi-config object storage catalog の Hadoop FileSystem cache を無効にしました。

[#57153](https://github.com/apache/doris/pull/57153)

### Query Execution と SQL Engine

- `COUNT` pushdown logic error を修正しました。

[#56482](https://github.com/apache/doris/pull/56482)

- `UNION` local shuffle behavior bug を修正しました。

[#56556](https://github.com/apache/doris/pull/56556)

- OLAP storage type での `IN` predicate のクラッシュを修正しました。

[#56834](https://github.com/apache/doris/pull/56834)

- `datetimev1` の `timestampdiff` 計算エラーを修正しました。

[#56893](https://github.com/apache/doris/pull/56893)

- `explode()` function によるクラッシュを修正しました。

[#57002](https://github.com/apache/doris/pull/57002)

### Storage と Load

- source file が存在しない場合の S3 Load check failure を修正しました。

[#56376](https://github.com/apache/doris/pull/56376)

- FileCache cleanup のクラッシュを修正しました。

[#56584](https://github.com/apache/doris/pull/56584)

- MOW compression で delete bitmap がクリアされない問題を修正しました。

[#56785](https://github.com/apache/doris/pull/56785)

- 小さいファイルでの Outfile bz2 compression failure を修正しました。

[#57041](https://github.com/apache/doris/pull/57041)

### Cloud と Recycler Mechanism

- Warmup が multi-segment rowset をスキップする問題を修正しました。

[#56680](https://github.com/apache/doris/pull/56680)

- reference capture での CloudTablet Warmup coredump を修正しました。

[#56627](https://github.com/apache/doris/pull/56627)

- cleanup task での Recycler null pointer のクラッシュを修正しました。

[#56773](https://github.com/apache/doris/pull/56773)

- Cloud mode での uncaught partition boundary error を修正しました。

[#56968](https://github.com/apache/doris/pull/56968)

### System とその他

- FE での不正な Prometheus metric format を修正しました。

[#57082](https://github.com/apache/doris/pull/57082)

- FE 再起動後の auto-increment value の不正な値を修正しました。

[#57118](https://github.com/apache/doris/pull/57118)

- `SHOW CREATE VIEW` で column 定義が欠落する問題を修正しました。

[#57045](https://github.com/apache/doris/pull/57045)

- Profile データのサンプリング時の HDFS Reader のクラッシュを修正しました。

[#56950](https://github.com/apache/doris/pull/56950)
