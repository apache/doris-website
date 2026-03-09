---
{
  "title": "Config クラスター",
  "language": "ja",
  "description": "分散コンピュート・ストレージクラスターでは、特定の構成がクラスターレベルで適用されます、"
}
---
分離されたコンピュート・ストレージクラスターでは、さまざまなコンポーネントのノードを管理するために管理システムが使用する認証情報など、特定の設定がクラスターレベルで適用されます。

## 管理ユーザー名とパスワードの設定
Dorisノードを管理するには、MySQLプロトコルを介してユーザー名とパスワードを使用してライブのFrontend（FE）ノードに接続する必要があります。Dorisは[ロールベースアクセス制御（RBAC）に類似した認可メカニズム](../../../admin-manual/auth/authentication-and-authorization)を実装しており、ノード管理操作には[Node_priv](../../../admin-manual/auth/authentication-and-authorization#Types-of-Permissions)権限を持つユーザーアカウントが必要です。

デフォルトでは、Doris Operatorは、DorisDisaggregatedClusterリソースで定義されたクラスターのデプロイと管理にrootユーザー（完全な権限を持ち、パスワードなし）を使用します。rootアカウントにパスワードが割り当てられると、DorisDisaggregatedClusterリソースでNode_priv権限を持つユーザー名とパスワードを明示的に設定して、Doris Operatorが自動管理タスクを継続して実行できるようにする必要があります。

パスワード設定方法に関係なく、以下の点にご注意ください：
- rootやadminなどの既存ユーザーのパスワードは、いかなる状況においてもoperatorによって自動的に変更されることはありません。ユーザーが手動で設定または変更する必要があります。
- operatorの管理ユーザーとしてadminユーザーを使用することは強く推奨されません。adminユーザーは通常、データベースの最高読み書き権限を持つユーザーとして使用され、クラスターメンテナンス用ではありません。adminユーザーはoperatorの特定機能に対する特定の権限を持ちません。
- 非rootユーザーは、本来の目的のためにのみ使用し、他の用途には使用しないでください。これは、パスワード変更がoperatorと同期に失敗したり、権限が失われて運用障害が発生したりすることを避けるためです。

DorisDisaggregatedClusterリソースは、クラスターノードの管理に必要な認証情報を設定する2つの方法をサポートしています：環境変数の使用、またはKubernetes Secretの使用。デプロイメントシナリオに応じて、管理認証情報は以下の方法で設定できます：

- クラスターデプロイメント中にrootユーザーのパスワードを初期化する

- パスワードなしrootデプロイメントで管理権限を持つ非rootユーザーを自動作成する

- パスワードなしrootモードを使用してクラスターがデプロイされた後にrootユーザーにパスワードを割り当てる

### クラスターデプロイメント中のrootユーザーパスワードの設定
Dorisは`fe.conf`ファイル内で暗号化形式でrootユーザーパスワードを指定することをサポートしています。初期デプロイメント中にDoris Operatorがクラスターノードを自動管理できるようにするには、以下の手順に従ってrootパスワードを設定してください。

#### ステップ1：暗号化rootパスワードの生成
Dorisでは、暗号化形式を使用して[FE設定ファイル](../../../admin-manual/config/fe-config#initial_root_password)でrootユーザーパスワードを設定できます。パスワードは2段階SHA-1ハッシュアルゴリズムを使用して暗号化されます。以下は、この暗号化を実行する方法を示すコード例です：

**Java実装：**

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
**Golang実装:**

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
生成された暗号化パスワードを必要に応じてfe.confファイルに追加します。次に、[FE起動設定セクション](config-fe.md#custom-startup-configuration)の手順に従って、`ConfigMap`を使用してKubernetesクラスターに設定ファイルを配信します。

#### ステップ2: DorisDisaggregatedClusterリソースの定義
初期パスワードが`fe.conf`ファイルに設定されると、最初のDoris FEノードが起動した際にrootパスワードが即座に有効になります。追加のノードがクラスターに参加する際、Doris Operatorはroot認証情報を使用してこれらのノードを管理および追加します。したがって、`DorisDisaggregatedCluster`リソースでrootユーザー名とパスワードを提供する必要があります。

**オプション1: 環境変数の使用**  
`DorisDisaggregatedCluster`リソースの`.spec.adminUser.name`および`.spec.adminUser.password`フィールドでroot認証情報を指定します。Doris Operatorは自動的にこれらの値をコンテナ環境変数に変換します。コンテナ内の補助サービスは、これらの環境変数を使用してノードをクラスターに追加します。
設定例:

```yaml
spec:
  adminUser:
    name: root
    password: ${password}
```
ここで、`${password}` は root ユーザーの平文（暗号化されていない）パスワードである必要があります。

**オプション 2: Secret の使用**  
Doris Operator は [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) を使用して root ユーザー名とパスワードを提供することもサポートしています。Doris Operator はこの Secret をファイルとしてコンテナにマウントし、補助サービスがそれを解析して認証情報を取得し、クラスターにノードを自動的に追加するために使用します。

Secret は正確に2つのフィールドを含む必要があります：`username` と `password`。

1. Secret の定義  
   以下の形式で Basic Authentication Secret を作成します：

    ```yaml
    stringData:
      username: root
      password: ${password}
    ```
`${password}`は root ユーザーのプレーンテキストパスワードです。  
   以下のコマンドを使用して Kubernetes クラスターに Secret をデプロイしてください：

    ```yaml
    kubectl -n ${namespace} apply -f ${secretFileName}.yaml
    ```
`${namespace}`: DorisDisaggregatedClusterがデプロイされるターゲット名前空間。  
   `${secretFileName}`: Secret定義を含むYAMLファイルの名前

2. DorisDisaggregatedClusterリソースを設定する  
   `spec.authSecret`フィールドを使用して`DorisDisaggregatedCluster`リソース内でSecretを参照します：

    ```yaml
    spec:
      authSecret: ${secretName}
    ```
ここで、`${secretName}` はルートユーザー認証情報を含むKubernetes Secretの名前です。

### デプロイメント時の非ルート管理ユーザーとパスワードの自動作成（推奨）
初回デプロイメント時にルートユーザーの初期パスワードを設定しない場合、環境変数またはKubernetes Secretを使用して非ルート管理ユーザーとそのパスワードを設定できます。コンテナ内のDorisの補助サービスが自動的にこのユーザーをDoris内に作成し、指定されたパスワードを割り当て、`Node_priv`権限を付与します。その後、Doris Operatorはこの自動作成されたユーザーアカウントを使用してクラスターノードを管理します。

#### オプション1：環境変数の使用
以下に示すように`DorisDisaggregatedCluster`リソースを定義します：

```yaml
spec:
  adminUser:
    name: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
```
`${DB_ADMIN_USER}`: 管理者権限を持つ新しい非rootユーザーの名前。`${DB_ADMIN_PASSWD}`: 新しいユーザーに割り当てるパスワード。

#### オプション2: Secretを使用する
a. 必要なSecretを作成する  
以下の形式を使用してBasic Authentication Secretを定義します：

```yaml
stringData:
  username: ${DB_ADMIN_USER}
  password: ${DB_ADMIN_PASSWD}
```
`${DB_ADMIN_USER}`: 新しい管理ユーザーのユーザー名。`${DB_ADMIN_PASSWD}`: 新しいユーザーに割り当てるパスワード。
次を使用してKubernetesクラスターにSecretをデプロイします:

```shell
kubectl -n ${namespace} apply -f ${secretFileName}.yaml
```
`${namespace}`: DorisDisaggregatedClusterリソースがデプロイされるnamespace。`${secretFileName}`: Secretを定義するYAMLファイルの名前。

b. DorisDisaggregatedClusterリソースの更新  
`DorisDisaggregatedCluster`リソースでSecretを指定します：

```yaml
spec:
  authSecret: ${secretName}
```
`${secretName}`: 非rootの管理ユーザー認証情報を含むSecretの名前。

:::tip Note
デプロイ後は、rootユーザーにパスワードを設定することを推奨します。これが完了すると、Doris Operatorは新しい非rootユーザーを使用してクラスターノードの管理に切り替わります。このユーザーが作成された後は削除しないでください。
:::

### クラスターデプロイ後のRootユーザーパスワード設定
初期デプロイ時にrootユーザーパスワードが設定されていない場合、Doris Operatorがクラスターノードを自動的に管理し続けるために、[Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions)権限を持つユーザーを提供する必要があります。この目的でrootユーザーを使用することは推奨されません。代わりに、[ユーザー作成と権限割り当てドキュメント](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照して新しいユーザーを作成し、必要な権限を割り当ててください。ユーザー作成後、環境変数またはKubernetes Secretを使用して認証情報を設定し、`DorisDisaggregatedCluster`リソースを適切に更新してください。

#### ステップ1: Node_priv権限を持つユーザーの作成
MySQLプロトコルを使用してデータベースに接続し、以下のSQLコマンドを実行して新しいユーザーを作成し、パスワードを割り当てます：

```sql
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```
`${DB_ADMIN_USER}`: 作成するユーザーの名前。`${DB_ADMIN_PASSWD}`: 新しいユーザーのパスワード。

#### Step 2: ユーザーにNode_priv権限を付与する
MySQLプロトコル経由で接続したまま、以下のコマンドを実行して`Node_priv`権限を付与します：

```sql
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
詳細なユーザー作成と権限割り当てについては、公式の[CREATE USER documentation](../../../sql-manual/sql-statements/account-management/CREATE-USER)を参照してください。

#### Step 3: DorisDisaggregatedCluster Resourceの更新
- Option 1: 環境変数の使用  
  DorisDisaggregatedCluster resourceで新しく作成したユーザーとパスワードを指定します：

    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```
`${DB_ADMIN_USER}`: 新しい管理ユーザーの名前。`${DB_ADMIN_PASSWD}`: 対応するパスワード。

- オプション2: Secretを使用する  
  a. Secretを定義する  
  以下の形式でBasic Authentication Secretを作成します:

    ```yaml
    stringData:
      username: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
    ```
次のコマンドを使用してSecretをKubernetesクラスターにデプロイしてください：

    ```shell
    kubectl -n ${namespace} apply -f ${secretFileName}.yaml
    ```
`${namespace}`: DorisDisaggregatedClusterリソースがデプロイされているnamespace。`${secretFileName}`: Secret定義ファイルの名前。

  b. DorisDisaggregatedClusterリソースの更新  
  リソース設定でSecretを参照します：

    ```yaml
    spec:
      authSecret: ${secretName}
    ```
`${secretName}`: ユーザー認証情報を含むSecretの名前。

:::tip Note
- rootパスワードを設定し、ノード管理権限を持つ新しいユーザーを指定した後、Doris Operatorはクラスター内の既存のサービスのローリング再起動をトリガーします。
  :::


## Kerberos認証の使用
Doris Operatorは、バージョン25.5.1以降、Kubernetes上のDoris（バージョン2.1.10、3.0.6以降）に対してKerberos認証をサポートしています。DorisでKerberos認証を有効にするには、[krb5.confファイル](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)と[keytabファイル](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html)の両方が必要です。
Doris Operatorは、ConfigMapリソースを使用してkrb5.confファイルをマウントし、Secretリソースを使用してkeytabファイルをマウントします。Kerberos認証を有効にするためのワークフローは以下の通りです：

1. krb5.confファイルを含むConfigMapを作成する：

    ```shell
    kubectl create -n ${namespace} configmap ${name} --from-file=krb5.conf
    ```
`${namespace}` を DorisDisaggregatedCluster がデプロイされている namespace に、`${name}` を ConfigMap の希望する名前に置き換えてください。
2. keytab ファイルを含む Secret を作成します：

    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file=${xxx.keytab}
    ```
`${namespace}` を DorisDisaggregatedCluster がデプロイされている namespace に、`${name}` を Secret の希望する名前に置き換えてください。複数の keytab ファイルをマウントする必要がある場合は、[kubectl create Secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) を参照して、それらを単一の Secret に含めてください。
3. krb5.conf を含む ConfigMap と keytab ファイルを含む Secret を指定するために DorisDisaggregatedCluster リソースを設定します：

    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
`${krb5ConfigMapName}`: krb5.confファイルを含むConfigMapの名前。`${keytabSecretName}`: keytabファイルを含むSecretの名前。`${keytabPath}`: Secretがkeytabファイルをマウントするコンテナ内のディレクトリパス。このパスは、カタログ作成時にhadoop.kerberos.keytabで指定するディレクトリと一致している必要があります。カタログ設定の詳細については、[Hive Catalog configuration](../../../lakehouse/catalogs/hive-catalog.mdx)のドキュメントを参照してください。
