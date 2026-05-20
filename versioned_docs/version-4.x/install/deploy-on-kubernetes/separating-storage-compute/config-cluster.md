---
{
    "title": "Configuring Authentication",
    "language": "en",
    "description": "A detailed introduction to the two cluster-level configuration modes (environment variables and Secret) in a storage-compute separation cluster, along with the complete steps for the three password configuration scenarios, including Kerberos authentication configuration.",
    "keywords": ["Doris", "Storage-Compute Separation", "Kubernetes", "Username and Password", "Secret", "Kerberos", "Authentication", "Node_priv"]
}
---

## What you will learn in this chapter

- Understand the authentication mechanism Doris Operator needs to manage cluster nodes
- Configure management credentials using either environment variables or Secret
- Configure usernames and passwords correctly across the three stages: before deployment, during deployment, and after deployment
- Configure Kerberos authentication for a storage-compute separation cluster

## Configuration principles and scenario selection

### Why management credentials need to be configured

Managing Doris nodes requires connecting to a live FE node over the MySQL protocol with a username and password. Doris implements an [RBAC-like privilege management mechanism](../../../admin-manual/auth/authentication-and-authorization), and node management requires the user to have the [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) privilege.

By default, Doris Operator uses the root user with all privileges and no password to deploy and manage the cluster configured by the DorisDisaggregatedCluster resource. After a password is added to the root user, you must explicitly configure a username and password with the Node_priv privilege in the DorisDisaggregatedCluster resource so that Doris Operator can perform automated management operations on the cluster.

### Comparison of the three password configuration scenarios

Depending on the cluster's stage and management requirements, there are three configuration scenarios. Refer to the table below to choose:

| Scenario | When to use | Operational complexity | Code-based encryption required |
|------|---------|-----------|-----------------|
| Scenario 1: Initialize the root password during deployment | First-time cluster deployment | Medium | Yes (two-stage SHA-1 encryption) |
| Scenario 2: Automatically create a non-root management user during deployment (recommended) | First-time cluster deployment | Low | No |
| Scenario 3: Set the root password after deployment | Cluster already running | High | No |

### General configuration principles

Regardless of which scenario you choose to configure passwords, note the following:

- **Passwords of existing users are not modified automatically**: For users that already exist, such as root and admin, Operator never modifies their passwords automatically under any circumstances. You must configure or modify them yourself.
- **Using the admin user as the management user is not recommended**: The admin user is typically used as the highest-privilege user for database read and write operations, not for cluster operations and maintenance. The admin user lacks specific privileges required by certain Operator features.
- **Non-root management users should be dedicated**: It is recommended that non-root users be dedicated to a single purpose and not used for anything else, to avoid situations where a password change cannot be synchronized to Operator or privileges are lost, causing operations and maintenance to fail.

### Two credential delivery methods

The DorisDisaggregatedCluster resource supports the following two credential configuration methods. You can choose either one in each scenario:

| Configuration method | Field used | Implementation mechanism |
|---------|---------|---------|
| Environment variables | `.spec.adminUser` | Operator automatically converts the username and password into container environment variables, which are read by the in-container helper service |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator mounts the Basic Authentication Secret as a file at a designated location in the container, where the in-container helper service parses it |

## Scenario 1: Initialize the root user password during deployment

When deploying a cluster for the first time, you may want to use root as the management user and set an initialization password in advance. Doris supports configuring the root user's password in encrypted form in `fe.conf`, setting the root user's password during the first deployment of Doris so that Doris Operator can automatically manage cluster nodes.

Configuration workflow overview:

1. Generate the encrypted root password
2. Configure the encrypted password in `fe.conf`
3. Configure management credentials in DorisDisaggregatedCluster (choose either environment variables or Secret)

### Step 1: Generate the encrypted root password

Doris supports setting the root user's password in encrypted form in the [FE configuration file](../../../admin-manual/config/fe-config#initial_root_password). The encryption uses two-stage SHA-1 encryption. Sample code implementations are shown below.

**Java implementation:**

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

**Golang implementation:**

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

### Step 2: Configure the encrypted password in fe.conf

Configure the encrypted password from the previous step into `fe.conf` according to the configuration file's requirements. Following the instructions in the [FE startup parameter configuration chapter](config-fe#自定义启动配置), deliver the configuration file to the Kubernetes cluster as a `ConfigMap`.

### Step 3: Configure management credentials in DorisDisaggregatedCluster

Once the configuration file sets the root initialization password, the root password takes effect immediately when the first Doris FE node starts. When subsequent nodes join the cluster, Doris Operator uses the root username and password to add the nodes. Therefore, you must specify the username and password in the deployed DorisDisaggregatedCluster resource so that Doris Operator can manage the cluster nodes.

Choose one of the following two methods to configure.

#### Method A: Environment variable configuration

Configure the root username and password in the `.spec.adminUser.name` and `.spec.adminUser.password` fields of the DorisDisaggregatedCluster resource. Doris Operator automatically converts these settings into container environment variables, and the helper service inside the container uses the environment variables to add nodes to the cluster. The configuration format is as follows:

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

Here, `${password}` is the unencrypted password of root.

#### Method B: Secret configuration

Doris Operator supports using a [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) to specify the username and password for managing nodes. Doris Operator automatically mounts the Secret as a file at a designated location in the container, and the helper service in the container parses the username and password from the file and uses them to automatically add nodes to the cluster. The stringData of the Basic Authentication Secret contains only two fields: username and password.

**Step 1: Create and deploy the Secret**

Configure the Basic Authentication Secret to be used in the following format:

```yaml
stringData:
    username: root
    password: ${password}
```

Here, `${password}` is the unencrypted password set for root.

Deploy the Secret to the Kubernetes cluster with the following command:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where the DorisDisaggregatedCluster resource needs to be deployed |
| `${secretFileName}` | The file name of the Secret to be deployed |

**Step 2: Reference the Secret in DorisDisaggregatedCluster**

In the DorisDisaggregatedCluster resource to be deployed, specify the Secret to be used. The configuration is as follows:

```yaml
spec:
    authSecret: ${secretName}
```

Here, `${secretName}` is the name of the Secret that contains the root username and password.

## Scenario 2: Automatically create a non-root management user during deployment (recommended)

When deploying a cluster for the first time, you may want Operator to automatically create a dedicated non-root management user. During the first deployment, if the root initialization password is not set, you can configure a non-root user and login password through environment variables or a Secret. The Doris container's helper service automatically creates the user in Doris, sets the password, and grants the Node_priv privilege. Doris Operator then uses the automatically created username and password to manage cluster nodes.

Choose one of the following two methods to configure.

### Method A: Environment variable configuration

Configure the DorisDisaggregatedCluster resource to be deployed in the following format:

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| Parameter | Description |
|------|------|
| `${DB_ADMIN_USER}` | The username to be created with management privileges |
| `${DB_ADMIN_PASSWD}` | The password for the new user |

### Method B: Secret configuration

**Step 1: Create and deploy the Secret**

Configure the Basic Authentication Secret to be used in the following format:

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| Parameter | Description |
|------|------|
| `${DB_ADMIN_USER}` | The newly created username |
| `${DB_ADMIN_PASSWD}` | The password set for the newly created username |

Deploy the Secret to the Kubernetes cluster with the following command:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where the DorisDisaggregatedCluster resource is deployed |
| `${secretFileName}` | The file name of the Secret to be deployed |

**Step 2: Reference the Secret in DorisDisaggregatedCluster**

In the DorisDisaggregatedCluster resource, specify the Secret to be used, as shown below:

```yaml
spec:
    authSecret: ${secretName}
```

Here, `${secretName}` is the name of the deployed Basic Authentication Secret.

:::tip Tip
After deployment, set the root password. Doris Operator will switch to using the new user and password to manage cluster nodes. Avoid deleting the newly created user.
:::

## Scenario 3: Set the root user password after the cluster is deployed

If the root user's password is not set after a Doris cluster is deployed, you need to configure a user with the [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) privilege so that Doris Operator can manage cluster nodes automatically. It is recommended not to use the root user. Refer to the [Creating users and granting privileges chapter](../../../sql-manual/sql-statements/account-management/CREATE-USER) to create a new user and grant the Node_priv privilege. After creating the user, configure the new management user and password through environment variables or a Secret, and configure them in the DorisDisaggregatedCluster resource.

Configuration workflow overview:

1. Use the MySQL protocol to create a user with the Node_priv privilege
2. Grant the Node_priv privilege to the new user
3. Configure management credentials in DorisDisaggregatedCluster (choose either environment variables or Secret)

### Step 1: Create a user with the Node_priv privilege

After connecting to the database via the MySQL protocol, create a user and set a password with the following command:

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| Parameter | Description |
|------|------|
| `${DB_ADMIN_USER}` | The username to create |
| `${DB_ADMIN_PASSWD}` | The password to set |

### Step 2: Grant the Node_priv privilege to the new user

After connecting to the database via the MySQL protocol, run the following command to grant the Node_priv privilege to the new user:

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

Here, `${DB_ADMIN_USER}` is the newly created username.

For details on creating users, setting passwords, and granting privileges, refer to the official [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) documentation.

### Step 3: Configure management credentials in DorisDisaggregatedCluster

Choose one of the following two methods to configure.

#### Method A: Environment variable configuration

Configure the newly created user and password in the DorisDisaggregatedCluster resource in the following format:

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| Parameter | Description |
|------|------|
| `${DB_ADMIN_USER}` | The newly created username |
| `${DB_ADMIN_PASSWD}` | The password set for the newly created user |

#### Method B: Secret configuration

**Step 1: Create and deploy the Secret**

Create a Basic Authentication Secret in the following format:

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| Parameter | Description |
|------|------|
| `${DB_ADMIN_USER}` | The newly created username |
| `${DB_ADMIN_PASSWD}` | The password set for the newly created username |

Deploy the Secret to the Kubernetes cluster with the following command:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where the DorisDisaggregatedCluster resource is deployed |
| `${secretFileName}` | The file name of the Secret to be deployed |

**Step 2: Reference the Secret in DorisDisaggregatedCluster**

In the DorisDisaggregatedCluster resource, specify the Secret to be used, as shown below:

```yaml
spec:
    authSecret: ${secretName}
```

Here, `${secretName}` is the name of the deployed Basic Authentication Secret.

:::tip Tip
After deployment, setting the root password and configuring the new username and password with node management privileges will trigger one rolling restart of the existing services.
:::

## Mounting Kerberos authentication files

This section describes how to mount Kerberos authentication files for a Doris storage-compute separation cluster in a Kubernetes environment. After configuration, the `krb5.conf` configuration file and `keytab` key file required by Kerberos authentication are mounted into the Doris container for use by features such as [Hive Catalog](../../../lakehouse/catalogs/hive-catalog), allowing Doris to connect to Hive or other external data sources with Kerberos authentication enabled.

:::caution Note
This is not about accessing the Doris cluster via Kerberos. After mounting, Doris can use these Kerberos files to access other external data sources (such as HDFS).
:::

### Prerequisites

- Doris Operator 25.5.1 or later
- Doris storage-compute separation cluster 2.1.10 or 3.0.6 or later

### Required files

| File | Description |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Kerberos configuration file |
| [keytab file](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | A file containing the Kerberos principal and encryption keys |

### Step 1: Create a ConfigMap to store krb5.conf

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where `DorisDisaggregatedCluster` is deployed |
| `${name}` | ConfigMap name |

### Step 2: Create a Secret to store the keytab file

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where `DorisDisaggregatedCluster` is deployed |
| `${name}` | Secret name |
| `${xxx.keytab}` | keytab file name |

:::tip Tip
If you need to mount multiple `keytab` files, refer to the [kubectl create secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) to put multiple `keytab` files into a single Secret.
:::

### Step 3: Configure Kerberos information in DorisDisaggregatedCluster

```yaml
spec:
    kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
```

| Parameter | Description |
|------|------|
| `${krb5ConfigMapName}` | The name of the ConfigMap that contains the `krb5.conf` file |
| `${keytabSecretName}` | The name of the Secret that contains the keytab file |
| `${keytabPath}` | The path where the keytab file is mounted in the container |

### Step 4: Use Kerberos authentication in Hive Catalog

Once Kerberos is configured, you can enable Kerberos authentication when creating a Hive Catalog. For specific configuration, refer to the [Hive Catalog configuration documentation](../../../lakehouse/catalogs/hive-catalog#配置-catalog).
