---
{
  "title": "リリース 3.0.6",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.6版は2025年6月16日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.6 バージョンが2025年6月16日に正式リリースされました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- **Unique テーブルに対する時系列compactionを禁止** [#49905](https://github.com/apache/doris/pull/49905)
- **計算ストレージ分離シナリオにおいて Auto Bucket サイズを1バケットあたり10GBに調整** [#50566](https://github.com/apache/doris/pull/50566)

## 新機能

### Lakehouse

- **AWS S3 Table Buckets での Iceberg テーブル形式へのアクセスサポートを追加** 
	- 詳細情報については、ドキュメントを参照してください: [Iceberg on S3 Tables](https://doris.apache.org/docs/dev/lakehouse/catalogs/iceberg-catalog#iceberg-on-s3-tables)

### Storage

- **オブジェクトストレージアクセスのIAM Role認証サポート** インポート/エクスポート、バックアップ/リストア、計算ストレージ分離シナリオに適用 [#50252](https://github.com/apache/doris/pull/50252) [#50682](https://github.com/apache/doris/pull/50682) [#49541](https://github.com/apache/doris/pull/49541) [#49565](https://github.com/apache/doris/pull/49565) [#49422](https://github.com/apache/doris/pull/49422) 
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/admin-manual/auth/integrations/aws-authentication-and-authorization)を参照してください

### 新しい関数

- `json_extract_no_quotes`
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/json-functions/json-extract)を参照してください
- `unhex_null`
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/unhex)を参照してください
- `xpath_string` 
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/xpath-string)を参照してください
- `str_to_map`
- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/map-functions/str-to-map)を参照してください
- `months_between`
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/months-between)を参照してください
- `next_day`
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/next-day)を参照してください
- `format_round`: 
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/numeric-functions/format-round)を参照してください

## 改善

### Storage 

- Compaction Profile とログを合理化 [#50950](https://github.com/apache/doris/pull/50950)
- Compaction スループット向上のためのスケジューリング戦略を強化 [#49882](https://github.com/apache/doris/pull/49882) [#48759](https://github.com/apache/doris/pull/48759) [#51482](https://github.com/apache/doris/pull/51482) [#50672](https://github.com/apache/doris/pull/50672) [#49953](https://github.com/apache/doris/pull/49953) [#50819](https://github.com/apache/doris/pull/50819)
- **冗長なログ出力を削減** [#51093](https://github.com/apache/doris/pull/51093)
- Routine Load が使用できないBEにメタデータを配布することを防ぐ**ブラックリストメカニズムを実装** [#50587](https://github.com/apache/doris/pull/50587)
- `load_task_high_priority_threshold_second` の**デフォルト値を増加** [#50478](https://github.com/apache/doris/pull/50478)

### Storage-Compute Decoupled

- **起動最適化**: File Cache 初期化を高速化 [#50726](https://github.com/apache/doris/pull/50726)
- **クエリ高速化**: File Cache パフォーマンスを改善 [#50275](https://github.com/apache/doris/pull/50275) [#50387](https://github.com/apache/doris/pull/50387) [#50555](https://github.com/apache/doris/pull/50555)
- **メタデータ最適化**: `get_version` によるパフォーマンスボトルネックを解決 [#51111](https://github.com/apache/doris/pull/51111) [#50439](https://github.com/apache/doris/pull/50439)
- **ガベージコレクション高速化**: オブジェクト回収効率を改善 [#50037](https://github.com/apache/doris/pull/50037) [#50766](https://github.com/apache/doris/pull/50766)
- **安定性向上**: オブジェクトストレージ再試行戦略を最適化 [#50957](https://github.com/apache/doris/pull/50957)
- **細粒度プロファイリング**: tablet/segment footer 次元のメトリクスを追加 [#49945](https://github.com/apache/doris/pull/49945) [#50564](https://github.com/apache/doris/pull/50564) [#50326](https://github.com/apache/doris/pull/50326)
- **Schema Change レジリエンス**: -230エラーを防ぐためデフォルトで New Tablet Compaction を有効化 [#51070](https://github.com/apache/doris/pull/51070)

### Lakehouse

#### Catalog 拡張

- Hive Catalog のパーティションキャッシュTTL制御（`partition.cache.ttl-second`）を追加 [#50724](https://github.com/apache/doris/pull/50724) 
	- 詳細情報については、ドキュメントを参照してください: [Metadata Cache](https://doris.apache.org/docs/dev/lakehouse/meta-cache)
- Hive テーブルの `skip.header.line.count` プロパティをサポート [#49929](https://github.com/apache/doris/pull/49929)
- `org.openx.data.jsonserde.JsonSerDe` を使用する Hive テーブルの互換性を追加 [#49958](https://github.com/apache/doris/pull/49958) 
	- 詳細情報については、ドキュメントを参照してください: [Text Format](https://doris.apache.org/docs/dev/lakehouse/file-formats/text)
- Paimon を v1.0.1 にアップグレード
- Iceberg を v1.6.1 にアップグレード

#### 機能拡張
- Alibaba Cloud OSS-HDFS Root Policy のサポートを追加 [#50678](https://github.com/apache/doris/pull/50678)
- Dialect 互換性: Hive 形式でクエリ結果を返却 [#49931](https://github.com/apache/doris/pull/49931) 
 

### 非同期マテリアライズドビュー

- **メモリ最適化**: 透明的書き換え中のメモリフットプリントを削減 [#48887](https://github.com/apache/doris/pull/48887)

### クエリオプティマイザ

- **バケットプルーニングパフォーマンスを改善** [#49388](https://github.com/apache/doris/pull/49388)
- **lambda式を強化**: 外部スロット参照をサポート [#44365](https://github.com/apache/doris/pull/44365)

### クエリ実行

- **TopNクエリ高速化**: 計算ストレージ分離シナリオでのパフォーマンスを最適化 [#50803](https://github.com/apache/doris/pull/50803)
- **関数拡張**: `substring_index` の可変パラメータサポートを追加 [#50149](https://github.com/apache/doris/pull/50149)
- **地理空間関数**: `ST_CONTAINS`、`ST_INTERSECTS`、`ST_TOUCHES`、`ST_DISJOINT` を追加 [#49665](https://github.com/apache/doris/pull/49665)

### コアコンポーネント

- **メモリトラッカー最適化**: 高並行シナリオで約10%のパフォーマンス向上 [#50462](https://github.com/apache/doris/pull/50462)
- **監査ログ強化**: INSERT文の長さを制限するため `audit_plugin_max_insert_stmt_length` を追加 [#51314](https://github.com/apache/doris/pull/51314) 
	- 詳細情報については、ドキュメントを参照してください: [Audit Plugin](https://doris.apache.org/docs/3.0/admin-manual/audit-plugin)


## バグ修正

### データ取り込み

- BEでのトランザクションクリーンアップ失敗を修正 [#50103](https://github.com/apache/doris/pull/50103)
- Routine Load のエラー報告精度を改善 [#51078](https://github.com/apache/doris/pull/51078)
- `disable_load=true` ノードへのメタデータタスク配布を防止 [#50421](https://github.com/apache/doris/pull/50421)
- FE再起動後の消費進捗ロールバックを修正 [#50221](https://github.com/apache/doris/pull/50221)
- Group Commit と Schema Change の競合によるCore Dumpを解決 [#51144](https://github.com/apache/doris/pull/51144)
- HTTPSプロトコル使用時のS3 Loadエラーを修正 [#51246](https://github.com/apache/doris/pull/51246) [#51529](https://github.com/apache/doris/pull/51529)

### Primary Key Model

- 競合状態による重複キー問題を修正 [#50019](https://github.com/apache/doris/pull/50019) [#50051](https://github.com/apache/doris/pull/50051) [#50106](https://github.com/apache/doris/pull/50106) [#50417](https://github.com/apache/doris/pull/50417) [#50847](https://github.com/apache/doris/pull/50847) [#50974](https://github.com/apache/doris/pull/50974)

### Storage

- CCRとディスクバランシングの競合状態を修正 [#50663](https://github.com/apache/doris/pull/50663)
- デフォルトパーティションキーの永続化の欠落を修正 [#50489](https://github.com/apache/doris/pull/50489)
- CCRのRollupテーブルサポートを追加 [#50337](https://github.com/apache/doris/pull/50337)
- `cooldown_ttl=0` のエッジケースを修正 [#50830](https://github.com/apache/doris/pull/50830)
- GCとPublishの競合によるデータ損失を解決 [#50343](https://github.com/apache/doris/pull/50343)
- Delete Jobでのパーティションプルーニング失敗を修正 [#50674](https://github.com/apache/doris/pull/50674)

### Storage-Compute Decoupled

- Schema Change がCompactionをブロックする問題を修正 [#50908](https://github.com/apache/doris/pull/50908)
- `storage_vault_prefix` が空の場合のオブジェクト回収失敗を解決 [#50352](https://github.com/apache/doris/pull/50352)
- Tablet Cache によるクエリパフォーマンス問題を解決 [#51193](https://github.com/apache/doris/pull/51193) [#49420](https://github.com/apache/doris/pull/49420)
- 残存Tablet Cacheによるパフォーマンスジッターを解消 [#50200](https://github.com/apache/doris/pull/50200)

### Lakehouse

- **エクスポート修正** 
  - FEメモリリークを修正 [#51171](https://github.com/apache/doris/pull/51171)
  - FEデッドロックを防止 [#50088](https://github.com/apache/doris/pull/50088)
- **Catalog修正** 
  - JDBC Catalog の複合述語プッシュダウンを有効化 [#50542](https://github.com/apache/doris/pull/50542)
  - Alibaba Cloud OSS Paimon テーブルのDeletion Vector読み取りを修正 [#49645](https://github.com/apache/doris/pull/49645)
  - カンマを含むHiveパーティション値をサポート [#49382](https://github.com/apache/doris/pull/49382)
  - MaxCompute Timestamp列のパースを修正 [#49600](https://github.com/apache/doris/pull/49600)
  - Trino Catalog の `information_schema` システムテーブルを有効化 [#49912](https://github.com/apache/doris/pull/49912)
- **ファイル形式** 
  - LZO圧縮読み取り失敗を修正 [#49538](https://github.com/apache/doris/pull/49538)
  - レガシーORCファイル互換性を追加 [#50358](https://github.com/apache/doris/pull/50358)
  - ORCファイルの複合型パースを修正 [#50136](https://github.com/apache/doris/pull/50136)

### 非同期マテリアライズドビュー

- `start time` と即座トリガーモードの両方を指定した場合のリフレッシュ漏れを修正 [#50624](https://github.com/apache/doris/pull/50624)

### クエリオプティマイザ

- lambda式での書き換えエラーを修正 [#49166](https://github.com/apache/doris/pull/49166)
- 定数group byキーでの計画失敗を解決 [#49473](https://github.com/apache/doris/pull/49473)
- 定数folding論理を修正 [#50142](https://github.com/apache/doris/pull/50142) [#50810](https://github.com/apache/doris/pull/50810)
- システムテーブル情報取得を完了 [#50721](https://github.com/apache/doris/pull/50721)
- NULL Literalでビューを作成する際の列型処理を修正 [#49881](https://github.com/apache/doris/pull/49881)

### クエリ実行

- インポート中の不正なJSON値によるBEクラッシュを修正 [#50978](https://github.com/apache/doris/pull/50978)
- NULL定数入力でのIntersect結果を修正 [#50951](https://github.com/apache/doris/pull/50951)
- Variant型での述語誤実行を修正 [#50934](https://github.com/apache/doris/pull/50934)
- 不正なJSON Pathsでの `get_json_string` エラーを解決 [#50859](https://github.com/apache/doris/pull/50859)
- 関数動作（JSON_REPLACE/INSERT/SET/ARRAY）をMySQLと整合 [#50308](https://github.com/apache/doris/pull/50308)
- 空パラメータでの `array_map` クラッシュを修正 [#50201](https://github.com/apache/doris/pull/50201)
- 異常なVariant-to-JSONB変換中のコアダンプを防止 [#50180](https://github.com/apache/doris/pull/50180)
- 不足している `explode_json_array_json_outer` 関数を追加 [#50164](https://github.com/apache/doris/pull/50164)
- `percentile` と `percentile_array` の結果を整合 [#49351](https://github.com/apache/doris/pull/49351)
- 関数（url_encode/strright/append_trailing_char_if_absent）のUTF8処理を最適化 [#49127](https://github.com/apache/doris/pull/49127)

### その他

- 高並行シナリオでの監査ログ損失を修正 [#50357](https://github.com/apache/doris/pull/50357)
- 動的パーティション作成中のメタデータリプレイ失敗を防止 [#49569](https://github.com/apache/doris/pull/49569)
- 再起動後のGlobal UDF損失を解決 [#50279](https://github.com/apache/doris/pull/50279)
- ビューメタデータ返却形式をMySQLと整合 [#51058](https://github.com/apache/doris/pull/51058)
