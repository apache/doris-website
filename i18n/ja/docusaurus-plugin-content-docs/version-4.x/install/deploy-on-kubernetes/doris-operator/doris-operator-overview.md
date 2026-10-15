---
{
    "title": "Doris Operator の概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris Operator の概念、対象範囲、ユースケース、機能の境界を紹介します。",
    "keywords": ["Doris Operator", "Kubernetes", "DorisCluster", "DorisDisaggregatedCluster", "Kubernetes 上への Doris のデプロイ"]
}
---

[Doris Operator](https://github.com/apache/doris-operator) は、Apache Doris の公式 Kubernetes Operator です。Doris の運用経験と Kubernetes ネイティブのリソース管理を組み合わせ、Kubernetes 上で Doris をより簡単かつ効率的にデプロイ、運用できるようにします。

Doris Operator はカスタムリソース定義（CRD）を通じて Kubernetes API を拡張します。Doris のカスタムリソースを送信すると、Operator は対応する `StatefulSet`、`Service`、`PersistentVolumeClaim` などの Kubernetes リソースを作成、維持します。また、シナリオによってはノードの登録、デコミッション、クリーンアップといった Doris のメタデータレベルの操作も行います。

この文書では、Doris Operator の位置付け、管理対象、利用すべき場面を説明します。まず基本的な仕組みを理解するための文書です。インストールとデプロイの手順については、ストレージ・コンピュート一体型および分離型のデプロイに関する文書を参照してください。

## Doris Operator を使う理由

Kubernetes 上に Doris をデプロイするには、複数のコンポーネント、サービスディスカバリー、設定のマウント、ストレージの割り当て、ノードの登録、スケーリング、ヘルスチェックを連携させる必要があります。クラスターの規模が大きくなったり、環境が複雑になったりすると、これらのリソースを手動で管理する方法では、設定が分散し、運用手順が増え、状態を追跡しにくくなります。

Doris Operator では、Doris のカスタムリソースを使ってクラスターの望ましい状態を宣言的に記述します。Operator は次の機能を提供します。

- クラスターの構成を一つのリソースで記述します。
- `StatefulSet`、`Service`、PVC、および関連リソースを自動的に作成、維持します。
- 依存関係に基づいて、コンポーネントを順序立てて起動、変更します。
- コンポーネントの状態を CR の `status` に集約します。
- 設定変更、スケーリング、ローリングアップデートなどの一般的な操作をサポートします。
- シナリオによっては、Doris のメタデータレベルでノードの登録、デコミッション、クリーンアップを行います。

## 動作の仕組み

Doris Operator は CRD を通じて Kubernetes API を拡張します。`kubectl`、Helm、またはその他のリリースツールを使って Doris のクラスターリソースを送信すると、Operator はそのリソースを監視し、`StatefulSet`、`Service`、`PersistentVolumeClaim` などの Kubernetes 標準リソースに変換します。

![Doris Operator の動作の仕組み](/images/doris-operator/mermaid/01-overview-how-doris-operator-works.jpg)

このモデルでは、ユーザーが望ましい状態を管理し、Operator が実際の状態を継続的にその状態へ近づけます。

## アーキテクチャ

Doris Operator は、コントロールプレーンとデータプレーンの二つの層で捉えられます。コントロールプレーンには、Doris Operator、Reconciler、任意の Webhook ロジック、状態の集約が含まれます。Doris のカスタムリソースを監視し、実際の状態を望ましい状態へ近づけます。データプレーンには、`StatefulSet`、`Service`、PVC、HPA、Doris Pod など、Doris のコンポーネントを実際に動かす Kubernetes 標準リソースが含まれます。

![Doris Operator のアーキテクチャ層](/images/doris-operator/mermaid/02-architecture-layers.jpg)

ユーザーが `kubectl`、Helm、またはその他のリリースツールを使って Doris のカスタムリソースを送信すると、Kubernetes API Server が望ましい状態を保存します。Doris Operator はリソースの変更を監視して Reconcile 処理を実行し、基盤となる Kubernetes リソースを作成または更新します。この階層構造により、多数の低レベルリソースを直接管理する複雑さが軽減され、Doris のデプロイを標準的な Kubernetes プラットフォームに沿って管理できます。

## 対応するクラスターリソース

Doris Operator は主に二種類のクラスターリソースに対応します。

| リソース | デプロイモード | 主なコンポーネント | 代表的なユースケース |
| --- | --- | --- | --- |
| `DorisCluster` | ストレージ・コンピュート一体型 | FE、BE、CN、Broker | よりシンプルな運用モデルによる標準的な Doris クラスターのデプロイ |
| `DorisDisaggregatedCluster` | ストレージ・コンピュート分離型 | MetaService、FE、ComputeGroup | 弾力的なコンピュートグループやコンピュートの分離が必要なワークロード |

- `DorisCluster` はストレージ・コンピュート一体型のデプロイに使います。一つのリソースで、FE、BE、CN、Broker のイメージ、レプリカ数、リソース、ストレージ、設定、アクセス方法を記述できます。
- `DorisDisaggregatedCluster` はストレージ・コンピュート分離型のデプロイに使います。クラスターを MetaService、FE、一つ以上の ComputeGroup に分け、それぞれを個別に設定、運用できます。

## 管理対象のオブジェクト

ユーザーの視点では、Doris Operator は主に次のオブジェクトを管理します。

| オブジェクト | 説明 |
| --- | --- |
| Doris のカスタムリソース | `DorisCluster` や `DorisDisaggregatedCluster` など、クラスターの望ましい状態 |
| `StatefulSet` | Doris コンポーネントの Pod のレプリカ数、安定したネットワーク ID、ローリングアップデート |
| `Service` | 内部通信と外部からのアクセス |
| PVC | 状態を保持するコンポーネント向けの永続ストレージ |
| `ConfigMap` / `Secret` | 設定、認証情報、外部依存関係の情報 |
| HPA | 対応するコンポーネントの自動スケーリング |
| `status` | コンポーネントの状態、可用性、クラスターの健全性 |

## デプロイモードの選択

Kubernetes 上に初めて Doris をデプロイする場合、ほとんどのケースではストレージ・コンピュート一体型モードから始めてください。弾力的なコンピュートグループ、コンピュートの分離、またはオブジェクトストレージに基づくアーキテクチャが明確に必要な場合は、ストレージ・コンピュート分離型モードを選択してください。

| 要件 | 推奨する選択肢 |
| --- | --- |
| 標準的な Doris クラスターをすばやくデプロイする | `DorisCluster` |
| より少ない概念で検証する | `DorisCluster` |
| ワークロードごとに異なるコンピュートリソースを使う | `DorisDisaggregatedCluster` |
| コンピュートをより柔軟にスケーリングする | `DorisDisaggregatedCluster` |
| オブジェクトストレージと FoundationDB の利用をすでに計画している | `DorisDisaggregatedCluster` |

## 機能の範囲

Doris Operator は、Doris クラスターのリソースとライフサイクルの管理に重点を置いています。Doris のデータベースレベルの管理機能を置き換えるものではありません。

次の項目は直接管理しません。

- データベース、テーブル、パーティション、インデックスなどの SQL オブジェクト。
- データのインポート、エクスポート、ワークロードのオーケストレーションポリシー。
- ユーザー権限モデルの設計。
- あらゆる障害からの自動復旧。
- Kubernetes、ストレージ、ネットワークに関するすべての問題の完全な抽象化。

クラスターに異常がある場合は、Operator のステータス、Kubernetes リソースの状態、Doris コンポーネントのログを組み合わせて原因を調べる必要があります。

## 次のステップ

Doris Operator を初めて使う場合は、以下の文書を順番に読んでください。特定の問題を調査している場合は、関連するページに直接進んでください。

| 目的 | 推奨する文書 |
| --- | --- |
| コントロールプレーン、データプレーン、Reconcile モデルを理解する | [Doris Operator のアーキテクチャ](./architecture) |
| Doris のカスタムリソースと `StatefulSet`、`Service`、PVC などの対応関係を理解する | [Doris Operator のリソースモデル](./resource-model) |
| 作成、スケーリング、設定変更、削除時の動作を理解する | [Doris Operator のライフサイクル管理](./lifecycle) |
| 状態フィールドと問題調査の手順を理解する | [Doris Operator の状態とトラブルシューティング](./status-and-troubleshooting) |
