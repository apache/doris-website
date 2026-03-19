---
{
  "title": "FQDN",
  "language": "ja",
  "description": "この記事では、FQDN（Fully Qualified Domain Name）に基づいてApache Dorisの使用を有効にする方法について紹介します。"
}
---
この記事では、FQDN（Fully Qualified Domain Name）に基づいたApache Dorisの使用を有効にする方法を紹介します。FQDNはインターネット上の特定のコンピューターまたはホストの完全なドメイン名です。

DorisがFQDNをサポートした後、ノード間の通信は完全にFQDNに基づいて行われます。様々なタイプのノードを追加する際は、FQDNを直接指定する必要があります。例えば、BEノードを追加するコマンドは `ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port"` で、`be_host` は以前はBEノードのIPアドレスでした。FQDNを開始した後、be_hostはBEノードのFQDNを指定する必要があります。

## 前提条件

1. fe.confファイルで `enable_fqdn_mode = true` を設定する。
2. クラスター内のすべてのマシンにホスト名が設定されている必要がある。
3. クラスター内の各マシンの `/etc/hosts` ファイルに、クラスター内の他のマシンに対応するIPアドレスとFQDNを指定する必要がある。
4. /etc/hostsファイルに重複するIPアドレスがあってはならない。

## ベストプラクティス

### 新しいクラスターでFQDNを有効にする

1. マシンを準備する。例えば、3FE 3BEのクラスターをデプロイしたい場合は、6台のマシンを準備できます。
2. 各マシンで `host` を実行した際に一意の結果が返される。6台のマシンの実行結果がそれぞれfe1、fe2、fe3、be1、be2、be3であると仮定します。
3. 6台のマシンの `/etc/hosts` に6つのFQDNに対応する実際のIPを設定する。例えば：

   ```
   172.22.0.1 fe1
   172.22.0.2 fe2
   172.22.0.3 fe3
   172.22.0.4 be1
   172.22.0.5 be2
   172.22.0.6 be3
   ```
4. 検証: FE1で'ping fe2'を実行でき、正しいIPアドレスを解決してpingできることで、ネットワーク環境が利用可能であることを示しています。
5. 各FEノードのfe.conf設定 ` enable_ fqdn_ mode = true`。
6. [Standard deployment](../../install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してください。
7. 必要に応じて6台のマシンにbrokerをデプロイするためにいくつかのマシンを選択し、`ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;`を実行します。

### K8SでのDorisのデプロイメント

Podの予期しない再起動後、K8sはPodのIPが変更されないことを保証できませんが、ドメイン名が変更されないことを保証できます。この機能に基づき、DorisがFQDNを有効にすると、Podが予期しない再起動後も正常にサービスを提供できることを保証できます。

K8sでDorisをデプロイする方法については[Kubernetes Deployment](../../install/deploy-on-kubernetes/install-doris-operator)を参照してください。

### サーバーIP変更

'新しいクラスターでのFQDN有効化'に従ってクラスターをデプロイした後、ネットワークカードの切り替えやマシンの交換など、マシンのIPを変更したい場合は、各マシンの'/etc/hosts'を変更するだけです。

### 既存クラスターでのFQDN有効化

前提条件: 現在のプログラムが`ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>"`構文をサポートしていること。
サポートしていない場合は、この構文をサポートするバージョンにアップグレードしてください。

>注意してください。
>
> 以下の操作を実行するには少なくとも3つのfollowerが必要です。そうでなければクラスターが正常に起動しない可能性があります。

次に、以下の手順に従ってください：

1. FollowerおよびObserverノードで順番に以下の操作を実行します（最後にMasterノードで実行）：

   1. ノードを停止します。
   2. ノードが停止したかどうかを確認します。MySQLクライアント経由で'show frontends'を実行してFEノードのAlive状態を表示し、falseになるまで待ちます。
   3. ノードにFQDNを設定：`ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>"`（masterを停止した後、新しいmasterノードが選択され、SQL文の実行に使用されます）
   4. ノード設定を変更します。FEルートディレクトリの'conf/fe.conf'ファイルを変更し、設定を追加します：`enable_fqdn_mode = true`。対応するfe.configに設定を追加した後、新しく停止したノードが正常に起動できない場合は、停止したばかりのfeノードを起動する前に、すべてのfe.configに設定'enable_fqdn_mode=true'を追加してください。
   5. ノードを起動します。

2. BEノードでのFQDN有効化は、MySQL経由で以下のコマンドを実行するだけで、BEを再起動する必要はありません。

   `ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>"`、HeartbeatPortの番号が分からない場合は、`show backends`コマンドを使用してこのポートを見つけてください。

## よくある問題

- 設定項目enable_ fqdn_ modeは自由に変更できますか？

  任意に変更することはできません。この設定を変更するには、'既存クラスターでのFQDN有効化'の手順に従ってください。
