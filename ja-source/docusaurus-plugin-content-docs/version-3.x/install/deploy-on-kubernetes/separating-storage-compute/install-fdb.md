---
{
  "title": "FoundationDBをインストール",
  "language": "ja",
  "description": "FoundationDBは、Apache 2.0ライセンスの下でリリースされたオープンソースの分散データベースで、構造化データストレージに対して強い一貫性を提供します。"
}
---
FoundationDBは Apache 2.0 ライセンスの下でリリースされたオープンソースの分散データベースで、構造化データストレージに強い整合性を提供します。Dorisのコンピュート・ストレージ分離モデルでは、FoundationDBがメタデータストアとして使用され、meta-serviceコンポーネントがFoundationDB内のメタデータを管理します。Kubernetes上でコンピュート・ストレージ分離クラスターをデプロイする際は、事前にFoundationDBをデプロイする必要があります。2つのデプロイメントオプションが推奨されます：  
- 仮想マシン（物理マシンを含む）上に直接FoundationDBをデプロイする。  
- [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)を使用してKubernetes上にFoundationDBをデプロイする。  

VMデプロイメントについては、Dorisのコンピュート・ストレージ分離ドキュメントのPre-deploymentセクション[](../../../compute-storage-decoupled/before-deployment)を参照してFoundationDBクラスターを設定してください。デプロイメント前に、DorisのKubernetesクラスターからFoundationDBにアクセスできることを確認してください。つまり、KubernetesノードはFoundationDBがデプロイされるマシンと同じサブネット上にある必要があります。  

## Kubernetes上でFoundationDBをデプロイ
Kubernetes上でのFoundationDBクラスターのデプロイメントには、4つの主要なステップがあります：
1. FoundationDBCluster CRDsを作成する。  
2. fdb-kubernetes-operatorサービスをデプロイする。  
3. FoundationDBクラスターをデプロイする。  
4. FoundationDBステータスを確認する。  

### ステップ1：FoundationDBCluster CRDsを作成

```shell
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```
### ステップ 2: fdb-kubernetes-operator サービスをデプロイする

fdb-kubernetes-operator リポジトリは、IPモードでFoundationDBクラスターを設定するためのデプロイメントサンプルを提供しています。Doris-operatorリポジトリは`FQDN`モードでのFoundationDBクラスターデプロイメント例を提供しており、必要に応じてダウンロードできます。

1. デプロイメントサンプルをダウンロードする：

   - fdb-kubernetes-operator公式リポジトリから：
     fdb-kubernetes-operatorはデフォルトでFoundationDBをIPモードでデプロイします。YAML形式の[デフォルトデプロイメント設定](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml)をダウンロードできます。FQDNモードを使用してデプロイしたい場合は、カスタマイズのために[公式ドキュメントのDNSセクション](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns)を参照してください。

     ```shell
     wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
     ```
- doris-operatorリポジトリから：

     doris-operatorリポジトリは、fdb-kubernetes-operatorバージョン1.46.0に基づくデプロイメント例を提供します。これらの例は、FoundationDBクラスターをデプロイするために直接使用できます。

     ```shell
     wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
     ```
2. fdb-kubernetes-operator サービスをデプロイします：

   fdb-kubernetes-operator デプロイメント YAML をカスタマイズした後、以下のコマンドを使用して `fdb-kubernetes-operator` をデプロイします：

   ```shell
   kubectl apply -f fdb-operator.yaml
   ```
期待される結果:

   ```shell
   serviceaccount/fdb-kubernetes-operator-controller-manager created
   clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
   clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
   rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
   clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
   deployment.apps/fdb-kubernetes-operator-controller-manager created
   ```
### ステップ3: FoundationDBクラスターをデプロイする

FoundationDBのデプロイメント例は、fdb-kubernetes-operatorリポジトリで利用できます。これらを直接ダウンロードして使用することができます。

1. FoundationDB公式ウェブサイトからIPモードデプロイメントサンプルをダウンロードします：

   ```shell
   wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
   ```
2. カスタマイズされたデプロイメントの例:

   - Docker Hubにアクセス可能な環境の場合:

     公式サイトが提供する[User Manual](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md)に従って最終的なデプロイメント状態をカスタマイズしてください。FQDNデプロイメントを使用する場合は、`routing.useDNSInClusterFile`フィールドをtrueに設定し、以下のように設定してください:

     Doris Operatorの公式リポジトリでは、[FQDN](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-sethostnameasfqdn-field)を使用してFoundationDBをデプロイするためのサンプルを提供しており、[こちら](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/)から直接ダウンロードできます。

     ```yaml
     spec:
       routing:
       useDNSInClusterFile: true
     ```
- プライベートネットワークの場合：

     環境がDocker Hubに直接アクセスできない場合は、公式FoundationDBリポジトリから必要なイメージをダウンロードし、プライベートレジストリにプッシュしてください。  
     fdb-kubernetes-operatorは以下のDockerイメージに依存しています：[foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator)、[foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar)。

     FoundationDBイメージには以下が含まれます：[foundationdb/fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags)。

     イメージをプライベートレジストリにプッシュした後、公式のfdb-kubernetes-operatorドキュメントに従って[イメージ設定をカスタマイズ](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image)してください。
     
     プライベートレジストリのイメージ設定を追加する設定例：

     ```yaml
     spec:
       mainContainer:
         imageConfigs:
         - baseImage: foundationdb/fdb-kubernetes-monitor
           tag: 7.1.38
       sidecarContainer:
         imageConfigs:
         - baseImage: foundationdb/fdb-kubernetes-monitor
           tag: 7.1.38
       version: 7.1.38
     ```
Doris Operatorリポジトリは、FoundationDBに対して4つのデプロイメント設定を提供しています：[最小単一レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml)、[最小2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml)、[本番グレード2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml)、[プライベートイメージレジストリを使用する本番グレード2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml)。

:::tip ヒント
- FoundationDBをデプロイする際は、FoundationDBClusterリソースの`.spec.version`を設定する必要があります。
- FoundationDBがfdb-kubernetes-operatorベースでデプロイされる場合、本番環境の高可用性要件を満たすために最低3台のホストが必要です。
:::

### ステップ4：FoundationDBステータスの確認

fdb-kubernetes-operator経由でFoundationDBをデプロイした後、以下のコマンドでFoundationDBクラスターのステータスを確認します：

```shell
kubectl get fdb
```
期待される結果は以下の通りです。`AVAILABLE`が`true`の場合、クラスターは利用可能です：

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```
## FoundationDBアクセス情報を含むConfigMapの取得
fdb-kubernetes-operatorを使用してFoundationDBをデプロイする場合、FoundationDBがデプロイされる名前空間に、FoundationDBのアクセス情報を含む特定のConfigMapが作成されます。このConfigMapの名前は、FoundationDBデプロイメントのリソース名に"-config"が付加されたものになります。以下のコマンドを使用してConfigMapを表示してください：

```shell
kubectl get configmap
```
期待される出力:

```shell
test-cluster-config   5      15d
```
