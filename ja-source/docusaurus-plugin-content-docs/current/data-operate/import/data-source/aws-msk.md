---
{
  "title": "AWS MSK",
  "language": "ja",
  "description": "DorisはRoutine Loadを使用してAWS MSKからデータをインポートできます"
}
---

Amazon Managed Streaming for Apache Kafka (AWS MSK) は、AWS が提供するフルマネージドの Apache Kafka サービスです。Kafka を直接消費する場合と同様に、Doris は Routine Load を使用して AWS MSK からリアルタイムにデータをインポートでき、IAM ベースの認証に対応しています。CSV および JSON 形式をサポートし、Exactly-Once セマンティクスによりデータの欠損や重複を防ぎます。詳細は [Routine Load](../import-way/routine-load-manual.md) を参照してください。

## 認証パラメータ

| パラメータ名 | 説明 | 例 |
| :--- | :--- | :--- |
| aws.region | AWS Region | "us-east-1" |
| aws.access_key | AWS Access Key ID | \ |
| aws.secret_key | AWS Secret Access Key | \ |
| aws.role_arn | クロスアカウントアクセス用のロール | "arn:aws:iam::123456789012:role/MyRole" |
| aws.profile_name | `~/.aws/credentials` に設定した AWS プロファイル名 | \ |
| aws.credentials_provider | AWS SDK の標準クレデンシャルプロバイダー（複数タイプをサポート） | "INSTANCEPROFILE" |
| aws.external_id | AssumeRole の「呼び出しコンテキスト識別子」 | \ |
| property.security.protocol | IAM 認証の制約により `SASL_SSL` 固定 | "SASL_SSL" |
| property.sasl.mechanism | librdkafka の制約により `OAUTHBEARER` 固定 | "OAUTHBEARER" |

## 使用制限

1. AWS MSK クラスターが作成済みで、IAM 認証が有効化されていること。
2. MSK クラスターへアクセスできる適切な AWS IAM 権限が設定されていること。
3. Doris クラスターから AWS MSK の Bootstrap Servers に接続できること。

## 認証設定

Doris は以下の IAM 認証方式をサポートします。

### 1. Access Key と Secret Key（AK/SK）を直接使用

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.access_key" = "<your-ak>",
    "aws.secret_key" = "<your-sk>",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### 2. IAM Role（Assume Role）モード

`aws.role_arn` を設定した場合、`aws.credentials_provider` は STS AssumeRole 呼び出し時に使用するソースクレデンシャルプロバイダーを指定します。

**例1: STS のソースクレデンシャルに EC2 Instance Profile を使用**

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

**例2: STS のソースクレデンシャルに環境変数の AK/SK を使用**

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "ENV",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

**例3: STS のソースクレデンシャルにデフォルトプロバイダーチェーンを使用**

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "DEFAULT",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### 3. aws.credentials_provider でクレデンシャルソースを指定

AK/SK を明示的に設定しないケース（例: EC2 Instance Profile）で利用します。

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

`aws.credentials_provider` の指定可能値:

| パラメータ名 | 説明 |
| :--- | :--- |
| DEFAULT | デフォルトのプロバイダーチェーンを使用 |
| ENV | 環境変数からクレデンシャルを取得 |
| INSTANCE_PROFILE | EC2 Instance Profile のクレデンシャルを使用 |

### 複数設定時の優先ルール

1. `aws.access_key` と `aws.secret_key` を同時に設定した場合は AK/SK が優先されます。
2. AK/SK が未設定で `aws.role_arn` が設定されている場合は IAM Role を使用します。このとき `aws.credentials_provider` は STS のソースクレデンシャル選択に使用されます。
3. AK/SK と `aws.role_arn` のどちらも未設定の場合、`aws.credentials_provider` が AWS クライアントのプロバイダーを直接決定します。

## パブリックインターネット経由のアクセス

パブリックインターネット経由で AWS MSK にアクセスする必要がある場合、データインポート中に AWS 認証エラーが発生したら、以下の手順で確認してください。

1. MSK クラスターでパブリックアクセスが有効であることを確認する。  
AWS MSK コンソールで対象クラスターを選択し、**Properties** > **Networking settings** > **Edit public access settings** を確認して、パブリックアクセスが有効になっていることを確認します。
2. サブネットがパブリックであることを確認する。  
クラスターに関連付けられたサブネットはパブリックである必要があります。AWS VPC コンソールで、サブネットのルートテーブルに `0.0.0.0/0 -> igw-xxxx` のエントリがあることを確認します。
3. 正しい Bootstrap のパブリックエンドポイントを使用する。  
AWS MSK コンソールで対象クラスターの **View client information** を開き、Routine Load 作成時の `kafka_broker_list` に **private endpoints** ではなく **public endpoints** を指定していることを確認します。
4. セキュリティグループのインバウンド/アウトバウンドルールが正しいことを確認する。  
MSK のセキュリティグループのインバウンドルールで、**ポート 9198**（IAM アクセス制御で Broker と通信する場合に必要）が適切な送信元 IP 範囲に対して開放されていることを確認します。

詳細は AWS ドキュメントを参照してください:
- [How to safely access an Amazon Managed Streaming for Apache Kafka (Amazon MSK) cluster over the internet](https://aws.amazon.com/cn/blogs/china/how-to-safely-access-amazon-managed-streaming-for-apache-kafka-amazon-msk-cluster-through-the-internet-i/)
- [Access from within AWS but outside cluster's VPC](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [Enable internet access for your VPC using an internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)
