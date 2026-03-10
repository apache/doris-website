---
{
  "title": "AWSでのデプロイ",
  "language": "ja",
  "description": "AWSでのDorisの迅速な体験を促進するために、クラスターの高速起動と運用を可能にするCloudFormationテンプレート（CFT）を提供しています。"
}
---
AWS上でDorisの迅速な体験を促進するために、クラスターの迅速な起動と運用を可能にするCloudFormationテンプレート（CFT）を提供しています。このテンプレートを使用することで、AWSリソースを自動的に構成し、最小限の設定でDorisクラスターを起動できます。

または、AWSリソースを個別に購入し、標準的な方法を使用してクラスターを手動でデプロイすることも可能です。

## AWS CloudFormationとは？

CloudFormationを使用すると、ユーザーは1つのステップで「リソースのスタック」を作成できます。リソースとは、EC2インスタンス、VPC、サブネットなど、ユーザーが作成したアイテムを指します。そのようなリソースのグループはスタックと呼ばれます。ユーザーは、1つのステップで好みに応じてリソーススタックを簡単に作成できるテンプレートを作成できます。これは手動での作成や設定と比較して、より高速で、再現性があり、一貫性に優れています。さらに、テンプレートはバージョン管理のためにソースコードに配置でき、必要な時にいつでも任意の目的で使用できます。

## Doris on AWS CloudFormationとは？

現在、DorisはDoris CloudFormation Templateを提供しており、ユーザーはこのテンプレートを直接使用してAWS上で関連するDorisバージョンのクラスターを迅速に作成し、最新のDoris機能を体験できます。

:::caution

**注意：** CloudFormationに基づいてDorisクラスターを構築するためのテンプレートは、現在us-east-1、us-west-1、us-west-2のリージョンのみをサポートしています。Doris on AWS CloudFormationは主にテストや体験目的を想定しており、本番環境では使用すべきではありません。
:::

## 使用上の注意事項

- デプロイするVPCとSubnetを決定します。

- ノードへのログインに使用するキーペアを決定します。

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

主要なパラメータは以下の通りです：

- **VPC ID**: デプロイが実行されるVPC。

- **Subnet ID**: デプロイが展開されるサブネット。

- **Key pair name**: デプロイされたBEおよびFEノードへの接続に使用される公開/秘密キーペア。

- **Version of Doris**: デプロイするDorisのバージョン（2.1.0、2.0.6など）。

- **Number of Doris FE**: FEノードの数。テンプレートはデフォルトで1つのFEのみを選択します。

- **Fe instance type**: FEのノードタイプ。デフォルト値を使用できます。

- **Number of Doris Be**: BEノードの数。1または3にできます。

- **Be instance type**: BEのノードタイプ。デフォルト値を使用できます。

- **Meta data dir**: FEノードのメタデータディレクトリ。デフォルト値を使用できます。

- **Sys log level**: システムログのレベルを設定します。デフォルト値の「info」を使用できます。

- **Volume type of Be nodes**: BEノードにマウントされるEBSのボリュームタイプ。各ノードはデフォルトで1つのディスクがマウントされます。デフォルト値を使用できます。

- **Volume size of Be nodes**: BEノードにマウントされるEBSのサイズ（GB単位）。デフォルト値を使用できます。

## データベースへの接続方法

**1. デプロイ成功後の表示は以下の通りです：**

![How to Connect to the Database](/images/how-to-connect-to-the-database.jpeg)

**2. 次に、以下のようにFEの接続アドレスを見つけます。この例では、FE Outputsからアドレスを172.16.0.97として確認できます。**

![find the connection address for FE ](/images/find-connection-address-for-fe-1.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-2.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-3.jpeg)

**3. デプロイされたDoris Clusterに接続するために、CloudFormationを使用してDorisをデプロイした後のデフォルト値は以下の通りです：**

- **FE IP**: 前のセクションの手順に従ってFEのIPアドレスを取得します。

- **FE MySQL protocol port**: 9030

- **FE HTTP protocol port**: 8030

- **Default root password**: 空

- **Default admin password**: 空
