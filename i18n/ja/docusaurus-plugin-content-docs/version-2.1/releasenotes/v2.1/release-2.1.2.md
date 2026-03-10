---
{
  "title": "リリース 2.1.2",
  "language": "ja",
  "description": "例えば、select @autocommitはcolumn typeをBIGINTにすべきで、BITではいけません。そうでないとエラーが発生します。そのため、@autocommitのcolumn typeをBIGINTに変更します。"
}
---
## 動作変更

1. ロード中により安定したエクスポートを実現するため、EXPORTの`data_consistence`プロパティのデフォルト値をpartitionに設定しました。

- https://github.com/apache/doris/pull/32830

2. 一部のMySQL Connector（例：dotnet MySQL.Data）は、接続を確立するために変数のカラム型に依存します。

  例えば、`select @autocommit`はカラム型がBIGINTである必要があり、BITではエラーが発生します。そのため、`@autocommit`のカラム型をBIGINTに変更しました。

  - https://github.com/apache/doris/pull/33282


## アップグレード問題

1. 2.0または他の古いバージョンからアップグレードする際に、通常のworkload groupが作成されない問題がありました。

  - https://github.com/apache/doris/pull/33197

##  新機能


1. information_schemaデータベースにprocesslistテーブルを追加し、ユーザーがアクティブな接続を照会できるようになりました。

  - https://github.com/apache/doris/pull/32511

2. 共有ストレージのようなファイルシステムへのアクセスを可能にする新しいテーブル値関数`LOCAL`を追加しました。

  - https://github.com/apache/doris-website/pull/494


## 最適化

1. K8s環境でのgraceful stopをより高速にするため、不要なプロセスをスキップするようにしました。

  - https://github.com/apache/doris/pull/33212

2. mv選択の問題を特定しやすくするため、profileにrollupテーブル名を追加しました。

  - https://github.com/apache/doris/pull/33137

3. DB2 Catalogを作成する際にユーザーが接続を確認できるよう、DB2データベースにテスト接続機能を追加しました。

  - https://github.com/apache/doris/pull/33335

4. K8s環境でのBE間の接続プロセスを高速化するため、FQDNのDNS Cacheを追加しました。

  - https://github.com/apache/doris/pull/32869

5. クエリプランをより安定させるため、外部テーブルのrowcountを非同期で更新するようにしました。

  - https://github.com/apache/doris/pull/32997


## バグ修正


1. HMSおよびHadoopのIceberg CatalogがIcebergのmanifest cacheを有効化する"io.manifest.cache-enabled"などのIcebergプロパティをサポートしない問題を修正しました。

  - https://github.com/apache/doris/pull/33113

2. `LEAD`/`LAG`関数のoffsetパラメータでオフセットとして0を使用できるようになりました。

  - https://github.com/apache/doris/pull/33174

3. ロードに関するタイムアウト問題を修正しました。

  - https://github.com/apache/doris/pull/33077

  - https://github.com/apache/doris/pull/33260

4. `ARRAY`/`MAP`/`STRUCT`のコンパクションプロセスに関連するコアの問題を修正しました。

  - https://github.com/apache/doris/pull/33130

  - https://github.com/apache/doris/pull/33295

5. runtime filterの待機タイムアウトを修正しました。

  - https://github.com/apache/doris/pull/33369

6. auto partitionでの文字列入力による`unix_timestamp`のコア問題を修正しました。

  - https://github.com/apache/doris/pull/32871
