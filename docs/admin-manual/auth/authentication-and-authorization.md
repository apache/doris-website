---
{
"title": "配置管理集群的用户名密码",
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

Doris 节点的管理需要通过用户名、密码以 MySQL 协议连接活着的 FE 节点进行操作。Doris 实现[类似 RBAC 的权限管理机制](../../../../admin-manual/auth/authentication-and-authorization?_highlight=rbac)，节点的管理需要用户拥有 [Node_priv](../../../../admin-manual/auth/authentication-and-authorization#权限类型) 权限。Doris Operator 默认使用拥有所有权限的 root 用户无密码模式对 DorisCluster 资源配置的集群进行部署和管理。root 用户添加密码后，需要在 DorisCluster 资源中显示配置拥有 Node_Priv 权限的用户名和密码，以便 Doris Operator 对集群进行自动化管理操作。 

DorisCluster 资源提供两种方式来配置管理集群节点所需的用户名、密码，包括：环境变量配置的方式，以及使用 [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) 配置的方式。配置集群管理的用户名和密码分为 3 种情况：  

- 集群部署需初始化 root 用户密码；
- root 无密码部署下，自动化设置拥有管理权限的非 root 用户；
- 集群 root 无密码模式部署后，设置 root 用户密码。  

## 集群部署配置 root 用户密码

Doris 支持将 root 的用户以密文的形式配置在 `fe.conf` 中，在 Doris 首次部署时配置 root 用户的密码，请按照如下步骤操作，以便让 Doris Operator 能够自动管理集群节点：  

**1. 构建 root 加密密码**  

Doris 支持密文的方式在 [FE 的配置文件](../../../../admin-manual/config/fe-config?_highlight=initial_#initial_root_password)中设置 root 用户的密码，密码的加密方式是采用 2 阶段 SHA-1 加密实现。代码实现如下：  

java 代码实现 2 阶段 SHA-2 加密：  
  
```java
import org.apache.commons.codec.digest.DigestUtils;

public static void main( String[] args ) {
      //the original password
      String a = "123456";
      String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
      //output the 2 stage encrypted password.
      System.out.println("*"+b);
  }
```

golang 代码实现 2 阶段 SHA-1 加密：  

```go
import (
"crypto/sha1"
"encoding/hex"
"fmt"
"strings"
)

func main() {
	//original password
	plan := "123456"
	//the first stage encryption.
	h := sha1.New()
	h.Write([]byte(plan))
	eb := h.Sum(nil)

	//the two stage encryption.
	h.Reset()
	h.Write(eb)
	teb := h.Sum(nil)
	dst := hex.EncodeToString(teb)
	tes := strings.ToUpper(fmt.Sprintf("%s", dst))
	//output the 2 stage encrypted password. 
	fmt.Println("*"+tes)
}
```

将加密后的密码按照配置文件格式要求配置到 `fe.conf` 中，根据[集群参数配置章节](./install-config-cluster.md)的介绍将配置文件以 configmap 的形式下发到 K8s 集中。  

**2. 构建 DorisCluster 资源**  

配置文件设置了 root 初始化密码，Doris FE 第一个节点启动后 root 的密码会立即生效，其他节点加入集群需要 Doris Operator 使用 root 用户名 + 密码的方式来操作。需要在部署的 DorisCluster 资源中指定用户名 + 密码，以便 Doris Operator 自动管理集群节点。  

- 环境变量方式  

  将用户名 root 和密码配置到 DorisCluster 资源中的 ".spec.adminUser.name" 和 ".spec.adminUser.password" 字段，Doris Operator 会自动将下列配置转为容器的环境变量使用，容器内的辅助服务会使用环境变量配置的用户名和密码来添加自身到指定的集群。配置格式如下：  

    ```yaml
    spec:
      adminUser:
        name: root
        password: ${password}
    ```
  
  其中，${password} 为 root 的非加密密码。  

- Secret 方式  

  Doris Operator 提供使用 [Basic authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) 来指定管理节点的用户名和密码，DorisCluster 资源配置需要使用的 Secret 后，Doris Operator 会自动将 Secret 以文件形式挂载到容器指定位置，容器的辅助服务会解析出文件中的用户名和密码来自动添加自身到指定集群。basic-authentication-secret 的 stringData 只包含 2 个字段：username 和 password。使用 Secret 配置管理用户名和密码流程如下：  
  
  a. 配置需要使用的 Secret  

  按照如下格式配置需要使用的 Basic authentication Secret：  

    ```yaml
    stringData:
      username: root
      password: ${password}
    ```
  
  其中 ${password} 为 root 设置的非加密密码。  
  将 Secret 通过 `kubectl -n ${namespace} apply -f ${secretFileName}.yaml` 将更新后的 Secret 部署到 K8s 集群中。其中 ${namespace} 为 DorisCluster 资源需要部署的命名空间，${secretFileName} 为需要部署的 Secret 的文件名称。  
  
  b. 配置需要部署的 DorisCluster 资源   
  
  配置 DorisCluster 指定需要使用的 Secret 格式如下：  
  
    ```yaml
    spec:
      authSecret: ${secretName}
    ```
  
  其中，${secretName} 为包含 root 用户名和密码的 Secret 名称。  
  
## 部署时自动创建非 root 管理用户和密码（推荐） 

在首次部署时不设置 root 的初始化密码，通过环境变量或者 Secret 的方式设置非 root 用户和登录密码。Doris 容器的辅助服务会自动在数据库中创建配置的用户，设置密码和赋予 Node_priv 权限，Doris Operator 会以自动创建的用户名和密码管理集群节点。
  
- 环境变量模式  
  
  按照如下格式配置需要部署的 DorisCluster 资源：  
    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
  其中，${DB_ADMIN_USER} 为需要新建拥有管理权限的用户名，${DB_ADMIN_PASSWD} 为新建用户的密码。

- Secret 方式  
  
  a. 配置需要使用的 Secret  
  
  按照如下格式配置需要使用的 Basic authentication Secret：  
    ```yaml
    stringData:
      username: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
    ```
  
  其中 ${DB_ADMIN_USER} 为新创建的用户名，${DB_ADMIN_PASSWD} 为新建用户名设置的密码。
  将 Secret 通过 `kubectl -n ${namespace} apply -f ${secretFileName}.yaml` 将更新后的 Secret 部署到 K8s 集群中。其中 ${namespace} 为 DorisCluster 资源需要部署的命名空间，${secretFileName} 为需要部署的 Secret 的文件名称。
  
  b. 配置需要使用 Secret 的 DorisCluster 资源  
  
  按照如下格式更新 DorisCluster 资源：  
  
    ```yaml
    spec:
      authSecret: ${secretName}
    ```
  其中，${secretName} 为部署的 Basic authentication Secret 的名称。

:::tip 提示
- 部署后请设置 root 的密码，Doris Operator 会转为使用自动新建的用户名和密码管理节点，请避免删除自动化创建的用户。  
:::

## 集群部署后设置 root 用户密码

Doris 集群在部署后设置了 root 用户的密码，需要配置一个拥有 [Node_priv](../../../../admin-manual/auth/authentication-and-authorization.md#权限类型) 权限的用户到 DorisCluster 资源中，以便 Doris Operator 自动化的管理集群节点。此用户名不建议使用 root，请参考[用户新建和权限赋值章节](../../sql-manual/sql-statements/account-management/CREATE-USER)来创建新用户并赋予 Node_priv 权限。创建用户后，通过环境变量或者 Secret 的方式指定新的管理用户和密码，并配置对应的 DorisCluster 资源。
  
1. 新建拥有 Node_priv 权限用户

   使用 MySQL 协议连接数据库后，使用如下命令可以创建一个简易的仅拥有 Node_priv 权限的用户并设置密码。
  
```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```
  
其中 ${DB_ADMIN_USER} 为希望创建的用户名，${DB_ADMIN_PASSWD} 为希望为新建用户设置的密码。
  
2. 给新建用户赋予 Node_priv 权限  
  
   使用 MySQL 协议连接数据库后，使用如下命令赋予新建用户 Node_priv 权限。
  
```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
  
其中，${DB_ADMIN_USER} 为新创建的用户名。  
新建用户，设置密码，以及赋予权限详细使用，请参考官方文档 [CREATE-USER](../../../../sql-manual/sql-statements/account-management/CREATE-USER) 部分。
  
3. 配置 DorisCluster 资源
  
- 环境变量方式  
  
  将新创建的用户名和密码配置到 DorisCluster 资源中的 ".spec.adminUser.name" 和 ".spec.adminUser.password" 字段，Doris Operator 会自动将下列配置转为容器的环境变量。容器内的辅助服务会使用环境变量配置的用户名和密码来添加自身到指定的集群。配置格式如下：
  
    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
  
  其中，${DB_ADMIN_USER} 为新建的用户名，${DB_ADMIN_PASSWD} 为新建用户设置的密码。
  
- Secret 方式  
  
  a. 配置需要使用的 Secret  
  
  按照如下格式配置需要使用的 Basic authentication Secret：
  
    ```yaml
    stringData:
      username: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
    ```
  
  其中 ${DB_ADMIN_USER} 为新创建的用户名，${DB_ADMIN_PASSWD} 为新建用户名设置的密码。  
  将 Secret 通过 `kubectl -n ${namespace} apply -f ${secretFileName}.yaml` 将配置好的 Secret 部署到 K8s 集群中。其中 ${namespace} 为 DorisCluster 资源需要部署的命名空间，${secretFileName} 为需要部署的 Secret 的文件名称。
  
  b. 更新需要使用 Secret 的 DorisCluster 资源  
  
  按照如下格式更新 DorisCluster 资源：
  
    ```yaml
    spec:
      authSecret: ${secretName}
    ```
  其中，${secretName} 为部署的 Basic authentication Secret 的名称。

:::tip 提示
- 部署后设置 root 密码，并配置新的拥有管理节点的用户名和密码后，会引起存量服务滚动重启一次。    
:::
Doris's permission design is based on the RBAC (Role-Based Access Control) model, where users are associated with roles, and roles are associated with permissions. Users are indirectly linked to permissions through their roles.

When a role is deleted, users automatically lose all permissions associated with that role.

When a user is disassociated from a role, they automatically lose all permissions of that role.

When permissions are added to or removed from a role, the permissions of the users associated with that role change accordingly.

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

As shown above:

User1 and user2 both have permission `priv1` through `role1`.

UserN has permission `priv1` through `role3`, and permissions `priv2` and `privN` through `roleN`. Thus, userN has permissions `priv1`, `priv2`, and `privN` simultaneously.

For ease of user operations, it is possible to directly grant permissions to a user. Internally, a unique default role is created for each user. When permissions are granted to a user, it is essentially granting permissions to the user's default role.

The default role cannot be deleted, nor can it be assigned to someone else. When a user is deleted, their default role is automatically deleted as well.

### Authorization Scheme Based on Apache Ranger

Please refer to [Authorization Scheme Based on Apache Ranger](./ranger.md).

## Common Questions

### Explanation of Permissions

1. Users with ADMIN privileges or GRANT privileges at the GLOBAL level can perform the following operations:

    - CREATE USER
    - DROP USER
    - ALTER USER
    - SHOW GRANTS
    - CREATE ROLE
    - DROP ROLE
    - ALTER ROLE
    - SHOW ROLES
    - SHOW PROPERTY FOR USER

2. GRANT/REVOKE

    - Users with ADMIN privileges can grant or revoke permissions for any user.
    - Users with ADMIN or GLOBAL level GRANT privileges can assign roles to users.
    - Users who have the corresponding level of GRANT privilege and the permissions to be assigned can distribute those permissions to users/roles.

3. SET PASSWORD

    - Users with ADMIN privileges or GLOBAL level GRANT privileges can set passwords for non-ROOT users.
    - Ordinary users can set the password for their corresponding User Identity. Their corresponding User Identity can be viewed with the `SELECT CURRENT_USER()` command.
    - ROOT users can change their own password.

### Additional Information

1. When Doris is initialized, the following users and roles are automatically created:

    - operator role: This role has `Node_priv` and `Admin_priv`, i.e., all permissions in Doris.
    - admin role: This role has `Admin_priv`, i.e., all permissions except for node changes.
    - root@'%': root user, allowed to log in from any node, with the operator role.
    - admin@'%': admin user, allowed to log in from any node, with the admin role.

2. It is not supported to delete or change the permissions of roles or users created by default.

3. There is only one user with the operator role, which is Root. There can be multiple users with the admin role.

4. Some potentially conflicting operations are explained as follows:

    1. Domain and IP conflict:

        Suppose the following user is created:

        `CREATE USER user1@['domain'];`

        And granted:

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        This domain is resolved to two IPs: ip1 and ip2.

        Suppose later, we grant a separate permission to `user1@'ip1'`:

        `GRANT ALTER_PRIV ON . TO user1@'ip1';`

        Then `user1@'ip1'` will have permissions for both Select_priv and Alter_priv. And when we change the permissions for `user1@['domain']` again, `user1@'ip1'` will not follow the change.

    2. Duplicate IP conflict:

        Suppose the following users are created:

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```

        In terms of priority, `'192.%'` takes precedence over `'%'`, so when user `user1` from machine `192.168.1.1` tries to log into Doris using password `'12345'`, access will be denied.

5. Forgotten Password

    If you forget the password and cannot log into Doris, you can add `skip_localhost_auth_check=true` to the FE's config file and restart the FE, thus logging into Doris as root without a password from the local machine.

    After logging in, you can reset the password using the `SET PASSWORD` command.

6. No user can reset the root user's password except for the root user themselves.

7. `Admin_priv` permissions can only be granted or revoked at the GLOBAL level.

8. `current_user()` and `user()`

    Users can view their `current_user` and `user` by executing `SELECT current_user()` and `SELECT user()` respectively. Here, `current_user` indicates the identity the user authenticated with, while `user` is the actual User Identity at the moment.

    For example:

    Suppose `user1@'192.%'` is created, and then user `user1` logs in from `192.168.10.1`, then the `current_user` would be `user1@'192.%'`, and `user` would be `user1@'192.168.10.1'`.

    All permissions are granted to a specific `current_user`, and the real user has all the permissions of the corresponding `current_user`.

## Best Practices

Here are some examples of use cases for the Doris permission system.

1. Scenario 1

   Users of the Doris cluster are divided into administrators (Admin), development engineers (RD), and users (Client). Administrators have all permissions over the entire cluster, primarily responsible for cluster setup and node management. Development engineers are responsible for business modeling, including creating databases and tables, importing, and modifying data. Users access different databases and tables to retrieve data.

   In this scenario, administrators can be granted ADMIN or GRANT privileges. RDs can be granted CREATE, DROP, ALTER, LOAD, and SELECT permissions for any or specific databases and tables. Clients can be granted SELECT permissions for any or specific databases and tables. Additionally, different roles can be created to simplify the authorization process for multiple users.

2. Scenario 2

   A cluster may contain multiple businesses, each potentially using one or more datasets. Each business needs to manage its users. In this scenario, an administrative user can create a user with DATABASE-level GRANT privileges for each database. This user can only authorize users for the specified database.

3. Blacklist

   Doris itself does not support a blacklist, only a whitelist, but we can simulate a blacklist through certain means. Suppose a user named `user@'192.%'` is created, allowing users from `192.*` to log in. If you want to prohibit a user from `192.168.10.1` from logging in, you can create another user `cmy@'192.168.10.1'` with a new password. Since `192.168.10.1` has higher priority than `192.%`, the user from `192.168.10.1` will no longer be able to log in with the old password.
