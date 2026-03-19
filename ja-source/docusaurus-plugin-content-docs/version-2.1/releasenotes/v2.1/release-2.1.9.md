---
{
  "title": "リリース 2.1.9",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.9 が利用可能になりました。改良された SQLHash 計算、強化されたクエリ結果の精度を特徴としています。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.9が利用可能になりました**。改善されたSQLHash計算、強化されたクエリ結果の精度、およびストレージ管理の向上のための新しいメトリクスが特徴です。このアップデートでは、より堅牢なデータ管理エクスペリエンスのために複数の領域にわたって重要なバグも解決されています。

- [クイックダウンロード](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.9-rc02)

## 動作変更

- Audit LogのSQLHashがSQLクエリごとに正確に計算されるようになり、単一リクエストでの同一ハッシュの問題が解決されました。[#48242](https://github.com/apache/doris/pull/48242)
- クエリ結果がColumnLabelNameと正確に一致します。[#47093](https://github.com/apache/doris/pull/47093)
- ユーザープロパティ変数がセッション変数よりも優先されるようになりました。[#47185](https://github.com/apache/doris/pull/47185)

## 新機能

### Storage Management

- パーティションカラムの名前変更を禁止します。[#47596](https://github.com/apache/doris/pull/47596)

### その他

- Catalogs、Databases、およびTables数のFE監視メトリクスが追加されました。[#47891](https://github.com/apache/doris/pull/47891)

## 改善

### Inverted Index

- VARIANT inverted indexでのARRAY型のサポート。[#47688](https://github.com/apache/doris/pull/47688)
- Profileが各フィルター条件のパフォーマンスメトリクスを表示するようになりました。[#47504](https://github.com/apache/doris/pull/47504)

### Query Optimizer

- 集約キーカラムのみの集約クエリで`SELECT *`の使用をサポート。[#48006](https://github.com/apache/doris/pull/48006)

### Storage Management

- binlogリサイクリングと小ファイル転送効率のためのCCRの強化、および混沌とした環境での堅牢性。[#47547](https://github.com/apache/doris/pull/47547) [#47313](https://github.com/apache/doris/pull/47313) [#45061](https://github.com/apache/doris/pull/45061)
- インポートエラーメッセージをより具体的になるよう強化。[#47918](https://github.com/apache/doris/pull/47918) [#47470](https://github.com/apache/doris/pull/47470)

## バグ修正

### レイクハウス

- BE krb5.confパス設定問題を修正。[#47679](https://github.com/apache/doris/pull/47679)
- 重複データエクスポートを避けるため`SELECT OUTFILE`ステートメントの再試行を防止。[#48095](https://github.com/apache/doris/pull/48095)
- PaimonテーブルへのJAVA APIアクセスを修正。[#47192](https://github.com/apache/doris/pull/47192)
- `s3a://`ストレージロケーションを持つHiveテーブルへの書き込みを解決。[#47162](https://github.com/apache/doris/pull/47162)
- カタログのコメントフィールドが永続化されない問題を修正。[#46946](https://github.com/apache/doris/pull/46946)
- 特定条件下でのJDBC BEクラスローディングリークを対処。[#46912](https://github.com/apache/doris/pull/46912)
- 高バージョンClickHouse JDBC DriverとJDBC カタログの互換性を解決。[#46026](https://github.com/apache/doris/pull/46026)
- Iceberg Position Delete読み取り時のBEクラッシュを修正。[#47977](https://github.com/apache/doris/pull/47977)
- マルチパーティションカラム下でのMaxComputeテーブルデータ読み取りを修正。[#48325](https://github.com/apache/doris/pull/48325)
- Parquet複合カラムタイプの読み取りエラーを修正。[#47734](https://github.com/apache/doris/pull/47734)

### Inverted Index

- ARRAY型inverted indexのnull値処理を修正。[#48231](https://github.com/apache/doris/pull/48231)
- 新しく追加されたカラムの`BUILD INDEX`例外を解決。[#48389](https://github.com/apache/doris/pull/48389)
- エラーにつながるUTF8エンコーディングインデックスの切り詰め問題を修正。[#48657](https://github.com/apache/doris/pull/48657)

### Semi-structured Data Types

- 特別な条件下での`array_agg`関数のクラッシュを修正。[#46927](https://github.com/apache/doris/pull/46927)
- 不正確なチャンクパラメータによるJSONインポートクラッシュを解決。[#48196](https://github.com/apache/doris/pull/48196)

### Query Optimizer

- `current_date`のようなネストされた時間関数での定数畳み込み問題を修正。[#47288](https://github.com/apache/doris/pull/47288)
- 非決定的関数結果エラーを対処。[#48321](https://github.com/apache/doris/pull/48321)
- on updateカラムプロパティでの`CREATE TABLE LIKE`実行問題を解決。[#48007](https://github.com/apache/doris/pull/48007)
- 集約モデルテーブルのマテリアライズドビューの予期しない計画エラーを修正。[#47658](https://github.com/apache/doris/pull/47658)
- 内部IDオーバーフローによる`PreparedStatement`例外を解決。[#47950](https://github.com/apache/doris/pull/47950)

### Query Execution Engine

- システムテーブルクエリ時のクエリハングまたはnull pointerの問題を解決。[#48370](https://github.com/apache/doris/pull/48370)
- LEAD/LAG関数にDOUBLE型サポートを追加。[#47940](https://github.com/apache/doris/pull/47940)
- `case when`条件が256を超える場合のクエリエラーを修正。[#47179](https://github.com/apache/doris/pull/47179)
- スペースがある`str_to_date`関数エラーを修正。[#48920](https://github.com/apache/doris/pull/48920)
- `||`での定数畳み込み中の`split_part`関数エラーを修正。[#48910](https://github.com/apache/doris/pull/48910)
- `log`関数結果エラーを修正。[#47228](https://github.com/apache/doris/pull/47228)
- lambda式での`array` / `map`関数でのcore dumpの問題を解決。[#49140](https://github.com/apache/doris/pull/49140)

### Storage Management

- 集約テーブルのインポート中のメモリ破損問題を修正。[#47523](https://github.com/apache/doris/pull/47523)
- メモリ圧迫下でのMoWインポート中の時々発生するcore dumpを解決。[#47715](https://github.com/apache/doris/pull/47715)
- BE再起動とスキーマ変更中のMoWでの潜在的な重複キー問題を修正。[#48056](https://github.com/apache/doris/pull/48056) [#48775](https://github.com/apache/doris/pull/48775)
- memtableプロモーションでのgroup commitとグローバルカラム更新問題を修正。[#48120](https://github.com/apache/doris/pull/48120) [#47968](https://github.com/apache/doris/pull/47968)

### Permission Management

- LDAP使用時にPartialResultExceptionをスローしなくなりました。[#47858](https://github.com/apache/doris/pull/47858)
