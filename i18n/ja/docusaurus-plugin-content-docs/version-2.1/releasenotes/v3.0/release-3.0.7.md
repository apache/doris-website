---
{
  "title": "リリース 3.0.7",
  "language": "ja"
}
---
## 動作変更

- `show frontends` と `show backends` の権限要件を対応するRESTful APIと整合させるよう調整し、`information_schema` データベースに対する `SELECT_PRIV` 権限を要求するようにしました
- 指定されたドメインを持つAdminおよびrootユーザーはシステムユーザーとして扱われなくなりました
- Storage: データベース当たりのデフォルト同時実行トランザクション数を10000に調整しました

## 新機能

### Query Optimizer

- MySQLの集計ロールアップ構文 `GROUP BY ... WITH ROLLUP` をサポート

### Query Execution

- `Like` ステートメントで `escape` 構文をサポート

### 半構造化データ管理

- セッション変数 `enable_add_index_for_new_data=true` を設定することで、新しいデータのみに対するnon-tokenized inverted indexとngram bloomfilter indexの構築をサポート

### 新しい関数

- データ関数を追加: `cot`/`sec`/`cosec`

## 改善

### データ取り込み

- `SHOW CREATE LOAD` のエラーメッセージプロンプトを最適化

### Primary Key Model

- 単一の大規模なインポート失敗を回避するため、セグメントキー境界の切り捨て機能を追加

### Storage

- compactionとインポートされたデータの信頼性を強化
- バランス速度を最適化
- テーブル作成速度を最適化
- compactionのデフォルトパラメータと可観測性を最適化
- クエリエラー-230の問題を最適化
- システムテーブル `backend_tablets` を追加
- cloudモードでのfollowerノードからの `information_schema.tables` クエリのパフォーマンスを最適化

### Storage-Compute Decoupled

- Meta-service recyclerの可観測性を強化
- インポートcompaction時のクロスコンピュートグループ増分プリヒーティングをサポート
- Storage vault接続性チェックを最適化
- MS API経由でのストレージバックエンド情報の更新をサポート

### Lakehouse

- x86環境でのORC zlib解凍パフォーマンスを最適化し、潜在的な問題を修正
- 外部テーブル読み取りのデフォルト同時実行スレッド数を最適化
- DDL操作をサポートしないCatalogsのエラーメッセージを最適化

### 非同期マテリアライズドビュー

- 透過的リライティング計画のパフォーマンスを最適化

### Query Optimizer

- `group_concat` 関数で非文字列型のパラメータを許可
- `sum` と `avg` 関数で非数値型のパラメータを許可
- TOP-Nクエリでの遅延マテリアライゼーションのサポート範囲を拡張し、部分カラムクエリ時の遅延マテリアライゼーションを有効化
- パーティション作成時に、listパーティションで `MAX_VALUE` の包含を許可
- 集計モデルテーブルでのサンプリングと統計情報収集のパフォーマンスを最適化
- サンプリングと統計情報収集時のNDV値の精度を最適化

### Inverted Index

- `show create table` でのinverted indexプロパティ表示順序を統一
- パフォーマンス解析を容易にするため、inverted indexフィルタ条件の条件別プロファイルメトリクス（ヒット行数や実行時間など）を追加
- プロファイルでのinverted index関連情報の表示を強化

### 権限

- Rangerでstorage vaultとcompute groupの権限設定をサポート

## バグ修正

### データ取り込み

- 複数文字セパレータを含むCSVファイルのインポート時に発生する可能性がある正確性の問題を修正
- タスクプロパティ修正後の `ROUTINE LOAD` タスク表示結果が正しくない問題を修正
- プライマリノード再起動またはLeaderスイッチ後に1ストリーム複数テーブルインポート計画が無効になる問題を修正
- `ROUTINE LOAD` タスクが利用可能なBEノードを見つけられないためにすべてのスケジューリングタスクがブロックされる問題を修正
- `runningTxnIds` の同時読み書き競合問題を修正

### Primary Key Model

- 高頻度同時インポート下でのmowテーブルのインポートパフォーマンスを最適化
- mowテーブルのfull compactionで削除されたデータの領域を解放
- 極端なシナリオでのmowテーブルの潜在的なインポート失敗問題を修正
- mowテーブルのcompactionパフォーマンスを最適化
- 同時インポートとスキーマ変更中のmowテーブルの潜在的正確性問題を修正
- 空のmowテーブルでのスキーマ変更がインポートの停滞またはスキーマ変更の失敗を引き起こす可能性がある問題を修正
- mow delete bitmap cacheのメモリリーク問題を修正
- スキーマ変更後のmowテーブルの潜在的正確性問題を修正

### Storage

- compactionによるクローンプロセスでの欠落rowset問題を修正
- autobucketの不正確なサイズ計算とデフォルト値の問題を修正
- bucketカラムによる潜在的正確性問題を修正
- 単一カラムテーブルの名前変更ができない問題を修正
- memtableの潜在的メモリリーク問題を修正
- 空のテーブルトランザクション書き込みでサポートされていない操作に対する一貫性のないエラー報告問題を修正

### Storage-Compute Decoupled

- File cacheに関する複数の修正
- スキーマプロセス中にcumulative pointがロールバックする可能性がある問題を修正
- バックグラウンドタスクが自動再起動に影響する問題を修正
- azure環境でのデータリサイクリングプロセスでの未処理例外問題を修正
- 単一rowsetのcompaction時にfile cacheが適時にクリーンアップされない問題を修正

### Lakehouse

- Kerberos環境でのIcebergテーブル書き込み時のトランザクションコミット失敗問題を修正
- kerberos環境でのhudiクエリ問題を修正
- マルチCatalogシナリオでの潜在的デッドロック問題を修正
- 一部のケースで同時Catalogリフレッシュによるメタデータ不整合問題を修正
- 一部のケースでORCフッターが複数回読み取られる問題を修正
- Table Valued Functionが圧縮されたjsonファイルを読み取れない問題を修正
- SQL Server CatalogでIDENTITYカラム情報の識別をサポート
- SQL Convertorで高可用性のための複数URL指定をサポート

### 非同期マテリアライズドビュー

- クエリが空の結果セットに最適化された場合にパーティション補償が正しく実行されない可能性がある問題を修正

### Query Optimizer

- `sql_select_limit` 以外の要因がDML実行結果に影響する問題を修正
- local shuffle開始時にマテリアライズドCTEが極端なケースでエラーを報告する可能性がある問題を修正
- 準備されたinsertステートメントがnon-masterノードで実行できない問題を修正
- `ipv4` を文字列にキャストする際の結果エラー問題を修正

### 権限

- ユーザーが複数の役割を持つ場合、認証前に複数の役割の権限がマージされるようになりました

### Query Execution

- 一部のjson関数の問題を修正
- 非同期スレッドプールが満杯時の潜在的BE Core問題を修正
- `hll_to_base64` の不正な結果問題を修正
- `decimal256` をfloatにキャストする際の結果エラー問題を修正
- 2つのメモリリーク問題を修正
- `bitmap_from_base64` によるbe core問題を修正
- `array_map` 関数による潜在的be core問題を修正
- `split_by_regexp` 関数の潜在的エラー問題を修正
- 極めて大きなデータ量での `bitmap_union` 関数の潜在的結果エラー問題を修正
- 一部の境界値での `format round` 関数の潜在的core問題を修正

### Inverted Index

- 異常な状況でのinverted indexのメモリリーク問題を修正
- 空のindexファイル書き込みとクエリ時のエラー報告問題を修正
- inverted index文字列読み取りでのIO例外をキャッチし、例外によるプロセスクラッシュを回避

### 複合データタイプ

- Variant Nestedデータタイプが競合する際の潜在的型推論エラーを修正
- `map` 関数のパラメータ型推論エラーを修正
- jsonpathでパスとして `'$.'` を指定した際にデータが誤ってNULLに変換される問題を修正
- Variantのサブフィールドに `.` が含まれる場合にシリアライゼーション形式が復元できない問題を修正

### その他

- auditlogテーブルのIPフィールドの長さ不足問題を修正
- SQL解析失敗時に監査ログに記録されるクエリidが前のクエリのものになる問題を修正
