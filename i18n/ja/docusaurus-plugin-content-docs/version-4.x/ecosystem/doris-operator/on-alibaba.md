---
{
  "title": "Alibaba Cloudに関する推奨事項",
  "language": "ja",
  "description": "Alibaba Cloud Container Service ACKは、ECSインスタンスを購入した後のマネージドコンテナ化サービスです。"
}
---
## Alibaba ACK

Alibaba Cloud Container Service ACKは、ECSインスタンスを購入した後の管理されたコンテナ化サービスであり、関連するシステムパラメータを調整するための完全なアクセス制御権限を取得できます。インスタンスイメージを使用します：Alibaba Cloud Linux 3。現在のシステムパラメータはDorisを実行するための要件を完全に満たしています。要件を満たさないものについても、K8sの特権モードを通じてコンテナ内で修正し、安定した動作を保証することができます。  
**Alibaba Cloud ACKクラスタは、Doris Operatorを使用してデプロイされ、ほとんどの環境要件はECSデフォルト設定によって満たすことができます。満たされない場合、Doris Operatorが自動的に修正することができます**。ユーザーも以下のように手動で修正することができます：

### 既存のクラスタ

Container Serviceクラスタがすでに作成されている場合、このドキュメントを参照して修正できます：[クラスター Environment OS Checking](../../install/preparation/os-checking.md)      
BEの起動パラメータ要件に注目してください：  
1. swapを無効化して閉じる：有効になっていない場合、`swapon --show`は出力されません
2. システム内の開いているファイルハンドルの最大数を確認する `ulimit -n`
3. 仮想メモリ領域の数を確認して修正する `sysctl vm.max_map_count`
4. transparent huge pagesが閉じられているかどうか `cat /sys/kernel/mm/transparent_hugepage/enabled` にneverが含まれている  
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

クラスターがまだ購入・作成されていない場合は、Alibaba Cloud Container Service ACKコンソールで「Create Cluster」をクリックして購入できます。必要に応じて設定を調整できます。上記のパラメータは、クラスター作成の「Node Pool Configuration」ステップの「Instance Pre-customized Data」でシステム調整スクリプトに追加できます。
クラスターが開始された後、ノードを再起動して設定を完了してください。参考スクリプトは以下の通りです：

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

ACSサービスは、K8sをユーザーインターフェースとして使用してコンテナコンピューティングリソースを提供するクラウドコンピューティングサービスで、オンデマンドで課金される弾性コンピューティングリソースを提供します。上記のACKとは異なり、ECSの具体的な使用に注意を払う必要はありません。
ACSを使用する際は、以下の点に注意してください：

### Image repository

ACSを使用する場合は、対応するAlibaba [Container Registry](https://www.alibabacloud.com/en/product/container-registry)(ACR)の使用を推奨します。個人版と企業版はオンデマンドで有効化されます。

ACRとイメージ転送環境を設定した後、Dorisが提供する公式イメージを対応するACRに移行する必要があります。

認証を有効にしたプライベートACRを使用する場合は、以下の手順を参照してください：

1. イメージウェアハウスへのアクセス認証情報を設定するために、事前に`docker-registry`タイプの`secret`を設定する必要があります。

  ```shell
  kubectl create secret docker-registry image-hub-secret --docker-server={your-server} --docker-username={your-username} --docker-password={your-pwd}
  ```
2. 上記の手順を使用してDCRでsecretを設定します：

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

現在、Alibaba Cloudは、フルマネージドACSサービスで特権モードを有効にする機能を段階的に推進しています（一部のリージョンではまだ有効になっていない可能性があり、機能を有効にするためにワークオーダーを提出できます）。  
Doris BEノードの起動には、仮想メモリ領域の数を変更する`sysctl -w vm.max_map_count=2000000`などの特別な環境パラメータが必要です。  
コンテナ内でこのパラメータを設定するには、ホスト設定を変更する必要があるため、通常のK8sクラスタではpodで特権モードを有効にする必要があります。Operatorは`systemInitialization`を通じてBE podに`InitContainer`を追加して、このような操作を実行します。

:::tip Tip  
**現在のクラスタが特権モードを使用できない場合、BEノードを起動できません**。ACKコンテナサービス + ホストを選択してクラスタをデプロイできます。
:::

### Service

ACSサービスは、K8sをユーザーインターフェースとして使用してコンテナコンピューティングリソースを提供するクラウドコンピューティングサービスであり、コンピューティングリソースを提供します。そのノードは仮想コンピューティングリソースであり、ユーザーは注意を払う必要がありません。使用するリソース量に応じて課金され、無限に拡張できます。つまり、従来のノードの物理的な概念はありません：

```shell  
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
virtual-kubelet-cn-hongkong-d   Ready    agent   27h   v1.31.1-aliyun.1
```
したがって、Dorisクラスターをデプロイする際、serviceTypeはNodePortモードを無効にし、ClusterIPおよびLBモードの使用を許可します。

- ClusterIPモード：

  ClusterIPモードはOperatorのデフォルトネットワークモードです。具体的な使用方法とアクセス方法については、[このドキュメント](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)を参照してください

- ロードバランシングモード：

  以下のように設定できます：

  - Operatorが提供するDCRサービスannotationsを通じてLBアクセスを設定する。手順は以下のとおりです：
    1. ロードバランシングコンソールを通じてCLBまたはNLBインスタンスが作成されており、インスタンスはACKクラスターと同じリージョンにある必要があります。まだ作成していない場合は、[Create and manage a CLB instance](https://www.alibabacloud.com/help/en/slb/classic-load-balancer/user-guide/create-and-manage-a-clb-instance)および[Create and manage an NLB instance](https://www.alibabacloud.com/help/en/slb/network-load-balancer/user-guide/create-and-manage-an-nlb-instance)を参照してください。
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
- ACS コンソールを通じて LB サービスをホストし、FE または BE の対応するリソース制御にバインドされた statefulset サービスを生成する  
    手順は以下の通りです：
    1. serviceType は ClusterIP（デフォルトポリシー）
    2. Alibaba Cloud コンソールインターフェースを通じて負荷分散サービスを作成できます：Container Compute Service ACS -> Cluster List -> Cluster -> Service で、`Create` ボタンを使用します。
    3. `service` を作成するインターフェースで新しく作成した LB を選択します。これは `service` にバインドされ、`service` の登録解除時にも登録解除されます。ただし、この `service` は Doris Operator によって制御されません。
