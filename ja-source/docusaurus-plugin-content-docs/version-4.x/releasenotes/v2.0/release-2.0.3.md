---
{
  "title": "リリース 2.0.3",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.3バージョンでは約1000の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.3バージョンでは、オプティマイザ統計、転置インデックス、複合データタイプ、データレイク、レプリカ管理を含む約1000の改善とバグ修正が行われました。



## 1 動作変更

- 複合データタイプarray/map/structの出力形式が、入力形式とJSON仕様に一致するように変更されました。以前のバージョンからの主な変更点は、DATE/DATETIMEとSTRING/VARCHARが二重引用符で囲まれ、ARRAY/MAP内のnull値が`NULL`ではなく`null`として表示されることです。
  - https://github.com/apache/doris/pull/25946
- SHOW_VIEW権限がサポートされました。SELECTまたはLOAD権限を持つユーザーは、'SHOW CREATE VIEW'文を実行できなくなり、SHOW_VIEW権限を個別に付与される必要があります。
  - https://github.com/apache/doris/pull/25370


## 2 新機能

### 2.1 オプティマイザの統計を自動収集する機能のサポート

統計の収集は、オプティマイザがデータ分散特性を理解し、より良いプランを選択してクエリパフォーマンスを大幅に向上させるのに役立ちます。バージョン2.0.3から正式にサポートされ、デフォルトで終日有効になっています。

### 2.2 より多くのデータレイクソースでの複合データタイプのサポート
- JAVA UDF、JDBC、Hudi MORでの複合データタイプのサポート
  - https://github.com/apache/doris/pull/24810
  - https://github.com/apache/doris/pull/26236
- Paimonでの複合データタイプのサポート
  - https://github.com/apache/doris/pull/25364
- Paimonバージョン0.5のサポート
  - https://github.com/apache/doris/pull/24985


### 2.3 より多くの組み込み関数の追加
- 新しいオプティマイザでのBitmapAgg関数のサポート
  - https://github.com/apache/doris/pull/25508
- SHAシリーズダイジェスト関数のサポート
  - https://github.com/apache/doris/pull/24342 
- 集約関数min_byとmax_byでのBITMAPデータタイプのサポート
  - https://github.com/apache/doris/pull/25430 
- milliseconds/microseconds_add/sub/diff関数の追加
  - https://github.com/apache/doris/pull/24114
- いくつかのjson関数の追加：json_insert、json_replace、json_set
  - https://github.com/apache/doris/pull/24384


## 3 改善と最適化

### 3.1 パフォーマンス最適化

- 高フィルタ率の転置インデックスMATCH WHERE条件と低フィルタ率の通常のWHERE条件が組み合わされた場合、インデックス列のI/Oが大幅に削減されます。
- whereフィルタ後のランダムデータアクセスの効率を最適化しました。
- JSONデータタイプでの古いget_json_xx関数のパフォーマンスを2～4倍最適化しました。
- データ読み取りスレッドの優先度を下げる設定をサポートし、リアルタイム書き込み用のCPUリソースを確保します。
- largeintを返す`uuid-numeric`関数を追加し、文字列を返す`uuid`関数より20倍高速です。
- case whenのパフォーマンスを3倍最適化しました。
- ストレージエンジン実行での不要な述語計算を排除しました。
- count演算子をストレージ層にプッシュダウンしてcountパフォーマンスを向上させました。
- inおよびor式でのnullableタイプの計算パフォーマンスを最適化しました。
- より多くのシナリオで`join`前のlimit演算子の書き換えをサポートし、クエリパフォーマンスを向上させました。
- インラインビューから不要な`order by`演算子を排除してクエリパフォーマンスを向上させました。
- いくつかのケースでカーディナリティ推定とコストモデルの精度を最適化しました。
- jdbc catalogの述語プッシュダウンロジックを最適化しました。
- 初回有効化時のファイルキャッシュの読み取り効率を最適化しました。
- hiveテーブルのSQLキャッシュポリシーを最適化し、HMSに保存されたパーティション更新時刻を使用してキャッシュヒット率を向上させました。
- mowコンパクション効率を最適化しました。
- 外部テーブルクエリのスレッド割り当てロジックを最適化してメモリ使用量を削減しました。
- 列リーダーのメモリ使用量を最適化しました。



### 3.2 分散レプリカ管理の改善

分散レプリカ管理の改善には、パーティション削除のスキップ、colocateグループ削除、継続的書き込みによるバランス失敗、ホットコールド分離テーブルバランスが含まれます。


### 3.3 セキュリティ強化
- 監査ログプラグインが平文パスワードの代わりにトークンを使用してセキュリティを強化しました
  - https://github.com/apache/doris/pull/26278
- log4j設定のセキュリティ強化
  - https://github.com/apache/doris/pull/24861  
- 機密ユーザー情報がログに表示されないようになりました
  - https://github.com/apache/doris/pull/26912


## 4 バグ修正と安定性

### 4.1 複合データタイプ
- map/structで固定長CHAR(n)が正しく切り捨てられない問題を修正しました。
  - https://github.com/apache/doris/pull/25725
- map/arrayにネストされたstructデータタイプの書き込み失敗を修正しました
  - https://github.com/apache/doris/pull/26973
- count distinctがarray/map/structをサポートしない問題を修正しました
  - https://github.com/apache/doris/pull/25483
- クエリで削除複合タイプが出現した後の2.0.3への更新時のbeクラッシュを修正しました
  - https://github.com/apache/doris/pull/26006
- JSONデータタイプがWHERE句にある場合のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/27325
- ARRAYデータタイプがOUTER JOIN句にある場合のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/25669
- ORC形式でのDECIMALデータタイプの読み取り結果が正しくない問題を修正しました。
  - https://github.com/apache/doris/pull/26548
  - https://github.com/apache/doris/pull/25977
  - https://github.com/apache/doris/pull/26633

### 4.2 転置インデックス
- 転置インデックスクエリを無効にした場合のWHERE句でのOR NOT組み合わせの結果が正しくない問題を修正しました。
  - https://github.com/apache/doris/pull/26327
- 転置インデックスで空の書き込み時のbeクラッシュを修正しました
  - https://github.com/apache/doris/pull/25984
- コンパクション出力が空の場合のインデックスコンパクション時のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/25486
- 新しく追加された列にデータが書き込まれていない場合の転置インデックス追加時のクラッシュ問題を修正しました。
- 新しいデータが書き込まれていないADD COLUMN後のBUILD INDEX時のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/27276
- 転置インデックスファイルのハードリンクの欠落とリーク問題を修正しました。
  - https://github.com/apache/doris/pull/26903
- ディスクが一時的に満杯になった場合のインデックスファイル破損を修正しました
  - https://github.com/apache/doris/pull/28191
- インデックス列読み取りスキップ最適化による結果の不正確さを修正しました
  - https://github.com/apache/doris/pull/28104

### 4.3 マテリアライズドビュー
- group by文での重複式によるBEクラッシュの問題を修正しました
- `group by`文に重複式がある場合のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/27523
- ビュー作成時の`group by`句でのfloat/doubleタイプを無効にしました。
  - https://github.com/apache/doris/pull/25823
- selectクエリのマテリアライズドビューマッチング機能を改善しました
  - https://github.com/apache/doris/pull/24691 
- テーブルエイリアスが使用された場合にマテリアライズドビューがマッチしない問題を修正しました
  - https://github.com/apache/doris/pull/25321
- マテリアライズドビュー作成時のpercentile_approx使用の問題を修正しました
  - https://github.com/apache/doris/pull/26528

### 4.4 テーブルサンプル
- パーティションを持つテーブルでテーブルサンプルクエリが動作しない問題を修正しました。
  - https://github.com/apache/doris/pull/25912  
- tabletを指定した場合にテーブルサンプルクエリが動作しない問題を修正しました。
  - https://github.com/apache/doris/pull/25378 


### 4.5 Unique with merge on write
- プライマリキーに基づく条件付き更新でのnullポインタ例外を修正しました
  - https://github.com/apache/doris/pull/26881    
- 部分更新でのフィールド名大文字小文字の問題を修正しました
  - https://github.com/apache/doris/pull/27223 
- スキーマ変更修復中のmowでの重複キー発生を修正しました。
  - https://github.com/apache/doris/pull/25705


### 4.6 ロードとコンパクション
- 複数テーブル実行でのroutineloadの不明なスロット記述子エラーを修正しました
  - https://github.com/apache/doris/pull/25762
- メモリ計算時の同時メモリアクセスによるbeクラッシュを修正しました
  - https://github.com/apache/doris/pull/27101 
- ロードの重複キャンセル時のbeクラッシュを修正しました。
  - https://github.com/apache/doris/pull/27111
- broker load中のブローカー接続エラーを修正しました
  - https://github.com/apache/doris/pull/26050
- コンパクションとスキャンの同時実行ケースでの削除述語の結果が正しくない問題を修正しました。
  - https://github.com/apache/doris/pull/24638
- コンパクションタスクが過度にスタックトレースログを出力する問題を修正しました
  - https://github.com/apache/doris/pull/25597


### 4.7 データレイク互換性
- icebergテーブルに特殊文字が含まれてクエリ失敗を引き起こす問題を解決しました
  - https://github.com/apache/doris/pull/27108 
- 異なるhive metastoreバージョンの互換性問題を修正しました
  - https://github.com/apache/doris/pull/27327 
- MaxComputeパーティションテーブル読み取りエラーを修正しました
  - https://github.com/apache/doris/pull/24911 
- オブジェクトストレージへのバックアップが失敗する問題を修正しました
  - https://github.com/apache/doris/pull/25496 
  - https://github.com/apache/doris/pull/25803


### 4.8 JDBC外部テーブル互換性 
 
- jdbc catalogでのOracleの日付タイプフォーマットエラーを修正しました
  - https://github.com/apache/doris/pull/25487 
- jdbc catalogでのMySQL 0000-00-00日付例外を修正しました
  - https://github.com/apache/doris/pull/26569 
- 時刻タイプのデフォルト値がcurrent_timestampのMariadbからのデータ読み取り例外を修正しました
  - https://github.com/apache/doris/pull/25016 
- jdbc catalogでのBITMAPデータタイプ処理時のbeクラッシュを修正しました
  - https://github.com/apache/doris/pull/25034 
  - https://github.com/apache/doris/pull/26933


### 4.9 SQLプランナーとオプティマイザー

- いくつかのシーンでのパーティション剪定エラーを修正しました
  - https://github.com/apache/doris/pull/27047
  - https://github.com/apache/doris/pull/26873
  - https://github.com/apache/doris/pull/25769
  - https://github.com/apache/doris/pull/27636

- いくつかのシナリオでの不正なサブクエリ処理を修正しました
  - https://github.com/apache/doris/pull/26034
  - https://github.com/apache/doris/pull/25492
  - https://github.com/apache/doris/pull/25955
  - https://github.com/apache/doris/pull/27177

- いくつかのセマンティック解析エラーを修正しました
  - https://github.com/apache/doris/pull/24928
  - https://github.com/apache/doris/pull/25627
  
- right outer/anti join中のデータ損失を修正しました
  - https://github.com/apache/doris/pull/26529
  
- 集約演算子を通過する述語の不正なプッシュダウンを修正しました。
  - https://github.com/apache/doris/pull/25525
  
- いくつかのケースでの不正な結果ヘッダーを修正しました
  - https://github.com/apache/doris/pull/25372
  
- nullsafeEquals式（<=>）が結合条件として使用された場合の不正なプランを修正しました
  - https://github.com/apache/doris/pull/27127

- セット演算演算子での正しい列剪定を修正しました。
  - https://github.com/apache/doris/pull/26884


### その他

- テーブル内の列の順序が変更され、その後2.0.3にアップグレードした場合のBEクラッシュを修正しました。
  - https://github.com/apache/doris/pull/28205


改善とバグ修正の完全なリストは[github dev/2.0.3-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.3-merged+is%3Aclosed)をご覧ください。
