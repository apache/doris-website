---
{
    "title": "Apache Doris IAM Assume Role工作原理",
    "language": "zh-CN",
    "description": "AWS Assume Role 是一种安全身份切换机制，允许一个可信实体（如IAM用户、EC2实例或外部账号）通过STS（安全令牌服务）临时获取目标角色的权限，其运作流程如下:"
}
---

# Apache Doris IAM Assume Role工作原理

## 一、传统AK/SK方式访问AWS资源存在的问题

### 密钥管理困境：
- **长期暴露风险**：静态AK/SK需硬编码于配置文件中，一旦因代码泄露、误提交或恶意窃取导致密钥扩散，攻击者可永久获得等同于密钥所有者的完整权限，引发持续性的数据泄露、资源篡改及资金损失风险；
- **审计盲区**：多用户/多服务共享同一组密钥时，云操作日志仅记录密钥身份而无法关联具体使用者，无法追溯真实责任人或业务模块；
- **运维成本高**：密钥轮换灾难，需手动轮换业务模块密钥，容易出错触发服务中断；
- **权限管理失控**：账户级粗放授权无法满足服务/实例级的最小权限管控需求。

## 二、AWS IAM ASSUME ROLE机制介绍

### AWS IAM Assume Role 是什么？
AWS Assume Role 是一种安全身份切换机制，允许一个可信实体（如IAM用户、EC2实例或外部账号）通过STS（安全令牌服务）临时获取目标角色的权限，其运作流程如下:

![](/images/integrations/aws_iam_role_flow.png)

### 使用AWS IAM Assume Role方式访问的优点:
- 动态令牌机制(15分钟~12小时有效期)替代永久密钥
- 通过 External ID 实现跨账号安全隔离，并且可通过AWS后台服务进行审计
- 基于角色的最小权限原则(Principle of Least Privilege)

### AWS IAM Assume Role访问S3 Bucket的鉴权过程：

![](/images/integrations/iam_role_access_bucket.png)

#### 阶段1: 源用户身份验证
1. **权限策略检查**  
   - 源用户发起AssumeRole请求时，源账户的IAM策略引擎首先验证：该用户是否被授权调用sts:AssumeRole操作？  
   - 检查依据：附着在源用户身份上的IAM Permissions Policies

2. **信任关系校验**  
   - 通过STS服务向目标账户发起请求：  
     - 源用户是否在目标角色的信任策略白名单中？  
   - 检查依据：目标角色绑定的IAM Trust Relationships Policies（明确允许哪些账号/用户担任该角色）

#### 阶段2: 目标角色权限激活
3. **临时凭证生成**  
   若信任关系验证通过，STS生成三要素临时凭证
   ```json
    {
    "AccessKeyId": "***",
    "SecretAccessKey": "***",
    "SessionToken": "***" // 有效期15min-12h
    }
   ```

4. **目标角色权限验证**  
   - 目标角色使用临时凭证访问S3前，目标账户的IAM策略引擎校验：该角色是否被授权执行请求的S3操作？（如s3:GetObject、s3:PutObject等）  
   - 检查依据：附着在目标角色上的IAM Permissions Policies（定义角色能做什么）

#### 阶段3: 资源操作执行
5. **访问存储桶**  
   全部验证通过后，目标角色才可执行S3 API操作

## 三、Doris如何应用AWS IAM Assume Role鉴权机制
1. Doris通过将FE、BE进程所部署的AWS EC2 Instances绑定到Source Account来使用AWS IAM Assume Role功能，主要流程如下图所示：  

![](/images/integrations/doris_iam_role.png)

2. 完成配置后Doris FE/BE进程会自动获取EC2 Instance的Profile执行Assume Role操作访问Bucket。扩容时BE节点会自动检测新EC2 Instance是否成功绑定IAM Role，防止漏配;

3. Doris的S3 Load、TVF、Export、Resource、Repository、Storage Vault等功能在3.0.6+版本均支持AWS Assume Role方式，执行SQL相关功能时会进行连通性检测：
   ```sql
   CREATE REPOSITORY `s3_repo`
   WITH S3 ON LOCATION "s3://bucket/path/"
   PROPERTIES (
     "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
     "s3.external_id" = "doris-external-id",
     "timeout" = "3600"
   );
   ```
其中"s3.role_arn" 对应填入AWS IAM Account2下的Iam role2的arn值,"s3.external_id"对应填入Trust Relationships Policies中配置的externalId的值(可选配置), 更多功能SQL语句功能详细参考：
[AWS 认证和鉴权](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).