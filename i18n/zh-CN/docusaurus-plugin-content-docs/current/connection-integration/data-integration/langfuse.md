---
{
    "title": "Langfuse",
    "language": "zh-CN",
    "description": "了解如何部署 Langfuse，使用 Apache Doris 作为 Langfuse 分析后端，完成配置、Docker Compose 部署与 SDK 接入。",
    "keywords": [
        "Langfuse",
        "Apache Doris",
        "LLM 可观测性",
        "Langfuse 分析后端"
    ]
}
---

<!-- 知识类型: 一句话定义 -->
<!-- 适用场景: LLM 应用可观测性 / 分析后端部署 -->

Langfuse 是一个开源的 LLM 工程平台，为大语言模型应用提供链路追踪、性能评估、提示管理和指标监控能力。Langfuse on Doris 使用 Apache Doris 作为分析后端，适合处理大规模 LLM 应用观测数据。

本文介绍如何部署基于 Apache Doris 的 Langfuse 解决方案，并通过 Langfuse SDK、LangChain SDK 和 LlamaIndex SDK 接入应用链路。

## 适用场景与核心能力

<!-- 知识类型: 功能概览 -->
<!-- 适用场景: 方案选型 / 能力评估 -->

当你希望在 LLM 应用中统一记录调用链路、分析模型表现、管理提示词并监控成本与质量时，可以使用 Langfuse on Doris。它通过 Langfuse 负责应用侧可观测性，通过 Apache Doris 承载 OLAP 分析数据。

| 能力 | 用户场景 |
|------|----------|
| 链路追踪 | 完整记录 LLM 应用的调用链路和执行流程 |
| 性能评估 | 提供多维度的模型性能评估和质量分析 |
| 提示管理 | 集中管理和版本控制提示词模板 |
| 指标监控 | 实时监控应用性能、成本和质量指标 |

## 架构与组件

<!-- 知识类型: 架构说明 -->
<!-- 适用场景: 部署规划 / 组件理解 -->

Langfuse on Doris 采用微服务架构。Langfuse Web 和 Worker 处理应用交互、API 接入与异步任务；PostgreSQL、Redis 和 MinIO 分别负责事务数据、缓存队列和对象存储；Doris 作为 OLAP 分析后端存储和查询可观测性数据。

| 组件 | 端口 | 功能说明 |
|------|------|----------|
| Langfuse Web | 3000 | Web 界面和 API 服务，提供用户交互和数据接入 |
| Langfuse Worker | 3030 | 异步任务处理，负责数据处理和分析任务 |
| PostgreSQL | 5432 | 事务性数据存储，保存用户配置和元数据 |
| Redis | 6379 | 缓存层和消息队列，提升系统响应性能 |
| MinIO | 9000 | 对象存储服务，存储原始事件和多模态附件 |
| Doris FE | 9030、8030 | Doris Frontend，负责接收用户请求、查询解析和规划、元数据管理以及节点管理 |
| Doris BE | 8040、8050 | Doris Backend，负责数据存储和查询计划执行。数据会被切分成数据分片（Shard），并在 BE 中以多副本方式存储 |

:::note

部署 Apache Doris 时，可以根据硬件环境与业务需求选择存算一体架构或存算分离架构。

在 Langfuse 部署中，生产环境不建议使用 Docker Doris。示例 Docker Compose 中的 Doris FE 和 Doris BE 仅用于帮助用户快速体验 Langfuse on Doris 的能力。

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

## 部署前检查

<!-- 知识类型: 部署前检查 -->
<!-- 适用场景: 环境验收 / 部署准备 -->

部署前需要确认软件版本、硬件资源和网络连通性。Doris 建议独立部署，以获得更好的性能和稳定性。

### 软件环境

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Docker | 20.0+ | 容器运行环境 |
| Docker Compose | 2.0+ | 容器编排工具 |
| Apache Doris | 2.1.10+ | 分析数据库，需独立部署 |

### 硬件资源

| 资源类型 | 最低要求 | 推荐配置 | 说明 |
|----------|----------|----------|------|
| 内存 | 8 GB | 16 GB+ | 支持多服务并发运行 |
| 磁盘 | 50 GB | 100 GB+ | 存储容器数据和日志 |
| 网络 | 1 Gbps | 10 Gbps | 确保数据传输性能 |

### 前置条件

1. **Doris 集群准备**
    - 确保 Doris 集群正常运行且性能稳定。
    - 验证 FE HTTP 端口（默认 8030）和查询端口（默认 9030）网络可达。
    - Langfuse 启动后将自动在 Doris 中创建所需的数据库和表结构。

2. **网络连通性**
    - 部署环境能够访问 Docker Hub 拉取镜像。
    - Langfuse 服务能够访问 Doris 集群的相关端口。
    - 客户端能够访问 Langfuse Web 服务端口。

:::tip 部署建议

推荐使用 Docker 部署 Langfuse 服务组件，包括 Web、Worker、Redis 和 PostgreSQL。Doris 建议独立部署，以获得更好的性能和稳定性。详细的 Doris 部署指南请参考官方文档。

:::

## 配置 Langfuse 服务

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 环境变量配置 / 后端连接配置 -->

Langfuse 服务需要通过环境变量连接 Doris、PostgreSQL、Redis 等组件。请根据实际环境替换示例值，尤其是密钥、密码和服务地址。

### Doris 分析后端配置

| 参数名称 | 示例值 | 说明 |
|----------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | 指定使用 Doris 作为分析后端 |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE HTTP 服务地址 |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FE 查询端口 |
| `DORIS_DB` | `langfuse` | Doris 数据库名称 |
| `DORIS_USER` | `root` | Doris 用户名 |
| `DORIS_PASSWORD` | `123456` | Doris 密码 |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | 最大数据库连接数 |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | 请求超时时间，单位为毫秒 |

### 基础服务配置

| 参数名称 | 示例值 | 说明 |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | PostgreSQL 数据库连接地址 |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | NextAuth 认证密钥，用于会话加密 |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | 数据加密盐值，至少 32 个字符 |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | 数据加密密钥，64 个字符 |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Web 服务地址 |
| `TZ` | `UTC` | 系统时区设置 |

### Redis 缓存配置

| 参数名称 | 示例值 | 说明 |
|----------|--------|------|
| `REDIS_HOST` | `langfuse-redis` | Redis 服务主机地址 |
| `REDIS_PORT` | `6379` | Redis 服务端口 |
| `REDIS_AUTH` | `myredissecret` | Redis 认证密码 |
| `REDIS_TLS_ENABLED` | `false` | 是否启用 TLS 加密 |
| `REDIS_TLS_CA` | `-` | TLS CA 证书路径 |
| `REDIS_TLS_CERT` | `-` | TLS 客户端证书路径 |
| `REDIS_TLS_KEY` | `-` | TLS 私钥路径 |

### 数据迁移配置

| 参数名称 | 示例值 | 说明 |
|----------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | 禁用后台迁移，使用 Doris 时需要关闭 |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | 启用 Doris 自动迁移 |

## 使用 Docker Compose 部署

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 快速部署 / 本地验证 -->

本节提供一个可以直接启动的 Docker Compose 示例。你可以根据实际部署需求修改配置。

### 下载 Docker Compose 示例

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```

下载并解压后，Compose 文件与配置文件路径结构如下：

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```

### 启动服务

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

### 验证部署

检查服务状态。当所有服务状态都为 `Healthy` 时，表示 Compose 启动成功。

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

### 初始化 Langfuse

部署完成后，访问 Langfuse Web 界面并完成项目初始化。

访问地址：

```text
http://localhost:3000
```

初始化步骤如下：

1. 打开浏览器访问 Langfuse Web 界面。
2. 创建管理员账户并登录。
3. 创建新组织与新项目。
4. 获取项目的 API Keys，包括 Public Key 和 Secret Key。
5. 配置 SDK 集成所需的认证信息。

## 接入应用并查看链路

<!-- 知识类型: 操作示例 -->
<!-- 适用场景: SDK 集成 / 链路采集验证 -->

完成服务初始化后，可以使用 Langfuse SDK、LangChain SDK 或 LlamaIndex SDK 接入应用。以下示例使用 DeepSeek API，并将链路数据写入本地 Langfuse 服务。

### 使用 Langfuse SDK

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
question = "Doris 可观测性解决方案的特点是什么？回答简洁清晰"
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

### 使用 LangChain SDK

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
question = "Doris 可观测性解决方案的特点是什么？回答简洁清晰"
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

### 使用 LlamaIndex SDK

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
question = "Doris 可观测性解决方案的特点是什么？回答简洁清晰"
print(f"question: {question} \n")

with langfuse.start_as_current_span(name="llama-index-trace"):
    response = llm.complete(question)
    print(f"response: {response}")
```

