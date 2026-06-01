---
{
    "title": "Apache Doris IAM Assume Role 工作原理",
    "language": "zh-CN",
    "description": "解析 Apache Doris 如何基于 AWS IAM Assume Role 实现 S3 访问鉴权：替代 AK/SK 长期密钥，使用 STS 临时凭证安全访问云资源。",
    "keywords": [
        "Apache Doris",
        "AWS IAM",
        "Assume Role",
        "STS 临时凭证",
        "S3 鉴权",
        "Doris 访问 S3",
        "AK SK 替代",
        "IAM Role",
        "External ID",
        "EC2 Instance Profile",
        "Trust Relationship",
        "最小权限原则",
        "存储桶访问",
        "S3 Load",
        "Storage Vault"
    ]
}
---

# Apache Doris IAM Assume Role 工作原理

<!-- 知识类型: 架构原理 / 鉴权机制说明 -->
<!-- 适用场景: 安全合规改造 / 替代 AK/SK 长期密钥 / 跨账号访问 S3 -->

本文介绍 Apache Doris 如何基于 AWS IAM Assume Role 机制访问 S3 资源，包括其相对于传统 AK/SK 方式的优势、STS 临时凭证的鉴权流程，以及 Doris 在 EC2 部署环境下的集成方式。

## 适用场景

| 场景 | 说明 |
|------|------|
| 替代 AK/SK 长期密钥 | 通过 STS 动态临时凭证消除硬编码密钥的泄露风险 |
| 跨 AWS 账号访问 S3 | 源账户实体担任目标账户角色，借助 External ID 实现安全隔离 |
| 最小权限合规审计 | 基于角色授权，AWS 后台可审计具体操作主体与行为 |
| EC2 部署的 Doris 集群 | FE/BE 节点自动通过 EC2 Instance Profile 完成 Assume Role |

## 前置条件

- Apache Doris 版本 **3.0.6 及以上**（S3 Load、TVF、Export、Resource、Repository、Storage Vault 等功能均支持 Assume Role）
- FE、BE 进程部署在 AWS EC2 实例上，并已绑定 IAM Role
- 已规划源账户（Source Account）与目标账户（Target Account）的 IAM 角色与信任关系
- 拥有 STS 服务的可用访问权限

## 一、传统 AK/SK 方式访问 AWS 资源存在的问题

<!-- 知识类型: 背景分析 -->

静态 AK/SK 的访问模式在密钥管理、审计追溯与权限控制等方面均存在显著缺陷：

| 风险类别 | 具体表现 |
|----------|----------|
| **长期暴露风险** | 静态 AK/SK 需硬编码于配置文件中，一旦因代码泄露、误提交或恶意窃取导致密钥扩散，攻击者可永久获得等同于密钥所有者的完整权限，引发持续性的数据泄露、资源篡改及资金损失风险 |
| **审计盲区** | 多用户/多服务共享同一组密钥时，云操作日志仅记录密钥身份而无法关联具体使用者，无法追溯真实责任人或业务模块 |
| **运维成本高** | 密钥轮换灾难，需手动轮换业务模块密钥，容易出错触发服务中断 |
| **权限管理失控** | 账户级粗放授权无法满足服务/实例级的最小权限管控需求 |

## 二、AWS IAM Assume Role 机制介绍

<!-- 知识类型: 概念定义 -->

### 2.1 AWS IAM Assume Role 是什么

AWS Assume Role 是一种安全身份切换机制，允许一个可信实体（如 IAM 用户、EC2 实例或外部账号）通过 STS（安全令牌服务）临时获取目标角色的权限，其运作流程如下：

![AWS IAM Assume Role 流程图](/images/integrations/aws_iam_role_flow.png)

### 2.2 使用 AWS IAM Assume Role 方式访问的优点

- **动态令牌机制**：使用有效期 15 分钟 ~ 12 小时的临时凭证替代永久密钥
- **跨账号安全隔离**：通过 External ID 实现跨账号安全隔离，并且可通过 AWS 后台服务进行审计
- **最小权限原则**：基于角色的最小权限原则（Principle of Least Privilege）

### 2.3 AWS IAM Assume Role 访问 S3 Bucket 的鉴权过程

<!-- 知识类型: 操作流程 / 鉴权流程 -->

整体鉴权过程分为三个阶段：源用户身份验证 → 目标角色权限激活 → 资源操作执行。

![IAM Role 访问 S3 Bucket 鉴权过程](/images/integrations/iam_role_access_bucket.png)

#### 阶段 1：源用户身份验证

1. **权限策略检查**
    - 源用户发起 AssumeRole 请求时，源账户的 IAM 策略引擎首先验证：该用户是否被授权调用 `sts:AssumeRole` 操作？
    - 检查依据：附着在源用户身份上的 IAM Permissions Policies

2. **信任关系校验**
    - 通过 STS 服务向目标账户发起请求：源用户是否在目标角色的信任策略白名单中？
    - 检查依据：目标角色绑定的 IAM Trust Relationships Policies（明确允许哪些账号/用户担任该角色）

#### 阶段 2：目标角色权限激活

3. **临时凭证生成**

    若信任关系验证通过，STS 生成三要素临时凭证：

    ```json
    {
        "AccessKeyId": "***",
        "SecretAccessKey": "***",
        "SessionToken": "***"
    }
    ```

    凭证有效期为 15 分钟 ~ 12 小时。

4. **目标角色权限验证**
    - 目标角色使用临时凭证访问 S3 前，目标账户的 IAM 策略引擎校验：该角色是否被授权执行请求的 S3 操作？（如 `s3:GetObject`、`s3:PutObject` 等）
    - 检查依据：附着在目标角色上的 IAM Permissions Policies（定义角色能做什么）

#### 阶段 3：资源操作执行

5. **访问存储桶**：全部验证通过后，目标角色才可执行 S3 API 操作。

## 三、Doris 如何应用 AWS IAM Assume Role 鉴权机制

<!-- 知识类型: 集成方案 -->
<!-- 适用场景: Doris on EC2 集群配置 STS 鉴权 -->

### 3.1 集成原理

Doris 通过将 FE、BE 进程所部署的 AWS EC2 Instances 绑定到 Source Account 来使用 AWS IAM Assume Role 功能，主要流程如下图所示：

![Doris 集成 IAM Role 流程](/images/integrations/doris_iam_role.png)

完成配置后，Doris FE/BE 进程会自动获取 EC2 Instance 的 Profile 执行 Assume Role 操作访问 Bucket。集群扩容时，BE 节点会自动检测新 EC2 Instance 是否成功绑定 IAM Role，防止漏配。

### 3.2 支持的功能范围

Doris 的 S3 Load、TVF、Export、Resource、Repository、Storage Vault 等功能在 **3.0.6+** 版本均支持 AWS Assume Role 方式，执行 SQL 相关功能时会进行连通性检测。

### 3.3 SQL 配置示例

以创建 S3 Repository 为例：

```sql
CREATE REPOSITORY `s3_repo`
WITH S3 ON LOCATION "s3://bucket/path/"
PROPERTIES (
  "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
  "s3.external_id" = "doris-external-id",
  "timeout" = "3600"
);
```

关键参数说明：

| 参数 | 必选 | 说明 |
|------|------|------|
| `s3.role_arn` | 是 | 填入 AWS IAM Account2 下的 IAM Role2 的 ARN 值 |
| `s3.external_id` | 否 | 填入 Trust Relationships Policies 中配置的 externalId 的值 |
| `timeout` | 否 | 操作超时时间，单位秒 |

更多功能 SQL 语句的详细使用方式，参考：[AWS 认证和鉴权](../../../admin-manual/auth/integrations/aws-authentication-and-authorization#assumed-role-authentication)。
