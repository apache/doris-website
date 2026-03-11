---
{
  "title": "リリース 2.1.2",
  "language": "ja",
  "description": "例えば、select @autocommitはcolumn typeがBIGINTである必要があり、BITではエラーが発生します。そのため、@autocommitのcolumn typeをBIGINTに変更します。"
}
---
## 動作変更

1. ロード時のエクスポートをより安定させるため、EXPORTの`data_consistence`プロパティのデフォルト値をパーティションに設定。

- https://github.com/apache/doris/pull/32830

2. 一部のMySQL Connector（例：dotnet MySQL.Data）は接続を行うために変数のカラム型に依存しています。

  例えば、`select @autocommit`はBITではなくBIGINT型のカラムである必要があり、そうでなければエラーが発生します。そのため、`@autocommit`のカラム型をBIGINTに変更しました。

  - https://github.com/apache/doris/pull/33282


## アップグレード問題

1. 2.0またはその他の古いバージョンからアップグレードする際に、通常のworkload groupが作成されない。

  - https://github.com/apache/doris/pull/33197

## 新機能


1. information_schemaデータベースにprocesslistテーブルを追加。ユーザーはこのテーブルを使用してアクティブな接続をクエリできます。

  - https://github.com/apache/doris/pull/32511

2. 共有ストレージのようなファイルシステムへのアクセスを可能にする新しいテーブル値関数`LOCAL`を追加。

  - https://github.com/apache/doris-website/pull/494


## 最適化

1. K8s環境でのgraceful stopをより高速化するため、不要なプロセスをスキップ。

  - https://github.com/apache/doris/pull/33212

2. mv選択問題の特定を支援するため、profileにrollupテーブル名を追加。

  - https://github.com/apache/doris/pull/33137

3. DB2 カタログを作成する際にユーザーが接続を確認できるよう、DB2データベースにテスト接続機能を追加。

  - https://github.com/apache/doris/pull/33335

4. K8s環境でのBE間接続プロセスを高速化するため、FQDNのDNS Cacheを追加。

  - https://github.com/apache/doris/pull/32869

5. クエリプランをより安定させるため、外部テーブルのrowcountを非同期でリフレッシュ。

  - https://github.com/apache/doris/pull/32997


## バグ修正


1. HMSとHadoopのIceberg カタログがIcebergのmanifest cacheを有効にする"io.manifest.cache-enabled"などのIcebergプロパティをサポートしない問題を修正。

  - https://github.com/apache/doris/pull/33113

2. `LEAD`/`LAG`関数のoffsetパラメータで0をoffsetとして使用できるように修正。

  - https://github.com/apache/doris/pull/33174

3. ロードに関するいくつかのタイムアウト問題を修正。

  - https://github.com/apache/doris/pull/33077

  - https://github.com/apache/doris/pull/33260

4. `ARRAY`/`MAP`/`STRUCT`のコンパクションプロセスに関連するコア問題を修正。

  - https://github.com/apache/doris/pull/33130

  - https://github.com/apache/doris/pull/33295

5. runtime filter wait timeoutを修正。

  - https://github.com/apache/doris/pull/33369

6. auto partitionでstring入力の`unix_timestamp`コアを修正。

  - https://github.com/apache/doris/pull/32871
