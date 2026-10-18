---
{
    "title": "Compute Group の設定",
    "language": "ja",
    "description": "Compute Group の設定に関する詳細なガイド。レプリカ設定、複数の Compute Group の設定、リソース設定、アクセスモード設定、起動パラメータ設定、永続ストレージ設定について説明します。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Compute Group は、同じタスクを処理する BE ノードの集合です。このドキュメントでは、ユースケースごとに `DorisDisaggregatedCluster` リソースで Compute Group を設定する方法を説明します。主な内容は次のとおりです。

- **基本的なデプロイ**：単一または複数の Compute Group をすばやく設定する
- **リソース制御**：CPU やメモリなどのコンピュートリソースを制限する
- **アクセス制御**：さまざまな方法でクラスタの内部または外部から BE サービスにアクセスする
- **起動設定のカスタマイズ**：ConfigMap を使用して BE の起動パラメータをカスタマイズする
- **データの永続化**：キャッシュ、ログ、StreamLoad の一時保存データに永続ストレージを使用する

## シナリオ 1：単一の Compute Group をすばやく設定する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最も簡単な Compute Group の設定には、次の 3 つのフィールドだけが必要です。

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### フィールドの説明 {#field-descriptions}

| フィールド | 説明 |
|------|------|
| `uniqueId` | Compute Group の一意の識別子で、Compute Group の名前にもなります。一度設定すると変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` という規則に一致する必要があります |
| `image` | BE サービスのデプロイに使用するイメージのアドレス。[Apache Doris の公式イメージレジストリ](https://hub.docker.com/r/apache/doris)が提供するイメージを使用してください |
| `replicas` | Compute Group 内の BE サービスノードの数 |

## シナリオ 2：業務を分離するために複数の Compute Group をデプロイする {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` リソースは複数の Compute Group のデプロイをサポートしており、各 Compute Group は互いに独立しています。次の例は、`cg1` と `cg2` という 2 つの Compute Group をデプロイする設定です。

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

各 Compute Group のレプリカ数は次のとおりです。

| Compute Group 名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
Compute Group は互いに独立していますが、同じストレージ・コンピュート分離クラスタ内のすべての Compute Group で、使用する BE サービスのイメージを統一することを推奨します。
:::

## シナリオ 3：Compute Group のコンピュートリソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

ストレージ・コンピュート分離の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用するコンピュートリソースに制限はありません。`DorisDisaggregatedCluster` では、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用して CPU とメモリのリソースを指定します。

たとえば、`cg1` という Compute Group の BE に 8c 8Gi のリソースを割り当てるには、次のように設定します。

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

この設定を、デプロイする [`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映すると有効になります。

## シナリオ 4：Compute Group へのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、Compute Group はサービスを外部に直接公開しません。Doris Operator は、`DorisDisaggregatedCluster` リソース内に、Compute Group へのアクセスプロキシとして Service を提供します。Service は 3 つの外部公開モードをサポートしています。アクセス元に合ったモードを選択してください。

| アクセスモード | 適した場面 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスタ内からのアクセス | デフォルトのモード。クラスタ内部のアドレスを提供します |
| `NodePort` | 自己管理の Kubernetes クラスタの外部からのアクセス | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスタの外部からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスタ内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIP アクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は Kubernetes クラスタ内のアドレスを提供し、Kubernetes 内からサービスにアクセスするための入口になります。

#### ステップ 1：Service のタイプを ClusterIP に設定する {#step-1-configure-clusterip-as-the-service-type}

Doris は、Kubernetes 上で ClusterIP アクセスモードをデフォルトで有効にします。追加の設定なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスタをデプロイした後、次のコマンドで Compute Group が公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のようになります。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上の結果から、`doris` という namespace にある、`uniqueId` が `cg1` の Compute Group に対応する Service を確認できます。

### 4.2 NodePort（自己管理クラスタへの外部アクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePort モードには、次の 2 つのポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Pod の作成時に Kubernetes が未使用のホストポートを自動的に割り当てます（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、そのホストポートが未使用で競合していなければ、Kubernetes が指定された固定ポートを割り当てます |

静的割り当てを使用する場合は、ポートマッピングを計画する必要があります。Doris は外部との通信に次のポートを提供します。

**表 1：BE サービスのポートの説明**

| ポート名 | デフォルトポート | ポートの説明 |
|------|------|------|
| Web Server ポート | 8040 | BE 上の HTTP サーバーのポート。BE の情報を確認するために使用します |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1` という Compute Group の BE のポート 8040 を、ホストのポート 31012 にマッピングします。

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

#### 動的割り当ての設定 {#dynamic-allocation-configuration}

`cg1` という Compute Group で動的な NodePort アクセスモードを使用する設定は、次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境での外部アクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer モード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、`computeGroup.service` のタイプを `LoadBalancer` に設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## シナリオ 5：BE の起動設定をカスタマイズする {#scenario-5-customize-the-be-startup-configuration}

デフォルトのデプロイでは、各 Compute Group の BE サービスはイメージ内のデフォルト設定ファイルを使用して起動します。Doris Operator は Kubernetes ConfigMap を使用して、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントする |
| 出力 | Compute Group の BE サービスがカスタム設定で起動する |

### ステップ 1：起動情報を含む ConfigMap を作成する {#step-1-create-a-configmap-that-contains-the-startup-information}

次に、BE サービスで使用できる ConfigMap の例を示します。

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
ストレージ・コンピュート分離クラスタにおける BE サービスの起動設定では、`file_cache_path` を設定する必要があります。形式については、[Storage-Compute Decoupled `be.conf` の設定](../../deploy-manually/separating-storage-compute-deploy-manually)のセクションを参照してください。
:::

### ステップ 2：ConfigMap をデプロイする {#step-2-deploy-the-configmap}

次のコマンドを使用して、カスタムの起動設定を含む ConfigMap を Kubernetes クラスタにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメータの説明は次のとおりです。

| パラメータ | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイする namespace |
| `${beConfigMapFileName}` | カスタム ConfigMap を含むファイルの名前 |

### ステップ 3：DorisDisaggregatedCluster リソースを更新する {#step-3-update-the-dorisdisaggregatedcluster-resource}

ConfigMap をマウントするために、[`DorisDisaggregatedCluster` リソース](./install-doris-cluster.md#2-modify-key-configurations)を更新します。設定は次のとおりです。

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

## シナリオ 6：Compute Group の永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) をサービスのキャッシュとして使用します。`EmptyDir` は永続化されないストレージモードです。サービスが再起動するとキャッシュデータが失われ、それに伴ってクエリの効率が低下します。

BE サービスの再起動後もキャッシュデータを保持し、クエリの効率が低下しないようにするには、キャッシュデータを永続化する必要があります。BE サービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるほか、起動設定の `LOG_DIR` で指定したディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad モードでのインポート時にデータを一時保存する場所。サービスの異常な再起動後に、一時保存したデータが失われるのを防ぐために使用します |
| BE のキャッシュディレクトリ | クエリキャッシュ。再起動後にデータが失われると、クエリの効率が低下します |

### 6.1 永続ストレージの設定例 {#61-persistent-storage-example}

次に、永続化が必要なデータ用に永続ストレージをマウントする設定例を示します。

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

上の設定の内容は次のとおりです。

- ログディレクトリにはカスタムのストレージ設定を使用し、300Gi のストレージディスクをマウントします
- WAL と StreamLoad のインポートに使用するディレクトリには、300Gi のストレージディスクをマウントするように設定します
- キャッシュディレクトリにはストレージテンプレートを使用し、500Gi のストレージディスクをマウントします

:::tip ヒント
`mountPaths` 配列が空の場合、そのストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない {#62-do-not-persist-logs}

ログを永続化せず、標準出力にのみ出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
