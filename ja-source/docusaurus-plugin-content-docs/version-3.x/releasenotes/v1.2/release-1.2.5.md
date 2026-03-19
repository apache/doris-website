---
{
  "title": "リリース 1.2.5",
  "language": "ja",
  "description": "バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題修正またはパフォーマンス改善を行いました。同時に、"
}
---
バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題修正またはパフォーマンス改善を行いました。同時に、バージョン1.2.5はバージョン1.2.4の反復バージョンでもあり、より高い安定性を持っています。すべてのユーザーがこのバージョンにアップグレードすることを推奨します。

# 動作変更

- `start_be.sh`スクリプトは、システムの最大ファイルハンドル数が65536以上である必要があることをチェックし、そうでなければ起動が失敗します。

- BE設定項目`enable_quick_compaction`はデフォルトでtrueに設定されています。Quick Compactionがデフォルトで有効になっています。この機能は、大量バッチインポートの場合の小さなファイルの問題を最適化するために使用されます。

- テーブルのdynamic partition属性を変更した後、即座に有効になることはなく、次のdynamic partitionテーブルのタスクスケジューリングを待機して、一部のデッドロック問題を回避します。

# 改善

- bthreadとpthreadの使用を最適化し、クエリプロセス中のRPCブロッキング問題を軽減しました。

- FE web UIのProfileページにProfileをダウンロードするボタンが追加されました。

- FE設定`recover_with_skip_missing_version`が追加され、特定の障害条件下で問題のあるレプリカをスキップするクエリに使用されます。

- 行レベル権限機能が外部カタログをサポートします。

- Hive カタログは、手動更新なしでBE側でのkerberosチケットの自動更新をサポートします。

- JDBC カタログがMySQL/ClickHouseシステムデータベース（`information_schema`）下のテーブルをサポートします。

# バグ修正

- 低カーディナリティカラム最適化によるクエリ結果の不正確な問題を修正しました

- HDFSアクセスに関する複数の認証および互換性問題を修正しました。

- float/doubleおよびdecimal型に関する複数の問題を修正しました。

- date/datetimev2型に関する複数の問題を修正しました。

- クエリ実行および計画に関する複数の問題を修正しました。

- JDBC カタログに関する複数の問題を修正しました。

- Hive カタログに関するクエリ関連の複数の問題、およびHive Metastoreメタデータ同期問題を修正しました。

- `SHOW LOAD PROFILE`ステートメントの結果が不正確である問題を修正しました。

- メモリ関連の複数の問題を修正しました。

- `CREATE TABLE AS SELECT`機能に関する複数の問題を修正しました。

- avx2をサポートしないCPUでjsonb型がBEクラッシュを引き起こす問題を修正しました。

- dynamic partitionに関する複数の問題を修正しました。

- TOPNクエリ最適化に関する複数の問題を修正しました。

- Unique Key Merge-on-Writeテーブルモデルに関する複数の問題を修正しました。

# 謝辞

58名のコントリビューターが1.2.5の改善とリリースに参加し、彼らのハードワークと献身に感謝します：

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
