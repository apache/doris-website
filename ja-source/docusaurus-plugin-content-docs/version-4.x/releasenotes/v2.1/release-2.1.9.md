---
{
  "title": "リリース 2.1.9",
  "language": "ja",
  "description": "コミュニティの皆様へ、Apache Doris バージョン 2.1.9 が利用可能になりました。改善された SQLHash 計算、強化されたクエリ結果の精度を特徴としています。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.9 がご利用いただけるようになりました**。SQLHash 計算の改善、クエリ結果精度の向上、ストレージ管理の改善のための新しいメトリクスが追加されています。この更新では、より堅牢なデータ管理エクスペリエンスのために、複数の領域にわたる重要なバグも解決されています。

- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.9-rc02)

## 動作の変更

- Audit Log の SQLHash が SQL クエリごとに正確に計算されるようになり、単一リクエスト内での同一ハッシュの問題が解決されました。[#48242](https://github.com/apache/doris/pull/48242)
- クエリ結果が ColumnLabelName と正確に一致するようになりました。[#47093](https://github.com/apache/doris/pull/47093)
- ユーザープロパティ変数がセッション変数より優先されるようになりました。[#47185](https://github.com/apache/doris/pull/47185)

## 新機能

### Storage Management

- パーティションカラムの名前変更を禁止しました。[#47596](https://github.com/apache/doris/pull/47596)

### その他

- Catalogs、Databases、Tables の数に関する FE 監視メトリクスを追加しました。[#47891](https://github.com/apache/doris/pull/47891)

## 改善

### Inverted Index

- VARIANT inverted indexes での ARRAY 型をサポートしました。[#47688](https://github.com/apache/doris/pull/47688)
- Profile で各フィルター条件のパフォーマンスメトリクスが表示されるようになりました。[#47504](https://github.com/apache/doris/pull/47504)

### Query Optimizer

- 集約キーカラムのみの集約クエリでの `SELECT *` の使用をサポートしました。[#48006](https://github.com/apache/doris/pull/48006)

### Storage Management

- binlog リサイクリングと小さなファイル転送効率、および混沌とした環境での堅牢性のために CCR を強化しました。[#47547](https://github.com/apache/doris/pull/47547) [#47313](https://github.com/apache/doris/pull/47313) [#45061](https://github.com/apache/doris/pull/45061)
- インポートエラーメッセージをより具体的になるように改善しました。[#47918](https://github.com/apache/doris/pull/47918) [#47470](https://github.com/apache/doris/pull/47470)

## バグ修正

### レイクハウス

- BE krb5.conf パス設定の問題を修正しました。[#47679](https://github.com/apache/doris/pull/47679)
- 重複データエクスポートを避けるために `SELECT OUTFILE` ステートメントの再試行を防止しました。[#48095](https://github.com/apache/doris/pull/48095)
- Paimon テーブルへの JAVA API アクセスを修正しました。[#47192](https://github.com/apache/doris/pull/47192)
- `s3a://` ストレージロケーションを持つ Hive テーブルへの書き込みを解決しました。[#47162](https://github.com/apache/doris/pull/47162)
- カタログ の コメント フィールドが永続化されない問題を修正しました。[#46946](https://github.com/apache/doris/pull/46946)
- 特定の条件下での JDBC BE クラスローディングリークに対処しました。[#46912](https://github.com/apache/doris/pull/46912)
- 高バージョン ClickHouse JDBC Driver と JDBC カタログ の互換性を解決しました。[#46026](https://github.com/apache/doris/pull/46026)
- Iceberg Position Delete 読み取り時の BE クラッシュを修正しました。[#47977](https://github.com/apache/doris/pull/47977)
- マルチパーティションカラム下での MaxCompute テーブルデータ読み取りを修正しました。[#48325](https://github.com/apache/doris/pull/48325)
- Parquet 複合カラムタイプの読み取りエラーを修正しました。[#47734](https://github.com/apache/doris/pull/47734)

### Inverted Index

- ARRAY 型 inverted index の null 値処理を修正しました。[#48231](https://github.com/apache/doris/pull/48231)
- 新しく追加されたカラムの `BUILD INDEX` 例外を解決しました。[#48389](https://github.com/apache/doris/pull/48389)
- エラーを引き起こす UTF8 エンコーディングインデックスの切り詰め問題を修正しました。[#48657](https://github.com/apache/doris/pull/48657)

### Semi-structured Data Types

- 特別な条件下での `array_agg` 関数のクラッシュを修正しました。[#46927](https://github.com/apache/doris/pull/46927)
- 不正な chunk パラメータによる JSON インポートクラッシュを解決しました。[#48196](https://github.com/apache/doris/pull/48196)

### Query Optimizer

- `current_date` などのネストした時間関数での定数畳み込みの問題を修正しました。[#47288](https://github.com/apache/doris/pull/47288)
- 非決定的関数の結果エラーに対処しました。[#48321](https://github.com/apache/doris/pull/48321)
- on update カラムプロパティでの `CREATE TABLE LIKE` 実行の問題を解決しました。[#48007](https://github.com/apache/doris/pull/48007)
- 集約モデルテーブルのマテリアライズドビューでの予期しない計画エラーを修正しました。[#47658](https://github.com/apache/doris/pull/47658)
- 内部 ID オーバーフローによる `PreparedStatement` 例外を解決しました。[#47950](https://github.com/apache/doris/pull/47950)

### Query Execution Engine

- システムテーブルクエリ時のクエリハングまたは null ポインタの問題を解決しました。[#48370](https://github.com/apache/doris/pull/48370)
- LEAD/LAG 関数に DOUBLE 型サポートを追加しました。[#47940](https://github.com/apache/doris/pull/47940)
- `case when` 条件が 256 を超える場合のクエリエラーを修正しました。[#47179](https://github.com/apache/doris/pull/47179)
- スペースを含む `str_to_date` 関数のエラーを修正しました。[#48920](https://github.com/apache/doris/pull/48920)
- `||` での定数畳み込み時の `split_part` 関数エラーを修正しました。[#48910](https://github.com/apache/doris/pull/48910)
- `log` 関数の結果エラーを修正しました。[#47228](https://github.com/apache/doris/pull/47228)
- lambda 式での `array` / `map` 関数による core dump の問題を解決しました。[#49140](https://github.com/apache/doris/pull/49140)

### Storage Management

- 集約テーブルのインポート時のメモリ破損の問題を修正しました。[#47523](https://github.com/apache/doris/pull/47523)
- メモリ圧迫下での MoW インポート時の時々発生する core dump を解決しました。[#47715](https://github.com/apache/doris/pull/47715)
- BE 再起動とスキーマ変更時の MoW での潜在的な重複キーの問題を修正しました。[#48056](https://github.com/apache/doris/pull/48056) [#48775](https://github.com/apache/doris/pull/48775)
- memtable プロモーションでの group commit とグローバルカラム更新の問題を修正しました。[#48120](https://github.com/apache/doris/pull/48120) [#47968](https://github.com/apache/doris/pull/47968)

### Permission Management

- LDAP 使用時に PartialResultException をスローしなくなりました。[#47858](https://github.com/apache/doris/pull/47858)
