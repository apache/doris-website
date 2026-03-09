---
{
  "title": "AWSへのデプロイ",
  "language": "ja",
  "description": "AWSでのDorisの迅速な体験を促進するため、クラスターの高速起動と運用を可能にするCloudFormationテンプレート（CFT）を提供しています。"
}
---
AWSでDorisを迅速に体験できるように、クラスターの迅速な起動と運用を可能にするCloudFormationテンプレート(CFT)を提供しています。このテンプレートを使用することで、AWSリソースを自動的に構成し、最小限の設定でDorisクラスターを起動できます。

また、AWSリソースを個別に購入し、標準的な方法を使用してクラスターを手動でデプロイすることも可能です。

:::tip

現在、このようなデプロイメントはcompute-storage decoupledモードではサポートされていません。

:::

## AWS CloudFormationとは？

CloudFormationを使用すると、ユーザーは「リソースのスタック」を1つのステップで作成できます。リソースとは、EC2インスタンス、VPC、サブネットなど、ユーザーが作成する項目を指します。このようなリソースのグループをスタックと呼びます。ユーザーは、好みに応じてリソーススタックを1つのステップで簡単に作成できるテンプレートを記述できます。これは、手動での作成と設定と比較して、より高速で再現性があり、一貫性が優れています。さらに、テンプレートをソースコードに配置してバージョン管理を行うことで、必要に応じていつでも任意の目的で使用できます。

## Doris on AWS CloudFormationとは？

現在、DorisはDoris CloudFormation Templateを提供しており、ユーザーはこのテンプレートを直接使用することで、AWS上で関連するDorisバージョンのクラスターを迅速に作成し、最新のDoris機能を体験できます。

:::caution

**注意：** CloudFormationに基づいたDorisクラスター構築用のテンプレートは現在、us-east-1、us-west-1、us-west-2のリージョンのみサポートしています。Doris on AWS CloudFormationは主にテストや体験目的を想定しており、本番環境での使用は推奨されません。
:::

## 使用上の注意事項

- デプロイするVPCとSubnetを決定してください。

- ノードにログインするために使用するキーペアを決定してください。

- デプロイ中にS3用のVPC Endpoint Interfaceが確立されます。

## デプロイの開始

**1. AWSコンソールでCloudFormationに移動し、「Create stack」をクリックします。**

![Start Deployment](/images/start-deployment.jpeg)

「Amazon S3 URL Template source」オプションを選択し、「Amazon S3 URL」フィールドに以下のテンプレートリンクを入力します：

https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml

**2. テンプレートの具体的なパラメータを設定します**

![Configure the specific parameter](/images/configure-specific-parameters-1.jpeg)

![Configure the specific parameter](/images/configure-specific-parameters-2.jpeg)

![Configure the specific parameter](/images/configure-specific-parameters-3.jpeg)

主なパラメータは以下のとおりです：

- **VPC ID**: デプロイメントが実行されるVPCです。

- **Subnet ID**: デプロイメントがデプロイされるサブネットです。

- **Key pair name**: デプロイされたBEとFEノードへの接続に使用される公開/秘密鍵ペアです。

- **Version of Doris**: デプロイするDorisのバージョンです（2.1.0、2.0.6など）。

- **Number of Doris FE**: FEノードの数です。テンプレートのデフォルトは1つのFEのみを選択します。

- **Fe instance type**: FEのノードタイプです。デフォルト値を使用できます。

- **Number of Doris Be**: BEノードの数です。1または3にできます。

- **Be instance type**: BEのノードタイプです。デフォルト値を使用できます。

- **Meta data dir**: FEノードのメタデータディレクトリです。デフォルト値を使用できます。

- **Sys log level:** システムログのレベルを設定します。デフォルト値の「info」を使用できます。

- **Volume type of Be nodes:** BEノードにマウントされるEBSのボリュームタイプです。各ノードにはデフォルトで1つのディスクがマウントされます。デフォルト値を使用できます。

- **Volume size of Be nodes**: BEノードにマウントされるEBSのサイズです。GB単位で測定されます。デフォルト値を使用できます。

## データベースへの接続方法

**1. デプロイメント成功後の表示は以下のとおりです：**

![How to Connect to the Database](/images/how-to-connect-to-the-database.jpeg)

**2. 次に、以下の手順でFEの接続アドレスを見つけます。この例では、FE OutputsからアドレスとI72.16.0.97を確認できます。**

![find the connection address for FE ](/images/find-connection-address-for-fe-1.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-2.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-3.jpeg)

**3. デプロイされたDoris Clusterに接続するには、CloudFormationを使用してDorisをデプロイした後のデフォルト値は以下のとおりです：**

- **FE IP**: 前のセクションの手順に従ってFEのIPアドレスを取得します。

- **FE MySQL protocol port:** 9030

- **FE HTTP protocol port**: 8030

- **Default root password**: 空

- **Default admin password:** 空
