---
{
  "title": "リリース 2.1.0",
  "language": "ja",
  "description": "コミュニティの皆様、3月8日より、Apache Doris 2.1.0の正式リリースをお知らせいたします。ダウンロードしてご利用いただけます。"
}
---
コミュニティの皆様、Apache Doris 2.1.0の正式リリースをお知らせいたします。3月8日よりダウンロードしてご利用いただけます。この最新バージョンは、特に大規模で複雑なデータセットの処理において、データ分析機能の強化に向けた取り組みにおいて重要なマイルストーンとなります。

Doris 2.1.0では、分析パフォーマンスの最適化に主眼を置き、その成果は明らかです。TPC-DS 1TBテストデータセットで100%以上の優れたパフォーマンス向上を達成し、Apache Dorisが実際のビジネスシナリオにより対応できるようになりました。

- **クイックダウンロード:** https://doris.apache.org/download/

- **GitHub：** https://github.com/apache/doris/releases


## パフォーマンスの向上

### よりスマートなoptimizer

V2.0をベースに、Doris V2.1のクエリoptimizerは、統計ベースの推論および列挙フレームワークが強化されています。コストモデルをアップグレードし、最適化ルールを拡張して、より多くのユースケースのニーズに対応します。

### より良いヒューリスティック最適化

大規模なデータ分析やデータレイクシナリオにおいて、Doris V2.1はより良いヒューリスティッククエリプランを提供します。同時に、RuntimeFilterはより自己適応的になり、統計情報がなくてもより高いパフォーマンスを実現します。

### 並列適応スキャン

Doris V2.1は並列適応スキャンを採用してスキャンI/Oを最適化し、クエリパフォーマンスを向上させています。不適切なバケット数の負の影響を回避できます。（この機能は現在Duplicate KeyモデルおよびMerge-on-Write Unique Keyモデルで利用可能です。）

### Local shuffle

不均等なデータ分散を防ぐためにLocal Shuffleを導入しました。ベンチマークテストでは、Local ShuffleとParallel Adaptive Scanを組み合わせることで、テーブル作成時の不適切なバケット数設定にもかかわらず、高速なクエリパフォーマンスを保証できることが示されています。

### より高速なINSERT INTO SELECT

ETLで頻繁に使用される操作であるINSERT INTO SELECTのパフォーマンスをさらに向上させるため、MemTableの実行を前倒しして、データ取り込みのオーバーヘッドを削減しました。テストでは、ほとんどの場合でV2.0と比較してデータ取り込み速度が2倍になることが示されています。
データレイク分析機能の向上

## データレイク分析パフォーマンス

### TPC-DSベンチマーク

TrinoとのDoris V2.1のTPC-DSベンチマークテスト（1TB）によると、

- キャッシュを使用しない場合、DorisのTotal execution timeはTrino V435の56%です。（717s VS 1296s）
- file cacheを有効にすると、Dorisの全体的なパフォーマンスをさらに2.2倍向上させることができます。（323s）
  これは、I/O、parquet/ORCファイル読み取り、predicate pushdown、キャッシュ、スキャンタスクスケジューリングなどの一連の最適化によって実現されています。

 

### Arrow Flight SQLプロトコル

MySQL 8.0プロトコル互換のカラム型データベースとして、Doris V2.1はArrow Flight SQLプロトコルもサポートしており、ユーザーはデータのシリアライゼーションおよびデシリアライゼーションなしでPandas/Numpy経由でDorisデータに高速アクセスできます。最も一般的なデータタイプでは、Arrow FlightプロトコルはMySQLプロトコルより数十倍高速なパフォーマンスを実現します。

## 非同期materialized view

V2.1では複数のテーブルに基づいたmaterialized viewの作成が可能です。この機能は現在以下をサポートしています：

- 透過的リライト：Select、Where、Join、Group By、Aggregationなどの一般的な演算子の透過的リライトをサポートします。
- 自動更新：定期更新、手動更新、完全更新、増分更新、パーティションベース更新をサポートします。
- 外部テーブルのmaterialized view：Hive、Hudi、Icebergなどの外部データテーブルに基づくmaterialized viewをサポートし、materialized view経由でデータレイクからDoris内部テーブルへのデータ同期をサポートします。
- materialized viewでの直接クエリ：Materialized viewはETL後の結果セットとみなすことができます。この意味で、materialized viewはデータテーブルであるため、ユーザーは直接クエリを実行できます。

## 強化されたストレージ

### Auto-incrementカラム

V2.1はauto-incrementカラムをサポートし、各行のデータ一意性を保証できます。これは効率的な辞書エンコーディングとクエリページネーションの基盤となります。例えば、正確なUV計算や顧客グルーピングにおいて、ユーザーはしばしばDorisのbitmapタイプを適用しますが、このプロセスには辞書エンコーディングが必要です。V2.1では、ユーザーはまずauto-incrementカラムを使用して辞書テーブルを作成し、その後ユーザーデータを簡単にロードできます。

### 自動パーティション

運用・保守の負担をさらに軽減するため、V2.1では自動データパーティショニングが可能です。データ取り込み時に、パーティショニングカラムに基づいてデータのパーティションが存在するかを検出します。存在しない場合は、自動的にパーティションを作成し、データ取り込みを開始します。

### 高並行性リアルタイムデータ取り込み

データ書き込みについては、過度のデータバージョンを避けるためにback pressureメカニズムが設置されており、データバージョンマージによるリソース消費を削減します。さらに、V2.1はgroup commit（[詳細を読む](../../data-operate/import/group-commit-manual)）をサポートし、複数の書き込みを蓄積して1つとしてコミットします。JDBC取り込みとStream Loadメソッドを使用したgroup commitのベンチマークテストでは優れた結果が示されています。

## 半構造化データ分析

### 新しいデータタイプ：Variant

V2.1は、Variantという新しいデータタイプをサポートします。これは、JSONなどの半構造化データや、整数、文字列、ブール値などを含む複合データタイプに対応できます。ユーザーは、テーブルスキーマでVariantカラムの正確なデータタイプを事前定義する必要がありません。Variantタイプは、ネストしたデータ構造を処理する際に便利です。
同じテーブルに、Variantカラムと事前定義されたデータタイプを持つstaticカラムを含めることができます。これにより、ストレージとクエリでより柔軟性が提供されます。
ClickBenchデータセットでのテストでは、Variantカラムのデータは、staticカラムのデータと同じストレージスペースを占め、JSON形式の半分であることが証明されています。クエリパフォーマンスの面では、VariantタイプはホットランでJSONより8倍高いクエリ速度を実現し、コールドランではさらに高速です。

### IPタイプ

Doris V2.1はIPv4およびIPv6のネイティブサポートを提供します。IPデータをバイナリ形式で保存し、プレーンテキストのIP文字列と比較してストレージスペースの使用量を60%削減します。これらのIPタイプとともに、IPデータ処理用に20以上の関数を追加しました。

### 複合データタイプのためのより強力な関数

- explode_map：Mapデータタイプの行を列に展開することをサポートします。
- IN predicatesでのSTRUCTデータタイプをサポートします

## Workload Management

### リソースのハード分離

ワークロードグループが使用できるリソースにソフト制限を課すWorkload Groupメカニズムをベースに、Doris 2.1ではワークロードグループのCPUリソース消費にハード制限を導入し、クエリパフォーマンスの安定性を高めています。

### TopSQL

V2.1では、ユーザーが実行時に最もリソースを消費するSQLクエリを確認できます。これは、予期しない大きなクエリによって引き起こされるクラスタ負荷スパイクの処理において大きな助けとなります。


## その他

### Decimal 256

金融セクターまたはハイエンド製造業のユーザー向けに、V2.1は高精度データタイプのDecimalをサポートし、最大76桁の有効数字をサポートします（実験機能です。enable_decimal256=trueを設定してください）。

### Job scheduler

V2.1は定期タスクスケジューリングのための良い選択肢であるDoris Job Schedulerを提供します。スケジュールまたは固定間隔で事前定義された操作をトリガーできます。Doris Job Schedulerは秒単位で正確です。データ書き込みの整合性保証、高効率と柔軟性、高性能処理キュー、追跡可能なスケジューリング記録、ジョブの高可用性を提供します。

### Dockerクイックスタートで新バージョンを体験

バージョン2.1.0から、新しいバージョンのDorisを体験するために1FE、1BEのDockerコンテナの迅速な作成をサポートする専用のDocker Imageを提供します。コンテナはデフォルトでFEとBEの初期化、BE登録などのステップを完了します。コンテナ作成後、約1[minute.In](http://minute.In/)でDorisクラスタに直接アクセスして使用できます。このイメージバージョンでは、デフォルトの`max_map_count`、`ulimit`、`Swap`などのハード制限が削除されています。X64（avx2）マシンとARMマシンでのデプロイメントをサポートします。デフォルトのオープンポートは8000、8030、8040、9030です。Brokerコンポーネントを体験する必要がある場合は、起動時に環境変数`--env BROKER=true`を追加してBrokerプロセスを同期的に開始できます。起動後、自動的に登録が完了します。Broker名は`test`です。

このバージョンはクイック体験と機能テスト専用で、本番環境には適していないことにご注意ください！

## 動作の変更

- デフォルトのデータモデルはMerge-on-Write Unique Keyモデルです。Unique Keyモデルでテーブルが作成される際、enable_unique_key_merge_on_writeがデフォルト設定として含まれます。
- inverted indexがbitmap indexより高性能であることが証明されたため、V2.1はbitmap indexのサポートを停止します。既存のbitmap indexは引き続き有効ですが、新規作成は許可されません。将来的にはbitmap index関連コードを削除予定です。
- cpu_resource_limitはサポートされなくなりました。これはDoris BEでのscannerスレッド数に制限をかけるものです。workload groupメカニズムも同様の設定をサポートするため、既に設定されたcpu_resource_limitは無効になります。
- enable_segcompactionのデフォルト値はtrueです。これは、Dorisが同じrowset内の複数segmentのcompactionをサポートすることを意味します。
- 監査ログプラグイン
  - V2.1.0以降、Dorisには監査ログプラグインが内蔵されています。ユーザーはenable_audit_pluginパラメータを設定するだけで有効または無効にできます。
  - 独自の監査ログプラグインを既にインストール済みの場合、Doris V2.1へのアップグレード後も継続して使用するか、アンインストールしてDoris内蔵のものを使用できます。プラグイン切り替え後は監査ログテーブルが再配置されることにご注意ください。
  - 詳細については、[ドキュメント](../../admin-manual/audit-plugin)をご覧ください。


## Credits
このリリースに貢献いただいたすべての方に感謝いたします：  

467887319, 924060929, acnot, airborne12, AKIRA, alan_rodriguez, AlexYue, allenhooo, amory, amory, AshinGau, beat4ocean, BePPPower, bigben0204, bingquanzhao, BirdAmosBird, BiteTheDDDDt, bobhan1, caiconghui, camby, camby, CanGuan, caoliang-web, catpineapple, Centurybbx, chen, ChengDaqi2023, ChenyangSunChenyang, Chester, ChinaYiGuan, ChouGavinChou, chunping, colagy, CSTGluigi, czzmmc, daidai, dalong, dataroaring, DeadlineFen, DeadlineFen, deadlinefen, deardeng, didiaode18, DongLiang-0, dong-shuai, Doris-Extras, Dragonliu2018, DrogonJackDrogon, DuanXujianDuan, DuRipeng, dutyu, echo-dundun, ElvinWei, englefly, Euporia, feelshana, feifeifeimoon, feiniaofeiafei, felixwluo, figurant, flynn, fornaix, FreeOnePlus, Gabriel39, gitccl, gnehil, GoGoWen, gohalo, guardcrystal, hammer, HappenLee, HB, hechao, HelgeLarsHelge, herry2038, HeZhangJianHe, HHoflittlefish777, HonestManXin, hongkun-Shao, HowardQin, hqx871, httpshirley, htyoung, huanghaibin, HuJerryHu, HuZhiyuHu, Hyman-zhao, i78086, irenesrl, ixzc, jacktengg, jacktengg, jackwener, jayhua, Jeffrey, jiafeng.zhang, Jibing-Li, JingDas, julic20s, kaijchen, kaka11chen, KassieZ, kindred77, KirsCalvinKirs, KirsCalvinKirs, kkop, koarz, LemonLiTree, LHG41278, liaoxin01, LiBinfeng-01, LiChuangLi, LiDongyangLi, Lightman, lihangyu, lihuigang, LingAdonisLing, liugddx, LiuGuangdongLiu, LiuHongLiu, liuJiwenliu, LiuLijiaLiu, lsy3993, LuGuangmingLu, LuoMetaLuo, luozenglin, Luwei, Luzhijing, lxliyou001, Ma1oneZhang, mch_ucchi, Miaohongkai, morningman, morrySnow, Mryange, mymeiyi, nanfeng, nanfeng, Nitin-Kashyap, PaiVallishPai, Petrichor, plat1ko, py023, q763562998, qidaye, QiHouliangQi, ranxiang327, realize096, rohitrs1983, sdhzwc, seawinde, seuhezhiqiang, seuhezhiqiang, shee, shuke987, shysnow, songguangfan, Stalary, starocean999, SunChenyangSun, sunny, SWJTU-ZhangLei, TangSiyang2001, Tanya-W, taoxutao, Uniqueyou, vhwzIs, walter, walter, wangbo, Wanghuan, wangqt, wangtao, wangtianyi2004, wenluowen, whuxingying, wsjz, wudi, wudongliang, wuwenchihdu, wyx123654, xiangran0327, Xiaocc, XiaoChangmingXiao, xiaokang, XieJiann, Xinxing, xiongjx, xuefengze, xueweizhang, XueYuhai, XuJianxu, xuke-hat, xy, xy720, xyfsjq, xzj7019, yagagagaga, yangshijie, YangYAN, yiguolei, yiguolei, yimeng, YinShaowenYin, Yoko, yongjinhou, ytwp, yuanyuan8983, yujian, yujun777, Yukang-Lian, Yulei-Yang, yuxuan-luo, zclllyybb, ZenoYang, zfr95, zgxme, zhangdong, zhangguoqiang, zhangstar333, zhangstar333, zhangy5, ZhangYu0123, zhannngchen, ZhaoLongZhao, zhaoshuo, zhengyu, zhiqqqq, ZhongJinHacker, ZhuArmandoZhu, zlw5307, ZouXinyiZou, zxealous, zy-kkk, zzwwhh, zzzxl1993, zzzzzzzs
