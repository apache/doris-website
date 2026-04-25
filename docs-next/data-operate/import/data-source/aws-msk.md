---
{
    "title": "AWS MSK",
    "language": "en",
    "description": "Doris provides Routine Load to import data from AWS MSK"
}
---

Amazon Managed Streaming for Apache Kafka (AWS MSK) is a fully managed Apache Kafka service provided by AWS. Similar to consuming from Kafka directly, Doris supports real-time data import from AWS MSK through Routine Load with IAM-based authentication. CSV and JSON formats are supported, with Exactly-Once semantics to ensure no data loss and no duplication. For more information, see [Routine Load](../import-way/routine-load-manual.md).

## Authentication Parameters

| Parameter | Description | Example |
| :--- | :--- | :--- |
| aws.region | AWS Region | "us-east-1" |
| aws.access_key | AWS Access Key ID | \ |
| aws.secret_key | AWS Secret Access Key | \ |
| aws.role_arn | Role used for cross-account access | "arn:aws:iam::123456789012:role/MyRole" |
| aws.profile_name | AWS profile name configured in `~/.aws/credentials` | \ |
| aws.credentials_provider | Standard AWS SDK credentials provider, supporting multiple provider types | "INSTANCEPROFILE" |
| aws.external_id | A "caller context identifier" for AssumeRole | \ |
| property.security.protocol | Due to IAM authentication requirements, this must be `SASL_SSL` | "SASL_SSL" |
| property.sasl.mechanism | Due to librdkafka constraints, this must be `OAUTHBEARER` | "OAUTHBEARER" |

## Usage Restrictions

1. The AWS MSK cluster is created and IAM authentication is enabled.
2. Proper AWS IAM permissions are configured to allow access to the MSK cluster.
3. The Doris cluster can access the AWS MSK bootstrap servers.

## Authentication Configuration

Doris supports the following IAM authentication modes:

### 1. Use Access Key and Secret Key (AK/SK) directly

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

### 2. IAM Role (Assume Role) mode

When `aws.role_arn` is configured, `aws.credentials_provider` specifies which source credential provider is used for the STS AssumeRole call.

**Example 1: Use EC2 Instance Profile as STS source credentials**

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

**Example 2: Use AK/SK from environment variables as STS source credentials**

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

**Example 3: Use the default provider chain as STS source credentials**

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

### 3. Specify credential source through aws.credentials_provider

This mode applies when AK/SK is not explicitly provided, such as using EC2 Instance Profile.

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

Available `aws.credentials_provider` values:

| Parameter | Description |
| :--- | :--- |
| DEFAULT | Use the default provider chain |
| ENV | Read credentials from environment variables |
| INSTANCE_PROFILE | Use EC2 Instance Profile credentials |

### Precedence Rules When Configuring Multiple Options

1. If both `aws.access_key` and `aws.secret_key` are configured, AK/SK is used first.
2. If AK/SK is not configured but `aws.role_arn` is configured, IAM Role is used. In this case, `aws.credentials_provider` is used to choose the STS source credentials.
3. If neither AK/SK nor `aws.role_arn` is configured, `aws.credentials_provider` directly determines which provider the AWS client uses.

## Public Internet Access

For users who need to access AWS MSK over the public internet, if AWS authentication issues occur during data import, troubleshoot step by step using the guidance below.

1. Ensure public access is enabled for the MSK cluster.
In the AWS MSK console, select your cluster and check **Properties** > **Networking settings** > **Edit public access settings**. Ensure public access is enabled.
2. Ensure the subnet is public.
The subnet associated with the cluster must be public. In the AWS VPC console, make sure the subnet route table includes a `0.0.0.0/0 -> igw-xxxx` entry.
3. Use the correct public bootstrap endpoints.
In the AWS MSK console, select the cluster and click **View client information**. Ensure `kafka_broker_list` in your Routine Load job uses **public endpoints** instead of private endpoints.
4. Ensure security group inbound/outbound rules are correct.
Check the MSK security group inbound rules and verify that **port 9198** is properly opened to the required source IP ranges (when communicating with brokers through IAM access control, port 9198 must be publicly reachable).

For more details, see AWS documentation:
- [How to safely access an Amazon Managed Streaming for Apache Kafka (Amazon MSK) cluster over the internet](https://aws.amazon.com/cn/blogs/china/how-to-safely-access-amazon-managed-streaming-for-apache-kafka-amazon-msk-cluster-through-the-internet-i/)
- [Access from within AWS but outside cluster's VPC](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [Enable internet access for your VPC using an internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)
