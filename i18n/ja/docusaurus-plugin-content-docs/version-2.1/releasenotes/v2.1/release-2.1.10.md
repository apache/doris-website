---
{
  "title": "リリース 2.1.10",
  "language": "ja",
  "description": "動作変更：DELETEは対象テーブルでSELECT_PRIV権限を誤って要求しなくなりました。"
}
---
## 動作変更

- DELETEが対象テーブルのSELECT_PRIV権限を誤って要求しなくなりました。[ #49794](https://github.com/apache/doris/pull/49794)
- Insert Overwriteが同一テーブルでの並行操作を1に制限しなくなりました。[ #48673](https://github.com/apache/doris/pull/48673)
- Merge on write uniqueテーブルで時系列コンパクションの使用が禁止されました。[ #49905](https://github.com/apache/doris/pull/49905)
- VARIANT型列でのインデックス作成が禁止されました。[ #49159](https://github.com/apache/doris/pull/49159)

## 新機能

### クエリ実行エンジン

- より多くのGEO型計算関数のサポートを追加：`ST_CONTAINS`、`ST_INTERSECTS`、`ST_TOUCHES`、`GeometryFromText`、`ST_Intersects`、`ST_Disjoint`、`ST_Touches`。[ #49665](https://github.com/apache/doris/pull/49665) [ #48695](https://github.com/apache/doris/pull/48695)
- `years_of_week`関数のサポートを追加しました。[ #48870](https://github.com/apache/doris/pull/48870)

### Lakehouse

- Hive Catalogでカタログレベルのパーティションキャッシュ制御がサポートされました。[ #50724](https://github.com/apache/doris/pull/50724)
  - 詳細については、[ ](https://doris.apache.org/docs/dev/lakehouse/meta-cache)[ドキュメント](https://doris.apache.org/docs/dev/lakehouse/meta-cache#disable-hive-catalog-metadata-cache)を参照してください。

## 改善

### Lakehouse

- Paimon依存バージョンを1.0.1にアップグレードしました。
- Iceberg依存バージョンを1.6.1にアップグレードしました。
- Parquet FooterのメモリオーバーヘッドをMemory Trackerに含めて、潜在的なOOM問題を回避しました。[ #49037](https://github.com/apache/doris/pull/49037)
- JDBC Catalogの述語プッシュダウンロジックを最適化し、AND/ORで接続された述語のプッシュダウンをサポートしました。[ #50542](https://github.com/apache/doris/pull/50542)
- プリコンパイルバージョンにAlibaba Cloud oss-hdfsアクセスをサポートするJindofs拡張パッケージがデフォルトで含まれるようになりました。

### 半構造化データ管理

- ANY関数でJSON型がサポートされました。[ #50311](https://github.com/apache/doris/pull/50311)
- JSON_REPLACE、JSON_INSERT、JSON_SET、JSON_ARRAY関数でJSON型と複合データ型がサポートされました。[ #50308](https://github.com/apache/doris/pull/50308)

### クエリオプティマイザー

- IN式のオプション数が`Config.max_distribution_pruner_recursion_depth`を超える場合、プランニング速度を向上させるためにバケットプルーニングが実行されません。[ #49387](https://github.com/apache/doris/pull/49387)

### ストレージ管理

- ログを削減し、一部のログメッセージを改善しました。[ #47647](https://github.com/apache/doris/pull/47647) [ #48523](https://github.com/apache/doris/pull/48523)

### その他

- thrift rpc END_OF_FILE例外を回避しました。[ #49649](https://github.com/apache/doris/pull/49649)

## バグ修正

### Lakehouse 

- Hiveで新しく作成されたテーブルがDorisですぐに表示されない問題を修正しました。[ #50188](https://github.com/apache/doris/pull/50188)
- 特定のText形式のHiveテーブルにアクセスする際の「Storage schema reading not supported」エラーを修正しました。[ #50038](https://github.com/apache/doris/pull/50038)
  - 詳細については、[ get_schema_from_table documentation](https://doris.apache.org/docs/dev/lakehouse/catalogs/hive-catalog?_highlight=get_schema_from_table#syntax)を参照してください。
- Hive/Icebergテーブルへの書き込み時のメタデータ送信の並行性問題を修正しました。[ #49842](https://github.com/apache/doris/pull/49842)
- oss-hdfsに保存されたHiveテーブルへの書き込みが失敗する問題を修正しました。[ #49754](https://github.com/apache/doris/pull/49754)
- パーティションキー値にカンマが含まれるHiveテーブルへのアクセスが失敗する問題を修正しました。[ #49382](https://github.com/apache/doris/pull/49382)
- 特定のケースでPaimonテーブルのSplit割り当てが不均等になる問題を修正しました。[ #50083](https://github.com/apache/doris/pull/50083)
- ossに保存されたPaimonテーブルを読み取る際にDeleteファイルが正しく処理されない問題を修正しました。[ #49645](https://github.com/apache/doris/pull/49645)
- MaxCompute Catalogで高精度Timestamp列の読み取りが失敗する問題を修正しました。[ #49600](https://github.com/apache/doris/pull/49600)
- 特定のケースでCatalog削除時の潜在的なリソースリークを修正しました。[ #49621](https://github.com/apache/doris/pull/49621)
- 特定のケースでLZO圧縮データの読み取りが失敗する問題を修正しました。[ #49538](https://github.com/apache/doris/pull/49538)
- ORC遅延マテリアル化が複合型の読み取り時にエラーを引き起こす問題を修正しました。[ #50136](https://github.com/apache/doris/pull/50136)
- pyorc-0.3バージョンで生成されたORCファイルの読み取りが失敗する問題を修正しました。[ #50358](https://github.com/apache/doris/pull/50358)
- EXPORT操作がメタデータデッドロックを引き起こす問題を修正しました。[ #50088](https://github.com/apache/doris/pull/50088)

### インデックス

- 複数の列の追加、削除、名前変更操作後の転置インデックス構築エラーを修正しました。[ #50056](https://github.com/apache/doris/pull/50056)
- インデックスコンパクションでのユニークな列IDの検証を追加し、潜在的なデータ異常やシステムエラーを回避しました。[ #47562](https://github.com/apache/doris/pull/47562)

### 半構造化データ型

- 特定のケースでVARIANT型からJSON型への変換がNULLを返す問題を修正しました。[ #50180](https://github.com/apache/doris/pull/50180)
- 特定のケースでJSONB CASTによるクラッシュを修正しました。[ #49810](https://github.com/apache/doris/pull/49810)
- VARIANT型列でのインデックス作成を禁止しました。[ #49159](https://github.com/apache/doris/pull/49159)
- named_struct関数でのdecimal型の精度の正確性を修正しました。[ #48964](https://github.com/apache/doris/pull/48964)

### クエリオプティマイザー

- 定数フォールディングの複数の問題を修正しました。[#49413](https://github.com/apache/doris/pull/49413) [#50425](https://github.com/apache/doris/pull/50425) [#49686](https://github.com/apache/doris/pull/49686) [#49575](https://github.com/apache/doris/pull/49575) [#50142](https://github.com/apache/doris/pull/50142)
- 共通部分式抽出がlambda式で正常に動作しない場合があります。[#49166](https://github.com/apache/doris/pull/49166)
- group byキーでの定数除去が正常に動作しない場合がある問題を修正しました。[#49589](https://github.com/apache/doris/pull/49589)
- 統計推論の誤りにより極端なシナリオでプランニングが失敗する問題を修正しました。[#49415](https://github.com/apache/doris/pull/49415)
- BEメタデータに依存する一部のinformation_schemaテーブルが完全なデータを取得できない問題を修正しました。[#50721](https://github.com/apache/doris/pull/50721)

### クエリ実行エンジン

- explode_json_array_json_outer関数が見つからない問題を修正しました。[#50164](https://github.com/apache/doris/pull/50164)
- substring_indexが動的パラメータをサポートしない問題を修正しました。[#50149](https://github.com/apache/doris/pull/50149)
- st_contains関数が多くの場合で不正な結果を返す問題を修正しました。[#50115](https://github.com/apache/doris/pull/50115)
- array_range関数によって引き起こされる可能性があるcore dump問題を修正しました。[#49993](https://github.com/apache/doris/pull/49993)
- date_diff関数が不正な結果を返す問題を修正しました。[#49429](https://github.com/apache/doris/pull/49429)
- 非ASCII文字エンコーディングで文字列関数が文字化けや不正な結果を引き起こす一連の問題を修正しました。[#49231](https://github.com/apache/doris/pull/49231) [#49846](https://github.com/apache/doris/pull/49846) [#49127](https://github.com/apache/doris/pull/49127) [#40710](https://github.com/apache/doris/pull/40710)

### ストレージ管理

- 特定のケースで動的パーティションテーブルのメタデータ再生が失敗する問題を修正しました。[#49569](https://github.com/apache/doris/pull/49569)
- ARMでのstreamloadで操作シーケンスによりデータが失われる可能性がある問題を修正しました。[#48948](https://github.com/apache/doris/pull/48948)
- フルコンパクションのエラーとmowデータ重複の潜在的な問題を修正しました。[#49825](https://github.com/apache/doris/pull/49825) [#48958](https://github.com/apache/doris/pull/48958)
- パーティションストレージポリシーが永続化されない問題を修正しました。[#49721](https://github.com/apache/doris/pull/49721)
- インポートファイルが存在しない極めて稀な問題を修正しました。[#50343](https://github.com/apache/doris/pull/50343)
- ccrとディスクバランシングの並行性によりファイルが失われる可能性がある問題を修正しました。[#50663](https://github.com/apache/doris/pull/50663)
- 大きなスナップショットのバックアップとリストア中に発生する可能性があるconnection reset問題を修正しました。[#49649](https://github.com/apache/doris/pull/49649)
- FE followerがローカルバックアップスナップショットを失う問題を修正しました。[#49550](https://github.com/apache/doris/pull/49550)

### その他

- 特定のシナリオで監査ログが失われる可能性がある問題を修正しました。[#50357](https://github.com/apache/doris/pull/50357)
- 監査ログのisQueryフラグが不正になる可能性がある問題を修正しました。[#49959](https://github.com/apache/doris/pull/49959)
- 監査ログの一部のクエリsqlHash値が不正になる問題を修正しました。[#49984](https://github.com/apache/doris/pull/49984)
