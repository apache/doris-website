---
{
    "title": "安全概览",
    "language": "zh-CN",
    "description": "Apache Doris 企业级安全架构详解：支持用户名/LDAP 双重认证、基于角色的访问控制 (RBAC) 和 Ranger 集中化权限管理，提供数据加密脱敏、SSL 传输加密、行级列级细粒度访问控制。内置审计日志、Java-UDF 安全审查机制，全面保障大数据平台的身份认证、权限管控、数据保护和操作可追溯性。"
}
---

## 安全能力总览

Doris 提供以下机制管理数据安全：

- **身份认证**：支持用户名/密码以及 LDAP 认证方式。
    - 内置认证：Doris 内置了用户名/密码的认证方式，可以自定义密码策略；
    - LDAP 认证：Doris 可以通过 LDAP 服务集中管理用户凭证，简化访问控制并增强系统的安全性。
- **权限管控**：支持基于角色的访问控制或通过 Apache Ranger 实现集中化的权限管理。
    - 基于角色的访问控制 (RBAC)：可以根据用户角色与权限，限制其对数据库资源的访问与操作；
    - Ranger 权限管理：通过集成 Ranger 实现集中化的权限管理，允许管理员为不同的用户和组设置细粒度的访问控制策略。
- **审计与日志记录**：可以开启审计日志，记录用户的所有操作行为，包括登录、查询、数据修改等，便于事后审计与问题追踪。
- **数据加密与脱敏**：支持对表中的数据进行加密与脱敏，防止未授权的访问造成敏感数据泄漏。
- **数据传输加密**：支持 SSL 加密协议，确保客户端与 Doris 服务器之间的数据传输安全，防止数据在传输过程中被窃取或篡改。
- **细粒度访问控制**：可以基于规则配置数据行/列管控用户访问权限。
- **JAVA-UDF 安全**：Doris 支持用户自定义函数功能，因此需要 Root 管理员审查用户 UDF 的实现，确保实现逻辑的操作安全，防止在 UDF 中执行高危操作，例如删除数据和破坏系统等。
- **第三方包**：在使用 Doris 的 JDBC Catalog、UDF 等功能时，如需引入第三方包，管理员需自行确保这些包来源安全可信。建议仅使用来自官方渠道或受信任社区的依赖包，以降低安全风险。

## 核心概念

Doris 的权限管理系统参照了 MySQL 的权限管理机制，做到了行级别细粒度的权限控制，基于角色的权限访问控制，并且支持白名单机制。

1. **用户标识 (User Identity)**

   在权限系统中，一个用户被识别为一个 User Identity（用户标识）。用户标识由两部分组成：`username` 和 `host`。其中 `username` 为用户名，由英文大小写组成。`host` 表示该用户连接来自的 IP。User Identity 以 `username@'host'` 的方式呈现，表示来自 `host` 的 `username`。

   User Identity 的另一种表现方式为 `username@['domain']`，其中 `domain` 为域名，可以通过 DNS 解析为一组 IP，最终表现为一组 `username@'host'`，所以后面统一使用 `username@'host'` 来表示。

2. **权限 (Privilege)**

   权限作用的对象是节点、数据目录、数据库或表。不同的权限代表不同的操作许可。

3. **角色 (Role)**

   Doris 可以创建自定义命名的角色。角色可以被看做是一组权限的集合。新创建的用户可以被赋予某一角色，则自动被赋予该角色所拥有的权限。后续对角色的权限变更，也会体现在所有属于该角色的用户权限上。

4. **用户属性 (User Property)**

   用户属性直接附属于某一用户，而不是用户标识。即 `user@'192.%'` 和 `user@['domain']` 都拥有同一组用户属性，该属性属于用户 `user`，而不是 `user@'192.%'` 或 `user@['domain']`。

   用户属性包括但不限于：用户最大连接数、导入集群配置等等。

## 认证与鉴权框架

用户登录 Apache Doris 的过程，分为**认证**和**鉴权**两部分。

- **认证 (Authentication)**：根据用户提供的凭据（如用户名、客户端 IP、密码等）进行身份验证。验证通过后，会将用户个体映射到系统内的用户标识 (User Identity) 上。
- **鉴权 (Authorization)**：基于获取到的用户标识，根据其对应的权限，检查用户是否有相应操作的许可。

Doris 在认证侧支持**内置认证**与 **LDAP 认证**两种方案；在鉴权侧支持基于 **RBAC 的内置鉴权**与基于 **Apache Ranger 的外部鉴权**两种方案。两侧可自由组合，例如使用 LDAP 进行认证、再由 Ranger 完成鉴权。

## 章节导航

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
