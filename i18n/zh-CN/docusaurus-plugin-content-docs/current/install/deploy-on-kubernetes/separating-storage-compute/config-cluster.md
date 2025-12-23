---
{
    "title": "集群级配置",
    "language": "zh-CN",
    "description": "存算分离集群存在集群级别的配置，比如管控账号的用户名密码用于管理集群中各个组件的节点等。"
}
---

存算分离集群存在集群级别的配置，比如管控账号的用户名密码用于管理集群中各个组件的节点等。

## 配置管理用户名和密码

Doris 节点的管理需要通过用户名、密码以 MySQL 协议连接活着的 FE 节点进行操作。Doris 实现[类似 RBAC 的权限管理机制](../../../admin-manual/auth/authentication-and-authorization)，节点的管理需要用户拥有 [Node_priv](../../../admin-manual/auth/authentication-and-authorization#权限类型) 权限。Doris Operator 默认使用拥有所有权限的 root 用户无密码模式对 DorisDisaggregatedCluster 资源配置的集群进行部署和管理。root 用户添加密码后，需要在 DorisDisaggregatedCluster 资源中显示配置拥有 Node_Priv 权限的用户名和密码，以便 Doris Operator 对集群进行自动化管理操作。

DorisDisaggregatedCluster 资源提供两种方式来配置管理集群节点所需的用户名、密码，包括：环境变量配置的方式，以及使用 [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) 配置的方式。配置集群管理的用户名和密码分为 3 种情况：

- 集群部署需初始化 root 用户密码；

- root 无密码部署下，自动化设置拥有管理权限的非 root 用户；

- 集群 root 无密码模式部署后，设置 root 用户密码。

### 集群部署配置 root 用户密码

Doris 支持将 root 的用户以密文的形式配置在 `fe.conf` 中，在 Doris 首次部署时配置 root 用户的密码，以便让 Doris Operator 能够自动管理集群节点，请按照如下步骤操作：

#### 第 1 步：构建 root 加密密码

Doris 支持密文的方式在 [FE 的配置文件](../../../admin-manual/config/fe-config#initial_root_password)中设置 root 用户的密码，密码的加密方式是采用两阶段 SHA-1 加密实现。代码实现示例如下：

Java 代码实现：

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

Golang 代码实现：

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

将加密后的密码按照配置文件要求配置到 `fe.conf` 中，根据[FE 启动参数配置章节](config-fe.md#自定义启动配置)的说明，将配置文件以 `ConfigMap` 的形式下发到 Kubernetes 集群。

#### 第 2 步：构建 DorisDisaggregatedCluster 资源

配置文件设置了 root 初始化密码后，当 Doris FE 第一个节点启动后 root 的密码会立即生效，后续节点加入集群时，Doris Operator 将使用 root 用户名和密码来添加节点。因此，需要在部署的 DorisDisaggregatedCluster 资源中指定用户名和密码，以便 Doris Operator 管理集群节点。

- 环境变量方式

  将 root 用户名和密码配置到 DorisDisaggregatedCluster 资源中的 ".spec.adminUser.name" 和 ".spec.adminUser.password" 字段，Doris Operator 会自动将这些配置转为容器的环境变量，容器内的辅助服务会使用环境变量来添加节点到集群。配置格式如下：

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  其中，`${password}` 为 root 的非加密密码。

- Secret 方式

  Doris Operator 提供使用 [Basic authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) 来指定管理节点的用户名和密码，Doris Operator 会自动将 Secret 以文件形式挂载到容器指定位置，容器的辅助服务会解析出文件中的用户名和密码，用于自动将节点加入集群。basic-authentication-secret 的 stringData 只包含 2 个字段：username 和 password。使用 Secret 配置管理用户名和密码流程如下：

  a. 配置需要使用的 Secret

  按照如下格式配置需要使用的 Basic Authentication Secret：

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  其中，`${password}` 为 root 设置的非加密密码。  
  通过如下命令将更新后的 Secret 部署到 Kubernetes 集群中。
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  其中，`${namespace}` 为 DorisDisaggregatedCluster 资源需要部署的命名空间，${secretFileName} 为需要部署的 Secret 的文件名称。

  b. 配置 DorisDisaggregatedCluster 资源

  在需要部署的 DorisDisaggregatedCluster 资源中，指定使用的 Secret。配置如下：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为包含 root 用户名和密码的 Secret 名称。

### 部署时自动创建非 root 管理用户和密码（推荐）

在首次部署时，如果不设置 root 的初始化密码，通过环境变量或者 Secret 的方式配置非 root 用户和登录密码。Doris 容器的辅助服务会自动在 Doris 中创建该用户，设置密码和赋予 Node_priv 权限，Doris Operator 将使用自动创建的用户名和密码管理集群节点。

- 环境变量模式

  按照如下格式配置需要部署的 DorisDisaggregatedCluster 资源：
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  其中，`${DB_ADMIN_USER}` 为需要新建拥有管理权限的用户名，`${DB_ADMIN_PASSWD}` 为新建用户的密码。

- Secret 方式

  a. 配置需要使用的 Secret

  按照如下格式配置需要使用的 Basic authentication Secret：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  其中，`${DB_ADMIN_USER}` 为新创建的用户名，`${DB_ADMIN_PASSWD}` 为新建用户名设置的密码。

  使用以下命令将 Secret 部署到 Kubernetes 集群中：

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  其中，`${namespace}` 为 DorisDisaggregatedCluster 资源部署的命名空间，`${secretFileName}` 为需要部署的 Secret 的文件名称。

  b. 更新 DorisDisaggregatedCluster 资源

  在 DorisDisaggregatedCluster 资源中指定使用的 Secret，如下所示：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为部署的 Basic Authentication Secret 的名称。

:::tip 提示
- 部署后请设置 root 的密码，Doris Operator 会切换为使用新用户和密码管理集群节点，请避免删除新建的用户。
  :::

### 集群部署后设置 root 用户密码

Doris 集群在部署后，若未设置 root 用户的密码。需要配置一个具有 [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#权限类型) 权限的用户，便于 Doris Operator 自动化的管理集群节点。建议不要使用 root 用户，请参考[用户新建和权限赋值章节](../../../sql-manual/sql-statements/account-management/CREATE-USER)来创建新用户并赋予 Node_priv 权限。创建用户后，通过环境变量或者 Secret 配置新的管理用户和密码，并在 DorisDisaggregatedCluster 资源中配置。

#### 第 1 步：新建拥有 Node_priv 权限用户

通过 MySQL 协议连接数据库后，通过如下命令创建一个仅拥有 Node_priv 权限的用户并设置密码。

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

其中 ${DB_ADMIN_USER} 为要创建的用户名，${DB_ADMIN_PASSWD} 为要设置的密码。

#### 第 2 步：为新用户赋予 Node_priv 权限

使用 MySQL 协议连接数据库后，执行如下命令将 Node_priv 权限赋予新用户。

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

其中，${DB_ADMIN_USER} 为新创建的用户名。

新建用户名密码，以及赋予权限详细使用，请参考官方文档 [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) 部分。

#### 第 3 步：配置 DorisDisaggregatedCluster 资源

- 环境变量方式

  在 DorisDisaggregatedCluster 资源中配置新建用户及其密码，格式如下：
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  其中，${DB_ADMIN_USER} 为新建的用户名，${DB_ADMIN_PASSWD} 为新建用户设置的密码。

- Secret 方式

  a. 配置 Secret

  按照如下格式创建 Basic Authentication Secret：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  其中 ${DB_ADMIN_USER} 为新创建的用户名，${DB_ADMIN_PASSWD} 为新建用户名设置的密码。

  使用以下命令将 Secret 部署到 Kubernetes 集群：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  其中，`${namespace}` 为 DorisDisaggregatedCluster 资源部署的命名空间，`${secretFileName}` 为需要部署的 Secret 的文件名称。

  b. 更新需要使用 Secret 的 DorisDisaggregatedCluster 资源

  在 DorisDisaggregatedCluster 资源中指定使用的 Secret，如下所示：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为部署的 Basic authentication Secret 的名称。

:::tip 提示
- 部署后设置 root 密码，并配置新的拥有管理节点的用户名和密码后，会引起存量服务滚动重启一次。
  :::


## 使用 Kerberos 认证
Doris Operator 从 25.5.1 版本开始支持 Doris 存算分离集群(2.1.10 和 3.0.6 及以后版本) 在 Kubernetes 使用 Kerberos 认证。 Doris 使用 Kerberos 认证需要使用 [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) 和 [keytab 文件](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) 。
Doris Operator 使用 `ConfigMap` 资源挂载 krb5.conf 文件，使用 `Secret` 资源挂载 keytab 文件。使用 Kerberos 认证流程如下：
1. 构建包含 krb5.conf 文件的 ConfigMap：
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace} 为 `DorisDisaggregatedCluster` 部署的命名空间，${name} 为 ConfigMap 想要指定的名字。
2. 构建包含 keytab 的 Secret:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace} 为 `DorisDisaggregatedCluster` 部署的命名空间，${name} 为 Secret 想要指定的名字，如果需要挂载多个 `keytab` 文件，请参考 [kubectl 创建 Secret 文档](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)将多个 `keytab` 文件放到一个 Secret 中。
3. 配置 DorisDisaggregatedCluster 资源，指定包含 `krb5.conf` 的 ConfigMap, 以及包含 `keytab` 文件的 Secret。
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName} 为包含要使用的 `krb5.conf` 文件的 ConfigMap 名称。${keytabSecretName} 为包含 keytab 文件的 Secret 名称。${keytabPath} 为 Secret 希望挂载到容器中的路径，这个路径是创建 catalog 时，通过 `hadoop.kerberos.keytab` 指定 keytab 的文件所在目录。创建
   catalog 请参考配置 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog#配置-catalog) 文档。
