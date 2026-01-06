---
{
    "title": "Doris on AWS",
    "language": "zh-CN",
    "description": "为了方便大家在 AWS 上快速体验 Doris，提供了 CloudFormation 模版（CFT），允许快速启动和运行集群。使用模板，只需最少的配置，就可以自动配置 AWS 资源，并启动 Doris 集群。"
}
---

为了方便大家在 AWS 上快速体验 Doris，提供了 CloudFormation 模版（CFT），允许快速启动和运行集群。使用模板，只需最少的配置，就可以自动配置 AWS 资源，并启动 Doris 集群。

当然，您也可以自行购买 AWS 资源，采用标准的手动方式进行集群部署。

:::tip
目前还不支持存算分离模式编译部署
:::

## 什么是 AWS CloudFormation？

CloudFormation 允许用户只用一个步骤就可以创建一个“资源堆栈”。资源是指用户所创建的东西（如 EC2 实例、VPC、子网等），一组这样的资源称为堆栈。用户可以编写一个模板，使用它可以很容易地按照用户的意愿通过一个步骤创建一个资源堆栈。这比手动创建并且配置更快，而且可重复，一致性更好。并且可以将模板放入源代码做版本控制，在任何时候根据需要把它用于任何目的。

## 什么是 Doris on AWS CloudFormation？

当前 Doris 提供了 Doris CloudFormation Template，方便用户直接使用这个模板可以在 AWS 上快速创建 Doris 相关版本的集群，以便体验最新的 Doris 功能。

:::caution

注意：

基于 CloudFormation 构建 Doris 集群的模板，当前仅支持 us-east-1，us-west-1，us-west-2 区域。

Doris on AWS CloudFormation 主要用于测试或者体验，请不要用于生产环境。
:::

## 使用前注意

- 确定要部署的 VPC 和 Subnet

- 确定用来登录节点的 key pair

- 部署中会建立 S3 的 VPC Endpoint Interface

## 开始部署

**1. AWS 控制台上，进入 CloudFormation，点击 Create stack**

![开始部署-AWS 控制台 进入 CloudFormation](/images/start-deployment.jpeg)

选用 Amazon S3 URL Template source，填写 Amazon S3 URL 为下面模板链接：

https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml

**2. 配置模板的具体参数**


![配置模板的具体参数](/images/configure-specific-parameters-1.jpeg)

![配置模板的具体参数](/images/configure-specific-parameters-2.jpeg)

![配置模板的具体参数](/images/configure-specific-parameters-3.jpeg)


主要参数说明如下：

- VPC ID：要部署到的 VPC

- Subnet ID：要部署的子网

- Key pair name：用来连接部署后的 BE 和 FE 节点的 public/private key pairs

- Version of Doris：选择部署的 Doris 版本，比如 2.1.0、2.0.6 等

- Number of Doris FE：FE 的个数，模板默认只能选择 1 个 FE

- Fe instance type: FE 的节点类型，可以采用默认值

- Number of Doris Be：BE 节点的个数，可以选择 1 个或者 3 个

- Be instance type：BE 的节点类型，可以采用默认值

- Meta data dir：FE 节点的元数据目录，可以采用默认值

- Sys log level：设置系统日志的等级，可以使用默认的 info

- Volume type of Be nodes：BE 节点挂载 EBS 的 volume type，每台节点默认挂载一块磁盘。可以使用默认值

- Volume size of Be nodes: BE 节点挂载 EBS 的大小，单位 GB，可以使用默认值。 

## 部署后，如何连接数据库

**1. 部署成功后的展示如下**

![如何连接数据库](/images/how-to-connect-to-the-database.jpeg)

**2. 依次如下面，找到 FE 的连接地址。这个例子中，从 FE Outputs 里，可以查看到地址为 172.16.0.97。**

![找到 FE 的连接地址](/images/find-connection-address-for-fe-1.jpeg)

![找到 FE 的连接地址](/images/find-connection-address-for-fe-2.jpeg)

![找到 FE 的连接地址](/images/find-connection-address-for-fe-3.jpeg)

**3. 连接部署的 Doris Cluster，Doris 的 CloudFormation 部署后的一些默认值：**

- FE 的 IP：按照上面步骤 2 获取 FE 的 IP 地址

- FE 的 MySQL 协议端口：9030

- FE 的 HTTP 协议端口：8030

- 默认的 root 密码：空

- 默认的 admin 密码：空
