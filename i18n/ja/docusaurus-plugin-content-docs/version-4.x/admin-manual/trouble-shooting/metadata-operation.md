---
{
    "title": "メタデータの運用と保守",
    "language": "ja",
    "description": "このドキュメントでは、本番環境における Doris メタデータの管理方法と、FE ノードの推奨構成を説明します。",
}
---

:::warning

やむを得ない場合を除き、metadata_failure_recovery を使用しないでください。使用すると、メタデータの切り捨てや喪失、スプリットブレインが発生する可能性があります。誤った操作による回復不能なデータ損傷を防ぐため、慎重に扱ってください。
:::

このドキュメントでは、本番環境で Doris メタデータを管理する方法を説明します。FE ノードの推奨構成、一般的な運用方法、よくあるエラーへの対処方法を扱います。

まず、[Doris のメタデータ設計ドキュメント](/community/design/metadata-design)を読み、Doris のメタデータの仕組みを理解してください。

## 重要な注意事項

* 現在のメタデータ設計には、旧バージョンとの後方互換性がありません。つまり、新バージョンでメタデータ構造が変更された場合（FE コードの `FeMetaVersion.java` に新しい VERSION があるかどうかで確認できます）、新バージョンへのアップグレード後に旧バージョンへロールバックすることは通常できません。そのため、FE をアップグレードする前に、[アップグレードドキュメント](../../admin-manual/cluster-management/upgrade.md)の手順に従ってメタデータの互換性を必ずテストしてください。

## メタデータディレクトリの構成

fe.conf で指定した `meta_dir` のパスが `path/to/doris-meta` であるとします。通常の Doris クラスターでは、メタデータディレクトリは次の構成になります。

```
/path/to/doris-meta/
            |-- bdb/
            |   |-- 00000000.jdb
            |   |-- je.config.csv
            |   |-- je.info.0
            |   |-- je.info.0.lck
            |   |-- je.lck
            |   `-- je.stat.csv
            `-- image/
                |-- ROLE
                |-- VERSION
                `-- image.xxxx
```

1. bdb

	メタデータジャーナルの保存には、分散 Key-Value システムである [bdbje](https://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html) を使用します。この BDB ディレクトリは、bdbje の「データディレクトリ」に相当します。

	拡張子が `.jdb` のファイルは bdbje のデータファイルです。これらのファイルは、メタデータジャーナルが増えるにつれて増加します。Doris が定期的にイメージの生成を完了すると、古いログは削除されます。そのため、通常のデータファイルの合計サイズは数 MB から数 GB です（インポート頻度など、Doris の利用状況によって異なります）。合計サイズが 10GB を超える場合は、イメージの生成に失敗していないか、イメージの配布に失敗して古いジャーナルを削除できなくなっていないかを確認してください。

	` je.info.0 ` は bdbje の実行ログです。このログの時刻は UTC + 0 です。このログから bdbje の動作の一部も確認できます。

2. image ディレクトリ

	image ディレクトリには、Doris が定期的に生成するメタデータのイメージが保存されます。通常は `image.xxxxx` というイメージファイルがあります。`xxxxx` は数値で、このイメージに `xxxx` より前のすべてのメタデータジャーナルが含まれることを示します。このファイルの生成時刻（`ls -al` で確認できます）は、通常、イメージの生成時刻です。

	`image.ckpt` ファイルが見つかる場合もあります。これは生成中のメタデータイメージです。`du -sh` コマンドでファイルサイズの増加を確認できれば、イメージの内容が書き込まれています。書き込みが終わると、ファイル名は自動的に新しい `image.xxxxx` に変更され、古いイメージファイルが置き換えられます。

	定期的にイメージファイルを自発的に生成するのは、Master ロールの FE だけです。生成後、イメージは Master 以外の FE に送られます。すべての FE がイメージを受信したことを確認すると、Master FE は bdbje 内のメタデータジャーナルを削除します。そのため、イメージの生成や他の FE への配布に失敗すると、bdbje 内にデータが蓄積します。

	`ROLE` ファイルは FE のタイプ（FOLLOWER または OBSERVER）を記録するテキストファイルです。

	`VERSION` ファイルは Doris クラスターのクラスター ID と、ノード間のアクセス認証に使用するトークンを記録するテキストファイルです。

	`ROLE` ファイルと `VERSION` ファイルは、両方存在するか、両方存在しない（初回起動時など）場合があります。

## 基本操作

### 単一ノード FE の起動

単一ノード FE は最も基本的な構成です。Doris クラスターには少なくとも一つの FE ノードが必要です。FE ノードが一つだけの場合、ノードのタイプは Follower、ロールは Master です。

1. 初回起動

	1. fe.conf で指定した `meta_dir` のパスが `path/to/doris-meta` であるとします。
	2. `path/to/doris-meta` が存在し、権限が正しく、ディレクトリが空であることを確認します。
	3. `bash bin/start_fe.sh --daemon` で起動します。
	4. 起動後、fe.log に次のようなログが表示されます。

		* Palo FE starting...
		* image does not exist: /path/to/doris-meta/image/image.0
		* transfer from INIT to UNKNOWN
		* transfer from UNKNOWN to MASTER
		* the very first time to open bdb, dbname is 1
		* start fencing, epoch number is 1
		* finish replay in xxx msec
		* QE service start
		* thrift server started

		上記のログが必ずこの順序で出力されるとは限りませんが、おおむね同様の内容になります。

	5. 単一ノード FE の初回起動では、通常、問題は発生しません。上記のログが表示されない場合は、手順を確認し、関連する Wiki を参照してください。

2. 再起動

	1. 停止した FE ノードは `bash bin/start_fe.sh` で再起動できます。
	2. 再起動後、fe.log に次のようなログが表示されます。

		* Palo FE starting...
		* finished to get cluster id: xxxx, role: FOLLOWER and node name: xxxx
		* 再起動前にイメージが生成されていない場合は、次のログが表示されます。
		* image does not exist: /path/to/doris-meta/image/image.0

		* 再起動前にイメージが生成されている場合は、次のログが表示されます。
		* start load image from /path/to/doris-meta/image/image.xxx. is ckpt: false
		* finished load image in xxx ms

		* transfer from INIT to UNKNOWN
		* replayed journal id is xxxx, replay to journal id is yyyy
		* transfer from UNKNOWN to MASTER
		* finish replay in xxx msec
		* master finish replay journal, can write now.
		* begin to generate new image: image.xxxx
		*  start save image to /path/to/doris-meta/image/image.ckpt. is ckpt: true
		*  finished save image /path/to/doris-meta/image/image.ckpt in xxx ms. checksum is xxxx
		*  push image.xxx to other nodes. totally xx nodes, push succeeded xx nodes
		* QE service start
		* thrift server started

		上記のログが必ずこの順序で出力されるとは限りませんが、おおむね同様の内容になります。

3. よくある問題

	単一ノード FE の起動や停止では、通常、問題は発生しません。問題がある場合は、関連する Wiki を参照し、操作手順を慎重に確認してください。

### FE の追加

FE の追加手順は[エラスティック拡張ドキュメント](../../admin-manual/cluster-management/elastic-expansion.md)で詳しく説明しているため、ここでは繰り返しません。以下に注意点とよくある問題を示します。

1. 注意事項

	* 新しい FE を追加する前に、現在の Master FE が正常に動作していることを確認してください（接続、JVM、イメージ生成、bdbje データディレクトリのサイズなど）。
	* 新しい FE の初回起動時は、Master FE を指す `--helper` パラメーターを必ず指定してください。再起動時には `--helper` は不要です。`--helper` を指定した場合、FE は helper ノードに自身のロールを直接問い合わせます。指定しなかった場合は、`ROLE` ファイルと `VERSION` ファイル（`doris-meta/image/` ディレクトリ内）から情報を取得しようとします。
	* 新しい FE の初回起動時は、その FE の `meta_dir` が作成済みで、権限が正しく、空であることを必ず確認してください。
	* 新しい FE の起動と `ALTER SYSTEM ADD FOLLOWER/OBSERVER` 文の実行は、どちらを先に行っても構いません。FE を先に起動し、まだ文を実行していない場合、新しい FE のログに `current node is not added to the group. Please add it first.` と表示されます。文を実行すると、通常の処理に進みます。
	* 直前に追加した FE が正常に追加されたことを確認してから、次の FE を追加してください。
	* MASTER FE に接続して `ALTER SYSTEM ADD FOLLOWER/OBSERVER` 文を実行してください。

2. よくある問題

	1. 追加する FE に DETACHED と表示される

		追加する FE の初回起動時に、Master FE の doris-meta/bdb 内のデータが多いと、追加する FE のログに `this node is DETACHED` と表示されることがあります。この時点では bdbje がデータをコピーしており、追加する FE の `bdb/` ディレクトリが大きくなるのを確認できます。この処理には通常、数分かかります（bdbje のデータ量によって異なります）。その後、fe.log に bdbje 関連のエラースタックが表示されることもあります。最終的に `QE service start` と `thrift server start` が表示されれば、通常は起動に成功しています。mysql-client でこの FE に接続して確認できます。これらのログが表示されない場合は、bdbje のレプリケーションログのタイムアウトが原因かもしれません。この場合、FE をそのまま再起動すると通常は解決します。

	2. さまざまな理由による追加失敗

		* OBSERVER の追加に失敗した場合、OBSERVER タイプの FE はメタデータ書き込みの過半数判定に参加しないため、理論上は任意のタイミングで起動・停止できます。そのため、OBSERVER FE のプロセスを直接停止し、そのメタデータディレクトリを空にしてから再度追加できます。

		* FOLLOWER の追加に失敗した場合、FOLLOWER はメタデータ書き込みの過半数判定に参加するため、bdbje の選挙グループにすでに参加している可能性があります。FOLLOWER ノードが MASTER を含めて二つしかない場合、一方の FE を停止すると、もう一方は過半数への書き込みができずに終了する可能性があります。この場合、まず `ALTER SYSTEM DROP FOLLOWER` コマンドで追加した FOLLOWER ノードをメタデータから削除し、次にその FOLLOWER プロセスを停止してメタデータを空にしてから、再度追加してください。


### FE の削除

`ALTER SYSTEM DROP FOLLOWER/OBSERVER` コマンドで、該当するタイプの FE を削除できます。次の点に注意してください。

* OBSERVER タイプの FE は、直接 DROP するだけで十分であり、リスクはありません。

* FOLLOWER タイプの FE を削除する場合は、まず FOLLOWER の数が奇数（三つ以上）であることを確認してください。

	1. MASTER ロール以外の FE を削除する場合は、MASTER FE に接続して DROP コマンドを実行してから、プロセスを停止することを推奨します。
	2. MASTER FE を削除する場合は、まず FOLLOWER FE が `odd`（奇数）個あり、`and it works properly`（正常に動作している）ことを確認してください。その後、MASTER FE のプロセスを停止します。この時点で、別の FE が MASTER に選出されます。残りの FE が正常に動作することを確認してから、新しい MASTER FE に接続して DROP コマンドを実行し、古い MASTER FE を削除してください。

## 高度な操作

### FE メタデータ復旧モード

`metadata recovery mode` の不適切な使用や誤操作は、本番環境のデータに回復不能な損傷を与える可能性があります。そのため、`metadata recovery mode` の操作手順は公開していません。本当に必要な場合は、Doris コミュニティの開発者に相談してください。

### FE タイプの変更

既存の FE のタイプを FOLLOWER から OBSERVER、または OBSERVER から FOLLOWER に変更する場合は、上記の手順で FE を削除してから、目的のタイプで追加してください。

### FE の移行

FE を現在のノードから別のノードへ移行する場合、次の状況が考えられます。

1. MASTER 以外の FOLLOWER または OBSERVER の移行

	新しい FOLLOWER または OBSERVER を追加してから、古い FOLLOWER または OBSERVER を削除します。

2. 単一ノード MASTER の移行

    開発者であれば、`metadata recovery mode` を使用して操作できます。ただし、一般のユーザーには `metadata recovery mode` の使用を推奨しません。環境を再構築し、外部テーブルを使用してデータを移行することを推奨します。

3. FOLLOWER グループを別の新しいノード群へ移行

	新しいノードに FE をデプロイし、まず FOLLOWER を追加する手順で新しいノードを追加します。その後、古いノードを一つずつ DROP できます。順次 DROP する過程では、MASTER が新しい FOLLOWER ノードを自動的に選択します。

### FE ポートの変更

現在、FE には次のポートがあります。

* Ed_log_port: bdbje の通信ポート
* http_port: HTTP ポート。イメージの配布にも使用
* rpc_port: Frontend の thrift サーバーポート
* query_port: MySQL 接続ポート
* arrow_flight_sql_port: Arrow Flight SQL 接続ポート

1. edit_log_port

	複数の FE ノードがある場合は、ノード管理の手順に従って古いノードを削除し、新しいノードを追加することで、このポートを変更できます。単一ノードの場合は、上記の「単一ノード MASTER の移行」を参照して、単一の Master FE ノードを移行できます。

2. http_port

	すべての FE で http_ports を同じ値にする必要があります。このポートを変更する場合は、すべての FE を停止し、設定を変更して、同時に再起動してください。

3. rpc_port

	設定を変更した後、FE をそのまま再起動します。Master FE はハートビートを通じて新しいポートを BE に通知します。使用されるのは Master FE のこのポートだけですが、すべての FE でポートを同じ値にすることを推奨します。

4. query_port

	設定を変更した後、FE をそのまま再起動します。影響を受けるのは MySQL の接続先だけです。

5. arrow_flight_sql_port

	設定を変更した後、FE をそのまま再起動します。影響を受けるのは Arrow Flight SQL サーバーの接続先だけです。

### BDBJE 内のデータの表示（デバッグ専用）

FE のメタデータログは、Key-Value 形式で BDBJE に保存されます。異常時には、メタデータのエラーによって FE を起動できないことがあります。この場合、Doris はトラブルシューティングのために BDBJE 内のデータを照会する方法を提供しています。

まず、fe.conf に `enable_bdbje_debug_mode=true` を追加し、`bash start_fe.sh --daemon` で FE を起動します。

このとき、FE はデバッグモードに入り、HTTP サーバーと MySQL サーバーのみを起動して BDBJE インスタンスを開きます。メタデータの読み込みや、その後の起動処理は行いません。

FE の Web ページにアクセスするか、MySQL クライアントで Doris に接続して `show proc "/bdbje";` を実行すると、BDBJE に保存されたデータを確認できます。

```
mysql> show proc "/bdbje";
+----------+---------------+---------+
| DbNames  | JournalNumber | Comment |
+----------+---------------+---------+
| 110589   | 4273          |         |
| epochDB  | 4             |         |
| metricDB | 430694        |         |
+----------+---------------+---------+
```

第一階層には、BDBJE 内のすべてのデータベース名と、各データベースのエントリ数が表示されます。

```
mysql> show proc "/bdbje/110589";
+-----------+
| JournalId |
+-----------+
| 1         |
| 2         |

...
| 114858    |
| 114859    |
| 114860    |
| 114861    |
+-----------+
4273 rows in set (0.06 sec)
```

第二階層には、指定したデータベースに含まれるすべてのエントリのキーが一覧表示されます。

```
mysql> show proc "/bdbje/110589/114861";
+-----------+--------------+---------------------------------------------+
| JournalId | OpType       | Data                                        |
+-----------+--------------+---------------------------------------------+
| 114861    | OP_HEARTBEAT | org.apache.doris.persist.HbPackage@6583d5fb |
+-----------+--------------+---------------------------------------------+
1 row in set (0.05 sec)
```

第三階層には、指定したキーの値の情報が表示されます。

## ベストプラクティス

FE の構成に関する推奨事項は、[インストールとデプロイのドキュメント](../../install/deploy-manually/integrated-storage-compute-deploy-manually.md)に記載されています。以下に補足します。

* 本番環境では、メタデータ書き込みの高可用性を保つため、**奇数個の FOLLOWER FE**（通常は 3 個: 1 MASTER + 2 FOLLOWER）をデプロイしてください。FOLLOWER はリーダー選出と過半数への書き込みに参加します。Master に障害が発生すると、残りの FOLLOWER が新しい Master を選出します。OBSERVER は選出に参加せず、メタデータを同期して FE の読み取り能力を拡張するために使用します。テスト環境や開発環境では、FOLLOWER を一つだけ配置しても構いません。

* 過半数への書き込みとは、ジャーナルが FOLLOWER の過半数に書き込まれて初めてコミットされることを意味します。FOLLOWER が 3 個なら、一つの障害に耐えられます。一つしか残っていない場合は、メタデータの書き込みを継続できません。これは想定される動作であり、FOLLOWER を 3 個配置しない理由にはなりません。FOLLOWER の時刻を同期し、FE の JVM に十分なメモリを割り当て、過半数の FOLLOWER を同時に停止しないでください。

* FE プロセスの JVM には十分なメモリが必要です。FE の JVM メモリを少なくとも 10GB 確保し、32GB～64GB とすることを**強く推奨します**。JVM のメモリ使用量を監視する仕組みも導入してください。FE で OOM が発生すると、メタデータの書き込みに失敗し、**復旧できない**障害につながる可能性があります。

* メタデータの増加によってディスク容量が不足しないよう、FE ノードには十分な空き容量を確保してください。FE のログも十数 GB 以上のディスク容量を消費します。

## その他のよくある問題

1. fe.log に `meta out of date. current time: xxx, synchronized time: xxx, has log: xxx, fe type: xxx` が出力される

	通常は、FE が Master を選出できないことが原因です。たとえば FOLLOWER を三つ構成しているのに一つしか起動していない場合、その FOLLOWER にこの問題が発生します。通常は、すべての FOLLOWER を同時に再起動すると解決します。起動後も解決しない場合は、ほかの問題がないか確認してください。

2. `Clock delta: xxxx ms. between Feeder: xxxx and this Replica exceeds max permissible delta: xxxx ms.`

	bdbje では、ノード間の時刻差が一定のしきい値を超えてはいけません。超えた場合、ノードは異常終了します。デフォルトのしきい値は 5000ms で、FE パラメーター `max_bdbje_clock_delta_ms' で制御され、必要に応じて変更できます。ただし、NTP などの時刻同期方法を使用して、Doris クラスターのホスト間で時刻を同期することを推奨します。


3. `image/` ディレクトリのイメージファイルが長期間更新されていない

	Master FE はデフォルトで、メタデータジャーナル 50,000 件ごとにイメージファイルを生成します。頻繁に使用するクラスターでは、通常、半日から数日ごとに新しいイメージファイルが生成されます。イメージファイルが長期間（たとえば一週間以上）更新されていない場合は、次の順序で原因を確認してください。

	1. Master FE の fe.log で `memory is not enough to do checkpoint. Committed memory XXXX Bytes, used memory XXXX Bytes. ` を検索します。見つかった場合、現在の FE の JVM メモリはイメージ生成には不足しています（通常、イメージ生成のために FE メモリの半分を確保する必要があります）。JVM メモリを増やして FE を再起動し、状態を確認してください。Master FE を再起動するたびに、新しいイメージが直接生成されます。この方法で再起動し、新しいイメージを能動的に生成することもできます。ただし、FOLLOWER が複数ある場合は、現在の Master FE を再起動すると別の FOLLOWER FE が MASTER になり、その後のイメージ生成を担当します。そのため、すべての FOLLOWER FE の JVM メモリ設定を変更する必要があるかもしれません。

	2. Master FE の fe.log で `begin to generate new image: image.xxxx` を検索します。見つかった場合、イメージ生成が始まっています。同じスレッドの後続ログを確認し、`checkpoint finished save image.xxxx` が表示されていれば、イメージの書き込みは成功しています。`Exception when generating new image file` が表示されていれば生成に失敗しているため、具体的なエラーメッセージを確認してください。


4. `bdb/` ディレクトリのサイズが数 GB 以上と非常に大きい

	新しいイメージを生成できない問題を解消した後も、BDB ディレクトリのサイズがしばらく大きいままの場合があります。Master FE によるイメージの配布に失敗している可能性があります。Master FE の fe.log で `push image.XXXX to other nodes. totally XX nodes, push succeeded YY nodes` を検索してください。YY が XX より小さければ、一部の FE への配布に失敗しています。具体的なエラーは、fe.log の `Exception when pushing image file.url = xxx` で確認できます。

	また、FE の設定ファイルに `edit_log_roll_num = xxxx` を追加できます。このパラメーターは、イメージを一回生成するまでのメタデータジャーナル数を設定します。デフォルト値は 50000 です。値を適切に小さくするとイメージがより頻繁に生成され、古いジャーナルの削除が早まります。

5. FOLLOWER FE が次々に停止する

	Doris のメタデータは過半数への書き込み方式を採用しています。つまり、メタデータジャーナルは、一定数以上の FOLLOWER FE（たとえば三つの FOLLOWER のうち二つ）への書き込みに成功して初めて、書き込み成功とみなされます。書き込みに失敗すると、FE プロセスは自ら終了します。FOLLOWER が A、B、C の三つある場合、最初に C が停止し、次に B が停止すると、A も停止します。これは過半数書き込みの想定される動作です。本番環境では引き続き FOLLOWER を 3 個配置し、過半数の FOLLOWER を同時に停止しないでください。稼働中の FOLLOWER が一つしか残っていない場合は、ほかの FOLLOWER を復旧させて一緒に起動してください。残った一つだけを起動すると、項目 1 の `meta out of date` メッセージが表示されることがあります。

6. fe.log に `get exception when try to close previously opened bdb database. ignore it` が表示される

	末尾に `ignore it` と表示されていれば、通常は対処する必要はありません。詳細を確認したい場合は、`BDBEnvironment.java` でこのエラーを検索し、コメントを参照してください。

7. `show frontends;` では FE の `Join` が `true` と表示されるが、実際には FE に異常がある

	`show frontends;` で `Join` の情報を確認できます。この列が `true` の場合は、FE がクラスターに**参加したことがある**という意味だけで、現在もクラスター内で正常に動作していることは意味しません。`false` の場合は、FE がクラスターに**一度も参加していない**ことを意味します。

8. FE の `master_sync_policy`、`replica_sync_policy`、`txn_rollback_limit.` の設定

	`master_sync_policy` は Leader FE がメタデータログを書き込むときに fsync() を呼び出すかどうかを指定します。`replica_sync_policy` も fsync() に関係し、`replica_sync_policy` は FE の HA 構成でメタデータを同期するときに、ほかの Follower FE が fsync() を呼び出すかどうかを指定します。以前の Doris では、これら二つのパラメーターのデフォルト値は `WRITE_NO_SYNC` で、fsync() は呼び出されませんでした。最新バージョンでは、デフォルト値が `SYNC` に変更され、fsync() が呼び出されます。fsync() を呼び出すと、メタデータのディスク書き込み効率が大きく低下します。環境によっては IOPS が数百まで落ち、レイテンシーが 2-3ms に増えることがあります（それでも Doris のメタデータ操作には十分です）。そのため、次の設定を推奨します。

	1. Follower FE が一つの構成では、`master_sync_policy` を `SYNC` に設定します。これにより、FE システムの停止によるメタデータの喪失を防ぎます。
	2. Follower FE が複数の構成では、複数のシステムが同時に停止する可能性は非常に低いと考えられるため、`master_sync_policy` と `replica_sync_policy` を `WRITE_NO_SYNC` に設定できます。

	Follower FE が一つの構成で `master_sync_policy` を `WRITE_NO_SYNC` に設定すると、FE システムが停止した際にメタデータが失われる可能性があります。このとき、別の Observer FE が再起動しようとすると、次のエラーが報告されることがあります。

    ```
    Node xxx must rollback xx total commits(numPassedDurableCommits of which were durable) to the earliest point indicated by transaction xxxx in order to rejoin the replication group, but the transaction rollback limit of xxx prohibits this.
    ```

これは、永続化済みの一部のトランザクションをロールバックする必要があるものの、その件数が上限を超えていることを意味します。デフォルトの上限は 100 で、`txn_rollback_limit` を設定すると変更できます。この操作は FE の正常な起動を試みるためだけのもので、失われたメタデータは復旧できません。
