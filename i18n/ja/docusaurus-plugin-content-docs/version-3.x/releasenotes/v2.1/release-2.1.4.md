---
{
  "title": "リリース 2.1.4",
  "language": "ja",
  "description": "Apache Doris バージョン2.1.4は2024年6月26日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris バージョン 2.1.4 が 2024年6月26日に正式リリースされました。** 今回のアップデートでは、データレイクハウスシナリオ向けの様々な機能体験を最適化し、前バージョンの異常なメモリ使用量問題の解決に重点を置きました。さらに、安定性を向上させるため、いくつかの改善とバグ修正を実装しました。ダウンロードしてご利用ください。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub リリース:** https://github.com/apache/doris/releases

## 動作変更

- Hive などの外部テーブルをクエリする際、存在しないファイルは無視されるようになります。[#35319](https://github.com/apache/doris/pull/35319)

  ファイルリストはメタキャッシュから取得され、実際のファイルリストと一致しない場合があります。
  
  存在しないファイルを無視することで、クエリエラーの回避に役立ちます。

- デフォルトでは、Bitmap Index の作成時に自動的に Inverted Index に変更されなくなります。[#35521](https://github.com/apache/doris/pull/35521)

  この動作は FE 設定項目 `enable_create_bitmap_index_as_inverted_index` によって制御され、デフォルトは false です。

- `--console` を使用して FE および BE プロセスを開始する場合、すべてのログが標準出力に出力され、ログタイプを示すプレフィックスで区別されます。[#35679](https://github.com/apache/doris/pull/35679)

	詳細については、ドキュメントを参照してください：
	
	- [Log Management - FE Log](../../admin-manual/log-management/fe-log)

	- [Log Management - BE Log](../../admin-manual/log-management/be-log)

- テーブル作成時にテーブルコメントが提供されない場合、テーブルタイプをデフォルトコメントとして使用する代わりに、デフォルトコメントが空になります。[#36025](https://github.com/apache/doris/pull/36025)

- DECIMALV3 のデフォルト精度が (9, 0) から (38, 9) に調整され、この機能が最初にリリースされたバージョンとの互換性が維持されます。[#36316](https://github.com/apache/doris/pull/36316)

## 新機能

### クエリオプティマイザー

- FE flame graph ツールをサポート
  
  詳細については、[ドキュメント](/community/developer-guide/fe-profiler.md)を参照してください
  
- `SELECT DISTINCT` を集約と併用することをサポート。

- `GROUP BY` なしの単一テーブルクエリリライトをサポート。これは複雑なフィルターや式に有用です。[#35242](https://github.com/apache/doris/pull/35242)。

- 新しいオプティマイザーがポイントクエリ機能を完全にサポート [#36205](https://github.com/apache/doris/pull/36205)。

### データレイクハウス

- Apache Paimon deletion vector のネイティブリーダーをサポート [#35241](https://github.com/apache/doris/pull/35241)

- Table Valued Functions での Resource 使用をサポート [#35139](https://github.com/apache/doris/pull/35139)

- Hive Ranger プラグインによるアクセスコントローラーが Data Mask をサポート

### 非同期マテリアライズドビュー

- 内部テーブルトリガー更新のビルドサポート。マテリアライズドビューが内部テーブルを使用し、内部テーブルのデータが変更された場合、マテリアライズドビューのリフレッシュをトリガーでき、マテリアライズドビュー作成時に REFRESH ON COMMIT を指定します。

- 単一テーブルの透過的リライトをサポート。詳細については、[Querying Async Materialized View](../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md)を参照してください。

- 透過的リライトが agg_state、agg_union タイプの集約ロールアップをサポート。マテリアライズドビューは agg_state または agg_union として定義でき、クエリは特定の集約関数を使用するか、agg_merge を使用できます。詳細については、[AGG_STATE](../../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md)を参照してください

### その他

- 関数 `replace_empty` を追加。

	詳細については、[ドキュメント]../sql-manual/sql-functions/string-functions/replace_empty)を参照してください。

- `show storage policy using` ステートメントをサポート。

	詳細については、[ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY-USING)を参照してください。

- BE 側で JVM メトリクスをサポート。

  `be.conf` で `enable_jvm_monitor=true` を設定してこの機能を有効にします。

## 改善

- 中国語名の列に対する転置インデックスの作成をサポート。[#36321](https://github.com/apache/doris/pull/36321)

- セグメントキャッシュによるメモリ消費をより正確に推定し、未使用メモリをより迅速に解放できるよう改善。[#35751](https://github.com/apache/doris/pull/35751)

- リモートストレージにテーブルをエクスポートする前に空のパーティションをフィルタリング。[#35542](https://github.com/apache/doris/pull/35542)

- Backend 間の負荷分散のためにルーチンロードタスク割り当てアルゴリズムを最適化。[#34778](https://github.com/apache/doris/pull/34778)

- set 操作中に関連する変数が見つからない場合のヒントを提供。[#35775](https://github.com/apache/doris/pull/35775)

- デフォルト読み込みのために FE の `custom_lib` ディレクトリに Java UDF jar ファイルを配置することをサポート。[#35984](https://github.com/apache/doris/pull/35984)

- 監査ログ読み込みジョブ用のタイムアウトグローバル変数 `audit_plugin_load_timeout` を追加。

- 非同期マテリアライズドビューの透過的リライト計画のパフォーマンスを最適化。

- ソースが空の場合に BE が実行されない `INSERT` 操作を最適化。[#34418](https://github.com/apache/doris/pull/34418)

- Hive/Hudi テーブルのファイルリストをバッチで取得することをサポート。120万ファイルのシナリオでは、ファイルリスト取得時間が390秒から46秒に短縮されました。[#35107](https://github.com/apache/doris/pull/35107)

- 非同期マテリアライズドビュー作成時の動的パーティショニングを禁止。

- Hive の外部テーブルの外部データのパーティションデータが非同期マテリアライズドビューと同期されているかどうかの検出をサポート。

- 非同期マテリアライズドビューのインデックス作成を許可。

## バグ修正

### クエリオプティマイザー

- パーティションを切り詰めた後に SQL キャッシュが古い結果を返す問題を修正。[#34698](https://github.com/apache/doris/pull/34698)

- JSON から他のタイプへのキャストが nullable 属性を正しく処理しない問題を修正。[#34707](https://github.com/apache/doris/pull/34707)

- 時折発生する DATETIMEV2 リテラル簡略化エラーを修正。[#35153](https://github.com/apache/doris/pull/35153)

- ウィンドウ関数で `COUNT(*)` を使用できない問題を修正。[#35220](https://github.com/apache/doris/pull/35220)

- `UNION ALL` 下のすべての `SELECT` ステートメントに `FROM` 句がない場合に nullable 属性が正しくない可能性がある問題を修正。[#35074](https://github.com/apache/doris/pull/35074)

- `bitmap in join` とサブクエリのネスト解除を同時に使用できない問題を修正。[#35435](https://github.com/apache/doris/pull/35435)

- 特定の状況でフィルター条件を CTE プロデューサーにプッシュダウンできないパフォーマンス問題を修正。[#35463](https://github.com/apache/doris/pull/35463)

- 大文字で書かれた集約コンビネータが見つからない問題を修正。[#35540](https://github.com/apache/doris/pull/35540)

- 列プルーニングによってウィンドウ関数が適切にプルーニングされないパフォーマンス問題を修正。[#35504](https://github.com/apache/doris/pull/35504)

- 同じ名前だが異なるデータベースの複数のテーブルがクエリに同時に現れた場合に、クエリが誤って解析され間違った結果につながる可能性がある問題を修正。[#35571](https://github.com/apache/doris/pull/35571)

- スキーマテーブルスキャン中のランタイムフィルター生成によって引き起こされるクエリエラーを修正。[#35655](https://github.com/apache/doris/pull/35655)

- 結合条件が null リテラルに折り畳まれることで、ネストされた相関サブクエリが実行できない問題を修正。[#35811](https://github.com/apache/doris/pull/35811)

- 計画中に decimal リテラルが誤った精度で設定される時折の問題を修正。[#36055](https://github.com/apache/doris/pull/36055)

- 計画中に複数層の集約が誤ってマージされる時折の問題を修正。[#36145](https://github.com/apache/doris/pull/36145)

- 集約展開計画後に入出力不一致エラーが発生する時折の問題を修正。[#36207](https://github.com/apache/doris/pull/36207)

- `<=>` が誤って `=` に変換される時折の問題を修正。[#36521](https://github.com/apache/doris/pull/36521)

### クエリ実行

- パイプラインエンジンで制限行数に達した場合にクエリがハングし、メモリが解放されない問題を修正。[#35746](https://github.com/apache/doris/pull/35746)

- `enable_decimal256` が true だが古いプランナーにフォールバックする場合の BE コアダンプを修正。[#35731](https://github.com/apache/doris/pull/35731)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビュービルドで指定された store_row_column 属性がコアに認識されない問題を修正。

- 非同期マテリアライズドビュービルドで storage_medium の指定が有効にならない問題を修正。

- ベーステーブル削除後の非同期マテリアライズドビュー show partitions でエラーが発生する問題を解決。

- 非同期マテリアライズドビューがバックアップおよびリストア例外を引き起こす問題を修正。[#35703](https://github.com/apache/doris/pull/35703)

- パーティションリライトが誤った結果につながる可能性がある問題を修正。[#35236](https://github.com/apache/doris/pull/35236)

### 半構造化

- 空キーを持つ VARIANT を使用した場合のコアダンプ問題を修正。[#35671](https://github.com/apache/doris/pull/35671)
- Bitmap および BloomFilter インデックスは軽量インデックス変更を実行すべきでない。[#35225](https://github.com/apache/doris/pull/35225)

### プライマリキー

- インポート中の部分列更新の場合に例外的な BE 再起動が発生し、重複キーが生じる可能性がある問題を修正。[#35678](https://github.com/apache/doris/pull/35678)

- メモリ不足時のクローン操作中に BE がコアダンプする可能性がある問題を修正。[#34702](https://github.com/apache/doris/pull/34702)

### データレイクハウス

- `ctl.db.tbl` などの完全修飾名で Hive テーブルを作成できない問題を修正 [#34984](https://github.com/apache/doris/pull/34984)

- リフレッシュ時に Hive metastore 接続が閉じられない問題を修正 [#35426](https://github.com/apache/doris/pull/35426)

- 2.0.x から 2.1.x にアップグレードする際の潜在的なメタリプレイ問題を修正。[#35532](https://github.com/apache/doris/pull/35532)

- Table Valued Function が空の snappy 圧縮ファイルを読み取れない問題を修正。[#34926](https://github.com/apache/doris/pull/34926)

- 無効な min-max 列統計を持つ Parquet ファイルを読み取れない問題を修正 [#35041](https://github.com/apache/doris/pull/35041)

- Parquet/ORC リーダーで null-aware 関数を含むプッシュダウン述語を処理できない問題を修正 [#35335](https://github.com/apache/doris/pull/35335)

- Hive テーブル作成時のパーティション列の順序に関する問題を修正 [#35347](https://github.com/apache/doris/pull/35347)

- パーティション値にスペースが含まれている場合に S3 上の Hive テーブルへの書き込みが失敗する問題を修正 [#35645](https://github.com/apache/doris/pull/35645)

- Aliyun OSS エンドポイントの誤ったスキームに関する問題を修正 [#34907](https://github.com/apache/doris/pull/34907)

- Doris によって書き込まれた Parquet 形式の Hive テーブルを Hive が読み取れない問題を修正 [#34981](https://github.com/apache/doris/pull/34981)

- Hive テーブルのスキーマ変更後に ORC ファイルを読み取れない問題を修正 [#35583](https://github.com/apache/doris/pull/35583)

- Paimon テーブルのスキーマ変更後に JNI 経由で Paimon テーブルを読み取れない問題を修正 [#35309](https://github.com/apache/doris/pull/35309)

- 書き出される Parquet 形式ファイルの Row Groups が小さすぎる問題を修正。[#36042](https://github.com/apache/doris/pull/36042) [#36143](https://github.com/apache/doris/pull/36143)

- スキーマ変更後に Paimon テーブルを読み取れない問題を修正 [#36049](https://github.com/apache/doris/pull/36049)

- スキーマ変更後に Hive Parquet 形式テーブルを読み取れない問題を修正 [#36182](https://github.com/apache/doris/pull/36182)

- Hadoop FS キャッシュによって引き起こされる FE OOM 問題を修正 [#36403](https://github.com/apache/doris/pull/36403)

- Hive Metastore Listener を有効にした後に FE が開始できない問題を修正 [#36533](https://github.com/apache/doris/pull/36533)

- 大量のファイルによるクエリパフォーマンス低下の問題を修正 [#36431](https://github.com/apache/doris/pull/36431)

- Iceberg のタイムスタンプ列タイプを読み取る際のタイムゾーン問題を修正 [#36435](https://github.com/apache/doris/pull/36435)

- Iceberg Table での DATETIME 変換エラーとデータパスエラーを修正。[#35708](https://github.com/apache/doris/pull/35708)

- Table Valued Functions の追加のユーザー定義プロパティを S3 SDK に保持して渡すことをサポート。[#35515](https://github.com/apache/doris/pull/35515)

### データインポート

- `CANCEL LOAD` が機能しない問題を修正 [#35352](https://github.com/apache/doris/pull/35352)

- ロードトランザクションの Publish フェーズでの null ポインターエラーがロード完了を妨げる問題を修正 [#35977](https://github.com/apache/doris/pull/35977)

- HTTP 経由で送信される大きなデータファイルを bRPC がシリアライズする際の問題を修正 [#36169](https://github.com/apache/doris/pull/36169)

### データ管理

- DDL または DML をマスター FE に転送した後に ConnectionContext のリソースタグが設定されない問題を修正。[#35618](https://github.com/apache/doris/pull/35618)

- `lower_case_table_names` が有効な場合にリストアされたテーブル名が正しくない問題を修正 [#35508](https://github.com/apache/doris/pull/35508)

- `admin clean trash` が機能しない問題を修正 [#35271](https://github.com/apache/doris/pull/35271)

- パーティションからストレージポリシーを削除できない問題を修正 [#35874](https://github.com/apache/doris/pull/35874)

- マルチレプリカ自動パーティションテーブルへのインポート時のデータ損失問題を修正 [#36586](https://github.com/apache/doris/pull/36586)

- 古いオプティマイザーを使用して自動パーティションテーブルをクエリまたは挿入する際にテーブルのパーティション列が変更される問題を修正 [#36514](https://github.com/apache/doris/pull/36514)

### メモリ管理

- Cgroup meminfo の取得失敗により頻繁にログエラーが発生する問題を修正。[#35425](https://github.com/apache/doris/pull/35425)

- BloomFilter 使用時にセグメントキャッシュサイズが制御されず、異常なプロセスメモリ増加につながる問題を修正。[#34871](https://github.com/apache/doris/pull/34871)

### 権限

- 大文字小文字を区別しないテーブル名を有効にした後に権限設定が無効になる問題を修正。[#36557](https://github.com/apache/doris/pull/36557)

- 非マスター FE ノード経由での LDAP パスワード設定が有効にならない問題を修正。[#36598](https://github.com/apache/doris/pull/36598)

- `SELECT COUNT(*)` ステートメントに対して認可をチェックできない問題を修正。[#35465](https://github.com/apache/doris/pull/35465)

### その他

- MySQL 接続が切断された場合にクライアント JDBC プログラムが接続を閉じることができない問題を修正。[#36616](https://github.com/apache/doris/pull/36616)

- `SHOW PROCEDURE STATUS` ステートメントでの MySQL プロトコル互換性問題を修正。[#35350](https://github.com/apache/doris/pull/35350)

- `libevent` が特定の状況での接続リーク問題を解決するため、Keepalive を強制するようになりました。[#36088](https://github.com/apache/doris/pull/36088)

## クレジット

このリリースに貢献していただいたすべての方々に感謝いたします。

@airborne12, @amorynan, @AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @caiconghui, @CalvinKirs, @cambyzju, @catpineapple, @cjj2010, @csun5285, @DarvenDuan, @dataroaring, @deardeng, @Doris-Extras, @eldenmoon, @englefly, @feiniaofeiafei, @felixwluo, @freemandealer, @Gabriel39, @gavinchou, @GoGoWen, @HappenLee, @hello-stephen, @hubgeter, @hust-hhb, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @lide-reed, @luennng, @luwei16, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @mymeiyi, @nextdreamblue, @platoneko, @qidaye, @qzsee, @seawinde, @shuke987, @sollhui, @starocean999, @suxiaogang223, @TangSiyang2001, @Thearas, @Vallishp, @w41ter, @wangbo, @whutpencil, @wsjz, @wuwenchi, @xiaokang, @xiedeyantu, @XieJiann, @xinyiZzz, @XuPengfei-1020, @xy720, @xzj7019, @yiguolei, @yongjinhou, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zfr9527, @zgxme, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
