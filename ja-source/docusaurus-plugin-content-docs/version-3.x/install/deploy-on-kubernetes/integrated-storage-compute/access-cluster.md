---
{
  "title": "クラスターにアクセス",
  "language": "ja",
  "description": "Kubernetesは、Service を VIP (Virtual IP) およびロードバランサーとして使用することを提供します。Service には 3 つの外部公開モードがあります：ClusterIP、"
}
---
Kubernetesは、VIP（Virtual IP）およびロードバランサーとしてServiceの使用を提供します。Serviceには3つの外部公開モードがあります：ClusterIP、NodePort、LoadBalancerです。
## ClusterIP
DorisはKubernetes上でデフォルトでClusterIPアクセスモードを提供します。ClusterIPアクセスモードは、Kubernetesクラスタ内で内部IPアドレスを提供し、この内部IPを通じてサービスを公開します。ClusterIPモードでは、サービスはクラスタ内でのみアクセス可能です。
### ステップ1：Serviceの取得
クラスタをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されたサービスを確認できます：

```shell
kubectl -n doris get svc
```
返された結果は以下の通りです：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
上記の結果では、FEとBE用に2種類のサービスがあり、それぞれ"internal"と"service"のサフィックスが付いています：
- "internal"サフィックス付きのサービスは、ハートビート、データ交換、その他の操作などのDoris内部での内部通信にのみ使用でき、外部使用は想定されていません。
- "service"サフィックス付きのサービスはユーザーが使用できます。

### Step 2: Dorisへのアクセス

以下のコマンドを使用して、現在のKubernetesクラスタ内にmysqlクライアントを含むpodを作成できます：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
クラスター内のコンテナから、外部に公開されている「service」サフィックス付きのサービス名を使用してDorisクラスターにアクセスできます：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
## NodePort
DorisClusterアクセス設定セクションに従い、[アクセスモードをNodePortを使用するように設定](install-config-cluster.md#nodeport)した後、rootパスワードなしモードでMySQLプロトコルを使用してFEにアクセスできます。手順は以下の通りです：
### ステップ1: サービスの取得
クラスターのデプロイ後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを確認できます：

```shell
kubectl get service
```
返された結果は以下の通りです：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### Step 2: Dorisへのアクセス
NodePort経由でDorisにアクセスするには、Node IPとマップされたポートを知る必要があります。以下を使用してnode IPを取得できます：

```shell
  kubectl get nodes -owide
```
出力例::

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
その後、任意のノードのIPアドレス（例：192.168.88.61、192.168.88.62、または192.168.88.63）とマップされたポートを使用してDorisにアクセスできます。例えば、ノード192.168.88.62とポート31545を使用する場合：

```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
```
## LoadBalancer
DorisClusterのアクセス設定セクションに従い、パブリッククラウドプラットフォームにおいて、[アクセスモードをLoadBalancerを使用するよう設定](install-config-cluster.md#loadbalancer)した後、rootパスワードなしモードでMySQLプロトコルを使用してFEにアクセスできます。手順は以下の通りです：
### ステップ1: サービスの取得
クラスタをデプロイした後、以下のコマンドを使用してDoris Operatorによって公開されているサービスを表示できます：

```shell
kubectl get service
```
返される結果は以下の通りです：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### ステップ2: Dorisへのアクセス
LoadBalancerを通じてDorisにアクセスするには、外部IP（EXTERNAL-IPフィールドで提供される）と対応するポートを使用します。例えば、`mysql`コマンドを使用する場合：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```
## Kubernetes上にデプロイされたDorisへのStreamLoadアクセス
DorisはStreamLoad方式を使用したデータインポートをサポートしています。クライアントとDorisクラスターが同じローカルネットワーク内にある場合、クライアントはFrontend (FE)アドレスを直接リクエストエンドポイントとして使用できます。FEサービスはHTTP 301ステータスコードで応答し、Backend (BE)アドレスを提供して、クライアントにデータインポートのためにBEへリクエストをリダイレクトするよう指示します。

ただし、DorisがKubernetes上にデプロイされている場合、内部通信はKubernetesクラスター内でのみアクセス可能なアドレスを使用します。FEが301リダイレクトメカニズムを通じて内部でのみ到達可能なBEアドレスを返した場合、Kubernetesクラスター外のクライアントからのデータインポート試行は失敗します。

Kubernetes環境外に配置されたクライアントからStreamLoadを使用してデータをインポートするには、外部からアクセス可能なBEアドレスでインポートアドレスを設定する必要があります。

### BEサービスへの外部アクセス設定
Kubernetesクラスター外からBEサービスへのアクセスを有効にするには、サービスを[NodePort](install-config-cluster.md#nodeport)または[LoadBalancer](install-config-cluster.md#loadbalancer)のいずれかとして設定します。これらの変更を適用するために`DorisCluster`リソースを適切に更新してください。

### BEプロキシアドレスの設定
[NodePort](#nodeport)または[LoadBalancer](#loadbalancer)の説明に従って外部からアクセス可能なアドレスと対応する`web_server`ポートを取得してください。StreamLoad経由でデータをインポートする際は、このアドレスとポートをリクエストエンドポイントとして使用してください。
