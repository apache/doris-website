---
{
    "title": "AWS 上の Doris",
    "language": "ja",
    "description": "AWS 上で Doris をすぐに試せるよう、クラスターを迅速に起動・実行できる CloudFormation テンプレート（CFT）を提供しています。このテンプレートを使用すると、AWS リソースが自動的に構成され、最小限の設定で Doris クラスターを起動できます。"
}
---

このドキュメントでは、AWS 上に Doris クラスターを迅速にデプロイし、Doris の最新機能を試す方法を説明します。

## ユースケース

AWS 上で Doris をすぐに試したい場合は、次の二つのデプロイ方法から選択できます。

| デプロイ方法 | 対象ユーザー | 特徴 |
| --- | --- | --- |
| CloudFormation テンプレート（CFT）を使用したデプロイ | Doris をすぐに起動して試したいユーザー | AWS リソースを自動的に構成し、最小限の設定でクラスターを起動する |
| AWS リソースを手動で購入して自分でデプロイ | デプロイ構成をカスタマイズしたいユーザー | リソースの選択と構成手順をすべて制御できる |

このドキュメントでは、**CloudFormation テンプレートを使用する**迅速なデプロイ方法を中心に説明します。

:::tip
ストレージとコンピュートを分離するモードのコンパイルとデプロイは、まだサポートされていません。
:::

:::caution
- 現在の CloudFormation テンプレートがサポートするリージョンは、**us-east-1**、**us-west-1**、**us-west-2** の三つのみです。
- Doris on AWS CloudFormation は、主に Doris のテストや試用を目的としています。**本番環境では使用しないでください**。
:::

## 基本概念

### AWS CloudFormation とは

CloudFormation を使用すると、「リソーススタック」を一度の操作で作成できます。ここでいう用語は次のとおりです。

- **リソース**：EC2 インスタンス、VPC、サブネットなど、作成するもの。
- **スタック**：このようなリソースの集合。

要件に合わせてテンプレートを記述し、リソーススタックを一度の操作で作成できます。手動で作成・構成する場合と比べ、CloudFormation には次の利点があります。

- 作成にかかる時間が短い
- 繰り返し実行でき、一貫性を保ちやすい
- テンプレートをソース管理下に置いてバージョンを管理し、必要なときに再利用できる

### Doris on AWS CloudFormation とは

Doris は公式の CloudFormation テンプレートを提供しています。このテンプレートをそのまま使用して、指定したバージョンの Doris クラスターを AWS 上に迅速に作成し、最新機能を試すことができます。

## デプロイ前の準備

デプロイを開始する前に、次の情報を確認してください。

- デプロイ先の **VPC** と **Subnet** を決める
- ノードへのログインに使用する**キーペア**を決める
- デプロイ中に **S3 VPC Endpoint Interface** が作成される点に注意する

## デプロイ手順

### ステップ 1：CloudFormation でスタックを作成する

AWS コンソールで CloudFormation を開き、**Create stack** をクリックします。

![AWS コンソールで CloudFormation を開いてデプロイを開始する](/images/start-deployment.jpeg)

テンプレートのソースとして **Amazon S3 URL** を選択し、次のテンプレートリンクを Amazon S3 URL に入力します。

```
https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml
```

### ステップ 2：テンプレートのパラメーターを設定する

![テンプレートの各パラメーターを設定する画面](/images/configure-specific-parameters-1.jpeg)

![テンプレートの各パラメーターを設定する画面](/images/configure-specific-parameters-2.jpeg)

![テンプレートの各パラメーターを設定する画面](/images/configure-specific-parameters-3.jpeg)

主なパラメーターは次のとおりです。

| パラメーター | 説明 | 備考 |
| --- | --- | --- |
| VPC ID | デプロイ先の VPC | 必須 |
| Subnet ID | デプロイ先のサブネット | 必須 |
| Key pair name | デプロイした BE ノードと FE ノードへの接続に使用する公開鍵と秘密鍵のペア | 必須 |
| Version of Doris | デプロイする Doris のバージョン | 例：2.1.0、2.0.6 など |
| Number of Doris FE | FE の数 | テンプレートのデフォルト設定では FE は 1 台のみ |
| Fe instance type | FE のインスタンスタイプ | デフォルト値を使用可能 |
| Number of Doris Be | BE ノードの数 | 1 台または 3 台を選択可能 |
| Be instance type | BE のインスタンスタイプ | デフォルト値を使用可能 |
| Meta data dir | FE ノードのメタデータディレクトリ | デフォルト値を使用可能 |
| Sys log level | システムログのレベル | デフォルトの `info` を使用可能 |
| Volume type of Be nodes | BE ノードに接続する EBS ボリュームのタイプ | デフォルトでは各ノードにディスクが一つ接続される。デフォルト値を使用可能 |
| Volume size of Be nodes | BE ノードに接続する EBS ボリュームのサイズ（単位：GB） | デフォルト値を使用可能 |

## Doris クラスターへの接続

### ステップ 1：デプロイの成功を確認する

デプロイが成功すると、CloudFormation に次の結果が表示されます。

![デプロイ成功後に CloudFormation に表示される結果](/images/how-to-connect-to-the-database.jpeg)

### ステップ 2：FE の接続先アドレスを取得する

以下のスクリーンショットに示す手順で、スタックの **Outputs** タブを開き、FE Outputs から FE の接続先アドレスを取得します。次の例では、FE のアドレスは `172.16.0.97` です。

![FE の接続先アドレスを確認する画面](/images/find-connection-address-for-fe-1.jpeg)

![FE の接続先アドレスを確認する画面](/images/find-connection-address-for-fe-2.jpeg)

![FE の接続先アドレスを確認する画面](/images/find-connection-address-for-fe-3.jpeg)

### ステップ 3：Doris クラスターに接続する

CloudFormation によるデプロイが完了した後、Doris クラスターのデフォルトの接続情報は次のとおりです。

| 項目 | デフォルト値 |
| --- | --- |
| FE IP | ステップ 2 で取得した FE の IP アドレス |
| FE MySQL プロトコルのポート | 9030 |
| FE HTTP プロトコルのポート | 8030 |
| デフォルトの root パスワード | 空 |
| デフォルトの admin パスワード | 空 |
