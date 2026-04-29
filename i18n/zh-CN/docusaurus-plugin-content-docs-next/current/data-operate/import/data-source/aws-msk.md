---
{
    "title": "AWS MSK",
    "language": "zh-CN",
    "description": "通过 Routine Load 从 AWS MSK 实时导入数据到 Doris，支持 IAM 认证、AK/SK、Assume Role 等多种凭证方式。",
    "keywords": [
        "AWS MSK",
        "Routine Load",
        "Kafka 导入",
        "IAM 认证",
        "Assume Role",
        "Doris 数据导入",
        "SASL_SSL",
        "OAUTHBEARER"
    ]
}
---

<!-- 知识类型: 操作指南 + 配置参数 -->
<!-- 适用场景: 从 AWS MSK 导入数据到 Doris / IAM 认证配置 / 公网访问排错 -->

Amazon Managed Streaming for Apache Kafka（AWS MSK）是 AWS 提供的完全托管的 Apache Kafka 服务。Doris 支持通过 Routine Load 从 AWS MSK 实时导入数据，提供 AWS MSK 的 IAM 身份验证机制，支持 CSV 和 JSON 格式，具备 Exactly-Once 语义，确保数据不丢失且不重复。更多信息请参考 Routine Load。

## 使用前提

<!-- 知识类型: 部署前检查 -->

在使用 Routine Load 从 AWS MSK 导入数据前，请确认以下条件已满足：

1. AWS MSK 集群已创建并启用 IAM 身份验证。
2. 已配置适当的 AWS IAM 权限，允许访问 MSK 集群。
3. Doris 集群能够访问 AWS MSK 的 Bootstrap Servers。

## 认证参数

<!-- 知识类型: 配置参数 -->

下表列出从 AWS MSK 导入数据时需要配置的认证相关参数：

| 参数名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `aws.region` | AWS Region | `"us-east-1"` |
| `aws.access_key` | AWS Access Key ID | - |
| `aws.secret_key` | AWS Secret Access Key | - |
| `aws.role_arn` | 跨账号访问凭证 Role | `"arn:aws:iam::123456789012:role/MyRole"` |
| `aws.profile_name` | AWS Profile 名称，在 `~/.aws/credentials` 中配置 | - |
| `aws.credentials_provider` | AWS SDK 的标准凭证提供者，支持各种提供者类型 | `"INSTANCE_PROFILE"` |
| `aws.external_id` | 作为 AssumeRole 的"调用上下文标识" | - |
| `property.security.protocol` | 由于 IAM 认证限制，固定填写 `SASL_SSL` | `"SASL_SSL"` |
| `property.sasl.mechanism` | 由于 librdkafka 库限制，固定填写 `OAUTHBEARER` | `"OAUTHBEARER"` |

### `aws.credentials_provider` 可选值

| 取值 | 说明 |
| :--- | :--- |
| `DEFAULT` | 使用默认 provider chain |
| `ENV` | 从环境变量读取凭证 |
| `INSTANCE_PROFILE` | 使用 EC2 Instance Profile 凭证 |

## 认证配置示例

<!-- 知识类型: 操作步骤 -->

Doris 支持以下几种方式进行 IAM 认证，请根据实际部署场景选择：

| 认证方式 | 适用场景 |
| :--- | :--- |
| 直接使用 AK/SK | 已拥有长期有效的 Access Key/Secret Key |
| IAM Role（Assume Role） | 跨账号访问，或希望使用临时凭证 |
| 通过 `aws.credentials_provider` 指定凭证来源 | 不希望显式填写 AK/SK，例如 EC2 Instance Profile |

### 方式 1：直接使用 Access Key 和 Secret Key（AK/SK）

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

### 方式 2：IAM Role（Assume Role）模式

当配置了 `aws.role_arn` 时，`aws.credentials_provider` 用于指定 STS AssumeRole 调用所使用的源凭证 provider。

#### 示例 2.1：EC2 Instance Profile 作为 STS 源凭证

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

#### 示例 2.2：从环境变量读取 AK/SK 作为 STS 源凭证

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

#### 示例 2.3：使用默认 provider chain 作为 STS 源凭证

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

### 方式 3：通过 `aws.credentials_provider` 指定凭证来源

适用于不显式填写 AK/SK 的场景，例如 EC2 Instance Profile。

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

## 凭证生效规则

<!-- 知识类型: 配置优先级 -->

当多个凭证参数同时配置时，按以下优先级生效：

1. 同时配置 `aws.access_key` 和 `aws.secret_key` 时，**优先使用 AK/SK**。
2. 未配置 AK/SK 且配置了 `aws.role_arn` 时，**使用 IAM Role**；此时 `aws.credentials_provider` 用于 STS 源凭证选择。
3. 未配置 AK/SK 且未配置 `aws.role_arn` 时，**`aws.credentials_provider` 直接决定 AWS 客户端使用的 provider**。

## 公网访问排错

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 从公网环境访问 AWS MSK 出现认证失败 -->

对于希望从公网环境访问 AWS MSK 的用户，如果在数据导入过程中出现 AWS 认证问题，可按以下步骤排查：

### 步骤 1：确保 MSK 集群启用了公共访问权限

在 AWS MSK 控制台中，选择访问的集群，查看 **属性** 中的 **联网设置** → **编辑公共访问权限**，确保公共访问权限一栏已打开。

### 步骤 2：确保子网公开

与集群关联的子网必须是公开的。在 AWS VPC 控制台中，确保子网的路由表项包含 `0.0.0.0/0 : igw-xxxx` 表项。

### 步骤 3：使用正确的 Bootstrap 公共端点

在 AWS MSK 控制台中，选择所访问的集群，点击 **查看客户端信息**，确保创建 Routine Load 时的 `kafka_broker_list` 属性值填写的是 **公共端点** 而不是 **私有端点**。

### 步骤 4：确保安全组配置正确的出入站规则

查看 MSK 配置的安全组 **入站规则**，是否为 **端口 9198** 配置了合适的源 IP。

> 说明：如果通过 IAM 访问控制与 Broker 通信，需要通过 9198 端口公开访问。

### 参考文档

更详细的信息请参考 AWS 相关文档：

- [如何通过互联网安全地访问 Amazon Managed Streaming for Apache Kafka (Amazon MSK) 集群](https://aws.amazon.com/cn/blogs/china/how-to-safely-access-amazon-managed-streaming-for-apache-kafka-amazon-msk-cluster-through-the-internet-i/)
- [Access from within AWS but outside cluster's VPC](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [使用互联网网关为 VPC 启用互联网访问](https://docs.aws.amazon.com/zh_cn/vpc/latest/userguide/VPC_Internet_Gateway.html)

## FAQ

<!-- 知识类型: 常见问题 -->

### Q1：`property.security.protocol` 和 `property.sasl.mechanism` 为什么必须固定填写？

由于 AWS MSK IAM 认证机制以及底层 librdkafka 库的限制，这两个参数必须分别固定为 `SASL_SSL` 和 `OAUTHBEARER`，否则无法成功完成 IAM 认证握手。

### Q2：同时配置了 AK/SK 和 `aws.role_arn`，会使用哪种凭证？

会优先使用 AK/SK。详见 [凭证生效规则](#凭证生效规则)。

### Q3：从公网访问 MSK 总是认证失败，应如何排查？

请按 [公网访问排错](#公网访问排错) 中的 4 个步骤逐项检查：公共访问权限是否开启、子网是否公开、Bootstrap 端点是否使用公共端点、安全组是否放通 9198 端口。

### Q4：在 EC2 上运行 Doris，如何免去 AK/SK 配置？

可以在 EC2 实例上绑定具备 MSK 访问权限的 IAM Role，然后将 `aws.credentials_provider` 设置为 `INSTANCE_PROFILE`，参考 [方式 3](#方式-3通过-awscredentials_provider-指定凭证来源)。

### Q5：Doris 通过 Routine Load 从 MSK 导入数据是否保证不丢不重？

是的。Routine Load 提供 Exactly-Once 语义，确保数据不丢失且不重复。
