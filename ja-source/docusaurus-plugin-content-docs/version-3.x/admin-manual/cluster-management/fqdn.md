---
{
  "title": "FQDN",
  "language": "ja",
  "description": "この記事では、FQDN（Fully Qualified Domain Name）に基づいたApache Dorisの使用を有効にする方法を紹介します。"
}
---
この記事では、FQDN（Fully Qualified Domain Name）に基づいたApache Dorisの使用を有効にする方法を紹介します。FQDNは、インターネット上の特定のコンピュータまたはホストの完全なドメイン名です。

DorisがFQDNをサポートした後、ノード間の通信は完全にFQDNに基づいて行われます。さまざまなタイプのノードを追加する際は、FQDNを直接指定する必要があります。例えば、BEノードを追加するコマンドは`ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port"`です。

`be_host`は以前はBEノードのIPアドレスでした。FQDNを開始した後、be_hostはBEノードのFQDNを指定する必要があります。

## 前提条件

1. fe.confファイルで`enable_fqdn_mode = true`を設定。
2. クラスタ内のすべてのマシンにホスト名を設定する必要があります。
3. クラスタ内の各マシンの`/etc/hosts`ファイルに、クラスタ内の他のマシンに対応するIPアドレスとFQDNを指定する必要があります。
4. `/etc/hosts`ファイルに重複するIPアドレスがあってはいけません。

## ベストプラクティス

### 新しいクラスタでFQDNを有効にする

1. マシンを準備します。例えば、3FE 3BEのクラスタをデプロイしたい場合、6台のマシンを準備できます。
2. 各マシンで`hostname`を実行すると、一意の結果が返されます。6台のマシンの実行結果がそれぞれfe1、fe2、fe3、be1、be2、be3であると仮定します。
3. 6台のマシンの`/etc/hosts`に、6つのFQDNに対応する実際のIPを設定します。例えば：

   ```
   172.22.0.1 fe1
   172.22.0.2 fe2
   172.22.0.3 fe3
   172.22.0.4 be1
   172.22.0.5 be2
   172.22.0.6 be3
   ```
4. 検証: FE1で 'ping fe2' が実行でき、正しいIPアドレスを解決してpingできることで、ネットワーク環境が利用可能であることを示しています。
5. 各FEノードの fe.conf 設定 ` enable_ fqdn_ mode = true`。
6. [Standard deployment](../../../../docs/install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してください
7. 必要に応じて6台のマシンにbrokerをデプロイするためにいくつかのマシンを選択し、`ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;`を実行します。

### K8SでのDorisのデプロイ

PodのK8sによる予期しない再起動の後、K8sはPodのIPが変更されないことを保証できませんが、ドメイン名が変更されないことは保証できます。この機能に基づいて、DorisでFQDNを有効にすると、予期しない再起動の後でもPodが正常にサービスを提供し続けることができます。

K8sでのDorisのデプロイ方法については[Kubernetes Deployment](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator)を参照してください

### サーバーのIP変更

'Enable FQDN for new cluster'に従ってクラスターをデプロイした後、ネットワークカードの切り替えやマシンの交換など、マシンのIPを変更したい場合は、各マシンの'/etc/hosts'を変更するだけで済みます。

### 既存クラスターでのFQDN有効化

前提条件: 現在のプログラムが'Alter SYSTEM MODIFY FRONTEND'<fe_ip>:<edit_log_port>'HOSTNAME'<fe_hostname>'構文をサポートしていること。
サポートしていない場合は、この構文をサポートするバージョンにアップグレードしてください

>注意してください。
>
> 以下の操作を実行するには少なくとも3つのfollowerが必要です。そうでなければクラスターが正常に起動しない可能性があります

次に、以下の手順に従ってください:

1. FollowerとObserverノードで以下の操作を一つずつ実行します（最後にMasterノードで実行）:

   1. ノードを停止します。
   2. ノードが停止したかどうか確認します。MySQLクライアントを通じて'show frontends'を実行してFEノードのAliveステータスを表示し、falseになるまで確認します
   3. ノードにFQDNを設定: `ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>"`（masterを停止した後、新しいmasterノードが選択され、SQL文の実行に使用されます）
   4. ノード設定を変更します。FEルートディレクトリの'conf/fe.conf'ファイルを変更し、設定を追加: `enable_fqdn_mode = true`。対応するfe.configに設定を追加した後、新しく停止したノードが正常に起動できない場合は、停止したfeノードを起動する前に、すべてのfe.configに設定'enable_fqdn_mode=true'を追加してください。
   5. ノードを起動します。

2. BEノードでのFQDN有効化は、MySQLを通じて以下のコマンドを実行するだけで済み、BEを再起動する必要はありません。

   `ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>"`、HeartbeatPortの番号が不明な場合は、`show backends`コマンドを使用してこのポートを見つけてください。


## よくある問題

- 設定項目enable_ fqdn_ modeは自由に変更できますか？

  任意に変更することはできません。この設定を変更するには、'Enable FQDN for old cluster'の手順に従ってください。
