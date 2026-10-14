---
{
    "title": "04 Doris クラスターへのアクセス",
    "language": "ja",
    "description": "Kubernetes 上の Doris クラスターに ClusterIP、NodePort、LoadBalancer の各モードでアクセスする方法を説明します。MySQL クライアントによる接続と StreamLoad の設定も扱います。",
    "keywords": ["Doris クラスターへのアクセス", "MySQL クライアント", "ClusterIP", "NodePort", "LoadBalancer", "StreamLoad", "Service", "K8s"]
}
---

Kubernetes は Service を使用して VIP と負荷分散の機能を提供します。Service には、外部への公開方法として `ClusterIP`、`NodePort`、`LoadBalancer` の三つのモードがあります。

## ClusterIP モード

Kubernetes 上の Doris は、デフォルトで [ClusterIP アクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を使用します。ClusterIP アクセスモードでは Kubernetes クラスター内に内部アドレスが提供され、Kubernetes 内でのサービスのアドレスとして機能します。

初回デプロイ後は、次のように `root` ユーザーを使用し、パスワードなしで MySQL プロトコル経由で Doris にアクセスできます。

### ステップ 1：Service を確認する

クラスターをデプロイした後、次のコマンドを実行して Doris Operator が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のとおりです。

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

上記の結果では、FE と BE にそれぞれ `internal` と `service` の接尾辞が付いた二種類の Service があります。

- 接尾辞が `internal` の Service は、ハートビートやデータ交換など Doris 内部の通信専用であり、外部には公開されません。

- 接尾辞が `service` の Service は、クラスターのサービスへのアクセスに使用します。

### ステップ 2：Doris にアクセスする

ClusterIP モードは Kubernetes 内でのみ使用できます。次のコマンドを実行して、現在の Kubernetes クラスター内に MySQL クライアントを含む Pod を作成します。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

コンテナー内では、接尾辞が `service` の Service 名を指定して Doris クラスターに接続できます。

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## NodePort モード {#nodeport-mode}

DorisCluster のアクセス設定で [NodePort アクセスモードを設定](install-config-cluster.md#nodeport)した後、次の手順に従い、`root` ユーザーを使用してパスワードなしで MySQL プロトコル経由で FE にアクセスします。

### ステップ 1：Service を確認する

クラスターのデプロイ後、次のコマンドを実行して `Service` を確認します。

```shell
kubectl get service
```

結果は次のとおりです。

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### ステップ 2：Doris にアクセスする

MySQL 接続を例に説明します。Doris のデフォルトの Query Port は 9030 です。上記の例では、ポート 9030 がローカルポート 31545 にマッピングされています。Doris クラスターにアクセスするには、クラスター内のノードの IP アドレスを取得する必要があります。次のコマンドを実行して確認します。

```shell
kubectl get nodes -owide
```

結果は次のとおりです。

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

NodePort モードでは、任意のノードの IP アドレスとマッピングされたホストポートを使用して、Kubernetes クラスター内のサービスにアクセスできます。この例で使用できるノードの IP アドレスには、192.168.88.61、192.168.88.62、192.168.88.63 があります。次の例では、ノード 192.168.88.62 と `query port` からマッピングされたホストポート 31545 を使用して Doris に接続します。

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## LoadBalancer モード {#loadbalancer-mode}

パブリッククラウドで DorisCluster のアクセス設定により [LoadBalancer アクセスモードを設定](install-config-cluster.md#loadbalancer)した後、次の手順に従い、`root` ユーザーを使用してパスワードなしで MySQL プロトコル経由で FE にアクセスします。

### ステップ 1：Service を確認する

クラスターをデプロイした後、次のコマンドを実行し、`Service` の中から `Doris` へのアクセスに使用できるものを確認します。

```shell
kubectl get service
```

結果は次のとおりです。

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### ステップ 2：Doris にアクセスする

MySQL 接続を例に説明します。

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Kubernetes 上にデプロイした Doris に StreamLoad でアクセスする
Doris は StreamLoad モードによるデータのインポートをサポートしています。クライアントと Doris クラスターが同じ LAN 内にある場合、クライアントは FE のアドレスをリクエスト先として直接使用できます。FE の Service はリクエストを受け取ると、アクセス可能な BE アドレスとともに HTTP 301 ステータスコードを返し、その BE アドレスにデータのインポートリクエストを送るようクライアントに指示します。Kubernetes 上にデプロイした Doris クラスターは、Kubernetes 内からのみアクセスできるアドレスを使って通信します。StreamLoad でアクセス可能な FE アドレスを設定しても、FE が 301 の仕組みで返す BE アドレスは Kubernetes 内からしかアクセスできないため、Kubernetes 外のクライアントからのデータインポートは失敗します。

Kubernetes 外のクライアントが StreamLoad を使用して、Kubernetes 上にデプロイした Doris クラスターへデータをインポートする場合は、外部からアクセスできる BE アドレスを StreamLoad のインポート先アドレスとして設定する必要があります。
### BE の Service を外部からアクセスできるように設定する
BE の `Service` を、[NodePort](install-config-cluster.md#nodeport) または [LoadBalancer](install-config-cluster.md#loadbalancer) の設定に従って Kubernetes クラスター外からアクセスできるようにします。その後、Doris クラスターをデプロイする `DorisCluster` リソースを更新します。

### BE のプロキシアドレスを設定する
[NodePort モード](#nodeport-mode)または [LoadBalancer モード](#loadbalancer-mode)で説明したアクセスアドレスの取得方法に従い、Kubernetes 外からアクセスできるアドレスと、web_server サービスに対応するポートを取得します。取得したアドレスとポートを、StreamLoad によるデータインポートで使用するリクエスト先アドレスとして設定します。
