---
{
  "title": "リリース 1.2.5",
  "language": "ja",
  "description": "バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210件の問題修正やパフォーマンス改善を行いました。同時に、"
}
---
バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題やパフォーマンスの改善を修正しました。同時に、バージョン1.2.5はバージョン1.2.4の反復版でもあり、より高い安定性を持っています。すべてのユーザーにこのバージョンへのアップグレードを推奨します。

# 動作変更

- `start_be.sh`スクリプトは、システムのファイルハンドル数の最大値が65536以上でなければならないことをチェックし、そうでなければ起動に失敗します。

- BE設定項目`enable_quick_compaction`はデフォルトでtrueに設定されます。Quick Compactionはデフォルトで有効になります。この機能は、大量バッチインポートの場合の小さなファイルの問題を最適化するために使用されます。

- テーブルの動的パーティション属性を変更した後、すぐに有効になることはなく、デッドロック問題を回避するために動的パーティションテーブルの次のタスクスケジューリングを待ちます。

# 改善

- bthreadとpthreadの使用を最適化し、クエリプロセス中のRPCブロッキング問題を軽減します。

- FE web UIのProfileページにProfileをダウンロードするボタンが追加されました。

- FE設定`recover_with_skip_missing_version`が追加され、特定の障害条件下で問題のあるレプリカをスキップするクエリに使用されます。

- 行レベル権限機能が外部カタログをサポートします。

- Hive カタログは、手動でリフレッシュすることなく、BE側でkerberosチケットの自動リフレッシュをサポートします。

- JDBC カタログはMySQL/ClickHouseシステムデータベース（`information_schema`）下のテーブルをサポートします。

# バグ修正

- 低カーディナリティ列最適化によって引き起こされる不正なクエリ結果の問題を修正しました

- HDFSアクセスに関するいくつかの認証と互換性の問題を修正しました。

- float/doubleとdecimal型に関するいくつかの問題を修正しました。

- date/datetimev2型に関するいくつかの問題を修正しました。

- クエリ実行と計画に関するいくつかの問題を修正しました。

- JDBC カタログに関するいくつかの問題を修正しました。

- Hive カタログに関するいくつかのクエリ関連問題と、Hive Metastoreメタデータ同期問題を修正しました。

- `SHOW LOAD PROFILE`文の結果が不正である問題を修正しました。

- メモリ関連のいくつかの問題を修正しました。

- `CREATE TABLE AS SELECT`機能に関するいくつかの問題を修正しました。

- avx2をサポートしないCPUでjsonb型がBEをクラッシュさせる問題を修正しました。

- 動的パーティションに関するいくつかの問題を修正しました。

- TOPNクエリ最適化に関するいくつかの問題を修正しました。

- Unique Key Merge-on-Writeテーブルモデルに関するいくつかの問題を修正しました。

# 謝辞

58名の貢献者が1.2.5の改善とリリースに参加し、彼らの懸命な努力と献身に感謝します：

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
