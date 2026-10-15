---
{
    "title": "認証の設定",
    "language": "ja",
    "description": "ストレージとコンピューティングを分離したクラスターにおける、環境変数と Secret という二つのクラスターレベルの設定方法、および三つのパスワード設定シナリオの手順と Kerberos 認証の設定について詳しく説明します。",
    "keywords": ["Doris", "ストレージとコンピューティングの分離", "Kubernetes", "ユーザー名とパスワード", "Secret", "Kerberos", "認証", "Node_priv"]
}
---

## この章で学ぶこと

- Doris Operator がクラスターノードを管理するために必要な認証の仕組みを理解する
- 環境変数または Secret を使用して管理用認証情報を設定する
- デプロイ前、デプロイ中、デプロイ後の三つの段階でユーザー名とパスワードを適切に設定する
- ストレージとコンピューティングを分離したクラスターに Kerberos 認証を設定する

## 設定の原則とシナリオの選択

### 管理用認証情報が必要な理由

Doris ノードを管理するには、ユーザー名とパスワードを使用して MySQL プロトコルで稼働中の FE ノードに接続する必要があります。Doris は [RBAC に類似した権限管理の仕組み](../../../admin-manual/auth/authentication-and-authorization)を実装しており、ノード管理にはユーザーに [Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 権限が必要です。

デフォルトでは、Doris Operator は、すべての権限を持ちパスワードが設定されていない root ユーザーを使用して、DorisDisaggregatedCluster リソースで設定されたクラスターをデプロイおよび管理します。root ユーザーにパスワードを設定した後は、Doris Operator がクラスターの管理操作を自動化できるように、DorisDisaggregatedCluster リソースで Node_priv 権限を持つユーザー名とパスワードを明示的に設定する必要があります。

### 三つのパスワード設定シナリオの比較

クラスターの段階と管理要件に応じて、次の三つの設定シナリオがあります。以下の表を参考に選択してください。

| シナリオ | 使用するタイミング | 操作の複雑さ | コードによる暗号化が必要か |
|------|---------|-----------|-----------------|
| シナリオ 1：デプロイ中に root のパスワードを初期化する | クラスターの初回デプロイ時 | 中 | はい（二段階の SHA-1 暗号化） |
| シナリオ 2：デプロイ中に root 以外の管理ユーザーを自動作成する（推奨） | クラスターの初回デプロイ時 | 低 | いいえ |
| シナリオ 3：デプロイ後に root のパスワードを設定する | クラスターがすでに稼働している場合 | 高 | いいえ |

### 一般的な設定の原則

どのシナリオでパスワードを設定する場合でも、次の点に注意してください。

- **既存ユーザーのパスワードは自動的に変更されない**：root や admin などの既存ユーザーについて、Operator がパスワードを自動的に変更することはありません。設定や変更は自分で行う必要があります。
- **admin ユーザーを管理ユーザーとして使用することは推奨されない**：admin ユーザーは通常、クラスターの運用保守ではなく、データベースの読み書き操作を行う最高権限のユーザーとして使用されます。admin ユーザーには、Operator の一部の機能に必要な特定の権限がありません。
- **root 以外の管理ユーザーは専用にする**：パスワードの変更を Operator に反映できなかったり、権限を失ったりして運用保守に支障が出ることを避けるため、root 以外の管理ユーザーは単一の用途に限定し、ほかの用途には使用しないことを推奨します。

### 認証情報を渡す二つの方法

DorisDisaggregatedCluster リソースは、次の二つの認証情報設定方法に対応しています。各シナリオでどちらか一方を選択できます。

| 設定方法 | 使用するフィールド | 仕組み |
|---------|---------|---------|
| 環境変数 | `.spec.adminUser` | Operator がユーザー名とパスワードをコンテナーの環境変数に自動変換し、コンテナー内の補助サービスが読み取ります |
| [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) | `.spec.authSecret` | Operator が Basic Authentication Secret をコンテナー内の指定された場所にファイルとしてマウントし、コンテナー内の補助サービスが解析します |

## シナリオ 1：デプロイ中に root ユーザーのパスワードを初期化する

クラスターを初めてデプロイするときに、root を管理ユーザーとして使用し、初期パスワードをあらかじめ設定する場合があります。Doris では、`fe.conf` に root ユーザーのパスワードを暗号化した形式で設定できます。これにより、Doris の初回デプロイ時に root ユーザーのパスワードが設定され、Doris Operator がクラスターノードを自動管理できるようになります。

設定手順の概要：

1. 暗号化した root パスワードを生成する
2. 暗号化したパスワードを `fe.conf` に設定する
3. DorisDisaggregatedCluster に管理用認証情報を設定する（環境変数または Secret を選択）

### ステップ 1：暗号化した root パスワードを生成する

Doris では、[FE 設定ファイル](../../../admin-manual/config/fe-config#initial_root_password)に root ユーザーのパスワードを暗号化した形式で設定できます。暗号化には二段階の SHA-1 暗号化を使用します。以下に実装例を示します。

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

### ステップ 2：暗号化したパスワードを fe.conf に設定する

設定ファイルの要件に従って、前のステップで暗号化したパスワードを `fe.conf` に設定します。[FE 起動パラメーターの設定](config-fe#custom-startup-configuration)の手順に従い、設定ファイルを `ConfigMap` として Kubernetes クラスターに適用します。

### ステップ 3：DorisDisaggregatedCluster に管理用認証情報を設定する

設定ファイルで root の初期パスワードを設定すると、最初の Doris FE ノードの起動時にそのパスワードが直ちに有効になります。後続のノードがクラスターに参加するとき、Doris Operator は root のユーザー名とパスワードを使用してノードを追加します。そのため、Doris Operator がクラスターノードを管理できるように、デプロイする DorisDisaggregatedCluster リソースにユーザー名とパスワードを指定する必要があります。

次の二つの方法のいずれかを選択して設定します。

#### 方法 A：環境変数による設定

DorisDisaggregatedCluster リソースの `.spec.adminUser.name` フィールドと `.spec.adminUser.password` フィールドに、root のユーザー名とパスワードを設定します。Doris Operator はこれらの設定をコンテナーの環境変数に自動変換し、コンテナー内の補助サービスがその環境変数を使用してノードをクラスターに追加します。設定形式は次のとおりです。

```yaml
spec:
    adminUser:
        name: root
        password: ${password}
```

ここで、`${password}` は root の暗号化されていないパスワードです。

#### 方法 B：Secret による設定

Doris Operator では、[Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) を使用して、ノードの管理に使用するユーザー名とパスワードを指定できます。Doris Operator は Secret をコンテナー内の指定された場所にファイルとして自動的にマウントします。コンテナー内の補助サービスはそのファイルからユーザー名とパスワードを解析し、ノードをクラスターに自動的に追加します。Basic Authentication Secret の stringData には、username と password の二つのフィールドだけを指定します。

**ステップ 1：Secret を作成して適用する**

使用する Basic Authentication Secret を次の形式で設定します。

```yaml
stringData:
    username: root
    password: ${password}
```

ここで、`${password}` は root に設定した暗号化されていないパスワードです。

次のコマンドで Secret を Kubernetes クラスターに適用します。

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

ここで、`${secretName}` は root のユーザー名とパスワードを含む Secret の名前です。

## シナリオ 2：デプロイ中に root 以外の管理ユーザーを自動作成する（推奨）

クラスターを初めてデプロイするときに、Operator に root 以外の専用管理ユーザーを自動作成させる場合があります。初回デプロイ時に root の初期パスワードが設定されていなければ、環境変数または Secret を使用して root 以外のユーザーとログインパスワードを設定できます。Doris コンテナーの補助サービスは、そのユーザーを Doris に自動作成し、パスワードを設定して Node_priv 権限を付与します。その後、Doris Operator は自動作成したユーザー名とパスワードを使用してクラスターノードを管理します。

次の二つの方法のいずれかを選択して設定します。

### 方法 A：環境変数による設定

デプロイする DorisDisaggregatedCluster リソースを次の形式で設定します。

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 管理権限を付与して作成するユーザーの名前 |
| `${DB_ADMIN_PASSWD}` | 新しいユーザーのパスワード |

### 方法 B：Secret による設定

**ステップ 1：Secret を作成して適用する**

使用する Basic Authentication Secret を次の形式で設定します。

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成するユーザーの名前 |
| `${DB_ADMIN_PASSWD}` | 新しく作成するユーザーに設定するパスワード |

次のコマンドで Secret を Kubernetes クラスターに適用します。

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

ここで、`${secretName}` は適用した Basic Authentication Secret の名前です。

:::tip Tip
デプロイ後に root のパスワードを設定してください。Doris Operator は新しいユーザー名とパスワードを使用してクラスターノードを管理するように切り替わります。新しく作成したユーザーを削除しないでください。
:::

## シナリオ 3：クラスターのデプロイ後に root ユーザーのパスワードを設定する

Doris クラスターのデプロイ後に root ユーザーのパスワードが設定されていない場合は、Doris Operator がクラスターノードを自動管理できるように、[Node_priv](../../../admin-manual/auth/authentication-and-authorization#types-of-permissions) 権限を持つユーザーを設定する必要があります。root ユーザーの使用は推奨されません。[ユーザーの作成と権限の付与](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照して、新しいユーザーを作成し、Node_priv 権限を付与してください。ユーザーを作成した後、環境変数または Secret を使用して新しい管理ユーザーとパスワードを設定し、DorisDisaggregatedCluster リソースに指定します。

設定手順の概要：

1. MySQL プロトコルを使用して Node_priv 権限を持つユーザーを作成する
2. 新しいユーザーに Node_priv 権限を付与する
3. DorisDisaggregatedCluster に管理用認証情報を設定する（環境変数または Secret を選択）

### ステップ 1：Node_priv 権限を持つユーザーを作成する

MySQL プロトコルでデータベースに接続した後、次のコマンドでユーザーを作成してパスワードを設定します。

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 作成するユーザーの名前 |
| `${DB_ADMIN_PASSWD}` | 設定するパスワード |

### ステップ 2：新しいユーザーに Node_priv 権限を付与する

MySQL プロトコルでデータベースに接続した後、次のコマンドを実行して新しいユーザーに Node_priv 権限を付与します。

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

ここで、`${DB_ADMIN_USER}` は新しく作成したユーザーの名前です。

ユーザーの作成、パスワードの設定、権限の付与について詳しくは、公式の [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) ドキュメントを参照してください。

### ステップ 3：DorisDisaggregatedCluster に管理用認証情報を設定する

次の二つの方法のいずれかを選択して設定します。

#### 方法 A：環境変数による設定

新しく作成したユーザーとパスワードを、DorisDisaggregatedCluster リソースに次の形式で設定します。

```yaml
spec:
    adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成したユーザーの名前 |
| `${DB_ADMIN_PASSWD}` | 新しく作成したユーザーに設定したパスワード |

#### 方法 B：Secret による設定

**ステップ 1：Secret を作成して適用する**

Basic Authentication Secret を次の形式で作成します。

```yaml
stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```

| パラメーター | 説明 |
|------|------|
| `${DB_ADMIN_USER}` | 新しく作成したユーザーの名前 |
| `${DB_ADMIN_PASSWD}` | 新しく作成したユーザーに設定したパスワード |

次のコマンドで Secret を Kubernetes クラスターに適用します。

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

ここで、`${secretName}` は適用した Basic Authentication Secret の名前です。

:::tip Tip
デプロイ後に root のパスワードを設定し、ノード管理権限を持つ新しいユーザー名とパスワードを設定すると、既存のサービスでローリング再起動が一度発生します。
:::

## Kerberos 認証ファイルのマウント

このセクションでは、Kubernetes 環境でストレージとコンピューティングを分離した Doris クラスターに Kerberos 認証ファイルをマウントする方法を説明します。設定すると、Kerberos 認証に必要な `krb5.conf` 設定ファイルと `keytab` キーファイルが Doris コンテナーにマウントされ、[Hive Catalog](../../../lakehouse/catalogs/hive-catalog) などの機能から利用できます。これにより、Doris は Kerberos 認証が有効な Hive やその他の外部データソースに接続できます。

:::caution Note
これは Kerberos を使用して Doris クラスターにアクセスするための設定ではありません。マウント後、Doris はこれらの Kerberos ファイルを使用して、HDFS などの外部データソースにアクセスできます。
:::

### 前提条件

- Doris Operator 25.5.1 以降
- ストレージとコンピューティングを分離した Doris クラスター 2.1.10 または 3.0.6 以降

### 必要なファイル

| ファイル | 説明 |
|------|------|
| [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) | Kerberos 設定ファイル |
| [keytab ファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) | Kerberos プリンシパルと暗号化キーを含むファイル |

### ステップ 1：krb5.conf を格納する ConfigMap を作成する

```shell
kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする名前空間 |
| `${name}` | ConfigMap の名前 |

### ステップ 2：keytab ファイルを格納する Secret を作成する

```shell
kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
```

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする名前空間 |
| `${name}` | Secret の名前 |
| `${xxx.keytab}` | keytab ファイル名 |

:::tip Tip
複数の `keytab` ファイルをマウントする必要がある場合は、[kubectl create secret のドキュメント](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)を参照し、複数の `keytab` ファイルを一つの Secret に格納してください。
:::

### ステップ 3：DorisDisaggregatedCluster に Kerberos の情報を設定する

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
| `${keytabPath}` | コンテナー内で keytab ファイルをマウントするパス |

### ステップ 4：Hive Catalog で Kerberos 認証を使用する

Kerberos を設定すると、Hive Catalog を作成する際に Kerberos 認証を有効にできます。具体的な設定については、[Hive Catalog の設定ドキュメント](../../../lakehouse/catalogs/hive-catalog#配置-catalog)を参照してください。
