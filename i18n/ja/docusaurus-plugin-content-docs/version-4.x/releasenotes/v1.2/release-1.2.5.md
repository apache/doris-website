---
{
  "title": "Release 1.2.5",
  "language": "ja",
  "description": "バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題またはパフォーマンス改善を修正しました。同時に、"
}
---
バージョン1.2.5では、Dorisチームはバージョン1.2.4のリリース以降、約210の問題修正またはパフォーマンス改善を行いました。同時に、バージョン1.2.5はバージョン1.2.4の反復バージョンでもあり、より高い安定性を持っています。すべてのユーザーがこのバージョンにアップグレードすることを推奨します。

# 動作の変更

- `start_be.sh`スクリプトは、システムのファイルハンドルの最大数が65536以上である必要があることをチェックし、そうでない場合は起動に失敗します。

- BE設定項目`enable_quick_compaction`はデフォルトでtrueに設定されます。Quick Compactionがデフォルトで有効になります。この機能は、大量バッチインポートの場合に小さなファイルの問題を最適化するために使用されます。

- テーブルの動的パーティション属性を変更した後、即座に効果を発揮しなくなり、デッドロック問題を回避するために動的パーティションテーブルの次回のタスクスケジューリングを待機します。

# 改善

- bthreadとpthreadの使用を最適化し、クエリプロセス中のRPCブロッキング問題を軽減しました。

- FE web UIのProfileページにProfileをダウンロードするボタンを追加しました。

- FE設定`recover_with_skip_missing_version`を追加し、特定の障害条件下で問題のあるレプリカをスキップするクエリに使用されます。

- 行レベル権限機能が外部Catalogをサポートします。

- Hive CatalogがBE側でのkerberosチケットの自動更新をサポートし、手動更新が不要になりました。

- JDBC CatalogがMySQL/ClickHouseシステムデータベース（`information_schema`）下のテーブルをサポートします。

# バグ修正

- 低カーディナリティ列最適化によって引き起こされる不正なクエリ結果の問題を修正しました

- HDFSアクセスに関する複数の認証と互換性の問題を修正しました。

- float/doubleとdecimal型に関する複数の問題を修正しました。

- date/datetimev2型に関する複数の問題を修正しました。

- クエリ実行と計画に関する複数の問題を修正しました。

- JDBC Catalogに関する複数の問題を修正しました。

- Hive Catalogに関するクエリ関連の複数の問題、およびHive Metastoreメタデータ同期の問題を修正しました。

- `SHOW LOAD PROFILE`ステートメントの結果が不正である問題を修正しました。

- メモリ関連の複数の問題を修正しました。

- `CREATE TABLE AS SELECT`機能に関する複数の問題を修正しました。

- avx2をサポートしないCPU上でjsonb型がBEクラッシュを引き起こす問題を修正しました。

- 動的パーティションに関する複数の問題を修正しました。

- TOPNクエリ最適化に関する複数の問題を修正しました。

- Unique Key Merge-on-Writeテーブルモデルに関する複数の問題を修正しました。

# 謝辞

58人のコントリビューターが1.2.5の改善とリリースに参加し、彼らの努力と献身に感謝します：

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
