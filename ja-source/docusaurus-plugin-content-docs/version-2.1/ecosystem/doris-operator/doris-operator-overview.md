---
{
  "title": "Doris Kubernetes Operator",
  "language": "ja",
  "description": "Kubernetes Operator（Doris Operatorと呼ばれる）は、DorisをKubernetes上で効率的にデプロイ・運用したいというユーザーの需要を満たすために生まれました。"
}
---
[Kubernetes Operator](https://github.com/apache/doris-operator)（Doris Operatorと呼ばれます）は、KubernetesプラットフォームでのDorisの効率的なデプロイメントと運用に対するユーザーの需要に応えるために生まれました。
ネイティブKubernetesリソースの複雑な管理機能を統合し、Dorisコンポーネント間の分散協調、ユーザークラスター形態のオンデマンドカスタマイズ、その他の体験を統合することで、ユーザーにより簡潔で効率的かつ使いやすいコンテナ化デプロイメントソリューションを提供します。
KubernetesでのDorisの効率的な管理と制御の実現を目指し、強力な機能と柔軟な設定機能を提供しながら、ユーザーの運用保守管理と学習コストの削減を支援します。

Doris OperatorはKubernetes CustomResourceDefinitions (CRD)に基づいて、KubernetesプラットフォームでのDorisの設定、管理、スケジューリングを実装します。Doris Operatorは、ユーザーが定義した望ましい状態に応じて、自動的にPodやその他のリソースを作成してサービスを開始できます。自動登録メカニズムにより、開始されたすべてのサービスを完全なDorisクラスターに統合できます。この実装により、本番環境で不可欠な操作であるDorisクラスターでの設定情報の処理、ノード発見と登録、アクセス通信、ヘルスチェックの複雑性と学習コストが大幅に削減されます。

## Doris Operatorアーキテクチャ

Doris Operatorの設計は、2層スケジューラーの原則に基づいています。各コンポーネントの第1層スケジューリングは、ネイティブのStatefulSetとServiceリソースを使用して対応するPodサービスを直接管理し、パブリッククラウド、プライベートクラウド、自己構築Kubernetesプラットフォームを含むオープンソースKubernetesクラスターとの完全な互換性を実現します。

Doris Operatorが提供するデプロイメント定義に基づいて、ユーザーはDorisデプロイメント状態をカスタマイズし、KubernetesのKubectl管理コマンドを通じてKubernetesクラスターに送信できます。Doris Operatorは、カスタマイズされた状態に応じて各サービスのデプロイメントをStatefulSetとその関連リソース（Serviceなど）に変換し、StatefulSetを通じて望ましいPodをスケジュールします。Dorisクラスターの最終状態を抽象化することで、StatefulSet仕様の不要な設定を簡素化し、ユーザーの学習コストを削減します。

## 主要機能

- **最終状態デプロイメント**：

  Kubernetesは最終状態運用保守モードを使用してサービスを管理し、Doris OperatorはDorisクラスターを記述できるリソースタイプ - DorisClusterを定義します。ユーザーは関連ドキュメントと使用例を参照して、必要なクラスターを簡単に設定できます。
  ユーザーはKubernetesコマンドラインツールkubectlを通じて設定をKubernetesクラスターに送信できます。Doris Operatorは必要なクラスターを自動的に構築し、対応するリソースにクラスター状態をリアルタイムで更新します。このプロセスにより、クラスターの効率的な管理と監視が保証され、運用保守操作が大幅に簡素化されます。

- **拡張が容易**：

  Doris Operatorは、クラウドディスクベース環境での並行リアルタイム水平拡張をサポートします。Dorisのすべてのコンポーネントサービスは、KubernetesのStatefulSetを通じてデプロイおよび管理されます。デプロイメントまたは拡張時に、PodはStatefulSetのParallelモードを使用して作成されるため、理論上すべてのレプリカがノード起動にかかる時間内で開始できます。各レプリカの起動は相互に干渉せず、サービスの起動が失敗した場合でも、他のサービスの起動は影響を受けません。
  Doris Operatorは並行モードを使用してサービスを開始し、分散アーキテクチャを内蔵しているため、サービス拡張のプロセスが大幅に簡素化されます。ユーザーはレプリカ数を設定するだけで簡単に拡張を完了でき、運用保守操作の複雑性から完全に解放されます。

- **感知されない変更**：

  分散環境では、サービスの再起動によりサービスの一時的な不安定が生じる可能性があります。特に安定性に極めて高い要件を持つデータベースなどのサービスの場合、再起動プロセス中のサービスの安定性をいかに確保するかは非常に重要なテーマです。DorisはKubernetes上で以下の3つのメカニズムを使用してサービス再起動プロセスの安定性を確保し、再起動およびアップグレードプロセス中にビジネスに対して感知されない体験を実現します。

  1. Graceful exit
  2. Rolling restart
  3. クエリ割り当ての能動的停止

- **ホストシステム設定**：

  一部のシナリオでは、Apache Dorisの理想的なパフォーマンスを実現するためにホストシステムパラメータを設定する必要があります。コンテナ化シナリオでは、ホストデプロイメントの不確実性とパラメータ変更の難しさがユーザーに課題をもたらします。この問題を解決するため、Doris OperatorはKubernetesの初期化コンテナを使用してホストパラメータを設定可能にします。
  Doris Operatorにより、ユーザーはホスト上で実行されるコマンドを設定し、初期化コンテナによってそれらを有効にできます。可用性を向上させるため、Doris OperatorはKubernetes初期化コンテナの設定方法を抽象化し、ホストコマンドの設定をより簡潔で直感的にします。

- **永続的設定**：

  Doris OperatorはKubernetes StorageClassモードを使用して各サービスにストレージ設定を提供します。ユーザーはマウントディレクトリをカスタマイズできます。起動設定をカスタマイズする際、ストレージディレクトリが変更された場合、そのディレクトリをカスタムリソース内で永続的な場所として設定でき、サービスがコンテナ内の指定されたディレクトリを使用してデータを保存できます。

- **ランタイムデバッグ**：

  コンテナ化サービスのTrouble Shootingにおける最大の課題の一つは、ランタイムでのデバッグ方法です。可用性と使いやすさを追求しながら、Doris Operatorは問題の特定により便利な条件も提供します。Dorisの基本イメージには、問題特定のための様々なツールが事前設定されています。リアルタイムで状態を表示する必要がある場合、kubectlが提供するexecコマンドを通じてコンテナに入り、内蔵ツールを使用してトラブルシューティングできます。
  不明な理由でサービスを開始できない場合、Doris OperatorはDebug実行モードを提供します。PodがDebug起動モードに設定された場合、コンテナは自動的に実行状態に入ります。この時、`exec`コマンドを通じてコンテナに入り、手動でサービスを開始して問題を特定できます。詳細については、[このドキュメント](../../install/deploy-on-kubernetes/cluster-operation.md#How-to-enter-the-container-when-the-pod-crashes)を参照してください。

## 互換性

Doris Operatorは標準K8s仕様に従って開発されており、主要クラウドベンダーが提供するもの、標準に基づく自己構築K8sプラットフォーム、ユーザー構築プラットフォームを含むすべての標準K8sプラットフォームと互換性があります。

### クラウドベンダー互換性

主要クラウドベンダーのコンテナ化サービスプラットフォームと完全に互換性があります。Doris Operatorの環境準備と使用推奨事項については、以下のドキュメントを参照してください：

- [Alibaba Cloud](./on-alibaba)

- [AWS](./on-aws)

## インストールと管理

### 前提条件

デプロイメント前に、ホストシステムの確認が必要です。[オペレーティングシステムチェック](../../install/preparation/os-checking.md)を参照してください。

### Doris Operatorのデプロイ

KubernetesでDoris Operatorをデプロイする前に、Doris Operator CRDをインストールする必要があります。

* 詳細なインストールドキュメントについては、[Doris Operatorインストール](../../install/deploy-on-kubernetes/install-doris-operator.md)を参照してください。

### Dorisクラスターのデプロイ

* クラスター設定ドキュメントについては、[Doris Operatorクラスター設定](../../install/deploy-on-kubernetes/install-config-cluster.md)を参照してください。
* インストールドキュメントについては、[Dorisクラスターインストール](../../install/deploy-on-kubernetes/install-doris-cluster.md)を参照してください。

### クラスター運用保守

* クラスター運用保守ドキュメントについては、[Doris Operatorクラスター運用](../../install/deploy-on-kubernetes/cluster-operation.md)を参照してください。
* クラスターアクセスドキュメントについては、[Doris Operatorクラスターアクセス](../../install/deploy-on-kubernetes/access-cluster.md)を参照してください。
