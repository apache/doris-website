---
{
  "title": "AWSに関する推奨事項",
  "language": "ja",
  "description": "EKSクラスター内で実行されているコンテナは、EC2インスタンス上でホストされています。"
}
---
## AWS EKS

### 新しいクラスタの作成
EKSクラスタで実行されるコンテナはEC2インスタンス上でホストされ、EC2インスタンスはDorisの要件に従ってシステムレベルで設定する必要があります。クラスタを作成する際、ユーザーはEKSモード、自動モードまたは非自動モードを確認する必要があります。
ここでは自律モードを使用しないことを推奨します。自律モードでのコンピューティングリソースは、内蔵されたノードプールを通じて割り当ておよび回収されるためです。各リソースの申請や解放の際に、既存のリソースが再統合されます。statefulsetのようなステートフルサービス、特に起動に時間がかかり、Dorisのような厳格な分散協調要件を持つサービスの場合、共有ノードプール内のすべてのサービスに乱れを引き起こします。直接的な現象として、Dorisクラスタ全体のすべてのノードがドリフトする可能性があります（これは再起動よりも深刻です。このプロセスはローリング再起動ではなく、以前に安定していたサービスがノード上にある時に、ノードが強制的に解放され、K8sがこれらのpodを新しいノードにスケジュールします）。本番環境には大きなセキュリティリスクがあります。
- 上記の通り、自律モードはステートレスサービスの運用保守デプロイメントに適しています。Dorisクラスタのインストールには非自律モードを推奨します
- 推奨オペレーティングシステムイメージ：Amazon Linux 2

### 既存のクラスタ

既存のクラスタ（非自動モード）では、クラスタがK8sの特権モードの使用を制限されていない限り、Doris Operatorを通じてDorisクラスタを実行できます。
既存のクラスタでは、Dorisクラスタリソースを個別にデプロイおよび保守するための新しいノードグループを設定することを推奨します。これはDoris BEの動作に関するシステム設定を含み、ホストマシンのシステムパラメータを調整する可能性があります。

### DockerHubへのアクセス

EKSでDockerHubパブリックイメージリポジトリにアクセスする必要がある場合、`Amazon VPC CNI`、`CoreDNS`、`kube-proxy`などのネットワークプラグインをクラスタに追加し、クラスタのVPCを設定する際にパブリック環境にアクセス可能なサブネットを選択する必要があります。

### K8s特権

EKS下では、EC2インスタンスは完全に現在のEKSユーザーに属し、リソースプール内で異なるユーザークラスタが互いに影響し合い、K8s特権モードを無効にするような状況はありません。

- EKSが特権モードを許可している場合（デフォルトで許可）、システムパラメータを気にする必要はありません。Doris OperatorがデフォルトでDorisの動作のためにシステムパラメータを調整します。
- 特権モードが許可されていない場合、ホスト上で以下のシステムパラメータを調整する必要があります：
  - 仮想メモリエリア数の変更：`sysctl -w vm.max_map_count=2000000`で仮想メモリマッピングの最大数を調整します。`sysctl vm.max_map_count`で確認します。
  - 透過的ヒュージページの無効化：透過的ヒュージページはパフォーマンスに悪影響を与える可能性があるため、無効にする必要があります。cat /sys/kernel/mm/transparent_hugepage/enabledにneverが含まれているかで判断します。
  - 開けるファイルハンドルの最大数の設定：`/etc/security/limits.conf`を変更してファイルハンドルの最大数を調整します。`ulimit -n`で確認します。
  - swapの無効化：`swapoff -a`でsべてのswapパーティションとファイルを無効にします。`swapon --show`で検証し、有効でない場合は出力がありません。

### ストレージ

Doris Operatorは本番環境でノードストレージを保存するために永続化設定を使用する必要があります。[EBS](https://aws.amazon.com/ebs)を推奨します。

以下の点に注意してください：

- クラスタ設定のインストールまたは管理インターフェースで、EBSストレージプラグインを追加します。EKS自律モード（推奨しません）を使用する場合は、EFSのインストールを推奨し、ストレージプラグインには対応する[ロール権限](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)が必要です
- EKSノードのIAMロールが以下の権限を持っていることを確認してください：
  - AmazonEC2FullAccess
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonSSMManagedInstanceCore

### コンピューティングリソースプール設定

- AWS Resource Groups（推奨）
  クラスタ作成インターフェースでノードグループを作成するか、クラスタの初期化後にノードグループを追加できます。EC2 > Launch Template > Create Launch Templateを使用して、ノードプール用のノードグループ起動テンプレートを設定します。テンプレートを使用してスクリプトを注入し、EC2インスタンスのシステム環境設定を自動的に調整し、ノードが起動時に必要なシステムパラメータを自動設定することを保証します。ノードテンプレートを設定することで、EKS自動弾性拡張縮小を使用する際に新しく追加されたノードのシステムパラメータを自動設定する機能も実現できます。
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
さらに、ノードグループを作成する際、コマンドラインを通じてアクセスしたい場合は、リモートノードアクセス権限を設定する必要があります。

- Default node pools（推奨しません）

  EKS自律モードで使用されるリソースプールを有効にします。ノードプールを作成する際、カスタムEC2インスタンスタイプを選択し、インスタンスのCPU、メモリ、その他のリソースを調整できます。ノードプールを設定する際、EC2インスタンス用の起動スクリプトを追加してシステムパラメータを調整できます。ただし、このタイプのリソースプールは自律モードが必要で、クラスタを管理する自由度が減少します。具体的な変更操作の詳細については、以下を参照してください：[Cluster Environment OS Checking](../../install/preparation/os-checking.md)
