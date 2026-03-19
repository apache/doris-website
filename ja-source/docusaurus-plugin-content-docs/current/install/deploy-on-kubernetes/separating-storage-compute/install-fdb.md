---
{
  "title": "FoundationDBをインストールする",
  "language": "ja",
  "description": "FoundationDBは、Apache 2.0ライセンスの下でリリースされたオープンソースの分散データベースであり、構造化データストレージに対して強い一貫性を提供します。"
}
---
FoundationDBは、Apache 2.0ライセンスでリリースされたオープンソース分散データベースで、構造化データストレージに強い一貫性を提供します。Dorisのコンピュート・ストレージ分離モデルでは、FoundationDBがメタデータストアとして使用され、meta-serviceコンポーネントがFoundationDB内のメタデータを管理します。Kubernetes上でコンピュート・ストレージ分離クラスターをデプロイする際は、事前にFoundationDBをデプロイする必要があります。以下の2つのデプロイメント方法を推奨します：
- 仮想マシン（物理マシンを含む）上に直接FoundationDBをデプロイする
- [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)を使用してKubernetes上にFoundationDBをデプロイする

VMデプロイメントについては、Dorisの[コンピュート・ストレージ分離ドキュメントのデプロイ前セクション](../../../compute-storage-decoupled/before-deployment)を参照してFoundationDBクラスターを設定してください。デプロイ前に、DorisのKubernetesクラスターからFoundationDBにアクセス可能であることを確認してください。つまり、KubernetesノードはFoundationDBがデプロイされているマシンと同じサブネット上に配置される必要があります。

## Kubernetes上でFoundationDBをデプロイする
Kubernetes上でのFoundationDBクラスターのデプロイメントには、主に4つのステップがあります：
1. FoundationDBCluster CRDsを作成する
2. fdb-kubernetes-operatorサービスをデプロイする
3. FoundationDBクラスターをデプロイする
4. FoundationDBのステータスを確認する

### ステップ1：FoundationDBCluster CRDsを作成する

```shell
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```
### ステップ2: fdb-kubernetes-operator serviceをデプロイする

fdb-kubernetes-operatorリポジトリは、IPモードでFoundationDBクラスタを設定するためのデプロイメントサンプルを提供しています。Doris-operatorリポジトリは、必要に応じてダウンロードできる`FQDN`モードでのFoundationDBクラスタデプロイメント例を提供しています。

1. デプロイメントサンプルをダウンロードする:

    - fdb-kubernetes-operator公式リポジトリから:  
      fdb-kubernetes-operatorはデフォルトでFoundationDBをIPモードでデプロイします。YAML形式の[デフォルトデプロイメント設定](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml)をダウンロードできます。FQDNモードを使用してデプロイしたい場合は、カスタマイズについて[公式ドキュメントのDNSセクション](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns)を参照してください。

      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```
- doris-operatorリポジトリから：

      doris-operatorリポジトリは、fdb-kubernetes-operatorバージョン1.46.0に基づくデプロイメント例を提供します。これらの例は、FoundationDBクラスターをデプロイするために直接使用できます。

      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```
2. fdb-kubernetes-operator サービスをデプロイする：

   fdb-kubernetes-operator デプロイメント YAML をカスタマイズした後、以下のコマンドを使用して `fdb-kubernetes-operator` をデプロイします：

   ```shell
   kubectl apply -f fdb-operator.yaml
   ```
期待される結果：

   ```shell
   serviceaccount/fdb-kubernetes-operator-controller-manager created
   clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
   clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
   rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
   clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
   deployment.apps/fdb-kubernetes-operator-controller-manager created
   ```
### ステップ 3: FoundationDB クラスタをデプロイする

FoundationDB のデプロイ例は fdb-kubernetes-operator リポジトリで利用できます。これらを直接ダウンロードして使用することができます。

1. FoundationDB 公式ウェブサイトから IP モードデプロイメントサンプルをダウンロードします：

   ```shell
   wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
   ```
2. カスタマイズされたデプロイメント例:

    - Docker Hubにアクセス可能な環境の場合:

      公式サイトが提供する[User Manual](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md)に従って最終的なデプロイメント状態をカスタマイズしてください。FQDNデプロイメントを使用する場合は、`routing.useDNSInClusterFile`フィールドをtrueに設定し、以下のように構成してください:

      Doris Operatorの公式リポジトリは[FQDN](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-sethostnameasfqdn-field)でFoundationDBをデプロイするサンプルを提供しており、[こちら](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/)から直接ダウンロードできます。

      ```yaml
      spec:
        routing:
        useDNSInClusterFile: true
      ```
- プライベートネットワークの場合：

      環境がDocker Hubに直接アクセスできない場合は、公式のFoundationDBリポジトリから必要なイメージをダウンロードし、プライベートレジストリにpushしてください。  
      fdb-kubernetes-operatorは以下のDockerイメージに依存します：[foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator)、[foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar)。

      FoundationDBイメージには以下が含まれます：[foundationdb/fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor)。

      イメージをプライベートレジストリにpushした後、公式のfdb-kubernetes-operatorドキュメントに従って[イメージ設定をカスタマイズ](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image)してください。

      プライベートレジストリのイメージ設定を追加する設定例：

      ```yaml
      spec:
        mainContainer:
          imageConfigs:
          - baseImage: foundationdb/foundationdb
            tag: 7.1.38
        sidecarContainer:
          imageConfigs:
          - baseImage: foundationdb/foundationdb-kubernetes-sidecar
            tag: 7.1.36-1
        version: 7.1.38
      ```
Doris Operatorリポジトリは、FoundationDBに対して4つのデプロイメント設定を提供しています：[最小限のシングルレプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml)、[最小限の2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml)、[本番グレードの2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml)、[プライベートイメージレジストリを使用した本番グレードの2レプリカデプロイメント](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml)。

:::tip Tip
- FoundationDBをデプロイする際は、FoundationDBClusterリソースの`.spec.version`を設定する必要があります。
- FoundationDBがfdb-kubernetes-operatorベースでデプロイされる場合、本番環境の高可用性要件を満たすために最低3台のホストが必要です。
  :::

### ステップ4：FoundationDBのステータス確認

fdb-kubernetes-operatorを介してFoundationDBをデプロイした後、以下のコマンドでFoundationDBクラスターのステータスを確認します：

```shell
kubectl get fdb
```
期待される結果は以下の通りです。`AVAILABLE`が`true`の場合、クラスターは利用可能です：

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```
## FoundationDBアクセス情報を含むConfigMapの取得
fdb-kubernetes-operatorを使用してFoundationDBをデプロイする際、FoundationDBのアクセス情報を含む特定のConfigMapが、FoundationDBがデプロイされているnamespaceに作成されます。このConfigMapの名前は、FoundationDBデプロイメントのリソース名に「-config」が付加されたものになります。ConfigMapを確認するには、以下のコマンドを使用してください：

```shell
kubectl get configmap
```
期待される出力:

```shell
test-cluster-config   5      15d
```
