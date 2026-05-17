---
{
    "title": "AWS MSK",
    "language": "en",
    "description": "Import data from AWS MSK into Doris in real time using Routine Load. Supports IAM authentication, AK/SK, Assume Role, and other credential methods.",
    "keywords": [
        "AWS MSK",
        "Routine Load",
        "Kafka import",
        "IAM authentication",
        "Assume Role",
        "Doris data import",
        "SASL_SSL",
        "OAUTHBEARER"
    ]
}
---

<!-- Knowledge type: Operation guide + Configuration parameters -->
<!-- Applicable scenarios: Import data from AWS MSK into Doris / IAM authentication configuration / Public network access troubleshooting -->

Amazon Managed Streaming for Apache Kafka (AWS MSK) is a fully managed Apache Kafka service provided by AWS. Doris supports importing data from AWS MSK in real time through Routine Load, providing the IAM authentication mechanism for AWS MSK. It supports CSV and JSON formats and offers Exactly-Once semantics, ensuring that data is neither lost nor duplicated. For more information, refer to Routine Load.

## Prerequisites

<!-- Knowledge type: Pre-deployment checks -->

Before using Routine Load to import data from AWS MSK, confirm that the following conditions are met:

1. The AWS MSK cluster has been created and IAM authentication is enabled.
2. Appropriate AWS IAM permissions have been configured to allow access to the MSK cluster.
3. The Doris cluster can access the Bootstrap Servers of AWS MSK.

## Authentication Parameters

<!-- Knowledge type: Configuration parameters -->

The following table lists the authentication-related parameters that need to be configured when importing data from AWS MSK:

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `aws.region` | AWS Region | `"us-east-1"` |
| `aws.access_key` | AWS Access Key ID | - |
| `aws.secret_key` | AWS Secret Access Key | - |
| `aws.role_arn` | Role used for cross-account access credentials | `"arn:aws:iam::123456789012:role/MyRole"` |
| `aws.profile_name` | AWS Profile name configured in `~/.aws/credentials` | - |
| `aws.credentials_provider` | Standard credentials provider of the AWS SDK. Supports various provider types | `"INSTANCE_PROFILE"` |
| `aws.external_id` | Used as the "calling context identifier" for AssumeRole | - |
| `property.security.protocol` | Due to IAM authentication restrictions, this is fixed to `SASL_SSL` | `"SASL_SSL"` |
| `property.sasl.mechanism` | Due to librdkafka library restrictions, this is fixed to `OAUTHBEARER` | `"OAUTHBEARER"` |

### Available values for `aws.credentials_provider`

| Value | Description |
| :--- | :--- |
| `DEFAULT` | Use the default provider chain |
| `ENV` | Read credentials from environment variables |
| `INSTANCE_PROFILE` | Use EC2 Instance Profile credentials |

## Authentication Configuration Examples

<!-- Knowledge type: Operation steps -->

Doris supports the following methods for IAM authentication. Choose one according to your actual deployment scenario:

| Authentication method | Applicable scenario |
| :--- | :--- |
| Use AK/SK directly | You already have a long-term valid Access Key/Secret Key |
| IAM Role (Assume Role) | Cross-account access, or when temporary credentials are preferred |
| Specify the credential source through `aws.credentials_provider` | When you do not want to explicitly fill in AK/SK, for example with EC2 Instance Profile |

### Method 1: Use Access Key and Secret Key (AK/SK) directly

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

### Method 2: IAM Role (Assume Role) mode

When `aws.role_arn` is configured, `aws.credentials_provider` is used to specify the source credential provider used by the STS AssumeRole call.

#### Example 2.1: EC2 Instance Profile as the STS source credential

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

#### Example 2.2: Read AK/SK from environment variables as the STS source credential

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

#### Example 2.3: Use the default provider chain as the STS source credential

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

### Method 3: Specify the credential source through `aws.credentials_provider`

This is suitable for scenarios where AK/SK is not explicitly provided, such as EC2 Instance Profile.

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

## Credential Resolution Rules

<!-- Knowledge type: Configuration priority -->

When multiple credential parameters are configured at the same time, they take effect in the following order of priority:

1. When both `aws.access_key` and `aws.secret_key` are configured, **AK/SK is used first**.
2. When AK/SK is not configured but `aws.role_arn` is configured, **the IAM Role is used**. In this case, `aws.credentials_provider` is used to select the STS source credential.
3. When neither AK/SK nor `aws.role_arn` is configured, **`aws.credentials_provider` directly determines the provider used by the AWS client**.

## Public Network Access Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Authentication failure when accessing AWS MSK from the public network -->

For users who want to access AWS MSK from a public network environment, if AWS authentication issues occur during data import, troubleshoot using the following steps:

### Step 1: Ensure that the MSK cluster has public access enabled

In the AWS MSK console, select the cluster you want to access, and check **Networking settings** under **Properties** by going to **Edit public access**. Make sure that the public access option is turned on.

### Step 2: Ensure that the subnet is public

The subnet associated with the cluster must be public. In the AWS VPC console, ensure that the route table entries of the subnet contain the `0.0.0.0/0 : igw-xxxx` entry.

### Step 3: Use the correct Bootstrap public endpoint

In the AWS MSK console, select the cluster you want to access, click **View client information**, and ensure that the `kafka_broker_list` property used when creating the Routine Load is filled in with the **public endpoint** rather than the **private endpoint**.

### Step 4: Ensure that the security group is configured with correct inbound and outbound rules

Check the **inbound rules** of the security group configured for MSK to see whether an appropriate source IP is configured for **port 9198**.

> Note: If you communicate with the broker through IAM access control, you need to expose access through port 9198.

### Reference Documents

For more detailed information, refer to the related AWS documents:

- [How to safely access Amazon Managed Streaming for Apache Kafka (Amazon MSK) clusters through the internet](https://docs.aws.amazon.com/msk/latest/developerguide/public-access.html)
- [Access from within AWS but outside cluster's VPC](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [Enable internet access for a VPC using an internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

## FAQ

<!-- Knowledge type: Frequently asked questions -->

### Q1: Why must `property.security.protocol` and `property.sasl.mechanism` be fixed values?

Due to the AWS MSK IAM authentication mechanism and the limitations of the underlying librdkafka library, these two parameters must be fixed to `SASL_SSL` and `OAUTHBEARER` respectively. Otherwise, the IAM authentication handshake cannot be completed successfully.

### Q2: When AK/SK and `aws.role_arn` are configured at the same time, which credential is used?

AK/SK is used first. For details, see [Credential Resolution Rules](#credential-resolution-rules).

### Q3: Authentication always fails when accessing MSK from the public network. How should this be troubleshot?

Follow the four steps in [Public Network Access Troubleshooting](#public-network-access-troubleshooting) and check each item: whether public access is enabled, whether the subnet is public, whether the Bootstrap endpoint uses the public endpoint, and whether the security group allows port 9198.

### Q4: When running Doris on EC2, how can AK/SK configuration be avoided?

You can bind an IAM Role with MSK access permissions to the EC2 instance, and then set `aws.credentials_provider` to `INSTANCE_PROFILE`. Refer to [Method 3](#method-3-specify-the-credential-source-through-awscredentials_provider).

### Q5: Does Doris guarantee no data loss or duplication when importing data from MSK through Routine Load?

Yes. Routine Load provides Exactly-Once semantics, ensuring that data is neither lost nor duplicated.
