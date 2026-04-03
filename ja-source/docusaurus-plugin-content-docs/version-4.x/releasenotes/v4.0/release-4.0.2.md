---
{
  "title": "リリース 4.0.2",
  "language": "ja",
  "description": "以下はApache Dorisリリースノートの専門的な翻訳です："
}
---
## 新機能

### AI & 検索

- 転置インデックスがPinyinトークナイザーやPinyinフィルターを含むカスタムアナライザーをサポート (#57097)
- 転置インデックス検索機能でマルチポジションPhraseQueryのサポートを追加 (#57588)
- Annインデックスのonly-scan機能を追加 (#57243)

### 関数

- `sem`集約関数を追加 (#57545)
- Hive由来の`factorial`シンプルSQL関数をサポート (#57144)
- 一部の正規表現関数でゼロ幅アサーションのサポートを追加 (#57643)
- JSON型のGROUP BYおよびDISTINCT操作を有効化 (#57679)
- `add_time`/`sub_time`時間関数を追加 (#56200)
- `deduplicate_map`関数を追加 (#58403)

### マテリアライズドビュー (MTMV)

- マテリアライズドビューは、非パーティション化されたベーステーブルでデータ変更が発生した際も透過的クエリリライトに参加可能 (#56745)
- ビューに基づくMTMV作成をサポート (#56423)
- MTMVリフレッシュが複数のPCTテーブルをサポート (#58140)
- マテリアライズドビューにウィンドウ関数が含まれる場合のウィンドウ関数リライトをサポート (#55066)

### Data Lake

Apache Dorisリリースノートの専門的な翻訳です：

- Doris カタログを追加
  - この機能により、ユーザーはカタログ機能を通じて複数の独立したDorisクラスターを接続し、効率的な連合データクエリを実行できます。Dorisクラスター間でのデータクエリができない問題を解決します。
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/doris-catalog
- rewrite_data_filesメソッドによるIcebergテーブルコンパクションをサポート
  - この操作により、ユーザーは小さなIcebergファイルをマージでき、読み取りパフォーマンスを最適化できます。
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#rewrite_data_files
- WARM UPステートメントを使用した外部テーブル（Hive、Iceberg、Paimonなど）のキャッシュウォームアップをサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/data-cache#cache-warmup
- ALTERステートメントによるIcebergテーブルパーティション Evolution操作をサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#partition-evolution
- HTTP table Valued Functionをサポート
  - table Valued Functionを通じてHTTPリソースファイルを直接読み取り可能。
  - ドキュメント: https://doris.apache.org/docs/4.x/sql-manual/sql-functions/table-valued-functions/http
- Hugging Face上のデータセットへの直接アクセスをサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/huggingface
- Iceberg REST カタログプロトコルによるMicrosoft OneLakeへのアクセスをサポート
  - ドキュメント: https://doris.apache.org/docs/4.x/lakehouse/best-practices/doris-onelake
- Hive、Iceberg、Paimon、JDBC外部テーブルのバイナリ型のDoris varbinary型への直接マッピングをサポート
  - 各カタログのドキュメントの「Column Mapping」セクションを参照してください。

## 最適化

- `FROM_UNIXTIME`関数のパフォーマンスを最適化 (#57423)
- PartitionKey比較における`castTo`変換操作を削除してパーティション処理効率を改善 (#57518)
- カタログのColumnクラスのメモリ使用量を削減 (#57401)
- Annインデックスが複数の小さなデータバッチを蓄積してからトレーニングを行うことでトレーニング効率を改善 (#57623)
- Hadoop依存関係をバージョン3.4.2にアップグレード (#58307)
- FEとBEのグレースフルシャットダウンメカニズムを最適化してノード退出のクエリへの影響を最小化 (#56601)
- 多数のパーティションを含むHiveテーブルの書き込み効率を改善 (#58166)
- Paimonテーブル Splitsによる過度なメモリ消費の問題を最適化 (#57950)
- Parquet RLE_DICTIONARYエンコーディングの読み取り効率を改善 (#57208)
- FEとBEのグレースフルシャットダウンメカニズムを最適化してノード退出のクエリへの影響を最小化 (#56601)

## バグ修正

### クエリ

- 入力がnullの場合に`utc_time`関数が間違った結果を返す問題を修正 (#57716)
- UNION ALLがTVFと組み合わされた際に例外が発生する問題を修正 (#57889)
- unique keyテーブルにマテリアライズドビューを作成する際にWHERE句に非キー列が含まれる問題を修正 (#57915)
- ウィンドウ関数を修正: LAG/LEADのoffsetパラメータの定数式評価を有効化 (#58200)
- 集約関数を修正: null許可列での投影前の集約操作の異常なプッシュダウン、非null列でのcountプッシュダウン集約問題 (#58234)
- 時間関数を修正: `second`/`microsecond`関数が時間リテラルを処理しない問題、`time_to_sec`がnull値処理時にガベージ値によりエラーを報告する問題 (#56659, #58410)
- AI関数を修正: `_exec_plan_fragment_impl`がAI関数を呼び出す際の不明エラー (#58521)
- geoモジュールを修正: geoモジュールでのメモリリーク (#58004)
- information_schemaを修正: オフセットタイムゾーン使用時のタイムゾーンフォーマット非互換性 (#58412)

### マテリアライズドビューとスキーマ変更

- マテリアライズドビューにgroup setsとスキャン上のフィルターが含まれる場合のリライト失敗を修正 (#57343)
- 重いスキーマ変更中に単一rowsetから重複しないセグメントを読み取ることで発生するcoredump問題を修正 (#57191)

### ストレージ・コンピュート分離

- TopNクエリでのブロードキャストリモート読み取りの問題を修正 (#58044)
- クラウド環境でのタブレット削除タスクの蓄積を修正 (#58131)
- クラウド環境での初回起動時のサービス開始時間の長さの問題を修正 (#58152)

### Data Lake

- 特定のケースでHiveパーティション変更がメタデータキャッシュの不整合を引き起こす可能性がある問題を修正 (#58707)
- TIMESTAMP型パーティションを持つIcebergテーブルへの書き込み時のエラーを修正 (#58603)
- PaimonテーブルのIncremental ReadがSparkと比較して一貫しない動作を行う問題を修正 (#58239)
- 特定のケースで外部テーブルメタデータキャッシュが潜在的デッドロック問題を引き起こす問題を修正 (#57856)
- BE側での不合理なs3クライアントスレッド数による低いI/Oスループットを修正 (#58511)
- 特定のケースで非S3オブジェクトストレージに保存された外部テーブルへの書き込み失敗を修正 (#58504)
- 特定のケースでJDBC カタログがquery()を使用する際のSQLパススルー失敗を修正 (#57745)
- JNI Reader時間統計による読み取り操作のパフォーマンス低下を修正 (#58224)
- BE側でjni.logが印刷できない問題を修正 (#58457)

### その他

- 非Master段階でのUNSET GLOBAL変数使用時のエラーを修正 (#58285)
- 特定のケースで異常なexportタスクがキャンセルできない問題を修正 (#57488)
