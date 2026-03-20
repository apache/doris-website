---
{
  "title": "リリース 1.2.0",
  "language": "ja",
  "description": "標準的なssb-100-flatベンチマークにおいて、1.2のパフォーマンスは1.1よりも2倍高速であり、複雑なTPCH 100ベンチマークにおいて、"
}
---
# Feature
## Highlight

1. 完全なVectorizied-Engineサポート、パフォーマンスが大幅に向上

	標準的なssb-100-flatベンチマークにおいて、1.2のパフォーマンスは1.1の2倍高速です。複雑なTPCH 100ベンチマークにおいて、1.2のパフォーマンスは1.1の3倍高速です。

2. Merge-on-Write Unique Key

	Unique Key ModelでのMerge-On-Writeをサポートします。このモードは、データの書き込み時に削除または更新が必要なデータをマークすることで、クエリ時のMerge-On-Readのオーバーヘッドを回避し、更新可能なデータモデルでの読み取り効率を大幅に向上させます。

3. Multi カタログ

	multi-catalog機能は、外部データソースに迅速にアクセスする能力をDorisに提供します。ユーザーは`CREATE CATALOG`コマンドを通じて外部データソースに接続できます。Dorisは外部データソースのライブラリとテーブル情報を自動的にマッピングします。その後、ユーザーは通常のテーブルにアクセスするのと同じように、これらの外部データソースのデータにアクセスできます。ユーザーが各テーブルに対して手動で外部マッピングを確立する必要がある複雑な操作を回避できます。
    
    現在この機能は以下のデータソースをサポートしています：
    
    1. Hive Metastore: Hive、Iceberg、Hudiを含むデータテーブルにアクセスできます。Alibaba CloudのDataLake FormationなどのHive Metastore互換のデータソースにも接続できます。HDFSとオブジェクトストレージ両方でのデータアクセスをサポートします。
    2. Elasticsearch: ESデータソースにアクセスします。
    3. JDBC: JDBCプロトコルを通じてMySQLにアクセスします。
    
    ドキュメント: https://doris.apache.org//docs/dev/lakehouse/multi-catalog)

    > 注意：対応する権限レベルも自動的に変更されます。詳細は「アップグレード注意事項」セクションをご覧ください。
    
4. 軽量なテーブル構造変更

新しいバージョンでは、データテーブルの列の追加と削除操作において、データファイルを同期的に変更する必要がなくなり、FEのメタデータを更新するだけで済むため、ミリ秒レベルのSchema Change操作を実現しています。この機能により、上流CDCデータのDDL同期機能を実現できます。例えば、ユーザーはFlink CDCを使用して上流データベースからDorisへのDMLとDDL同期を実現できます。

ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

テーブル作成時に、propertiesで`"light_schema_change"="true"`を設定します。

5. JDBC facade

	ユーザーはJDBCを通じて外部データソースに接続できます。現在サポートしているもの：

	  - MySQL
	  - PostgreSQL
	  - Oracle
	  - SQL サーバー
	  - Clickhouse

	ドキュメント: [https://doris.apache.org/en/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/)

	> 注意：ODBC機能は後のバージョンで削除される予定です。JDBCへの切り替えを試してください。

6. JAVA UDF

	JavaでUDF/UDAFの記述をサポートし、ユーザーがJavaエコシステムでカスタム関数を使用することが便利になります。同時に、オフヒープメモリやZero Copyなどの技術により、言語間でのデータアクセス効率が大幅に向上しました。

	ドキュメント: https://doris.apache.org//docs/dev/ecosystem/udf/java-user-defined-function

	例: https://github.com/apache/doris/tree/master/samples/doris-demo
	
7. Remote UDF

	RPCを通じてリモートユーザー定義関数サービスへのアクセスをサポートし、ユーザーがUDFを記述する際の言語制限を完全に排除します。ユーザーは任意のプログラミング言語を使用してカスタム関数を実装し、複雑なデータ分析作業を完了できます。

	ドキュメント: https://doris.apache.org//docs/ecosystem/udf/remote-user-defined-function

	例: https://github.com/apache/doris/tree/master/samples/doris-demo
        
8. より多くのデータ型のサポート

	- Array型

		Array型をサポートしています。ネストされたarray型もサポートしています。ユーザープロファイルやタグなどの一部のシナリオでは、Array型を使用してビジネスシナリオにより良く適応できます。同時に、新しいバージョンでは、データ関連の多数の関数も実装し、実際のシナリオでのデータ型の応用をより良くサポートしています。

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/ARRAY

	関連関数: https://doris.apache.org//docs/dev/sql-manual/sql-functions/array-functions/array_max
        
	- Jsonb型

		バイナリJsonデータ型：Jsonbをサポートします。この型はより compact なjsonエンコード形式を提供し、同時にエンコード形式でのデータアクセスを提供します。文字列に格納されたjsonデータと比較して、数倍新しく、改善することができます。

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/JSONB

	関連関数: https://doris.apache.org//docs/dev/sql-manual/sql-functions/json-functions/jsonb_parse
          
	- Date V2
	
		影響範囲：

		1. ユーザーはテーブル作成時にdatev2とdatetimev2を指定する必要があり、元のテーブルのdateとdatetimeは影響を受けません。
		2. datev2とdatetimev2が元のdateとdatetimeと計算される場合（例：等価結合）、元の型が新しい型にキャストされて計算されます
		3. 例はドキュメントにあります

		ドキュメント: https://doris.apache.org/docs/1.2/sql-manual/sql-reference/Data-Types/DATEV2
	 
	 
## その他

1. 新しいメモリ管理フレームワーク

	ドキュメント: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/memory-management/memory-tracker

2. table Valued Function

	Dorisはtable Valued Function (TVF) のセットを実装しています。TVFは通常のテーブルと見なすことができ、SQLで「テーブル」が出現できるすべての場所に出現できます。

	例えば、S3 TVFを使用してオブジェクトストレージでのデータインポートを実装できます：

	```
	insert into tbl select * from s3("s3://bucket/file.*", "ak" = "xx", "sk" = "xxx") where c1 > 2;
	```
または、HDFS上のデータファイルを直接クエリする:

	```
	insert into tbl select * from hdfs("hdfs://bucket/file.*") where c1 > 2;
	```
TVFは、ユーザーがSQLの豊富な表現力を最大限に活用し、さまざまなデータを柔軟に処理することを支援できます。

    ドキュメント:
    
    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/s3
    
    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/hdfs
        
3. より便利なパーティション作成方法

	`FROM TO`コマンドを使用した時間範囲内での複数パーティション作成をサポートします。

4. カラムの名前変更

	Light Schema Changeが有効になっているテーブルで、カラムの名前変更をサポートします。

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-RENAME
	
5. より豊富な権限管理

	- 行レベル権限をサポート
	
		行レベル権限は`CREATE ROW POLICY`コマンドで作成できます。
	
		ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY
	
	- パスワード強度、有効期限などの指定をサポート。
	
	- 複数回のログイン失敗後のアカウントロックをサポート。
	
		ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Account-Management-Statements/ALTER-USER

6. インポート

	- CSVインポートでヘッダー付きcsvファイルをサポート。
	
		ドキュメント内で`csv_with_names`を検索してください: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD/
	
	- Stream Loadに`hidden_columns`を追加し、削除フラグカラムとsequenceカラムを明示的に指定可能。
	
		ドキュメント内で`hidden_columns`を検索してください: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD
	
	- Spark LoadでParquetとORCファイルのインポートをサポート。
	
	- 完了したインポートLabelのクリーニングをサポート
	  
	  ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CLEAN-LABEL
	
	- ステータス別でのインポートジョブの一括キャンセルをサポート
	
		ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CANCEL-LOAD
	
	- broker loadでAlibaba Cloud oss、Tencent Cloud cos/chdfs、Huawei Cloud obsのサポートを追加。
		
		ドキュメント: https://doris.apache.org//docs/dev/advanced/broker
	
	- hive-site.xmlファイル設定によるhdfsへのアクセスをサポート。
	
		ドキュメント: https://doris.apache.org//docs/dev/admin-manual/config/config-dir

7. `SHOW CATALOG RECYCLE BIN`機能によるcatalogゴミ箱の内容表示をサポート。

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Show-Statements/SHOW-CATALOG-RECYCLE-BIN

8. `SELECT * EXCEPT`構文をサポート。

	ドキュメント: https://doris.apache.org//docs/dev/data-table/basic-usage

9. OUTFILEでORC形式のエクスポートをサポート。また、マルチバイトデリミタをサポート。
    
	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/OUTFILE

10. 設定を通じて保存可能なQuery Profileの数の変更をサポート。

	ドキュメントでFE設定項目を検索: max_query_profile_num
	
11. DELETE文でIN述語条件をサポート。また、パーティションプルーニングをサポート。

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/DELETE

12. timeカラムのデフォルト値で`CURRENT_TIMESTAMP`の使用をサポート

	ドキュメント内で「CURRENT_TIMESTAMP」を検索してください: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

13. 2つのシステムテーブルを追加: backends、rowsets

	ドキュメント:

	https://doris.apache.org//docs/dev/admin-manual/system-table/backends

	https://doris.apache.org//docs/dev/admin-manual/system-table/rowsets

14. バックアップと復元

	- Restoreジョブで`reserve_replica`パラメータをサポートし、復元されるテーブルのレプリカ数をバックアップと同じにできます。
	
	- Restoreジョブで`reserve_dynamic_partition_enable`パラメータをサポートし、復元されるテーブルで動的パーティションの有効化を維持できます。
	
	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/RESTORE
	
	- 組み込みlibhdfsを通じたバックアップと復元操作をサポートし、brokerへの依存を除去。
	
	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/CREATE-REPOSITORY

15. 同一マシン上の複数ディスク間でのデータバランスをサポート

	ドキュメント:
	
	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-REBALANCE-DISK
	
	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-CANCEL-REBALANCE-DISK

16. Routine LoadでKerberos認証されたKafkaサービスへのサブスクライブをサポート。

	ドキュメント内でkerberosを検索してください: https://doris.apache.org//docs/dev/data-operate/import/import-way/routine-load-manual

17. 新しいbuilt-in-function

	以下の組み込み関数を追加:
	
	- `cbrt`
	- `sequence_match/sequence_count`
	- `mask/mask_first_n/mask_last_n`
	- `elt`
	- `any/any_value`
	- `group_bitmap_xor`
	- `ntile`
	- `nvl`
	- `uuid`
	- `initcap`
	- `regexp_replace_one/regexp_extract_all`
	- `multi_search_all_positions/multi_match_any`
	- `domain/domain_without_www/protocol`
	- `running_difference`
	- `bitmap_hash64`
	- `murmur_hash3_64`
	- `to_monday`
	- `not_null_or_empty`
	- `window_funnel`
	- `group_bit_and/group_bit_or/group_bit_xor`
	- `outer combine`
	- および全てのarray関数

# アップグレード注意事項

## 既知の問題

- JDK11を使用するとBEクラッシュが発生するため、代わりにJDK8を使用してください。

## 動作変更

- 権限レベルの変更

	catalogレベルが導入されたため、対応するユーザー権限レベルも自動的に変更されます。ルールは以下の通りです:
	
	- GlobalPrivsとResourcePrivsは変更なし
	- CatalogPrivsレベルを追加。
	- 元のDatabasePrivsレベルにinternalプレフィックスを追加（internalカタログ内のdbを示す）
	- 元のTablePrivsレベルにinternalプレフィックスを追加（internalカタログ内のtblを表す）

- GroupByとHaving句で、エイリアスよりもカラム名を優先してマッチング。(#14408)

- `mv_`で始まるカラムの作成をサポートしなくなりました。`mv_`はマテリアライズドビューの予約キーワードです (#14361)

- order by文によって追加されるデフォルトの65535行の制限を削除し、この制限を設定するためのセッション変数`default_order_by_limit`を追加しました。(#12478)

- 「Create table As Select」によって生成されるテーブルでは、すべてのstringカラムがstring型を統一して使用し、varchar/char/stringの区別をしなくなりました (#14382)

- 監査ログで、dbとユーザー名の前の`default_cluster`という単語を削除。(#13499) (#11408)

- 監査ログにsql digestフィールドを追加 (#8919)

- union句は常にorder byロジックを変更します。新しいバージョンでは、括弧で明示的に関連付けない限り、order by句はunionの実行後に実行されます。(#9745)

- decommission操作中は、ゴミ箱内のタブレットが無視され、decommissionの完了が保証されます。(#14028)

- Decimalの返される結果は、元のカラムで宣言された精度、またはcast関数で指定された精度に従って表示されます。(#13437)

- カラム名の長さ制限を64から256に変更 (#14671)

- FE設定項目の変更

  - `enable_vectorized_load`パラメータがデフォルトで有効。(#11833)

  - `create_table_timeout`値を増加。テーブル作成操作のデフォルトタイムアウトが増加されます。(#13520)

  - `stream_load_default_timeout_second`のデフォルト値を3日に変更。

  - `alter_table_timeout_second`のデフォルト値を1ヶ月に変更。

  - パラメータ`max_replica_count_when_schema_change`を増加し、alterジョブに関与するレプリカ数を制限、デフォルトは100000。(#12850)

  - `disable_iceberg_hudi_table`を追加。icebergとhudiの外観はデフォルトで無効化され、multi catalog機能が推奨されます。(#13932)

- BE設定項目の変更

  - `disable_stream_load_2pc`パラメータを削除。2PCのstream loadが直接使用可能。(#13520)

  - `tablet_rowset_stale_sweep_time_sec`を1800秒から300秒に変更。

  - compactionに関する設定項目名を再設計 (#13495)

  - メモリ最適化に関するパラメータを見直し (#13781)

- セッション変数の変更

   - 変数`enable_insert_strict`をデフォルトでtrueに変更。これにより、以前実行できていたが不正な値を挿入するinsert操作の一部が実行されなくなります。(11866)

   - 変数`enable_local_exchange`をデフォルトでtrueに変更 (#13292)

   - デフォルトでlz4圧縮によるデータ転送、変数`fragment_transmission_compression_codec`で制御 (#11955)

   - uniqueまたはaggモデルデータのデバッグ用に`skip_storage_engine_merge`変数を追加 (#11952)
    
     ドキュメント: https://doris.apache.org//docs/dev/advanced/variables

- BE起動スクリプトは`/proc/sys/vm/max_map_count`を通じて値が200W以上かをチェックします。そうでなければ起動に失敗します。(#11052)

- mini loadインターフェースを削除 (#10520)

- FE Metadataバージョン

	FE Metaバージョンが107から114に変更され、アップグレード後はロールバックできません。
	
## アップグレード中

1. アップグレード準備
  
   - 置換が必要: libとbinディレクトリ（開始/停止スクリプトが変更されました）
  
   - BEもJAVA_HOMEの設定が必要で、既にJDBC tableとJava UDFをサポートしています。
  
   - fe.confのデフォルトJVM Xmxパラメータが8GBに変更されました。

2. アップグレード過程で起こり得るエラー
  
   - repeat関数が使用できずエラー報告: `vectorized repeat function cannot be executed`、アップグレード前にvectorized実行エンジンをオフにできます。(#13868)
  
   - schema changeが失敗しエラー: `desc_tbl is not set. Maybe the FE version is not equal to the BE` (#13822)
  
   - Vectorized hash joinが使用できずエラー報告。`vectorized hash join cannot be executed`。アップグレード前にvectorized実行エンジンをオフにできます。(#13753)

	上記のエラーは完全なアップグレード後に正常に戻ります。
	
## パフォーマンスへの影響

- デフォルトで、JeMallocが新バージョンBEのメモリアロケータとして使用され、TcMallocを置き換えます (#13367)

- tablet sinkのバッチサイズが最低8Kに変更されました。(#13912)

- chunk allocatorをデフォルトで無効化 (#13285)

## API変更

- BEのhttp apiエラー返り情報が`{"status": "Fail", "msg": "xxx"}`からより具体的な``{"status": "Not found", "msg": "Tablet not found. tablet_id=1202"}``に変更(#9771)

- `SHOW CREATE TABLE`で、commentの内容が二重引用符から一重引用符に変更 (#10327)

- 一般ユーザーがhttpコマンドを通じてquery profileを取得することをサポート。(#14016)
ドキュメント: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/manager/query-profile-action

- sequenceカラムを指定する方法を最適化し、カラム名を直接指定可能。(#13872)
ドキュメント: https://doris.apache.org//docs/dev/data-operate/update-delete/sequence-column-manual

- `show backends`と`show tablets`で返される結果にリモートストレージの容量使用量を増加 (#11450)

- Num-Based Compaction関連コードを削除 (#13409)

- BEのエラーコード機構をリファクタリング、返されるエラーメッセージの一部が変更されます (#8855)
その他

- Docker公式イメージをサポート。

- MacOS(x86/M1)とubuntu-22.04でのDorisコンパイルをサポート
  ドキュメント: https://doris.apache.org//docs/dev/install/source-install/compilation-mac/

- イメージファイル検証をサポート。

  ドキュメント: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/metadata-operation/

- スクリプト関連

  - FEとBEの停止スクリプトが`--grace`パラメータによるFEとBEの終了をサポート（kill -9シグナルの代わりにkill -15シグナルを使用）

  - FE起動スクリプトが--versionによる現在のFEバージョンの確認をサポート (#11563)

 - `ADMIN COPY TABLET`コマンドを通じて、タブレットのデータと関連するテーブル作成文を取得し、ローカル問題デバッグをサポート (#12176)

	ドキュメント: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-COPY-TABLET

- http apiを通じてSQL文に関連するテーブル作成文を取得し、ローカル問題再現をサポート (#11979)

	ドキュメント: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/query-schema-action

- テーブル作成時にこのテーブルのcompaction機能を閉じることをサポート、テスト用 (#11743)

	ドキュメント内で「disble_auto_compaction」を検索してください: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE
	
# 大いなる感謝

このリリースに貢献してくださった全ての方に感謝します！（アルファベット順）

```
@924060929
@a19920714liou
@adonis0147
@Aiden-Dong
@aiwenmo
@AshinGau
@b19mud
@BePPPower
@BiteTheDDDDt
@bridgeDream
@ByteYue
@caiconghui
@CalvinKirs
@cambyzju
@caoliang-web
@carlvinhust2012
@catpineapple
@ccoffline
@chenlinzhong
@chovy-3012
@coderjiang
@cxzl25
@dataalive
@dataroaring
@dependabot[bot]
@dinggege1024
@DongLiang-0
@Doris-Extras
@eldenmoon
@EmmyMiao87
@englefly
@FreeOnePlus
@Gabriel39
@gaodayue
@geniusjoe
@gj-zhang
@gnehil
@GoGoWen
@HappenLee
@hello-stephen
@Henry2SS
@hf200012
@huyuanfeng2018
@jacktengg
@jackwener
@jeffreys-cat
@Jibing-Li
@JNSimba
@Kikyou1997
@Lchangliang
@LemonLiTree
@lexoning
@liaoxin01
@lide-reed
@link3280
@liutang123
@liuyaolin
@LOVEGISER
@lsy3993
@luozenglin
@luzhijing
@madongz
@morningman
@morningman-cmy
@morrySnow
@mrhhsg
@Myasuka
@myfjdthink
@nextdreamblue
@pan3793
@pangzhili
@pengxiangyu
@platoneko
@qidaye
@qzsee
@SaintBacchus
@SeekingYang
@smallhibiscus
@sohardforaname
@song7788q
@spaces-X
@ssusieee
@stalary
@starocean999
@SWJTU-ZhangLei
@TaoZex
@timelxy
@Wahno
@wangbo
@wangshuo128
@wangyf0555
@weizhengte
@weizuo93
@wsjz
@wunan1210
@xhmz
@xiaokang
@xiaokangguo
@xinyiZzz
@xy720
@yangzhg
@Yankee24
@yeyudefeng
@yiguolei
@yinzhijian
@yixiutt
@yuanyuan8983
@zbtzbtzbt
@zenoyang
@zhangboya1
@zhangstar333
@zhannngchen
@ZHbamboo
@zhengshiJ
@zhenhb
@zhqu1148980644
@zuochunwei
@zy-kkk
```
