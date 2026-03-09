---
{
  "title": "リリース 3.1.2",
  "language": "ja",
  "description": "#56276"
}
---
## 新機能

### ストレージと圧縮

- **設定可能なテーブル圧縮タイプ** — テーブルごとに特定の圧縮アルゴリズムを選択可能にします。

[#56276](https://github.com/apache/doris/pull/56276)

- **適応的compaction書き込みキャッシング** — base compaction rowsetフラッシュ中の書き込みキャッシングを動的に調整します。

[#56278](https://github.com/apache/doris/pull/56278)

### Cloudとオブジェクトストレージ

- **Cloudモードクエリ鮮度制御** — データ遅延と整合性の間にユーザー定義の許容範囲を追加します。

[#56390](https://github.com/apache/doris/pull/56390)

- **オブジェクトストレージエンドポイント検証の緩和** — プライベートまたはカスタムストレージエンドポイントを有効にします。

[#56641](https://github.com/apache/doris/pull/56641)

### Datalake

- **DatalakeのOSSサポート** **VPC** **エンドポイント** (`dlf/datalake-vpc`)。

[#56476](https://github.com/apache/doris/pull/56476)

- **AWS Glue Catalog** が IAM AssumeRole 経由でのS3アクセスをサポートするようになりました。

[#57036](https://github.com/apache/doris/pull/57036)

- **S3 Client** が `CustomAwsCredentialsProviderChain` を使用するように更新され、認証情報管理が改善されました。

[#56943](https://github.com/apache/doris/pull/56943)

### 機能拡張

- **Java UDF** がIPタイプをサポートするようになりました。

[#56346](https://github.com/apache/doris/pull/56346)

- **BE REST** **API** がモニタリング用に `RunningTasks` 出力を追加します。

[#56781](https://github.com/apache/doris/pull/56781)

- **トランザクションモニタリング** がBRPC書き込み増幅メトリクスを追加します。

[#56832](https://github.com/apache/doris/pull/56832)

## 最適化

### クエリ実行とプランナー

- **`COUNT(\*)` 最適化** — スキャン負荷を軽減するため自動的に最小列を選択します。

[#56483](https://github.com/apache/doris/pull/56483)

- **Compaction** がスループット向上のため空のrowsetをスキップします。

[#56768](https://github.com/apache/doris/pull/56768)

- **Warmup統計** が可視性向上のため「スキップされたrowset」メトリクスを追加します。

[#56373](https://github.com/apache/doris/pull/56373)

### ストレージレイヤー

- **Variantカラムキャッシュが追加** され、スパース列の読み取りを高速化します。

[#56730](https://github.com/apache/doris/pull/56730)

- **セグメントフッター** が遅延軽減のためIndex Page Cacheにキャッシュされるようになりました。

[#56459](https://github.com/apache/doris/pull/56459)

- **Recycler** がスループット向上のため並列クリーンアップタスクをサポートします。

[#56573](https://github.com/apache/doris/pull/56573)

### Datalake

- **Paimon Time Travel** が改善され、スキーマの不一致が修正されました。

[#56338](https://github.com/apache/doris/pull/56338)

- **Icebergスキャンエラーメッセージが改良** され、ネストされた名前空間がサポートされました。

[#56370](https://github.com/apache/doris/pull/56370), [#57035](https://github.com/apache/doris/pull/57035)

- **レガシーDLFカタログプロパティが削除されました。**

[#56196](https://github.com/apache/doris/pull/56196), [#56505](https://github.com/apache/doris/pull/56505)

- **JSON** **Load** が行ベースデータの行単位解析モードをデフォルトとするようになりました。

[#56736](https://github.com/apache/doris/pull/56736)

## バグ修正

### Datalake

- **Icebergシステムテーブルclassloader** エラーを修正しました。

[#56220](https://github.com/apache/doris/pull/56220)

- パーティション値が存在しない場合の **Icebergパーティションテーブル** の失敗を修正しました。

[#57043](https://github.com/apache/doris/pull/57043)

- **S3Aカタログ** がIAM AssumeRoleプロファイルを適切に使用しない問題を修正しました。

[#56250](https://github.com/apache/doris/pull/56250)

- マルチ設定オブジェクトストレージカタログのHadoop FileSystemキャッシュを無効化しました。

[#57153](https://github.com/apache/doris/pull/57153)

### クエリ実行とSQLエンジン

- `COUNT` pushdownロジックエラーを修正しました。

[#56482](https://github.com/apache/doris/pull/56482)

- `UNION` ローカルシャッフル動作のバグを修正しました。

[#56556](https://github.com/apache/doris/pull/56556)

- OLAPストレージタイプの `IN` 述語でのクラッシュを修正しました。

[#56834](https://github.com/apache/doris/pull/56834)

- `datetimev1` の `timestampdiff` 計算エラーを修正しました。

[#56893](https://github.com/apache/doris/pull/56893)

- `explode()` 関数によるクラッシュを修正しました。

[#57002](https://github.com/apache/doris/pull/57002)

### ストレージとLoad

- ソースファイルが存在しない場合のS3 Loadチェック失敗を修正しました。

[#56376](https://github.com/apache/doris/pull/56376)

- FileCacheクリーンアップのクラッシュを修正しました。

[#56584](https://github.com/apache/doris/pull/56584)

- MOW圧縮でdelete bitmapがクリアされない問題を修正しました。

[#56785](https://github.com/apache/doris/pull/56785)

- 小さなファイルのOutfile bz2圧縮失敗を修正しました。

[#57041](https://github.com/apache/doris/pull/57041)

### CloudとRecyclerメカニズム

- Warmupがマルチセグメントrowsetをスキップする問題を修正しました。

[#56680](https://github.com/apache/doris/pull/56680)

- 参照キャプチャでのCloudTablet Warmup coredumpを修正しました。

[#56627](https://github.com/apache/doris/pull/56627)

- クリーンアップタスクでのRecyclerヌルポインタークラッシュを修正しました。

[#56773](https://github.com/apache/doris/pull/56773)

- Cloudモードでキャッチされないパーティション境界エラーを修正しました。

[#56968](https://github.com/apache/doris/pull/56968)

### システムとその他

- FEでの不正なPrometheusメトリクスフォーマットを修正しました。

[#57082](https://github.com/apache/doris/pull/57082)

- FE再起動後の自動インクリメント値の不正を修正しました。

[#57118](https://github.com/apache/doris/pull/57118)

- `SHOW CREATE VIEW` でカラム定義が欠落する問題を修正しました。

[#57045](https://github.com/apache/doris/pull/57045)

- Profileデータサンプリング時のHDFS Readerクラッシュを修正しました。

[#56950](https://github.com/apache/doris/pull/56950)
