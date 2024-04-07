---
{
"title": "认证与鉴权",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 名词解释

1. 用户标识 User Identity
   
   在权限系统中，一个用户被识别为一个 User Identity（用户标识）。用户标识由两部分组成：username 和 userhost。其中 username 为用户名，由英文大小写组成。userhost 表示该用户链接来自的 IP。User Identity 以 username@'userhost' 的方式呈现，表示来自 userhost 的 username。

   User Identity 的另一种表现方式为 username@['domain']，其中 domain 为域名，可以通过 DNS 或 BNS（百度名字服务）解析为一组 ip。最终表现为一组 username@'userhost'，所以后面我们统一使用 username@'userhost' 来表示。

2. 权限 Privilege
   
   权限作用的对象是节点、数据目录、数据库或表。不同的权限代表不同的操作许可。
   
3. 角色 Role

   Doris可以创建自定义命名的角色。角色可以被看做是一组权限的集合。新创建的用户可以被赋予某一角色，则自动被赋予该角色所拥有的权限。后续对角色的权限变更，也会体现在所有属于该角色的用户权限上。

5. 用户属性 User Property

   用户属性直接附属于某一用户，而不是用户标识。即 user1@'192.%' 和 user1@['domain'] 都拥有同一组用户属性，该属性属于用户 user1，而不是 user1@'192.%' 或 user1@['domain']。
   
   用户属性包括但不限于： 用户最大连接数、导入集群配置等等。

## 认证和鉴权框架

用户登录 Apache Doris 的过程，分为【认证】和【鉴权】两部分。

- 认证：根据用户提供的凭据（如用户名、客户单IP、密码）等，进行身份验证。验证通过后，会将用户个体映射到系统内的用户标识（User Identity）上。
- 鉴权：基于获取到的用户标识，根据用户标识所对应的权限，检查用户是否有相应操作的权限。

## 认证

Doris 支持内置认证方案和以及LDAP的认证方案。

### Doris 内置认证方案

基于Doris自身存储的用户名，密码等信息来认证。

管理员通过`create user`来创建用户，通过`show all grants`来查看创建的所有用户

用户登录时，会判断用户名，密码及客户端的ip地址是否正确。

#### 密码策略

Doris 支持以下密码策略，可以帮助用户更好的进行密码管理。

1. `PASSWORD_HISTORY`

   是否允许当前用户重置密码时使用历史密码。如 `PASSWORD_HISTORY 10` 表示禁止使用过去10次设置过的密码为新密码。如果设置为 `PASSWORD_HISTORY DEFAULT`，则会使用全局变量 `password_history` 中的值。`0` 表示不启用这个功能。默认为 0。

3. `PASSWORD_EXPIRE`

   设置当前用户密码的过期时间。如 `PASSWORD_EXPIRE INTERVAL 10 DAY` 表示密码会在 10 天后过期。`PASSWORD_EXPIRE NEVER` 表示密码不过期。如果设置为 `PASSWORD_EXPIRE DEFAULT`，则会使用全局变量 `default_password_lifetime` 中的值。默认为 NEVER（或0），表示不会过期。

4. `FAILED_LOGIN_ATTEMPTS` 和 `PASSWORD_LOCK_TIME`

   设置当前用户登录时，如果使用错误的密码登录n次后，账户将被锁定，并设置锁定时间。如 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` 表示如果3次错误登录，则账户会被锁定一天。
   
   被锁定的账户可以通过 ALTER USER 语句主动解锁。

### 基于LDAP的认证方案

[LDAP](../privilege-ldap/ldap.md)

## 鉴权
### 权限操作
1. 创建用户：[CREATE USER](../../sql-manual/sql-reference/Account-Management-Statements/CREATE-USER.md)
2. 修改用户：[ALTER USER](../../sql-manual/sql-reference/Account-Management-Statements/ALTER-USER.md)
3. 删除用户：[DROP USER](../../sql-manual/sql-reference/Account-Management-Statements/DROP-USER.md)
4. 授权/分配角色：[GRANT](../../sql-manual/sql-reference/Account-Management-Statements/GRANT.md)
5. 撤权/撤销角色：[REVOKE](../../sql-manual/sql-reference/Account-Management-Statements/REVOKE.md)
6. 创建角色：[CREATE ROLE](../../sql-manual/sql-reference/Account-Management-Statements/CREATE-ROLE.md)
7. 删除角色：[DROP ROLE](../../sql-manual/sql-reference/Account-Management-Statements/DROP-ROLE.md)
8. 修改角色：[ALTER ROLE](../../sql-manual/sql-reference/Account-Management-Statements/ALTER-ROLE.md)
9. 查看当前用户权限和角色：[SHOW GRANTS](../../sql-manual/sql-reference/Show-Statements/SHOW-GRANTS.md)
10. 查看所有用户权限和角色：[SHOW ALL GRANTS](../../sql-manual/sql-reference/Show-Statements/SHOW-GRANTS.md)
11. 查看已创建的角色：[SHOW ROLES](../../sql-manual/sql-reference/Show-Statements/SHOW-ROLES.md)
12. 设置用户属性: [SET PROPERTY](../../sql-manual/sql-reference/Account-Management-Statements/SET-PROPERTY.md)
13. 查看用户属性：[SHOW PROPERTY](../../sql-manual/sql-reference/Show-Statements/SHOW-PROPERTY.md)
14. 修改密码：[SET PASSWORD](../../sql-manual/sql-reference/Account-Management-Statements/SET-PASSWORD.md)
15. 查看支持的所有权限项：[SHOW PRIVILEGES](../../sql-manual/sql-reference/Show-Statements/SHOW-PRIVILEGES.md)
16. 查看行权限策略：[SHOW ROW POLICY](../../sql-manual/sql-reference/Show-Statements/SHOW-POLICY.md)
17. 创建行权限策略：[CREATE ROW POLICY](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY.md)

### 权限类型

Doris 目前支持以下几种权限

1. Node_priv

   节点变更权限。包括 FE、BE、BROKER 节点的添加、删除、下线等操作。

   Root 用户默认拥有该权限。同时拥有 Grant_priv 和 Node_priv 的用户，可以将该权限赋予其他用户。

   该权限只能赋予 Global 级别。

2. Grant_priv

   权限变更权限。允许执行包括授权、撤权、添加/删除/变更 用户/角色 等操作。

   给其他用户/角色授权时，2.1.2之前当前用户只需要相应层级的grant_priv权限，2.1.2之后当前用户也要有想要授权的权限。
   
   给其他用户分配角色时，要有global级别的grant_priv权限

3. Select_priv

   对数据目录、数据库、表、列的只读权限。

4. Load_priv

   对数据目录、数据库、表的写权限。包括 Load、Insert、Delete 等。

5. Alter_priv

   对数据目录、数据库、表的更改权限。包括重命名 库/表、添加/删除/变更 列、添加/删除 分区等操作。

7. Create_priv

   创建数据目录、数据库、表、视图的权限。

7. Drop_priv

   删除数据目录、数据库、表、视图的权限。

8. Usage_priv

   Resource的使用权限和workload group权限。

9. Show_view_priv

   Show create view的权限

### 权限层级

#### 全局权限

   即通过 GRANT 语句授予的 *.*.* 上的权限。被授予的权限适用于任意Catalog中的任意库表。 

#### 数据目录（Catalog）权限

   即通过 GRANT 语句授予的 ctl.*.* 上的权限。被授予的权限适用于指定Catalog中的任意库表。

#### 库级权限

   即通过 GRANT 语句授予的 ctl.db.* 上的权限。被授予的权限适用于指定数据库中的任意表。

#### 表级权限

   即通过 GRANT 语句授予的 ctl.db.tbl 上的权限。被授予的权限适用于指定表的任意列。

#### 列级权限

   主要用于限制用户对数据表中某些列的访问权限。具体来说，列权限允许管理员设定某些列的查看、编辑等权限，以控制用户对特定列数据的访问和操作。
   
   可以通过 GRANT Select_priv(col1,col2) to ctl.db.tbl授予的指定table的部分列的权限。
   
   目前列权限仅支持Select_priv。

#### 行级权限
   
   行权限使得管理员能够基于数据的某些字段来定义访问策略，从而控制哪些用户可以访问哪些数据行。
   
   具体来说，Row Policy 允许管理员创建规则，这些规则可以基于存储在数据中的实际值来过滤或限制用户对行的访问。
   
   从1.2版本开始，可以通过 [CREATE ROW POLICY](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY.md) 命令创建行级权限。
   
   从2.1.2版本开始，支持通过 ApacheRanger 的 Row Level Filter 来设置行权限 （注意：仅支持在Nereids优化器使用）

### 使用权限

#### RESOURCE 权限
   
   Resource 权限是为resource单独设置的权限，和库表等权限没有关系，只能分配USAGE和GRANT权限，分配所有RESOURCE可以通过 `GRANT USAGE_PRIV ON RESOURCE '%' to xxx`

#### WORKLOAD GROUP 权限
   
   WORKLOAD GROUP 权限是为WORKLOAD GROUP单独设置的权限，和库表等权限没有关系，只能分配USAGE和GRANT权限
   
   分配所有WORKLOAD GROUP可以通过 `GRANT USAGE_PRIV ON RESOURCE '%' to xxx`

### 数据脱敏
   
   数据脱敏是一种保护敏感数据的方法，它通过对原始数据进行修改、替换或隐藏，使得脱敏后的数据在保持一定格式和特性的同时，不再包含敏感信息。
   
   例如，管理员可以选择将信用卡号、身份证号等敏感字段的部分或全部数字替换为星号（*）或其他字符，或者将真实姓名替换为假名。
   
   从2.1.2版本开始，支持通过 ApacheRanger 的 Masking 来为某些列设置脱敏策略，目前仅支持[Doris Ranger](../privilege-ldap/ranger.md)来设置。

### 鉴权方案

#### Doris 内置的鉴权方案
   
   Doris权限设计基于RBAC(Role-Based Access Control)的权限管理模型,用户和角色关联，角色和权限关联，用户通过角色间接和权限关联。
   
   当角色被删除时，用户自动失去该角色的所有权限。
   
   当用户和角色取消关联，用户自动失去角色的所有权限。
   
   当角色的权限被增加或删除，用户的权限也会随之变更。 
   
   ```
   ┌────────┐        ┌────────┐         ┌────────┐
   │  user1 ├────┬───►  role1 ├────┬────►  priv1 │
   └────────┘    │   └────────┘    │    └────────┘
                 │                 │
                 │                 │
                 │   ┌────────┐    │
                 │   │  role2 ├────┤
   ┌────────┐    │   └────────┘    │    ┌────────┐
   │  user2 ├────┘                 │  ┌─►  priv2 │
   └────────┘                      │  │ └────────┘
                     ┌────────┐    │  │
              ┌──────►  role3 ├────┘  │
              │      └────────┘       │
              │                       │
              │                       │
   ┌────────┐ │      ┌────────┐       │ ┌────────┐
   │  userN ├─┴──────►  roleN ├───────┴─►  privN │
   └────────┘        └────────┘         └────────┘
   ```
   如上图所示：
   
   user1和user2都是通过role1拥有了priv1的权限。
   
   userN通过role3拥有了priv1的权限，通过roleN拥有了priv2和privN的权限，因此userN同时拥有priv1，priv2和privN的权限。
   
   为了方便用户操作，是可以直接给用户授权的，底层实现上，是为每个用户创建了一个专属于该用户的默认角色，当给用户授权时，实际上是在给该用户的默认角色授权。
   
   默认角色不能被删除，不能被分配给其他人，删除用户时，默认角色也自动删除。
   
#### 基于 Apache Ranger的鉴权方案

   [Doris Ranger](../privilege-ldap/ranger.md)

## 其他说明   

### 权限项说明

1. 拥有 `ADMIN` 权限，或 `GLOBAL`层级的 `GRANT` 权限的用户可以进行以下操作：
- `CREATE USER`
- `DROP USER`
- `ALTER USER`
- `SHOW GRANTS`
- `CREATE ROLE`
- `DROP ROLE`
- `ALTER ROLE`
- `SHOW ROLES`
- `SHOW PROPERTY FOR USER`

2. `GRANT/REVOKE`
- 拥有 `ADMIN` 权限，可以授予或撤销任意用户的权限。
- 拥有 `ADMIN` 或 `GLOBAL` 层级 `GRANT` 权限可以把角色分配给用户。
- 同时拥有相应层级的 `GRANT` 权限和要分配的权限，可以把权限分配给用户/角色。

3. `SET PASSWORD`
- 拥有 `ADMIN` 权限，或者 `GLOBAL` 层级 `GRANT` 权限的用户，可以设置非ROOT用户的密码。
- 普通用户可以设置自己对应的 UserIdentity 的密码。自己对应的 UserIdentity 可以通过 `SELECT CURRENT_USER();` 命令查看。
- ROOT用户可以修改自己的密码

### 其他说明
1. Doris 初始化时，会自动创建如下用户和角色：
   - `operator` 角色：该角色拥有 `Node_priv` 和 `Admin_priv`，即对Doris的所有权限。
   - `admin` 角色：该角色拥有 `Admin_priv`，即除节点变更以外的所有权限。
   - `root@'%'`：`root` 用户，允许从任意节点登陆，角色为 `operator`。
   - `admin@'%'`：`admin` 用户，允许从任意节点登陆，角色为 `admin`。
2. 不支持删除或更改默认创建的角色或用户的权限
3. `operator` 角色的用户有且只有一个，即 `Root`。`admin` 角色的用户可以创建多个。
4. 一些可能产生冲突的操作说明

   1. 域名与ip冲突：
   
   假设创建了如下用户：

   `CREATE USER user1@['domain'];`

   并且授权：

   `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

   该 domain 被解析为两个 ip：`ip1` 和 `ip2`
   
   假设之后，我们对 `user1@'ip1'` 进行一次单独授权：

   `GRANT ALTER_PRIV ON *.* TO user1@'ip1';`

   则 `user1@'ip1'` 的权限会被修改为 `SELECT_PRIV, ALTER_PRIV`。并且当我们再次变更 `user1@['domain']` 的权限时，`user1@'ip1'` 也不会跟随改变。

   2. 重复ip冲突：
   
   假设创建了如下用户：

   `CREATE USER user1@'%' IDENTIFIED BY "12345";`

   `CREATE USER user1@'192.%' IDENTIFIED BY "abcde";`

   在优先级上，`'192.%'` 优先于 `'%'`，因此，当用户 `user1` 从 `192.168.1.1` 这台机器尝试使用密码 `'12345'` 登陆 Doris 会被拒绝。

5. 忘记密码

   如果忘记了密码无法登陆 Doris，可以在 FE 的 config 文件中添加 `skip_localhost_auth_check` 参数，并且重启FE，从而无密码在本机通过localhost登陆 Doris：
   `skip_localhost_auth_check = true`

   登陆后，可以通过 `SET PASSWORD` 命令重置密码。

6. 任何用户都不能重置 `root` 用户的密码，除了 `root` 用户自己。

7. `ADMIN_PRIV` 权限只能在 `GLOBAL` 层级授予或撤销。

8. `current_user()` 和 `user()`

   用户可以通过 `SELECT current_user();` 和 `SELECT user();` 分别查看 `current_user` 和 `user`。其中 `current_user` 表示当前用户是以哪种身份通过认证系统的，而 `user` 则是用户当前实际的 `user_identity`。 举例说明：
   
   假设创建了 `user1@'192.%'` 这个用户，然后以为来自 `192.168.10.1` 的用户 `user1` 登陆了系统，则此时的 `current_user` 为 `user1@'192.%'`，而 `user` 为 `user1@'192.168.10.1'`。
   
   所有的权限都是赋予某一个 `current_user` 的，真实用户拥有对应的 `current_user` 的所有权限。

9. 密码强度

   在 1.2 版本中，新增了对用户密码强度的校验功能。该功能由全局变量 `validate_password_policy` 控制。默认为 `NONE/0`，即不检查密码强度。如果设置为 `STRONG/2`，则密码必须包含“大写字母”，“小写字母”，“数字”和“特殊字符”中的3项，并且长度必须大于等于8。