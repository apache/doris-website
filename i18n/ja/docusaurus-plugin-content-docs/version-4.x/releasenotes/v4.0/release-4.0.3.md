---
{
  "title": "リリース 4.0.3",
  "language": "ja",
  "description": "Apache Doris 4.0.3のリリースノートは以下の通りです："
}
---
# 機能

## AI & 検索

- 転置インデックスNORMALIZERサポートを追加
- es-likeブール演算クエリを実装 [#58545](https://github.com/apache/doris/pull/58545)
- 検索機能にlucene boolモードを導入 [#59394](https://github.com/apache/doris/pull/59394)

## Lakehouse

- AwsCredentialsProviderChain経由でのCatalog認証情報の読み込みをサポート [#58740](https://github.com/apache/doris/pull/58740)
- OSSHDFSストレージを使用するPaimon DLF Catalogをサポート [#59245](https://github.com/apache/doris/pull/59245)
- Icebergテーブル用のマニフェストレベルキャッシュを追加 [#59056](https://github.com/apache/doris/pull/59056)

## Query Engine

- INTERVAL関数をサポートし、EXPORT_SETを修正 [#58885](https://github.com/apache/doris/pull/58885)
- TIME_FORMAT関数をサポート [#58592](https://github.com/apache/doris/pull/58592)
- QUANTILE_STATE_TO/FROM_BASE64関数をサポート [#59664](https://github.com/apache/doris/pull/59664)

# 改善

- ロードジョブシステムテーブルを導入 [#57421](https://github.com/apache/doris/pull/57421)
- ビュー、マテリアライズドビュー、生成列、およびエイリアス関数でセッション変数を永続化可能に [#58031](https://github.com/apache/doris/pull/58031)
- テーブルクエリプランアクションから受信したsqlを監査ログに追加 [#58739](https://github.com/apache/doris/pull/58739)
- ストリームロードレコードを監査ログシステムテーブルに有効化 [#57530](https://github.com/apache/doris/pull/57530)
- Column Purningによる複合型列の読み取りを最適化
- mysql MOD構文との互換性 [#58432](https://github.com/apache/doris/pull/58432)
- sql_digest生成用の動的設定を追加 [#59102](https://github.com/apache/doris/pull/59102)
- PGとの整合性のためREGR_SLOPE/INTERCEPTにYoungs-Cramerを使用 [#55940](https://github.com/apache/doris/pull/55940)

# バグ修正

- JdbcConnectorクローズ時のJNIグローバル参照リークを修正 [#58574](https://github.com/apache/doris/pull/58574)
- BEからの統計アップロードが間に合わないためcbo stableでsync mvが選択されない問題を修正 [#58720](https://github.com/apache/doris/pull/58720)
- 無効なJSONBをデフォルトのJSONB null値で置換 [#59007](https://github.com/apache/doris/pull/59007)
- 同時バックエンドドロップによるOlapTableSink.createPaloNodesInfoでのNPEを修正 [#58999](https://github.com/apache/doris/pull/58999)
- FROM DUALがdualで始まるテーブル名を誤ってマッチングする問題を修正 [#59003](https://github.com/apache/doris/pull/59003)
- BEがダウン時のウォームアップキャンセル失敗を修正 [#58035](https://github.com/apache/doris/pull/58035)
- mvがLimitAggToTopNAggで書き換えられているがクエリは書き換えられていない場合のmv rewrite失敗を修正 [#58974](https://github.com/apache/doris/pull/58974)
- リフレッシュ時にlastUpdateTimeが更新されない問題を修正し、スケジュールリフレッシュログを追加 [#58997](https://github.com/apache/doris/pull/58997)
- hll_from_base64が無効な入力でコアダンプする問題を修正 [#59106](https://github.com/apache/doris/pull/59106)
- 式を含むロード列マッピングの大文字小文字の問題を修正 [#59149](https://github.com/apache/doris/pull/59149)
- drop tableが制約関連情報を削除しない問題を修正 [#58958](https://github.com/apache/doris/pull/58958)
- parquet topn lazy mat複合データの誤った結果を修正 [#58785](https://github.com/apache/doris/pull/58785)
- nullポインターを避けるため常にデータとインデックスページキャッシュを作成 [#59266](https://github.com/apache/doris/pull/59266)
- メモリ使用量を削減するためtablet cooldownConfLockを修正 [#59356](https://github.com/apache/doris/pull/59356)
- parquetフッター読み取りでプロファイルが欠けている問題を修正
- Exception::to_stringでのuse-after-freeの潜在的問題を修正 [#59558](https://github.com/apache/doris/pull/59558)
- floatフィールドto_stringを修正
- hudi parquet読み取りがBEコアダンプを引き起こす問題を修正 [#58532](https://github.com/apache/doris/pull/58532)
- Kerberos認証設定検出を修正 [#59748](https://github.com/apache/doris/pull/59748)
- 空テーブルでの同期失敗を修正 [#59735](https://github.com/apache/doris/pull/59735)
- parquet型がfloat16を処理しない問題を修正 [#58528](https://github.com/apache/doris/pull/58528)
- BM25 LENGTH_TABLE norm decodingを修正 [#59713](https://github.com/apache/doris/pull/59713)
- 一部のdatelike関数の誤検知を回避 [#59897](https://github.com/apache/doris/pull/59897)
