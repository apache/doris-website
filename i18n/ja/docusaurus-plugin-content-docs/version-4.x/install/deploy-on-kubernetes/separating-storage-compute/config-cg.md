---
{
    "title": "Compute Groupの設定",
    "language": "ja",
    "description": "Kubernetes上のDoris Compute Groupについて、BEのレプリカ数、CPUとメモリ、サービスへのアクセス、起動オプション、永続ストレージ、スケーリング操作を設定する方法を説明します。",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Compute Groupは、同じタスクを処理するBEノードの集合です。このドキュメントでは、`DorisDisaggregatedCluster`リソースでCompute Groupを設定する方法を、主に次のユースケースに沿って説明します。

- **基本的なデプロイ**：単一または複数のCompute Groupをすばやく構成する
- **リソース制御**：CPUやメモリなどの計算リソースを制限する
- **アクセス制御**：クラスター内外から、異なる方法でBEサービスにアクセスする
- **起動設定のカスタマイズ**：ConfigMapを使用してBEの起動パラメーターをカスタマイズする
- **データの永続化**：キャッシュ、ログ、StreamLoadの一時保存データに永続ストレージを使用する
- **スケーリング**：BEノードやCompute Groupを追加・削除し、縮小結果を確認する

## シナリオ 1：単一のCompute Groupをすばやく構成する {#scenario-1-quickly-set-up-a-single-compute-group}

### 最小構成 {#minimal-configuration}

最も簡単なCompute Groupの構成には、次の3つのフィールドだけが必要です。

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
| `uniqueId` | Compute Groupの一意の識別子で、Compute Groupの名前にもなります。設定後は変更できません。名前は`[a-zA-Z][0-9a-zA-Z_]+`という規則に一致する必要があります |
| `image` | BEサービスをデプロイするためのイメージのアドレスです。[Apache Doris公式イメージレジストリ](https://hub.docker.com/r/apache/doris)が提供するイメージを使用してください |
| `replicas` | Compute Group内のBEサービスノード数です |

## シナリオ 2：複数のCompute Groupをデプロイして業務を分離する {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster`リソースは複数のCompute Groupのデプロイに対応しており、各Compute Groupは互いに独立しています。次の例は、`cg1`と`cg2`という名前のCompute Groupをデプロイする構成です。

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

各Compute Groupのレプリカ数は次のとおりです。

| Compute Group名 | レプリカ数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

ここで、`${beImage}`はデプロイするBEサービスのイメージを表します。

:::tip ヒント
Compute Groupは互いに独立していますが、同じストレージ・コンピュート分離クラスター内のすべてのCompute Groupで、BEサービスのイメージを統一することを推奨します。
:::

## シナリオ 3：Compute Groupの計算リソースを制限する {#scenario-3-limit-the-compute-resources-of-a-compute-group}

ストレージ・コンピュート分離の[デフォルトのデプロイ例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)では、BEサービスが使用する計算リソースに制限を設けていません。`DorisDisaggregatedCluster`では、Kubernetesの[resources.requestsとresources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits)を使用してCPUとメモリのリソースを指定します。

たとえば、`cg1`という名前のCompute GroupのBEが8c 8Giのリソースを使用するように設定するには、次のようにします。

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

上記の設定を、デプロイする[`DorisDisaggregatedCluster`リソース](./install-doris-cluster.md#2-modify-key-configurations)に反映すると有効になります。

## シナリオ 4：Compute Groupへのアクセス方法を設定する {#scenario-4-configure-the-access-method-of-a-compute-group}

デフォルトでは、Compute Groupはサービスを外部に直接公開しません。Doris Operatorは、`DorisDisaggregatedCluster`リソース内でCompute Groupへのアクセス用プロキシとなるServiceを提供します。Serviceは次の3種類の外部公開モードに対応しています。アクセス元に適したモードを選択してください。

| アクセスモード | 適用場面 | 特徴 |
|------|------|------|
| `ClusterIP` | Kubernetesクラスター内からのアクセス | デフォルトのモードで、クラスター内部のアドレスを提供します |
| `NodePort` | 自己管理型Kubernetesクラスターの外部からのアクセス | ホストマシンのポートを通じてサービスを公開します |
| `LoadBalancer` | クラウドプラットフォーム上のKubernetesクラスターの外部からのアクセス | クラウドサービスプロバイダーが提供するロードバランサーを使用します |

### 4.1 ClusterIP（クラスター内からのアクセス） {#41-clusterip-access-within-the-cluster}

[ClusterIPアクセスモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)はKubernetesクラスター内に内部アドレスを提供し、Kubernetes内からサービスにアクセスするための入口となります。

#### ステップ 1：ServiceのタイプをClusterIPに設定する {#step-1-configure-clusterip-as-the-service-type}

Dorisでは、Kubernetes上のClusterIPアクセスモードがデフォルトで有効になっています。追加の設定なしで使用できます。

#### ステップ 2：Serviceのアクセスアドレスを取得する {#step-2-get-the-service-access-address}

クラスターのデプロイ後、次のコマンドでCompute Groupが公開するServiceを確認します。

```shell
kubectl -n doris get svc
```

結果は次のようになります。

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

上記の結果から、`uniqueId`が`cg1`で、名前空間`doris`にあるCompute Groupのアクセスに使用できるServiceが分かります。

### 4.2 NodePort（自己管理型クラスターへの外部アクセス） {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetesクラスターの外部からDorisにアクセスするには、[NodePortモード](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)を選択します。NodePortモードには、次のポート割り当て方法があります。

| 割り当て方法 | 説明 |
|------|------|
| ホストポートの動的割り当て | ポートマッピングを明示的に設定しない場合、KubernetesはPodの作成時に未使用のホストポートを自動的に割り当てます（デフォルトの範囲は30000-32767） |
| ホストポートの静的割り当て | ポートマッピングを明示的に指定した場合、そのホストポートが使用中でなく競合もなければ、Kubernetesは指定した固定ポートを割り当てます |

静的割り当てではポートマッピングを計画する必要があります。Dorisは外部との通信に次のポートを提供します。

**表 1：BEサービスのポートの説明**

| ポート名 | デフォルトポート | 説明 |
|------|------|------|
| Web Server Port | 8040 | BE上のHTTPサーバーのポートで、BEの情報を表示するために使用します |

#### 静的割り当ての設定 {#static-allocation-configuration}

次の例では、`cg1`という名前のCompute GroupにあるBEのポート8040を、ホストのポート31012にマッピングします。

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

`cg1`という名前のCompute Groupで動的NodePortアクセスモードを使用する設定は、次のとおりです。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（クラウド環境での外部アクセス） {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancerモード](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)はクラウドプラットフォーム上のKubernetes環境に適しており、クラウドサービスプロバイダーが提供するロードバランサーを使用します。次のように、タイプを`LoadBalancer`にする設定を`computeGroup.service`に指定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## シナリオ 5：BEの起動設定をカスタマイズする {#scenario-5-customize-the-be-startup-configuration}

デフォルトのデプロイでは、各Compute GroupのBEサービスはイメージ内のデフォルト設定ファイルを使用して起動します。Doris OperatorはKubernetesのConfigMapを使用して、カスタムの起動設定ファイルをマウントします。全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの`be.conf`設定ファイル |
| 操作 | ConfigMapを作成し、`/etc/doris`ディレクトリにマウントする |
| 出力 | Compute GroupのBEサービスがカスタム設定で起動する |

### ステップ 1：起動情報を含むConfigMapを作成する {#step-1-create-a-configmap-that-contains-the-startup-information}

次に、BEサービスで使用できるConfigMapの例を示します。

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
ストレージ・コンピュート分離クラスターのBEサービスでは、起動設定に`file_cache_path`を指定する必要があります。形式については、[ストレージ・コンピュート分離環境の`be.conf`設定](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。
:::

### ステップ 2：ConfigMapをデプロイする {#step-2-deploy-the-configmap}

次のコマンドで、カスタムの起動設定を含むConfigMapをKubernetesクラスターにデプロイします。

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

パラメーターの説明：

| パラメーター | 説明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster`をデプロイする名前空間 |
| `${beConfigMapFileName}` | カスタムConfigMapを含むファイルの名前 |

### ステップ 3：DorisDisaggregatedClusterリソースを更新する {#step-3-update-the-dorisdisaggregatedcluster-resource}

ConfigMapをマウントするため、[`DorisDisaggregatedCluster`リソース](./install-doris-cluster.md#2-modify-key-configurations)を次のように更新します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip ヒント
起動設定は`/etc/doris`ディレクトリにマウントする必要があります。
:::

## シナリオ 6：Compute Groupの永続ストレージを設定する {#scenario-6-configure-persistent-storage-for-a-compute-group}

デフォルトのデプロイでは、BEサービスはKubernetesの[EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir)をキャッシュとして使用します。`EmptyDir`は非永続ストレージの方式です。サービスが再起動するとキャッシュデータが失われ、それに伴ってクエリの効率が低下します。

BEサービスの再起動後もキャッシュデータを保持し、クエリの効率が低下しないようにするには、キャッシュデータを永続化する必要があります。BEサービスに関係する主なストレージパスは次のとおりです。

| ストレージパス | 用途 |
|------|------|
| BEログディレクトリ | BEサービスのログは標準出力に出力されるほか、起動設定の`LOG_DIR`で指定されたディレクトリにも書き込まれます |
| `/opt/apache-doris/be/storage` | StreamLoadモードでデータをインポートする際の一時保存先です。サービスが異常終了して再起動した後も、一時保存データが失われないようにします |
| BEキャッシュディレクトリ | クエリキャッシュです。再起動後にデータが失われると、クエリの効率が低下します |

### 6.1 永続ストレージの設定例 {#61-persistent-storage-example}

次に、永続化が必要なデータに永続ストレージをマウントする設定例を示します。

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

- ログディレクトリにはカスタムのストレージ設定を使用し、300Giのストレージディスクをマウントします
- WALとStreamLoadのインポートに使用するディレクトリには、300Giのストレージディスクをマウントします
- キャッシュディレクトリにはストレージテンプレートを使用し、500Giのストレージディスクをマウントします

:::tip ヒント
`mountPaths`配列が空の場合、現在のストレージ設定はテンプレート設定として扱われます。
:::

### 6.2 ログを永続化しない {#62-do-not-persist-logs}

ログを永続化せず、標準出力にのみ出力する場合は、次のように設定します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## シナリオ 7：計算容量をスケーリングする {#scaling-compute-groups}

`DorisDisaggregatedCluster`リソースを変更して、Compute Groupをスケーリングします。`replicas`フィールドが表すのはBEノード数であり、オブジェクトストレージ内のデータのコピー数ではありません。この値を増やすと計算容量が増え、減らすとBEノードとそのローカルキャッシュが削除されます。

以下の手順は[Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1)に基づきます。CRDとOperatorイメージには同じリリースのものを使用してください。縮小時の動作はBEイメージにも依存するため、すべてのイメージがグレースフルシャットダウンに対応しているとは限りません。

### 7.1 クラスターの準備と確認 {#71-prepare-and-inspect-the-cluster}

容量を変更する前に、次を確認してください。

- FE、MetaService、FoundationDB、および現在のBEノードが正常であることを確認します。Operatorは、[認証の設定](config-cluster.md)で指定した管理者認証情報を使ってFEに接続できる必要があります。
- KubernetesのCPU、メモリ、ストレージの容量を確認します。新しいPVCをバインドできるかも確認してください。残りのワークロードを処理できるだけの準備完了状態のBEノードを確保します。
- 縮小する場合は、先にトラフィックを減らすか別の場所に振り向け、実行中のクエリとデータロードジョブが完了するのを待ちます。操作後にクライアントの再試行状況とデータロードジョブの状態を確認します。

以下の例では、名前空間に`doris`、クラスターに`test-disaggregated-cluster`、Compute Groupに`cg1`を使用します。実際の名前に置き換えてください。

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

管理者としてFEのSQLエンドポイントに接続し、現在のCompute GroupとBEノードを記録します。

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

クラスターのデプロイに使用するマニフェスト全体を編集してから適用します。

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

以下のYAML片には、変更するフィールドだけを示します。他のフィールドと`spec.computeGroups`内の他のすべてのエントリは保持してください。既存のグループを省略すると、そのグループの削除が要求されます。OperatorがDorisのメタデータとKubernetesのリソースを連携して管理できるよう、StatefulSetを直接スケーリングせず、Dorisのカスタムリソースを変更してください。

### 7.2 既存のCompute Groupを拡大する {#72-scale-out-an-existing-compute-group}

たとえば、マニフェスト全体で`cg1`のBEノード数を2から3に変更します。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

既存の`uniqueId`、イメージ、リソース設定、ConfigMap、永続ボリュームの設定を保持します。マニフェストを適用すると、OperatorはStatefulSetのレプリカ数を増やし、新しいBEは起動時にクラスターへ登録されます。

このグループで3つのPodが準備完了状態になり、`SHOW BACKENDS`に新しいBEが`Alive = true`として表示されることを確認します。新しいノードのキャッシュは空の状態から始まります。ノードを追加しても、既存のノードと同じキャッシュがすぐに得られるわけではありません。

### 7.3 既存のCompute Groupを縮小する {#73-scale-in-an-existing-compute-group}

クラスター単位の真偽値`spec.enableDecommission`でBEの削除経路を選択します。デフォルトは`false`です。

| 値 | Compute Groupの`replicas`を減らしたときの動作 |
| --- | --- |
| `true` | Doris BEの退役操作を実行し、退役中は元のStatefulSetのレプリカ数を維持します。選択したノードの退役が完了した後、それらをDorisから削除し、StatefulSetを縮小します。 |
| `false` | 選択したBEを、退役の段階を経ずにDorisから削除します。Operator 26.0.1は、BEイメージが対応している場合、まずグレースフル縮小処理を使用します。対応していない場合は、直接削除する経路に切り替えます。 |

たとえば、退役の経路を使用して`cg1`を3ノードから2ノードに減らすには、マニフェスト全体を次のように更新して適用します。

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operatorは、Podの序数が目標のレプリカ数以上であるノードを選択します。退役中にそれらのPodを手動で削除しないでください。次のコマンドで進行状況を確認します。

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

Dorisで`SHOW BACKENDS;`を実行します。Operatorの退役確認処理は、選択したBEで`SystemDecommissioned = true`かつ`TabletNum = 0`となるか、そのBEがすでに削除されるまで待ちます。この処理中、グループは`Decommissioning`の状態が続くことがあります。完了には、準備完了状態のPod数が目標に達し、Doris内のBEメンバー構成もそれに一致する必要があります。

:::caution 縮小時のローカルストレージ
Operator 26.0.1は、StatefulSetの縮小後、削除したPodの序数に対応するPVCを削除します。その後ストレージがどう扱われるかは、基盤となるPVの回収ポリシーによって決まります。キャッシュ、ログ、またはStream Loadの一時保存データを永続化していても、縮小後にそれらのボリュームが残る保証はありません。BEを削除する前に、関連するデータロードジョブを完了し、必要なログを保存してください。再び拡大しても、以前のローカルデータが復元される保証はありません。
:::

### 7.4 Compute Group全体を追加または削除する {#74-add-or-remove-an-entire-compute-group}

グループを追加するには、既存のすべてのグループを保持したまま、新しい`uniqueId`を持つエントリを追加します。次に例を示します。

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

マニフェスト全体を適用し、`cg2`が準備完了状態になって`SHOW COMPUTE GROUPS`に表示されるまで待ちます。このグループにトラフィックを送る前に、[Compute Groupの管理](../../../compute-storage-decoupled/managing-compute-cluster.md)に従ってユーザーのアクセス権とワークロードのルーティングを設定します。グループを追加しても、既存のセッションが自動的にそのグループへ移動することはありません。

グループを削除するには、まずそのグループのクエリとデータロードを別の利用可能なグループに移し、そのグループを参照するユーザーのデフォルト設定やアプリケーション設定を更新します。マニフェスト全体から対象グループのエントリだけを削除して適用します。Operatorは、そのグループのBEをDorisのメタデータから削除した後、管理対象のServiceとStatefulSetを削除します。

:::caution グループ全体の削除とレプリカ数の削減は動作が異なる
Operator 26.0.1では、`computeGroups`のエントリ全体を削除すると、`enableDecommission`が`true`でもBEの直接削除経路が使用されます。段階的な退役を要求するためにエントリを削除しないでください。削除後は残存するPVCを確認し、保持ポリシーに従って処理します。既存グループ内の縮小と同じクリーンアップが行われるとは限りません。
:::

### 7.5 リソースの変更とその他のコンポーネント {#75-resource-changes-and-other-components}

| 変更内容 | 操作と制約 |
| --- | --- |
| BEごとのCPU・メモリを増減する | シナリオ 3の説明に従って、グループの`requests`と`limits`を変更し、マニフェスト全体を適用します。Podテンプレートが変わるため、BEが再起動する可能性があります。適用前にスケジューリングに必要な容量を確認してください。 |
| FEをスケーリングする | `spec.feSpec.replicas`を変更します。値は`electionNumber`以上である必要があり、超過分のFEノードはObserverになります。Operatorは、StatefulSetを縮小する前に、選択したObserverをDorisから削除します。既存クラスターの`electionNumber`は変更しないでください。[FEの設定](config-fe.md)を参照してください。 |
| MetaService、FoundationDB、Storage Vaultの容量を変更する | これらはCompute Groupのレプリカ数とは独立して管理します。メタデータとストレージを保持してください。BEの縮小を理由に、これらのリソースやオブジェクトストレージ内のデータを削除する必要はありません。[MetaServiceの設定](config-ms.md)と[FoundationDBのデプロイ](install-fdb.md)を参照してください。 |

### 7.6 検証とトラブルシューティング {#76-verify-and-troubleshoot}

変更のたびに、カスタムリソースに示されるCompute Groupのフェーズ、Podの準備完了状態、`SHOW BACKENDS`を併せて確認します。ノード数が目標どおりであること、残したノードが`Alive = true`であること、削除対象のノードがなくなっていること、意図したCompute Groupを通じてクエリとデータロードが成功することを確認してください。

操作が進まない場合は、`kubectl describe ddc`、PodのEvents、PVCのバインド状態、Operatorのログを調べます。Podが`Pending`の場合は通常、スケジューリングまたはストレージを確認します。`Decommissioning`の場合はDorisの退役の進行状況を確認します。`ScaleDownFailed`の場合はOperatorのSQLエラーと、FEへの接続状況や権限を確認します。報告された原因を解決してから再試行するか、リソースの強制削除を検討してください。[ステータスとトラブルシューティング](../doris-operator/status-and-troubleshooting.md)を参照してください。
