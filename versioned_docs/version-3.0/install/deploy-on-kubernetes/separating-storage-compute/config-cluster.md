---
{
"title": "Config Cluster",
"language": "en"
}
---

In a disaggregated compute-storage cluster, certain configurations apply at the cluster level, such as credentials used by the management system to administer the nodes of various components.

## Configuring Management Username and Password
Managing Doris nodes requires connecting to a live Frontend (FE) node using a username and password via the MySQL protocol. Doris implements a [role-based access control (RBAC)-like authorization mechanism](../../../admin-manual/auth/authentication-and-authorization), and node management operations require a user account with the [Node_priv](../../../admin-manual/auth/authentication-and-authorization#Types-of-Permissions) privilege.

By default, the Doris Operator uses the root user—who has full privileges and no password—for deploying and managing clusters defined in the DorisDisaggregatedCluster resource. Once a password is assigned to the root account, it is necessary to explicitly configure a username and password with Node_priv in the DorisDisaggregatedCluster resource, enabling the Doris Operator to continue performing automated management tasks.

The DorisDisaggregatedCluster resource supports two methods for configuring the credentials required to manage cluster nodes: using environment variables, or using a Kubernetes Secret. Depending on the deployment scenario, the management credentials can be configured in the following ways:

- Initializing a password for the root user during cluster deployment

- Automatically creating a non-root user with management privileges in a passwordless root deployment

- Assigning a password to the root user after the cluster has been deployed using the passwordless root mode

### Configuring the Root User Password During Cluster Deployment
Doris supports specifying the root user password in encrypted form within the `fe.conf` file. To enable Doris Operator to automatically manage cluster nodes during initial deployment, follow the steps below to configure the root password.

#### Step 1: Generate the Encrypted Root Password
Doris allows you to configure the root user password in the [FE configuration file](../../../admin-manual/config/fe-config#initial_root_password) using an encrypted format. The password is encrypted using a two-stage SHA-1 hashing algorithm. Below are code examples demonstrating how to perform this encryption:

**Java Implementation:**
```javascript
import org.apache.commons.codec.digest.DigestUtils;

public static void main(String[] args) {
    // Original password
    String a = "123456";
    String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
    // Output the two-stage encrypted password
    System.out.println("*" + b);
}
```
**Golang Implementation:**
```go
import (
    "crypto/sha1"
    "encoding/hex"
    "fmt"
    "strings"
)

func main() {
    // Original password
    plan := "123456"
    
    // First stage encryption
    h := sha1.New()
    h.Write([]byte(plan))
    eb := h.Sum(nil)

    // Second stage encryption
    h.Reset()
    h.Write(eb)
    teb := h.Sum(nil)
    dst := hex.EncodeToString(teb)
    tes := strings.ToUpper(fmt.Sprintf("%s", dst))
    
    // Output the two-stage encrypted password
    fmt.Println("*" + tes)
}
```
Add the resulting encrypted password to the fe.conf file as required. Then, follow the instructions in the [FE startup configuration section](config-fe.md#custom-startup-configuration) to deliver the configuration file to the Kubernetes cluster using a `ConfigMap`.

#### Step 2: Define the DorisDisaggregatedCluster Resource
Once the initial password is configured in the `fe.conf` file, the root password takes effect immediately when the first Doris FE node starts. As additional nodes join the cluster, Doris Operator uses the root credentials to manage and add these nodes. Therefore, it is necessary to provide the root username and password in the `DorisDisaggregatedCluster` resource.

**Option 1: Using Environment Variables**  
Specify the root credentials in the `.spec.adminUser.name` and `.spec.adminUser.password` fields of the `DorisDisaggregatedCluster` resource. Doris Operator will automatically convert these values into container environment variables. Auxiliary services within the container will use these environment variables to add nodes to the cluster.
Example configuration:
```yaml
spec:
  adminUser:
    name: root
    password: ${password}
```
Here, ${password} should be the plaintext (unencrypted) password for the root user.

**Option 2: Using a Secret**  
Doris Operator also supports using a [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) to provide the root username and password. Doris Operator will mount this Secret into the container as a file, which auxiliary services will parse to retrieve the credentials and use them to automatically add nodes to the cluster.

The Secret must contain exactly two fields: `username` and `password`.

1. Define the Secret  
    Create a Basic Authentication Secret in the following format:

    ```yaml
    stringData:
      username: root
      password: ${password}
    ```
    ${password} is the plaintext password for the root user.  
    Deploy the Secret to the Kubernetes cluster using the command below:
    ```yaml
    kubectl -n ${namespace} apply -f ${secretFileName}.yaml
    ```
    ${namespace}: the target namespace where the DorisDisaggregatedCluster will be deployed.  
    ${secretFileName}: the name of the YAML file containing the Secret definition

2. Configure the DorisDisaggregatedCluster Resource  
    Reference the Secret in the `DorisDisaggregatedCluster` resource using the `spec.authSecret` field:
    ```yaml
    spec:
      authSecret: ${secretName}
    ```
    Here, ${secretName} is the name of the Kubernetes Secret containing the root user credentials.

### Automatically Creating a Non-Root Administrative User and Password During Deployment (Recommended)
If you choose not to set an initial password for the root user during the first deployment, you can configure a non-root administrative user and its password using either environment variables or a Kubernetes Secret. Doris's auxiliary services within the container will automatically create this user within Doris, assign the specified password, and grant it the `Node_priv` privilege. The Doris Operator will then use this automatically created user account to manage cluster nodes.

#### Option 1: Using Environment Variables
Define the `DorisDisaggregatedCluster` resource as shown below:
```yaml
spec:
  adminUser:
    name: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```
${DB_ADMIN_USER}: the name of the new non-root user with administrative privileges. ${DB_ADMIN_PASSWD}: the password to assign to the new user.

#### Option 2: Using a Secret
a. Create the Required Secret  
Define a Basic Authentication Secret using the following format:
```yaml
stringData:
  username: ${DB_ADMIN_USER}
  password: ${DB_ADMIN_PASSWD}
```
${DB_ADMIN_USER}: the username for the new administrative user. ${DB_ADMIN_PASSWD}: the password to assign to the new user.
Deploy the Secret to your Kubernetes cluster using:
```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```
${namespace}: the namespace where the DorisDisaggregatedCluster resource is deployed. ${secretFileName}: the name of the YAML file defining the Secret.

b. Update the DorisDisaggregatedCluster Resource  
Specify the Secret in the `DorisDisaggregatedCluster` resource:
```yaml
spec:
  authSecret: ${secretName}
```
${secretName}: the name of the Secret containing the non-root administrative user credentials.

:::tip Note
After deployment, it is recommended to set a password for the root user. Once this is done, Doris Operator will switch to managing cluster nodes using the new non-root user. Avoid deleting this user after it has been created.
:::

### Setting the Root User Password After Cluster Deployment
If the root user password is not configured during initial deployment, a user with the [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) privilege must be provided to allow Doris Operator to continue managing cluster nodes automatically. It is not recommended to use the root user for this purpose. Instead, refer to the [User Creation and Privilege Assignment documentation](../../../sql-manual/sql-statements/account-management/CREATE-USER) to create a new user and assign the required privileges. After creating the user, configure the credentials using either environment variables or a Kubernetes Secret, and update the `DorisDisaggregatedCluster` resource accordingly.

#### Step 1: Create a User with Node_priv Privilege
Connect to the database using the MySQL protocol, and execute the following SQL command to create a new user and assign a password:
```sql
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```
${DB_ADMIN_USER}: the name of the user to be created. ${DB_ADMIN_PASSWD}: the password for the new user.

#### Step 2: Grant Node_priv Privilege to the User
Still connected via the MySQL protocol, execute the following command to grant the `Node_priv` privilege:
```sql
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
Refer to the official [CREATE USER documentation](../../../sql-manual/sql-statements/account-management/CREATE-USER) for more details on user creation and privilege assignment.

#### Step 3: Update the DorisDisaggregatedCluster Resource
- Option 1: Using Environment Variables  
    Specify the newly created user and password in the DorisDisaggregatedCluster resource:
    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
  ${DB_ADMIN_USER}: the name of the new administrative user. ${DB_ADMIN_PASSWD}: the corresponding password.

- Option 2: Using a Secret  
    a. Define the Secret  
    Create a Basic Authentication Secret in the following format:
    ```yaml
    stringData:
      username: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
    ```
    Deploy the Secret to your Kubernetes cluster using the following command:
    ```shell
    kubectl -n ${namespace} apply -f ${secretFileName}.yaml
    ```
    ${namespace}: the namespace where the DorisDisaggregatedCluster resource is deployed. ${secretFileName}: the name of the Secret definition file.

    b. Update the DorisDisaggregatedCluster Resource  
    Reference the Secret in the resource configuration:
    ```yaml
    spec:
      authSecret: ${secretName}
    ```
    ${secretName}: the name of the Secret containing the user credentials.

:::tip Note
After configuring the root password and specifying a new user with node management privileges, Doris Operator will trigger a rolling restart of existing services in the cluster.
:::

## Using Kerberos Authentication
The Doris Operator has supported Kerberos authentication for Doris (versions 2.1.10, 3.0.6, and later) in Kubernetes since version 25.5.1. To enable Kerberos authentication in Doris, both the [krb5.conf file](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) and [keytab files](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) are required.
The Doris Operator mounts the krb5.conf file using a ConfigMap resource and mounts the keytab files using a Secret resource. The workflow for enabling Kerberos authentication is as follows:

1. Create a ConfigMap containing the krb5.conf file:
    ```shell
    kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
    ```
   Replace ${namespace} with the namespace where the DorisDisaggregatedCluster is deployed, and ${name} with the desired name for the ConfigMap.
2. Create a Secret containing the keytab files:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
    ```
   Replace ${namespace} with the namespace where the DorisDisaggregatedCluster is deployed, and ${name} with the desired name for the Secret. If multiple keytab files need to be mounted, refer to the [kubectl create Secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) to include them in a single Secret.
3. Configure the DorisDisaggregatedCluster resource to specify the ConfigMap containing krb5.conf and the Secret containing keytab files:
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName}: Name of the ConfigMap containing the krb5.conf file. ${keytabSecretName}: Name of the Secret containing the keytab files. ${keytabPath}: The directory path in the container where the Secret mounts the keytab files. This path should match the directory specified by hadoop.kerberos.keytab when creating a catalog. For catalog configuration details, refer to the [Hive Catalog configuration](../../../lakehouse/datalake-analytics/hive.md#catalog-configuration) documentation.
