---
{
    "title": "デプロイ",
    "sidebar_label": "デプロイ",
    "language": "ja",
    "description": "本番環境に DOG Stack をデプロイする方法を説明します。OpenTelemetry Collector、Apache Doris、Doris App プラグインを備えた Grafana の 3 つの主要コンポーネントについて、デプロイ方法と選択の指針を紹介します。",
    "keywords": [
        "DOG Stack デプロイ",
        "OpenTelemetry Collector",
        "Apache Doris デプロイ",
        "Grafana デプロイ",
        "Doris App プラグイン",
        "Docker Compose",
        "Kubernetes",
        "可観測性"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack production deployment -->

アーキテクチャ図に示すように、DOG Stack はデータ収集ツール、OpenTelemetry Collector、Doris、Doris App プラグインを備えた Grafana の四つのコンポーネントで構成されます。このデプロイガイドでは後者の三つを扱います。データ収集ツールについては、データ収集のドキュメントを参照してください。

DOG Stack には、環境や目的に応じて複数のデプロイ方法があります。



## Docker Compose

ローカルでのテスト、開発、PoC に適しています。

### 前提条件

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)



### デプロイ

1. リポジトリをクローンします。

   `git clone https://github.com/ai-observe/ai-observe-stack.git cd ai-observe-stack/docker`

   

2. すべてのサービスを起動します。

   `docker compose up -d`

   

3. サービスが稼働していることを確認します。

   `docker compose ps`

   すべてのサービスの状態が `running` と表示されるはずです。

   

4. http://localhost:3000 で Grafana にアクセスし、デフォルトの認証情報 `admin` / `admin` でログインします。



### サービスのエンドポイント

| サービス  | エンドポイント        | 認証情報      |
| --------- | --------------------- | ------------- |
| Grafana   | http://localhost:3000 | admin / admin |
| OTel gRPC | localhost:4317        | -             |
| OTel HTTP | localhost:4318        | -             |

### 停止とクリーンアップ

データを保持したままサービスを停止するには、次を実行します。

```Bash
docker compose down
```

サービスを停止し、すべてのデータを削除するには、次を実行します。

```Bash
docker compose down -v
```



## Kubernetes

本番環境へのデプロイ、開発環境、スケール可能な構成に適しています。

### 前提条件

- Kubernetes クラスター (v1.20+)
- Helm (v3.0+)
- クラスターにアクセスできるように設定した kubectl
- PersistentVolume プロビジョナー (データの永続化に使用)

### デプロイ

1. DOG Stack と Doris の Helm リポジトリを追加します。
   
   `helm repo add dogstack https://charts.velodb.io helm repo update`
   
   
   
2. DOG Stack 用の名前空間を作成します。
   
   `kubectl create namespace dogstack`
   
   
   
3. DOG Stack をインストールします。
   
   既存の Doris クラスターを使用する場合は、そのクラスターへの接続方法を指定できます。
   
   `helm install my-dogstack dogstack/dogstack -n dogstack \  --set doris.mode=external \  --set doris.external.host=<DORIS_FE_HOST> \  --set doris.external.port=9030 \  --set doris.external.feHttpPort=8030 \  --set doris.internal.operator.enabled=false`
   
   
   
   新しい Doris クラスターをデプロイする場合は、追加のオプションを指定せずにインストールします。
   
   `helm install my-dogstack dogstack/dogstack -n dogstack`
   
   
   
4. すべての Pod が稼働していることを確認します。
   
   `kubectl get pods -n dogstack`
   
   すべての Pod の状態が `Running` になるまで待ちます。
   
   
   
5. Grafana にアクセスします。
   
   `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack`
   
   http://localhost:3000 を開き、`admin` / `admin` でログインします。



### サービスのエンドポイント

| サービス       | ポート転送コマンド                                               |
| -------------- | ------------------------------------------------------------ |
| Grafana        | `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack` |
| Doris FE UI    | `kubectl port-forward svc/my-dogstack-doris-fe 8030:8030 -n dogstack` |
| Doris MySQL    | `kubectl port-forward svc/my-dogstack-doris-fe 9030:9030 -n dogstack` |

### アンインストール

```Bash
helm uninstall my-dogstack -n dogstack
kubectl delete namespace dogstack
```



## 手動デプロイ

1. Doris の[デプロイに関するドキュメント](https://doris.apache.org/docs/4.x/install/preparation/env-checking)に従って、Doris クラスターをデプロイします。既存の Doris クラスターがある場合は、この手順を省略します。

1. [OpenTelemetry のデプロイに関するドキュメント](https://opentelemetry.io/docs/collector/install/)に従って、OpenTelemetry Collector をデプロイします。

1. [Grafana のデプロイに関するドキュメント](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)に従って、Grafana をデプロイします。

1. ブラウザーで DOG Stack の Web UI を開きます。

http://localhost:3000 にアクセスすると、DOG Stack 内の Grafana UI を開けます。
