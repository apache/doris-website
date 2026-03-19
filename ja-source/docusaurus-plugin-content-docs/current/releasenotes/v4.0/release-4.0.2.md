---
{
  "title": "リリース 4.0.2",
  "language": "ja",
  "description": "以下はApache Dorisリリースノートの専門的な翻訳です："
}
---
## 新機能

### AI & Search

- 倒置インデックスがPinyinトークナイザーとPinyinフィルターを含むカスタムアナライザーをサポート (#57097)
- 倒置インデックス検索機能でマルチポジションPhraseQueryのサポートを追加 (#57588)
- Annインデックスにonly-scan機能を追加 (#57243)

### Function

- `sem`集約関数を追加 (#57545)
- Hive由来の`factorial`シンプルSQL関数をサポート (#57144)
- 一部の正規表現関数でゼロ幅アサーションのサポートを追加 (#57643)
- JSON型でGROUP BYとDISTINCT操作を有効化 (#57679)
- `add_time`/`sub_time`時間関数を追加 (#56200)
- `deduplicate_map`関数を追加 (#58403)

### Materialized View (MTMV)

- マテリアライズドビューは、非パーティション化されたベーステーブルでデータ変更が発生した場合でも、透過的クエリ書き換えに参加可能 (#56745)
- ビューに基づくMTMVの作成をサポート (#56423)
- MTMVリフレッシュで複数のPCTテーブルをサポート (#58140)
- マテリアライズドビューにウィンドウ関数が含まれている場合のウィンドウ関数書き換えをサポート (#55066)

### Data Lake

Apache Dorisリリースノートのプロフェッショナル翻訳：

- Doris カタログを追加
  - この機能により、ユーザーはカタログ機能を通じて複数の独立したDorisクラスターを接続し、効率的な連合データクエリを実行できるようになり、Dorisクラスター間でのデータクエリができない問題に対処
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/doris-catalog
- rewrite_data_filesメソッドによるIcebergテーブルコンパクションのサポート
  - この操作により、ユーザーは小さなIcebergファイルをマージし、読み取りパフォーマンスを最適化可能
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#rewrite_data_files
- WARM UP文を使用した外部テーブル（Hive、Iceberg、Paimonなど）のキャッシュウォームアップのサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/data-cache#cache-warmup
- ALTER文によるIcebergテーブルパーティション Evolution操作のサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#partition-evolution
- HTTP table Valued Functionのサポート
  - table Valued Functionを通じてHTTPリソースファイルの直接読み取りを有効化
  - ドキュメント: https://doris.apache.org/docs/4.x/sql-manual/sql-functions/table-valued-functions/http
- Hugging Face上のデータセットへの直接アクセスをサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/huggingface
- Iceberg REST カタログプロトコルによるMicrosoft OneLakeへのアクセスをサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/best-practices/doris-onelake
- Hive、Iceberg、Paimon、およびJDBC外部テーブルからのバイナリ型のDorisvarbinary型への直接マッピングをサポート
  - 各カタログのドキュメントの「Column Mapping」セクションを参照してください。

## 最適化

- `FROM_UNIXTIME`関数のパフォーマンスを最適化 (#57423)
- PartitionKey比較での`castTo`変換操作を削除し、パーティション処理効率を向上 (#57518)
- カタログのColumnクラスのメモリフットプリントを削減 (#57401)
- Annインデックスで複数の小さなデータバッチを蓄積してから訓練を行い、訓練効率を向上 (#57623)
- Hadoop依存関係をバージョン3.4.2にアップグレード (#58307)
- FEとBEのグレースフルシャットダウンメカニズムを最適化し、ノード終了がクエリに与える影響を最小化 (#56601)
- 大量のパーティションを含むHiveテーブルの書き込み効率を改善 (#58166)
- PaimonテーブルSplitsの過剰なメモリ消費問題を最適化 (#57950)
- Parquet RLE_DICTIONARYエンコーディングの読み取り効率を改善 (#57208)
- FEとBEのグレースフルシャットダウンメカニズムを最適化し、ノード終了がクエリに与える影響を最小化 (#56601)

## バグ修正

### Query

- 入力がnullの場合に`utc_time`関数が誤った結果を返す問題を修正 (#57716)
- UNION ALLがTVFと組み合わされた際に例外が発生する問題を修正 (#57889)
- unique keyテーブルでマテリアライズドビューを作成する際にWHERE句が非キー列を含む問題を修正 (#57915)
- ウィンドウ関数を修正：LAG/LEADのoffsetパラメータで定数式評価を有効化 (#58200)
- 集約関数を修正：nullable列での射影前の集約操作の異常なプッシュダウン；非null列でのcountプッシュダウン集約問題 (#58234)
- 時間関数を修正：`second`/`microsecond`関数が時間リテラルを処理しない問題；`time_to_sec`がnull値処理時にガベージ値によりエラーを報告する問題 (#56659, #58410)
- AI関数を修正：`_exec_plan_fragment_impl`がAI関数を呼び出す際に未知のエラーが発生 (#58521)
- geoモジュールを修正：geoモジュールのメモリリーク (#58004)
- information_schemaを修正：offsetタイムゾーン使用時のタイムゾーンフォーマット非互換性 (#58412)

### Materialized View and Schema Change

- マテリアライズドビューがgroup setsとscan上のフィルターを含む場合の書き換え失敗を修正 (#57343)
- 重いスキーマ変更中に単一rowsetから重複しないセグメントを読み取ることによるcoredump問題を修正 (#57191)

### Storage-Compute Separation

- TopNクエリでのブロードキャストリモート読み取り問題を修正 (#58044)
- クラウド環境でのタブレット削除タスクの蓄積を修正 (#58131)
- クラウド環境での初回起動時のサービス起動時間が長い問題を修正 (#58152)

### Data Lake

- 特定のケースでHiveパーティション変更がメタデータキャッシュの不整合を引き起こす可能性がある問題を修正 (#58707)
- TIMESTAMP型パーティションを持つIcebergテーブルへの書き込み時のエラーを修正 (#58603)
- PaimonテーブルIncremental ReadのSparkとの動作不整合を修正 (#58239)
- 特定のケースで外部テーブルメタデータキャッシュが引き起こす潜在的デッドロック問題を修正 (#57856)
- BE側の不適切なs3クライアントスレッド数による低I/Oスループットを修正 (#58511)
- 特定のケースで非S3オブジェクトストレージに保存された外部テーブルへの書き込み失敗を修正 (#58504)
- 特定のケースでquery()を使用するJDBC カタログのSQLパススルー失敗を修正 (#57745)
- JNI Reader時間統計による読み取り操作のパフォーマンス低下を修正 (#58224)
- BE側でjni.logが出力できない問題を修正 (#58457)

### Others

- 非Master段階でのUNSET GLOBAL変数使用時のエラーを修正 (#58285)
- 特定のケースで異常なexportタスクがキャンセルできない問題を修正 (#57488)
