---
{
    "title": "計算グループの設定",
    "language": "ja",
    "description": "Kubernetes 上の Doris 計算グループについて、BE のレプリカ数、CPU とメモリ、サービスへのアクセス、起動オプション、永続ストレージ、スケーリング操作を設定する方法を説明します。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

計算グループは、同じタスクを処理する BE ノードの集合です。このドキュメントでは、`DorisDisaggregatedCluster` リソースで計算グループを設定する方法を、主に次のユースケースに沿って説明します。

- **基本的なデプロイ**：単一または複数の計算グループをすばやく構成する
- **リソース制御**：CPU やメモリなどの計算リソースを制限する
- **アクセス制御**：さまざまな方法でクラスタの内外から BE サービスにアクセスする
- **起動設定のカスタマイズ**：ConfigMap を使用して BE の起動パラメータをカスタマイズする
- **データの永続化**：キャッシュ、ログ、StreamLoad の一時データを永続ストレージに保存する
- **スケーリング**：スケールインの結果を確認しながら、BE ノードや計算グループを追加または削除する

## シナリオ 1：単一の計算グループをすばやく構成する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最も簡単な計算グループの構成には、次の 3 つのフィールドのみが必要です。

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
| `uniqueId` | 計算グループの一意の識別子であり、計算グループの名前でもあります。設定後は変更できません。名前は `[a-zA-Z][0-9a-zA-Z_]+` という規則に一致する必要があります |
| `image` | BE サービスをデプロイするイメージのアドレスです。[Apache Doris 公式イメージレジストリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用してください |
| `replicas` | 計算グループ内の BE サービスノード数です |

### ノードのシステム初期化 {#be-system-initialization}

`skipDefaultSystemInit` のデフォルト値は `false` です。Doris Operator は、次のコマンドを実行する特権付きの BE init コンテナを追加します。

```shell
sysctl -w vm.max_map_count=2000000 && swapoff -a
```

これらのコマンドは、他のワークロードと共有される設定を含め、基盤となる Linux ノードの設定を変更します。デスクトップ環境で kind を使用している場合、影響を受ける Linux カーネルはコンテナランタイムの仮想マシンに属している可能性があります。この初期化の影響は BE プロセスに限定されません。

ノード管理者が必要な設定をすでに適用している場合は、既存の計算グループのエントリに `skipDefaultSystemInit: true` を設定します。マニフェスト内の他のフィールドと計算グループは維持してください。

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      skipDefaultSystemInit: true
```

Doris 3.0.4 以降では、この設定によって `SKIP_CHECK_ULIMIT=true` も注入され、一部のシステムパラメータに関する起動時のチェックがスキップされます。有効にする前に、ノードの設定を自分で確認してください。

## シナリオ 2：業務を分離するために複数の計算グループをデプロイする {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` リソースでは複数の計算グループをデプロイでき、各グループは互いに独立しています。次の例は、`cg1` と `cg2` という計算グループをデプロイする構成です。

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

各計算グループのレプリカ数は次のとおりです。

| 計算グループ名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}` はデプロイする BE サービスのイメージを表します。

:::tip ヒント
計算グループは互いに独立していますが、同じ存算分離クラスタ内のすべての計算グループで、BE サービスのイメージを揃えることを推奨します。
:::

## シナリオ 3：計算グループの計算リソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

存算分離の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BE サービスが使用する計算リソースに制限を設けていません。`DorisDisaggregatedCluster` は、Kubernetes の [resources.requests と resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) を使用して CPU とメモリのリソースを指定します。

たとえば、`cg1` という計算グループの BE に 8c 8Gi のリソースを割り当てるには、次のように設定します。

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

## シナリオ 4：計算グループへのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、計算グループはサービスを外部に直接公開しません。Doris Operator は、`DorisDisaggregatedCluster` リソースで計算グループへのアクセス用プロキシとなる Service を提供します。Service は次の外部公開モードに対応しています。アクセス元に適したモードを選択してください。

| アクセスモード | 適した場面 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetes クラスタ内からのアクセス | デフォルトのモードで、クラスタ内部のアドレスを提供します |
| `NodePort` | 自己管理の Kubernetes クラスタ外からのアクセス | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上の Kubernetes クラスタ外からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスタ内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIP アクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)は、Kubernetes クラスタ内に内部アドレスを提供します。このアドレスが、Kubernetes 内部からサービスにアクセスするための入口になります。

#### ステップ 1：Service のタイプを ClusterIP に設定する {#step-1-configure-clusterip-as-the-service-type}

Doris は Kubernetes 上で ClusterIP アクセスモードをデフォルトで有効にします。追加の設定なしで使用できます。

#### ステップ 2：Service のアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスタをデプロイした後、次のコマンドで計算グループが公開する Service を確認します。

```shell
kubectl -n doris get svc
```

結果は次のようになります。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

この結果から、`uniqueId` が `cg1` である計算グループについて、名前空間 `doris` で利用できる Service を確認できます。

### 4.2 NodePort（自己管理クラスタの外部からのアクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes クラスタの外部から Doris にアクセスするには、[NodePort モード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePort モードには、次のポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、Kubernetes は Pod の作成時に未使用のホストポートを自動的に割り当てます（デフォルトの範囲は 30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、ホストポートが未使用で競合もなければ、Kubernetes は指定された固定ポートを割り当てます |

静的に割り当てる場合は、ポートマッピングを計画する必要があります。Doris は外部との通信に次のポートを提供します。

**表 1：BE サービスのポートの説明**

| ポート名 | デフォルトポート | ポートの説明 |
|------|------|------|
| Web Server Port | 8040 | BE 上の HTTP サーバーポートです。BE の情報を表示するために使用します |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1` という計算グループの BE のポート 8040 を、ホストのポート 31012 にマッピングします。

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

`cg1` という計算グループで動的な NodePort アクセスモードを使用するには、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境の外部からのアクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer モード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)は、クラウドプラットフォーム上の Kubernetes 環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、`computeGroup.service` でタイプを `LoadBalancer` に設定します。

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

デフォルトのデプロイでは、各計算グループの BE サービスはイメージ内のデフォルトの設定ファイルを使用して起動します。Doris Operator は Kubernetes の ConfigMap を使用して、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `be.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントします |
| 出力 | 計算グループの BE サービスがカスタム設定で起動します |

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
存算分離クラスタの BE サービスの起動設定には、`file_cache_path` を必ず設定してください。形式については、[存算分離の `be.conf` 設定](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。
:::

### ステップ 2：ConfigMap をデプロイする {#step-2-deploy-the-configmap}

次のコマンドを使用して、カスタムの起動設定を含む ConfigMap を Kubernetes クラスタにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメータの説明は次のとおりです。

| パラメータ | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` をデプロイした名前空間 |
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

## シナリオ 6：計算グループの永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BE サービスは Kubernetes の [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) をキャッシュとして使用します。`EmptyDir` は非永続的なストレージです。サービスを再起動するとキャッシュされたデータが失われ、その分クエリの処理効率が低下します。

再起動後も BE サービスのキャッシュデータを保持し、クエリの処理効率の低下を防ぐには、キャッシュデータを永続化する必要があります。BE サービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BE のログディレクトリ | BE サービスのログは標準出力に出力されるほか、起動設定の `LOG_DIR` で指定したディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoad モードでデータをインポートする際の一時保存場所です。サービスが異常終了して再起動した場合に、一時保存したデータが失われるのを防ぎます |
| BE のキャッシュディレクトリ | クエリのキャッシュです。再起動後にデータが失われると、クエリの処理効率が低下します |

### 6.1 永続ストレージの例 {#61-persistent-storage-example}

永続化が必要なデータのために永続ストレージをマウントする設定例を示します。

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

この設定の内容は次のとおりです。

- ログディレクトリにはカスタムのストレージ設定を使用し、300Gi のストレージディスクをマウントします
- WAL と StreamLoad によるインポートに使用するディレクトリには、300Gi のストレージディスクをマウントします
- キャッシュディレクトリにはストレージテンプレートを使用し、500Gi のストレージディスクをマウントします

:::tip ヒント
`mountPaths` 配列が空の場合、現在のストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない {#62-do-not-persist-logs}

ログを永続化せず、標準出力にのみ出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## シナリオ 7：計算能力をスケーリングする {#scaling-compute-groups}

`DorisDisaggregatedCluster` リソースを変更して計算グループをスケーリングします。`replicas` フィールドは BE ノードの数を表し、オブジェクトストレージ内のデータのコピー数を表すものではありません。この値を増やすと計算能力が増え、減らすと BE ノードとそのローカルキャッシュが削除されます。

以下の手順は [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1) に基づいています。CRD と Operator イメージは同じリリースのものを使用してください。スケールイン時の動作は BE イメージにも依存します。すべてのイメージがグレースフルシャットダウンに対応していると想定しないでください。

### 7.1 クラスタを準備して確認する {#71-prepare-and-inspect-the-cluster}

容量を変更する前に、次の点を確認します。

- FE、MetaService、FoundationDB、および現在の BE ノードが正常であることを確認します。Operator は、[認証の設定](config-cluster.md)で設定した管理用認証情報を使って FE に接続できる必要があります。
- 新しい PVC をバインドできるかどうかを含め、Kubernetes の CPU、メモリ、ストレージの容量を確認します。残りのワークロードを処理できるだけの Ready 状態の BE ノードを確保してください。
- スケールインする場合は、先にトラフィックを減らすか転送し、実行中のクエリとデータロードジョブが完了するのを待ちます。操作後にクライアントの再試行とデータロードジョブの状態を確認してください。

以下の例では、名前空間に `doris`、クラスタに `test-disaggregated-cluster`、計算グループに `cg1` を使用します。実際の名前に置き換えてください。

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

管理者として FE の SQL エンドポイントに接続し、現在の計算グループと BE ノードを記録します。

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

クラスタのデプロイに使用した完全なマニフェストを編集してから、適用します。

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

以下の YAML 断片には、変更するフィールドのみを示します。`spec.computeGroups` 内の他のフィールドと、その他すべてのエントリは維持してください。既存のグループを省略すると、そのグループの削除が要求されます。StatefulSet を直接スケーリングせず、Doris のカスタムリソースを変更してください。これにより、Operator が Doris のメタデータと Kubernetes のリソースを連携させることができます。

### 7.2 既存の計算グループをスケールアウトする {#72-scale-out-an-existing-compute-group}

たとえば、完全なマニフェストで `cg1` の BE ノード数を 2 から 3 に変更します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

既存の `uniqueId`、イメージ、リソース設定、ConfigMap、永続ボリュームの設定を維持してください。マニフェストを適用すると、Operator が StatefulSet のレプリカ数を増やし、新しい BE が起動時にクラスタへ登録されます。

グループで 3 つの Pod が Ready 状態になり、`SHOW BACKENDS` に新しい BE が `Alive = true` として表示されることを確認します。新しいノードはキャッシュがない状態から始まるため、追加した直後に既存ノードと同じキャッシュが得られるわけではありません。

### 7.3 既存の計算グループをスケールインする {#73-scale-in-an-existing-compute-group}

クラスタレベルの Boolean 値 `spec.enableDecommission` により、BE の削除経路が決まります。デフォルト値は `false` です。

| 値 | 計算グループの `replicas` を減らした場合の動作 |
| --- | --- |
| `true` | Doris BE の退役操作を送信し、退役が進行している間は StatefulSet の元のレプリカ数を維持します。選択したノードの退役が完了した後、Doris からノードを削除し、StatefulSet を縮小します。 |
| `false` | 退役処理を行わずに、選択した BE を Doris から削除します。Operator 26.0.1 は、BE イメージが対応していればまずグレースフルスケールインの処理を使用し、対応していなければ直接削除する経路に切り替えます。 |

たとえば、退役経路で `cg1` を 3 ノードから 2 ノードに減らすには、完全なマニフェストを次のように更新して適用します。

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator は、Pod の序数が目標のレプリカ数以上であるノードを選択します。退役中は、それらの Pod を手動で削除しないでください。進行状況は次のコマンドで確認します。

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

Doris で `SHOW BACKENDS;` を実行します。Operator の退役チェックは、選択された BE が `SystemDecommissioned = true` かつ `TabletNum = 0` になるか、すでに削除されるまで待機します。この処理中、グループは `Decommissioning` のままになることがあります。完了と判断するには、Ready 状態の Pod 数と Doris の BE メンバー構成の両方が目標に一致している必要があります。

:::caution スケールイン時のローカルストレージ
Operator 26.0.1 は、StatefulSet を縮小した後、削除された Pod の序数に属する PVC を削除します。その後ストレージがどうなるかは、基盤となる PV の回収ポリシーによって決まります。キャッシュ、ログ、または Stream Load の一時データを永続化していても、スケールイン後にそれらのボリュームが残るとは限りません。BE を削除する前に、関連するデータロードジョブを完了し、必要なログを保存してください。再びスケールアウトしても、以前のローカルデータが復元される保証はありません。
:::

### 7.4 計算グループ全体を追加または削除する {#74-add-or-remove-an-entire-compute-group}

グループを追加するには、既存のすべてのグループを維持したまま、新しい `uniqueId` を持つエントリを追加します。たとえば、次のようにします。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

完全なマニフェストを適用し、`cg2` が Ready 状態になって `SHOW COMPUTE GROUPS` に表示されるまで待ちます。トラフィックを送る前に、[計算グループの管理](../../../compute-storage-decoupled/managing-compute-cluster.md)に従ってユーザーのアクセス権とワークロードのルーティングを設定してください。グループを追加しても、既存のセッションが自動的に移動することはありません。

グループを削除するには、まずそのグループのクエリとデータロードを別の利用可能なグループに移し、そのグループを参照しているユーザーのデフォルト設定やアプリケーション設定を更新します。完全なマニフェストから対象グループのエントリだけを削除し、適用します。Operator は、そのグループの BE を Doris のメタデータから削除してから、管理対象の Service と StatefulSet を削除します。

:::caution グループ全体の削除とレプリカ数の削減では動作が異なります
Operator 26.0.1 では、`computeGroups` のエントリ全体を削除すると、`enableDecommission` が `true` でも BE の直接削除経路が使用されます。段階的な退役を要求するためにエントリを削除しないでください。削除後に残存する PVC がないか確認し、保持ポリシーに従って処理してください。既存グループ内でのスケールインと同じ方法でクリーンアップされるとは想定しないでください。
:::

### 7.5 リソースの変更とその他のコンポーネント {#75-resource-changes-and-other-components}

| 変更内容 | 操作と制約 |
| --- | --- |
| BE ごとの CPU・メモリの増減 | シナリオ 3 の説明に従ってグループの `requests` と `limits` を変更し、完全なマニフェストを適用します。これにより Pod テンプレートが変わり、BE が再起動する可能性があります。適用前にスケジューリングに必要な容量を確認してください。 |
| FE のスケーリング | `spec.feSpec.replicas` を変更します。値は `electionNumber` 以上でなければならず、超過分の FE ノードは Observer になります。Operator は StatefulSet を縮小する前に、選択した Observer を Doris から削除します。既存クラスタの `electionNumber` は変更しないでください。[FE の設定](config-fe.md)を参照してください。 |
| MetaService、FoundationDB、または Storage Vault の容量の変更 | これらの容量は計算グループのレプリカ数とは独立して管理し、メタデータとストレージを維持してください。BE のスケールインを理由に、これらのリソースやオブジェクトストレージ内のデータを削除する必要はありません。[MetaService の設定](config-ms.md)と[FoundationDB のデプロイ](install-fdb.md)を参照してください。 |

### 7.6 確認とトラブルシューティング {#76-verify-and-troubleshoot}

変更するたびに、カスタムリソース内の計算グループのフェーズ、Pod の Ready 状態、`SHOW BACKENDS` の結果を併せて確認します。ノード数が目標と一致すること、残すノードが `Alive = true` であること、退役したノードが削除されていること、および目的の計算グループを通じてクエリとデータロードが成功することを確認してください。

操作が進まない場合は、`kubectl describe ddc`、Pod の Events、PVC のバインド状態、Operator のログを調べます。Pod が `Pending` の場合はスケジューリングまたはストレージ、`Decommissioning` の場合は Doris の退役処理の進行状況、`ScaleDownFailed` の場合は Operator の SQL エラーと FE への接続または権限を確認します。報告された原因を解決してから、再試行またはリソースの強制削除を行ってください。[状態とトラブルシューティング](../doris-operator/status-and-troubleshooting.md)を参照してください。

## 計画的な BE の再起動 {#planned-be-restarts}

一時的に再起動する場合は、BE の登録を維持してグレースフルシャットダウンを使用します。Doris 4.1.5 の存算分離モードでは、`DECOMMISSION BACKEND` は永続的なスケールイン操作です。Pod を再起動しても取り消されず、`CANCEL DECOMMISSION BACKEND` もサポートされていません。BE を恒久的に削除する場合は、前述のスケールイン手順を使用してください。

通常の `DROP BACKEND` が拒否されるのは、意図的な保護措置です。明示的に削除するための `DROPP BACKEND` 構文については、[DROP BACKEND](../../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md)を参照してください。恒久的に削除する場合は、Doris のメタデータと Kubernetes のリソースの整合性を保つため、Operator のスケールイン手順を優先してください。

Doris Operator は BE に `preStop` フックを設定します。標準の Doris 4.1.5 イメージでは、このフックが `stop_be.sh --grace` を呼び出します。BE はハートビートでシャットダウン状態を報告し、実行中のクエリが完了するのを待ちます。再起動する前に、次の手順を実行します。

1. 計算グループ内の他の BE が正常で、十分な容量があることを確認します。
2. 生成された Pod の `terminationGracePeriodSeconds` を確認します。クエリの完了待ち、シャットダウン後の遅延、実行時のオーバーヘッドをカバーできる値が必要です。Doris 4.1.5 では、`grace_shutdown_wait_seconds=120` と `grace_shutdown_post_delay_seconds=30` がデフォルトです。Operator 26.0.1 では BE Pod の猶予期間はデフォルトで 200 秒ですが、`be.conf` で `grace_shutdown_wait_seconds` を明示的に設定すると、生成される Pod の値も変わります。両方の設定を併せて確認してください。
3. 強制削除せず、`preStop` が実行される通常の Pod 削除を使用します。

   ```shell
   kubectl delete pod ${be_pod} -n ${namespace}
   ```

4. 置き換えられた Pod が Ready 状態になり、`SHOW BACKENDS` で BE が稼働中でシャットダウン状態が解除されていることを確認します。クエリとデータロードを検証してから、別の BE を再起動してください。

Operator 26.0.1 には、互換性のある BE イメージを必要とする段階的なグレースフルロールアウトもあります。標準の Doris 4.1.5 イメージはこの処理の互換性チェックに合格しないため、Operator だけをアップグレードしても、このイメージでその処理は有効になりません。既存の `preStop` フックが引き続きグレースフル停止の仕組みとなります。グレースフルシャットダウンは影響を減らしますが、ノードの突然の喪失や強制終了が発生した場合に、実行中のクエリを保護することはできません。
