---
{
  "title": "Alibaba Cloudに関する推奨事項",
  "language": "ja",
  "description": "Alibaba Cloud Container Service ACKは、ECSインスタンスを購入後のマネージドコンテナ化サービスです。"
}
---
## Alibaba ACK

Alibaba Cloud Container Service ACKは、ECSインスタンスの購入後に提供される管理コンテナサービスであり、関連するシステムパラメータを調整するための完全なアクセス制御権限を取得できます。インスタンスイメージ：Alibaba Cloud Linux 3を使用してください。現在のシステムパラメータはDorisの実行要件を完全に満たしています。要件を満たさないものについても、K8sのprivilegedモードを通じてコンテナ内で修正し、安定した動作を保証できます。  
**Alibaba Cloud ACKクラスタは、Doris Operatorを使用してデプロイされ、ほとんどの環境要件はECSのデフォルト設定で満たすことができます。満たされない場合、Doris Operatorが自動的に修正できます**。ユーザーは以下のように手動で修正することも可能です：

### 既存のクラスタ

Container Serviceクラスタが既に作成されている場合、このドキュメントを参照して変更できます：[Cluster Environment OS Checking](../../install/preparation/os-checking.md)      
BEの起動パラメータ要件に注目してください：  
1. swapの無効化と停止：有効でない場合、`swapon --show`は出力されません
2. システムでの最大オープンファイルハンドル数の確認 `ulimit -n`
3. 仮想メモリ領域数の確認と変更 `sysctl vm.max_map_count`
4. transparent huge pagesが閉じられているかの確認 `cat /sys/kernel/mm/transparent_hugepage/enabled` にneverが含まれているか  
   対応するパラメータのデフォルト値は以下の通りです：

  ```shell
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# swapon --show
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# ulimit -n
  65535
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# sysctl vm.max_map_count
  vm.max_map_count = 262144
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# cat /sys/kernel/mm/transparent_hugepage/enabled
  [always] madvise never
  ```  
### 新しいクラスターの作成

クラスターが購入・作成されていない場合、Alibaba Cloud Container Service ACKコンソールで「Create Cluster」をクリックして購入できます。必要に応じて設定を調整できます。上記のパラメータは、クラスター作成の「Node Pool Configuration」ステップの「Instance Pre-customized Data」でシステム調整スクリプトに追加できます。
クラスターが開始された後、ノードを再起動して設定を完了します。参考スクリプトは以下の通りです：

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local
echo "swapoff -a" >> /etc/rc.d/rc.local
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
 if [ "$current_limit" -ne "$desired_limit" ]; then
    echo "* soft nofile 1000000" >> "$config_file"
    echo "* hard nofile 1000000" >> "$config_file"
fi
```
## Alibaba ACS

ACSサービスは、K8sをユーザーインターフェースとして使用してコンテナコンピューティングリソースを提供するクラウドコンピューティングサービスで、オンデマンドで課金される弾性的なコンピューティングリソースを提供します。上記のACKとは異なり、ECSの具体的な使用に注意を払う必要はありません。
ACSを使用する際は、以下の点に注意してください：

### イメージリポジトリ

ACSを使用する場合、対応するAlibaba [Container Registry](https://www.alibabacloud.com/en/product/container-registry)(ACR)の使用を推奨します。個人版と企業版は必要に応じて有効にします。

ACRとイメージ転送環境を設定した後、Dorisによって提供される公式イメージを対応するACRに移行する必要があります。

プライベートACRを使用して認証を有効にする場合は、以下の手順を参照してください：

1. イメージリポジトリにアクセスするための認証情報を設定するために、事前に`docker-registry`タイプの`secret`を設定する必要があります。

  ```shell
  kubectl create secret docker-registry image-hub-secret --docker-server={your-server} --docker-username={your-username} --docker-password={your-pwd}
  ```
2. 上記の手順を使用してDCR上でsecretを設定します：

  ```yaml
  spec:
    feSpec:
      replicas: 1
      image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.fe-ubuntu:3.0.3
      imagePullSecrets:
      - name: image-hub-secret
    beSpec:
      replicas: 3
      image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.be-ubuntu:3.0.3
      imagePullSecrets:
      - name: image-hub-secret
      systemInitialization:
        initImage: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/alpine:latest
  ```
### BE systemInitialization  

現在、Alibaba Cloudは完全管理型ACSサービスで特権モードを有効化する機能を段階的にプッシュしています（一部のリージョンではまだ有効化されていない可能性があります。この機能の有効化を申請するワークオーダーを送信することができます）。  
Doris BEノードの起動には、仮想メモリ領域の数を変更する `sysctl -w vm.max_map_count=2000000` などの特別な環境パラメータが必要です。  
コンテナ内でこのパラメータを設定するには、ホスト設定の変更が必要なため、通常のK8sクラスターではpodで特権モードを有効化する必要があります。Operatorは`systemInitialization`を通じてBE podに`InitContainer`を追加し、このような操作を実行します。

:::tip Tip  
**現在のクラスターが特権モードを使用できない場合、BEノードを起動することができません**。ACKコンテナサービス + ホストでクラスターをデプロイすることを選択できます。
:::

### Service

ACSサービスは、K8sをユーザーインターフェースとして使用してコンテナ計算リソースを提供するクラウドコンピューティングサービスであるため、計算リソースを提供します。そのノードは仮想計算リソースであり、ユーザーはそれらに注意を払う必要がありません。使用されたリソース量に応じて課金され、無限に拡張することができます。つまり、従来のノードの物理的概念は存在しません：

```shell  
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
virtual-kubelet-cn-hongkong-d   Ready    agent   27h   v1.31.1-aliyun.1
```
したがって、Dorisクラスターをデプロイする際、serviceTypeはNodePortモードを無効にし、ClusterIPモードとLBモードの使用を許可します。

- ClusterIPモード：

  ClusterIPモードはOperatorのデフォルトのネットワークモードです。具体的な使用方法とアクセス方法については、[このドキュメント](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を参照してください。

- ロードバランシングモード：

  以下のように設定できます：

  - Operatorが提供するDCRサービスannotationsを通じてLBアクセスを設定します。手順は以下の通りです：
    1. ロードバランシングコンソールを通じてCLBまたはNLBインスタンスが作成され、インスタンスはACKクラスターと同じリージョンにあります。まだ作成していない場合は、[Create and manage a CLB instance](https://www.alibabacloud.com/help/en/slb/classic-load-balancer/user-guide/create-and-manage-a-clb-instance)と[Create and manage an NLB instance](https://www.alibabacloud.com/help/en/slb/network-load-balancer/user-guide/create-and-manage-an-nlb-instance)を参照してください。
    2. DCR設定を通じて、上記LBのアクセスannotationsは以下の形式になります：

      ```yaml
        feSpec:
          replicas: 3
          image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.fe-ubuntu:3.0.3
          service:
            type: LoadBalancer
            annotations:
              service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
      ```  
- ACSコンソールを通じてLBサービスをホストし、FEまたはBEの対応するリソース制御に紐付けられたstatefulsetサービスを生成する  
    手順は以下の通りです：
    1. serviceTypeはClusterIP（デフォルトポリシー）
    2. Alibaba Cloudコンソールインターフェイス：Container Compute Service ACS -> Cluster List -> Cluster -> Serviceを通じて負荷分散サービスを作成でき、`Create`ボタンを使用します。
    3. `service`作成用のインターフェイスで新しく作成されたLBを選択します。これは`service`に紐付けられ、`service`が登録解除されるときにも登録解除されます。ただし、この`service`はDoris Operatorによって制御されません。
