---
{
    "title": "Doris on AWS",
    "language": "zh-CN",
    "description": "为了方便大家在 AWS 上快速体验 Doris，提供了 CloudFormation 模版（CFT），允许快速启动和运行集群。使用模板，只需最少的配置，就可以自动配置 AWS 资源，并启动 Doris 集群。"
}
---

本文介绍如何在 AWS 上快速部署 Doris 集群，以便体验最新的 Doris 功能。

## 适用场景

如果您希望在 AWS 上快速体验 Doris，可以选择以下两种部署方式：

| 部署方式 | 适用人群 | 特点 |
| --- | --- | --- |
| 使用 CloudFormation 模板（CFT）部署 | 希望快速启动并体验 Doris 的用户 | 只需最少的配置，自动配置 AWS 资源并启动集群 |
| 自行购买 AWS 资源，手动部署 | 希望自定义部署架构的用户 | 完全自主控制资源选择与配置流程 |

本文重点介绍**基于 CloudFormation 模板**的快速部署方式。

:::tip
目前还不支持存算分离模式的编译部署。
:::

:::caution
- 当前的 CloudFormation 模板仅支持 **us-east-1**、**us-west-1**、**us-west-2** 三个区域。
- Doris on AWS CloudFormation 主要用于测试或体验，**请勿用于生产环境**。
:::

## 背景概念

### 什么是 AWS CloudFormation？

CloudFormation 允许用户只用一个步骤就可以创建一个“资源堆栈”。其中：

- **资源**：用户所创建的东西，如 EC2 实例、VPC、子网等。
- **堆栈**：一组这样的资源。

用户可以编写一个模板，按照自己的意愿通过一个步骤创建一个资源堆栈。相比手动创建与配置，CloudFormation 具备以下优势：

- 创建速度更快
- 可重复执行，一致性更好
- 支持将模板纳入源代码进行版本控制，可在任何时候按需复用

### 什么是 Doris on AWS CloudFormation？

Doris 官方提供了 Doris CloudFormation Template，用户可以直接使用该模板在 AWS 上快速创建指定版本的 Doris 集群，方便快速体验最新功能。

## 部署前准备

在开始部署之前，请提前确认以下信息：

- 确定要部署到的 **VPC** 和 **Subnet**
- 确定用于登录节点的 **key pair**
- 知悉部署过程中会创建 **S3 的 VPC Endpoint Interface**

## 部署步骤

### 步骤 1：进入 CloudFormation 并创建 Stack

在 AWS 控制台上进入 CloudFormation，点击 **Create stack**。

![开始部署-AWS 控制台 进入 CloudFormation](/images/start-deployment.jpeg)

选择 **Amazon S3 URL** 作为 Template source，并填写 Amazon S3 URL 为以下模板链接：

```
https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml
```

### 步骤 2：配置模板参数

![配置模板的具体参数](/images/configure-specific-parameters-1.jpeg)

![配置模板的具体参数](/images/configure-specific-parameters-2.jpeg)

![配置模板的具体参数](/images/configure-specific-parameters-3.jpeg)

主要参数说明如下：

| 参数 | 说明 | 备注 |
| --- | --- | --- |
| VPC ID | 要部署到的 VPC | 必填 |
| Subnet ID | 要部署的子网 | 必填 |
| Key pair name | 用来连接部署后的 BE 和 FE 节点的 public/private key pairs | 必填 |
| Version of Doris | 选择部署的 Doris 版本 | 例如 2.1.0、2.0.6 等 |
| Number of Doris FE | FE 的个数 | 模板默认只能选择 1 个 FE |
| Fe instance type | FE 的节点类型 | 可采用默认值 |
| Number of Doris Be | BE 节点的个数 | 可选择 1 个或 3 个 |
| Be instance type | BE 的节点类型 | 可采用默认值 |
| Meta data dir | FE 节点的元数据目录 | 可采用默认值 |
| Sys log level | 系统日志等级 | 可使用默认的 info |
| Volume type of Be nodes | BE 节点挂载 EBS 的 volume type | 每台节点默认挂载一块磁盘，可使用默认值 |
| Volume size of Be nodes | BE 节点挂载 EBS 的大小（单位：GB） | 可使用默认值 |

## 连接 Doris 集群

### 步骤 1：确认部署成功

部署成功后，CloudFormation 会展示如下结果。

![如何连接数据库](/images/how-to-connect-to-the-database.jpeg)

### 步骤 2：获取 FE 的连接地址

按照下面的截图步骤，进入 Stack 的 **Outputs** 标签页，从 FE Outputs 中获取 FE 的连接地址。在以下示例中，FE 的地址为 `172.16.0.97`。

![找到 FE 的连接地址](/images/find-connection-address-for-fe-1.jpeg)

![找到 FE 的连接地址](/images/find-connection-address-for-fe-2.jpeg)

![找到 FE 的连接地址](/images/find-connection-address-for-fe-3.jpeg)

### 步骤 3：连接 Doris 集群

通过 CloudFormation 部署完成后，Doris 集群的默认连接信息如下：

| 项目 | 默认值 |
| --- | --- |
| FE 的 IP | 通过步骤 2 获取的 FE IP 地址 |
| FE 的 MySQL 协议端口 | 9030 |
| FE 的 HTTP 协议端口 | 8030 |
| 默认的 root 密码 | 空 |
| 默认的 admin 密码 | 空 |
