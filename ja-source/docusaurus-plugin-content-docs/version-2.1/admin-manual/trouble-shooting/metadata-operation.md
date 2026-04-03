---
{
  "title": "メタデータ操作と保守",
  "language": "ja",
  "description": "この文書では、実際の本番環境におけるDorisメタデータの管理方法に焦点を当てています。FEノードの推奨デプロイメントを含んでいます。"
}
---
:::warning

metadata_failure_recovery は絶対に必要な場合を除いて使用を避けてください。これを使用すると、メタデータの切り捨て、消失、スプリットブレインが発生する可能性があります。不適切な操作による不可逆的なデータ損傷を防ぐため、慎重に使用してください。
:::

このドキュメントは、実際の本番環境でDorisメタデータを管理する方法に焦点を当てています。FEノードの推奨デプロイメント、一般的に使用される運用方法、および一般的なエラー解決方法が含まれています。

まず、[Dorisメタデータ設計ドキュメント](/community/design/metadata-design)を読んで、Dorisメタデータの動作を理解してください。

## 重要なヒント

* 現在のメタデータ設計は後方互換性がありません。つまり、新しいバージョンに新しいメタデータ構造の変更がある場合（FEコードの`FeMetaVersion.java`ファイルに新しいVERSIONがあるかどうかで確認できます）、通常、新しいバージョンにアップグレードした後は古いバージョンにロールバックすることは不可能です。したがって、FEをアップグレードする前に、[アップグレードドキュメント](../../admin-manual/cluster-management/upgrade.md)の操作に従ってメタデータ互換性を必ずテストしてください。

## メタデータカタログ構造

fe.confで指定される`meta_dir`のパスが`path/to/doris-meta`であると仮定しましょう。通常のDorisクラスターでは、メタデータのディレクトリ構造は以下のようになります：

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

	分散型kVシステムとして[bdbje](https://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html)を使用してメタデータジャーナルを保存します。このBDBディレクトリはbdbjeの「データディレクトリ」に相当します。

	`.jdb`サフィックスはbdbjeのデータファイルです。これらのデータファイルは、メタデータジャーナルの数の増加とともに増加します。Dorisが定期的にイメージを完成すると、古いログは削除されます。そのため通常、これらのデータファイルの合計サイズは数MBから数GB（インポート頻度など、Dorisの使用方法に依存）の範囲で変動します。データファイルの合計サイズが10GBより大きい場合は、イメージが失敗したか、イメージの配布に失敗した履歴ジャーナルが削除できなかった可能性を考慮する必要があるかもしれません。

	`je.info.0`はbdbjeの実行ログです。このログの時刻はUTC+0タイムゾーンです。これは後のバージョンで修正する予定です。このログからbdbjeの一部の動作を確認することもできます。

2. imageディレクトリ

	imageディレクトリは、Dorisによって定期的に生成されるメタデータミラーを保存するために使用されます。通常、`image.xxxxx`ミラーファイルが表示されます。ここで`xxxxx`は数字です。この数字は、イメージが`xxxx`以前のすべてのメタデータジャーナルを含んでいることを示しています。そしてこのファイルの生成時刻（`ls -al`で表示）は、通常ミラーの生成時刻です。

	`image.ckpt`ファイルも表示される場合があります。これは生成中のメタデータミラーです。`du -sh`コマンドではファイルサイズが増加していることが示され、ミラーコンテンツがファイルに書き込まれていることを示しています。ミラーが書き込まれると、自動的に新しい`image.xxxxx`にリネームされ、古いイメージファイルを置き換えます。

	Master役割を持つFEのみが定期的にイメージファイルを積極的に生成します。各生成後、FEは他の非Master役割にプッシュされます。他のすべてのFEがこのイメージを受信したことが確認されると、Master FEはbdbje内のメタデータジャーナルを削除します。そのため、イメージ生成が失敗するか、他のFEへのイメージプッシュが失敗すると、bdbje内のデータが蓄積されます。

	`ROLE`ファイルはFEのタイプ（FOLLOWERまたはOBSERVER）を記録し、これはテキストファイルです。

	`VERSION`ファイルはDorisクラスターのクラスターIDとノード間のアクセス認証に使用されるトークンを記録し、これもテキストファイルです。

	`ROLE`ファイルと`VERSION`ファイルは、同時に存在する場合もあれば、同時に存在しない場合もあります（例：初回起動時）。

## 基本操作

### シングルノードFEの起動

シングルノードFEは最も基本的なデプロイメントモードです。完全なDorisクラスターには少なくとも1つのFEノードが必要です。FEノードが1つだけの場合、ノードのタイプはFollowerで、役割はMasterです。

1. 初回起動

	1. fe.confで指定された`meta_dir`のパスが`path/to/doris-meta`であると仮定します。
	2. `path/to/doris-meta`が既に存在し、権限が正しく、ディレクトリが空であることを確認してください。
	3. `sh bin/start_fe.sh`を通じて直接起動します。
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

		上記のログは必ずしもこの順序である必要はありませんが、基本的に類似しています。

	5. シングルノードFEの初回起動は通常問題に遭遇しません。上記のログが確認できない場合、一般的にはドキュメントの手順を注意深く守っていないことが原因です。関連するwikiを注意深く読んでください。

2. 再起動

	1. 停止されたFEノードは`sh bin/start_fe.sh`を使用して再起動できます。
	2. 再起動後、fe.logで以下のログが確認できるはずです：

		* Palo FE starting...
		* finished to get cluster id: xxxx, role: FOLLOWER and node name: xxxx
		* 再起動前にイメージが生成されていない場合：
		* image does not exist: /path/to/doris-meta/image/image.0

		* 再起動前にイメージが生成されている場合：
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

	シングルノードFEのデプロイメントでは、起動・停止で通常問題は発生しません。問題がある場合は、関連するWikiを参照し、操作手順を注意深く確認してください。

### FEの追加

FEプロセスの追加については[Elastic Expansion Documents](../../admin-manual/cluster-management/elastic-expansion.md)で詳細に説明されており、ここでは繰り返しません。以下は注意点と一般的な問題です。

1. 注意点

	* 新しいFEを追加する前に、現在のMaster FEが正常に動作していることを確認してください（接続が正常、JVMが正常、イメージ生成が正常、bdbjeデータディレクトリが大きすぎないなど）
	* 新しいFEを初回起動する際は、Master FEを指す`--helper`パラメータを必ず追加してください。再起動時には`--helper`を追加する必要はありません。（`--helper`が指定されている場合、FEは直接helperノードに自分の役割を問い合わせます。指定されていない場合、FEは`doris-meta/image/`ディレクトリの`ROLE`および`VERSION`ファイルから情報を取得しようとします。）
	* 新しいFEを初回起動する際は、FEの`meta_dir`が作成され、正しい権限を持ち、空であることを確認してください。
	* 新しいFEの起動と`ALTER SYSTEM ADD FOLLOWER/OBSERVER`文の実行でメタデータにFEを追加する順序は必須ではありません。新しいFEを先に起動し、文を実行しない場合、新しいFEログに`current node is not added to the group. Please add it first.`が表示されます。文が実行されると、通常のプロセスに入ります。
	* 前のFEの追加が成功した後で、次のFEを追加することを確認してください。
	* MASTER FEに接続し、`ALTER SYSTEM ADD FOLLOWER/OBSERVER`文を実行してください。

2. よくある問題

	1. this need is DETACHED

		追加予定のFEを初回起動する際、Master FE上のdoris-meta/bdb内のデータが大きい場合、追加予定のFEログに`this node is DETACHED`の文字が表示される場合があります。この時、bdbjeはデータをコピーしており、追加予定のFEの`bdb/`ディレクトリが増大していることが確認できます。このプロセスは通常数分かかります（bdbje内のデータ量に依存）。その後、fe.logにbdbje関連のエラースタック情報が表示される場合があります。最終的なログに`QE service start`と`thrift server start`が表示されれば、通常起動は成功しています。mysql-clientを通じてこのFEへの接続を試すことができます。これらの文字が表示されない場合、bdbje複製ログタイムアウトの問題である可能性があります。この時点で、FEを直接再起動すれば通常問題は解決されます。

	2. 様々な理由による追加失敗

		* OBSERVERを追加する場合、OBSERVER型FEはメタデータ書き込みの過半数に参加しないため、理論的には自由に起動・停止できます。そのため、OBSERVER追加失敗の場合、OBSERVER FEのプロセスを直接killできます。OBSERVERのメタデータディレクトリをクリアした後、再度プロセスを追加してください。

		* FOLLOWERを追加する場合、FOLLOWERは参加メタデータの過半数によって書き込まれるため、FOLLOWERがbdbje選出チームに参加している可能性があります。FOLLOWER ノードが2つだけの場合（MASTERを含む）、1つのFEを停止すると、過半数の時間を書き込めないため、もう1つのFEが終了する可能性があります。この時点では、まず`ALTER SYSTEM DROP FOLLOWER`コマンドを通じて新しく追加されたFOLLOWERノードをメタデータから削除し、その後FOLLOWERプロセスをkillし、メタデータを空にして再度プロセスを追加する必要があります。


### FEの削除

`ALTER SYSTEM DROP FOLLOWER/OBSERVER`コマンドによって対応するタイプのFEを削除できます。以下の点に注意が必要です：

* OBSERVER型FEについては、直接DROPで十分で、リスクはありません。

* FOLLOWER型FEについては、まず奇数個のFOLLOWER（3個以上）を開始して削除することを確認する必要があります。

	1. 非MASTER役割のFEを削除する場合、Master FEに接続してDROPコマンドを実行し、その後プロセスをkillすることを推奨します。
	2. MASTER FEを削除したい場合は、まず奇数個のFOLLOWER FEが存在し、正常に動作していることを確認してください。その後、まずMASTER FEプロセスをkillします。この時点で、1つのFEがMASTERに選出されます。残りのFEが正常に動作していることを確認した後、新しいMASTER FEに接続してDROPコマンドを実行し、古いMASTER FEを削除します。

## 高度な操作

### 障害回復

FEは何らかの理由でbdbjeの起動やFE間の同期に失敗する場合があります。現象には、メタデータの書き込み不可、MASTERの不在などがあります。この時点で、手動でFEを復旧する必要があります。FEの手動復旧の一般原則は、現在の`meta_dir`内のメタデータを通じて新しいMASTERを起動し、その後他のFEを1つずつ追加することです。以下の手順に厳密に従ってください：

1. まず、**すべてのFEプロセスとすべてのビジネスアクセスを停止します**。メタデータ復旧中に、外部アクセスが他の予期しない問題を引き起こさないことを確認してください。（そうでなければ、split-brain問題を引き起こす可能性があります）

2. どのFEノードのメタデータが最新かを特定します：

	* まず、**すべてのFEの`meta_dir`ディレクトリを必ずバックアップしてください。**
	* 通常、Master FEのメタデータが最新です。`meta_dir/image`ディレクトリ内のimage.xxxxファイルの接尾辞を確認できます。数字が大きいほど、メタデータが新しくなります。
	* 通常、すべてのFOLLOWER FEイメージファイルを比較することで、最新のメタデータを見つけることができます。
	* その後、最新のメタデータを持つFEノードを使用して復旧します。
	* OBSERVERノードのメタデータを使用して復旧するとより面倒になるため、可能な限りFOLLOWERノードを選択することを推奨します。

3. 手順2で選択されたFEノードで以下の操作を実行します。

	1. fe.confを変更
       - ノードがOBSERVERの場合、まず`meta_dir/image/ROLE`ファイル内の`role=OBSERVER`を`role=FOLLOWER`に変更してください。（OBSERVERノードからの復旧はより煩雑になるため、まずここの手順に従い、後で別途説明します）
       - fe.version < 2.0.2の場合、fe.confに設定を追加：`metadata_failure_recovery=true`。
	2. `sh bin/start_fe.sh --metadata_failure_recovery --daemon`を実行してFEを起動します。（OBSERVERノードから復旧している場合は、この手順の後、後続のOBSERVERドキュメントにジャンプしてください。）
	3. 正常な場合、FEはMASTERの役割で起動し、前のセクション`シングルノードFEの起動`の説明と同様です。fe.logで`transfer from XXXX to MASTER`という文字が確認できるはずです。
	4. 起動完了後、まずFEに接続し、いくつかのクエリインポートを実行して正常にアクセスできるかどうかを確認してください。操作が正常でない場合、間違っている可能性があります。上記の手順を注意深く読み、以前にバックアップしたメタデータを使用して再試行することを推奨します。それでもだめな場合は、問題がより深刻である可能性があります。
	5. 成功した場合、`show frontends;`コマンドを通じて、以前に追加したすべてのFEが表示され、現在のFEがmasterであることが確認できるはずです。
    6. **FEバージョン < 2.0.2の場合**、fe.conf内の`metadata_failure_recovery=true`設定項目を削除するか`false`に設定し、FEを再起動してください（**重要**）。

	:::tip
	 OBSERVERノードからメタデータを復旧している場合、上記の手順を完了した後、現在のFE役割がOBSERVERであるが、`IsMaster`が`true`と表示されていることがわかります。これは、ここで見られる「OBSERVER」がDorisのメタデータに記録されているのに対し、masterかどうかはbdbjeのメタデータに記録されているためです。OBSERVERノードから復旧したため、不一致が生じました。この問題を修正するために以下の手順を実行してください（後のバージョンで修正予定）：

	 1. まず、この「OBSERVER」以外のすべてのFEノードをDROPで除外します。

	 2. `ADD FOLLOWER`コマンドを通じて新しいFOLLOWER FEを追加し、hostAにあると仮定します。

	 3. hostAで新しいFEを起動し、`helper`によってクラスターに参加させます。

	 4. 起動成功後、`show frontends;`文を通じて2つのFEが確認できるはずです。1つは以前のOBSERVER、もう1つは新しく追加されたFOLLOWERで、OBSERVERがmasterです。

	 5. 新しいFOLLOWERが正常に動作していることを確認した後、新しいFOLLOWERメタデータを使用して障害復旧操作を再度実行します。
	 
	 6. 上記手順の目的は、人工的にFOLLOWERノードのメタデータを製造し、このメタデータを使用して障害復旧を再起動することです。これにより、OBSERVERからメタデータを復旧することで生じる不一致を回避します。

	`metadata_failure_recovery`の意味は、`bdbje`のメタデータを空にすることです。これにより、bdbjeは以前の他のFEとは接触せず、独立したFEとして起動します。このパラメータは復旧起動時のみtrueに設定する必要があります。復旧後は必ずfalseに設定する必要があります。そうでなければ、一度再起動するとbdbjeのメタデータが再び空になり、他のFEが正常に動作できなくなります。
	:::

4. 手順3の実行が成功した後、`ALTER SYSTEM DROP FOLLOWER/OBSERVER`コマンドを使用して以前のFEをメタデータから削除し、新しいFEを追加する方法で再度追加します。

5. 上記の操作が正常であれば、復旧されます。

### FEタイプの変更

既存のFOLLOWER/OBSERVERタイプFEをOBSERVER/FOLLOWERタイプに変更する必要がある場合は、上記で説明した方法でFEを削除し、その後対応するタイプのFEを追加してください。

### FE移行

1つのFEを現在のノードから別のノードに移行する必要がある場合、いくつかのシナリオがあります。

1. 非MASTERノードのFOLLOWER、またはOBSERVER移行

	新しいFOLLOWER/OBSERVERを直接追加した後、古いFOLLOWER/OBSERVERを削除します。

2. シングルノードMASTER移行

	FEが1つしかない場合は、`障害回復`セクションを参照してください。FEのdoris-metaディレクトリを新しいノードにコピーし、`障害回復`セクションの手順3で新しいMASTERを起動します

3. 一連のFOLLOWERを一組のノードから別の一組の新しいノードに移行

	新しいノードにFEをデプロイし、FOLLOWERを追加することで新しいノードを最初に追加します。古いノードはDROPで1つずつドロップできます。DROP-by-DROPのプロセスで、MASTERは自動的に新しいFOLLOWERノードを選択します。

### FEポートの置き換え

FEには現在以下のポートがあります

* Ed_log_port: bdbjeの通信ポート
* http_port: httpポート、イメージのプッシュにも使用
* rpc_port:  Frontendのthrift serverポート
* query_port: Mysql接続ポート
* arrow_flight_sql_port: Arrow Flight SQL接続ポート

1. edit_log_port

	このポートを置き換える必要がある場合は、`障害回復`セクションの操作を参照して復旧する必要があります。ポートがbdbje自体のメタデータに永続化されているため（Doris自体のメタデータにも記録）、FE起動時に`metadata_failure_recovery`を設定してbdbjeのメタデータをクリアする必要があります。

2. http_port

	すべてのFE http_portは一致している必要があります。このポートを変更したい場合は、すべてのFEを変更して再起動する必要があります。複数のFOLLOWERデプロイメントの場合、このポートの変更はより複雑になります（鶏と卵の問題...）ので、この操作は推奨されません。必要な場合は、`障害回復`セクションの操作に直接従ってください。

3. rpc_port

	設定を変更した後、FEを直接再起動します。Master FEはheartbeatを通じてBEに新しいポートを通知します。Master FEのこのポートのみが使用されます。ただし、すべてのFEポートが一致していることを推奨します。

4. query_port

	設定を変更した後、FEを直接再起動します。これはmysqlの接続ターゲットにのみ影響します。

5. arrow_flight_sql_port

	設定を変更した後、FEを直接再起動します。これはarrow flight sql serverの接続ターゲットにのみ影響します。

### FEメモリからのメタデータ復旧
極端な場合において、ディスク上のイメージファイルが破損している可能性がありますが、メモリ内のメタデータは完全である場合があります。この時点で、メモリからメタデータをダンプし、ディスク上のイメージファイルを置き換えてメタデータを復旧できます。クエリサービスを停止しない操作手順は以下の通りです：

1. すべてのLoad、Create、Alter操作を停止します。

2. 以下のコマンドを実行してMaster FEメモリからメタデータをダンプします：（以下image_memと呼びます）

```
curl -u $root_user:$password http://$master_hostname:8030/dump
```
3. OBSERVER FE ノードの `meta_dir/image` ディレクトリ内の image ファイルを image_mem ファイルに置き換え、OBSERVER FE ノードを再起動し、image_mem ファイルの整合性と正確性を確認します。FE Web ページで DB と Table メタデータが正常かどうか、`fe.log` に例外があるかどうか、正常に replayed jour されているかどうかを確認できます。

    1.2.0 以降では、`image_mem` ファイルを検証するために以下の方法を使用することを推奨します：

    ```
    sh start_fe.sh --image path_to_image_mem
    ```
> 注意: `path_to_image_mem` は `image_mem` のパスです。
    >
    > 検証が成功した場合、`Load image success. Image file /absolute/path/to/image.xxxxxx is valid` が出力されます。
    >
    > 検証が失敗した場合、`Load image failed. Image file /absolute/path/to/image.xxxxxx is invalid` が出力されます。

4. FOLLOWER FE ノードの `meta_dir/image` ディレクトリ内のイメージファイルを image_mem ファイルに順次置き換え、FOLLOWER FE ノードを再起動し、メタデータとクエリサービスが正常であることを確認します。

5. Master FE ノードの `meta_dir/image` ディレクトリ内のイメージファイルを image_mem ファイルに置き換え、Master FE ノードを再起動し、FE Master の切り替えが正常であり、Master FE ノードが checkpoint を通じて新しいイメージファイルを生成できることを確認します。

6. すべての Load、Create、Alter 操作を復旧します。

**注意: Image ファイルが大きい場合、全体のプロセスに長時間かかる可能性があるため、この間は Master FE が checkpoint を通じて新しいイメージファイルを生成しないようにしてください。Master FE ノードの meta_dir/image ディレクトリ内の image.ckpt ファイルが image.xxx ファイルと同じ大きさになったことが確認できた場合、image.ckpt ファイルを直接削除できます。**

### BDBJE 内のデータを表示する

FE のメタデータログは Key-Value の形式で BDBJE に格納されます。一部の異常な状況では、メタデータのエラーにより FE が起動できない場合があります。このような場合、Doris では BDBJE に格納されているデータをクエリしてトラブルシューティングを支援する方法を提供しています。

まず、fe.conf に設定を追加する必要があります: `enable_bdbje_debug_mode=true`、その後 `sh start_fe.sh --daemon` を通じて FE を起動します。

この時、FE はデバッグモードに入り、http server と MySQL server のみを起動し、BDBJE インスタンスを開きますが、メタデータやその他の後続の起動プロセスは読み込みません。

この時、FE の Web ページにアクセスするか、MySQL クライアントを通じて Doris に接続した後、`show proc "/bdbje";` を通じて BDBJE に格納されているデータを表示できます。

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

FEのデプロイメント推奨事項は、インストールおよび[デプロイメントドキュメント](../../install/deploy-manually/integrated-storage-compute-deploy-manually)で説明されています。ここではいくつかの補足を述べます。

* **FEメタデータの操作ロジックをよく理解していない場合、またはFEメタデータの運用保守に十分な経験がない場合、実際には1つのFOLLOWER型FEのみをMASTERとしてデプロイし、他のFEはOBSERVERにすることを強く推奨します。これにより、多くの複雑な運用保守問題を軽減できます。** MASTERの単一障害点によるメタデータ書き込み障害についてはあまり心配する必要はありません。まず、適切に設定すれば、javaプロセスとしてのFEがハングアップすることは非常に困難です。次に、MASTERディスクが損傷した場合（確率は非常に低い）でも、OBSERVERのメタデータを使用して`fault recovery`により手動で復旧することができます。

* FEプロセスのJVMは十分なメモリを確保する必要があります。FEのJVMメモリは少なくとも10GB、32GBから64GBにすることを**強く推奨**します。そして、JVMメモリ使用量を監視するためのモニタリングをデプロイしてください。FEでOOMが発生すると、メタデータ書き込みが失敗し、**回復不可能**な障害が発生する可能性があります！

* FEノードは、過剰なメタデータによるディスク容量不足を防ぐために十分なディスク領域を確保する必要があります。同時に、FEログも十数ギガバイトのディスク容量を使用します。

## その他の一般的な問題

1. fe.logで`meta out of date. current time: xxx, synchronized time: xxx, has log: xxx, fe type: xxx`が出力される

	これは通常、FEがMasterを選出できないためです。例えば、3つのFOLLOWERが設定されているが、1つのFOLLOWERのみが起動されている場合、このFOLLOWERがこの問題を引き起こします。通常は、残りのFOLLOWERを起動するだけです。起動後も問題が解決しない場合は、`Failure Recovery`セクションの方法に従って手動復旧が必要になる可能性があります。

2. `Clock delta: xxxx ms. between Feeder: xxxx and this Replica exceeds max permissible delta: xxxx ms.`

	Bdbjeは、ノード間のクロック誤差が一定の閾値を超えないことを要求します。超過した場合、ノードは異常終了します。デフォルトの閾値は5000msで、FEパラメータ`max_bdbje_clock_delta_ms`によって制御され、適切に変更できます。しかし、NTPなどのクロック同期方法を使用してDorisクラスターホストのクロック同期を確保することを推奨します。

3. `image/`ディレクトリ内のミラーファイルが長時間更新されていない

	Master FEはデフォルトでメタデータジャーナル50,000件ごとにミラーファイルを生成します。頻繁に使用されるクラスターでは、通常半日から数日ごとに新しいイメージファイルが生成されます。イメージファイルが長時間（例：1週間以上）更新されていない場合は、以下の順序で原因を確認できます：

	1. Master FEのfe.logで`memory is not enough to do checkpoint. Committed memory XXXX Bytes, used memory XXXX Bytes. `を検索します。見つかった場合、現在のFEのJVMメモリがイメージ生成に不十分であることを示します（通常、イメージ生成にはFEメモリの半分を予約する必要があります）。その場合、JVMメモリを追加してFEを再起動してから観察する必要があります。Master FEが再起動するたびに、新しいイメージが直接生成されます。この再起動方法は、新しいイメージを積極的に生成するためにも使用できます。複数のFOLLOWERがデプロイされている場合、現在のMaster FEを再起動すると、別のFOLLOWER FEがMASTERになり、その後のイメージ生成は新しいMasterの責任になることに注意してください。そのため、すべてのFOLLOWER FEのJVMメモリ設定を変更する必要がある場合があります。

	2. Master FEのfe.logで`begin to generate new image: image.xxxx`を検索します。見つかった場合、イメージが生成されています。このスレッドの後続ログを確認し、`checkpoint finished save image.xxxx`が表示されればイメージの書き込みが成功しています。`Exception when generating new image file`が発生した場合は生成に失敗しており、具体的なエラーメッセージを確認する必要があります。

4. `bdb/`ディレクトリのサイズが非常に大きく、数Gまたはそれ以上に達している

	新しいイメージが生成できないエラーを解消した後、BDBディレクトリはしばらくの間大きなままになります。Master FEがイメージのプッシュに失敗したことが原因の可能性があります。Master FEのfe.logで`push image.XXXX to other nodes. totally XX nodes, push succeeded YY nodes`を検索できます。YYがXXより小さい場合、一部のFEへのプッシュが成功していません。fe.logで具体的なエラー`Exception when pushing image file.url = xxx`を確認できます。

	同時に、FE設定ファイルに設定を追加できます：`edit_log_roll_num = xxxx`。このパラメータはメタデータジャーナルの数を設定し、一度にイメージを作成します。デフォルトは50000です。この数値を適切に減らしてイメージをより頻繁に作成し、古いジャーナルの削除を加速できます。

5. FOLLOWER FEが次々にハングアップする

	Dorisのメタデータは多数決書き込み戦略を採用しているため、メタデータジャーナルは成功と見なされる前に、少なくとも一定数のFOLLOWER FE（例：3つのFOLLOWERの場合、2つが正常に書き込まれる必要がある）に書き込まれる必要があります。書き込みが失敗した場合、FEプロセスは自発的に終了します。したがって、3つのFOLLOWER A、B、Cがあると仮定します。Cが最初にハングアップし、その後Bがハングアップすると、Aもハングアップします。そのため、`Best Practices`セクションで説明されているように、メタデータの運用保守に豊富な経験がない場合は、複数のFOLLOWERをデプロイすることは推奨されません。

6. fe.logで`get exception when try to close previously opened bdb database. ignore it`が出現する

	後に`ignore it`という文言がある場合、通常は対処する必要はありません。興味がある場合は、`BDBEnvironment.java`でこのエラーを検索し、注釈を確認してください。

7. `show frontends;`から見ると、あるFEの`Join`が`true`と表示されているが、実際にはFEが異常である

	`show frontends;`で`Join`情報を確認します。この列が`true`の場合、FEが**クラスターに参加した**ことのみを意味します。クラスター内でまだ正常に存在していることを意味するものではありません。`false`の場合、FEが**クラスターに参加したことがない**ことを意味します。

8. FEの`master_sync_policy`、`replica_sync_policy`、および`txn_rollback_limit`の設定

	`master_sync_policy`はLeader FEがメタデータログを書き込む際にfsync()を呼び出すかどうかを指定するために使用され、`replica_sync_policy`はFE HAデプロイでメタデータを同期する際に他のFollower FEがfsync()を呼び出すかどうかを指定するために使用されます。Dorisの以前のバージョンでは、これら2つのパラメータはデフォルトで`WRITE_NO_SYNC`、つまりfsync()を呼び出しませんでした。Dorisの最新バージョンでは、デフォルトが`SYNC`、つまりfsync()を呼び出すように変更されました。fsync()の呼び出しは、メタデータディスク書き込みの効率を大幅に低下させます。一部の環境では、IOPSが数百に低下し、レイテンシが2-3msに増加する場合があります（ただし、Dorisメタデータ操作には十分です）。そのため、以下の設定を推奨します：

	1. 単一Follower FEデプロイメントの場合、`master_sync_policy`を`SYNC`に設定し、FEシステムのダウンタイムによるメタデータ損失を防ぎます。
	2. 複数Follower FEデプロイメントの場合、`master_sync_policy`と`replica_sync_policy`を`WRITE_NO_SYNC`に設定できます。複数システムの同時停止の確率は非常に低いと考えるためです。

	単一Follower FEデプロイメントで`master_sync_policy`を`WRITE_NO_SYNC`に設定した場合、FEシステム停止が発生し、メタデータ損失が生じる可能性があります。この時点で、他のObserver FEが再起動を試みると、エラーが報告される場合があります：

    ```
    Node xxx must rollback xx total commits(numPassedDurableCommits of which were durable) to the earliest point indicated by transaction xxxx in order to rejoin the replication group, but the transaction rollback limit of xxx prohibits this.
    ```
これは、永続化されたいくつかのトランザクションをロールバックする必要があるが、エントリ数が上限を超えていることを意味します。ここでのデフォルトの上限は100で、`txn_rollback_limit`を設定することで変更できます。この操作はFEを正常に起動させることを試みるためにのみ使用されますが、失われたメタデータを回復することはできません。
