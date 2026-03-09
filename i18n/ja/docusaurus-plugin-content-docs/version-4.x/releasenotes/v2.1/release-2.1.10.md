---
{
  "title": "リリース 2.1.10",
  "language": "ja",
  "description": "動作変更：DELETEは対象テーブルに対してSELECT_PRIV権限を誤って要求しなくなりました。"
}
---
## 動作変更

- DELETEで対象テーブルに対するSELECT_PRIV権限が誤って必要とされなくなりました。[ #49794](https://github.com/apache/doris/pull/49794)
- Insert Overwriteで同一テーブルに対する並行操作が1つに制限されなくなりました。[ #48673](https://github.com/apache/doris/pull/48673)
- Merge on write uniqueテーブルで時系列compactionの使用が禁止されました。[ #49905](https://github.com/apache/doris/pull/49905)
- VARIANT型カラムでのインデックス作成が禁止されました。[ #49159](https://github.com/apache/doris/pull/49159)

## 新機能

### Query Execution Engine

- より多くのGEO型計算関数のサポートを追加：`ST_CONTAINS`、`ST_INTERSECTS`、`ST_TOUCHES`、`GeometryFromText`、`ST_Intersects`、`ST_Disjoint`、`ST_Touches`。[ #49665](https://github.com/apache/doris/pull/49665) [ #48695](https://github.com/apache/doris/pull/48695)
- `years_of_week`関数のサポートを追加しました。[ #48870](https://github.com/apache/doris/pull/48870)

### Lakehouse

- Hive CatalogでCatalogレベルのパーティションキャッシュ制御をサポートしました。[ #50724](https://github.com/apache/doris/pull/50724)
  - 詳細については、[ ](https://doris.apache.org/docs/dev/lakehouse/meta-cache)[ドキュメント](https://doris.apache.org/docs/dev/lakehouse/meta-cache#disable-hive-catalog-metadata-cache)を参照してください。

## 改善

### Lakehouse

- Paimon依存関係のバージョンを1.0.1にアップグレードしました。
- Iceberg依存関係のバージョンを1.6.1にアップグレードしました。
- Parquet FooterのメモリオーバーヘッドをMemory Trackerに含めることで、潜在的なOOM問題を回避しました。[ #49037](https://github.com/apache/doris/pull/49037)
- JDBC Catalogの述語プッシュダウンロジックを最適化し、AND/ORで接続された述語のプッシュダウンをサポートしました。[ #50542](https://github.com/apache/doris/pull/50542)
- プリコンパイル版にJindofs拡張パッケージをデフォルトで含めることで、Alibaba Cloud oss-hdfsアクセスをサポートしました。

### Semi-Structured Data Management

- ANY関数でJSON型をサポートしました。[ #50311](https://github.com/apache/doris/pull/50311)
- JSON_REPLACE、JSON_INSERT、JSON_SET、JSON_ARRAY関数でJSONデータ型と複合データ型をサポートしました。[ #50308](https://github.com/apache/doris/pull/50308)

### Query Optimizer

- IN式のオプション数が`Config.max_distribution_pruner_recursion_depth`を超える場合、プランニング速度を向上させるためバケットプルーニングを実行しないようにしました。[ #49387](https://github.com/apache/doris/pull/49387)

### Storage Management

- ログを削減し、一部のログメッセージを改善しました。[ #47647](https://github.com/apache/doris/pull/47647) [ #48523](https://github.com/apache/doris/pull/48523)

### その他

- thrift rpc END_OF_FILE例外を回避しました。[ #49649](https://github.com/apache/doris/pull/49649)

## バグ修正

### Lakehouse 

- Hiveで新規作成されたテーブルがDorisで即座に表示されない問題を修正しました。[ #50188](https://github.com/apache/doris/pull/50188)
- 特定のText形式Hiveテーブルにアクセスするときのエラー「Storage schema reading not supported」を修正しました。[ #50038](https://github.com/apache/doris/pull/50038)
  - 詳細については[ get_schema_from_table documentation](https://doris.apache.org/docs/dev/lakehouse/catalogs/hive-catalog?_highlight=get_schema_from_table#syntax)を参照してください。
- Hive/Icebergテーブルへの書き込み時のメタデータ送信の並行性問題を修正しました。[ #49842](https://github.com/apache/doris/pull/49842)
- oss-hdfsに保存されたHiveテーブルへの書き込みが失敗する問題を修正しました。[ #49754](https://github.com/apache/doris/pull/49754)
- パーティションキー値にカンマを含むHiveテーブルへのアクセスが失敗する問題を修正しました。[ #49382](https://github.com/apache/doris/pull/49382)
- 特定のケースでPaimonテーブルのSplit割り当てが不均等になる問題を修正しました。[ #50083](https://github.com/apache/doris/pull/50083)
- ossに保存されたPaimonテーブル読み取り時にDeleteファイルが正しく処理されない問題を修正しました。[ #49645](https://github.com/apache/doris/pull/49645)
- MaxCompute Catalogで高精度Timestampカラムの読み取りが失敗する問題を修正しました。[ #49600](https://github.com/apache/doris/pull/49600)
- 特定のケースでCatalog削除時の潜在的なリソースリークを修正しました。[ #49621](https://github.com/apache/doris/pull/49621)
- 特定のケースでLZO圧縮データの読み取りが失敗する問題を修正しました。[ #49538](https://github.com/apache/doris/pull/49538)
- ORC遅延マテリアライゼーションが複合型読み取り時にエラーを引き起こす問題を修正しました。[ #50136](https://github.com/apache/doris/pull/50136)
- pyorc-0.3バージョンで生成されたORCファイルの読み取りが失敗する問題を修正しました。[ #50358](https://github.com/apache/doris/pull/50358)
- EXPORT操作がメタデータデッドロックを引き起こす問題を修正しました。[ #50088](https://github.com/apache/doris/pull/50088)

### Indexing

- 複数回のカラム追加、削除、名前変更操作後の転置インデックス作成エラーを修正しました。[ #50056](https://github.com/apache/doris/pull/50056)
- インデックスcompactionでユニークカラムIDの検証を追加し、潜在的なデータ異常やシステムエラーを回避しました。[ #47562](https://github.com/apache/doris/pull/47562)

### Semi-Structured Data Types

- 特定のケースでVARIANT型からJSON型への変換がNULLを返す問題を修正しました。[ #50180](https://github.com/apache/doris/pull/50180)
- 特定のケースでJSONB CASTが引き起こすクラッシュを修正しました。[ #49810](https://github.com/apache/doris/pull/49810)
- VARIANT型カラムでのインデックス作成を禁止しました。[ #49159](https://github.com/apache/doris/pull/49159)
- named_struct関数でのdecimal型の精度正確性を修正しました。[ #48964](https://github.com/apache/doris/pull/48964)

### Query Optimizer

- 定数折り畳みでのいくつかの問題を修正しました。[#49413](https://github.com/apache/doris/pull/49413) [#50425](https://github.com/apache/doris/pull/50425) [#49686](https://github.com/apache/doris/pull/49686) [#49575](https://github.com/apache/doris/pull/49575) [#50142](https://github.com/apache/doris/pull/50142)
- 共通部分式抽出がlambda式で正しく動作しない可能性がある問題を修正しました。[#49166](https://github.com/apache/doris/pull/49166)
- group byキーでの定数除去が正しく動作しない問題を修正しました。[#49589](https://github.com/apache/doris/pull/49589)
- 統計推論の誤りにより極端なシナリオでプランニングが失敗する問題を修正しました。[#49415](https://github.com/apache/doris/pull/49415)
- BEメタデータに依存する一部のinformation_schemaテーブルで完全なデータを取得できない問題を修正しました。[#50721](https://github.com/apache/doris/pull/50721)

### Query Execution Engine

- explode_json_array_json_outer関数が見つからない問題を修正しました。[#50164](https://github.com/apache/doris/pull/50164)
- substring_indexが動的パラメータをサポートしない問題を修正しました。[#50149](https://github.com/apache/doris/pull/50149)
- st_contains関数が多くのケースで誤った結果を返す問題を修正しました。[#50115](https://github.com/apache/doris/pull/50115)
- array_range関数が引き起こす可能性があるコアダンプ問題を修正しました。[#49993](https://github.com/apache/doris/pull/49993)
- date_diff関数が誤った結果を返す問題を修正しました。[#49429](https://github.com/apache/doris/pull/49429)
- 非ASCII符号化で文字列関数が文字化けや誤った結果を引き起こす一連の問題を修正しました。[#49231](https://github.com/apache/doris/pull/49231) [#49846](https://github.com/apache/doris/pull/49846) [#49127](https://github.com/apache/doris/pull/49127) [#40710](https://github.com/apache/doris/pull/40710)

### Storage Management

- 特定のケースで動的パーティションテーブルのメタデータリプレイが失敗する問題を修正しました。[#49569](https://github.com/apache/doris/pull/49569)
- ARM環境でのstreamloadで操作順序によりデータが失われる可能性がある問題を修正しました。[#48948](https://github.com/apache/doris/pull/48948)
- フルcompactionのエラーとmowデータ重複の潜在的問題を修正しました。[#49825](https://github.com/apache/doris/pull/49825) [#48958](https://github.com/apache/doris/pull/48958)
- パーティションストレージポリシーが永続化されない問題を修正しました。[#49721](https://github.com/apache/doris/pull/49721)
- インポートファイルが存在しない極めて稀な問題を修正しました。[#50343](https://github.com/apache/doris/pull/50343)
- ccrとディスクバランシングの並行処理でファイルが失われる可能性がある問題を修正しました。[#50663](https://github.com/apache/doris/pull/50663)
- 大きなスナップショットのバックアップとリストア時に発生する可能性がある接続リセット問題を修正しました。[#49649](https://github.com/apache/doris/pull/49649)
- FE followerでローカルバックアップスナップショットが失われる問題を修正しました。[#49550](https://github.com/apache/doris/pull/49550)

### その他

- 特定のシナリオで監査ログが失われる可能性がある問題を修正しました。[#50357](https://github.com/apache/doris/pull/50357)
- 監査ログでisQueryフラグが誤っている可能性がある問題を修正しました。[#49959](https://github.com/apache/doris/pull/49959)
- 監査ログで一部のクエリsqlHash値が誤っている問題を修正しました。[#49984](https://github.com/apache/doris/pull/49984)
