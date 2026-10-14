---
{
    "title": "Langfuse",
    "language": "ja",
    "description": "Apache Doris を分析バックエンドとして使用する Langfuse のデプロイ方法を、設定、Docker Compose によるデプロイ、SDK との連携を含めて説明します。",
    "keywords": [
        "Langfuse",
        "Apache Doris",
        "LLM の可観測性",
        "Langfuse の分析バックエンド"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Use case: LLM application observability / Analytics backend deployment -->

Langfuse は、大規模言語モデルを使用するアプリケーション向けに、トレース追跡、性能評価、プロンプト管理、メトリクス監視を提供するオープンソースの LLM エンジニアリングプラットフォームです。Langfuse on Doris は Apache Doris を分析バックエンドとして使用し、大規模な LLM アプリケーションの可観測性データの処理に適しています。

このドキュメントでは、Apache Doris を基盤とする Langfuse ソリューションをデプロイし、Langfuse SDK、LangChain SDK、LlamaIndex SDK を使用してアプリケーションのトレースを連携する方法を説明します。

## ユースケースと主な機能

<!-- Knowledge type: Feature overview -->
<!-- Use case: Solution selection / Capability evaluation -->

LLM アプリケーションの呼び出しトレースを一元的に記録し、モデルの性能を分析し、プロンプトを管理し、コストと品質を監視したい場合は、Langfuse on Doris を使用できます。アプリケーション側の可観測性には Langfuse を使用し、OLAP 分析データの保存には Apache Doris を使用します。

| 機能 | 利用シーン |
|------|----------|
| トレース追跡 | LLM アプリケーションの呼び出しトレースと実行フローをすべて記録します |
| 性能評価 | モデルの性能を多角的に評価し、品質を分析します |
| プロンプト管理 | プロンプトテンプレートを一元管理し、バージョンを管理します |
| メトリクス監視 | アプリケーションの性能、コスト、品質に関するメトリクスをリアルタイムで監視します |

## アーキテクチャとコンポーネント

<!-- Knowledge type: Architecture description -->
<!-- Use case: Deployment planning / Component understanding -->

Langfuse on Doris はマイクロサービスアーキテクチャを採用しています。Langfuse Web と Worker は、アプリケーションとのやり取り、API 連携、非同期タスクを処理します。PostgreSQL はトランザクションデータ、Redis はキャッシュとキュー、MinIO はオブジェクトストレージをそれぞれ担当します。Doris は、可観測性データの保存とクエリを担う OLAP 分析バックエンドとして機能します。

| コンポーネント | ポート | 説明 |
|------|------|----------|
| Langfuse Web | 3000 | ユーザー操作とデータ取り込みを提供する Web インターフェースおよび API サービス |
| Langfuse Worker | 3030 | データ処理と分析タスクを担当する非同期タスク処理サービス |
| PostgreSQL | 5432 | ユーザー設定とメタデータを保持するトランザクションデータストレージ |
| Redis | 6379 | システムの応答性能を向上させるキャッシュ層およびメッセージキュー |
| MinIO | 9000 | 生イベントとマルチモーダルの添付ファイルを保存するオブジェクトストレージサービス |
| Doris FE | 9030, 8030 | ユーザーリクエストの受信、クエリの解析と計画、メタデータ管理、ノード管理を担当する Doris Frontend |
| Doris BE | 8040, 8050 | データの保存とクエリプランの実行を担当する Doris Backend。データはシャードに分割され、複数のレプリカとして BE に保存されます |

:::note

Apache Doris のデプロイ時には、ハードウェア環境とビジネス要件に応じて、ストレージとコンピュートの一体型アーキテクチャまたは分離型アーキテクチャを選択できます。

Langfuse のデプロイでは、本番環境で Docker 上の Doris を使用することは推奨しません。Docker Compose の例に含まれる Doris FE と Doris BE は、Langfuse on Doris の機能を手早く試すためのものです。

:::

```mermaid
flowchart TB
    User["UI, API, SDKs"]
    subgraph vpc["VPC"]
        Web["Web Server<br/>(langfuse/langfuse)"]
        Worker["Async Worker<br/>(langfuse/worker)"]
        Postgres["Postgres - OLTP<br/>(Transactional Data)"]
        Cache["Redis/Valkey<br/>(Cache, Queue)"]
        Doris["Doris - OLAP<br/>(Observability Data)"]
        S3["S3 / Blob Storage<br/>(Raw events, multi-modal attachments)"]
    end
    LLM["LLM API/Gateway<br/>(optional)"]

    User --> Web
    Web --> S3
    Web --> Postgres
    Web --> Cache
    Web --> Doris
    Web -.->|"optional for playground"| LLM

    Cache --> Worker
    Worker --> Doris
    Worker --> Postgres
    Worker --> S3
    Worker -.->|"optional for evals"| LLM
```

## デプロイ前の確認事項

<!-- Knowledge type: Pre-deployment checks -->
<!-- Use case: Environment validation / Deployment preparation -->

デプロイ前に、ソフトウェアのバージョン、ハードウェアリソース、ネットワーク接続を確認してください。性能と安定性を高めるため、Doris は独立してデプロイすることを推奨します。

### ソフトウェア環境

| コンポーネント | 必要なバージョン | 説明 |
|------|----------|------|
| Docker | 20.0+ | コンテナ実行環境 |
| Docker Compose | 2.0+ | コンテナオーケストレーションツール |
| Apache Doris | 2.1.10+ | 分析用データベース。独立してデプロイする必要があります |

### ハードウェアリソース

| リソースの種類 | 最小要件 | 推奨構成 | 説明 |
|----------|----------|----------|------|
| メモリ | 8 GB | 16 GB+ | 複数のサービスの同時実行を支えます |
| ディスク | 50 GB | 100 GB+ | コンテナデータとログを保存します |
| ネットワーク | 1 Gbps | 10 Gbps | データ転送性能を確保します |

### 前提条件

1. **Doris クラスターの準備**
    - Doris クラスターが正常かつ安定して稼働していることを確認します。
    - FE の HTTP ポート（デフォルトは 8030）とクエリポート（デフォルトは 9030）にネットワーク経由で接続できることを確認します。
    - Langfuse の起動後、必要なデータベースとテーブル構造が Doris に自動作成されます。

2. **ネットワーク接続**
    - デプロイ環境から Docker Hub にアクセスしてイメージを取得できることを確認します。
    - Langfuse サービスから Doris クラスターの関連ポートにアクセスできることを確認します。
    - クライアントから Langfuse Web サービスのポートにアクセスできることを確認します。

:::tip デプロイに関する推奨事項

Web、Worker、Redis、PostgreSQL などの Langfuse サービスコンポーネントは、Docker を使用してデプロイすることを推奨します。性能と安定性を高めるため、Doris は独立してデプロイすることを推奨します。Doris の詳しいデプロイ方法については、公式ドキュメントを参照してください。

:::

## Langfuse サービスの設定

<!-- Knowledge type: Configuration parameters -->
<!-- Use case: Environment variable configuration / Backend connection configuration -->

Langfuse サービスは、環境変数を使用して Doris、PostgreSQL、Redis などのコンポーネントに接続します。特にシークレット、パスワード、サービスのアドレスについては、例の値を実際の環境に合わせて変更してください。

### Doris 分析バックエンドの設定

| パラメータ | 設定例 | 説明 |
|----------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | Doris を分析バックエンドに指定します |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE の HTTP サービスアドレス |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FE のクエリポート |
| `DORIS_DB` | `langfuse` | Doris のデータベース名 |
| `DORIS_USER` | `root` | Doris のユーザー名 |
| `DORIS_PASSWORD` | `123456` | Doris のパスワード |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | データベース接続の最大数 |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | リクエストのタイムアウト（ミリ秒） |

### サービスの基本設定

| パラメータ | 設定例 | 説明 |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | PostgreSQL データベースへの接続アドレス |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | セッションの暗号化に使用する NextAuth の認証シークレット |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | データ暗号化用のソルト。32 文字以上 |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | データ暗号化キー。64 文字 |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Web サービスのアドレス |
| `TZ` | `UTC` | システムのタイムゾーン |

### Redis キャッシュの設定

| パラメータ | 設定例 | 説明 |
|----------|--------|------|
| `REDIS_HOST` | `langfuse-redis` | Redis サービスのホストアドレス |
| `REDIS_PORT` | `6379` | Redis サービスのポート |
| `REDIS_AUTH` | `myredissecret` | Redis の認証パスワード |
| `REDIS_TLS_ENABLED` | `false` | TLS 暗号化を有効にするかどうか |
| `REDIS_TLS_CA` | `-` | TLS CA 証明書のパス |
| `REDIS_TLS_CERT` | `-` | TLS クライアント証明書のパス |
| `REDIS_TLS_KEY` | `-` | TLS 秘密鍵のパス |

### データ移行の設定

| パラメータ | 設定例 | 説明 |
|----------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | バックグラウンド移行を無効にします。Doris の使用時には無効にする必要があります |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | Doris の自動移行を有効にします |

## Docker Compose を使用したデプロイ

<!-- Knowledge type: Operation steps -->
<!-- Use case: Quick deployment / Local validation -->

このセクションでは、直接起動できる Docker Compose の例を示します。実際のデプロイ要件に合わせて設定を変更できます。

### Docker Compose の例をダウンロードする

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```

ダウンロードして展開すると、Compose ファイルと設定ファイルのディレクトリ構造は次のようになります。

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```

### サービスを起動する

```bash
$ docker compose up -d
[+] Running 9/9
 ✔ Network docker-langfuse-doris_doris_internal  Created                                                                                                                                                                                               0.1s
 ✔ Network docker-langfuse-doris_default         Created                                                                                                                                                                                               0.1s
 ✔ Container doris_fe                            Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-postgres                   Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-redis                      Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-minio                      Healthy                                                                                                                                                                                              13.8s
 ✔ Container doris_be                            Healthy                                                                                                                                                                                              54.3s
 ✔ Container langfuse-worker                     Started                                                                                                                                                                                              54.8s
 ✔ Container langfuse-web                        Started
```

### デプロイを確認する

サービスの状態を確認します。すべてのサービスが `Healthy` 状態になれば、Compose は正常に起動しています。

```bash
$ docker compose ps
NAME                IMAGE                             COMMAND                  SERVICE           CREATED         STATUS                        PORTS
doris_be            apache/doris:be-2.1.11            "bash entry_point.sh"    doris_be          2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:8040->8040/tcp, :::8040->8040/tcp, 0.0.0.0:8060->8060/tcp, :::8060->8060/tcp, 0.0.0.0:9050->9050/tcp, :::9050->9050/tcp, 0.0.0.0:9060->9060/tcp, :::9060->9060/tcp
doris_fe            apache/doris:fe-2.1.11            "bash init_fe.sh"        doris_fe          2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:8030->8030/tcp, :::8030->8030/tcp, 0.0.0.0:9010->9010/tcp, :::9010->9010/tcp, 0.0.0.0:9030->9030/tcp, :::9030->9030/tcp
langfuse-minio      minio/minio                       "sh -c 'mkdir -p /da…"   minio             2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:19090->9000/tcp, :::19090->9000/tcp, 127.0.0.1:19091->9001/tcp
langfuse-postgres   postgres:latest                   "docker-entrypoint.s…"   postgres          2 minutes ago   Up 2 minutes (healthy)        127.0.0.1:5432->5432/tcp
langfuse-redis      redis:7                           "docker-entrypoint.s…"   redis             2 minutes ago   Up 2 minutes (healthy)        127.0.0.1:16379->6379/tcp
langfuse-web        selectdb/langfuse-web:latest      "dumb-init -- ./web/…"   langfuse-web      2 minutes ago   Up About a minute (healthy)   0.0.0.0:13000->3000/tcp, :::13000->3000/tcp
langfuse-worker     selectdb/langfuse-worker:latest   "dumb-init -- ./work…"   langfuse-worker   2 minutes ago   Up About a minute (healthy)   0.0.0.0:3030->3030/tcp, :::3030->3030/tcp
```

### Langfuse を初期化する

デプロイが完了したら、Langfuse Web インターフェースにアクセスしてプロジェクトを初期化します。

アクセス先：

```text
http://localhost:3000
```

初期化の手順：

1. ブラウザーで Langfuse Web インターフェースにアクセスします。
2. 管理者アカウントを作成してログインします。
3. 新しい組織とプロジェクトを作成します。
4. プロジェクトの API キー（Public Key と Secret Key）を取得します。
5. SDK 連携に必要な認証情報を設定します。

## アプリケーションを連携してトレースを確認する

<!-- Knowledge type: Operation example -->
<!-- Use case: SDK integration / Trace collection validation -->

サービスの初期化後、Langfuse SDK、LangChain SDK、LlamaIndex SDK を使用してアプリケーションを連携できます。以下の例では DeepSeek API を使用し、トレースデータをローカルの Langfuse サービスに書き込みます。

### Langfuse SDK を使用する

```python
import os

# Instead of: import openai
from langfuse.openai import OpenAI

# from langfuse import observe

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

# use OpenAI client to access DeepSeek API
client = OpenAI(
    base_url="https://api.deepseek.com"
)

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question}")

completion = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "user", "content": question}
    ]
)
response = completion.choices[0].message.content
print(f"response: {response}")
```

### LangChain SDK を使用する

```python
import os

from langfuse.langchain import CallbackHandler
from langchain_openai import ChatOpenAI

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

# Create your LangChain components (using DeepSeek API)
llm = ChatOpenAI(
    model="deepseek-chat",
    openai_api_base="https://api.deepseek.com"
)

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question} \n")

# Run your chain with Langfuse tracing
try:
    # Initialize the Langfuse handler
    langfuse_handler = CallbackHandler()
    response = llm.invoke(question, config={"callbacks": [langfuse_handler]})
    print(f"response: {response.content}")
except Exception as e:
    print(f"Error during chain execution: {e}")
```

### LlamaIndex SDK を使用する

```python
import os

from langfuse import get_client
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from llama_index.llms.deepseek import DeepSeek

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

langfuse = get_client()

# Initialize LlamaIndex instrumentation
LlamaIndexInstrumentor().instrument()

# Set up the DeepSeek class with the required model and API key
llm = DeepSeek(model="deepseek-chat")

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question} \n")

with langfuse.start_as_current_span(name="llama-index-trace"):
    response = llm.complete(question)
    print(f"response: {response}")
```
