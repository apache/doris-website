---
{
  "title": "リリース 2.0.3",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.3バージョンでは約1000の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.3バージョンでは、オプティマイザ統計、転置インデックス、複合データタイプ、データレイク、レプリカ管理を含む約1000の改善とバグ修正が行われました。



## 1 動作変更

- 複合データタイプarray/map/structの出力フォーマットが入力フォーマットとJSON仕様に一致するように変更されました。前バージョンからの主な変更点は、DATE/DATETIMEとSTRING/VARCHARが二重引用符で囲まれ、ARRAY/MAP内のnull値が`NULL`ではなく`null`として表示されることです。
  - https://github.com/apache/doris/pull/25946
- SHOW_VIEW権限がサポートされました。SELECTまたはLOAD権限を持つユーザーは、'SHOW CREATE VIEW'ステートメントを実行できなくなり、SHOW_VIEW権限を別途付与される必要があります。
  - https://github.com/apache/doris/pull/25370


## 2 新機能

### 2.1 オプティマイザの統計の自動収集をサポート

統計の収集は、オプティマイザがデータ分散特性を理解し、より良いプランを選択してクエリ性能を大幅に向上させるのに役立ちます。バージョン2.0.3から正式にサポートされ、デフォルトで終日有効になっています。

### 2.2 より多くのデータレイクソースで複合データタイプをサポート
- JAVA UDF、JDBC、Hudi MORで複合データタイプをサポート
  - https://github.com/apache/doris/pull/24810
  - https://github.com/apache/doris/pull/26236
- Paimonで複合データタイプをサポート
  - https://github.com/apache/doris/pull/25364
- Paimonバージョン0.5をサポート
  - https://github.com/apache/doris/pull/24985


### 2.3 ビルトイン関数の追加
- 新しいオプティマイザでBitmapAgg関数をサポート
  - https://github.com/apache/doris/pull/25508
- SHAシリーズのダイジェスト関数をサポート
  - https://github.com/apache/doris/pull/24342 
- 集約関数min_byとmax_byでBITMAPデータタイプをサポート
  - https://github.com/apache/doris/pull/25430 
- milliseconds/microseconds_add/sub/diff関数を追加
  - https://github.com/apache/doris/pull/24114
- json関数を追加：json_insert、json_replace、json_set
  - https://github.com/apache/doris/pull/24384


## 3 改善と最適化

### 3.1 性能最適化

- フィルタ率の高い転置インデックスMATCH WHERE条件と、フィルタ率の低い通常のWHERE条件が組み合わされた場合、インデックス列のI/Oが大幅に削減されます。
- whereフィルタ後のランダムデータアクセスの効率を最適化。
- JSONデータタイプに対する従来のget_json_xx関数の性能を2～4倍最適化。
- データ読み取りスレッドの優先度を下げる設定をサポートし、リアルタイム書き込み用のCPUリソースを確保。
- largeintを返す`uuid-numeric`関数を追加。文字列を返す`uuid`関数より20倍高速。
- case whenの性能を3倍最適化。
- ストレージエンジンの実行で不要な述語計算を削除。
- countオペレータをストレージ層にプッシュダウンしてcount性能を向上。
- andやor式でのnullableタイプの計算性能を最適化。
- より多くのシナリオでjoin前のlimitオペレータの書き換えをサポートし、クエリ性能を向上。
- インラインビューから不要な`order by`オペレータを削除してクエリ性能を向上。
- 一部のケースでカーディナリティ推定とコストモデルの精度を最適化。
- jdbc catalogの述語プッシュダウンロジックを最適化。
- ファイルキャッシュを初回有効化する際の読み取り効率を最適化。
- hiveテーブルsqlキャッシュポリシーを最適化し、HMSに保存されたパーティション更新時刻を使用してキャッシュヒット率を向上。
- mow compactionの効率を最適化。
- 外部テーブルクエリのスレッド配分ロジックを最適化してメモリ使用量を削減。
- カラムリーダーのメモリ使用量を最適化。



### 3.2 分散レプリカ管理の改善

分散レプリカ管理の改善には、パーティション削除のスキップ、colocateグループ削除、継続的な書き込みによるバランス失敗、ホットコールドセパレーションテーブルバランスが含まれます。


### 3.3 セキュリティ強化
- 監査ログプラグインで平文パスワードの代わりにトークンを使用してセキュリティを強化
  - https://github.com/apache/doris/pull/26278
- log4j設定のセキュリティ強化
  - https://github.com/apache/doris/pull/24861  
- 機密なユーザー情報がログに表示されないように設定
  - https://github.com/apache/doris/pull/26912


## 4 バグ修正と安定性

### 4.1 複合データタイプ
- map/structで固定長CHAR(n)が正しく切り詰められない問題を修正。
  - https://github.com/apache/doris/pull/25725
- map/arrayでネストしたstructデータタイプの書き込み失敗を修正
  - https://github.com/apache/doris/pull/26973
- count distinctがarray/map/structをサポートしない問題を修正
  - https://github.com/apache/doris/pull/25483
- クエリで削除複合タイプが現れた後に2.0.3にアップデート際のbeクラッシュを修正
  - https://github.com/apache/doris/pull/26006
- JSONデータタイプがWHERE句にある時のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27325
- ARRAYデータタイプがOUTER JOIN句にある時のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/25669
- ORCフォーマットでDECIMALデータタイプの読み取り結果が不正な問題を修正。
  - https://github.com/apache/doris/pull/26548
  - https://github.com/apache/doris/pull/25977
  - https://github.com/apache/doris/pull/26633

### 4.2 転置インデックス
- 転置インデックスクエリを無効にした時にWHERE句のOR NOT組み合わせの結果が不正な問題を修正。
  - https://github.com/apache/doris/pull/26327
- 転置インデックスで空データを書き込む時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25984
- compactionの出力が空の場合のindex compaction時のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/25486
- 新しく追加した列にデータが書き込まれていない時に転置インデックスを追加する際にクラッシュする問題を修正。
- 新しいデータが書き込まれていない状態でADD COLUMN後にBUILD INDEXを実行した時のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27276
- 転置インデックスファイルのhardlinkの不足と漏れ問題を修正。
  - https://github.com/apache/doris/pull/26903
- ディスクが一時的に満杯になった時のインデックスファイル破損を修正
  - https://github.com/apache/doris/pull/28191
- インデックス列読み取りスキップ最適化による不正な結果を修正
  - https://github.com/apache/doris/pull/28104

### 4.3 マテリアライズドビュー
- group by文で重複した式によって引き起こされるBEクラッシュの問題を修正
- `group by`文で重複した式がある時のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27523
- ビューを作成する時の`group by`句でfloat/doubleタイプを無効にする。
  - https://github.com/apache/doris/pull/25823
- selectクエリがマテリアライズドビューとマッチングする機能を改善
  - https://github.com/apache/doris/pull/24691 
- テーブルエイリアスを使用した時にマテリアライズドビューがマッチしない問題を修正
  - https://github.com/apache/doris/pull/25321
- マテリアライズドビューを作成する時にpercentile_approxを使用する問題を修正
  - https://github.com/apache/doris/pull/26528

### 4.4 テーブルサンプル
- パーティションがあるテーブルでテーブルサンプルクエリが動作しない問題を修正。
  - https://github.com/apache/doris/pull/25912  
- tabletを指定した時にテーブルサンプルクエリが動作しない問題を修正。
  - https://github.com/apache/doris/pull/25378 


### 4.5 merge on writeのunique
- プライマリキーベースの条件付き更新でのnullポインタ例外を修正
  - https://github.com/apache/doris/pull/26881    
- 部分更新でフィールド名の大文字小文字の問題を修正
  - https://github.com/apache/doris/pull/27223 
- スキーマ変更修復中にmowで重複キーが発生する問題を修正。
  - https://github.com/apache/doris/pull/25705


### 4.6 ロードとcompaction
- 複数テーブル実行でのroutineloadの不明なスロットディスクリプタエラーを修正
  - https://github.com/apache/doris/pull/25762
- メモリ計算時の並行メモリアクセスによるbeクラッシュを修正
  - https://github.com/apache/doris/pull/27101 
- ロードの重複キャンセルによるbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27111
- broker load中のbroker接続エラーを修正
  - https://github.com/apache/doris/pull/26050
- compactionとscanの並行ケースでの削除述語の不正な結果を修正。
  - https://github.com/apache/doris/pull/24638
- compactionタスクが多くのスタックトレースログを出力する問題を修正
  - https://github.com/apache/doris/pull/25597


### 4.7 データレイク互換性
- icebergテーブルに特殊文字が含まれてクエリが失敗する問題を解決
  - https://github.com/apache/doris/pull/27108 
- 異なるhive metastoreバージョンの互換性問題を修正
  - https://github.com/apache/doris/pull/27327 
- MaxComputeパーティションテーブル読み取りエラーを修正
  - https://github.com/apache/doris/pull/24911 
- オブジェクトストレージへのバックアップが失敗する問題を修正
  - https://github.com/apache/doris/pull/25496 
  - https://github.com/apache/doris/pull/25803


### 4.8 JDBC外部テーブル互換性
 
- jdbc catalogでのOracleの日付タイプフォーマットエラーを修正
  - https://github.com/apache/doris/pull/25487 
- jdbc catalogでのMySQL 0000-00-00日付例外を修正
  - https://github.com/apache/doris/pull/26569 
- timeタイプのデフォルト値がcurrent_timestampのMariadbからのデータ読み取り例外を修正
  - https://github.com/apache/doris/pull/25016 
- jdbc catalogでBITMAPデータタイプを処理する時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25034 
  - https://github.com/apache/doris/pull/26933


### 4.9 SQLプランナーとオプティマイザ

- 一部のシーンでのパーティションpruneエラーを修正
  - https://github.com/apache/doris/pull/27047
  - https://github.com/apache/doris/pull/26873
  - https://github.com/apache/doris/pull/25769
  - https://github.com/apache/doris/pull/27636

- 一部のシナリオでの不正なサブクエリ処理を修正
  - https://github.com/apache/doris/pull/26034
  - https://github.com/apache/doris/pull/25492
  - https://github.com/apache/doris/pull/25955
  - https://github.com/apache/doris/pull/27177

- いくつかの意味解析エラーを修正
  - https://github.com/apache/doris/pull/24928
  - https://github.com/apache/doris/pull/25627
  
- right outer/anti join中のデータ損失を修正
  - https://github.com/apache/doris/pull/26529
  
- 集約オペレータを通過する述語の不正なプッシュダウンを修正。
  - https://github.com/apache/doris/pull/25525
  
- 一部のケースでの不正な結果ヘッダを修正
  - https://github.com/apache/doris/pull/25372
  
- nullsafeEquals式（<=>）がjoin条件として使用された時の不正なプランを修正
  - https://github.com/apache/doris/pull/27127

- set operation operatorでの正しいカラムpruneを修正。
  - https://github.com/apache/doris/pull/26884


### その他

- テーブル内のカラム順序が変更されてから2.0.3にアップグレードした時のBEクラッシュを修正。
  - https://github.com/apache/doris/pull/28205


改善とバグ修正の完全なリストは[github dev/2.0.3-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.3-merged+is%3Aclosed)をご覧ください。
