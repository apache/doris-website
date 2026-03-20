---
{
  "title": "Release 1.2.5",
  "language": "ja",
  "description": "バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題やパフォーマンス改善を修正しました。同時に、"
}
---
バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題や性能改善を修正しました。同時に、バージョン1.2.5はバージョン1.2.4の反復版でもあり、より高い安定性を持っています。すべてのユーザーがこのバージョンにアップグレードすることを推奨します。

# 動作の変更

- `start_be.sh`スクリプトは、システムのファイルハンドル数の最大値が65536以上である必要があることをチェックし、そうでなければ起動に失敗します。

- BE設定項目`enable_quick_compaction`はデフォルトでtrueに設定されています。Quick Compactionはデフォルトで有効になっています。この機能は、大量バッチインポートの場合の小ファイルの問題を最適化するために使用されます。

- テーブルの動的パーティション属性を変更した後、即座に有効になることはなく、動的パーティションテーブルの次のタスクスケジューリングまで待機し、いくつかのデッドロック問題を回避します。

# 改善

- bthreadとpthreadの使用を最適化し、クエリプロセス中のRPCブロッキング問題を軽減しました。

- FE web UIのProfileページにProfileをダウンロードするボタンが追加されました。

- FE設定`recover_with_skip_missing_version`が追加されました。これは特定の障害条件下で問題のあるレプリカをスキップするクエリに使用されます。

- 行レベル権限機能が外部カタログをサポートします。

- Hive カタログは手動でリフレッシュすることなく、BE側でkerberosチケットの自動リフレッシュをサポートします。

- JDBC カタログがMySQL/ClickHouseシステムデータベース（`information_schema`）下のテーブルをサポートします。

# バグ修正

- 低カーディナリティカラム最適化によって引き起こされる不正確なクエリ結果の問題を修正しました

- HDFSにアクセスする際のいくつかの認証と互換性の問題を修正しました。

- float/doubleとdecimal型のいくつかの問題を修正しました。

- date/datetimev2型のいくつかの問題を修正しました。

- クエリ実行と計画のいくつかの問題を修正しました。

- JDBC カタログのいくつかの問題を修正しました。

- Hive カタログに関するいくつかのクエリ関連の問題と、Hive Metastoreメタデータ同期の問題を修正しました。

- `SHOW LOAD PROFILE`ステートメントの結果が不正確である問題を修正しました。

- メモリ関連のいくつかの問題を修正しました。

- `CREATE TABLE AS SELECT`機能のいくつかの問題を修正しました。

- avx2をサポートしないCPUでjsonb型がBEをクラッシュさせる問題を修正しました。

- 動的パーティションのいくつかの問題を修正しました。

- TOPNクエリ最適化のいくつかの問題を修正しました。

- Unique Key Merge-on-Writeテーブルモデルのいくつかの問題を修正しました。

# 大きな感謝

58人の貢献者が1.2.5の改善とリリースに参加しており、彼らの懸命な取り組みと献身に感謝します：

@adonis0147

@airborne12

@AshinGau

@BePPPower

@BiteTheDDDDt

@caiconghui

@CalvinKirs

@cambyzju

@caoliang-web

@dataroaring

@Doris-Extras

@dujl

@dutyu

@fsilent

@Gabriel39

@gitccl

@gnehil

@GoGoWen

@gongzexin

@HappenLee

@herry2038

@jacktengg

@Jibing-Li

@kaka11chen

@Kikyou1997

@LemonLiTree

@liaoxin01

@LiBinfeng-01

@luwei16

@Moonm3n

@morningman

@mrhhsg

@Mryange

@nextdreamblue

@nsnhuang

@qidaye

@Shoothzj

@sohardforaname

@stalary

@starocean999

@SWJTU-ZhangLei

@wsjz

@xiaokang

@xinyiZzz

@yangzhg

@yiguolei

@yixiutt

@yujun777

@Yulei-Yang

@yuxuan-luo

@zclllyybb

@zddr

@zenoyang

@zhangstar333

@zhannngchen

@zxealous

@zy-kkk

@zzzzzzzs
