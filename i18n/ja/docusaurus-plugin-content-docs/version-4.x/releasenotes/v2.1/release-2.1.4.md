---
{
  "title": "リリース 2.1.4",
  "language": "ja",
  "description": "Apache Doris バージョン2.1.4は2024年6月26日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris バージョン2.1.4が2024年6月26日に正式リリースされました。** この更新では、データレイクハウスシナリオ向けの様々な機能体験を最適化し、前バージョンでの異常なメモリ使用量問題の解決に重点を置きました。さらに、安定性を向上させるためにいくつかの改善とバグ修正を実装しました。ダウンロードしてご利用ください。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- Hiveなどの外部テーブルを照会する際、存在しないファイルは無視されます。[#35319](https://github.com/apache/doris/pull/35319)

  ファイルリストはメタキャッシュから取得され、実際のファイルリストと一致しない場合があります。
  
  存在しないファイルを無視することで、クエリエラーの回避に役立ちます。

- デフォルトでは、Bitmap Indexの作成時に自動的にInverted Indexに変更されなくなりました。[#35521](https://github.com/apache/doris/pull/35521)

  この動作はFE設定項目`enable_create_bitmap_index_as_inverted_index`によって制御され、デフォルトでfalseです。

- `--console`を使用してFEとBEプロセスを開始する際、すべてのログが標準出力に出力され、ログタイプを示すプレフィックスで区別されます。[#35679](https://github.com/apache/doris/pull/35679)

	詳細については、ドキュメントをご覧ください：
	
	- [Log Management - FE Log](../../admin-manual/log-management/fe-log)

	- [Log Management - BE Log](../../admin-manual/log-management/be-log)

- テーブル作成時にテーブルコメントを提供しない場合、テーブルタイプをデフォルトコメントとして使用する代わりに、デフォルトコメントは空になります。[#36025](https://github.com/apache/doris/pull/36025)

- DECIMALV3のデフォルト精度が(9, 0)から(38, 9)に調整され、この機能が最初にリリースされたバージョンとの互換性を維持します。[#36316](https://github.com/apache/doris/pull/36316)

## 新機能

### クエリオプティマイザー

- FE flame graphツールをサポート
  
  詳細については、[ドキュメント](/community/developer-guide/fe-profiler.md)をご覧ください
  
- `SELECT DISTINCT`を集約と併用できるようになりました。

- `GROUP BY`なしの単一テーブルクエリリライトをサポート。これは複雑なフィルターや式に有用です。[#35242](https://github.com/apache/doris/pull/35242)。

- 新しいオプティマイザーがポイントクエリ機能を完全にサポート[#36205](https://github.com/apache/doris/pull/36205)。

### データレイクハウス

- Apache Paimon deletion vectorのネイティブリーダーをサポート[#35241](https://github.com/apache/doris/pull/35241)

- table Valued FunctionsでのResourceの使用をサポート[#35139](https://github.com/apache/doris/pull/35139)

- Hive RangerプラグインによるAccess controllerがData Maskをサポート

### 非同期マテリアライズドビュー

- 内部テーブルトリガー更新のビルドサポート。マテリアライズドビューが内部テーブルを使用し、内部テーブルのデータが変更された場合、マテリアライズドビューの更新をトリガーでき、マテリアライズドビュー作成時にREFRESH ON COMMITを指定します。

- 単一テーブルの透明な書き換えをサポート。詳細については、[Querying Async Materialized View](../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md)をご覧ください。

- 透明な書き換えがagg_state、agg_unionタイプの集約ロールアップをサポート；マテリアライズドビューをagg_stateまたはagg_unionとして定義でき、クエリは特定の集約関数を使用するか、agg_mergeを使用できます。詳細については、[AGG_STATE](../../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md)をご覧ください

### その他

- 関数`replace_empty`を追加。

	詳細については、[ドキュメント](../sql-manual/sql-functions/string-functions/replace_empty)をご覧ください。

- `show storage policy using`ステートメントをサポート。

	詳細については、[ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY-USING)をご覧ください。

- BE側でのJVMメトリクスをサポート。

  `be.conf`で`enable_jvm_monitor=true`を設定してこの機能を有効にします。

## 改善

- 中国語名を持つカラムに対するInverted Indexの作成をサポート。[#36321](https://github.com/apache/doris/pull/36321)

- セグメントキャッシュによるメモリ消費をより正確に推定し、未使用メモリをより迅速に解放できるように。[#35751](https://github.com/apache/doris/pull/35751)

- テーブルをリモートストレージにエクスポートする前に空のパーティションをフィルタリング。[#35542](https://github.com/apache/doris/pull/35542)

- Backend間での負荷分散のためのルーチンロードタスク割り当てアルゴリズムを最適化。[#34778](https://github.com/apache/doris/pull/34778)

- set操作中に関連変数が見つからない場合にヒントを提供。[#35775](https://github.com/apache/doris/pull/35775)

- デフォルト読み込み用にFEの`custom_lib`ディレクトリにJava UDF jarファイルを配置することをサポート。[#35984](https://github.com/apache/doris/pull/35984)

- 監査ログロードジョブのタイムアウトグローバル変数`audit_plugin_load_timeout`を追加。

- 非同期マテリアライズドビューの透明な書き換えプランニングのパフォーマンスを最適化。

- ソースが空の場合の`INSERT`操作を最適化し、BEは実行されません。[#34418](https://github.com/apache/doris/pull/34418)

- Hive/Hudiテーブルのファイルリストをバッチでフェッチすることをサポート。120万ファイルのシナリオで、ファイルリスト取得時間が390秒から46秒に短縮されました。[#35107](https://github.com/apache/doris/pull/35107)

- 非同期マテリアライズドビュー作成時の動的パーティショニングを禁止。

- Hiveの外部テーブルの外部データのパーティションデータが非同期マテリアライズドビューと同期されているかの検出をサポート。

- 非同期マテリアライズドビュー用のインデックス作成を許可。

## バグ修正

### クエリオプティマイザー

- パーティションのtruncate後にSQLキャッシュが古い結果を返す問題を修正。[#34698](https://github.com/apache/doris/pull/34698)

- JSONから他のタイプへのキャストがnull許可属性を正しく処理しない問題を修正。[#34707](https://github.com/apache/doris/pull/34707)

- 時々発生するDATETIMEV2リテラル簡素化エラーを修正。[#35153](https://github.com/apache/doris/pull/35153)

- ウィンドウ関数で`COUNT(*)`が使用できない問題を修正。[#35220](https://github.com/apache/doris/pull/35220)

- `UNION ALL`の下にある全ての`SELECT`ステートメントが`FROM`句を持たない場合にnull許可属性が不正になる問題を修正。[#35074](https://github.com/apache/doris/pull/35074)

- `bitmap in join`とサブクエリのunnestingが同時に使用できない問題を修正。[#35435](https://github.com/apache/doris/pull/35435)

- 特定の状況でフィルター条件がCTE producerにプッシュダウンできないパフォーマンス問題を修正。[#35463](https://github.com/apache/doris/pull/35463)

- 大文字で書かれた集約combinatorが見つからない問題を修正。[#35540](https://github.com/apache/doris/pull/35540)

- カラムプルーニングによってウィンドウ関数が適切にプルーニングされないパフォーマンス問題を修正。[#35504](https://github.com/apache/doris/pull/35504)

- クエリに異なるデータベースの同名テーブルが同時に表示される際にクエリが誤って解析され間違った結果になる問題を修正。[#35571](https://github.com/apache/doris/pull/35571)

- スキーマテーブルスキャン中のランタイムフィルター生成によるクエリエラーを修正。[#35655](https://github.com/apache/doris/pull/35655)

- join条件がnullリテラルに折りたたまれることで入れ子相関サブクエリが実行できない問題を修正。[#35811](https://github.com/apache/doris/pull/35811)

- プランニング中に decimal literalに不正な精度が設定される時々の問題を修正。[#36055](https://github.com/apache/doris/pull/36055)

- プランニング中に複数層の集約が誤ってマージされる時々の問題を修正。[#36145](https://github.com/apache/doris/pull/36145)

- aggregate expansion planning後に入力出力不一致エラーが発生する時々の問題を修正。[#36207](https://github.com/apache/doris/pull/36207)

- `<=>`が誤って`=`に変換される時々の問題を修正。[#36521](https://github.com/apache/doris/pull/36521)

### クエリ実行

- パイプラインエンジンで制限行数に達した際にクエリがハングしメモリが解放されない問題を修正。[#35746](https://github.com/apache/doris/pull/35746)

- `enable_decimal256`がtrueだが古いプランナーにフォールバックする際のBE coredumpを修正。[#35731](https://github.com/apache/doris/pull/35731)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビュービルドで指定されたstore_row_column属性がコアに認識されない問題を修正。

- 非同期マテリアライズドビュービルドでstorage_mediumの指定が有効にならない問題を修正。

- ベーステーブル削除後の非同期マテリアライズドビューshow partitionsでのエラー発生を解決。

- 非同期マテリアライズドビューがバックアップと復元の例外を引き起こす問題を修正。[#35703](https://github.com/apache/doris/pull/35703)

- パーティション書き換えが不正な結果になる問題を修正。[#35236](https://github.com/apache/doris/pull/35236)

### 半構造化

- 空のキーを持つVARIANTが使用される際のコアダンプ問題を修正。[#35671](https://github.com/apache/doris/pull/35671)
- BitmapとBloomFilterインデックスはlight index changesを実行すべきでない問題を修正。[#35225](https://github.com/apache/doris/pull/35225)

### プライマリキー

- インポート時の部分カラム更新の場合に例外的なBE再起動が発生し、重複キーが生じる問題を修正。[#35678](https://github.com/apache/doris/pull/35678)

- メモリ不足時のクローン操作中にBEがコアダンプする可能性がある問題を修正。[#34702](https://github.com/apache/doris/pull/34702)

### データレイクハウス

- `ctl.db.tbl`などの完全修飾名でHiveテーブルが作成できない問題を修正[#34984](https://github.com/apache/doris/pull/34984)

- リフレッシュ時にHive metastore接続が閉じられない問題を修正[#35426](https://github.com/apache/doris/pull/35426)

- 2.0.xから2.1.xにアップグレード時の潜在的なメタリプレイ問題を修正。[#35532](https://github.com/apache/doris/pull/35532)

- table Valued Functionが空のsnappy圧縮ファイルを読み取れない問題を修正。[#34926](https://github.com/apache/doris/pull/34926)

- 無効なmin-maxカラム統計を持つParquetファイルを読み取れない問題を修正[#35041](https://github.com/apache/doris/pull/35041)

- Parquet/ORCリーダーでnull-aware関数を含むプッシュダウン述語を処理できない問題を修正[#35335](https://github.com/apache/doris/pull/35335)

- Hiveテーブル作成時のパーティションカラムの順序に関する問題を修正[#35347](https://github.com/apache/doris/pull/35347)

- パーティション値にスペースが含まれる場合のS3上のHiveテーブルへの書き込み失敗問題を修正[#35645](https://github.com/apache/doris/pull/35645)

- Aliyun OSSエンドポイントの不正なschemeに関する問題を修正[#34907](https://github.com/apache/doris/pull/34907)

- DorisによってParquet形式で書き込まれたHiveテーブルをHiveが読み取れない問題を修正[#34981](https://github.com/apache/doris/pull/34981)

- Hiveテーブルのスキーマ変更後にORCファイルを読み取れない問題を修正[#35583](https://github.com/apache/doris/pull/35583)

- Paimonテーブルのスキーマ変更後にJNI経由でPaimonテーブルを読み取れない問題を修正[#35309](https://github.com/apache/doris/pull/35309)

- 書き出されるParquet形式ファイルのRow Groupが小さすぎる問題を修正。[#36042](https://github.com/apache/doris/pull/36042) [#36143](https://github.com/apache/doris/pull/36143)

- スキーマ変更後にPaimonテーブルを読み取れない問題を修正[#36049](https://github.com/apache/doris/pull/36049)

- スキーマ変更後にHive Parquet形式テーブルを読み取れない問題を修正[#36182](https://github.com/apache/doris/pull/36182)

- Hadoop FSキャッシュによるFE OOM問題を修正[#36403](https://github.com/apache/doris/pull/36403)

- Hive Metastore Listenerを有効にした後にFEが起動できない問題を修正[#36533](https://github.com/apache/doris/pull/36533)

- 大量ファイル時のクエリパフォーマンス劣化問題を修正[#36431](https://github.com/apache/doris/pull/36431)

- IcebergでのtimestampカラムタイプRead時のタイムゾーン問題を修正[#36435](https://github.com/apache/doris/pull/36435)

- Iceberg tableでのDATETIME変換エラーとデータパスエラーを修正。[#35708](https://github.com/apache/doris/pull/35708)

- table Valued FunctionsからS3 SDKへの追加のユーザー定義プロパティの保持と受け渡しをサポート。[#35515](https://github.com/apache/doris/pull/35515)

### データインポート

- `CANCEL LOAD`が動作しない問題を修正[#35352](https://github.com/apache/doris/pull/35352)

- ロードトランザクションのPublishフェーズでのnull pointerエラーがロード完了を妨げる問題を修正[#35977](https://github.com/apache/doris/pull/35977)

- HTTP経由で送信する際のbRPCによる大きなデータファイルのシリアライゼーション問題を修正[#36169](https://github.com/apache/doris/pull/36169)

### データ管理

- DDLまたはDMLをmaster FEに転送した後にConnectionContextでリソースタグが設定されない問題を修正。[#35618](https://github.com/apache/doris/pull/35618)

- `lower_case_table_names`が有効な場合に復元されたテーブル名が不正になる問題を修正[#35508](https://github.com/apache/doris/pull/35508)

- `admin clean trash`が動作しない問題を修正[#35271](https://github.com/apache/doris/pull/35271)

- パーティションからストレージポリシーを削除できない問題を修正[#35874](https://github.com/apache/doris/pull/35874)

- マルチレプリカ自動パーティションテーブルへのインポート時のデータ損失問題を修正[#36586](https://github.com/apache/doris/pull/36586)

- 古いオプティマイザーを使用して自動パーティションテーブルをクエリまたは挿入する際にテーブルのパーティションカラムが変更される問題を修正[#36514](https://github.com/apache/doris/pull/36514)

### メモリ管理

- Cgroup meminfoの取得失敗によるログの頻繁なエラーの問題を修正。[#35425](https://github.com/apache/doris/pull/35425)

- BloomFilter使用時にSegmentキャッシュサイズが制御されず、プロセスメモリ異常増加を招く問題を修正。[#34871](https://github.com/apache/doris/pull/34871)

### 権限

- 大文字小文字を区別しないテーブル名を有効にした後に権限設定が無効になる問題を修正。[#36557](https://github.com/apache/doris/pull/36557)

- 非MasterFEノード経由でのLDAPパスワード設定が有効にならない問題を修正。[#36598](https://github.com/apache/doris/pull/36598)

- `SELECT COUNT(*)`ステートメントで認証チェックができない問題を修正。[#35465](https://github.com/apache/doris/pull/35465)

### その他

- MySQL接続が切断された場合にクライアントJDBCプログラムが接続を閉じることができない問題を修正。[#36616](https://github.com/apache/doris/pull/36616)

- `SHOW PROCEDURE STATUS`ステートメントのMySQL protocol互換性問題を修正。[#35350](https://github.com/apache/doris/pull/35350)

- 特定の状況での接続リーク問題を解決するため、`libevent`でKeepaliveを強制するようになりました。[#36088](https://github.com/apache/doris/pull/36088)

## クレジット

このリリースに貢献してくださったすべての方に感謝いたします。

@airborne12, @amorynan, @AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @caiconghui, @CalvinKirs, @cambyzju, @catpineapple, @cjj2010, @csun5285, @DarvenDuan, @dataroaring, @deardeng, @Doris-Extras, @eldenmoon, @englefly, @feiniaofeiafei, @felixwluo, @freemandealer, @Gabriel39, @gavinchou, @GoGoWen, @HappenLee, @hello-stephen, @hubgeter, @hust-hhb, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @lide-reed, @luennng, @luwei16, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @mymeiyi, @nextdreamblue, @platoneko, @qidaye, @qzsee, @seawinde, @shuke987, @sollhui, @starocean999, @suxiaogang223, @TangSiyang2001, @Thearas, @Vallishp, @w41ter, @wangbo, @whutpencil, @wsjz, @wuwenchi, @xiaokang, @xiedeyantu, @XieJiann, @xinyiZzz, @XuPengfei-1020, @xy720, @xzj7019, @yiguolei, @yongjinhou, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zfr9527, @zgxme, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
