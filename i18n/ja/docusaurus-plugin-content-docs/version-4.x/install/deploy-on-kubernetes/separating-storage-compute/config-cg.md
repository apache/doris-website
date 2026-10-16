---
{
    "title": "コンピュートグループの設定",
    "language": "ja",
    "description": "レプリカ、複数のコンピュートグループ、リソース、アクセス方式、起動パラメータ、永続ストレージの設定を含む、コンピュートグループの詳細な設定ガイドです。",
    "keywords": ["Doris", "ストレージとコンピュートの分離", "Kubernetes", "コンピュートグループ", "BE", "NodePort", "LoadBalancer", "永続ストレージ", "ConfigMap"]
}
---

コンピュートグループは、同じタスクを処理する BE ノードの集合です。このドキュメントでは、`DorisDisaggregatedCluster` リソースでコンピュートグループを設定する方法をユースケース別に説明します。主に次の内容を扱います。

- **基本的なデプロイ**：単一または複数のコンピュートグループをすばやく設定する方法
- **リソース制御**：CPU やメモリなどのコンピュートリソースを制限する方法
- **アクセス制御**：クラスタの内部または外部から、異なる方式で BE サービスにアクセスする方法
- **起動設定のカスタマイズ**：ConfigMap で BE の起動パラメータをカスタマイズする方法
- **データの永続化**：キャッシュ、ログ、StreamLoad の一時データに使用する永続ストレージ

## シナリオ 1：単一のコンピュートグループをすばやく設定する

### 最小構成

最もシンプルなコンピュートグループの設定に必要なフィールドは、次の 3 つだけです。

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### フィールドの説明

| フィールド | 説明 |
|------|------|
| `uniqueId` | コンピュートグループの一意の識別子であり、グループ名にもなります。設定後は変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` という規則に一致する必要があります |
| `image` | BE サービスのデプロイに使用するイメージのアドレスです。[Apache Doris の公式イメージレジストリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用してください |
| `replicas` | コンピュートグループ内の BE サービスノード数です |

## シナリオ 2：業務を分離するために複数のコンピュートグループをデプロイする

`DorisDisaggregatedCluster` リソースは複数のコンピュートグループのデプロイをサポートし、各グループは互いに独立しています。次の例は、`cg1` と `cg2` という二つのコンピュートグループをデプロイする設定です。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

各コンピュートグループのレプリカ数は次のとおりです。

| コンピュートグループ名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
コンピュートグループは互いに独立していますが、同じストレージとコンピュートを分離したクラスタ内では、すべてのコンピュートグループで同じ BE サービスイメージを使用することを推奨します。
:::

## シナリオ 3：コンピュートグループのコンピュートリソースを制限する

ストレージとコンピュートを分離した構成の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用するコンピュートリソースに制限はありません。`DorisDisaggregatedCluster` では、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使って CPU とメモリのリソースを指定します。

たとえば、`cg1` というコンピュートグループの BE が 8c、8Gi のリソースを使用するように設定する場合は、次のようにします。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```

設定を有効にするには、上記の内容をデプロイ対象の [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映します。

## シナリオ 4：コンピュートグループへのアクセス方式を設定する

デフォルトでは、コンピュートグループはサービスを外部に直接公開しません。Doris Operator は、`DorisDisaggregatedCluster` リソースでコンピュートグループへのアクセス用プロキシとなる Service を提供します。Service は三種類の公開方式をサポートします。アクセス元に適した方式を選択してください。

| アクセス方式 | 適用するシナリオ | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスタ内からのアクセス | デフォルトの方式で、クラスタ内のアドレスを提供します |
| `NodePort` | 自己管理型 Kubernetes クラスタの外部からのアクセス | ホストマシンのポートを介してサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスタの外部からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスタ内からのアクセス）

[ClusterIP アクセス方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は、Kubernetes クラスタ内で使用するアドレスを提供します。このアドレスが Kubernetes 内からサービスにアクセスする際の入口になります。

#### ステップ 1：Service のタイプを ClusterIP に設定する

Doris は Kubernetes 上で ClusterIP アクセス方式をデフォルトで有効にします。追加の設定なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する

クラスタをデプロイした後、次のコマンドでコンピュートグループが公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のとおりです。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上記の結果から、`uniqueId` が `cg1` のコンピュートグループに対応する `doris` 名前空間の Service を確認できます。

### 4.2 NodePort（自己管理型クラスタへの外部からのアクセス）

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort 方式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePort 方式には、ポートを割り当てる方法が二つあります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Pod の作成時に Kubernetes が未使用のホストポート（デフォルトの範囲は 30000-32767）を自動的に割り当てます |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、ホストポートが使用されておらず競合がなければ、Kubernetes がその固定ポートを割り当てます |

静的割り当てにはポートマッピングの計画が必要です。Doris は外部との通信に次のポートを提供します。

**表 1：BE サービスのポートの説明**

| ポート名 | デフォルトのポート | ポートの説明 |
|------|------|------|
| Web Server ポート | 8040 | BE 上の HTTP サーバーポートで、BE の情報を確認するために使用します |

#### 静的割り当ての設定

次の例では、`cg1` というコンピュートグループの BE のポート 8040 を、ホストのポート 31012 にマッピングします。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
      portMaps:
      - nodePort: 31012
        targetPort: 8040
```

#### 動的割り当ての設定

`cg1` というコンピュートグループで動的割り当ての NodePort アクセス方式を使用する設定は、次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境での外部からのアクセス）

[LoadBalancer 方式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、`LoadBalancer` を `computeGroup.service` のタイプとして設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## シナリオ 5：BE の起動設定をカスタマイズする

デフォルトのデプロイでは、各コンピュートグループの BE サービスはイメージ内のデフォルト設定ファイルで起動します。Doris Operator は Kubernetes の ConfigMap を使って、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントします |
| 結果 | コンピュートグループの BE サービスがカスタム設定で起動します |

### ステップ 1：起動設定を含む ConfigMap を作成する

BE サービスで使用できる ConfigMap の例を次に示します。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
    file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    deploy_mode = cloud
```

:::tip ヒント
ストレージとコンピュートを分離したクラスタでは、BE サービスの起動設定に `file_cache_path` を指定する必要があります。形式については、[ストレージとコンピュートを分離した構成の `be.conf` 設定](../../deploy-manually/separating-storage-compute-deploy-manually)のセクションを参照してください。
:::

### ステップ 2：ConfigMap をデプロイする

次のコマンドを使用して、カスタムの起動設定を含む ConfigMap を Kubernetes クラスタにデプロイします。

```shell
kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメータの説明：

| パラメータ | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` がデプロイされる名前空間です |
| `${beConfigMapFileName}` | カスタム ConfigMap を含むファイル名です |

### ステップ 3：DorisDisaggregatedCluster リソースを更新する

ConfigMap をマウントするように [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)を更新します。設定は次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip ヒント
起動設定は `/etc/doris` ディレクトリにマウントする必要があります。
:::

## シナリオ 6：コンピュートグループの永続ストレージを設定する

デフォルトのデプロイでは、BE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) をサービスのキャッシュとして使用します。`EmptyDir` は非永続的なストレージ方式です。サービスを再起動するとキャッシュデータが失われ、それに伴ってクエリの効率が低下します。

再起動後も BE サービスのキャッシュデータを保持し、クエリ効率の低下を防ぐには、キャッシュデータを永続化する必要があります。BE サービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるほか、起動設定の `LOG_DIR` で指定したディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad 方式でデータをインポートする際の一時保存先です。サービスの異常再起動後に一時保存データが失われるのを防ぐために使用します |
| BE のキャッシュディレクトリ | クエリキャッシュです。再起動後にデータが失われると、クエリ効率が低下します |

### 6.1 永続ストレージの設定例

永続化が必要なデータに永続ストレージをマウントする設定例を次に示します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```

上記の設定の説明：

- ログディレクトリにはカスタムストレージ設定を使用し、300Gi のストレージディスクをマウントします
- WAL と StreamLoad のインポートに使用するディレクトリには、300Gi のストレージディスクをマウントします
- キャッシュディレクトリにはストレージテンプレートを使用し、500Gi のストレージディスクをマウントします

:::tip ヒント
`mountPaths` 配列が空の場合、現在のストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない

ログを永続化せず、標準出力にのみ出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
