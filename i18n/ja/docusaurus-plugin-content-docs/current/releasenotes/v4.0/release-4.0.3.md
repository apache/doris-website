---
{
  "title": "リリース 4.0.3",
  "language": "ja",
  "description": "Apache Doris 4.0.3のリリースノートは以下の通りです："
}
---
# Features

## AI & Search

- inverted index NORMALIZERサポートを追加
- es-likeなboolean queryを実装 [#58545](https://github.com/apache/doris/pull/58545)
- search関数にlucene bool modeを導入 [#59394](https://github.com/apache/doris/pull/59394)

## Lakehouse

- AwsCredentialsProviderChain経由でのCatalog Credentials読み込みサポート [#58740](https://github.com/apache/doris/pull/58740)
- OSSHDFS Storageを使用するPaimon DLF Catalogをサポート [#59245](https://github.com/apache/doris/pull/59245)
- Icebergテーブル用のmanifest-levelキャッシュを追加 [#59056](https://github.com/apache/doris/pull/59056)

## Query Engine

- INTERVAL関数をサポートし、EXPORT_SETを修正 [#58885](https://github.com/apache/doris/pull/58885)
- TIME_FORMAT関数をサポート [#58592](https://github.com/apache/doris/pull/58592)
- QUANTILE_STATE_TO/FROM_BASE64関数をサポート [#59664](https://github.com/apache/doris/pull/59664)

# Improvements

- load jobシステムテーブルを導入 [#57421](https://github.com/apache/doris/pull/57421)
- views、materialized views、generated columns、alias functionsでセッション変数の永続化を有効化 [#58031](https://github.com/apache/doris/pull/58031)
- table query plan actionから受信したsqlを監査ログに追加 [#58739](https://github.com/apache/doris/pull/58739)
- stream loadレコードの監査ログシステムテーブルへの記録を有効化 [#57530](https://github.com/apache/doris/pull/57530)
- Column PurningによるComplex Type Column読み取りを最適化
- mysql MOD構文と互換性を確保 [#58432](https://github.com/apache/doris/pull/58432)
- sql_digest生成用の動的設定を追加 [#59102](https://github.com/apache/doris/pull/59102)
- PGとの整合性を図るためREGR_SLOPE/INTERCEPTにYoungs-Cramerを使用 [#55940](https://github.com/apache/doris/pull/55940)

# Bugfixes

- JdbcConnector closeでのJNIグローバル参照リークを修正 [#58574](https://github.com/apache/doris/pull/58574)
- beからの統計アップロードが間に合わないためsync mvがcbo stableで選択されない問題を修正 [#58720](https://github.com/apache/doris/pull/58720)
- 無効なJSONBをデフォルトのJSONB null値に置換 [#59007](https://github.com/apache/doris/pull/59007)
- backendの同時削除によるOlapTableSink.createPaloNodesInfoでのNPEを修正 [#58999](https://github.com/apache/doris/pull/58999)
- FROM DUALがdualで始まるテーブル名を誤って一致させる問題を修正 [#59003](https://github.com/apache/doris/pull/59003)
- BEがダウンしている際のwarm upキャンセル失敗を修正 [#58035](https://github.com/apache/doris/pull/58035)
- mvがLimitAggToTopNAggで書き換えられているがqueryが書き換えられていない場合のmv rewrite失敗を修正 [#58974](https://github.com/apache/doris/pull/58974)
- refreshでlastUpdateTimeが更新されない問題を修正し、scheduled refreshログを追加 [#58997](https://github.com/apache/doris/pull/58997)
- hll_from_base64で無効な入力時のcoreを修正 [#59106](https://github.com/apache/doris/pull/59106)
- 式を含むload column mappingの大文字小文字区別問題を修正 [#59149](https://github.com/apache/doris/pull/59149)
- drop tableで制約関連情報が削除されない問題を修正 [#58958](https://github.com/apache/doris/pull/58958)
- parquet topn lazy mat complex dataの誤った結果を修正 [#58785](https://github.com/apache/doris/pull/58785)
- null pointerを避けるためdata・index page cacheを常に作成 [#59266](https://github.com/apache/doris/pull/59266)
- メモリ削減のためtablet cooldownConfLockを変更 [#59356](https://github.com/apache/doris/pull/59356)
- parquet footerの読み取りでprofileが欠落する問題を修正
- Exception::to_stringでの潜在的なuse-after-freeを修正 [#59558](https://github.com/apache/doris/pull/59558)
- float fieldのto_stringを修正
- hudi parquet読み取りでbeがcoreする問題を修正 [#58532](https://github.com/apache/doris/pull/58532)
- Kerberos認証設定の検出を修正 [#59748](https://github.com/apache/doris/pull/59748)
- 空のテーブルでの同期失敗を修正 [#59735](https://github.com/apache/doris/pull/59735)
- parquet typeがfloat16を処理しない問題を修正 [#58528](https://github.com/apache/doris/pull/58528)
- BM25 LENGTH_TABLE normデコーディングを修正 [#59713](https://github.com/apache/doris/pull/59713)
- 一部の日付系関数の誤警報を回避 [#59897](https://github.com/apache/doris/pull/59897)
