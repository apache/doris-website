---
title: AWS EKS での Doris クラスターのデプロイ
sidebar_label: AWS EKS へのデプロイに関する推奨事項
language: ja
description: "AWS EKS で Doris をデプロイするためのガイド。クラスターのモード選択（自律モードと非自律モード）、システムパラメーターの確認と調整、特権モードの設定、ストレージとコンピューティングリソースの計画を説明します。vm.max_map_count の不足、swap の無効化漏れ、Transparent Huge Pages の無効化漏れ、ファイルハンドル数の上限などの問題に対処します。"
---

## AWS EKS コンテナーサービスの概要

AWS EKS には、以下の動作モードがあります。

| モード | 説明 | 用途 |
|------|-------------|-----------|
| **非自律モード**（推奨） | 基盤となる EC2 インスタンスを全面的に制御できる標準的な EKS モード | 本番環境、ステートフルサービス、Doris クラスター |
| **自律モード** | 組み込みのノードプールでリソースを自動的に伸縮させるモード | ステートレスサービス、軽量なワークロード |

:::tip ヒント
自律モードは推奨しません。自律モードでは、組み込みのノードプールを通じてコンピューティングリソースが動的に割り当てられ、回収されます。このため、Doris クラスターのノードが移動し、本番環境でセキュリティ上のリスクが生じる可能性があります。
:::

## シナリオ 1：新しいクラスターを作成する

### ステップ 1：EKS クラスターを作成する（非自律モード）

EKS コンソールでクラスターを作成するときは、**非自律モード**を選択します。

**推奨設定**：
- オペレーティングシステムのイメージ：Amazon Linux 2
- ノードグループ：Doris のデプロイには専用のノードグループを使用します。

### ステップ 2：ノードグループの起動スクリプトを設定する

EC2 > Launch Templates > Create Launch Template から、ノードプールの起動テンプレートを設定します。システムパラメーターを自動的に設定するには、次のスクリプトをテンプレートに追加します。

```bash
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable the firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set the number of virtual memory areas
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set the file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
  echo "* soft nofile 1000000" >> "$config_file"
  echo "* hard nofile 1000000" >> "$config_file"
fi
```

クラスターの起動後にノードを再起動すると、設定が有効になります。

### ステップ 3：IAM ロールの権限を設定する

EKS ノードの IAM ロールに、次の権限があることを確認します。

- AmazonEC2FullAccess
- AmazonEKSWorkerNodePolicy
- AmazonEKS_CNI_Policy
- AmazonSSMManagedInstanceCore

### ステップ 4：ストレージを設定する

本番環境では、[EBS](https://aws.amazon.com/ebs) ストレージを推奨します。クラスターの設定画面で EBS ストレージプラグインを追加し、そのプラグインに適切な[ロール権限](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)があることを確認します。

---

## シナリオ 2：既存のクラスター

### ステップ 1：swap の状態を確認する

```bash
swapon --show
```

**期待される結果**：出力がないこと（swap が無効）。swap が有効であることを示す出力がある場合は、`swapoff -a` を実行して再起動します。

### ステップ 2：ファイルハンドル数の上限を確認する

```bash
ulimit -n
```

**期待される結果**：65535 以上。これより小さい場合は、`/etc/security/limits.conf` に次のエントリを追加します。

```bash
* soft nofile 1000000
* hard nofile 1000000
```

### ステップ 3：仮想メモリー領域数を確認する

```bash
sysctl vm.max_map_count
```

**期待される結果**：262144 以上。値を変更するには、`sysctl -w vm.max_map_count=2000000` を実行します。

### ステップ 4：Transparent Huge Pages を確認する

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**期待される結果**：`[never]` が含まれること。値が `[always]` の場合は、次を実行します。

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

---

## イメージリポジトリーへのアクセス

公開 DockerHub イメージリポジトリーにアクセスするには、`Amazon VPC CNI`、`CoreDNS`、`kube-proxy` などのネットワークプラグインをクラスターに追加し、クラスターの VPC を設定するときにパブリックネットワークにアクセスできるサブネットを選択します。

---

## 特権モード

EKS では、EC2 インスタンスは現在の EKS ユーザーが全面的に利用するため、共有リソースプール内で異なるユーザーのクラスターが互いに影響することはありません。

- **EKS で特権モードが許可されている場合**（デフォルトで許可）：システムパラメーターを気にする必要はありません。Doris Operator がデフォルトで Doris 用のシステムパラメーターを自動調整します。
- **特権モードが許可されていない場合**：ホストで次のシステムパラメーターを調整する必要があります。

| パラメーター | コマンド | 確認方法 |
|-----------|---------|--------------|
| 仮想メモリー領域数 | `sysctl -w vm.max_map_count=2000000` | `sysctl vm.max_map_count` |
| Transparent Huge Pages | 無効化 | 出力に `never` が含まれるか確認 |
| ファイルハンドル数の上限 | `/etc/security/limits.conf` を変更 | `ulimit -n` |
| swap | `swapoff -a` | `swapon --show`（出力がなければ無効） |

詳細は、[オペレーティングシステムの確認](../../preparation/os-checking.md)を参照してください。

---

## FAQ

### Q：自律モードにはどのようなリスクがありますか？

自律モードでは、コンピューティングリソースが組み込みのノードプールを通じて動的に割り当てられ、回収されます。割り当てや解放のたびに既存のリソースが再編成されます。StatefulSet を使用するステートフルサービス、特に起動に時間がかかるサービスや、分散協調に厳しい要件がある Doris のようなサービスでは、これによりノードプールを共有するすべてのサービスが不安定になり、Doris クラスター全体のノードが移動する可能性があります。

### Q：既存のクラスターに新しいノードグループを設定するにはどうすればよいですか？

Doris クラスターには専用のノードグループを設定することを推奨します。BE の動作に関わるシステム設定がある場合は、ホストのシステムパラメーターを調整する必要があります。ノードグループを作成するときは、EC2 > Launch Templates > Create Launch Template から設定し、そのテンプレートを使用して EC2 インスタンスのシステム環境を自動設定するスクリプトを挿入できます。

### Q：EKS ノードにはどの IAM 権限が必要ですか？

AmazonEC2FullAccess、AmazonEKSWorkerNodePolicy、AmazonEKS_CNI_Policy、AmazonSSMManagedInstanceCore の権限が必要です。

### Q：システムパラメーターが正しく設定されていることを確認するにはどうすればよいですか？

シナリオ 2 の確認手順に従い、swap、ファイルハンドル数、仮想メモリー領域数、Transparent Huge Pages などのパラメーターが要件を満たしているか確認してください。
