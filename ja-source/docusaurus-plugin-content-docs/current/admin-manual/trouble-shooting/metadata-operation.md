---
{
  "title": "メタデータの運用と保守",
  "language": "ja",
  "description": "この文書は、実際の本番環境においてDorisメタデータを管理する方法に焦点を当てています。FEノードの提案された展開を含み、"
}
---
:::warning

どうしても必要でない限り、metadata_failure_recovery の使用は避けてください。使用するとメタデータの切り詰め、損失、スプリットブレインが発生する可能性があります。不適切な操作による取り返しのつかないデータ損傷を防ぐため、慎重に使用してください。
:::

このドキュメントでは、実際の本番環境でDorisメタデータを管理する方法について説明します。FEノードの推奨デプロイメント、一般的に使用される運用方法、一般的なエラー解決方法が含まれています。

まず、[Dorisメタデータ設計ドキュメント](/community/design/metadata-design)を読んで、Dorisメタデータがどのように動作するかを理解してください。

## 重要なヒント

* 現在のメタデータ設計には後方互換性がありません。つまり、新しいバージョンに新しいメタデータ構造の変更がある場合（FEコードの`FeMetaVersion.java`ファイルに新しいVERSIONがあるかどうかで確認できます）、通常、新しいバージョンにアップグレード後に古いバージョンにロールバックすることは不可能です。したがって、FEをアップグレードする前に、[アップグレードドキュメント](../../admin-manual/cluster-management/upgrade.md)の操作に従って必ずメタデータ互換性をテストしてください。

## メタデータカタログ構造

fe.confで指定された`meta_dir`のパスが`path/to/doris-meta`であると仮定しましょう。通常のDorisクラスターでは、メタデータのディレクトリ構造は以下のようになります：

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

	分散KVシステムとして[bdbje](https://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html)を使用してメタデータジャーナルを格納します。このBDBディレクトリはbdbjeの「データディレクトリ」に相当します。

	`.jdb`拡張子はbdbjeのデータファイルです。これらのデータファイルはメタデータジャーナルの増加に伴って増加します。Dorisが定期的にimageを完了すると、古いログは削除されます。したがって通常、これらのデータファイルの合計サイズは数MBから数GB（Dorisの使用方法、例えばインポート頻度によって異なる）まで変動します。データファイルの合計サイズが10GBより大きい場合、imageが失敗したか、imageの配布に失敗した履歴ジャーナルが削除できないのではないかと疑う必要があるかもしれません。

	`je.info.0`はbdbjeの実行ログです。このログの時刻はUTC+0タイムゾーンです。このログから、bdbjeの動作の一部を確認することもできます。

2. imageディレクトリ

	imageディレクトリは、Dorisが定期的に生成するメタデータミラーを格納するために使用されます。通常、`image.xxxxx`ミラーファイルが表示されます。ここで`xxxxx`は数字です。この数字は、imageが`xxxx`より前のすべてのメタデータジャーナルを含むことを示します。そして、このファイルの生成時間（`ls -al`で確認）は通常、ミラーの生成時間です。

	また、`image.ckpt`ファイルが表示される場合があります。これは生成中のメタデータミラーです。`du -sh`コマンドではファイルサイズが増加していることが表示され、ミラーコンテンツがファイルに書き込まれていることを示します。ミラーが書き込まれると、自動的に新しい`image.xxxxx`にリネームされ、古いimageファイルを置き換えます。

	Master役割を持つFEのみが定期的にimageファイルを能動的に生成します。各生成後、FEは他の非Master役割にプッシュされます。他のすべてのFEがこのimageを受信したことが確認されると、Master FEはbdbje内のメタデータジャーナルを削除します。したがって、image生成が失敗したり、他のFEへのimageプッシュが失敗した場合、bdbje内のデータが蓄積されます。

	`ROLE`ファイルはFEのタイプ（FOLLOWERまたはOBSERVER）を記録するテキストファイルです。

	`VERSION`ファイルはDorisクラスターのクラスターIDとノード間のアクセス認証に使用されるトークンを記録するテキストファイルです。

	`ROLE`ファイルと`VERSION`ファイルは同時に存在する場合もあれば、同時に存在しない場合もあります（例：初回起動時）。

## 基本操作

### 単一ノードFEの起動

単一ノードFEは最も基本的なデプロイメントモードです。完全なDorisクラスターには少なくとも1つのFEノードが必要です。FEノードが1つだけの場合、ノードのタイプはFollowerで役割はMasterです。

1. 初回起動

	1. fe.confで指定された`meta_dir`のパスが`path/to/doris-meta`であるとします。
	2. `path/to/doris-meta`が既に存在し、権限が正しく、ディレクトリが空であることを確認します。
	3. `bash bin/start_fe.sh --daemon`で直接起動します。
	4. 起動後、fe.logで以下のログが確認できるはずです：

		* Palo FE starting...
		* image does not exist: /path/to/doris-meta/image/image.0
		* transfer from INIT to UNKNOWN
		* transfer from UNKNOWN to MASTER
		* the very first time to open bdb, dbname is 1
		* start fencing, epoch number is 1
		* finish replay in xxx msec
		* QE service start
		* thrift server started

		上記のログは必ずしも厳密にこの順序ではありませんが、基本的には似ています。

	5. 単一ノードFEの初回起動では通常問題は発生しません。上記のログが見られない場合、一般的には文書の手順を注意深く従っていないため、関連するwikiを注意深く読んでください。

2. 再起動

	1. 停止したFEノードは`bash bin/start_fe.sh`を使用して再起動できます。
	2. 再起動後、fe.logで以下のログが確認できるはずです：

		* Palo FE starting...
		* finished to get cluster id: xxxx, role: FOLLOWER and node name: xxxx
		* 再起動前にimageが生成されていない場合、以下が表示されます：
		* image does not exist: /path/to/doris-meta/image/image.0

		* 再起動前にimageが生成されている場合、以下が表示されます：
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

		上記のログは必ずしも厳密にこの順序ではありませんが、基本的には似ています。

3. 一般的な問題

	単一ノードFEのデプロイメントでは、開始・停止で通常問題は発生しません。問題がある場合は、関連するWikiを参照し、操作手順を注意深く確認してください。

### FEの追加

FEプロセスの追加については[弾性拡張ドキュメント](../../admin-manual/cluster-management/elastic-expansion.md)で詳細に説明されており、ここでは繰り返しません。以下は注意点と一般的な問題です。

1. 注意点

	* 新しいFEを追加する前に、現在のMaster FEが正常に動作していることを確認してください（接続が正常、JVMが正常、image生成が正常、bdbjeデータディレクトリが大きすぎないなど）
	* 新しいFEを初回起動する際は、必ず`--helper`パラメータを追加してMaster FEを指すようにしてください。再起動時に`--helper`を追加する必要はありません。（`--helper`が指定された場合、FEは直接helperノードにその役割を問い合わせます。指定されていない場合、FEは`doris-meta/image/`ディレクトリの`ROLE`および`VERSION`ファイルから情報を取得しようとします。
	* 新しいFEを初回起動する際は、必ずFEの`meta_dir`が作成され、正しい権限があり、空であることを確認してください。
	* 新しいFEの起動と`ALTER SYSTEM ADD FOLLOWER/OBSERVER`ステートメントの実行によるFEのメタデータへの追加は、順序は必要ありません。新しいFEが最初に起動され、ステートメントが実行されていない場合、新しいFEログに`current node is not added to the group. Please add it first.`が表示されます。ステートメントが実行されると、通常のプロセスに入ります。
	* 前のFEが正常に追加された後、次のFEを追加するようにしてください。
	* MASTER FEに接続し、`ALTER SYSTEM ADD FOLLOWER/OBSERVER`ステートメントを実行してください。

2. 一般的な問題

	1. this need is DETACHED

		追加するFEを初回起動する際、Master FEのdoris-meta/bdbのデータが大きい場合、追加するFEログに`this node is DETACHED.`という文字が表示される場合があります。この時点で、bdbjeはデータをコピーしており、追加するFEの`bdb/`ディレクトリが増加しているのが確認できます。このプロセスは通常数分かかります（bdbjeのデータ量に依存）。その後、fe.logにbdbje関連のエラースタック情報が表示される場合があります。最終的なログに`QE service start`と`thrift server start`が表示された場合、起動は通常成功です。mysql-client経由でこのFEに接続を試してみることができます。これらの文字が表示されない場合、bdbjeレプリケーションログタイムアウトの問題である可能性があります。この時点で、FEを直接再起動すると通常問題が解決されます。

	2. 様々な理由による追加失敗

		* OBSERVERが追加される場合、OBSERVER型FEはメタデータ書き込みの過半数に参加しないため、理論的には自由に開始・停止できます。したがって、OBSERVER追加失敗の場合、OBSERVER FEプロセスを直接killできます。OBSERVERのメタデータディレクトリをクリアした後、再度プロセスを追加してください。

		* FOLLOWERが追加される場合、FOLLOWERはメタデータの過半数書き込みに参加するため、FOLLOWERがbdbje選出チームに参加している可能性があります。FOLLOWERノードが2つだけの場合（MASTERを含む）、1つのFEを停止すると、過半数の時間で書き込みができないため、もう1つのFEが終了する可能性があります。この時点で、まず`ALTER SYSTEM DROP FOLLOWER`コマンドを通じて新しく追加されたFOLLOWERノードをメタデータから削除し、その後FOLLOWERプロセスをkillし、メタデータを空にしてプロセスを再追加する必要があります。


### FEの削除

`ALTER SYSTEM DROP FOLLOWER/OBSERVER`コマンドで対応するタイプのFEを削除できます。以下の点に注意してください：

* OBSERVER型FEの場合、直接DROPで十分で、リスクはありません。

* FOLLOWER型FEの場合、まず奇数のFOLLOWER（3つ以上）から削除を開始することを確認してください。

	1. 非MASTER役割のFEを削除する場合、MASTER FEに接続し、DROPコマンドを実行してからプロセスをkillすることをお勧めします。
	2. MASTER FEを削除したい場合、まず`奇数`のFOLLOWER FE`があり、正常に動作していることを確認してください。その後、まずMASTER FEプロセスをkillしてください。この時点で、FEがMASTERに選出されます。残りのFEが正常に動作していることを確認した後、新しいMASTER FEに接続し、DROPコマンドを実行して古いMASTER FEを削除してください。

## 高度な操作

### FEメタデータ復旧モード

`メタデータ復旧モード`の不適切な使用や誤った操作は、本番環境で取り返しのつかないデータ損傷を引き起こす可能性があります。そのため、`メタデータ復旧モード`の操作に関するドキュメントは提供されなくなりました。真の必要がある場合は、Dorisコミュニティの開発者に支援を求めてください。

### FEタイプ変更

既存のFOLLOWER/OBSERVER型FEをOBSERVER/FOLLOWER型に変更する必要がある場合は、上記の方法でFEを削除してから、対応するタイプのFEを追加してください。

### FE移行

現在のノードから別のノードに1つのFEを移行する必要がある場合、いくつかのシナリオがあります。

1. 非MASTERノードのFOLLOWER、またはOBSERVER移行

	新しいFOLLOWER/OBSERVERを直接追加した後、古いFOLLOWER/OBSERVERを削除します。

2. 単一ノードMASTER移行

    開発者の場合、`メタデータ復旧モード`を使用して操作を実行できます。しかし、ユーザの場合、`メタデータ復旧モード`の使用は推奨されません。環境を再構築し、外部テーブルを使用してデータを転送することをお勧めします。

3. 一連のFOLLOWERを1つのノードセットから新しいノードセットへ移行

	新しいノードにFEをデプロイし、FOLLOWERを追加することで新しいノードを最初に追加します。古いノードは1つずつDROPで削除できます。DROP-by-DROPのプロセスで、MASTERは自動的に新しいFOLLOWERノードを選択します。

### FEポートの置き換え

FEには現在以下のポートがあります

* Ed_log_port: bdbjeの通信ポート
* http_port: httpポート、imageのプッシュにも使用
* rpc_port: Frontendのthrift serverポート
* query_port: Mysql接続ポート
* arrow_flight_sql_port: Arrow Flight SQL接続ポート

1. edit_log_port

	このポートを置き換える必要がある場合、複数のfeノードがデプロイされている場合は、ノード管理手順で古いノードを削除し、新しいノードを追加できます。単一ノードの場合は、上記の「単一ノードMASTER移行」を参照して単一のMaster feノードを移行できます

2. http_port

	すべてのFE http_portは一致している必要があります。したがって、このポートを変更したい場合、すべてのFEを停止し、変更して同時に再起動する必要があります。

3. rpc_port

	設定を変更した後、FEを直接再起動してください。Master FEはハートビートを通じて新しいポートをBEに通知します。Master FEのこのポートのみが使用されます。ただし、すべてのFEポートが一致していることをお勧めします。

4. query_port

	設定を変更した後、FEを直接再起動してください。これはmysqlの接続先にのみ影響します。

5. arrow_flight_sql_port

	設定を変更した後、FEを直接再起動してください。これはarrow flight sqlサーバーの接続先にのみ影響します。

### BDBJEのデータ表示（デバッグ専用）

FEのメタデータログはKey-Value形式でBDBJEに格納されます。一部の異常な状況では、メタデータエラーによりFEが起動できない場合があります。この場合、DorisはユーザーがBDBJEに格納されたデータをクエリして、トラブルシューティングを容易にする方法を提供しています。

まず、fe.confに設定を追加する必要があります：`enable_bdbje_debug_mode=true`、その後`bash start_fe.sh --daemon`を通じてFEを起動します。

この時、FEはデバッグモードに入り、httpサーバーとMySQLサーバーのみを起動し、BDBJEインスタンスを開きますが、メタデータやその他の後続の起動プロセスはロードしません。

この時、FEのWebページにアクセスするか、MySQLクライアント経由でDorisに接続した後、`show proc "/bdbje";`を通じてBDBJEに格納されたデータを表示できます。

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
第1レベルのディレクトリは、BDBJEのすべてのデータベース名と各データベースのエントリ数を表示します。

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
2番目のレベルに入ると、指定されたデータベース下のすべてのエントリキーが一覧表示されます。

```
mysql> show proc "/bdbje/110589/114861";
+-----------+--------------+---------------------------------------------+
| JournalId | OpType       | Data                                        |
+-----------+--------------+---------------------------------------------+
| 114861    | OP_HEARTBEAT | org.apache.doris.persist.HbPackage@6583d5fb |
+-----------+--------------+---------------------------------------------+
1 row in set (0.05 sec)
```
第3レベルでは、指定されたキーの値情報を表示できます。

## ベストプラクティス

FEの配置に関する推奨事項は、インストールおよび[配置ドキュメント](../../install/deploy-manually/integrated-storage-compute-deploy-manually.md)に記載されています。ここではいくつかの補足を説明します。

* **FEメタデータの動作ロジックをよく理解していない場合、またはFEメタデータの運用保守に十分な経験がない場合は、実際にはFOLLOWER型のFEを1つだけMASTERとして配置し、その他のFEはOBSERVERにすることを強く推奨します。これにより、多くの複雑な運用保守の問題を軽減できます。** MASTERの単一障害点によるメタデータ書き込みの失敗をあまり心配する必要はありません。まず、適切に設定すれば、javaプロセスとしてのFEがハングアップすることは非常に困難です。次に、MASTERのディスクが損傷した場合（確率は非常に低い）でも、OBSERVERのメタデータを使用して`metadata recovery mode`によって手動で復旧できます。

* FEプロセスのJVMは十分なメモリを確保する必要があります。FEのJVMメモリは少なくとも10GB、32GBから64GBにすることを**強く推奨**します。そして、JVMメモリ使用量を監視するための監視を配置してください。FEでOOMが発生すると、メタデータの書き込みが失敗し、**回復不可能な**障害が発生する可能性があるからです！

* FEノードは、過度のメタデータによってディスク容量不足が発生しないよう、十分なディスク容量を確保する必要があります。同時に、FEログも数十ギガバイトのディスク容量を消費します。

## その他の一般的な問題

1. fe.logに`meta out of date. current time: xxx, synchronized time: xxx, has log: xxx, fe type: xxx`が出力される

	これは通常、FEがMasterを選出できないためです。例えば、3つのFOLLOWERが設定されているが、1つのFOLLOWERのみが起動されている場合、このFOLLOWERでこの問題が発生します。通常は、すべてのFOLLOWERを同時に再起動すれば解決します。起動後も問題が解決しない場合は、未知の問題があるかどうかを確認する必要があります。

2. `Clock delta: xxxx ms. between Feeder: xxxx and this Replica exceeds max permissible delta: xxxx ms.`

	Bdbjeでは、ノード間のクロック誤差が特定の閾値を超えてはならないという要件があります。超過すると、ノードは異常終了します。デフォルトの閾値は5000msで、FEパラメータ`max_bdbje_clock_delta_ms`で制御され、適宜変更できます。ただし、NTPなどのクロック同期方法を使用して、Dorisクラスタホストのクロック同期を確保することを推奨します。

3. `image/`ディレクトリのミラーファイルが長期間更新されていない

	Master FEは、デフォルトでメタデータジャーナル50,000件ごとにミラーファイルを生成します。頻繁に使用されるクラスタでは、通常半日から数日ごとに新しいimageファイルが生成されます。imageファイルが長期間（例えば1週間以上）更新されていない場合は、以下の順序で原因を確認できます：

	1. Master FEのfe.logで`memory is not enough to do checkpoint. Committed memory XXXX Bytes, used memory XXXX Bytes. `を検索します。見つかった場合、現在のFEのJVMメモリがimage生成に不足していることを示します（通常、image生成にはFEメモリの半分を予約する必要があります）。その場合、JVMメモリを追加してFEを再起動してから観察する必要があります。Master FEが再起動するたびに、新しいimageが直接生成されます。この再起動方法は、新しいimageを積極的に生成するためにも使用できます。複数のFOLLOWER配置がある場合、現在のMaster FEを再起動すると、別のFOLLOWER FEがMASTERになり、その後のimage生成は新しいMasterの責任となることに注意してください。そのため、すべてのFOLLOWER FEのJVMメモリ設定を変更する必要がある場合があります。

	2. Master FEのfe.logで`begin to generate new image: image.xxxx`を検索します。見つかった場合、imageが生成されています。このスレッドの後続ログを確認し、`checkpoint finished save image.xxxx`が現れれば、imageの書き込みは成功です。`Exception when generating new image file`が発生した場合、生成に失敗しており、具体的なエラーメッセージを確認する必要があります。

4. `bdb/`ディレクトリのサイズが非常に大きく、数GB以上に達している

	新しいimageが生成できないエラーを解消した後も、BDBディレクトリは一定期間大きなままです。Master FEがimageのpushに失敗したことが原因かもしれません。Master FEのfe.logで`push image.XXXX to other nodes. totally XX nodes, push succeeded YY nodes`を検索できます。YYがxxより小さい場合、一部のFEのpushが成功していません。fe.logで具体的なエラー`Exception when pushing image file.url = xxx`を確認できます。

	同時に、FE設定ファイルに設定を追加できます：`edit_log_roll_num = xxxx`。このパラメータはメタデータジャーナルの数を設定し、一度imageを作成します。デフォルトは50000です。この数値を適切に減らして、imageをより頻繁に作成し、古いジャーナルの削除を高速化できます。

5. FOLLOWER FEが次々とハングアップする

	Dorisのメタデータは多数決書き込み戦略を採用しているため、メタデータジャーナルは少なくとも一定数のFOLLOWER FE（例えば、3つのFOLLOWERがある場合、2つが正常に書き込まれる必要がある）に書き込まれなければ成功とみなされません。書き込みが失敗すると、FEプロセスは自発的に終了します。そのため、A、B、CというFOLLOWERが3つあると仮定します。最初にCがハングアップし、次にBがハングアップすると、Aもハングアップします。そのため、`ベストプラクティス`セクションで説明したように、メタデータの運用保守に豊富な経験がない場合は、複数のFOLLOWERを配置することは推奨されません。

6. fe.logで`get exception when try to close previously opened bdb database. ignore it`が出現する

	後ろに`ignore it`という言葉がある場合、通常は対処する必要はありません。興味がある場合は、`BDBEnvironment.java`でこのエラーを検索し、注釈を確認してください。

7. `show frontends;`から見ると、あるFEの`Join`が`true`と表示されているが、実際にはそのFEは異常である

	`show frontends;`で`Join`情報を確認します。この列が`true`の場合、そのFEが**クラスタに参加した**ことのみを意味します。クラスタ内で正常に存在していることを意味するわけではありません。`false`の場合、そのFEが**クラスタに参加したことがない**ことを意味します。

8. FEの`master_sync_policy`、`replica_sync_policy`、および`txn_rollback_limit`の設定

	`master_sync_policy`はLeader FEがメタデータログを書き込む際にfsync()を呼び出すかどうかを指定するために使用され、`replica_sync_policy`はFE HA配置で他のFollower FEが同期メタデータの際にfsync()を呼び出すかどうかを指定するために使用されます。Dorisの初期バージョンでは、これら2つのパラメータはデフォルトで`WRITE_NO_SYNC`、つまりfsync()を呼び出しませんでした。Dorisの最新バージョンでは、デフォルトが`SYNC`、つまりfsync()を呼び出すように変更されました。fsync()の呼び出しにより、メタデータのディスク書き込み効率が大幅に低下します。一部の環境では、IOPSが数百まで低下し、レイテンシが2-3msまで増加する可能性があります（それでもDorisのメタデータ操作には十分です）。そのため、以下の設定を推奨します：

	1. 単一Follower FE配置の場合、`master_sync_policy`を`SYNC`に設定し、FEシステムのダウンタイムによるメタデータの損失を防ぎます。
	2. 複数Follower FE配置の場合、複数システムの同時停止の確率は非常に低いと考えられるため、`master_sync_policy`と`replica_sync_policy`を`WRITE_NO_SYNC`に設定できます。

	単一Follower FE配置で`master_sync_policy`が`WRITE_NO_SYNC`に設定されている場合、FEシステムの停止が発生し、メタデータの損失が発生する可能性があります。この時点で、他のObserver FEが再起動を試行すると、エラーが報告される可能性があります：

    ```
    Node xxx must rollback xx total commits(numPassedDurableCommits of which were durable) to the earliest point indicated by transaction xxxx in order to rejoin the replication group, but the transaction rollback limit of xxx prohibits this.
    ```
これは、永続化された一部のトランザクションをロールバックする必要があるが、エントリ数が上限を超えていることを意味します。ここでのデフォルトの上限は100で、`txn_rollback_limit`を設定することで変更できます。この操作はFEを正常に開始することを試みるためにのみ使用されますが、失われたメタデータは回復できません。
