---
{
  "title": "リリース 2.0.3",
  "language": "ja",
  "description": "コミュニティのユーザーと開発者のおかげで、Doris 2.0.3バージョンでは約1000件の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.3バージョンでは、オプティマイザー統計、転置インデックス、複合データ型、データレイク、レプリカ管理を含む約1000の改善とバグ修正が行われました。



## 1 動作変更

- 複合データ型array/map/structの出力フォーマットが、入力フォーマットとJSON仕様に一致するように変更されました。以前のバージョンからの主な変更点は、DATE/DATETIMEとSTRING/VARCHARが二重引用符で囲まれ、ARRAY/MAP内のnull値が`NULL`ではなく`null`として表示されることです。
  - https://github.com/apache/doris/pull/25946
- SHOW_VIEW権限がサポートされました。SELECTまたはLOAD権限を持つユーザーは、'SHOW CREATE VIEW'文を実行できなくなり、SHOW_VIEW権限を別途付与される必要があります。
  - https://github.com/apache/doris/pull/25370


## 2 新機能

### 2.1 オプティマイザーの統計自動収集をサポート

統計収集は、オプティマイザーがデータ分布特性を理解し、クエリパフォーマンスを大幅に改善するより良いプランを選択するのに役立ちます。バージョン2.0.3から正式にサポートされ、デフォルトで終日有効になっています。

### 2.2 より多くのdatalakeソースで複合データ型をサポート
- JAVA UDF、JDBC、Hudi MORで複合データ型をサポート
  - https://github.com/apache/doris/pull/24810
  - https://github.com/apache/doris/pull/26236
- Paimonで複合データ型をサポート
  - https://github.com/apache/doris/pull/25364
- Paimonバージョン0.5をサポート
  - https://github.com/apache/doris/pull/24985


### 2.3 組み込み関数の追加
- 新しいオプティマイザーでBitmapAgg関数をサポート
  - https://github.com/apache/doris/pull/25508
- SHAシリーズダイジェスト関数をサポート
  - https://github.com/apache/doris/pull/24342 
- 集約関数min_byとmax_byでBITMAPデータ型をサポート
  - https://github.com/apache/doris/pull/25430 
- milliseconds/microseconds_add/sub/diff関数を追加
  - https://github.com/apache/doris/pull/24114
- json関数を追加：json_insert、json_replace、json_set
  - https://github.com/apache/doris/pull/24384


## 3 改善と最適化

### 3.1 パフォーマンス最適化

- 高フィルター率の転置インデックスMATCH WHERE条件が低フィルター率の通常のWHERE条件と組み合わされた場合、インデックス列のI/Oが大幅に削減されます。
- whereフィルター後のランダムデータアクセスの効率を最適化。
- JSONデータ型での古いget_json_xx関数のパフォーマンスを2～4倍最適化。
- データ読み取りスレッドの優先度を下げる設定をサポートし、リアルタイム書き込み用のCPUリソースを確保。
- largeintを返す`uuid-numeric`関数を追加。stringを返す`uuid`関数より20倍高速。
- case whenのパフォーマンスを3倍最適化。
- ストレージエンジン実行での不要な述語計算を削減。
- countオペレーターをストレージ層にプッシュダウンしてcountパフォーマンスを向上。
- andおよびor式でのnullable型の計算パフォーマンスを最適化。
- より多くのシナリオで`join`前のlimitオペレーターの書き換えをサポートし、クエリパフォーマンスを改善。
- インラインビューから不要な`order by`オペレーターを除去してクエリパフォーマンスを改善。
- 一部のケースでカーディナリティ推定とコストモデルの精度を最適化。
- jdbcカタログ述語プッシュダウンロジックを最適化。
- 初回有効化時のファイルキャッシュの読み取り効率を最適化。
- hiveテーブルsqlキャッシュポリシーを最適化し、HMSに格納されたパーティション更新時刻を使用してキャッシュヒット率を改善。
- mowコンパクション効率を最適化。
- 外部テーブルクエリのスレッド割り当てロジックを最適化してメモリ使用量を削減。
- 列リーダーのメモリ使用量を最適化。



### 3.2 分散レプリカ管理の改善

分散レプリカ管理の改善には、パーティション削除のスキップ、colocateグループ削除、継続的書き込みによるバランス失敗、ホットコールド分離テーブルバランスが含まれます。


### 3.3 セキュリティ強化
- 監査ログプラグインがプレーンテキストパスワードの代わりにトークンを使用してセキュリティを強化
  - https://github.com/apache/doris/pull/26278
- log4j設定のセキュリティ強化
  - https://github.com/apache/doris/pull/24861  
- 機密ユーザー情報がログに表示されない
  - https://github.com/apache/doris/pull/26912


## 4 バグ修正と安定性

### 4.1 複合データ型
- map/structで固定長CHAR(n)が正しく切り詰められない問題を修正。
  - https://github.com/apache/doris/pull/25725
- map/array用にネストされたstruct データ型の書き込み失敗を修正
  - https://github.com/apache/doris/pull/26973
- count distinctがarray/map/structをサポートしない問題を修正
  - https://github.com/apache/doris/pull/25483
- クエリで削除複合型が出現した後の2.0.3への更新でbeクラッシュを修正
  - https://github.com/apache/doris/pull/26006
- JSONデータ型がWHERE句にある場合のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27325
- ARRAYデータ型がOUTER JOIN句にある場合のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/25669
- ORC形式でのDECIMALデータ型の読み取り結果が正しくない問題を修正。
  - https://github.com/apache/doris/pull/26548
  - https://github.com/apache/doris/pull/25977
  - https://github.com/apache/doris/pull/26633

### 4.2 転置インデックス
- 転置インデックスクエリを無効にした場合のWHERE句でのOR NOT組み合わせの不正な結果を修正。
  - https://github.com/apache/doris/pull/26327
- 転置インデックスで空データを書き込む際のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25984
- コンパクションの出力が空の場合のインデックスコンパクションでのbeクラッシュを修正。
  - https://github.com/apache/doris/pull/25486
- 新たに追加された列にデータが書き込まれていない場合に転置インデックスを追加する際のクラッシュ問題を修正。
- 新しいデータが書き込まれていないADD COLUMN後のBUILD INDEXでのbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27276
- 転置インデックスファイルのハードリンクの欠損とリーク問題を修正。
  - https://github.com/apache/doris/pull/26903
- ディスクが一時的にフルになった場合のインデックスファイル破損を修正
  - https://github.com/apache/doris/pull/28191
- インデックス列の読み取りスキップ最適化による不正な結果を修正
  - https://github.com/apache/doris/pull/28104

### 4.3 マテリアライズドビュー
- group by文での重複式によるBEクラッシュ問題を修正
- `group by`文に重複式がある場合のbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27523
- ビュー作成時の`group by`句でのfloat/double型を無効化。
  - https://github.com/apache/doris/pull/25823
- selectクエリでマテリアライズドビューとのマッチング機能を改善
  - https://github.com/apache/doris/pull/24691 
- テーブルエイリアスが使用された場合にマテリアライズドビューがマッチしない問題を修正
  - https://github.com/apache/doris/pull/25321
- マテリアライズドビュー作成時のpercentile_approx使用の問題を修正
  - https://github.com/apache/doris/pull/26528

### 4.4 テーブルサンプル
- パーティションのあるテーブルでテーブルサンプルクエリが動作しない問題を修正。
  - https://github.com/apache/doris/pull/25912  
- tabletを指定した場合にテーブルサンプルクエリが動作しない問題を修正。
  - https://github.com/apache/doris/pull/25378 


### 4.5 Unique with merge on write
- プライマリキーに基づく条件付き更新でのnull pointerException を修正
  - https://github.com/apache/doris/pull/26881    
- 部分更新でのフィールド名大文字小文字の問題を修正
  - https://github.com/apache/doris/pull/27223 
- スキーマ変更の修復中にmowで重複キーが発生する問題を修正。
  - https://github.com/apache/doris/pull/25705


### 4.6 ロードとコンパクション
- 複数テーブル実行のroutineloadでのunknown slot descriptor エラーを修正
  - https://github.com/apache/doris/pull/25762
- メモリ計算時の同時メモリアクセスによるbeクラッシュを修正
  - https://github.com/apache/doris/pull/27101 
- ロードの重複キャンセルによるbeクラッシュを修正。
  - https://github.com/apache/doris/pull/27111
- broker loadでのbroker接続エラーを修正
  - https://github.com/apache/doris/pull/26050
- コンパクションとスキャンの同時実行ケースでの削除述語の不正な結果を修正。
  - https://github.com/apache/doris/pull/24638
- コンパクションタスクが過度にスタックトレースログを出力する問題を修正
  - https://github.com/apache/doris/pull/25597


### 4.7 Data Lake互換性
- 特殊文字を含むicebergテーブルがクエリ失敗を引き起こす問題を解決
  - https://github.com/apache/doris/pull/27108 
- 異なるhive metastoreバージョンの互換性問題を修正
  - https://github.com/apache/doris/pull/27327 
- MaxComputeパーティションテーブル読み取りエラーを修正
  - https://github.com/apache/doris/pull/24911 
- オブジェクトストレージへのバックアップが失敗する問題を修正
  - https://github.com/apache/doris/pull/25496 
  - https://github.com/apache/doris/pull/25803


### 4.8 JDBC外部テーブル互換性 
 
- jdbc catalogでのOracleデータ型フォーマットエラーを修正
  - https://github.com/apache/doris/pull/25487 
- jdbc catalogでのMySQL 0000-00-00 日付例外を修正
  - https://github.com/apache/doris/pull/26569 
- time型のデフォルト値がcurrent_timestampであるMariadbからのデータ読み取り例外を修正
  - https://github.com/apache/doris/pull/25016 
- jdbc catalogでBITMAPデータ型処理時のbeクラッシュを修正
  - https://github.com/apache/doris/pull/25034 
  - https://github.com/apache/doris/pull/26933


### 4.9 SQLプランナーとオプティマイザー

- 一部のシーンでのパーティション刈り込みエラーを修正
  - https://github.com/apache/doris/pull/27047
  - https://github.com/apache/doris/pull/26873
  - https://github.com/apache/doris/pull/25769
  - https://github.com/apache/doris/pull/27636

- 一部のシナリオでの不正なサブクエリ処理を修正
  - https://github.com/apache/doris/pull/26034
  - https://github.com/apache/doris/pull/25492
  - https://github.com/apache/doris/pull/25955
  - https://github.com/apache/doris/pull/27177

- 一部のセマンティック解析エラーを修正
  - https://github.com/apache/doris/pull/24928
  - https://github.com/apache/doris/pull/25627
  
- right outer/anti join時のデータ損失を修正
  - https://github.com/apache/doris/pull/26529
  
- 集約オペレーター経由での述語の不正なプッシュダウンを修正。
  - https://github.com/apache/doris/pull/25525
  
- 一部のケースでの不正な結果ヘッダーを修正
  - https://github.com/apache/doris/pull/25372
  
- nullsafeEquals式（<=>）がjoin条件として使用された場合の不正なプランを修正
  - https://github.com/apache/doris/pull/27127

- set operationオペレーターでの正しい列刈り込みを修正。
  - https://github.com/apache/doris/pull/26884


### その他

- テーブルの列順序が変更され、その後2.0.3にアップグレードした場合のBEクラッシュを修正。
  - https://github.com/apache/doris/pull/28205


改善とバグ修正の完全なリストは[github dev/2.0.3-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.3-merged+is%3Aclosed)をご覧ください。
