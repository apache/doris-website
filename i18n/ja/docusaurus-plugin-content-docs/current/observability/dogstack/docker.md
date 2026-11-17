---
{
    "title": "Docker Compose でデプロイ",
    "sidebar_label": "Docker Compose でデプロイ",
    "language": "ja",
    "description": "Docker Compose を使用して単一ホストに DOG Stack をデプロイする方法を説明します。内蔵の Doris または既存の Doris クラスターを使用して、OpenTelemetry Collector、Apache Doris、Doris App plugin を備えた Grafana を起動する手順と、デプロイの確認、アクセス、クリーンアップの方法を紹介します。",
    "keywords": [
        "DOG Stack のデプロイ",
        "Docker Compose",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Doris App plugin",
        "オブザーバビリティ"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack single-host deployment -->

この記事では、Docker Compose を使用して単一ホストに DOG Stack をデプロイする方法を説明します。このデプロイでは、OpenTelemetry Collector、Doris App plugin を備えた Grafana、およびオプションの一体型 Doris を起動します。ローカルでのテスト、開発、PoC に適しています。本番環境または Kubernetes 環境については、[Kubernetes でのデプロイ](./kubernetes.md)を参照してください。

:::tip
Docker を使わずに各コンポーネントをデプロイする場合は、[Doris のデプロイドキュメント](https://doris.apache.org/docs/4.x/install/preparation/env-checking)、[OpenTelemetry Collector のインストールドキュメント](https://opentelemetry.io/docs/collector/install/)、[Grafana のインストールドキュメント](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)を参照してください。
:::

このガイドは、AI Observe Stack のコミット [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949) に基づいて確認されています。以下のチェックアウト手順ではこのリビジョンを固定し、その後の main ブランチの変更によってパラメーターが変わらないようにしています。内蔵 Doris のイメージは `4.0.3-all-slim` で、スタックの接続確認を目的としています。

## 前提条件 {#prerequisites}

- Docker Engine 20.10 以降
- Docker Compose 2.0 以降

## デプロイ {#deployment}

1. リポジトリをクローンします。

   ```Bash
   git clone https://github.com/ai-observe/ai-observe-stack.git
   cd ai-observe-stack
   git checkout 2c1fbee831701178c7dddba857e88130ef292949
   cd docker
   ```

2. サービスを起動します。次のいずれかのモードを選択してください。

   - **内蔵 Doris**：一体型 Doris、OpenTelemetry Collector、Grafana を起動します。

     ```Bash
     docker compose up -d
     ```

   - **既存の Doris**：OpenTelemetry Collector と Grafana のみを起動し、既存の Doris クラスターにデータを書き込みます。まず設定ファイルを作成します。

     ```Bash
     cp .env.example .env
     ```

     `.env` の Doris 接続設定を編集します。

     ```Bash
     DORIS_FE_HTTP_ENDPOINT=http://<DORIS_FE_HOST>:8030
     DORIS_FE_MYSQL_ENDPOINT=<DORIS_FE_HOST>:9030
     DORIS_USERNAME=root
     DORIS_PASSWORD=
     ```

     次に、サービスを起動します。

     ```Bash
     docker compose -f docker-compose-without-doris.yaml up -d
     ```

     このアカウントには、対象のデータベースとテーブルの作成、データロード、Grafana が使用するテーブルへのクエリを実行できる権限が必要です。OpenTelemetry Collector は、`otel` データベースとそのテーブルを自動的に作成します。

     OpenTelemetry Collector は Stream Load を通じてデータを書き込みます。FE は各リクエストを、BE が Doris に登録したアドレス（`SHOW BACKENDS` で確認可能）にリダイレクトします。そのため、OpenTelemetry Collector コンテナーからは FE に加えて、BE のアドレスと BE の HTTP ポート（デフォルトは 8040）にもアクセスできる必要があります。

3. サービスが稼働していることを確認します。

   ```Bash
   docker compose ps
   ```

   既存の Doris を使用するモードでは、`-f docker-compose-without-doris.yaml` を追加します。すべてのサービスの `STATUS` 列に `Up` と表示されるはずです。内蔵 Doris を使用する場合、OpenTelemetry Collector は Doris のヘルスチェックが成功してから起動します。

4. http://localhost:3000 を開き、`admin` / `admin` で Grafana にログインします。

## サービスのエンドポイント {#service-endpoints}

| サービス | エンドポイント | 認証情報 |
| --- | --- | --- |
| Grafana | http://localhost:3000 | admin / admin |
| OTLP gRPC | localhost:4317 | - |
| OTLP HTTP | localhost:4318 | - |
| OpenTelemetry Collector のヘルスチェック | http://localhost:13133 | - |
| Doris FE Web UI（内蔵 Doris のみ） | http://localhost:8030 | root / 空のパスワード |
| Doris MySQL プロトコル（内蔵 Doris のみ） | localhost:9030 | root / 空のパスワード |

OpenTelemetry SDK を組み込んだアプリケーションは、`localhost:4317`（gRPC）または `localhost:4318`（HTTP）にデータを送信します。

## 停止とクリーンアップ {#stop-and-clean-up}

サービスを停止し、データを保持します。

```Bash
docker compose down
```

サービスを停止し、すべてのデータを削除します。

```Bash
docker compose down -v
```

既存の Doris を使用するモードでは、両方のコマンドに `-f docker-compose-without-doris.yaml` を追加します。既存の Doris クラスター内のデータは削除されません。
