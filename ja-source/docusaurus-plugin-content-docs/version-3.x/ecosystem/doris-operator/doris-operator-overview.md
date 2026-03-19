---
{
  "title": "Doris Kubernetes Operator",
  "language": "ja",
  "description": "Kubernetes Operator（Doris Operatorと呼ばれる）は、DorisをKubernetes上で効率的にデプロイおよび運用したいというユーザーの需要を満たすために生まれました"
}
---
[Kubernetes Operator](https://github.com/apache/doris-operator)（Doris Operatorと呼ばれます）は、KubernetesプラットフォームでDorisを効率的にデプロイし運用したいというユーザーの需要に応えるために誕生しました。
ネイティブなKubernetesリソースの複雑な管理機能を統合し、Dorisコンポーネント間の分散協調、ユーザークラスタ形態のオンデマンドカスタマイゼーション、その他のエクスペリエンスを統合して、よりシンプルで効率的かつ使いやすいコンテナ化デプロイソリューションをユーザーに提供します。
KubernetesでのDorisの効率的な管理と制御を実現し、強力な機能と柔軟な構成機能を提供しながら、ユーザーの運用保守管理と学習コストの削減を支援することを目的としています。

Doris OperatorはKubernetes CustomResourceDefinitions（CRD）に基づいて、KubernetesプラットフォームでのDorisの構成、管理、スケジューリングを実装します。Doris Operatorはユーザー定義の望ましい状態に従って自動的にPodやその他のリソースを作成してサービスを開始できます。自動登録メカニズムにより、開始されたすべてのサービスを完全なDorisクラスタに統合できます。この実装により、本番環境で不可欠な運用であるDorisクラスタでの構成情報の処理、ノード発見と登録、アクセス通信、ヘルスチェックの複雑さと学習コストが大幅に削減されます。

## Doris Operator アーキテクチャ

Doris Operatorの設計は二層スケジューラの原理に基づいています。各コンポーネントの第一層スケジューリングはネイティブなStatefulSetとServiceリソースを使用して対応するPodサービスを直接管理し、これによりパブリッククラウド、プライベートクラウド、自前構築のKubernetesプラットフォームを含むオープンソースKubernetesクラスタと完全に互換性があります。

Doris Operatorが提供するデプロイメント定義に基づいて、ユーザーはDorisデプロイメント状態をカスタマイズし、KubernetesのkubectlコマンドによってKubernetesクラスタに送信できます。Doris Operatorはカスタマイズされた状態に従って各サービスのデプロイメントをStatefulSetとその関連リソース（Serviceなど）に変換し、StatefulSetを通じて望ましいPodをスケジューリングします。Dorisクラスタの最終状態を抽象化することでStatefulSet仕様の不要な構成を簡素化し、ユーザーの学習コストを削減します。

## 主要機能

- **最終状態デプロイメント**：

  Kubernetesは最終状態運用保守モードを使用してサービスを管理し、Doris OperatorはDorisクラスタを記述できるリソースタイプであるDorisClusterを定義します。ユーザーは関連ドキュメントと使用例を参照して必要なクラスタを簡単に構成できます。
  ユーザーはKubernetesコマンドラインツールkubectlを通じて構成をKubernetesクラスタに送信できます。Doris Operatorは必要なクラスタを自動的に構築し、クラスタの状態を対応するリソースにリアルタイムで更新します。このプロセスにより、クラスタの効率的な管理と監視が保証され、運用保守作業が大幅に簡素化されます。

- **拡張が容易**：

  Doris Operatorはクラウドディスクベース環境での並行リアルタイム水平拡張をサポートします。DorisのすべてのコンポーネントサービスはKubernetesのStatefulSetを通じてデプロイおよび管理されます。デプロイまたは拡張時には、StatefulSetのParallelモードを使用してPodが作成されるため、理論的にはすべてのレプリカがノード開始にかかる時間内で開始できます。各レプリカの開始は互いに干渉せず、サービスの開始に失敗した場合でも、他のサービスの開始には影響しません。
  Doris Operatorは並行モードを使用してサービスを開始し、分散アーキテクチャが組み込まれているため、サービス拡張のプロセスが大幅に簡素化されます。ユーザーはレプリカ数を設定するだけで拡張を簡単に完了でき、運用保守作業の複雑さから完全に解放されます。

- **目立たない変更**：

  分散環境では、サービスの再起動によりサービスの一時的な不安定性が生じる可能性があります。特に安定性への要求が極めて高いデータベースなどのサービスにとって、再起動プロセス中にサービスの安定性を確保する方法は非常に重要なテーマです。DorisはKubernetes上で以下の三つのメカニズムを使用してサービス再起動プロセスの安定性を保証し、再起動とアップグレードプロセス中にビジネスに対して感知されないエクスペリエンスを実現します。

  1. Graceful exit
  2. Rolling restart
  3. クエリ割り当ての積極的停止

- **ホストシステム構成**：

  一部のシナリオでは、Apache Dorisの理想的なパフォーマンスを実現するためにホストシステムパラメータを構成する必要があります。コンテナ化シナリオでは、ホストデプロイメントの不確実性とパラメータ変更の困難さがユーザーに課題をもたらします。この問題を解決するため、Doris OperatorはKubernetesの初期化コンテナを使用してホストパラメータを構成可能にします。
  Doris Operatorはユーザーがホストで実行されるコマンドを構成し、初期化コンテナによってそれらを有効にできるようにします。可用性を向上させるため、Doris OperatorはKubernetes初期化コンテナの構成方法を抽象化し、ホストコマンドの設定をよりシンプルで直感的にします。

- **永続構成**：

  Doris OperatorはKubernetes StorageClassモードを使用して各サービスにストレージ構成を提供します。ユーザーがマウントディレクトリをカスタマイズできるようにします。起動構成をカスタマイズする際、ストレージディレクトリが変更された場合、そのディレクトリをカスタムリソースの永続場所として設定でき、サービスがコンテナ内の指定されたディレクトリを使用してデータを保存するようになります。

- **ランタイムデバッグ**：

  コンテナ化サービスでのTrouble Shootingにおける最大の課題の一つは、ランタイムでのデバッグ方法です。可用性と使いやすさを追求しながら、Doris Operatorは問題の特定により便利な条件も提供します。Dorisの基本イメージには、問題特定のための様々なツールがあらかじめ設定されています。リアルタイムで状態を確認する必要がある場合、kubectlが提供するexecコマンドを通じてコンテナに入り、組み込みツールを使用してトラブルシューティングができます。
  不明な理由でサービスを開始できない場合、Doris OperatorはDebug実行モードを提供します。PodがDebug起動モードに設定されている場合、コンテナは自動的に実行状態に入ります。このとき、`exec`コマンドを通じてコンテナに入り、手動でサービスを開始して問題を特定できます。詳細については、[このドキュメント](../../install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation.md#How-to-enter-the-container-when-the-pod-crashes)を参照してください。

## 互換性

Doris Operatorは標準K8s仕様に従って開発されており、主流クラウドベンダーが提供するもの、標準に基づく自前構築K8sプラットフォーム、ユーザー構築プラットフォームを含む、すべての標準K8sプラットフォームと互換性があります。

### クラウドベンダー互換性

主流クラウドベンダーのコンテナ化サービスプラットフォームと完全互換です。Doris Operatorの環境準備と使用提案については、以下のドキュメントを参照してください：

- [Alibaba Cloud](./on-alibaba)

- [AWS](./on-aws)

## インストールと管理

### 前提条件

デプロイメント前に、ホストシステムをチェックする必要があります。[オペレーティングシステムチェック](../../install/preparation/os-checking.md)を参照してください。

### Doris Operatorのデプロイ

詳細については、[Compute-Storage Coupled](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md)または[Compute-Storage Decoupled](../../install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md)のDoris Operatorインストールドキュメントを参照してください。
