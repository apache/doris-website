---
{
  "title": "AWSに関する推奨事項",
  "language": "ja",
  "description": "EKSクラスターで実行されているコンテナーは、EC2インスタンス上でホストされています。"
}
---
## AWS EKS

### 新しいクラスターを作成する
EKSクラスターで実行されるコンテナはEC2インスタンス上でホストされ、EC2インスタンスはDorisの要件に従ってシステムレベルで設定する必要があります。クラスターを作成する際、ユーザーはEKSモード、自動モードまたは非自動モードを確認する必要があります。
ここでは自律モードを使用しないことをお勧めします。自律モードでのコンピューティングリソースは、内蔵ノードプールを通じて割り当てと回収が行われるためです。リソースの申請や解放のたびに、既存のリソースが再統合されます。statefulsetなどのステートフルサービス、特に起動に時間がかかるサービスやDorisのような厳格な分散協調要件があるサービスでは、共有ノードプール内のすべてのサービスに乱れを引き起こします。直接的な現象として、Dorisクラスター全体のすべてのノードがドリフトする可能性があります（これは再起動よりも恐ろしいものです。このプロセスはローリング再起動ではなく、以前に安定していたサービスがノード上にある時に、ノードが強制的に解放され、K8sがこれらのpodを新しいノードにスケジュールします）。本番環境には大きなセキュリティリスクがあります。
- 上記の通り、自律モードはステートレスサービスの運用保守デプロイメントに適しています。Dorisクラスターのインストールには非自律モードをお勧めします
- 推奨オペレーティングシステムイメージ：Amazon Linux 2

### 既存のクラスター

既存のクラスター（非自動モード）では、クラスターがK8sの特権モードの使用を制限されていない限り、Doris Operatorを通じてDorisクラスターを実行できます。
既存のクラスターでは、Dorisクラスターリソースを個別にデプロイし、保守するために新しいノードグループを設定することをお勧めします。これは、Doris BEの動作に関するシステム設定を含み、ホストマシンのシステムパラメータを調整する可能性があります。

### DockerHubへのアクセス

EKS上でDockerHubパブリックイメージリポジトリにアクセスする必要がある場合、クラスターに`Amazon VPC CNI`、`CoreDNS`、`kube-proxy`などのネットワークプラグインを追加し、クラスターにVPCを設定する際に、パブリック環境にアクセスできるサブネットを選択する必要があります。

### K8s Privileged

EKS下では、EC2インスタンスは完全に現在のEKSユーザーに属し、リソースプール内で異なるユーザークラスターが互いに影響し合い、K8sの特権モードを無効にする状況はありません。

- EKSが特権モードを許可している場合（デフォルトで許可）、システムパラメータを気にする必要はありません。Doris Operatorはデフォルトで、Doris動作のためにシステムパラメータを調整します。
- 特権モードが許可されていない場合、ホスト上で以下のシステムパラメータを調整する必要があります：
  - 仮想メモリ領域数の変更：`sysctl -w vm.max_map_count=2000000`で仮想メモリマッピングの最大数を調整します。`sysctl vm.max_map_count`で確認できます。
  - 透過的huge pageの無効化：透過的huge pageはパフォーマンスに悪影響を与える可能性があるため、無効にする必要があります。cat /sys/kernel/mm/transparent_hugepage/enabledにneverが含まれるかどうかで判断します。
  - 最大オープンファイルハンドル数の設定：`/etc/security/limits.conf`を変更してファイルハンドルの最大数を調整します。`ulimit -n`で確認できます。
  - swapの無効化：`swapoff -a`を使用してすべてのswapパーティションとファイルを無効にします。`swapon --show`で確認し、有効でない場合は出力がありません。

### ストレージ

Doris Operatorは、本番環境においてノードストレージを保存するために永続的な設定を使用する必要があります。[EBS](https://aws.amazon.com/ebs)をお勧めします。

以下の点に注意してください：

- クラスター設定インストールまたは管理インターフェースで、EBSストレージプラグインを追加します。EKS自律モード（非推奨）を使用する場合、EFSのインストールをお勧めします。ストレージプラグインには対応する[ロール権限](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)が必要です
- EKSノードのIAMロールに以下の権限があることを確認します：
  - AmazonEC2FullAccess
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonSSMManagedInstanceCore

### コンピューティングリソースプール設定

- AWS Resource Groups（推奨）
  クラスター作成インターフェースでノードグループを作成することも、クラスターの初期化後にノードグループを追加することもできます。EC2 > Launch Template > Create Launch Templateを使用して、ノードプール用のノードグループ起動テンプレートを設定します。テンプレートを使用してスクリプトを挿入し、EC2インスタンスのシステム環境設定を自動的に調整して、ノードが起動時に必要なシステムパラメータを自動的に設定することを保証します。ノードテンプレートを設定することで、EKS自動弾性拡張・縮小を使用する際に、新しく追加されたノードのシステムパラメータを自動的に設定する機能も実現できます。
  起動スクリプトの例：

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
さらに、ノードグループを作成する際に、コマンドラインからアクセスしたい場合は、リモートノードアクセス権限を設定する必要があります。

- Default node pools（推奨されません）

  EKS自律モードで使用されるリソースプールを有効にします。ノードプールを作成する際、カスタムEC2インスタンスタイプを選択し、インスタンスのCPU、メモリなどのリソースを調整できます。ノードプールを設定する際、EC2インスタンス用の起動スクリプトを追加してシステムパラメータを調整できます。ただし、このタイプのリソースプールには自律モードが必要で、クラスタを管理する自由度が下がります。具体的な変更操作の詳細については、[Cluster Environment OS Checking](../../install/preparation/os-checking.md)を参照してください。
