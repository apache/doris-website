---
{
    "title": "AWS MSK",
    "language": "ja",
    "description": "Routine Load を使用して AWS MSK から Doris にデータをリアルタイムで取り込みます。IAM 認証、AK/SK、Assume Role などの認証情報の取得方法に対応しています。",
    "keywords": [
        "AWS MSK",
        "Routine Load",
        "Kafka からのデータ取り込み",
        "IAM 認証",
        "Assume Role",
        "Doris へのデータ取り込み",
        "SASL_SSL",
        "OAUTHBEARER"
    ]
}
---

> この機能は Doris 4.1.0 以降でサポートされます。

<!-- Knowledge type: Operation guide + Configuration parameters -->
<!-- Applicable scenarios: Import data from AWS MSK into Doris / IAM authentication configuration / Public network access troubleshooting -->

Amazon Managed Streaming for Apache Kafka（AWS MSK）は、AWS が提供するフルマネージドの Apache Kafka サービスです。Doris は Routine Load を通じて AWS MSK からのリアルタイムデータ取り込みをサポートし、AWS MSK の IAM 認証を利用できます。CSV 形式と JSON 形式に対応し、データの欠落や重複を防ぐ Exactly-Once セマンティクスを提供します。詳しくは Routine Load を参照してください。

## 前提条件 {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

Routine Load を使用して AWS MSK からデータを取り込む前に、次の条件を満たしていることを確認してください。

1. AWS MSK クラスターが作成され、IAM 認証が有効になっている。
2. MSK クラスターへのアクセスを許可する適切な AWS IAM 権限が設定されている。
3. Doris クラスターから AWS MSK の Bootstrap Servers にアクセスできる。

## 認証パラメータ {#authentication-parameters}

<!-- Knowledge type: Configuration parameters -->

次の表に、AWS MSK からデータを取り込む際に設定する認証関連のパラメータを示します。

| パラメータ | 説明 | 例 |
| :--- | :--- | :--- |
| `aws.region` | AWS リージョン | `"us-east-1"` |
| `aws.access_key` | AWS アクセスキー ID | - |
| `aws.secret_key` | AWS シークレットアクセスキー | - |
| `aws.role_arn` | アカウントをまたぐアクセスの認証情報に使用するロール | `"arn:aws:iam::123456789012:role/MyRole"` |
| `aws.profile_name` | `~/.aws/credentials` に設定された AWS プロファイル名 | - |
| `aws.credentials_provider` | AWS SDK の標準認証情報プロバイダー。複数のプロバイダー種別に対応 | `"INSTANCE_PROFILE"` |
| `aws.external_id` | AssumeRole の「呼び出しコンテキスト識別子」として使用 | - |
| `property.security.protocol` | IAM 認証の制約により、`SASL_SSL` に固定 | `"SASL_SSL"` |
| `property.sasl.mechanism` | librdkafka ライブラリの制約により、`OAUTHBEARER` に固定 | `"OAUTHBEARER"` |

### `aws.credentials_provider` に指定できる値 {#available-values-for-awscredentials_provider}

| 値 | 説明 |
| :--- | :--- |
| `DEFAULT` | デフォルトのプロバイダーチェーンを使用 |
| `ENV` | 環境変数から認証情報を読み取る |
| `INSTANCE_PROFILE` | EC2 インスタンスプロファイルの認証情報を使用 |

## 認証設定の例 {#authentication-configuration-examples}

<!-- Knowledge type: Operation steps -->

Doris は次の IAM 認証方法をサポートします。実際のデプロイ環境に応じて一つ選択してください。

| 認証方法 | 適用シナリオ |
| :--- | :--- |
| AK/SK を直接使用 | 長期有効なアクセスキーとシークレットキーをすでに持っている場合 |
| IAM ロール（Assume Role） | アカウントをまたいでアクセスする場合、または一時的な認証情報を使用したい場合 |
| `aws.credentials_provider` で認証情報の取得元を指定 | EC2 インスタンスプロファイルを使用する場合など、AK/SK を明示的に入力したくない場合 |

### 方法 1: アクセスキーとシークレットキー（AK/SK）を直接使用する {#method-1-use-access-key-and-secret-key-aksk-directly}

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

### 方法 2: IAM ロール（Assume Role）を使用する {#method-2-iam-role-assume-role-mode}

`aws.role_arn` を設定した場合、`aws.credentials_provider` は STS の AssumeRole 呼び出しに使用する元の認証情報プロバイダーを指定します。

#### 例 2.1: EC2 インスタンスプロファイルを STS の認証情報の取得元として使用する {#example-21-ec2-instance-profile-as-the-sts-source-credential}

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

#### 例 2.2: 環境変数から AK/SK を読み取り、STS の認証情報の取得元として使用する {#example-22-read-aksk-from-environment-variables-as-the-sts-source-credential}

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

#### 例 2.3: デフォルトのプロバイダーチェーンを STS の認証情報の取得元として使用する {#example-23-use-the-default-provider-chain-as-the-sts-source-credential}

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

### 方法 3: `aws.credentials_provider` で認証情報の取得元を指定する {#method-3-specify-the-credential-source-through-awscredentials_provider}

EC2 インスタンスプロファイルを使用する場合など、AK/SK を明示的に指定しないシナリオに適しています。

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

## 認証情報の解決順序 {#credential-resolution-rules}

<!-- Knowledge type: Configuration priority -->

複数の認証情報パラメータを同時に設定した場合、次の優先順位で適用されます。

1. `aws.access_key` と `aws.secret_key` の両方が設定されている場合、**AK/SK が最優先で使用されます**。
2. AK/SK が設定されておらず、`aws.role_arn` が設定されている場合、**IAM ロールが使用されます**。この場合、`aws.credentials_provider` で STS の認証情報の取得元を選択します。
3. AK/SK と `aws.role_arn` のいずれも設定されていない場合、**`aws.credentials_provider` が AWS クライアントで使用するプロバイダーを直接決定します**。

## パブリックネットワークからのアクセスに関するトラブルシューティング {#public-network-access-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Authentication failure when accessing AWS MSK from the public network -->

パブリックネットワーク環境から AWS MSK にアクセスする場合、データ取り込み中に AWS 認証の問題が発生したら、次の手順で原因を調べてください。

### 手順 1: MSK クラスターでパブリックアクセスが有効になっていることを確認する {#step-1-ensure-that-the-msk-cluster-has-public-access-enabled}

AWS MSK コンソールでアクセス先のクラスターを選択し、**Properties** の **Networking settings** にある **Edit public access** を開きます。パブリックアクセスのオプションが有効になっていることを確認してください。

### 手順 2: サブネットがパブリックであることを確認する {#step-2-ensure-that-the-subnet-is-public}

クラスターに関連付けられたサブネットはパブリックである必要があります。AWS VPC コンソールで、サブネットのルートテーブルに `0.0.0.0/0 : igw-xxxx` のエントリが含まれていることを確認してください。

### 手順 3: 正しいパブリック Bootstrap エンドポイントを使用する {#step-3-use-the-correct-bootstrap-public-endpoint}

AWS MSK コンソールでアクセス先のクラスターを選択し、**View client information** をクリックします。Routine Load の作成時に指定する `kafka_broker_list` プロパティには、**プライベートエンドポイント**ではなく**パブリックエンドポイント**を設定してください。

### 手順 4: セキュリティグループのインバウンドルールとアウトバウンドルールが正しく設定されていることを確認する {#step-4-ensure-that-the-security-group-is-configured-with-correct-inbound-and-outbound-rules}

MSK に設定されたセキュリティグループの**インバウンドルール**を確認し、**ポート 9198** に対して適切な送信元 IP が設定されていることを確認してください。

> 注: IAM アクセス制御を使用してブローカーと通信する場合は、ポート 9198 経由のアクセスを許可する必要があります。

### 参考資料 {#reference-documents}

詳しくは、関連する AWS ドキュメントを参照してください。

- [インターネット経由で Amazon Managed Streaming for Apache Kafka（Amazon MSK）クラスターに安全にアクセスする方法](https://docs.aws.amazon.com/msk/latest/developerguide/public-access.html)
- [AWS 内のクラスター VPC 外からのアクセス](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [インターネットゲートウェイを使用して VPC のインターネットアクセスを有効にする](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

## よくある質問 {#faq}

<!-- Knowledge type: Frequently asked questions -->

### Q1: `property.security.protocol` と `property.sasl.mechanism` の値を固定する必要があるのはなぜですか？ {#q1-why-must-propertysecurityprotocol-and-propertysaslmechanism-be-fixed-values}

AWS MSK の IAM 認証方式と、基盤となる librdkafka ライブラリの制約により、これらのパラメータはそれぞれ `SASL_SSL` と `OAUTHBEARER` に固定する必要があります。それ以外の値では、IAM 認証のハンドシェイクを正常に完了できません。

### Q2: AK/SK と `aws.role_arn` を同時に設定した場合、どちらの認証情報が使用されますか？ {#q2-when-aksk-and-awsrole_arn-are-configured-at-the-same-time-which-credential-is-used}

AK/SK が優先して使用されます。詳しくは[認証情報の解決順序](#credential-resolution-rules)を参照してください。

### Q3: パブリックネットワークから MSK にアクセスすると認証が必ず失敗します。どう調べればよいですか？ {#q3-authentication-always-fails-when-accessing-msk-from-the-public-network-how-should-this-be-troubleshot}

[パブリックネットワークからのアクセスに関するトラブルシューティング](#public-network-access-troubleshooting)の四つの手順に従い、パブリックアクセスが有効か、サブネットがパブリックか、パブリック Bootstrap エンドポイントを使用しているか、セキュリティグループでポート 9198 が許可されているかを順に確認してください。

### Q4: EC2 で Doris を実行する場合、AK/SK を設定せずに済ませるにはどうすればよいですか？ {#q4-when-running-doris-on-ec2-how-can-aksk-configuration-be-avoided}

MSK へのアクセス権限を持つ IAM ロールを EC2 インスタンスに関連付け、`aws.credentials_provider` を `INSTANCE_PROFILE` に設定します。[方法 3](#method-3-specify-the-credential-source-through-awscredentials_provider)を参照してください。

### Q5: Doris は Routine Load を使った MSK からのデータ取り込みで、データの欠落や重複がないことを保証しますか？ {#q5-does-doris-guarantee-no-data-loss-or-duplication-when-importing-data-from-msk-through-routine-load}

はい。Routine Load は Exactly-Once セマンティクスを提供し、データの欠落や重複を防ぎます。
