---
{
    "title": "Alibaba Cloud Container Service への Doris クラスターのデプロイ",
    "sidebar_label": "Alibaba Cloud Container Service でのデプロイに関する推奨事項",
    "language": "ja",
    "description": "Alibaba Cloud ACK/ACS への Doris のデプロイガイド。環境の確認、設定の調整、イメージレジストリの設定、一般的なトラブルシューティングを説明します。BE ノードが起動しない、スワップが無効化されていない、Huge Page のメモリ設定に問題があるといった事象に対処します。"
}
---

## Alibaba Cloud Container Service の概要

Alibaba Cloud は、次の二つのコンテナサービスを提供しています。

| サービス | 説明 | 利用シナリオ |
|------|------|----------|
| **ACK**（Container Service for Kubernetes） | ECS インスタンスを購入して利用するマネージドコンテナサービス。システムを全面的に制御できます | 基盤となる ECS を制御する必要がある場合、または BE ノードを特権モードでデプロイする場合 |
| **ACS**（Container Service ACS） | K8s をインターフェースとするクラウドコンピューティングサービス。従量課金制で、基盤となる ECS の管理は不要です | インフラ管理を伴わない、従量課金制の柔軟なコンピューティングリソースが必要な場合 |

このドキュメントでは、それぞれのサービスで Doris Operator を使ってクラスターをデプロイする方法を説明します。

## ACK へのデプロイ

ACK は、ECS インスタンスを購入して利用するマネージドコンテナサービスで、システムパラメーターの調整を全面的に制御できます。Alibaba Cloud Linux 3 イメージを使用する場合、現在のシステムパラメーターは Doris の実行要件をすべて満たします。他のイメージでは、K8s の特権モードを使用してコンテナ内でパラメーターを修正できます。

**ACK と Doris Operator を使用してデプロイする場合、ECS のデフォルト設定の大部分は要件を満たし、満たさないパラメーターは Operator が修正します。**

### シナリオ 1：既存のクラスター

コンテナサービスのクラスターを作成済みの場合は、次の手順でパラメーターを確認し、修正します。

#### ステップ 1：スワップの状態を確認する

```bash
swapon --show
```

**期待される結果**：出力がないこと（スワップが無効）。スワップが有効であることを示す出力がある場合は、`swapoff -a` を実行して再起動します。

#### ステップ 2：ファイルハンドル数の上限を確認する

```bash
ulimit -n
```

**期待される結果**：65535 以上。これより小さい場合は、`/etc/security/limits.conf` に以下を追加します。

```shell
* soft nofile 1000000
* hard nofile 1000000
```

#### ステップ 3：仮想メモリ領域の数を確認する

```bash
sysctl vm.max_map_count
```

**期待される結果**：262144 以上。変更が必要な場合は、`sysctl -w vm.max_map_count=2000000` を実行します。

#### ステップ 4：Transparent Huge Pages を確認する

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**期待される結果**：`[never]` を含むこと。値が `[always]` の場合は、次を実行します。

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

詳細は、[OS の確認](../../preparation/os-checking.md)を参照してください。

### シナリオ 2：新しいクラスター

新しいクラスターを作成するには、Alibaba Cloud Container Service ACK コンソールで「クラスターの作成」（Create Cluster）をクリックします。**ノードプールの設定**（Node Pool Configuration）ステップで、「インスタンスの事前カスタムデータ」（Instance Pre-Custom Data）に次のスクリプトを追加します。

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set virtual memory area count
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
   echo "* soft nofile 1000000" >> "$config_file"
   echo "* hard nofile 1000000" >> "$config_file"
fi
```

変更を有効にするため、クラスターの起動後にノードを再起動します。

## ACS へのデプロイ

ACS は K8s をインターフェースとするクラウドコンピューティングサービスで、従量課金制の柔軟なコンピューティングリソースを提供します。基盤となる ECS の管理は不要ですが、BE ノードの起動時にシステムパラメーター（`vm.max_map_count` など）を変更するには特権モードが必要です。

:::tip ヒント
現在のクラスターで特権モードを使用できない場合、BE ノードを起動できません。代わりに ACK とホストマシンを使用したデプロイを検討してください。
:::

### ステップ 1：イメージレジストリを設定する

ACS では、対応する Alibaba Cloud のイメージレジストリである [Container Registry（ACR）](https://www.alibabacloud.com/en/product/container-registry)の使用が推奨されます。Personal Edition と Enterprise Edition が利用できます。

公式の Doris イメージを Alibaba Cloud のイメージレジストリに移行した後、プライベートイメージを使用する場合は Secret を作成します。

```bash
kubectl create secret docker-registry image-hub-secret \
  --docker-server={your-server} \
  --docker-username={your-username} \
  --docker-password={your-pwd}
```

### ステップ 2：プライベートイメージを使用するように DCR を設定する

DorisCluster CR で `imagePullSecrets` を設定します。

```yaml
spec:
  feSpec:
    replicas: 1
    image: <your-acr-registry>/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: <your-acr-registry>/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: <your-acr-registry>/selectdb-test/alpine:latest
```

### ステップ 3：Service を設定する

ACS には従来の Node という概念がないため、Service では NodePort モードを使用できません。使用可能なモードは次のとおりです。

#### ClusterIP モード（デフォルト）

Operator のデフォルトのネットワークモードです。[Kubernetes の Service ドキュメント](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を参照してください。

#### Load Balancer モード

**方法 1：DCR でアノテーションを設定する**

```yaml
feSpec:
  replicas: 3
  image: <your-image>
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
```

**方法 2：ACS コンソールで管理する**

1. DCR で serviceType を ClusterIP（デフォルト）に設定します。
2. ACS コンソールで「コンテナコンピューティングサービス ACS」（Container Compute Service ACS）→「クラスター一覧」（Cluster List）→「クラスター」（Cluster）→「サービス」（Services）→「作成」（Create）に進みます。
3. 新しく作成した LB を選択してバインドします。この Service は Doris Operator と並行して管理しますが、Operator の制御下にはありません。

---

## よくある質問

### Q：BE ノードが起動しない場合は？

次の項目を確認してください。
1. **特権モードが有効になっていない**：ACS で `vm.max_map_count` を変更するには、特権モードが必要です。有効にできない場合は、代わりに ACK を使用してください。
2. **イメージの取得に失敗する**：`imagePullSecrets` が正しく設定されているか確認してください。
3. **仮想メモリ領域の数が不足している**：`sysctl vm.max_map_count` を実行し、値が 262144 以上であることを確認してください。

### Q：クラスターのノードが virtual-kubelet として表示されるのは正常ですか？

はい。ACS は仮想ノードを使用してコンテナをスケジュールします。`virtual-kubelet-cn-hongkong-d` のようなノード名は、ACS では正常です。

### Q：Alibaba Cloud のリージョンで特権モードを有効にできない場合は？

ACS の特権モード機能を許可リストに追加してもらうため、チケットを提出してください。

### Q：ACK と ACS のどちらを選ぶべきですか？

| シナリオ | 推奨サービス |
|------|------|
| 基盤となる ECS を全面的に制御する必要がある | ACK |
| インフラ管理を伴わず、従量課金制の柔軟なリソースだけが必要 | ACS |
| BE ノードに特権モードが必要 | ACK |
