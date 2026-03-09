---
{
  "title": "DorisにおけるLangfuse",
  "language": "ja"
}
---
# Langfuse on Doris

## Langfuseについて

Langfuseは、大規模言語モデルアプリケーション向けの包括的な観測性ソリューションを提供するオープンソースのLLMエンジニアリングプラットフォームです。以下のコア機能を提供します：

- **トレーシング**: LLMアプリケーションの呼び出しチェーンと実行フローの完全な記録
- **評価**: 多次元のモデルパフォーマンス評価と品質分析
- **プロンプト管理**: プロンプトテンプレートの集中管理とバージョン管理
- **メトリクス監視**: アプリケーションのパフォーマンス、コスト、品質メトリクスのリアルタイム監視

このドキュメントでは、Apache Dorisを分析バックエンドとして使用したLangfuseソリューションのデプロイ方法について詳細な手順を提供し、Dorisの強力なOLAP分析機能を最大限に活用して大規模なLLMアプリケーションデータを処理します。

## システムアーキテクチャ

Langfuse on Dorisソリューションは、以下のコアコンポーネントを持つマイクロサービスアーキテクチャを使用します：

| Component         | Ports     | Description                                                                          |
|-----------------|-----------|----------------------------------------------------------------------------------|
| Langfuse Web    | 3000      | ユーザーインタラクションとデータ取り込みのためのWebインターフェースとAPIサービス                                                       |
| Langfuse Worker | 3030      | データ処理と分析タスクのための非同期タスク処理                                                               |
| PostgreSQL      | 5432      | ユーザー設定とメタデータのためのトランザクショナルデータストレージ                                                               |
| Redis           | 6379      | システム応答性能向上のためのキャッシュレイヤーとメッセージキュー                                                                |
| MinIO           | 9090      | 生イベントとマルチモーダル添付ファイルのためのオブジェクトストレージサービス                                                              |
| Doris Fe        | 9030 8030 | Doris Frontend、Dorisアーキテクチャの一部で、ユーザーリクエストの受信、クエリの解析と計画、メタデータ管理、ノード管理を担当                      |
| Doris Be        | 8040 8050 | Doris Backends、Dorisアーキテクチャの一部で、データストレージとクエリ計画の実行を担当。データはシャードに分割され、BEノードに複数のレプリカで保存される。 |

::: note

Apache Dorisをデプロイする際は、ハードウェア環境とビジネス要件に基づいて、統合計算ストレージアーキテクチャまたは分離計算ストレージアーキテクチャを選択できます。
Langfuseのデプロイでは、Docker Dorisは本番環境では推奨されません。Dockerに含まれるFEとBEコンポーネントは、ユーザーがLangfuse on Dorisの機能を迅速に体験するためのものです。

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
## デプロイメント要件

### ソフトウェア環境

| コンポーネント | バージョン | 説明 |
|------|----------|------|
| Docker | 20.0+ | コンテナランタイム環境 |
| Docker Compose | 2.0+ | コンテナオーケストレーションツール |
| Apache Doris | 2.1.10+ | 分析データベース、別途デプロイメントが必要 |

### ハードウェアリソース

| リソースタイプ | 最小 | 推奨 | 説明 |
|----------|----------|----------|------|
| メモリ | 8GB | 16GB+ | マルチサービス並行動作をサポート |
| ディスク | 50GB | 100GB+ | コンテナデータとログの保存 |
| ネットワーク | 1Gbps | 10Gbps | データ転送パフォーマンスを保証 |

### 前提条件

1. **Dorisクラスタ準備**
    - Dorisクラスタが適切に動作し、安定したパフォーマンスを持つことを確認
    - FE HTTPポート（デフォルト8030）とクエリポート（デフォルト9030）がネットワークアクセス可能であることを確認
    - Langfuseは起動後、Doris内に必要なデータベースとテーブル構造を自動的に作成

2. **ネットワーク接続性**
    - デプロイメント環境がDocker Hubにアクセスしてイメージを取得可能
    - LangfuseサービスがDorisクラスタの関連ポートにアクセス可能
    - クライアントがLangfuse Webサービスポートにアクセス可能

:::tip デプロイメント推奨事項
LangfuseサービスコンポーネントのデプロイメントにはDockerの使用を推奨しますが（Web、Worker、Redis、PostgreSQL）、Dorisはより良いパフォーマンスと安定性のために別途デプロイメントすることを推奨します。詳細なDorisデプロイメントガイドについては公式ドキュメントを参照してください。
:::

## 設定パラメータ

Langfuseサービスは各コンポーネントの適切な動作をサポートするために複数の環境変数が必要です：

### Doris分析バックエンド設定

| パラメータ | サンプル値 | 説明 |
|---------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | 分析バックエンドとしてDorisを指定 |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE HTTPサービスアドレス |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FEクエリポート |
| `DORIS_DB` | `langfuse` | Dorisデータベース名 |
| `DORIS_USER` | `root` | Dorisユーザー名 |
| `DORIS_PASSWORD` | `123456` | Dorisパスワード |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | 最大データベース接続数 |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | リクエストタイムアウト（ミリ秒） |

### 基本サービス設定

| パラメータ | サンプル値 | 説明 |
|---------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | PostgreSQLデータベース接続URL |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | セッション暗号化用NextAuth認証キー |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | データ暗号化ソルト（32文字以上） |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | データ暗号化キー（64文字） |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Webサービスアドレス |
| `TZ` | `UTC` | システムタイムゾーン設定 |

### Redisキャッシュ設定

| パラメータ | サンプル値              | 説明 |
|---------|------------------|------|
| `REDIS_HOST` | `langfuse-redis` | Redisサービスホストアドレス |
| `REDIS_PORT` | `6379`           | Redisサービスポート |
| `REDIS_AUTH` | `myredissecret`  | Redis認証パスワード |
| `REDIS_TLS_ENABLED` | `false`          | TLS暗号化を有効にするかどうか |
| `REDIS_TLS_CA` | `-`              | TLS CA証明書パス |
| `REDIS_TLS_CERT` | `-`              | TLSクライアント証明書パス |
| `REDIS_TLS_KEY` | `-`              | TLS秘密キーパス |

### データ移行設定

| パラメータ | サンプル値 | 説明 |
|---------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | バックグラウンド移行を無効化（Doris使用時は無効化必須） |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | Doris自動移行を有効化 |


## Docker Composeデプロイメント

### デプロイメント前準備

ここでは直接起動可能なcomposeサンプルを提供します。要件に応じて設定を変更してください。

### docker composeのダウンロード

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```
compose ファイルと設定ファイルのディレクトリ構造は以下の通りです：

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```
### デプロイ手順

### 1 . composeを開始

```Bash
docker compose up -d
```
```Bash
# Check
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
### 3. デプロイの確認

サービスステータスを確認してください：

すべてのサービスステータスがHealthyと表示されている場合、composeが正常に開始されています。

```Bash
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
#### 4. サービスの初期化

デプロイが完了した後、以下の手順でサービスにアクセスして初期化を行います：

**Langfuse Web Interfaceへのアクセス**：
- URL: http://localhost:3000

**初期化手順**：
1. ブラウザを開いてhttp://localhost:3000にアクセスします
2. 管理者アカウントを作成してログインします
3. 新しい組織とプロジェクトを作成します
4. プロジェクトのAPI Keys（Public KeyとSecret Key）を取得します
5. SDK連携に必要な認証情報を設定します


# 例

## Langfuse SDKの使用

```Python
import os
# Instead of: import openai
from langfuse.openai import OpenAI
# from langfuse import observe

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******" 
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"


# use OpenAI client
client = OpenAI()


# ask a question
question = "What are the key features of the Doris observability solution? Please answer concisely."
print(f"question: {question}")

completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": question}
    ]
)
response = completion.choices[0].message.content
print(f"response: {response}")
```
![](/images/ecomsystem/langfuse/langfuse_2.png)

## LangChain SDKの使用

```Python
import os
from langfuse.langchain import CallbackHandler
from langchain_openai import ChatOpenAI

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******" 
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

# Create your LangChain components (using OpenAI API)
llm = ChatOpenAI(
    model="gpt-4o"
)

# ask a question
question = "What are the key features of the Doris observability solution? Please answer concisely."
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
![](/images/ecomsystem/langfuse/langfuse_2.png)

## LlamaIndex SDKの使用

```Python
import os
from langfuse import get_client
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from llama_index.llms.openai import OpenAI

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******" 
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

langfuse = get_client()


# Initialize LlamaIndex instrumentation
LlamaIndexInstrumentor().instrument()


# Set up the OpenAI class with the required model
llm = OpenAI(model="gpt-4o")


# ask a question
question = "What are the key features of the Doris observability solution? Please answer concisely."
print(f"question: {question} \n")
 
with langfuse.start_as_current_span(name="llama-index-trace"):
    response = llm.complete(question)
    print(f"response: {response}")
```
![](/images/ecomsystem/langfuse/langfuse_3.png)
