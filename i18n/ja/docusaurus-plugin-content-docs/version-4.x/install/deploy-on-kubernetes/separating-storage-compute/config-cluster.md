---
{
    "title": "認証の設定",
    "language": "ja",
    "description": "ストレージとコンピュートを分離したクラスターにおける、環境変数と Secret の二つのクラスター単位の設定方法、および三つのパスワード設定シナリオの手順を詳しく説明します。Kerberos 認証の設定も含みます。",
    "keywords": ["Doris", "Storage-Compute Separation", "Kubernetes", "Username and Password", "Secret", "Kerberos", "Authentication", "Node_priv"]
}
---

## この章で学ぶこと {#what-you-will-learn-in-this-chapter}

- Doris Operator がクラスターノードを管理するために必要な認証の仕組みを理解する
- 環境変数または Secret を使用して管理用認証情報を設定する
- デプロイ前、デプロイ中、デプロイ後の三つの段階でユーザー名とパスワードを正しく設定する
- ストレージとコンピュートを分離したクラスターに Kerberos 認証を設定する

## 設定の基本原則とシナリオの選択 {#configuration-principles-and-scenario-selection}

### 管理用認証情報が必要な理由 {#why-management-credentials-need-to-be-configured}

Doris ノードを管理するには、ユーザー名とパスワードを使用し、MySQL プロトコルで稼働中の FE ノードに接続する必要があります。Doris には [RBAC に類似した権限管理の仕組み](../../../admin-manual/auth/authentication-and-authorization)があり、ノードの管理には [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 権限を持つユーザーが必要です。

デフォルトでは、Doris Operator は全権限を持つパスワード未設定の root ユーザーを使用して、DorisDisaggregatedCluster リソースで設定されたクラスターをデプロイおよび管理します。root ユーザーにパスワードを設定した後は、Doris Operator がクラスターを自動管理できるよう、Node_priv 権限を持つユーザーの名前とパスワードを DorisDisaggregatedCluster リソースに明示的に設定する必要があります。

:::caution root のパスワード設定後の管理用認証情報
root にパスワードを設定したら、Operator とノードの起動スクリプトに有効な管理用認証情報を指定してください。`spec.authSecret` の使用を推奨します。FE SQL を介して登録する BE ノードでは、認証情報がない場合や一致しない場合、クラスターに参加できないことがあります。Secret は `DorisDisaggregatedCluster` と同じ名前空間に配置し、Doris 内の有効な管理用アカウントと一致する `username` と `password` を含める必要があります。Secret を更新しても、既存のデータベースアカウントのパスワードは変更されません。データベース側のパスワードを変更した場合は、Secret にも反映してください。

root にすでにパスワードが設定されている場合、専用の管理用アカウントを使用する前に、管理者がそのアカウントを作成して権限を付与する必要があります。起動スクリプトによる自動作成を前提にしないでください。
:::

### 三つのパスワード設定シナリオの比較 {#comparison-of-the-three-password-configuration-scenarios}

クラスターの段階と管理上の要件に応じて、次の表からシナリオを選択してください。

| シナリオ | 使用するタイミング | 作業の複雑さ | コードによる暗号化の要否 |
|------|---------|-----------|-----------------|
| シナリオ 1：デプロイ時に root パスワードを初期設定する | クラスターの初回デプロイ時 | 中 | 必要（二段階の SHA-1 暗号化） |
| シナリオ 2：デプロイ時に root 以外の管理用ユーザーを自動作成する（推奨） | クラスターの初回デプロイ時 | 低 | 不要 |
| シナリオ 3：デプロイ後に root パスワードを設定する | クラスターがすでに稼働している場合 | 高 | 不要 |

### 共通の設定原則 {#general-configuration-principles}

どのシナリオでパスワードを設定する場合も、以下の点に注意してください。

- **既存ユーザーのパスワードは自動変更されません**：root や admin など、すでに存在するユーザーのパスワードを Operator が自動変更することはありません。設定や変更は自分で行う必要があります。
- **admin ユーザーを管理用ユーザーとして使用することは推奨しません**：admin ユーザーは通常、クラスターの運用管理ではなく、データベースの読み書きにおける最高権限のユーザーとして使用します。Operator の一部の機能に必要な特定の権限を admin ユーザーは持っていません。
- **root 以外の管理用ユーザーは専用にしてください**：パスワード変更を Operator に反映できなかったり、権限を失ったりして運用管理ができなくなる事態を避けるため、root 以外の管理用ユーザーはほかの用途に使用しないことを推奨します。

### 認証情報を渡す二つの方法 {#two-credential-delivery-methods}

DorisDisaggregatedCluster リソースでは、次の二つの方法で認証情報を設定できます。各シナリオでいずれかを選択してください。

| 設定方法 | 使用するフィールド | 仕組み |
|---------|---------|---------|
| 環境変数 | `.spec.adminUser` | Operator がユーザー名とパスワードをコンテナの環境変数に自動変換し、コンテナ内の補助サービスが読み取る |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator が Basic Authentication Secret をコンテナ内の指定された場所にファイルとしてマウントし、コンテナ内の補助サービスが解析する |

## シナリオ 1：デプロイ時に root ユーザーのパスワードを初期設定する {#scenario-1-initialize-the-root-user-password-during-deployment}

クラスターの初回デプロイ時に、root を管理用ユーザーとして使用し、初期パスワードを事前に設定できます。Doris は、暗号化した root ユーザーのパスワードを `fe.conf` に設定する方法をサポートしています。これにより、Doris の初回デプロイ時に root のパスワードが設定され、Doris Operator がクラスターノードを自動管理できるようになります。

設定手順の概要：

1. 暗号化した root パスワードを生成する
2. 暗号化したパスワードを `fe.conf` に設定する
3. DorisDisaggregatedCluster に管理用認証情報を設定する（環境変数または Secret を選択）

### ステップ 1：暗号化した root パスワードを生成する {#step-1-generate-the-encrypted-root-password}

Doris は、[FE 設定ファイル](../../../admin-manual/config/fe-config#initial_root_password)で暗号化した root ユーザーのパスワードを設定する方法をサポートしています。暗号化には二段階の SHA-1 暗号化を使用します。コードの実装例を以下に示します。

**Java による実装：**

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

**Golang による実装：**

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

### ステップ 2：暗号化したパスワードを fe.conf に設定する {#step-2-configure-the-encrypted-password-in-feconf}

前のステップで暗号化したパスワードを、設定ファイルの要件に従って `fe.conf` に設定します。[FE の起動パラメーター設定](config-fe#custom-startup-configuration)の説明に従い、設定ファイルを `ConfigMap` として Kubernetes クラスターに渡します。

### ステップ 3：DorisDisaggregatedCluster に管理用認証情報を設定する {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster}

設定ファイルで root の初期パスワードを指定すると、最初の Doris FE ノードの起動時にそのパスワードが直ちに有効になります。後続のノードがクラスターに参加する際、Doris Operator は root のユーザー名とパスワードを使用してノードを追加します。そのため、Doris Operator がクラスターノードを管理できるよう、デプロイする DorisDisaggregatedCluster リソースにユーザー名とパスワードを指定する必要があります。

以下のいずれかの方法で設定してください。

#### 方法 A：環境変数による設定 {#method-a-environment-variable-configuration}

DorisDisaggregatedCluster リソースの `.spec.adminUser.name` と `.spec.adminUser.password` フィールドに、root のユーザー名とパスワードを設定します。Doris Operator はこれらをコンテナの環境変数に自動変換し、コンテナ内の補助サービスがその環境変数を使用してノードをクラスターに追加します。設定形式は次のとおりです。

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

`${password}` には、暗号化していない root のパスワードを指定します。

#### 方法 B：Secret による設定 {#method-b-secret-configuration}

Doris Operator は、ノード管理用のユーザー名とパスワードを [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) で指定する方法をサポートしています。Doris Operator は Secret をコンテナ内の指定された場所にファイルとして自動マウントします。コンテナ内の補助サービスがそのファイルからユーザー名とパスワードを読み取り、ノードをクラスターに自動追加します。Basic Authentication Secret の stringData には、username と password の二つのフィールドのみを含めます。

**ステップ 1：Secret を作成してデプロイする**

使用する Basic Authentication Secret を次の形式で設定します。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: root
  password: "${password}"
```

`${password}` には、root に設定した暗号化されていないパスワードを指定します。

次のコマンドで Secret を Kubernetes クラスターにデプロイします。

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster リソースをデプロイする名前空間 |
| `${secretFileName}` | デプロイする Secret のファイル名 |

**ステップ 2：DorisDisaggregatedCluster から Secret を参照する**

デプロイする DorisDisaggregatedCluster リソースで、使用する Secret を指定します。設定は次のとおりです。

```yaml
spec:
    authSecret: ${secretName}
```

`${secretName}` は、root のユーザー名とパスワードを含む Secret の名前です。

## シナリオ 2：デプロイ時に root 以外の管理用ユーザーを自動作成する（推奨） {#scenario-2-automatically-create-a-non-root-management-user-during-deployment-recommended}

クラスターの初回デプロイ時に、Operator に root 以外の専用管理用ユーザーを自動作成させることができます。初回デプロイ時に root の初期パスワードを設定しない場合は、環境変数または Secret を使用して、root 以外のユーザーとログインパスワードを設定できます。Doris コンテナ内の補助サービスが Doris にそのユーザーを自動作成し、パスワードを設定して Node_priv 権限を付与します。その後、Doris Operator は自動作成されたユーザー名とパスワードを使用してクラスターノードを管理します。

以下のいずれかの方法で設定してください。

### 方法 A：環境変数による設定 {#method-a-environment-variable-configuration-1}

デプロイする DorisDisaggregatedCluster リソースを次の形式で設定します。

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 管理権限を持つユーザーとして作成するユーザー名 |
| `${DB_ADMIN_PASSWD}` | 新しいユーザーのパスワード |

### 方法 B：Secret による設定 {#method-b-secret-configuration-1}

**ステップ 1：Secret を作成してデプロイする**

使用する Basic Authentication Secret を次の形式で設定します。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: ${DB_ADMIN_USER}
  password: "${DB_ADMIN_PASSWD}"
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成するユーザー名 |
| `${DB_ADMIN_PASSWD}` | 新しく作成するユーザーに設定するパスワード |

次のコマンドで Secret を Kubernetes クラスターにデプロイします。

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster リソースをデプロイする名前空間 |
| `${secretFileName}` | デプロイする Secret のファイル名 |

**ステップ 2：DorisDisaggregatedCluster から Secret を参照する**

DorisDisaggregatedCluster リソースで、使用する Secret を次のように指定します。

```yaml
spec:
    authSecret: ${secretName}
```

`${secretName}` は、デプロイした Basic Authentication Secret の名前です。

:::tip ヒント
デプロイ後に root のパスワードを設定してください。Doris Operator は、新しいユーザーとパスワードを使用してクラスターノードを管理するようになります。新しく作成したユーザーは削除しないでください。
:::

## シナリオ 3：クラスターのデプロイ後に root ユーザーのパスワードを設定する {#scenario-3-set-the-root-user-password-after-the-cluster-is-deployed}

Doris クラスターのデプロイ後も root ユーザーのパスワードが設定されていない場合、Doris Operator がクラスターノードを自動管理できるよう、[Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 権限を持つユーザーを設定する必要があります。root ユーザーの使用は推奨しません。[ユーザーの作成と権限付与](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照して新しいユーザーを作成し、Node_priv 権限を付与してください。ユーザーの作成後、環境変数または Secret を使用して新しい管理用ユーザーとパスワードを設定し、DorisDisaggregatedCluster リソースに反映します。

設定手順の概要：

1. MySQL プロトコルを使用して、Node_priv 権限を付与するユーザーを作成する
2. 新しいユーザーに Node_priv 権限を付与する
3. DorisDisaggregatedCluster に管理用認証情報を設定する（環境変数または Secret を選択）

### ステップ 1：Node_priv 権限を付与するユーザーを作成する {#step-1-create-a-user-with-the-node_priv-privilege}

MySQL プロトコルでデータベースに接続した後、次のコマンドでユーザーを作成し、パスワードを設定します。

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 作成するユーザー名 |
| `${DB_ADMIN_PASSWD}` | 設定するパスワード |

### ステップ 2：新しいユーザーに Node_priv 権限を付与する {#step-2-grant-the-node_priv-privilege-to-the-new-user}

MySQL プロトコルでデータベースに接続した後、次のコマンドを実行して新しいユーザーに Node_priv 権限を付与します。

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

`${DB_ADMIN_USER}` は、新しく作成したユーザー名です。

ユーザーの作成、パスワードの設定、権限の付与について詳しくは、公式の [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) ドキュメントを参照してください。

### ステップ 3：DorisDisaggregatedCluster に管理用認証情報を設定する {#step-3-configure-management-credentials-in-dorisdisaggregatedcluster-1}

以下のいずれかの方法で設定してください。

#### 方法 A：環境変数による設定 {#method-a-environment-variable-configuration-2}

DorisDisaggregatedCluster リソースに、新しく作成したユーザーとパスワードを次の形式で設定します。

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成したユーザー名 |
| `${DB_ADMIN_PASSWD}` | 新しく作成したユーザーに設定したパスワード |

#### 方法 B：Secret による設定 {#method-b-secret-configuration-2}

**ステップ 1：Secret を作成してデプロイする**

次の形式で Basic Authentication Secret を作成します。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
type: kubernetes.io/basic-auth
stringData:
  username: ${DB_ADMIN_USER}
  password: "${DB_ADMIN_PASSWD}"
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成したユーザー名 |
| `${DB_ADMIN_PASSWD}` | 新しく作成したユーザーに設定したパスワード |

次のコマンドで Secret を Kubernetes クラスターにデプロイします。

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | DorisDisaggregatedCluster リソースをデプロイする名前空間 |
| `${secretFileName}` | デプロイする Secret のファイル名 |

**ステップ 2：DorisDisaggregatedCluster から Secret を参照する**

DorisDisaggregatedCluster リソースで、使用する Secret を次のように指定します。

```yaml
spec:
    authSecret: ${secretName}
```

`${secretName}` は、デプロイした Basic Authentication Secret の名前です。

:::tip ヒント
CR の `spec.authSecret` の参照先や `spec.adminUser` を変更すると、対象の Pod テンプレートが変わり、ローリングアップデートが発生する場合があります。データベースのパスワード、または同じ名前の Secret の内容だけを変更しても、ローリング再起動が行われるとは限りません。FE SQL を介して登録する BE の起動スクリプトは、起動時に Secret を変数に読み込み、登録の再試行中には読み直しません。認証情報を修正して FE にログインできることを確認した後も、古い認証情報が原因で登録に失敗する BE Pod がある場合は、それらを一つずつ再作成してください。`SHOW BACKENDS` を使用して、各ノードが参加し、`Alive` フィールドが `true` であることを確認します。トラブルシューティングの手順については、[authSecret の問題](../doris-operator/status-and-troubleshooting.md#authsecret-problems)を参照してください。
:::

## Kerberos 認証ファイルのマウント {#mounting-kerberos-authentication-files}

このセクションでは、Kubernetes 環境で Doris のストレージとコンピュートを分離したクラスターに Kerberos 認証ファイルをマウントする方法を説明します。設定後、Kerberos 認証に必要な `krb5.conf` 設定ファイルと `keytab` キーファイルが Doris コンテナにマウントされます。[Hive Catalog](../../../lakehouse/catalogs/hive-catalog) などの機能でこれらを使用すると、Doris は Kerberos 認証が有効な Hive やその他の外部データソースに接続できます。

:::caution 注意
ここで説明するのは、Kerberos を使用して Doris クラスターにアクセスする方法ではありません。マウント後、Doris はこれらの Kerberos ファイルを使用して、HDFS などの外部データソースにアクセスできます。
:::

### 前提条件 {#prerequisites}

- Doris Operator 25.5.1 以降
- Doris のストレージとコンピュートを分離したクラスター 2.1.10 または 3.0.6 以降

### 必要なファイル {#required-files}

| ファイル | 説明 |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Kerberos 設定ファイル |
| [keytab ファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | Kerberos プリンシパルと暗号化キーを含むファイル |

### ステップ 1：krb5.conf を保存する ConfigMap を作成する {#step-1-create-a-configmap-to-store-krb5conf}

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする名前空間 |
| `${name}` | ConfigMap の名前 |

### ステップ 2：keytab ファイルを保存する Secret を作成する {#step-2-create-a-secret-to-store-the-keytab-file}

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする名前空間 |
| `${name}` | Secret の名前 |
| `${xxx.keytab}` | keytab ファイル名 |

:::tip ヒント
複数の `keytab` ファイルをマウントする必要がある場合は、[kubectl create secret のドキュメント](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)を参照し、複数の `keytab` ファイルを一つの Secret に格納してください。
:::

### ステップ 3：DorisDisaggregatedCluster に Kerberos 情報を設定する {#step-3-configure-kerberos-information-in-dorisdisaggregatedcluster}

```yaml
spec:
    kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
```

| パラメーター | 説明 |
|------|------|
| `${krb5ConfigMapName}` | `krb5.conf` ファイルを含む ConfigMap の名前 |
| `${keytabSecretName}` | keytab ファイルを含む Secret の名前 |
| `${keytabPath}` | コンテナ内で keytab ファイルをマウントするパス |

### ステップ 4：Hive Catalog で Kerberos 認証を使用する {#step-4-use-kerberos-authentication-in-hive-catalog}

Kerberos の設定後、Hive Catalog の作成時に Kerberos 認証を有効にできます。具体的な設定については、[Hive Catalog の設定ドキュメント](../../../lakehouse/catalogs/hive-catalog.mdx#configuring-catalog)を参照してください。
