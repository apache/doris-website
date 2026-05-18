---
{
    "title": "安全概览",
    "language": "zh-CN",
    "description": "Apache Doris 企业级安全能力总览：身份认证、RBAC 与 Ranger 权限管控、行列级访问控制、数据脱敏、SSL 传输加密、审计日志、UDF 安全与第三方包治理。"
}
---

<!-- 知识类型: 概念说明 + 架构选型决策 -->
<!-- 适用场景: 安全架构规划 / 认证鉴权方案选型 / 安全合规评审 -->

Apache Doris 面向企业级数据平台提供完整的安全能力，覆盖身份认证、权限管控、数据保护、传输加密与审计追溯。本文从安全场景出发，介绍 Doris 的整体安全架构、核心概念与认证鉴权框架，并提供各能力的入口文档，帮助管理员快速建立完整的安全防护方案。

## 适用场景

| 场景 | 需要关注的能力 | 入口文档 |
| --- | --- | --- |
| 集中化用户管理（与企业 LDAP/AD 打通） | LDAP 认证 | [基于 LDAP 的认证方案](./authentication/ldap) |
| 内部用户与密码策略管理 | 内置认证、密码策略、白名单 | [内置认证](./authentication/internal) |
| 多团队共享集群、按角色授权 | RBAC、角色 | [内置鉴权](./authorization/internal) |
| 与大数据生态统一权限治理 | Apache Ranger 集成 | [基于 Ranger 的鉴权方案](./authorization/ranger) |
| 敏感数据保护（行级/列级、脱敏） | 数据访问控制 | [数据访问控制](./authorization/data) |
| 客户端到 FE 链路加密 | MySQL 协议 SSL、FE HTTPS | [MySQL 协议 SSL](./certificate)、[FE HTTPS 配置](./fe-certificate) |
| 审计与合规追溯 | 审计日志 | [审计日志](../audit-plugin) |
| 数据加解密计算 | 加密函数 | [数据加密函数](./encryption-function) |
| 部署在 AWS 上、对接 IAM | AWS 认证鉴权 | [AWS 认证与鉴权](./integrations/aws-authentication-and-authorization) |

## 安全能力总览

<!-- 知识类型: 能力清单 -->

Doris 通过下列机制管理数据安全，覆盖身份、权限、数据、传输与审计五个维度。

| 安全维度 | 能力 | 说明 |
| --- | --- | --- |
| 身份认证 | 内置认证 | Doris 内置用户名/密码认证，可自定义密码策略。 |
| 身份认证 | LDAP 认证 | 通过 LDAP 服务集中管理用户凭证，简化访问控制并增强系统安全性。 |
| 权限管控 | 基于角色的访问控制 (RBAC) | 根据用户角色与权限，限制其对数据库资源的访问与操作。 |
| 权限管控 | Ranger 权限管理 | 通过集成 Apache Ranger 实现集中化的权限管理，支持细粒度访问控制策略。 |
| 数据保护 | 数据加密与脱敏 | 对表中的数据进行加密与脱敏，防止未授权访问造成敏感数据泄漏。 |
| 数据保护 | 细粒度访问控制 | 基于规则配置行/列级访问权限。 |
| 传输安全 | SSL 加密协议 | 确保客户端与 Doris 服务器之间的数据传输安全，防止数据被窃取或篡改。 |
| 审计追溯 | 审计日志 | 记录用户登录、查询、数据修改等所有操作行为，便于事后审计与问题追踪。 |
| 扩展安全 | Java-UDF 安全 | Root 管理员需审查用户 UDF 的实现，确保操作安全，防止执行删除数据、破坏系统等高危操作。 |
| 扩展安全 | 第三方包治理 | 使用 JDBC Catalog、UDF 等功能引入第三方包时，管理员需自行确保来源安全可信，建议仅使用官方渠道或受信任社区的依赖包。 |

## 核心概念

<!-- 知识类型: 概念说明 -->

Doris 的权限管理系统参照 MySQL 的权限管理机制，做到了行级别细粒度的权限控制、基于角色的权限访问控制，并支持白名单机制。理解以下四个核心概念，有助于快速掌握 Doris 的认证与鉴权模型。

### 用户标识 (User Identity)

在权限系统中，一个用户被识别为一个 User Identity（用户标识）。用户标识由两部分组成：`username` 和 `host`。

- `username`：用户名，由英文大小写组成。
- `host`：该用户连接来自的 IP。

User Identity 以 `username@'host'` 的方式呈现，表示来自 `host` 的 `username`。

User Identity 的另一种表现方式为 `username@['domain']`，其中 `domain` 为域名，可以通过 DNS 解析为一组 IP，最终表现为一组 `username@'host'`，所以后面统一使用 `username@'host'` 来表示。

### 权限 (Privilege)

权限作用的对象是节点、数据目录、数据库或表。不同的权限代表不同的操作许可。

### 角色 (Role)

Doris 可以创建自定义命名的角色。角色可以被看做是一组权限的集合。新创建的用户可以被赋予某一角色，则自动被赋予该角色所拥有的权限。后续对角色的权限变更，也会体现在所有属于该角色的用户权限上。

### 用户属性 (User Property)

用户属性直接附属于某一用户，而不是用户标识。即 `user@'192.%'` 和 `user@['domain']` 都拥有同一组用户属性，该属性属于用户 `user`，而不是 `user@'192.%'` 或 `user@['domain']`。

用户属性包括但不限于：用户最大连接数、导入集群配置等。

## 认证与鉴权框架

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 认证鉴权方案选型 -->

用户登录 Apache Doris 的过程，分为**认证**和**鉴权**两部分。

- **认证 (Authentication)**：根据用户提供的凭据（如用户名、客户端 IP、密码等）进行身份验证。验证通过后，会将用户个体映射到系统内的用户标识 (User Identity) 上。
- **鉴权 (Authorization)**：基于获取到的用户标识，根据其对应的权限，检查用户是否有相应操作的许可。

Doris 在认证侧支持**内置认证**与 **LDAP 认证**两种方案；在鉴权侧支持基于 **RBAC 的内置鉴权**与基于 **Apache Ranger 的外部鉴权**两种方案。两侧可自由组合，例如使用 LDAP 进行认证、再由 Ranger 完成鉴权。

下表列出常见的组合方式与适用场景：

| 认证方式 | 鉴权方式 | 适用场景 |
| --- | --- | --- |
| 内置认证 | 内置 RBAC | 中小规模集群、独立部署，无外部依赖。 |
| LDAP 认证 | 内置 RBAC | 与企业 LDAP/AD 打通，但权限模型由 Doris 管理。 |
| 内置认证 | Apache Ranger | 已有 Ranger 体系，希望与大数据生态统一权限治理。 |
| LDAP 认证 | Apache Ranger | 企业级最佳实践：身份统一、权限集中、可审计。 |

## 章节导航

<!-- 知识类型: 文档索引 -->

按主题查阅 Doris 安全能力的详细文档：

| 主题 | 文档 |
| --- | --- |
| 内置认证（密码策略、白名单、忘记密码处理） | [内置认证](./authentication/internal) |
| LDAP 认证 | [基于 LDAP 的认证方案](./authentication/ldap) |
| 内置 RBAC 鉴权（权限项、权限层级、角色） | [内置鉴权](./authorization/internal) |
| 行/列权限与数据脱敏 | [数据访问控制](./authorization/data) |
| Apache Ranger 集中化鉴权 | [基于 Ranger 的鉴权方案](./authorization/ranger) |
| 审计日志 | [审计日志](../audit-plugin) |
| MySQL 协议 SSL 传输加密 | [MySQL 协议 SSL](./certificate) |
| FE HTTP/HTTPS 传输加密 | [FE HTTPS 配置](./fe-certificate) |
| 加密函数 | [数据加密函数](./encryption-function) |
| 与云厂商集成（AWS） | [AWS 认证与鉴权](./integrations/aws-authentication-and-authorization) |
