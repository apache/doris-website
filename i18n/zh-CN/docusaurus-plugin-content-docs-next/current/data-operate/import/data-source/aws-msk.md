---
{
    "title": "AWS MSK",
    "language": "zh-CN",
    "description": "Doris 提供RoutineLoad的方式从AWS MSK中导入数据"
}
---

Amazon Managed Streaming for Apache Kafka (AWS MSK) 是 AWS 提供的完全托管的 Apache Kafka 服务。因此与消费Kafka类似，Doris 支持通过 Routine Load 从 AWS MSK 实时导入数据，提供 AWS MSK 的 IAM 身份验证机制。支持 CSV 和 JSON 格式，具备 Exactly-Once 语义，确保数据不丢失且不重复。更多信息请参考 Routine Load。

## 认证参数

| 参数名                                      | 说明                                   | 示例 |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- |
| aws.region | AWS Region | "us-east-1" |
| aws.access_key | AWS Access Key ID | \ |
| aws.secret_key | AWS Secret Access Key | \ |
| aws.role_arn | 跨账号访问凭证role | "arn:aws:iam::123456789012:role/MyRole" |
| aws.profile_name | Aws profile名称，在~/.aws/credentials中配置 | \ |
| aws.credentials_provider | AWS SDK 的标准凭证提供者，支持各种提供者类型 | "INSTANCEPROFILE" |
| aws.external_id | 作为AssumeRole的一个“调用上下文标识” | \ |
| property.security.protocol | 由于IAM认证限制，固定填写SASL_SSL | "SASL_SSL" |
| property.sasl.mechanism | 由于librdkafka库限制，固定填写OAUTHBEARER | "OAUTHBEARER" |


## 使用限制

1. AWS MSK 集群已创建并启用 IAM 身份验证
2. 已配置适当的 AWS IAM 权限，允许访问 MSK 集群
3. Doris 集群能够访问 AWS MSK 的 Bootstrap Servers

## 认证配置

Doris 支持以下几种方式进行IAM认证：

### 1. 直接使用 Access Key 和 Secret Key（AK/SK）

```SQL
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

### 2. IAM Role（Assume Role）模式

当配置了 aws.role_arn 时，aws.credentials_provider 用于指定 STS AssumeRole 调用所使用的源凭证 provider：

**示例 1：EC2 Instance Profile 作为 STS 源凭证**

```SQL
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

**示例 2：间接从环境变量读取aksk 作为 STS 源凭证**

```SQL
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

**示例 3：使用默认 provider chain 作为 STS 源凭证**

```SQL
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

### 3. 通过aws.credentials_provider指定凭证来源

适用于不显式填写 AK/SK 的场景，例如 EC2 Instance Profile。

```SQL
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

aws.credentials_provider可选值：

| 参数名                                      | 说明                                   |
| :-------------------------------------------- | :----------------------------------------- |
| DEFAULT | 使用默认 provider chain |
| ENV | 从环境变量读取凭证 |
| INSTANCE_PROFILE | 使用 EC2 Instance Profile 凭证 | 


### 同时配置时的生效规则

1. 同时配置 aws.access_key 和 aws.secret_key 时，优先使用 AK/SK。
2. 未配置 AK/SK 且配置了 aws.role_arn 时，使用 IAM Role；此时aws.credentials_provider 用于 STS 源凭证选择。
3. 未配置 AK/SK 且未配置 aws.role_arn 时，aws.credentials_provider 直接决定 AWS 客户端使用的 provider。

## 公网访问

对于那些希望从公网环境访问AWS MSK的用户，如果在数据导入过程中出现AWS认证的问题，可按下面的文档一步一步排查问题。
1. 确保MSK集群启用了公共访问权限
在AWS MSK控制台中，选择访问的集群，查看**属性**中的**联网设置**：**编辑公共访问权限**，确保公共访问权限一栏是打开的。
2. 确保子网公开
与集群关联的子网必须是公开的。在AWS VPC控制台中，确保子网的路由表项包含0.0.0.0/0：igw-xxxx表项。
3. 使用正确的Bootstrap公共端点
在AWS MSK控制台中，选择所访问的集群，点击**查看客户端信息**，确保创建Routineload Load时的kafka_broker_list 属性值填写的是**公共端点**而不是**私有端点**。
4. 确保安全组配置正确的出入站规则
查看MSK配置的安全组**入站规则**，是否为**端口**9198（如果是通过IAM 访问控制与Broker进行通信，需要通过9198端口公开访问）配置了合适的源ip

更详细的信息可以参考AWS相关文档：
- [如何通过互联网安全地访问Amazon Managed Streaming for Apache Kafka (Amazon MSK) 集群](https://aws.amazon.com/cn/blogs/china/how-to-safely-access-amazon-managed-streaming-for-apache-kafka-amazon-msk-cluster-through-the-internet-i/)
- [Access from within AWS but outside cluster's VPC](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [使用互联网网关为 VPC 启用互联网访问](https://docs.aws.amazon.com/zh_cn/vpc/latest/userguide/VPC_Internet_Gateway.html)
