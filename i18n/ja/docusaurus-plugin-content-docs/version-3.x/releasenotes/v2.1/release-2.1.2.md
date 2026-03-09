---
{
  "title": "リリース 2.1.2",
  "language": "ja",
  "description": "例えば、select @autocommitは列タイプがBITではなくBIGINTである必要があり、そうでなければエラーが発生します。そのため、@autocommitの列タイプをBIGINTに変更します。"
}
---
## 動作変更

1. EXPORTの`data_consistence`プロパティのデフォルト値をpartitionに設定し、ロード中のエクスポートをより安定させました。

- https://github.com/apache/doris/pull/32830

2. 一部のMySQL Connector（例：dotnet MySQL.Data）は接続を行うために変数の列タイプに依存します。

  例：`select @autocommit`は列タイプBIGINTである必要があり、BITではありません。そうでなければエラーが発生します。そのため、`@autocommit`の列タイプをBIGINTに変更しました。

  - https://github.com/apache/doris/pull/33282


## アップグレード問題

1. 2.0または他の古いバージョンからアップグレードする際に、通常のworkload groupが作成されません。

  - https://github.com/apache/doris/pull/33197

## 新機能


1. information_schemaデータベースにprocesslistテーブルを追加し、ユーザーがこのテーブルを使用してアクティブな接続をクエリできるようにしました。

  - https://github.com/apache/doris/pull/32511

2. 共有ストレージのようなファイルシステムへのアクセスを可能にする新しいテーブル値関数`LOCAL`を追加しました。

  - https://github.com/apache/doris-website/pull/494


## 最適化

1. K8s環境でのgraceful stopをより迅速に行うため、不要なプロセスをスキップするようにしました。

  - https://github.com/apache/doris/pull/33212

2. mv選択問題の特定を支援するため、プロファイルにrollupテーブル名を追加しました。

  - https://github.com/apache/doris/pull/33137

3. DB2 Catalogを作成する際にユーザーが接続を確認できるよう、DB2データベースにテスト接続機能を追加しました。

  - https://github.com/apache/doris/pull/33335

4. K8s環境でのBE間の接続プロセスを高速化するため、FQDNのDNS Cacheを追加しました。

  - https://github.com/apache/doris/pull/32869

5. クエリプランをより安定させるため、外部テーブルのrowcountを非同期でリフレッシュするようにしました。

  - https://github.com/apache/doris/pull/32997


## バグ修正


1. HMSとHadoopのIceberg CatalogがIcebergでmanifest cacheを有効にする"io.manifest.cache-enabled"などのIcebergプロパティをサポートしない問題を修正しました。

  - https://github.com/apache/doris/pull/33113

2. `LEAD`/`LAG`関数のoffsetパラメータでオフセットとして0を使用できるようにしました。

  - https://github.com/apache/doris/pull/33174

3. ロードに関するいくつかのタイムアウト問題を修正しました。

  - https://github.com/apache/doris/pull/33077

  - https://github.com/apache/doris/pull/33260

4. `ARRAY`/`MAP`/`STRUCT`のcompactionプロセスに関連するコア問題を修正しました。

  - https://github.com/apache/doris/pull/33130

  - https://github.com/apache/doris/pull/33295

5. runtime filter wait timeoutを修正しました。

  - https://github.com/apache/doris/pull/33369

6. auto partitionでの文字列入力に対する`unix_timestamp`のコア問題を修正しました。

  - https://github.com/apache/doris/pull/32871
