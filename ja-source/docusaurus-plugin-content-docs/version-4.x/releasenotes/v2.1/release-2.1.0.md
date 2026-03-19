---
{
  "title": "リリース 2.1.0",
  "language": "ja",
  "description": "コミュニティの皆様、3月8日よりダウンロードおよびご利用いただけるApache Doris 2.1.0の正式リリースをお知らせできることを嬉しく思います。"
}
---
コミュニティの皆様、Apache Doris 2.1.0の正式リリースをお知らせします。3月8日よりダウンロードしてご利用いただけます。この最新バージョンは、特に大規模で複雑なデータセットの処理において、データ分析機能の向上に向けた我々の取り組みにおける重要なマイルストーンとなります。

Doris 2.1.0では、分析性能の最適化に主眼を置いており、その結果は明確に現れています。TPC-DS 1TBテストデータセットにおいて100%を超える印象的な性能向上を達成し、Apache Dorisが現実世界のビジネスシナリオにより対応できるようになりました。

- **クイックダウンロード:** https://doris.apache.org/download/

- **GitHub：** https://github.com/apache/doris/releases


## 性能向上

### よりスマートなoptimizer

V2.0をベースに、Doris V2.1のクエリoptimizerには、統計ベースの推論と列挙フレームワークが強化されています。コストモデルを改良し、最適化ルールを拡張して、より多くのユースケースのニーズに対応しています。

### より良いheuristic最適化

大規模データ分析やdata lakeシナリオにおいて、Doris V2.1はより良いheuristicクエリプランを提供します。同時に、RuntimeFilterはより自己適応的になり、統計情報がなくてもより高い性能を実現できます。

### Parallel adaptive scan

Doris V2.1では、parallel adaptive scanを採用してscan I/Oを最適化し、クエリ性能を向上させています。不適切なbucket数の負の影響を回避できます。（この機能は現在、Duplicate KeyモデルとMerge-on-Write Unique Keyモデルで利用可能です。）

### Local shuffle

データ分布の不均等を防ぐためにLocal Shuffleを導入しました。ベンチマークテストでは、Local ShuffleとParallel Adaptive Scanの組み合わせにより、テーブル作成時の不適切なbucket数設定にもかかわらず、高速なクエリ性能を保証できることが示されています。

### より高速なINSERT INTO SELECT

ETLにおける頻繁な操作であるINSERT INTO SELECTの性能をさらに向上させるため、MemTableの実行を前方に移動してデータ取り込みのオーバーヘッドを削減しました。テストでは、ほとんどのケースでV2.0と比較してデータ取り込み速度が2倍になることが示されています。
改良されたdata lake分析機能

## Data lake分析性能

### TPC-DSベンチマーク

Doris V2.1対Trinoのtpc-dsベンチマークテスト（1TB）によると、

- キャッシングなしで、Dorisの総実行時間はTrino V435の56%でした。（717s VS 1296s）
- ファイルキャッシュを有効にすると、Dorisの全体的な性能をさらに2.2倍向上させることができます。（323s）
これは、I/O、parquet/ORCファイル読み取り、predicate pushdown、キャッシング、scanタスクスケジューリングなどの一連の最適化によって実現されています。

 

### Arrow Flight SQLプロトコル

MySQL 8.0プロトコルと互換性のある列指向データベースとして、Doris V2.1は現在Arrow Flight SQLプロトコルもサポートしており、ユーザーはデータのシリアライゼーションとデシリアライゼーションなしに、Pandas/Numpy経由でDorisデータに高速アクセスできます。最も一般的なデータタイプにおいて、Arrow Flightプロトコルは、MySQLプロトコルの数十倍高速な性能を実現します。

## 非同期materialized view

V2.1では、複数のテーブルに基づくmaterialized viewの作成が可能です。この機能は現在以下をサポートしています：

- 透明な書き換え：Select、Where、Join、Group By、Aggregationを含む一般的なオペレータの透明な書き換えをサポートします。
- 自動リフレッシュ：定期リフレッシュ、手動リフレッシュ、完全リフレッシュ、増分リフレッシュ、パーティションベースのリフレッシュをサポートします。
- 外部テーブルのmaterialized view：Hive、Hudi、Icebergなどの外部データテーブルに基づくmaterialized viewをサポート；materialized viewを通じてdata lakeからDoris内部テーブルへのデータ同期をサポートします。
- materialized viewの直接クエリ：Materialized viewはETL後の結果セットと見なすことができます。この意味で、materialized viewはデータテーブルであるため、ユーザーは直接クエリを実行できます。

## 強化されたストレージ

### Auto-increment column

V2.1はauto-increment columnをサポートし、各行のデータ一意性を保証できます。これにより、効率的な辞書エンコーディングとクエリページネーションの基盤が築かれます。例えば、正確なUV計算や顧客グループ化において、ユーザーはDorisでしばしばbitmapタイプを適用しますが、そのプロセスには辞書エンコーディングが含まれます。V2.1により、ユーザーはまずauto-increment columnを使用して辞書テーブルを作成し、その後簡単にユーザーデータを読み込むことができます。

### Auto partition

運用・保守の負担をさらに軽減するため、V2.1では自動データパーティショニングが可能です。データ取り込み時に、パーティショニング列に基づいてデータのパーティションが存在するかを検出します。存在しない場合、自動的に作成してデータ取り込みを開始します。

### 高並行性リアルタイムデータ取り込み

データ書き込みにおいて、過度なデータバージョンを避けるためにバックプレッシャーメカニズムを導入し、データバージョンマージによるリソース消費を削減します。さらに、V2.1はgroup commit（[詳細を読む](../../data-operate/import/group-commit-manual)）をサポートしており、これは複数の書き込みを蓄積して一つとしてコミットすることを意味します。JDBC取り込みとStream Load方式でのgroup commitのベンチマークテストは優れた結果を示しています。

## 半構造化データ分析

### 新しいデータタイプ：Variant

V2.1は、Variantという新しいデータタイプをサポートします。これは、JSONなどの半構造化データや、整数、文字列、ブール値などを含む複合データタイプを収容できます。ユーザーは、テーブルスキーマでVariant列の正確なデータタイプを事前定義する必要はありません。Variantタイプは、ネストされたデータ構造を処理する際に便利です。
同じテーブルに、Variant列と事前定義されたデータタイプの静的列を含めることができます。これにより、ストレージとクエリにおいてより多くの柔軟性が提供されます。
ClickBenchデータセットでのテストでは、Variant列のデータは静的列のデータと同じストレージ容量を占め、これはJSON形式の半分であることが証明されています。クエリ性能に関して、Variantタイプはhot runでJSONより8倍高速なクエリ速度を実現し、cold runではさらに高速です。

### IPタイプ

Doris V2.1は、IPv4とIPv6のネイティブサポートを提供します。IPデータをバイナリ形式で格納し、プレーンテキストのIP文字列と比較してストレージ使用量を60%削減します。これらのIPタイプとともに、IPデータ処理用の20以上の関数を追加しました。

### 複合データタイプのためのより強力な関数

- explode_map：Mapデータタイプの行から列への展開をサポートします。
- IN述語でのSTRUCTデータタイプのサポート

## Workload Management

### リソースのハード分離

ワークロードグループが使用できるリソースにソフト制限を課すWorkload Groupメカニズムに基づいて、Doris 2.1では、クエリ性能のより高い安定性を保証する方法として、ワークロードグループのCPUリソース消費にハード制限を導入しています。

### TopSQL

V2.1により、ユーザーは実行時に最もリソースを消費するSQLクエリを確認できます。これは、予期しない大きなクエリによるクラスタ負荷スパイクを処理する際に大きな助けとなります。


## その他

### Decimal 256

金融セクターや高度な製造業のユーザーのため、V2.1は高精度データタイプDecimalをサポートし、最大76桁の有効桁数をサポートします（実験的機能、enable_decimal256=trueを設定してください。）

### Job scheduler

V2.1は、定期的なタスクスケジューリングの良い選択肢を提供します：Doris Job Scheduler。スケジュールまたは固定間隔で事前定義された操作をトリガーできます。Doris Job Schedulerは秒単位で正確です。データ書き込みの一貫性保証、高効率性と柔軟性、高性能処理キュー、追跡可能なスケジューリング記録、ジョブの高可用性を提供します。

### Docker高速起動による新バージョン体験のサポート

バージョン2.1.0から、Dorisの新バージョンを体験するために1FE、1BEのDockerコンテナを迅速に作成することをサポートする、専用のDocker Imageを提供します。コンテナは、デフォルトでFEとBEの初期化、BE登録などのステップを完了します。コンテナ作成後、約1分でDorisクラスタに直接アクセスして使用できます。このイメージバージョンでは、デフォルトの`max_map_count`、`ulimit`、`Swap`などのハード制限が削除されています。X64（avx2）マシンとARMマシンでのデプロイメントをサポートします。デフォルトの開放ポートは8000、8030、8040、9030です。Brokerコンポーネントを体験する必要がある場合は、起動時に環境変数`--env BROKER=true`を追加してBrokerプロセスを同期的に開始できます。起動後、自動的に登録が完了します。Broker名は`test`です。

このバージョンはクイック体験と機能テストのみに適しており、本番環境には適さないことにご注意ください！

## 動作変更

- デフォルトのデータモデルは、Merge-on-Write Unique Keyモデルです。Unique Keyモデルでテーブルが作成される際に、enable_unique_key_merge_on_writeがデフォルト設定として含まれます。
- inverted indexがbitmap indexより高性能であることが証明されたため、V2.1ではbitmap indexのサポートを停止します。既存のbitmap indexは有効のままですが、新規作成は許可されません。将来的にbitmap index関連のコードを削除する予定です。
- cpu_resource_limitはサポートされなくなりました。これは、Doris BEのスキャナースレッド数に制限を設けるためのものでした。workload groupメカニズムもそのような設定をサポートするため、既に設定されているcpu_resource_limitは無効になります。
- enable_segcompactionのデフォルト値はtrueです。これは、Dorisが同じrowset内の複数のセグメントのcompactionをサポートすることを意味します。
- 監査ログプラグイン
  - V2.1.0以降、Dorisには監査ログプラグインが組み込まれています。ユーザーはenable_audit_pluginパラメータを設定することで、簡単に有効または無効にできます。
  - 独自の監査ログプラグインを既にインストールしている場合は、Doris V2.1にアップグレード後も継続して使用するか、アンインストールしてDorisのものを使用することができます。プラグインの切り替え後に監査ログテーブルが移動されることにご注意ください。
  - 詳細については、[ドキュメント](../../admin-manual/audit-plugin)をご覧ください。


## クレジット
このリリースに貢献していただいたすべての方に感謝いたします：

467887319, 924060929, acnot, airborne12, AKIRA, alan_rodriguez, AlexYue, allenhooo, amory, amory, AshinGau, beat4ocean, BePPPower, bigben0204, bingquanzhao, BirdAmosBird, BiteTheDDDDt, bobhan1, caiconghui, camby, camby, CanGuan, caoliang-web, catpineapple, Centurybbx, chen, ChengDaqi2023, ChenyangSunChenyang, Chester, ChinaYiGuan, ChouGavinChou, chunping, colagy, CSTGluigi, czzmmc, daidai, dalong, dataroaring, DeadlineFen, DeadlineFen, deadlinefen, deardeng, didiaode18, DongLiang-0, dong-shuai, Doris-Extras, Dragonliu2018, DrogonJackDrogon, DuanXujianDuan, DuRipeng, dutyu, echo-dundun, ElvinWei, englefly, Euporia, feelshana, feifeifeimoon, feiniaofeiafei, felixwluo, figurant, flynn, fornaix, FreeOnePlus, Gabriel39, gitccl, gnehil, GoGoWen, gohalo, guardcrystal, hammer, HappenLee, HB, hechao, HelgeLarsHelge, herry2038, HeZhangJianHe, HHoflittlefish777, HonestManXin, hongkun-Shao, HowardQin, hqx871, httpshirley, htyoung, huanghaibin, HuJerryHu, HuZhiyuHu, Hyman-zhao, i78086, irenesrl, ixzc, jacktengg, jacktengg, jackwener, jayhua, Jeffrey, jiafeng.zhang, Jibing-Li, JingDas, julic20s, kaijchen, kaka11chen, KassieZ, kindred77, KirsCalvinKirs, KirsCalvinKirs, kkop, koarz, LemonLiTree, LHG41278, liaoxin01, LiBinfeng-01, LiChuangLi, LiDongyangLi, Lightman, lihangyu, lihuigang, LingAdonisLing, liugddx, LiuGuangdongLiu, LiuHongLiu, liuJiwenliu, LiuLijiaLiu, lsy3993, LuGuangmingLu, LuoMetaLuo, luozenglin, Luwei, Luzhijing, lxliyou001, Ma1oneZhang, mch_ucchi, Miaohongkai, morningman, morrySnow, Mryange, mymeiyi, nanfeng, nanfeng, Nitin-Kashyap, PaiVallishPai, Petrichor, plat1ko, py023, q763562998, qidaye, QiHouliangQi, ranxiang327, realize096, rohitrs1983, sdhzwc, seawinde, seuhezhiqiang, seuhezhiqiang, shee, shuke987, shysnow, songguangfan, Stalary, starocean999, SunChenyangSun, sunny, SWJTU-ZhangLei, TangSiyang2001, Tanya-W, taoxutao, Uniqueyou, vhwzIs, walter, walter, wangbo, Wanghuan, wangqt, wangtao, wangtianyi2004, wenluowen, whuxingying, wsjz, wudi, wudongliang, wuwenchihdu, wyx123654, xiangran0327, Xiaocc, XiaoChangmingXiao, xiaokang, XieJiann, Xinxing, xiongjx, xuefengze, xueweizhang, XueYuhai, XuJianxu, xuke-hat, xy, xy720, xyfsjq, xzj7019, yagagagaga, yangshijie, YangYAN, yiguolei, yiguolei, yimeng, YinShaowenYin, Yoko, yongjinhou, ytwp, yuanyuan8983, yujian, yujun777, Yukang-Lian, Yulei-Yang, yuxuan-luo, zclllyybb, ZenoYang, zfr95, zgxme, zhangdong, zhangguoqiang, zhangstar333, zhangstar333, zhangy5, ZhangYu0123, zhannngchen, ZhaoLongZhao, zhaoshuo, zhengyu, zhiqqqq, ZhongJinHacker, ZhuArmandoZhu, zlw5307, ZouXinyiZou, zxealous, zy-kkk, zzwwhh, zzzxl1993, zzzzzzzs
