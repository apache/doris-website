---
{
    "title": "配置认证",
    "language": "zh-CN",
    "description": "详细介绍存算分离集群中集群级配置的两种模式（环境变量与 Secret），以及三种密码配置场景的完整操作步骤，包括 Kerberos 认证配置。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "用户名密码", "Secret", "Kerberos", "认证", "Node_priv"]
}
---

## 学完本章节你将能够

- 理解 Doris Operator 管理集群节点所需的认证机制
- 使用环境变量或 Secret 两种方式配置管理凭证
- 在集群部署前、部署时、部署后三个阶段正确配置用户名密码
- 为存算分离集群配置 Kerberos 认证

## 配置原理与场景选择

### 为什么需要配置管理凭证

Doris 节点的管理需要通过用户名、密码以 MySQL 协议连接活着的 FE 节点进行操作。Doris 实现[类似 RBAC 的权限管理机制](../../../admin-manual/auth/security-overview)，节点的管理需要用户拥有 [Node_priv](../../../admin-manual/auth/authorization/internal#所有权限) 权限。

Doris Operator 默认使用拥有所有权限的 root 用户无密码模式对 DorisDisaggregatedCluster 资源配置的集群进行部署和管理。当 root 用户添加密码后，需要在 DorisDisaggregatedCluster 资源中显式配置拥有 Node_Priv 权限的用户名和密码，以便 Doris Operator 对集群进行自动化管理操作。

### 三种密码配置场景对比

根据集群所处阶段和管理需求的不同，存在三种配置场景，可参考下表选择：

| 场景 | 适用时机 | 操作复杂度 | 是否需要代码加密 |
|------|---------|-----------|-----------------|
| 场景一：部署时初始化 root 密码 | 首次部署集群 | 中 | 需要（SHA-1 两阶段加密） |
| 场景二：部署时自动创建非 root 管理用户（推荐） | 首次部署集群 | 低 | 不需要 |
| 场景三：部署后设置 root 密码 | 集群已运行 | 高 | 不需要 |

### 通用配置原则

无论选择何种场景配置密码，请注意以下几点：

- **已存在用户的密码不会被自动修改**：root、admin 等已经存在用户的密码，任何情况下 Operator 都不会自动进行修改，需要用户自己去配置或者修改。
- **不推荐使用 admin 用户作为管理用户**：admin 用户通常作为数据库读写最高权限用户，而非用作集群运维。在 Operator 的某些功能上，admin 用户缺少特定权限。
- **非 root 管理用户应专号专用**：建议非 root 用户专号专用，不要用作其他用途，避免密码修改后无法同步到 Operator 上或者权限丢失，导致运维失效。

### 两种凭证下发方式

DorisDisaggregatedCluster 资源支持以下两种凭证配置方式，可在每个场景中任选其一：

| 配置方式 | 使用字段 | 实现机制 |
|---------|---------|---------|
| 环境变量 | `.spec.adminUser` | Operator 将用户名密码自动转为容器环境变量，由容器辅助服务读取 |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator 将 Basic Authentication Secret 以文件形式挂载到容器指定位置，由容器辅助服务解析 |

## 场景一：部署时初始化 root 用户密码

首次部署集群时，希望使用 root 作为管理用户并预先设置初始化密码。Doris 支持将 root 的用户以密文的形式配置在 `fe.conf` 中，在 Doris 首次部署时配置 root 用户的密码，以便让 Doris Operator 能够自动管理集群节点。

配置流程概览：

1. 生成 root 加密密码
2. 在 `fe.conf` 中配置加密密码
3. 在 DorisDisaggregatedCluster 中配置管理凭证（环境变量或 Secret 二选一）

### 第 1 步：生成 root 加密密码

Doris 支持密文的方式在 [FE 的配置文件](../../../admin-manual/config/fe-config#initial_root_password) 中设置 root 用户的密码，密码的加密方式是采用两阶段 SHA-1 加密实现。代码实现示例如下。

**Java 代码实现：**

```java
import org.apache.commons.codec.digest.DigestUtils;

public static void main(String[] args) {
    // the original password
    String a = "123456";
    String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
    // output the 2 stage encrypted password.
    System.out.println("*" + b);
}
```

**Golang 代码实现：**

```go
import (
    "crypto/sha1"
    "encoding/hex"
    "fmt"
    "strings"
)

func main() {
    // original password
    plan := "123456"
    // the first stage encryption.
    h := sha1.New()
    h.Write([]byte(plan))
    eb := h.Sum(nil)

    // the two stage encryption.
    h.Reset()
    h.Write(eb)
    teb := h.Sum(nil)
    dst := hex.EncodeToString(teb)
    tes := strings.ToUpper(fmt.Sprintf("%s", dst))
    // output the 2 stage encrypted password.
    fmt.Println("*" + tes)
}
```

### 第 2 步：在 fe.conf 中配置加密密码

将上一步加密后的密码按照配置文件要求配置到 `fe.conf` 中，根据 [FE 启动参数配置章节](config-fe#自定义启动配置)的说明，将配置文件以 `ConfigMap` 的形式下发到 Kubernetes 集群。

### 第 3 步：在 DorisDisaggregatedCluster 中配置管理凭证

配置文件设置了 root 初始化密码后，当 Doris FE 第一个节点启动后 root 的密码会立即生效，后续节点加入集群时，Doris Operator 将使用 root 用户名和密码来添加节点。因此，需要在部署的 DorisDisaggregatedCluster 资源中指定用户名和密码，以便 Doris Operator 管理集群节点。

请从以下两种方式中任选其一进行配置。

#### 方式 A：环境变量配置

将 root 用户名和密码配置到 DorisDisaggregatedCluster 资源中的 `.spec.adminUser.name` 和 `.spec.adminUser.password` 字段，Doris Operator 会自动将这些配置转为容器的环境变量，容器内的辅助服务会使用环境变量来添加节点到集群。配置格式如下：

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

其中，`${password}` 为 root 的非加密密码。

#### 方式 B：Secret 配置

Doris Operator 提供使用 [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) 来指定管理节点的用户名和密码。Doris Operator 会自动将 Secret 以文件形式挂载到容器指定位置，容器的辅助服务会解析出文件中的用户名和密码，用于自动将节点加入集群。Basic Authentication Secret 的 stringData 只包含 2 个字段：username 和 password。

**步骤 1：创建并部署 Secret**

按照如下格式配置需要使用的 Basic Authentication Secret：

```yaml
stringData:
    username: root
    password: ${password}
```

其中，`${password}` 为 root 设置的非加密密码。

通过如下命令将 Secret 部署到 Kubernetes 集群中：

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 参数 | 说明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 资源需要部署的命名空间 |
| `${secretFileName}` | 需要部署的 Secret 的文件名称 |

**步骤 2：在 DorisDisaggregatedCluster 中引用 Secret**

在需要部署的 DorisDisaggregatedCluster 资源中，指定使用的 Secret。配置如下：

```yaml
spec:
    authSecret: ${secretName}
```

其中，`${secretName}` 为包含 root 用户名和密码的 Secret 名称。

## 场景二：部署时自动创建非 root 管理用户（推荐）

首次部署集群时，希望由 Operator 自动创建一个专用的非 root 管理用户。在首次部署时，如果不设置 root 的初始化密码，可以通过环境变量或者 Secret 的方式配置非 root 用户和登录密码。Doris 容器的辅助服务会自动在 Doris 中创建该用户，设置密码并赋予 Node_priv 权限，Doris Operator 将使用自动创建的用户名和密码管理集群节点。

请从以下两种方式中任选其一进行配置。

### 方式 A：环境变量配置

按照如下格式配置需要部署的 DorisDisaggregatedCluster 资源：

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| 参数 | 说明 |
|------|------|
| `${DB_ADMIN_USER}` | 需要新建拥有管理权限的用户名 |
| `${DB_ADMIN_PASSWD}` | 新建用户的密码 |

### 方式 B：Secret 配置

**步骤 1：创建并部署 Secret**

按照如下格式配置需要使用的 Basic Authentication Secret：

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| 参数 | 说明 |
|------|------|
| `${DB_ADMIN_USER}` | 新创建的用户名 |
| `${DB_ADMIN_PASSWD}` | 新建用户名设置的密码 |

使用以下命令将 Secret 部署到 Kubernetes 集群中：

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 参数 | 说明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 资源部署的命名空间 |
| `${secretFileName}` | 需要部署的 Secret 的文件名称 |

**步骤 2：在 DorisDisaggregatedCluster 中引用 Secret**

在 DorisDisaggregatedCluster 资源中指定使用的 Secret，如下所示：

```yaml
spec:
    authSecret: ${secretName}
```

其中，`${secretName}` 为部署的 Basic Authentication Secret 的名称。

:::tip 提示
部署后请设置 root 的密码，Doris Operator 会切换为使用新用户和密码管理集群节点，请避免删除新建的用户。
:::

## 场景三：集群部署后设置 root 用户密码

Doris 集群在部署后若未设置 root 用户的密码，需要配置一个具有 [Node_priv](../../../admin-manual/auth/authorization/internal#所有权限) 权限的用户，便于 Doris Operator 自动化的管理集群节点。建议不要使用 root 用户，请参考[用户新建和权限赋值章节](../../../sql-manual/sql-statements/account-management/CREATE-USER)来创建新用户并赋予 Node_priv 权限。创建用户后，再通过环境变量或者 Secret 配置新的管理用户和密码，并在 DorisDisaggregatedCluster 资源中配置。

配置流程概览：

1. 通过 MySQL 协议新建拥有 Node_priv 权限的用户
2. 为新用户赋予 Node_priv 权限
3. 在 DorisDisaggregatedCluster 中配置管理凭证（环境变量或 Secret 二选一）

### 第 1 步：新建拥有 Node_priv 权限用户

通过 MySQL 协议连接数据库后，通过如下命令创建一个用户并设置密码：

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| 参数 | 说明 |
|------|------|
| `${DB_ADMIN_USER}` | 要创建的用户名 |
| `${DB_ADMIN_PASSWD}` | 要设置的密码 |

### 第 2 步：为新用户赋予 Node_priv 权限

使用 MySQL 协议连接数据库后，执行如下命令将 Node_priv 权限赋予新用户：

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

其中，`${DB_ADMIN_USER}` 为新创建的用户名。

新建用户名密码以及赋予权限的详细使用，请参考官方文档 [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) 部分。

### 第 3 步：在 DorisDisaggregatedCluster 中配置管理凭证

请从以下两种方式中任选其一进行配置。

#### 方式 A：环境变量配置

在 DorisDisaggregatedCluster 资源中配置新建用户及其密码，格式如下：

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| 参数 | 说明 |
|------|------|
| `${DB_ADMIN_USER}` | 新建的用户名 |
| `${DB_ADMIN_PASSWD}` | 新建用户设置的密码 |

#### 方式 B：Secret 配置

**步骤 1：创建并部署 Secret**

按照如下格式创建 Basic Authentication Secret：

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| 参数 | 说明 |
|------|------|
| `${DB_ADMIN_USER}` | 新创建的用户名 |
| `${DB_ADMIN_PASSWD}` | 新建用户名设置的密码 |

使用以下命令将 Secret 部署到 Kubernetes 集群：

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| 参数 | 说明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster 资源部署的命名空间 |
| `${secretFileName}` | 需要部署的 Secret 的文件名称 |

**步骤 2：在 DorisDisaggregatedCluster 中引用 Secret**

在 DorisDisaggregatedCluster 资源中指定使用的 Secret，如下所示：

```yaml
spec:
    authSecret: ${secretName}
```

其中，`${secretName}` 为部署的 Basic Authentication Secret 的名称。

:::tip 提示
部署后设置 root 密码，并配置新的拥有管理节点的用户名和密码后，会引起存量服务滚动重启一次。
:::

## 挂载 Kerberos 认证文件

本节介绍如何在 Kubernetes 环境中为 Doris 存算分离集群挂载 Kerberos 认证文件。配置完成后，将 Kerberos 认证所需的 `krb5.conf` 配置文件和 `keytab` 密钥文件挂载到 Doris 容器中，供 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog) 等功能使用，使 Doris 能够连接开启了 Kerberos 认证的 Hive 或其他外部数据源。

:::caution 注意
这里并不是通过 Kerberos 访问 Doris 集群，而是挂载后，Doris 能使用这些 Kerberos 文件访问其他外部数据源（如 HDFS）。
:::

### 前置条件

- Doris Operator 25.5.1 及以上版本
- Doris 存算分离集群 2.1.10 或 3.0.6 及以上版本

### 所需文件

| 文件 | 说明 |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Kerberos 配置文件 |
| [keytab 文件](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | 包含 Kerberos 主体和加密密钥的文件 |

### 第 1 步：创建 ConfigMap 存储 krb5.conf

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| 参数 | 说明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` 部署的命名空间 |
| `${name}` | ConfigMap 名称 |

### 第 2 步：创建 Secret 存储 keytab 文件

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| 参数 | 说明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` 部署的命名空间 |
| `${name}` | Secret 名称 |
| `${xxx.keytab}` | keytab 文件名 |

:::tip 提示
如果需要挂载多个 `keytab` 文件，请参考 [kubectl 创建 Secret 文档](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) 将多个 `keytab` 文件放到一个 Secret 中。
:::

### 第 3 步：在 DorisDisaggregatedCluster 中配置 Kerberos 信息

```yaml
spec:
    kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
```

| 参数 | 说明 |
|------|------|
| `${krb5ConfigMapName}` | 包含 `krb5.conf` 文件的 ConfigMap 名称 |
| `${keytabSecretName}` | 包含 keytab 文件的 Secret 名称 |
| `${keytabPath}` | keytab 文件挂载到容器中的路径 |

### 第 4 步：在 Hive Catalog 中使用 Kerberos 认证

Kerberos 配置完成后，你可以在创建 Hive Catalog 时启用 Kerberos 认证。具体配置请参考 [Hive Catalog 配置文档](../../../lakehouse/catalogs/hive-catalog#配置-catalog)。
