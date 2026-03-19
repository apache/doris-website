---
{
  "title": "リリース 2.0.3",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.3バージョンでは約1000の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.3バージョンではオプティマイザ統計、転置インデックス、複合データ型、データレイク、レプリカ管理を含む約1000の改善とバグ修正が行われました。

## 1 動作変更

- 複合データ型array/map/structの出力形式が入力形式とJSON仕様に一致するよう変更されました。前バージョンからの主な変更点として、DATE/DATETIMEとSTRING/VARCHARが二重引用符で囲まれ、ARRAY/MAP内のnull値が`NULL`ではなく`null`として表示されます。
  - https://github.com/apache/doris/pull/25946
- SHOW_VIEW権限がサポートされました。SELECTやLOAD権限を持つユーザーは、'SHOW CREATE VIEW'ステートメントを実行できなくなり、SHOW_VIEW権限を別途付与する必要があります。
  - https://github.com/apache/doris/pull/25370

## 2 新機能

### 2.1 オプティマイザの統計情報自動収集をサポート

統計情報の収集により、オプティマイザがデータ分布特性を理解し、より良いプランを選択してクエリ性能を大幅に向上させます。バージョン2.0.3から正式にサポートされ、デフォルトで終日有効になっています。

### 2.2 より多くのdatalakeソースで複合データ型をサポート
- JAVA UDF、JDBC、Hudi MORで複合データ型をサポート
  - https://github.com/apache/doris/pull/24810
  - https://github.com/apache/doris/pull/26236
- Paimonで複合データ型をサポート
  - https://github.com/apache/doris/pull/25364
- Paimonバージョン0.5をサポート
  - https://github.com/apache/doris/pull/24985

### 2.3 より多くの組み込み関数を追加
- 新しいオプティマイザでBitmapAgg関数をサポート
  - https://github.com/apache/doris/pull/25508
- SHAシリーズのダイジェスト関数をサポート
  - https://github.com/apache/doris/pull/24342
- 集約関数min_byとmax_byでBITMAPデータ型をサポート
  - https://github.com/apache/doris/pull/25430
- milliseconds/microseconds_add/sub/diff関数を追加
  - https://github.com/apache/doris/pull/24114
- いくつかのjson関数を追加：json_insert、json_replace、json_set
  - https://github.com/apache/doris/pull/24384

## 3 改善と最適化

### 3.1 性能最適化

- 高いフィルタ率を持つ転置インデックスMATCH WHERE条件と、低いフィルタ率を持つ一般的なWHERE条件が組み合わされた場合、インデックス列のI/Oが大幅に削減されます。
- whereフィルタ後のランダムデータアクセスの効率を最適化しました。
- JSONデータ型での古いget_json_xx関数の性能を2〜4倍最適化しました。
- データ読み取りスレッドの優先度を下げる設定をサポートし、リアルタイム書き込みのCPUリソースを確保します。
- largeintを返す`uuid-numeric`関数を追加し、文字列を返す`uuid`関数より20倍高速です。
- case whenの性能を3倍最適化しました。
- ストレージエンジン実行での不要な述語計算を削除しました。
- count演算子をストレージ層にプッシュダウンしてcount性能を向上させました。
- in/or式でのnullable型の計算性能を最適化しました。
- より多くのシナリオで`join`前のlimit演算子の書き換えをサポートし、クエリ性能を向上させます。
- インラインビューから不要な`order by`演算子を除去してクエリ性能を向上させます。
- いくつかのケースでカーディナリティ推定とコストモデルの精度を最適化しました。
- jdbc catalogの述語プッシュダウンロジックを最適化しました。
- 初回有効化時のファイルキャッシュの読み取り効率を最適化しました。
- hiveテーブルのsqlキャッシュポリシーを最適化し、HMSに格納されたパーティション更新時間を使用してキャッシュヒット率を向上させます。
- mow compactionの効率を最適化しました。
- 外部テーブルクエリのスレッド割り当てロジックを最適化してメモリ使用量を削減しました。
- カラムリーダーのメモリ使用量を最適化しました。

### 3.2 分散レプリカ管理の改善

分散レプリカ管理の改善には、パーティション削除のスキップ、colocateグループ削除、継続的な書き込みによるバランス失敗、ホット・コールド分離テーブルバランスが含まれます。

### 3.3 セキュリティ強化
- 監査ログプラグインがセキュリティ強化のためプレーンテキストパスワードの代わりにトークンを使用
  - https://github.com/apache/doris/pull/26278
- log4j設定のセキュリティ強化
  - https://github.com/apache/doris/pull/24861
- 機密ユーザー情報をログに表示しない
  - https://github.com/apache/doris/pull/26912

## 4 バグ修正と安定性

### 4.1 複合データ型
- map/structで固定長CHAR(n)が正しく切り捨てられない問題を修正
  - https://github.com/apache/doris/pull/25725
- map/arrayにネストしたstructデータ型の書き込み失敗を修正
  - https://github.com/apache/doris/pull/26973
- count distinctがarray/map/structをサポートしない問題を修正
  - https://github.com/apache/doris/pull/25483
- クエリで削除複合型が出現した後の2.0.3へのアップデート時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/26006
- JSONデータ型がWHERE句にある場合のbeクラッシュを修正
  - https://github.com/apache/doris/pull/27325
- ARRAYデータ型がOUTER JOIN句にある場合のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25669
- ORC形式でのDECIMALデータ型の読み取り結果が正しくない問題を修正
  - https://github.com/apache/doris/pull/26548
  - https://github.com/apache/doris/pull/25977
  - https://github.com/apache/doris/pull/26633

### 4.2 転置インデックス
- 転置インデックスクエリを無効にした場合のWHERE句のOR NOT組み合わせの結果が正しくない問題を修正
  - https://github.com/apache/doris/pull/26327
- 転置インデックス付きで空データを書き込む際のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25984
- compactionの出力が空の場合のインデックスcompaction時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25486
- 新規追加カラムにデータが書き込まれていない場合の転置インデックス追加時のクラッシュ問題を修正
- 新しいデータが書き込まれていない状態でのADD COLUMN後のBUILD INDEXでのbeクラッシュを修正
  - https://github.com/apache/doris/pull/27276
- 転置インデックスファイルのhardlinkの不足とリーク問題を修正
  - https://github.com/apache/doris/pull/26903
- ディスクが一時的にフルになった場合のインデックスファイル破損を修正
  - https://github.com/apache/doris/pull/28191
- インデックスカラム読み取りスキップ最適化による結果が正しくない問題を修正
  - https://github.com/apache/doris/pull/28104

### 4.3 マテリアライズドビュー
- group by文での重複する式によるBEクラッシュ問題を修正
- `group by`文で重複する式がある場合のbeクラッシュを修正
  - https://github.com/apache/doris/pull/27523
- ビュー作成時の`group by`句でのfloat/double型を無効化
  - https://github.com/apache/doris/pull/25823
- selectクエリのマテリアライズドビューマッチング機能を改善
  - https://github.com/apache/doris/pull/24691
- テーブルエイリアス使用時にマテリアライズドビューがマッチしない問題を修正
  - https://github.com/apache/doris/pull/25321
- マテリアライズドビュー作成時のpercentile_approx使用問題を修正
  - https://github.com/apache/doris/pull/26528

### 4.4 テーブルサンプル
- パーティションを持つテーブルでテーブルサンプルクエリが動作しない問題を修正
  - https://github.com/apache/doris/pull/25912
- tablet指定時にテーブルサンプルクエリが動作しない問題を修正
  - https://github.com/apache/doris/pull/25378

### 4.5 Unique with merge on write
- プライマリキーベースの条件付き更新でのnullポインタ例外を修正
  - https://github.com/apache/doris/pull/26881
- 部分更新でのフィールド名大文字小文字問題を修正
  - https://github.com/apache/doris/pull/27223
- スキーマ変更修復中のmowでの重複キー発生を修正
  - https://github.com/apache/doris/pull/25705

### 4.6 ロードとcompaction
- 複数テーブル実行時のroutineloadでの不明なスロット記述子エラーを修正
  - https://github.com/apache/doris/pull/25762
- メモリ計算時の同時メモリアクセスによるbeクラッシュを修正
  - https://github.com/apache/doris/pull/27101
- ロード時の重複キャンセルによるbeクラッシュを修正
  - https://github.com/apache/doris/pull/27111
- broker load中のbroker接続エラーを修正
  - https://github.com/apache/doris/pull/26050
- compactionとscanの同時実行ケースでの削除述語の結果が正しくない問題を修正
  - https://github.com/apache/doris/pull/24638
- compactionタスクが過剰にスタックトレースログを出力する問題を修正
  - https://github.com/apache/doris/pull/25597

### 4.7 Data Lake互換性
- 特殊文字を含むicebergテーブルがクエリ失敗を引き起こす問題を解決
  - https://github.com/apache/doris/pull/27108
- 異なるhive metastoreバージョンの互換性問題を修正
  - https://github.com/apache/doris/pull/27327
- MaxComputeパーティションテーブル読み取りエラーを修正
  - https://github.com/apache/doris/pull/24911
- オブジェクトストレージへのバックアップ失敗問題を修正
  - https://github.com/apache/doris/pull/25496
  - https://github.com/apache/doris/pull/25803

### 4.8 JDBC外部テーブル互換性

- jdbc catalogでのOracleデータ型フォーマットエラーを修正
  - https://github.com/apache/doris/pull/25487
- jdbc catalogでのMySQL 0000-00-00日付例外を修正
  - https://github.com/apache/doris/pull/26569
- time型のデフォルト値がcurrent_timestampのMariadbからのデータ読み取り例外を修正
  - https://github.com/apache/doris/pull/25016
- jdbc catalogでのBITMAPデータ型処理時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25034
  - https://github.com/apache/doris/pull/26933

### 4.9 SQL PlannerとOptimizer

- いくつかのシーンでのパーティションprune エラーを修正
  - https://github.com/apache/doris/pull/27047
  - https://github.com/apache/doris/pull/26873
  - https://github.com/apache/doris/pull/25769
  - https://github.com/apache/doris/pull/27636

- いくつかのシナリオでの正しくないサブクエリ処理を修正
  - https://github.com/apache/doris/pull/26034
  - https://github.com/apache/doris/pull/25492
  - https://github.com/apache/doris/pull/25955
  - https://github.com/apache/doris/pull/27177

- いくつかのセマンティック解析エラーを修正
  - https://github.com/apache/doris/pull/24928
  - https://github.com/apache/doris/pull/25627

- right outer/anti join時のデータ損失を修正
  - https://github.com/apache/doris/pull/26529

- 集約演算子を通過する述語の正しくないプッシュダウンを修正
  - https://github.com/apache/doris/pull/25525

- いくつかのケースでの正しくない結果ヘッダーを修正
  - https://github.com/apache/doris/pull/25372

- nullsafeEquals式（<=>）がjoin条件として使用された場合の正しくないプランを修正
  - https://github.com/apache/doris/pull/27127

- set operation演算子での正しいカラムpruneを修正
  - https://github.com/apache/doris/pull/26884

### その他

- テーブル内のカラム順序が変更された後に2.0.3にアップグレードした場合のBEクラッシュを修正
  - https://github.com/apache/doris/pull/28205

改善とバグ修正の完全なリストは[github dev/2.0.3-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.3-merged+is%3Aclosed)をご覧ください。
