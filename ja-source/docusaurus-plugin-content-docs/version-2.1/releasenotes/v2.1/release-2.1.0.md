---
{
  "title": "リリース 2.1.0",
  "language": "ja",
  "description": "コミュニティの皆様、3月8日より、Apache Doris 2.1.0の正式リリースをダウンロードしてご利用いただけるようになりましたことをお知らせいたします。"
}
---
親愛なるコミュニティの皆様、Apache Doris 2.1.0の正式リリースをお知らせできることを嬉しく思います。3月8日より、ダウンロードおよび利用が可能になりました。この最新バージョンは、特に大規模で複雑なデータセットの処理において、データ分析機能の向上に向けた私たちの取り組みにおける重要なマイルストーンとなります。

Doris 2.1.0では、分析パフォーマンスの最適化に主眼を置き、その成果は結果に表れています。TPC-DS 1TBテストデータセットにおいて100%を超える驚異的なパフォーマンス向上を達成し、Apache Dorisが現実世界のビジネスシナリオにより効果的に対応できるようになりました。

- **クイックダウンロード：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## パフォーマンス向上

### よりスマートなオプティマイザー

V2.0をベースに、Doris V2.1のクエリオプティマイザーは、統計ベースの推論および列挙フレームワークが強化されています。コストモデルをアップグレードし、より多くのユースケースのニーズに対応するために最適化ルールを拡張しました。

### より優れたヒューリスティック最適化

大規模データ分析やデータレイクシナリオにおいて、Doris V2.1はより優れたヒューリスティッククエリプランを提供します。同時に、RuntimeFilterはより自己適応性を持ち、統計情報がない場合でも高いパフォーマンスを実現します。

### 並列適応スキャン

Doris V2.1では、スキャンI/Oを最適化し、クエリパフォーマンスを向上させるために並列適応スキャンを採用しています。これにより、不適切なバケット数による悪影響を回避できます。（この機能は現在、Duplicate KeyモデルおよびMerge-on-Write Unique Keyモデルで利用可能です。）

### Local shuffle

データ分散の不均衡を防ぐためにLocal Shuffleを導入しました。ベンチマークテストでは、Parallel Adaptive Scanと組み合わせることで、テーブル作成時の不適切なバケット数設定にも関わらず、高速なクエリパフォーマンスを保証できることが示されています。

### より高速なINSERT INTO SELECT

ETLで頻繁に実行されるINSERT INTO SELECTのパフォーマンスをさらに向上させるため、データ取り込みのオーバーヘッドを削減するために実行面でMemTableを前進させました。テストでは、ほとんどの場合においてV2.0と比較してデータ取り込み速度を2倍にできることが示されています。

## データレイク分析パフォーマンス

### TPC-DSベンチマーク

Doris V2.1とTrinoのTPC-DSベンチマークテスト（1TB）によると、

- キャッシュなしの場合、Dorisの総実行時間はTrino V435の56%です。（717s対1296s）
- ファイルキャッシュを有効にすることで、Dorisの全体的なパフォーマンスをさらに2.2倍向上させることができます。（323s）

これは、I/O、parquet/ORCファイル読み取り、述語プッシュダウン、キャッシュ、スキャンタスクスケジューリングなどの一連の最適化により実現されています。


### Arrow Flight SQLプロトコル

MySQL 8.0プロトコルと互換性のある列指向データベースとして、Doris V2.1はArrow Flight SQLプロトコルもサポートするようになり、ユーザーはデータのシリアル化およびデシリアル化なしにPandas/Numpy経由でDorisデータに高速アクセスできます。最も一般的なデータ型において、Arrow FlightプロトコルはMySQLプロトコルよりも数十倍高速なパフォーマンスを実現します。

## 非同期マテリアライズドビュー

V2.1では、複数のテーブルに基づいたマテリアライズドビューの作成が可能です。この機能は現在以下をサポートしています：

- 透過的な書き換え：Select、Where、Join、Group By、およびAggregationを含む一般的な演算子の透過的な書き換えをサポートします。
- 自動リフレッシュ：定期的なリフレッシュ、手動リフレッシュ、フルリフレッシュ、増分リフレッシュ、およびパーティションベースのリフレッシュをサポートします。
- 外部テーブルのマテリアライズドビュー：Hive、Hudi、Icebergなどの外部データテーブルに基づくマテリアライズドビューをサポートし、マテリアライズドビュー経由でデータレイクからDoris内部テーブルへのデータ同期をサポートします。
- マテリアライズドビューへの直接クエリ：マテリアライズドビューはETL後の結果セットとみなすことができます。この意味で、マテリアライズドビューはデータテーブルであり、ユーザーはそれらに対して直接クエリを実行できます。

## 強化されたストレージ

### 自動インクリメント列

V2.1では自動インクリメント列をサポートし、各行のデータ一意性を保証できます。これにより、効率的な辞書エンコーディングとクエリページネーションの基盤が構築されます。例えば、正確なUV計算や顧客グルーピングにおいて、ユーザーはDorisでbitmapタイプを適用することが多く、そのプロセスでは辞書エンコーディングが必要です。V2.1では、ユーザーはまず自動インクリメント列を使用して辞書テーブルを作成し、その後単純にユーザーデータをロードできます。

### 自動パーティション

運用保守の負担をさらに軽減するため、V2.1では自動データパーティショニングが可能です。データ取り込み時に、パーティション列に基づいてデータ用のパーティションが存在するかを検出します。存在しない場合は、自動的にパーティションを作成してデータ取り込みを開始します。

### 高並行リアルタイムデータ取り込み

データ書き込みにおいて、過度なデータバージョンを回避するためのバックプレッシャーメカニズムが導入されており、データバージョンマージによるリソース消費を削減します。さらに、V2.1ではgroup commit（[詳細を読む](../../data-operate/import/group-commit-manual)）をサポートしており、複数の書き込みを蓄積して一つとしてコミットします。JDBC取り込みおよびStream Loadメソッドを使用したgroup commitのベンチマークテストでは優れた結果を示しています。

## 半構造化データ分析

### 新しいデータ型：Variant

V2.1では、Variantという新しいデータ型をサポートしています。これは、JSONなどの半構造化データや、整数、文字列、ブール値などを含む複合データ型を格納できます。ユーザーは、テーブルスキーマでVariant列の正確なデータ型を事前定義する必要がありません。Variantタイプは、ネストしたデータ構造を処理する際に便利です。

同じテーブル内で、Variant列と事前定義されたデータ型を持つ静的列を含めることができます。これにより、ストレージとクエリでより高い柔軟性が得られます。

ClickBenchデータセットでのテストでは、Variant列のデータは静的列のデータと同じストレージ容量を占め、JSON形式の半分であることが証明されています。クエリパフォーマンスの面では、Variantタイプはホットランでは JSONよりも8倍高速なクエリ速度を実現し、コールドランではさらに高速になります。

### IPタイプ

Doris V2.1では、IPv4およびIPv6のネイティブサポートを提供しています。IPデータをバイナリ形式で保存し、プレーンテキストのIP文字列と比較してストレージ容量使用量を60%削減します。これらのIPタイプと併せて、IPデータ処理用の20を超える関数を追加しました。

### 複合データ型のより強力な関数

- explode_map：Mapデータ型の行から列への展開をサポートします。
- IN述語でのSTRUCTデータ型をサポートします。

## ワークロード管理

### リソースのハード分離

ワークロードグループが使用できるリソースにソフトリミットを課すWorkload Groupメカニズムをベースに、Doris 2.1では、クエリパフォーマンスのより高い安定性を確保する方法として、ワークロードグループのCPUリソース消費にハードリミットを導入しています。

### TopSQL

V2.1では、ユーザーは実行時に最もリソースを消費するSQLクエリを確認できます。これは、予期しない大規模クエリによるクラスタ負荷スパイクを処理する際に大きな助けとなります。


## その他

### Decimal 256

金融セクターやハイエンド製造業のユーザー向けに、V2.1では高精度データ型Decimalをサポートしており、最大76桁の有効数字をサポートします（実験的機能です。enable_decimal256=trueを設定してください）。

### ジョブスケジューラー

V2.1では、定期的なタスクスケジューリングのための優れたオプションとして、Doris Job Schedulerを提供しています。スケジュールまたは固定間隔で事前定義された操作をトリガーできます。Doris Job Schedulerは秒単位で正確です。データ書き込みの整合性保証、高効率性と柔軟性、高性能処理キュー、追跡可能なスケジューリング記録、およびジョブの高可用性を提供します。

### 新バージョンを体験するためのDocker高速スタートをサポート

バージョン2.1.0から、新しいバージョンのDorisを体験するために1FE、1BEのDockerコンテナを迅速に作成することをサポートする独立したDocker Imageを提供します。コンテナはデフォルトでFEとBEの初期化、BE登録などのステップを完了します。コンテナ作成後、約1分でDorisクラスタに直接アクセスして使用できます。このイメージバージョンでは、デフォルトの`max_map_count`、`ulimit`、`Swap`などのハードリミットが削除されています。X64（avx2）マシンおよびARMマシンでの展開をサポートします。デフォルトの開放ポートは8000、8030、8040、9030です。Brokerコンポーネントを体験する必要がある場合は、起動時に環境変数`--env BROKER=true`を追加してBrokerプロセスを同期的に開始できます。起動後、自動的に登録が完了します。Broker名は`test`です。

このバージョンは迅速な体験と機能テストのみに適しており、本番環境には適していないことにご注意ください！

## 動作の変更

- デフォルトのデータモデルはMerge-on-Write Unique Keyモデルです。Unique Keyモデルでテーブルが作成される際に、enable_unique_key_merge_on_writeがデフォルト設定として含まれます。
- inverted indexがbitmap indexよりもパフォーマンスが優れていることが証明されたため、V2.1ではbitmap indexのサポートを停止します。既存のbitmap indexは有効のままですが、新規作成は許可されません。将来的にbitmap index関連のコードを削除する予定です。
- cpu_resource_limitはサポートされなくなりました。これはDoris BEでのスキャナースレッド数に制限を設けるものです。ワークロードグループメカニズムでもそのような設定をサポートしているため、既に設定されているcpu_resource_limitは無効になります。
- enable_segcompactionのデフォルト値はtrueです。これは、Dorisが同じrowset内の複数のセグメントのcompactionをサポートすることを意味します。
- 監査ログプラグイン
  - V2.1.0以降、Dorisには組み込みの監査ログプラグインがあります。ユーザーはenable_audit_pluginパラメータを設定することで、簡単に有効または無効にできます。
  - 独自の監査ログプラグインを既にインストールしている場合は、Doris V2.1へのアップグレード後も継続して使用するか、アンインストールしてDoris内のプラグインを使用できます。プラグインを切り替えた後、監査ログテーブルが再配置されることにご注意ください。
  - 詳細については、[docs](../../admin-manual/audit-plugin)をご参照ください。


## クレジット
このリリースに貢献してくださったすべての方々に感謝します：

467887319, 924060929, acnot, airborne12, AKIRA, alan_rodriguez, AlexYue, allenhooo, amory, amory, AshinGau, beat4ocean, BePPPower, bigben0204, bingquanzhao, BirdAmosBird, BiteTheDDDDt, bobhan1, caiconghui, camby, camby, CanGuan, caoliang-web, catpineapple, Centurybbx, chen, ChengDaqi2023, ChenyangSunChenyang, Chester, ChinaYiGuan, ChouGavinChou, chunping, colagy, CSTGluigi, czzmmc, daidai, dalong, dataroaring, DeadlineFen, DeadlineFen, deadlinefen, deardeng, didiaode18, DongLiang-0, dong-shuai, Doris-Extras, Dragonliu2018, DrogonJackDrogon, DuanXujianDuan, DuRipeng, dutyu, echo-dundun, ElvinWei, englefly, Euporia, feelshana, feifeifeimoon, feiniaofeiafei, felixwluo, figurant, flynn, fornaix, FreeOnePlus, Gabriel39, gitccl, gnehil, GoGoWen, gohalo, guardcrystal, hammer, HappenLee, HB, hechao, HelgeLarsHelge, herry2038, HeZhangJianHe, HHoflittlefish777, HonestManXin, hongkun-Shao, HowardQin, hqx871, httpshirley, htyoung, huanghaibin, HuJerryHu, HuZhiyuHu, Hyman-zhao, i78086, irenesrl, ixzc, jacktengg, jacktengg, jackwener, jayhua, Jeffrey, jiafeng.zhang, Jibing-Li, JingDas, julic20s, kaijchen, kaka11chen, KassieZ, kindred77, KirsCalvinKirs, KirsCalvinKirs, kkop, koarz, LemonLiTree, LHG41278, liaoxin01, LiBinfeng-01, LiChuangLi, LiDongyangLi, Lightman, lihangyu, lihuigang, LingAdonisLing, liugddx, LiuGuangdongLiu, LiuHongLiu, liuJiwenliu, LiuLijiaLiu, lsy3993, LuGuangmingLu, LuoMetaLuo, luozenglin, Luwei, Luzhijing, lxliyou001, Ma1oneZhang, mch_ucchi, Miaohongkai, morningman, morrySnow, Mryange, mymeiyi, nanfeng, nanfeng, Nitin-Kashyap, PaiVallishPai, Petrichor, plat1ko, py023, q763562998, qidaye, QiHouliangQi, ranxiang327, realize096, rohitrs1983, sdhzwc, seawinde, seuhezhiqiang, seuhezhiqiang, shee, shuke987, shysnow, songguangfan, Stalary, starocean999, SunChenyangSun, sunny, SWJTU-ZhangLei, TangSiyang2001, Tanya-W, taoxutao, Uniqueyou, vhwzIs, walter, walter, wangbo, Wanghuan, wangqt, wangtao, wangtianyi2004, wenluowen, whuxingying, wsjz, wudi, wudongliang, wuwenchihdu, wyx123654, xiangran0327, Xiaocc, XiaoChangmingXiao, xiaokang, XieJiann, Xinxing, xiongjx, xuefengze, xueweizhang, XueYuhai, XuJianxu, xuke-hat, xy, xy720, xyfsjq, xzj7019, yagagagaga, yangshijie, YangYAN, yiguolei, yiguolei, yimeng, YinShaowenYin, Yoko, yongjinhou, ytwp, yuanyuan8983, yujian, yujun777, Yukang-Lian, Yulei-Yang, yuxuan-luo, zclllyybb, ZenoYang, zfr95, zgxme, zhangdong, zhangguoqiang, zhangstar333, zhangstar333, zhangy5, ZhangYu0123, zhannngchen, ZhaoLongZhao, zhaoshuo, zhengyu, zhiqqqq, ZhongJinHacker, ZhuArmandoZhu, zlw5307, ZouXinyiZou, zxealous, zy-kkk, zzwwhh, zzzxl1993, zzzzzzzs
