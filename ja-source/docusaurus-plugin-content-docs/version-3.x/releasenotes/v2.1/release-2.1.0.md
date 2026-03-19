---
{
  "title": "リリース 2.1.0",
  "language": "ja",
  "description": "コミュニティの皆様、3月8日よりダウンロードおよび使用可能となったApache Doris 2.1.0の正式リリースをお知らせできることを嬉しく思います。"
}
---
コミュニティの皆様、Apache Doris 2.1.0の正式リリースをお知らせいたします。3月8日よりダウンロードおよびご利用いただけます。この最新バージョンは、特に大規模で複雑なデータセットの処理において、データ分析機能の向上に向けた重要なマイルストーンとなります。

Doris 2.1.0では、分析性能の最適化に重点を置いており、その結果は明らかです。TPC-DS 1TBテストデータセットにおいて100%を超える印象的な性能向上を実現し、Apache Dorisを実世界のビジネスシナリオにより対応可能にしました。

- **クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 性能向上

### より賢いoptimizer

V2.0をベースに、Doris V2.1のクエリoptimizerは、統計ベースの推論と列挙フレームワークが強化されています。コストモデルをアップグレードし、最適化ルールを拡張してより多くのユースケースのニーズに対応しました。

### より良いheuristic optimization

大規模データ分析やデータレイクシナリオにおいて、Doris V2.1はより良いheuristicクエリプランを提供します。同時に、RuntimeFilterはより自己適応的になり、統計情報なしでもより高い性能を実現できます。

### Parallel adaptive scan

Doris V2.1はparallel adaptive scanを採用してscan I/Oを最適化し、クエリ性能を向上させました。不適切なバケット数の悪影響を回避できます。（この機能は現在Duplicate KeyモデルとMerge-on-Write Unique Keyモデルで利用可能です。）

### Local shuffle

不均等なデータ分散を防ぐためLocal Shuffleを導入しました。ベンチマークテストでは、Local ShuffleとParallel Adaptive Scanの組み合わせにより、テーブル作成時の不適切なバケット数設定にもかかわらず、高速なクエリ性能を保証できることが示されています。

### より高速なINSERT INTO SELECT

ETLで頻繁に使用されるINSERT INTO SELECTの性能をさらに向上させるため、MemTableの実行を前進させてデータ取り込みのオーバーヘッドを削減しました。テストでは、ほとんどのケースでV2.0と比較してデータ取り込み速度が2倍になることが示されています。
データレイク分析機能の向上

## データレイク分析性能

### TPC-DSベンチマーク

Doris V2.1とTrinoのTPC-DSベンチマークテスト（1TB）によると、

- キャッシュなしで、Dorisの総実行時間はTrino V435の56%です（717s VS 1296s）
- ファイルキャッシュを有効にすることで、Dorisの全体的な性能をさらに2.2倍向上させることができます（323s）
  これは、I/O、parquet/ORCファイル読み取り、predicate pushdown、キャッシュ、scanタスクスケジューリングなどの一連の最適化により実現されています。


### Arrow Flight SQLプロトコル

MySQL 8.0プロトコルと互換性のあるカラム指向データベースとして、Doris V2.1は現在Arrow Flight SQLプロトコルもサポートしており、ユーザーはデータのシリアライゼーションとデシリアライゼーションなしにPandas/Numpy経由でDorisデータに高速アクセスできます。最も一般的なデータ型に対して、Arrow FlightプロトコルはMySQLプロトコルより数十倍高速な性能を実現します。

## 非同期materialized view

V2.1では複数のテーブルに基づくmaterialized viewの作成が可能です。この機能は現在以下をサポートしています：

- 透明な書き換え: Select、Where、Join、Group By、Aggregationを含む一般的な演算子の透明な書き換えをサポート。
- 自動リフレッシュ: 定期リフレッシュ、手動リフレッシュ、完全リフレッシュ、増分リフレッシュ、パーティションベースのリフレッシュをサポート。
- 外部テーブルのmaterialized view: Hive、Hudi、Icebergなどの外部データテーブルに基づくmaterialized viewをサポート。materialized view経由でデータレイクからDoris内部テーブルへのデータ同期をサポート。
- materialized viewの直接クエリ: materialized viewはETL後の結果セットと見なすことができます。この意味で、materialized viewはデータテーブルであり、ユーザーは直接クエリを実行できます。

## ストレージの強化

### 自動増分列

V2.1は自動増分列をサポートし、各行のデータ一意性を保証できます。これは効率的な辞書エンコーディングとクエリページネーションの基盤となります。例えば、正確なUV計算や顧客グルーピングにおいて、ユーザーはDorisでbitmapタイプを適用することが多く、このプロセスには辞書エンコーディングが必要です。V2.1では、ユーザーはまず自動増分列を使用して辞書テーブルを作成し、その後ユーザーデータを単純にロードできます。

### 自動パーティション

運用保守の負担をさらに軽減するため、V2.1では自動データパーティショニングが可能です。データ取り込み時に、パーティション列に基づいてデータのパーティションが存在するかを検出します。存在しない場合、自動的に作成してデータ取り込みを開始します。

### 高並行性リアルタイムデータ取り込み

データ書き込みにおいて、過剰なデータバージョンを回避し、データバージョンマージによるリソース消費を削減するため、バックプレッシャーメカニズムを導入しました。さらに、V2.1はgroup commit（[詳細を読む](../../data-operate/import/group-commit-manual)）をサポートしており、これは複数の書き込みを蓄積して一つとしてコミットすることを意味します。JDBCインジェストとStream Loadメソッドを使用したgroup commitのベンチマークテストでは優れた結果を示しています。

## 半構造化データ分析

### 新しいデータ型：Variant

V2.1はVariantという新しいデータ型をサポートしています。これは、JSONなどの半構造化データや、整数、文字列、ブール値などを含む複合データ型を格納できます。ユーザーはテーブルスキーマでVariant列の正確なデータ型を事前定義する必要がありません。Variantタイプはネストされたデータ構造の処理に便利です。
同じテーブルにVariant列と事前定義されたデータ型を持つ静的列を含めることができます。これにより、ストレージとクエリにおいてより柔軟性が提供されます。
ClickBenchデータセットでのテストでは、Variant列のデータは静的列のデータと同じストレージ領域を占有し、JSON形式の半分であることが証明されています。クエリ性能では、Variantタイプはホットランでは JSONより8倍高速で、コールドランではさらに高速です。

### IPタイプ

Doris V2.1はIPv4とIPv6のネイティブサポートを提供します。IPデータをバイナリ形式で保存し、プレーンテキストでのIP文字列と比較してストレージ領域の使用量を60%削減します。これらのIPタイプとともに、IPデータ処理用の20以上の関数を追加しました。

### 複合データ型のためのより強力な関数

- explode_map: Mapデータ型の行から列への展開をサポート。
- INプレディケートでのSTRUCTデータ型をサポート

## ワークロード管理

### リソースのハード分離

ワークロードグループが使用できるリソースにソフト制限を課すWorkload Groupメカニズムをベースに、Doris 2.1はワークロードグループのCPUリソース消費にハード制限を導入し、クエリ性能のより高い安定性を確保します。

### TopSQL

V2.1では、ユーザーは実行時に最もリソースを消費するSQLクエリを確認できます。これは、予期しない大きなクエリによって引き起こされるクラスター負荷スパイクの処理において大きな助けとなります。


## その他

### Decimal 256

金融セクターや高級製造業のユーザーに対して、V2.1は高精度データ型：Decimalをサポートし、最大76桁の有効数字をサポートします（実験的機能、enable_decimal256=trueに設定してください）。

### Jobスケジューラー

V2.1は定期タスクスケジューリングに良いオプションを提供します：Doris Job Scheduler。スケジュールまたは固定間隔で事前定義された操作をトリガーできます。Doris Job Schedulerは秒単位で正確です。データ書き込みの一貫性保証、高効率と柔軟性、高性能処理キュー、追跡可能なスケジューリング記録、ジョブの高可用性を提供します。

### 新バージョンを体験するためのDocker高速起動をサポート

バージョン2.1.0から、新バージョンのDorisを体験するために1FE、1BEのDockerコンテナを迅速に作成することをサポートする別のDocker Imageを提供します。コンテナはデフォルトでFEとBEの初期化、BE登録などのステップを完了します。コンテナ作成後、約1 [minute.In](http://minute.in/)でDorisクラスターに直接アクセスして使用できます。このイメージバージョンでは、デフォルトの`max_map_count`、`ulimit`、`Swap`などのハード制限が削除されています。X64（avx2）マシンとARMマシンでのデプロイメントをサポートします。デフォルトの開放ポートは8000、8030、8040、9030です。Brokerコンポーネントを体験する必要がある場合、起動時に環境変数`--env BROKER=true`を追加してBrokerプロセスを同期的に開始できます。起動後、自動的に登録を完了します。Broker名は`test`です。

このバージョンはクイック体験と機能テストにのみ適しており、本番環境には適していないことにご注意ください！

## 動作変更

- デフォルトのデータモデルはMerge-on-Write Unique Keyモデルです。Unique Keyモデルでテーブルが作成される際、enable_unique_key_merge_on_writeがデフォルト設定として含まれます。
- inverted indexがbitmap indexより高性能であることが証明されたため、V2.1はbitmap indexのサポートを停止します。既存のbitmap indexは有効のままですが、新規作成は許可されません。将来的にbitmap index関連のコードを削除する予定です。
- cpu_resource_limitはサポートされなくなりました。これはDoris BEのscannerスレッド数に制限を設けるものです。workload groupメカニズムもそのような設定をサポートするため、すでに設定されたcpu_resource_limitは無効になります。
- enable_segcompactionのデフォルト値はtrueです。これは、Dorisが同じrowset内の複数のsegmentのcompactionをサポートすることを意味します。
- 監査ログプラグイン
  - V2.1.0以降、Dorisには内蔵の監査ログプラグインがあります。ユーザーはenable_audit_pluginパラメータの設定により、単純に有効または無効にできます。
  - 独自の監査ログプラグインをすでにインストールしている場合、Doris V2.1にアップグレード後も引き続き使用するか、アンインストールしてDorisのプラグインを使用できます。プラグイン切り替え後、監査ログテーブルが再配置されることにご注意ください。
  - 詳細については、[docs](../../admin-manual/audit-plugin)をご覧ください。


## クレジット
このリリースに貢献したすべての方に感謝いたします：

467887319, 924060929, acnot, airborne12, AKIRA, alan_rodriguez, AlexYue, allenhooo, amory, amory, AshinGau, beat4ocean, BePPPower, bigben0204, bingquanzhao, BirdAmosBird, BiteTheDDDDt, bobhan1, caiconghui, camby, camby, CanGuan, caoliang-web, catpineapple, Centurybbx, chen, ChengDaqi2023, ChenyangSunChenyang, Chester, ChinaYiGuan, ChouGavinChou, chunping, colagy, CSTGluigi, czzmmc, daidai, dalong, dataroaring, DeadlineFen, DeadlineFen, deadlinefen, deardeng, didiaode18, DongLiang-0, dong-shuai, Doris-Extras, Dragonliu2018, DrogonJackDrogon, DuanXujianDuan, DuRipeng, dutyu, echo-dundun, ElvinWei, englefly, Euporia, feelshana, feifeifeimoon, feiniaofeiafei, felixwluo, figurant, flynn, fornaix, FreeOnePlus, Gabriel39, gitccl, gnehil, GoGoWen, gohalo, guardcrystal, hammer, HappenLee, HB, hechao, HelgeLarsHelge, herry2038, HeZhangJianHe, HHoflittlefish777, HonestManXin, hongkun-Shao, HowardQin, hqx871, httpshirley, htyoung, huanghaibin, HuJerryHu, HuZhiyuHu, Hyman-zhao, i78086, irenesrl, ixzc, jacktengg, jacktengg, jackwener, jayhua, Jeffrey, jiafeng.zhang, Jibing-Li, JingDas, julic20s, kaijchen, kaka11chen, KassieZ, kindred77, KirsCalvinKirs, KirsCalvinKirs, kkop, koarz, LemonLiTree, LHG41278, liaoxin01, LiBinfeng-01, LiChuangLi, LiDongyangLi, Lightman, lihangyu, lihuigang, LingAdonisLing, liugddx, LiuGuangdongLiu, LiuHongLiu, liuJiwenliu, LiuLijiaLiu, lsy3993, LuGuangmingLu, LuoMetaLuo, luozenglin, Luwei, Luzhijing, lxliyou001, Ma1oneZhang, mch_ucchi, Miaohongkai, morningman, morrySnow, Mryange, mymeiyi, nanfeng, nanfeng, Nitin-Kashyap, PaiVallishPai, Petrichor, plat1ko, py023, q763562998, qidaye, QiHouliangQi, ranxiang327, realize096, rohitrs1983, sdhzwc, seawinde, seuhezhiqiang, seuhezhiqiang, shee, shuke987, shysnow, songguangfan, Stalary, starocean999, SunChenyangSun, sunny, SWJTU-ZhangLei, TangSiyang2001, Tanya-W, taoxutao, Uniqueyou, vhwzIs, walter, walter, wangbo, Wanghuan, wangqt, wangtao, wangtianyi2004, wenluowen, whuxingying, wsjz, wudi, wudongliang, wuwenchihdu, wyx123654, xiangran0327, Xiaocc, XiaoChangmingXiao, xiaokang, XieJiann, Xinxing, xiongjx, xuefengze, xueweizhang, XueYuhai, XuJianxu, xuke-hat, xy, xy720, xyfsjq, xzj7019, yagagagaga, yangshijie, YangYAN, yiguolei, yiguolei, yimeng, YinShaowenYin, Yoko, yongjinhou, ytwp, yuanyuan8983, yujian, yujun777, Yukang-Lian, Yulei-Yang, yuxuan-luo, zclllyybb, ZenoYang, zfr95, zgxme, zhangdong, zhangguoqiang, zhangstar333, zhangstar333, zhangy5, ZhangYu0123, zhannngchen, ZhaoLongZhao, zhaoshuo, zhengyu, zhiqqqq, ZhongJinHacker, ZhuArmandoZhu, zlw5307, ZouXinyiZou, zxealous, zy-kkk, zzwwhh, zzzxl1993, zzzzzzzs
