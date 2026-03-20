---
{
  "title": "リリース 3.0.6",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.6バージョンが2025年6月16日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.6バージョンが2025年6月16日に正式リリースされました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- **Uniqueテーブルの時系列compactionを禁止** [#49905](https://github.com/apache/doris/pull/49905)
- **コンピュート・ストレージ分離シナリオにおいて、Auto バケットサイズをバケット当たり10GBに調整** [#50566](https://github.com/apache/doris/pull/50566)

## 新機能

### レイクハウス

- **AWS S3 table BucketsにおけるIcebergテーブル形式へのアクセスサポートを追加**
	- 詳細情報については、以下のドキュメントを参照してください: [Iceberg on S3 Tables](https://doris.apache.org/docs/dev/lakehouse/catalogs/iceberg-catalog#iceberg-on-s3-tables)

### Storage

- **オブジェクトストレージアクセス用のIAM Role認証サポート** インポート/エクスポート、バックアップ/リストア、およびコンピュート・ストレージ分離シナリオに適用 [#50252](https://github.com/apache/doris/pull/50252) [#50682](https://github.com/apache/doris/pull/50682) [#49541](https://github.com/apache/doris/pull/49541) [#49565](https://github.com/apache/doris/pull/49565) [#49422](https://github.com/apache/doris/pull/49422)
	- 詳細情報については、[ドキュメント](https://doris.apache.org/docs/3.0/admin-manual/auth/integrations/aws-authentication-and-authorization)を参照してください

### 新関数

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

- Compaction ProfileおよびログをストリームライニングPaired [#50950](https://github.com/apache/doris/pull/50950)
- Compactionスループット改善のためのスケジューリング戦略強化 [#49882](https://github.com/apache/doris/pull/49882) [#48759](https://github.com/apache/doris/pull/48759) [#51482](https://github.com/apache/doris/pull/51482) [#50672](https://github.com/apache/doris/pull/50672) [#49953](https://github.com/apache/doris/pull/49953) [#50819](https://github.com/apache/doris/pull/50819)
- **冗長ログ出力を削減** [#51093](https://github.com/apache/doris/pull/51093)
- **ブラックリストメカニズムを実装** 利用不可能なBEへのRoutine Loadからのメタデータ配布を防止 [#50587](https://github.com/apache/doris/pull/50587)
- **デフォルト値を増加** `load_task_high_priority_threshold_second` [#50478](https://github.com/apache/doris/pull/50478)

### Storage-Compute Decoupled

- **起動最適化**: File Cacheの初期化を高速化 [#50726](https://github.com/apache/doris/pull/50726)
- **クエリ高速化**: File Cacheパフォーマンスを改善 [#50275](https://github.com/apache/doris/pull/50275) [#50387](https://github.com/apache/doris/pull/50387) [#50555](https://github.com/apache/doris/pull/50555)
- **メタデータ最適化**: `get_version`によるパフォーマンスボトルネックを解決 [#51111](https://github.com/apache/doris/pull/51111) [#50439](https://github.com/apache/doris/pull/50439)
- **ガベージコレクション高速化**: オブジェクト回収効率を改善 [#50037](https://github.com/apache/doris/pull/50037) [#50766](https://github.com/apache/doris/pull/50766)
- **安定性向上**: オブジェクトストレージリトライ戦略を最適化 [#50957](https://github.com/apache/doris/pull/50957)
- **詳細プロファイリング**: tablet/segment footerディメンションメトリクスを追加 [#49945](https://github.com/apache/doris/pull/49945) [#50564](https://github.com/apache/doris/pull/50564) [#50326](https://github.com/apache/doris/pull/50326)
- **Schema Change回復力**: -230エラー防止のためNew Tablet Compactionをデフォルト有効化 [#51070](https://github.com/apache/doris/pull/51070)

### レイクハウス

#### カタログ強化

- Hive カタログにパーティションキャッシュ TTL制御（`partition.cache.ttl-second`）を追加 [#50724](https://github.com/apache/doris/pull/50724)
	- 詳細情報については、ドキュメントを参照してください: [Metadata Cache](https://doris.apache.org/docs/dev/lakehouse/meta-cache)
- Hiveテーブル用`skip.header.line.count`プロパティをサポート [#49929](https://github.com/apache/doris/pull/49929)
- `org.openx.data.jsonserde.JsonSerDe`を使用するHiveテーブルの互換性を追加 [#49958](https://github.com/apache/doris/pull/49958)
	- 詳細情報については、ドキュメントを参照してください: [Text Format](https://doris.apache.org/docs/dev/lakehouse/file-formats/text)
- Paimonをv1.0.1にアップグレード
- Icebergをv1.6.1にアップグレード

#### 機能拡張
- Alibaba Cloud OSS-HDFS Root Policyのサポートを追加 [#50678](https://github.com/apache/doris/pull/50678)
- 方言互換性: クエリ結果をHive形式で返却 [#49931](https://github.com/apache/doris/pull/49931)
 

### 非同期マテリアライズドビュー

- **メモリ最適化**: 透過的書き換え中のメモリフットプリントを削減 [#48887](https://github.com/apache/doris/pull/48887)

### Query Optimizer

- **バケットプルーニング性能を改善** [#49388](https://github.com/apache/doris/pull/49388)
- **ラムダ式強化**: 外部スロット参照をサポート [#44365](https://github.com/apache/doris/pull/44365)

### Query Execution

- **TopNクエリ高速化**: コンピュート・ストレージ分離シナリオでのパフォーマンスを最適化 [#50803](https://github.com/apache/doris/pull/50803)
- **関数拡張**: `substring_index`に可変パラメータサポートを追加 [#50149](https://github.com/apache/doris/pull/50149)
- **地理空間関数**: `ST_CONTAINS`、`ST_INTERSECTS`、`ST_TOUCHES`、`ST_DISJOINT`を追加 [#49665](https://github.com/apache/doris/pull/49665)

### Core Components

- **メモリトラッカー最適化**: 高並行性シナリオで約10%のパフォーマンス向上 [#50462](https://github.com/apache/doris/pull/50462)
- **監査ログ強化**: INSERT文長を制限する`audit_plugin_max_insert_stmt_length`を追加 [#51314](https://github.com/apache/doris/pull/51314)
	- 詳細情報については、ドキュメントを参照してください: [Audit Plugin](https://doris.apache.org/docs/3.0/admin-manual/audit-plugin)


## バグ修正

### データ取り込み

- BEでのトランザクションクリーンアップ失敗を修正 [#50103](https://github.com/apache/doris/pull/50103)
- Routine Loadのエラー報告精度を改善 [#51078](https://github.com/apache/doris/pull/51078)
- `disable_load=true`ノードへのメタデータタスク配布を防止 [#50421](https://github.com/apache/doris/pull/50421)
- FE再起動後の消費進行状況ロールバックを修正 [#50221](https://github.com/apache/doris/pull/50221)
- Core Dumpを引き起こすGroup CommitとSchema Change競合を解決 [#51144](https://github.com/apache/doris/pull/51144)
- HTTPSプロトコル使用時のS3 Loadエラーを修正 [#51246](https://github.com/apache/doris/pull/51246) [#51529](https://github.com/apache/doris/pull/51529)

### Primary Key Model

- 競合状態による重複キー問題を修正 [#50019](https://github.com/apache/doris/pull/50019) [#50051](https://github.com/apache/doris/pull/50051) [#50106](https://github.com/apache/doris/pull/50106) [#50417](https://github.com/apache/doris/pull/50417) [#50847](https://github.com/apache/doris/pull/50847) [#50974](https://github.com/apache/doris/pull/50974)

### Storage

- CCRとディスクバランシングの競合状態を修正 [#50663](https://github.com/apache/doris/pull/50663)
- デフォルトパーティションキーの永続化漏れを修正 [#50489](https://github.com/apache/doris/pull/50489)
- CCRにRollupテーブルサポートを追加 [#50337](https://github.com/apache/doris/pull/50337)
- `cooldown_ttl=0`時のエッジケースを修正 [#50830](https://github.com/apache/doris/pull/50830)
- GCとPublish競合によるデータ損失を解決 [#50343](https://github.com/apache/doris/pull/50343)
- Delete Jobでのパーティションプルーニング失敗を修正 [#50674](https://github.com/apache/doris/pull/50674)

### Storage-Compute Decoupled

- Schema ChangeがCompactionをブロックする問題を修正 [#50908](https://github.com/apache/doris/pull/50908)
- `storage_vault_prefix`が空の場合のオブジェクト回収失敗を解決 [#50352](https://github.com/apache/doris/pull/50352)
- Tablet Cacheによるクエリパフォーマンス問題を解決 [#51193](https://github.com/apache/doris/pull/51193) [#49420](https://github.com/apache/doris/pull/49420)
- 残存Tablet Cacheによるパフォーマンス変動を解消 [#50200](https://github.com/apache/doris/pull/50200)

### レイクハウス

- **エクスポート修正**
  - FEメモリリークを修正 [#51171](https://github.com/apache/doris/pull/51171)
  - FEデッドロックを防止 [#50088](https://github.com/apache/doris/pull/50088)
- **カタログ修正**
  - JDBC カタログの複合述語プッシュダウンを有効化 [#50542](https://github.com/apache/doris/pull/50542)
  - Alibaba Cloud OSS PaimonテーブルのDeletion Vector読み取りを修正 [#49645](https://github.com/apache/doris/pull/49645)
  - カンマを含むHiveパーティション値をサポート [#49382](https://github.com/apache/doris/pull/49382)
  - MaxCompute Timestampカラム解析を修正 [#49600](https://github.com/apache/doris/pull/49600)
  - Trino カタログで`information_schema`システムテーブルを有効化 [#49912](https://github.com/apache/doris/pull/49912)
- **ファイル形式**
  - LZO圧縮読み取り失敗を修正 [#49538](https://github.com/apache/doris/pull/49538)
  - レガシーORCファイル互換性を追加 [#50358](https://github.com/apache/doris/pull/50358)
  - ORCファイルの複合型解析を修正 [#50136](https://github.com/apache/doris/pull/50136)

### 非同期マテリアライズドビュー

- `start time`と即座トリガーモードの両方を指定した場合のリフレッシュ漏れを修正 [#50624](https://github.com/apache/doris/pull/50624)

### Query Optimizer

- ラムダ式での書き換えエラーを修正 [#49166](https://github.com/apache/doris/pull/49166)
- 定数group byキーでの計画失敗を解決 [#49473](https://github.com/apache/doris/pull/49473)
- 定数畳み込みロジックを修正 [#50142](https://github.com/apache/doris/pull/50142) [#50810](https://github.com/apache/doris/pull/50810)
- システムテーブル情報取得を完成 [#50721](https://github.com/apache/doris/pull/50721)
- NULL LiteralでView作成時のカラム型処理を修正 [#49881](https://github.com/apache/doris/pull/49881)

### Query Execution

- インポート中の不正JSON値によるBEクラッシュを修正 [#50978](https://github.com/apache/doris/pull/50978)
- NULL定数入力でのIntersect結果を修正 [#50951](https://github.com/apache/doris/pull/50951)
- Variant型での述語実行ミスを修正 [#50934](https://github.com/apache/doris/pull/50934)
- 不正JSON Pathでの`get_json_string`エラーを解決 [#50859](https://github.com/apache/doris/pull/50859)
- 関数動作（JSON_REPLACE/INSERT/SET/ARRAY）をMySQLと整合 [#50308](https://github.com/apache/doris/pull/50308)
- 空パラメータでの`array_map`クラッシュを修正 [#50201](https://github.com/apache/doris/pull/50201)
- 異常Variant-to-JSONB変換でのcore dumpを防止 [#50180](https://github.com/apache/doris/pull/50180)
- 不足していた`explode_json_array_json_outer`関数を追加 [#50164](https://github.com/apache/doris/pull/50164)
- `percentile`と`percentile_array`の結果を整合 [#49351](https://github.com/apache/doris/pull/49351)
- 関数（url_encode/strright/append_trailing_char_if_absent）のUTF8処理を最適化 [#49127](https://github.com/apache/doris/pull/49127)

### その他

- 高並行性シナリオでの監査ログ喪失を修正 [#50357](https://github.com/apache/doris/pull/50357)
- 動的パーティション作成中のメタデータリプレイ失敗を防止 [#49569](https://github.com/apache/doris/pull/49569)
- 再起動後のGlobal UDF喪失を解決 [#50279](https://github.com/apache/doris/pull/50279)
- Viewメタデータ返却形式をMySQLと整合 [#51058](https://github.com/apache/doris/pull/51058)
