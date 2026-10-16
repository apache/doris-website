---
{
    "title": "Doris Operator のリソースモデル",
    "sidebar_label": "リソースモデル",
    "language": "ja",
    "description": "DorisCluster と DorisDisaggregatedCluster のリソースモデル、および Doris のコンポーネントと StatefulSet、Service、PVC、ConfigMap、Secret、HPA の対応関係を説明します。",
    "keywords": ["Doris Operator リソースモデル", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Doris Operator のリソースモデルは、Doris クラスターのコンポーネントが Kubernetes の標準リソースにどのように対応するかを示します。この対応関係を理解すると、各フィールドがどのリソースに影響するか判断しやすくなり、問題の調査にも役立ちます。

この文書では、すべてのフィールドは列挙しません。フィールドごとの設定については、対応するデプロイと設定の文書を参照してください。

## 最小構成の例

次の例は、最小構成の `DorisCluster` を示します。FE と BE は、それぞれに対応する `StatefulSet`、`Service`、PVC および関連リソースにマッピングされます。

```yaml
apiVersion: doris.apache.com/v1
kind: DorisCluster
metadata:
  name: demo
  namespace: doris
spec:
  feSpec:
    replicas: 3
    image: apache/doris:fe-2.1.8
  beSpec:
    replicas: 3
    image: apache/doris:be-2.1.8
```

## 概要

どのデプロイモードでも、ユーザーが直接管理するのは Doris のカスタムリソースです。Operator はそのリソースを使って Kubernetes の標準リソースを作成し、それらのリソースが Doris のコンポーネントを実行します。

![Doris Operator のリソースモデルの概要](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster

`DorisCluster` はストレージ・コンピュート一体型のデプロイに使います。通常、FE、BE、CN、Broker のコンポーネントを含みます。

![DorisCluster のリソースモデル](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| コンポーネント | 説明 | 主な Kubernetes リソース |
| --- | --- | --- |
| FE | メタデータの管理、SQL アクセス、クエリの調整 | `StatefulSet`、内部 Service、外部 Service、PVC |
| BE | データの保存と処理の実行 | `StatefulSet`、内部 Service、外部 Service、PVC |
| CN | コンピュートリソースを柔軟に増減する場合の処理の実行 | `StatefulSet`、内部 Service、外部 Service、PVC、HPA |
| Broker | 外部ストレージへのアクセスを仲介するプロキシ。必要かどうかは Doris のバージョンとワークロードによって異なります | `StatefulSet`、内部 Service |

## DorisDisaggregatedCluster

`DorisDisaggregatedCluster` はストレージ・コンピュート分離型のデプロイに使います。通常、MetaService、FE、および一つ以上の ComputeGroup を含みます。

![DorisDisaggregatedCluster のリソースモデル](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| コンポーネント | 説明 | 主な Kubernetes リソース |
| --- | --- | --- |
| MetaService | ストレージ・コンピュート分離型クラスターのメタデータサービス | `StatefulSet`、Service、PVC |
| FE | SQL アクセス、クエリの調整、メタデータにアクセスするためのエントリーポイント | `StatefulSet`、内部 Service、外部 Service、PVC |
| ComputeGroup | コンピュートタスクを実行するための独立したコンピュートリソースグループ | `StatefulSet`、内部 Service、外部 Service、PVC |
| FoundationDB | ストレージ・コンピュート分離型クラスターのメタデータに必要な依存サービス | 外部サービス、または `fdb-kubernetes-operator` による管理 |

## Service の種類

Doris Operator は用途に応じて Service を作成します。

| Service の種類 | 目的 | 一般的な用途 |
| --- | --- | --- |
| 内部 Service | 安定したネットワーク上の識別名と内部通信 | StatefulSet の DNS、コンポーネントの検出、Pod 間のアクセス |
| 外部 Service | 外部からのアクセス用エントリーポイント | クライアントの接続、外部システムからのアクセス |

通常、内部 Service は業務アプリケーションのアクセスポイントではありません。外部 Service は、用途に応じて `ClusterIP`、`NodePort`、または `LoadBalancer` として設定できます。

## ストレージ

Doris はステートフルなシステムです。FE、BE、CN、MetaService、ComputeGroup はいずれも永続ディレクトリを必要とする場合があります。Operator は PVC テンプレートを通じて永続ストレージを割り当てます。

次の点に注意してください。

- Kubernetes クラスターで利用可能な StorageClass があるか。
- データとログの増加に対して PVC の容量が十分か。
- アクセスモードがワークロードに適しているか。
- 設定した Doris のディレクトリと PVC のマウントパスが一致しているか。

PVC をバインドできない場合、Operator は待機し続け、影響を受ける Pod は起動できません。

## 設定と認証のリソース

Doris Operator は、設定と機密データのために `ConfigMap` と `Secret` をサポートします。

| リソース | 主な用途 |
| --- | --- |
| `ConfigMap` | FE、BE、CN、Broker、MetaService、ComputeGroup の起動時の設定 |
| `Secret` | パスワード、アクセス認証情報、keytab |
| `authSecret` | ノードの登録、デコミッション、および関連する管理操作で Doris Operator が使用する認証情報 |
| `kerberosInfo` | Kerberos の設定と keytab のマウント |
| `serviceAccount` | コンポーネントがクラウドサービスや外部サービスにアクセスする際に使用する Kubernetes ServiceAccount |

設定の更新によって再起動が発生するかどうかは、フィールドと Operator の設定によって異なります。たとえば、ストレージ・コンピュート一体型モードでは、`enableRestartWhenConfigChange` が主要な ConfigMap の変更によってローリング再起動を開始するかどうかを制御します。

## 命名

通常、Operator が管理するリソースの名前には、クラスター名とコンポーネント名がプレフィックスとして付くため、どのクラスターに属するか識別しやすくなります。

ストレージ・コンピュート一体型クラスターの名前が `demo` の場合、一般的な名前は次のようになります。

```text
demo-fe
demo-fe-internal
demo-fe-service
demo-be
demo-be-internal
demo-be-service
demo-cn
demo-cn-internal
demo-cn-service
demo-broker
demo-broker-internal
```

ストレージ・コンピュート分離型クラスターの名前が `demo` で、ComputeGroup の名前が `adhoc-query` の場合、一般的な名前は次のようになります。

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

実際の名前は、バージョンや設定によって多少異なる場合があります。`kubectl get` の出力を正しい情報として扱ってください。

## コンポーネント間の依存関係

リソースモデルからは、コンポーネント間の依存関係も分かります。

ストレージ・コンピュート一体型クラスターでは、FE が、ほかのコンポーネントが自身を登録し、Doris のメタデータにアクセスするためのエントリーポイントになります。

![DorisCluster のコンポーネント間の依存関係](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

ストレージ・コンピュート分離型クラスターでは、まず MetaService が準備完了となり、FE は MetaService に依存し、ComputeGroup は FE に依存します。

![DorisDisaggregatedCluster のコンポーネント間の依存関係](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

上流のコンポーネントの準備ができていない場合、下流のコンポーネントは待機や Reconcile 処理を続けることがあります。これは想定された動作です。作成や変更の実行順序については、[Doris Operator のライフサイクル管理](./lifecycle)を参照してください。
