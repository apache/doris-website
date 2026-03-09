---
{
  "title": "メタデータの運用と保守",
  "language": "ja",
  "description": "この文書では、実際の本番環境におけるDorisメタデータの管理方法に焦点を当てています。FEノードの提案されたデプロイメントを含んでいます。"
}
---
:::warning

絶対に必要でない限り、metadata_failure_recovery の使用は避けてください。これを使用すると、メタデータの切り詰め、損失、スプリットブレインが発生する可能性があります。不適切な操作による不可逆的なデータ損傷を防ぐため、慎重に使用してください。
:::

このドキュメントは、実際の本番環境でDorisメタデータを管理する方法に焦点を当てています。FEノードの推奨デプロイメント、一般的に使用される運用方法、および一般的なエラー解決方法が含まれています。

まず、[Dorisメタデータ設計ドキュメント](/community/design/metadata-design)を読んで、Dorisメタデータがどのように動作するかを理解してください。

## 重要なヒント

* 現在のメタデータ設計は後方互換性がありません。つまり、新しいバージョンに新しいメタデータ構造の変更がある場合（FEコードの`FeMetaVersion.java`ファイルに新しいVERSIONがあるかどうかで確認できます）、通常、新しいバージョンにアップグレード後、古いバージョンにロールバックすることは不可能です。そのため、FEをアップグレードする前に、[アップグレードドキュメント](../../admin-manual/cluster-management/upgrade.md)の操作に従って、メタデータの互換性を必ずテストしてください。

## メタデータカタログ構造

fe.confで指定された`meta_dir`のパスが`path/to/doris-meta`であると仮定します。通常のDorisクラスターでは、メタデータのディレクトリ構造は次のようになります：

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

	分散KVシステムとして[bdbje](https://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html)を使用してメタデータjournalを保存しています。このBDBディレクトリはbdbjeの「dataディレクトリ」に相当します。

	`.jdb`サフィックスはbdbjeのデータファイルです。これらのデータファイルはメタデータjournalの増加に伴って増加します。Dorisが定期的にimageを完了すると、古いlogが削除されます。通常、これらのデータファイルの合計サイズは数MBから数GB（インポート頻度など、Dorisの使用方法に依存）で変動します。データファイルの合計サイズが10GBを超える場合、imageが失敗したか、imageの配布に失敗した履歴journalが削除できない可能性を疑う必要があります。

	`je.info.0`はbdbjeの実行ログです。このログの時刻はUTC+0タイムゾーンです。このログから、bdbjeがどのように動作するかも確認できます。

2. imageディレクトリ

	imageディレクトリは、Dorisが定期的に生成するメタデータミラーを保存するために使用されます。通常、`image.xxxxx`ミラーファイルが表示されます。`xxxxx`は数字です。この数字は、imageが`xxxx`より前のすべてのメタデータjournalを含むことを示しています。このファイルの生成時刻（`ls -al`で確認）は、通常ミラーの生成時刻です。

	`image.ckpt`ファイルも表示される場合があります。これは生成中のメタデータミラーです。`du -sh`コマンドを実行すると、ファイルサイズが増加していることが表示され、ミラーコンテンツがファイルに書き込まれていることを示します。ミラーが書き込まれると、自動的に新しい`image.xxxxx`に名前を変更し、古いimageファイルを置き換えます。

	Masterロールを持つFEのみが定期的にimageファイルを積極的に生成します。生成後、FEは他の非Masterロールにプッシュします。他のすべてのFEがこのimageを受信したことが確認されると、Master FEはbdbje内のメタデータjournalを削除します。したがって、image生成が失敗するか、他のFEへのimageプッシュが失敗すると、bdbje内のデータが蓄積されます。

	`ROLE`ファイルはFEのタイプ（FOLLOWERまたはOBSERVER）を記録するテキストファイルです。

	`VERSION`ファイルはDorisクラスターのクラスターIDとノード間のアクセス認証に使用されるトークンを記録するテキストファイルです。

	`ROLE`ファイルと`VERSION`ファイルは同時に存在する場合もあれば、同時に存在しない場合もあります（例：初回起動時）。

## 基本操作

### 単一ノードFEの起動

単一ノードFEは最も基本的なデプロイメントモードです。完全なDorisクラスターには少なくとも1つのFEノードが必要です。FEノードが1つのみの場合、ノードのタイプはFollowerでロールはMasterです。

1. 初回起動

	1. fe.confで指定された`meta_dir`のパスが`path/to/doris-meta`であると仮定します。
	2. `path/to/doris-meta`が既に存在し、権限が正しく、ディレクトリが空であることを確認してください。
	3. `bash bin/start_fe.sh --daemon`で直接起動してください。
	4. 起動後、fe.logに以下のログが表示されます：

		* Palo FE starting...
		* image does not exist: /path/to/doris-meta/image/image.0
		* transfer from INIT to UNKNOWN
		* transfer from UNKNOWN to MASTER
		* the very first time to open bdb, dbname is 1
		* start fencing, epoch number is 1
		* finish replay in xxx msec
		* QE service start
		* thrift server started

		上記のログは必ずしもこの順序である必要はありませんが、基本的に類似しています。

	5. 単一ノードFEの初回起動は通常問題に遭遇しません。上記のログが表示されない場合、一般的にはドキュメントの手順に従っていない可能性があります。関連するwikiを注意深くお読みください。

2. 再起動

	1. 停止したFEノードは`bash bin/start_fe.sh`を使用して再起動できます。
	2. 再起動後、fe.logに以下のログが表示されます：

		* Palo FE starting...
		* finished to get cluster id: xxxx, role: FOLLOWER and node name: xxxx
		* 再起動前にimageが生成されていない場合：
		* image does not exist: /path/to/doris-meta/image/image.0

		* 再起動前にimageが生成されている場合：
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

		上記のログは必ずしもこの順序である必要はありませんが、基本的に類似しています。

3. よくある問題

	単一ノードFEのデプロイメントでは、起動停止は通常問題に遭遇しません。質問がある場合は、関連するWikiを参照し、操作手順を注意深く確認してください。

### FEの追加

FEプロセスの追加は[弾性拡張ドキュメント](../../admin-manual/cluster-management/elastic-expansion.md)で詳しく説明されており、ここでは繰り返しません。以下に注意点とよくある問題を示します。

1. 注意点

	* 新しいFEを追加する前に、現在のMaster FEが正常に動作していることを確認してください（接続が正常、JVMが正常、image生成が正常、bdbjeデータディレクトリが大きすぎない等）
	* 新しいFEを初めて起動する際は、Master FEを指す`--helper`パラメータを追加する必要があります。再起動時には`--helper`を追加する必要はありません。（`--helper`が指定されている場合、FEは直接helperノードにロールを問い合わせます。指定されていない場合、FEは`doris-meta/image/`ディレクトリの`ROLE`と`VERSION`ファイルから情報を取得しようとします。
	* 新しいFEを初めて起動する際は、FEの`meta_dir`が作成され、正しい権限を持ち、空であることを確認する必要があります。
	* 新しいFEの起動と`ALTER SYSTEM ADD FOLLOWER/OBSERVER`文の実行によるFEのメタデータへの追加は、順序が要求されません。新しいFEを最初に起動し、文を実行しない場合、新しいFEログに`current node is not added to the group. Please add it first.`が表示されます。文が実行されると、正常なプロセスに入ります。
	* 前のFEが正常に追加された後に、次のFEを追加するようにしてください。
	* MASTER FEに接続して`ALTER SYSTEM ADD FOLLOWER/OBSERVER`文を実行してください。

2. よくある問題

	1. this need is DETACHED

		追加するFEを初めて起動する際、Master FEのdoris-meta/bdb内のデータが大きい場合、追加するFEログに`this node is DETACHED.`という文字が表示される場合があります。この時点で、bdbjeはデータをコピーしており、追加するFEの`bdb/`ディレクトリが成長していることが確認できます。このプロセスは通常数分かかります（bdbjeのデータ量に依存）。その後、fe.logにbdbje関連のエラースタック情報が表示される場合があります。最終的なログに`QE service start`と`thrift server start`が表示されれば、起動は通常成功です。mysql-clientを介してこのFEに接続を試してください。これらの文字が表示されない場合、bdbjeレプリケーションログタイムアウトの問題の可能性があります。この場合、FEを直接再起動すると通常問題が解決されます。

	2. 様々な理由による追加の失敗

		* OBSERVERを追加する場合、OBSERVERタイプのFEはメタデータ書き込みの過半数に参加しないため、理論的には自由に起動停止できます。したがって、OBSERVER追加失敗の場合、OBSERVERプロセスを直接killできます。OBSERVERのメタデータディレクトリをクリアした後、再度プロセスを追加してください。

		* FOLLOWERを追加する場合、FOLLOWERは参加メタデータによって大部分が書き込まれます。そのためFOLLOWERがbdbje選挙チームに参加している可能性があります。FOLLOWERノードが2つのみの場合（MASTERを含む）、1つのFEを停止すると、大部分の時間書き込みができないため、もう1つのFEが終了する可能性があります。この場合、まず`ALTER SYSTEM DROP FOLLOWER`コマンドを使用してメタデータから新しく追加したFOLLOWERノードを削除し、その後FOLLOWERプロセスをkillし、メタデータを空にして再度プロセスを追加してください。


### FEの削除

対応するタイプのFEは`ALTER SYSTEM DROP FOLLOWER/OBSERVER`コマンドで削除できます。以下の点に注意してください：

* OBSERVERタイプのFEの場合、直接DROPで十分で、リスクはありません。

* FOLLOWERタイプのFEの場合、まず奇数個のFOLLOWER（3個以上）から削除を開始することを確認してください。

	1. 非MASTERロールのFEを削除する場合は、MASTER FEに接続してDROPコマンドを実行してからプロセスをkillすることをお勧めします。
	2. MASTER FEを削除したい場合は、まず`奇数個`のFOLLOWER FE`が存在し、正常に動作していることを確認してください。その後、まずMASTER FEプロセスをkillしてください。この時点で、1つのFEがMASTERに選出されます。残りのFEが正常に動作していることを確認した後、新しいMASTER FEに接続してDROPコマンドを実行し、古いMASTER FEを削除してください。

## 高度な操作

### FEメタデータリカバリモード

`メタデータリカバリモード`の不適切な使用や誤った操作は、本番環境で不可逆的なデータ損傷を引き起こす可能性があります。したがって、`メタデータリカバリモード`を操作するためのドキュメントは提供されません。真の必要性がある場合は、Dorisコミュニティの開発者にサポートを求めてください。

### FEタイプの変更

既存のFOLLOWER/OBSERVERタイプのFEをOBSERVER/FOLLOWERタイプに変更する必要がある場合は、上記の方法でFEを削除してから、対応するタイプのFEを追加してください。

### FEの移行

1つのFEを現在のノードから別のノードに移行する必要がある場合、いくつかのシナリオがあります。

1. 非MASTERノードのFOLLOWER、またはOBSERVERの移行

	新しいFOLLOWER/OBSERVERを直接追加した後、古いFOLLOWER/OBSERVERを削除してください。

2. 単一ノードMASTERの移行

    開発者の場合、`メタデータリカバリモード`を使用して操作を実行できます。ただし、ユーザーの場合、`メタデータリカバリモード`の使用は推奨されません。環境を再構築し、外部テーブルを使用してデータを転送することをお勧めします。

3. 一組のFOLLOWERを一組のノードから別の新しいノードセットに移行

	新しいノードにFEをデプロイし、FOLLOWERの追加により新しいノードを最初に追加してください。古いノードはDROPにより1つずつドロップできます。DROP-by-DROPプロセスで、MASTERは自動的に新しいFOLLOWERノードを選択します。

### FEポートの置換

FEには現在以下のポートがあります

* Ed_log_port: bdbjeの通信ポート
* http_port: httpポート、imageのプッシュにも使用
* rpc_port: Frontendのthrift serverポート
* query_port: MySQL接続ポート
* arrow_flight_sql_port: Arrow Flight SQL接続ポート

1. edit_log_port

	このポートを置換する必要がある場合、複数のfeノードがデプロイされている場合は、古いノードを削除してノード管理手順で新しいノードを追加できます。単一ノードの場合は、上記の「単一ノードMASTER移行」を参照して単一Masterfeノードを移行できます。

2. http_port

	すべてのFE http_portは一貫している必要があります。したがって、このポートを変更したい場合は、すべてのFEを停止し、変更してから同時に再起動する必要があります。

3. rpc_port

	設定を変更した後、FEを直接再起動してください。Master FEはハートビートを通じてBEに新しいポートを通知します。Master FEのこのポートのみが使用されます。ただし、すべてのFEポートの一貫性を保つことを推奨します。

4. query_port

	設定を変更した後、FEを直接再起動してください。これはmysqlの接続ターゲットにのみ影響します。

5. arrow_flight_sql_port

	設定を変更した後、FEを直接再起動してください。これはarrow flight sqlサーバー接続ターゲットにのみ影響します。

### BDBJEのデータの表示（デバッグのみに使用）

FEのメタデータログはKey-Value形式でBDBJEに保存されます。一部の異常な状況では、メタデータエラーによりFEが起動できない場合があります。この場合、DorisはユーザーがBDBJEに保存されているデータを照会してトラブルシューティングを支援する方法を提供しています。

まず、fe.confに設定を追加する必要があります：`enable_bdbje_debug_mode=true`、その後`bash start_fe.sh --daemon`でFEを起動してください。

この時点で、FEはデバッグモードに入り、httpサーバーとMySQLサーバーのみを起動し、BDBJEインスタンスを開きますが、メタデータやその他の後続起動プロセスは読み込みません。

この時、FEのWebページにアクセスするか、MySQLクライアントを通じてDorisに接続した後、`show proc "/bdbje";`を通じてBDBJEに保存されているデータを表示できます。

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
第1レベルディレクトリには、BDBJEのすべてのデータベース名と各データベースのエントリ数が表示されます。

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
2番目のレベルに入ると、指定されたデータベース配下のすべてのエントリキーが一覧表示されます。

```
mysql> show proc "/bdbje/110589/114861";
+-----------+--------------+---------------------------------------------+
| JournalId | OpType       | Data                                        |
+-----------+--------------+---------------------------------------------+
| 114861    | OP_HEARTBEAT | org.apache.doris.persist.HbPackage@6583d5fb |
+-----------+--------------+---------------------------------------------+
1 row in set (0.05 sec)
```
3つ目のレベルでは、指定されたキーの値情報を表示できます。

## ベストプラクティス

FEのデプロイメント推奨については、インストールおよび[デプロイメントドキュメント](../../../../docs/install/deploy-manually/integrated-storage-compute-deploy-manually)に記載されています。以下にいくつかの補足事項を示します。

* **FEメタデータの動作ロジックをよく理解していない場合、またはFEメタデータの運用保守に十分な経験がない場合は、実際には1つのFOLLOWER型のFEのみをMASTERとしてデプロイし、他のFEをOBSERVERとして運用することを強く推奨します。これにより、多くの複雑な運用保守の問題を軽減できます。** MASTERの単一障害点によるメタデータ書き込み失敗について心配する必要はありません。第一に、適切に設定すれば、javaプロセスとしてのFEがハングアップすることは非常に困難です。第二に、MASTERのディスクが損傷した場合（確率は非常に低い）でも、OBSERVERのメタデータを使用して`metadata recovery mode`による手動復旧が可能です。

* FEプロセスのJVMは十分なメモリを確保する必要があります。FEのJVMメモリは最低10GB、できれば32GBから64GBにすることを**強く推奨**します。そして、JVMメモリ使用量を監視するためのモニタリングをデプロイしてください。FEでOOMが発生すると、メタデータの書き込みが失敗し、**復旧不可能**な障害を引き起こす可能性があります！

* FEノードは、過度なメタデータによるディスク容量不足を防ぐために、十分なディスク容量を持つ必要があります。同時に、FEログも十数ギガバイトのディスク容量を占有します。

## その他の一般的な問題

1. fe.logで`meta out of date. current time: xxx, synchronized time: xxx, has log: xxx, fe type: xxx`が出力される

	これは通常、FEがMasterを選出できないことが原因です。例えば、3つのFOLLOWERが設定されているが、1つのFOLLOWERのみが起動されている場合、このFOLLOWERがこの問題を引き起こします。通常は、すべてのFOLLOWERを同時に再起動するだけで解決します。起動後も問題が解決しない場合は、未知の問題があるかどうかを確認する必要があります。

2. `Clock delta: xxxx ms. between Feeder: xxxx and this Replica exceeds max permissible delta: xxxx ms.`

	Bdbjeでは、ノード間の時刻誤差が特定の閾値を超えないことが要求されます。超過した場合、ノードは異常終了します。デフォルトの閾値は5000msで、FEパラメータ`max_bdbje_clock_delta_ms`によって制御され、適切に変更できます。ただし、NTPなどの時刻同期方式を使用してDorisクラスタホストの時刻同期を確保することを推奨します。

3. `image/`ディレクトリ内のミラーファイルが長時間更新されていない

	Master FEは、デフォルトで50,000個のメタデータジャーナルごとにミラーファイルを生成します。頻繁に使用されるクラスタでは、通常半日から数日ごとに新しいimageファイルが生成されます。imageファイルが長時間（例：1週間以上）更新されていない場合は、以下の順序で原因を確認してください：

	1. Master FEのfe.logで`memory is not enough to do checkpoint. Committed memory XXXX Bytes, used memory XXXX Bytes.`を検索してください。見つかった場合、現在のFEのJVMメモリがimage生成に不十分であることを示します（通常、image生成にはFEメモリの半分を予約する必要があります）。その後、JVMメモリを追加してFEを再起動してから観察する必要があります。Master FEを再起動するたびに、新しいimageが直接生成されます。この再起動方法は、新しいimageを積極的に生成するためにも使用できます。複数のFOLLOWERがデプロイされている場合、現在のMaster FEを再起動すると、別のFOLLOWER FEがMASTERになり、その後のimage生成は新しいMasterが担当することになることに注意してください。そのため、すべてのFOLLOWER FEのJVMメモリ設定を変更する必要がある場合があります。

	2. Master FEのfe.logで`begin to generate new image: image.xxxx`を検索してください。見つかった場合、imageが生成されています。このスレッドの後続ログを確認し、`checkpoint finished save image.xxxx`が表示されればimageの書き込みが成功です。`Exception when generating new image file`が発生した場合は生成が失敗しており、具体的なエラーメッセージを確認する必要があります。

4. `bdb/`ディレクトリのサイズが非常に大きく、数Gまたはそれ以上に達している

	新しいimageを生成できないエラーを解消した後も、BDBディレクトリはしばらく大きなサイズのままになります。Master FEがimageのpushに失敗している可能性があります。Master FEのfe.logで`push image.XXXX to other nodes. totally XX nodes, push succeeded YY nodes`を検索できます。YYがxxより小さい場合、一部のFEが正常にpushされていません。fe.logで具体的なエラー`Exception when pushing image file.url = xxx`を確認できます。

	同時に、FE設定ファイルに設定を追加できます：`edit_log_roll_num = xxxx`。このパラメータは、メタデータジャーナルの数を設定し、一度imageを作成します。デフォルトは50000です。この数値を適切に減らすことで、imageをより頻繁に作成し、古いジャーナルの削除を加速できます。

5. FOLLOWER FEが次々とハングアップする

	Dorisのメタデータは多数決書き込み戦略を採用しているため、メタデータジャーナルは少なくとも一定数のFOLLOWER FE（例：3つのFOLLOWERの場合、2つが正常に書き込まれる必要がある）に書き込まれてから成功とみなされます。書き込みが失敗した場合、FEプロセスは自発的に終了します。そのため、3つのFOLLOWER：A、B、Cがあると仮定します。最初にCがハングアップし、次にBがハングアップすると、Aもハングアップします。そのため、`Best Practices`セクションで説明したように、メタデータの運用保守に豊富な経験がない場合は、複数のFOLLOWERをデプロイすることは推奨されません。

6. fe.log中出現`get exception when try to close previously opened bdb database. ignore it`

	その後に`ignore it`という語がある場合、通常は対処する必要はありません。興味がある場合は、`BDBEnvironment.java`でこのエラーを検索し、注釈を確認してください。

7. `show frontends;`から見ると、あるFEの`Join`が`true`と表示されているが、実際にはFEが異常である

	`show frontends;`で`Join`情報を確認してください。この列が`true`の場合、FEが**クラスタに参加した**ことのみを意味します。クラスタ内で正常に存在していることを意味するものではありません。`false`の場合、FEが**クラスタに参加したことがない**ことを意味します。

8. FEの`master_sync_policy`、`replica_sync_policy`、`txn_rollback_limit`の設定

	`master_sync_policy`は、Leader FEがメタデータログを書き込む際にfsync()を呼び出すかどうかを指定するために使用され、`replica_sync_policy`は、FE HAデプロイメントで同期メタデータを行う際に他のFollower FEがfsync()を呼び出すかどうかを指定するために使用されます。Dorisの初期バージョンでは、これら2つのパラメータのデフォルトは`WRITE_NO_SYNC`、つまりfsync()が呼び出されませんでした。Dorisの最新バージョンでは、デフォルトが`SYNC`に変更され、つまりfsync()が呼び出されます。fsync()を呼び出すと、メタデータディスク書き込みの効率が大幅に低下します。一部の環境では、IOPSが数百に低下し、レイテンシが2-3msに増加する可能性があります（それでもDorisのメタデータ操作には十分です）。そのため、以下の設定を推奨します：

	1. 単一Follower FEデプロイメントの場合、`master_sync_policy`を`SYNC`に設定し、FEシステムのダウンタイムによるメタデータ損失を防ぎます。
	2. 複数Follower FEデプロイメントの場合、`master_sync_policy`と`replica_sync_policy`を`WRITE_NO_SYNC`に設定できます。複数システムが同時に停止する確率は非常に低いと考えるためです。

	単一Follower FEデプロイメントで`master_sync_policy`が`WRITE_NO_SYNC`に設定されている場合、FEシステム停止が発生し、メタデータが失われる可能性があります。この時点で、他のObserver FEが再起動を試みると、エラーが報告される可能性があります：

    ```
    Node xxx must rollback xx total commits(numPassedDurableCommits of which were durable) to the earliest point indicated by transaction xxxx in order to rejoin the replication group, but the transaction rollback limit of xxx prohibits this.
    ```
これは、永続化されたいくつかのトランザクションをロールバックする必要があるが、エントリ数が上限を超えていることを意味します。ここでのデフォルトの上限は100で、`txn_rollback_limit`を設定することで変更できます。この操作はFEを正常に起動させることのみを目的としており、失われたメタデータを回復することはできません。
