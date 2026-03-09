---
{
  "title": "リリース 2.1.4",
  "language": "ja",
  "description": "Apache Doris バージョン2.1.4は2024年6月26日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris version 2.1.4 が2024年6月26日に正式にリリースされました。** 今回のアップデートでは、data lakehouseシナリオ向けの様々な機能体験を最適化し、特に前バージョンの異常なメモリ使用量問題の解決に重点を置きました。さらに、安定性を向上させるために、いくつかの改善とバグ修正を実装しました。ダウンロードしてご利用ください。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- Hiveなどの外部テーブルをクエリする際、存在しないファイルは無視されます。[#35319](https://github.com/apache/doris/pull/35319)

  ファイルリストはメタキャッシュから取得され、実際のファイルリストと一致しない場合があります。
  
  存在しないファイルを無視することで、クエリエラーの回避に役立ちます。

- デフォルトでは、Bitmap Indexの作成時にInverted Indexに自動変更されなくなりました。[#35521](https://github.com/apache/doris/pull/35521)

  この動作はFE設定項目`enable_create_bitmap_index_as_inverted_index`により制御され、デフォルトはfalseです。

- `--console`を使用してFEおよびBEプロセスを起動する場合、すべてのログは標準出力に出力され、ログタイプを示すプレフィックスによって区別されます。[#35679](https://github.com/apache/doris/pull/35679)

	詳細については、以下のドキュメントを参照してください：
	
	- [Log Management - FE Log](../../admin-manual/log-management/fe-log)

	- [Log Management - BE Log](../../admin-manual/log-management/be-log)

- テーブル作成時にテーブルコメントが提供されない場合、テーブルタイプをデフォルトコメントとして使用する代わりに、デフォルトコメントは空になります。[#36025](https://github.com/apache/doris/pull/36025)

- DECIMALV3のデフォルト精度は、この機能が最初にリリースされたバージョンとの互換性を保つため、(9, 0)から(38, 9)に調整されました。[#36316](https://github.com/apache/doris/pull/36316)

## 新機能

### クエリオプティマイザー

- FE flame graphツールをサポート
  
  詳細については、[ドキュメント](/community/developer-guide/fe-profiler.md)を参照してください
  
- `SELECT DISTINCT`を集約と併用できるようになりました。

- `GROUP BY`なしでのシングルテーブルクエリリライトをサポート。これは複雑なフィルターや式に役立ちます。[#35242](https://github.com/apache/doris/pull/35242)。

- 新しいオプティマイザーがポイントクエリ機能を完全にサポート [#36205](https://github.com/apache/doris/pull/36205)。

### Data Lakehouse

- Apache Paimon deletion vectorのネイティブリーダーをサポート [#35241](https://github.com/apache/doris/pull/35241)

- Table Valued FunctionsでResourceの使用をサポート [#35139](https://github.com/apache/doris/pull/35139)

- Hive Ranger pluginを使用したアクセスコントローラーでData Maskをサポート

### 非同期マテリアライズドビュー

- 内部テーブルトリガー更新のビルドサポート。マテリアライズドビューが内部テーブルを使用し、内部テーブルのデータが変更された場合、マテリアライズドビューの更新をトリガーできます。マテリアライズドビュー作成時にREFRESH ON COMMITを指定します。

- 単一テーブルの透過的リライトをサポート。詳細については、[Querying Async Materialized View](../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md)を参照してください。

- 透過的リライトはagg_state、agg_unionタイプの集約ロールアップをサポート。マテリアライズドビューはagg_stateまたはagg_unionとして定義でき、クエリは特定の集約関数を使用するか、agg_mergeを使用できます。詳細については、[AGG_STATE](../../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md)を参照してください

### その他

- 関数`replace_empty`を追加。

	詳細については、[ドキュメント]../sql-manual/sql-functions/string-functions/replace_empty)を参照してください。

- `show storage policy using`文をサポート。

	詳細については、[ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY-USING)を参照してください。

- BE側でJVMメトリクスをサポート。

  `be.conf`で`enable_jvm_monitor=true`を設定してこの機能を有効化します。

## 改善

- 中国語名の列に対する転置インデックスの作成をサポート。[#36321](https://github.com/apache/doris/pull/36321)

- segmentキャッシュによるメモリ消費をより正確に推定し、未使用メモリをより迅速に解放できるように。[#35751](https://github.com/apache/doris/pull/35751)

- テーブルをリモートストレージにエクスポートする前に空パーティションをフィルター。[#35542](https://github.com/apache/doris/pull/35542)

- Backends間の負荷を分散するためのroutine loadタスク配分アルゴリズムを最適化。[#34778](https://github.com/apache/doris/pull/34778)

- set操作中に関連変数が見つからない場合のヒントを提供。[#35775](https://github.com/apache/doris/pull/35775)

- Java UDF jarファイルをFEの`custom_lib`ディレクトリに配置してデフォルトロードできるようにサポート。[#35984](https://github.com/apache/doris/pull/35984)

- 監査ログロードジョブ用のタイムアウトグローバル変数`audit_plugin_load_timeout`を追加。

- 非同期マテリアライズドビューの透過的リライト計画のパフォーマンスを最適化。

- `INSERT`操作を最適化し、ソースが空の場合はBEが実行しないように。[#34418](https://github.com/apache/doris/pull/34418)

- Hive/Hudirテーブルのファイルリストをバッチで取得することをサポート。120万ファイルのシナリオでは、ファイルリストの取得時間が390秒から46秒に短縮。[#35107](https://github.com/apache/doris/pull/35107)

- 非同期マテリアライズドビュー作成時の動的パーティショニングを禁止。

- Hive内の外部テーブルの外部データのパーティションデータが非同期マテリアライズドビューと同期されているかどうかの検出をサポート。

- 非同期マテリアライズドビューでのインデックス作成を許可。

## バグ修正

### クエリオプティマイザー

- パーティション切り捨て後にSQLキャッシュが古い結果を返す問題を修正。[#34698](https://github.com/apache/doris/pull/34698)

- JSONから他の型へのキャストでnull可能属性が正しく処理されない問題を修正。[#34707](https://github.com/apache/doris/pull/34707)

- 時折発生するDATETIMEV2リテラル簡略化エラーを修正。[#35153](https://github.com/apache/doris/pull/35153)

- ウィンドウ関数で`COUNT(*)`が使用できない問題を修正。[#35220](https://github.com/apache/doris/pull/35220)

- `UNION ALL`下のすべての`SELECT`文に`FROM`句がない場合にnull可能属性が正しくない問題を修正。[#35074](https://github.com/apache/doris/pull/35074)

- `bitmap in join`とサブクエリunnestingが同時に使用できない問題を修正。[#35435](https://github.com/apache/doris/pull/35435)

- 特定の状況でフィルター条件がCTE producerにプッシュダウンできないパフォーマンス問題を修正。[#35463](https://github.com/apache/doris/pull/35463)

- 大文字で書かれた集約combinatorが見つからない問題を修正。[#35540](https://github.com/apache/doris/pull/35540)

- ウィンドウ関数が列pruningによって適切にpruningされないパフォーマンス問題を修正。[#35504](https://github.com/apache/doris/pull/35504)

- 同じ名前だが異なるデータベースの複数テーブルがクエリに同時に現れる場合にクエリが間違って解析され、誤った結果になる問題を修正。[#35571](https://github.com/apache/doris/pull/35571)

- スキーマテーブルスキャン中のランタイムフィルター生成によるクエリエラーを修正。[#35655](https://github.com/apache/doris/pull/35655)

- ネストした相関サブクエリでjoin条件がnullリテラルに畳み込まれ実行できない問題を修正。[#35811](https://github.com/apache/doris/pull/35811)

- プランニング時に時折発生するdecimalリテラルの不正確な精度設定問題を修正。[#36055](https://github.com/apache/doris/pull/36055)

- プランニング時に時折発生する複数層の集約の不正確なマージ問題を修正。[#36145](https://github.com/apache/doris/pull/36145)

- 集約展開プランニング後に時折発生する入出力不一致エラーを修正。[#36207](https://github.com/apache/doris/pull/36207)

- 時折発生する`<=>`が`=`に間違って変換される問題を修正。[#36521](https://github.com/apache/doris/pull/36521)

### クエリ実行

- pipelineエンジンで制限行数に達してもクエリがハングし、メモリが解放されない問題を修正。[#35746](https://github.com/apache/doris/pull/35746)

- `enable_decimal256`がtrueだが古いプランナーにフォールバックした場合のBEコアダンプを修正。[#35731](https://github.com/apache/doris/pull/35731)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューのビルドで指定されたstore_row_column属性がコアによって認識されない問題を修正。

- 非同期マテリアライズドビューのビルドでstorage_mediumの指定が有効にならない問題を修正。

- ベーステーブル削除後の非同期マテリアライズドビューshow partitionsでのエラー発生を解決。

- 非同期マテリアライズドビューがバックアップおよび復元の例外を引き起こす問題を修正。[#35703](https://github.com/apache/doris/pull/35703)

- パーティションリライトが間違った結果につながる問題を修正。[#35236](https://github.com/apache/doris/pull/35236)

### 半構造化

- 空のキーを持つVARIANTが使用された場合のコアダンプ問題を修正。[#35671](https://github.com/apache/doris/pull/35671)
- BitmapとBloomFilterインデックスでlight index変更を実行しないように。[#35225](https://github.com/apache/doris/pull/35225)

### プライマリキー

- インポート時の部分列更新の場合に例外的なBE再起動が発生し、重複キーが生じる問題を修正。[#35678](https://github.com/apache/doris/pull/35678)

- メモリ不足時のクローン操作中にBEがコアダンプする問題を修正。[#34702](https://github.com/apache/doris/pull/34702)

### Data Lakehouse

- `ctl.db.tbl`などの完全修飾名でHiveテーブルが作成できない問題を修正 [#34984](https://github.com/apache/doris/pull/34984)

- リフレッシュ時にHive metastore接続が閉じられない問題を修正 [#35426](https://github.com/apache/doris/pull/35426)

- 2.0.xから2.1.xにアップグレード時の潜在的なメタリプレイ問題を修正。[#35532](https://github.com/apache/doris/pull/35532)

- Table Valued Functionが空のsnappy圧縮ファイルを読み取れない問題を修正。[#34926](https://github.com/apache/doris/pull/34926)

- 無効なmin-max列統計を持つParquetファイルを読み取れない問題を修正 [#35041](https://github.com/apache/doris/pull/35041)

- Parquet/ORCリーダーでnull-aware関数を使ったプッシュダウン述語を処理できない問題を修正 [#35335](https://github.com/apache/doris/pull/35335)

- Hiveテーブル作成時のパーティション列の順序に関する問題を修正 [#35347](https://github.com/apache/doris/pull/35347)

- パーティション値にスペースが含まれる場合のS3上のHiveテーブルへの書き込み失敗を修正 [#35645](https://github.com/apache/doris/pull/35645)

- Aliyun OSSエンドポイントのスキームが間違っている問題を修正 [#34907](https://github.com/apache/doris/pull/34907)

- DorisによってParquet形式で書き込まれたHiveテーブルをHiveが読み取れない問題を修正 [#34981](https://github.com/apache/doris/pull/34981)

- Hiveテーブルのスキーマ変更後にORCファイルを読み取れない問題を修正 [#35583](https://github.com/apache/doris/pull/35583)

- Paimonテーブルのスキーマ変更後にJNI経由でPaimonテーブルを読み取れない問題を修正 [#35309](https://github.com/apache/doris/pull/35309)

- 書き出されるParquet形式ファイルのRow Groupsが小さすぎる問題を修正。[#36042](https://github.com/apache/doris/pull/36042) [#36143](https://github.com/apache/doris/pull/36143)

- スキーマ変更後にPaimonテーブルを読み取れない問題を修正 [#36049](https://github.com/apache/doris/pull/36049)

- スキーマ変更後にHive Parquet形式テーブルを読み取れない問題を修正 [#36182](https://github.com/apache/doris/pull/36182)

- Hadoop FSキャッシュによるFE OOM問題を修正 [#36403](https://github.com/apache/doris/pull/36403)

- Hive Metastore Listener有効化後にFEが起動できない問題を修正 [#36533](https://github.com/apache/doris/pull/36533)

- 大量ファイル時のクエリパフォーマンス低下問題を修正 [#36431](https://github.com/apache/doris/pull/36431)

- Icebergのtimestamp列タイプ読み取り時のタイムゾーン問題を修正 [#36435](https://github.com/apache/doris/pull/36435)

- Iceberg TableでのDATETIME変換エラーとデータパスエラーを修正。[#35708](https://github.com/apache/doris/pull/35708)

- Table Valued Functionsでユーザー定義の追加プロパティを保持し、S3 SDKに渡すことをサポート。[#35515](https://github.com/apache/doris/pull/35515)

### データインポート

- `CANCEL LOAD`が動作しない問題を修正 [#35352](https://github.com/apache/doris/pull/35352)

- ロードトランザクションのPublishフェーズでのnullポインタエラーがロード完了を妨げる問題を修正 [#35977](https://github.com/apache/doris/pull/35977)

- HTTPで送信される大データファイルのbRPCシリアライゼーションの問題を修正 [#36169](https://github.com/apache/doris/pull/36169)

### データ管理

- DDLまたはDMLをmaster FEに転送した後のConnectionContext内のリソースタグが設定されない問題を修正。[#35618](https://github.com/apache/doris/pull/35618)

- `lower_case_table_names`が有効時に復元されたテーブル名が間違っている問題を修正 [#35508](https://github.com/apache/doris/pull/35508)

- `admin clean trash`が動作しない問題を修正 [#35271](https://github.com/apache/doris/pull/35271)

- パーティションからストレージポリシーを削除できない問題を修正 [#35874](https://github.com/apache/doris/pull/35874)

- マルチレプリカ自動パーティションテーブルへのインポート時のデータ損失問題を修正 [#36586](https://github.com/apache/doris/pull/36586)

- 古いオプティマイザーを使用して自動パーティションテーブルをクエリまたはインサートする際にテーブルのパーティション列が変更される問題を修正 [#36514](https://github.com/apache/doris/pull/36514)

### メモリ管理

- Cgroup meminfo取得失敗によるログでの頻繁なエラーの問題を修正。[#35425](https://github.com/apache/doris/pull/35425)

- BloomFilter使用時にSegmentキャッシュサイズが制御されず、プロセスメモリの異常成長につながる問題を修正。[#34871](https://github.com/apache/doris/pull/34871)

### 権限

- 大文字小文字を区別しないテーブル名有効化後に権限設定が無効になる問題を修正。[#36557](https://github.com/apache/doris/pull/36557)

- 非Master FEノード経由でのLDAPパスワード設定が有効にならない問題を修正。[#36598](https://github.com/apache/doris/pull/36598)

- `SELECT COUNT(*)`文で認証チェックができない問題を修正。[#35465](https://github.com/apache/doris/pull/35465)

### その他

- MySQL接続が切断された場合にクライアントJDBCプログラムが接続を閉じられない問題を修正。[#36616](https://github.com/apache/doris/pull/36616)

- `SHOW PROCEDURE STATUS`文とのMySQL protocol互換性問題を修正。[#35350](https://github.com/apache/doris/pull/35350)

- `libevent`で特定の状況での接続リークの問題を解決するためKeepaliveを強制するように。[#36088](https://github.com/apache/doris/pull/36088)

## クレジット

このリリースに貢献してくださったすべての方に感謝いたします。

@airborne12, @amorynan, @AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @caiconghui, @CalvinKirs, @cambyzju, @catpineapple, @cjj2010, @csun5285, @DarvenDuan, @dataroaring, @deardeng, @Doris-Extras, @eldenmoon, @englefly, @feiniaofeiafei, @felixwluo, @freemandealer, @Gabriel39, @gavinchou, @GoGoWen, @HappenLee, @hello-stephen, @hubgeter, @hust-hhb, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @lide-reed, @luennng, @luwei16, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @mymeiyi, @nextdreamblue, @platoneko, @qidaye, @qzsee, @seawinde, @shuke987, @sollhui, @starocean999, @suxiaogang223, @TangSiyang2001, @Thearas, @Vallishp, @w41ter, @wangbo, @whutpencil, @wsjz, @wuwenchi, @xiaokang, @xiedeyantu, @XieJiann, @xinyiZzz, @XuPengfei-1020, @xy720, @xzj7019, @yiguolei, @yongjinhou, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zfr9527, @zgxme, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
