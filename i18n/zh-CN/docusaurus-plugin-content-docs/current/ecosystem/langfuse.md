---
{
    "title": "Langfuse on Doris",
    "language": "zh-CN"
}
---

# Langfuse on Doris

## 关于 Langfuse

Langfuse 是一个开源的 LLM 工程平台，专门为大语言模型应用提供全面的可观测性解决方案。它主要提供以下核心功能：

- **链路追踪**：完整记录 LLM 应用的调用链路和执行流程
- **性能评估**：提供多维度的模型性能评估和质量分析
- **提示管理**：集中管理和版本控制提示词模板
- **指标监控**：实时监控应用性能、成本和质量指标

本文档将详细介绍如何部署基于 Apache Doris 作为分析后端的 Langfuse 解决方案，充分利用 Doris 强大的 OLAP 分析能力来处理大规模的 LLM 应用数据。


## 系统架构

Langfuse on Doris 解决方案采用微服务架构，包含以下核心组件：

| 组件 | 端口 | 功能说明 |
|------|------|----------|
| Langfuse Web | 3000 | Web 界面和 API 服务，提供用户交互和数据接入 |
| Langfuse Worker | 3030 | 异步任务处理，负责数据处理和分析任务 |
| PostgreSQL | 5432 | 事务性数据存储，保存用户配置和元数据 |
| Redis | 6379 | 缓存层和消息队列，提升系统响应性能 |
| MinIO | 9090 | 对象存储服务，存储原始事件和多模态附件 |
| Apache Doris | 外部 | OLAP 分析引擎，处理大规模观测数据 |

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

## 部署要求

### 软件环境

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Docker | 20.0+ | 容器运行环境 |
| Docker Compose | 2.0+ | 容器编排工具 |
| Apache Doris | 2.1.10+ | 分析数据库，需独立部署 |

### 硬件资源

| 资源类型 | 最低要求 | 推荐配置 | 说明 |
|----------|----------|----------|------|
| 内存 | 8GB | 16GB+ | 支持多服务并发运行 |
| 磁盘 | 50GB | 100GB+ | 存储容器数据和日志 |
| 网络 | 1Gbps | 10Gbps | 确保数据传输性能 |

### 前置条件

1. **Doris 集群准备**
   - 确保 Doris 集群正常运行且性能稳定
   - 验证 FE HTTP 端口（默认 8030）和查询端口（默认 9030）网络可达
   - Langfuse 启动后将自动在 Doris 中创建所需的数据库和表结构

2. **网络连通性**
   - 部署环境能够访问 Docker Hub 拉取镜像
   - Langfuse 服务能够访问 Doris 集群的相关端口
   - 客户端能够访问 Langfuse Web 服务端口

:::tip 部署建议
推荐使用 Docker 部署 Langfuse 服务组件（Web、Worker、Redis、PostgreSQL），但 Doris 建议独立部署以获得更好的性能和稳定性。详细的 Doris 部署指南请参考官方文档。
:::

## 配置参数

Langfuse 服务需要配置多个环境变量来支持各个组件的正常运行：

### 基础服务配置

| 参数名称 | 示例值 | 说明 |
|---------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres-1:5432/postgres` | PostgreSQL 数据库连接地址 |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | NextAuth 认证密钥，用于会话加密 |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | 数据加密盐值（至少32字符） |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | 数据加密密钥（64字符） |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Web 服务地址 |
| `TZ` | `Asia/Shanghai` | 系统时区设置 |

### Redis 缓存配置

| 参数名称 | 示例值 | 说明 |
|---------|--------|------|
| `REDIS_HOST` | `langfuse-redis-1` | Redis 服务主机地址 |
| `REDIS_PORT` | `6379` | Redis 服务端口 |
| `REDIS_AUTH` | `myredissecret` | Redis 认证密码 |
| `REDIS_TLS_ENABLED` | `false` | 是否启用 TLS 加密 |
| `REDIS_TLS_CA` | `-` | TLS CA 证书路径 |
| `REDIS_TLS_CERT` | `-` | TLS 客户端证书路径 |
| `REDIS_TLS_KEY` | `-` | TLS 私钥路径 |

### 数据迁移配置

| 参数名称 | 示例值 | 说明 |
|---------|--------|------|
| `LANGFUSE_AUTO_CLICKHOUSE_MIGRATION_DISABLED` | `true` | 禁用 ClickHouse 自动迁移 |
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | 禁用后台迁移（使用 Doris 时需要关闭） |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | 启用 Doris 自动迁移 |

### Doris 分析后端配置

| 参数名称 | 示例值 | 说明 |
|---------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | 指定使用 Doris 作为分析后端 |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE HTTP 服务地址 |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FE 查询端口 |
| `DORIS_DB` | `langfuse` | Doris 数据库名称 |
| `DORIS_USER` | `root` | Doris 用户名 |
| `DORIS_PASSWORD` | `123456` | Doris 密码（必须设置，不能为空） |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | 最大数据库连接数 |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | 请求超时时间（毫秒） |

## Docker Compose 部署

### 配置文件

创建 `docker-compose.doris.yaml` 文件，包含完整的 Langfuse 服务栈配置。以下配置已经过优化，可以直接使用：

```yaml
services:
  langfuse-web:
    image: selectdb/langfuse-web:2.1.10
    depends_on: &langfuse-depends-on
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "13000:3000"
    environment: &langfuse-web-env
      DATABASE_URL: postgresql://postgres:postgres@langfuse-postgres-1:5432/postgres
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-your-debug-secret-key-here-must-be-long-enough}
      SALT: ${SALT:-your-super-secret-salt-with-at-least-32-characters-for-encryption}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY:-0000000000000000000000000000000000000000000000000000000000000000}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      TELEMETRY_ENABLED: ${TELEMETRY_ENABLED:-false}
      LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: ${LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES:-false}
      LANGFUSE_INIT_ORG_ID: ${LANGFUSE_INIT_ORG_ID:-}
      LANGFUSE_INIT_ORG_NAME: ${LANGFUSE_INIT_ORG_NAME:-}
      LANGFUSE_INIT_PROJECT_ID: ${LANGFUSE_INIT_PROJECT_ID:-}
      LANGFUSE_INIT_PROJECT_NAME: ${LANGFUSE_INIT_PROJECT_NAME:-}
      LANGFUSE_INIT_PROJECT_PUBLIC_KEY: ${LANGFUSE_INIT_PROJECT_PUBLIC_KEY:-}
      LANGFUSE_INIT_PROJECT_SECRET_KEY: ${LANGFUSE_INIT_PROJECT_SECRET_KEY:-}
      LANGFUSE_INIT_USER_EMAIL: ${LANGFUSE_INIT_USER_EMAIL:-}
      LANGFUSE_INIT_USER_NAME: ${LANGFUSE_INIT_USER_NAME:-}
      LANGFUSE_INIT_USER_PASSWORD: ${LANGFUSE_INIT_USER_PASSWORD:-}
      CLICKHOUSE_MIGRATION_URL: ${CLICKHOUSE_MIGRATION_URL:-clickhouse://clickhouse:clickhouse@localhost:9000}
      CLICKHOUSE_URL: ${CLICKHOUSE_URL:-http://localhost:8123}
      CLICKHOUSE_USER: ${CLICKHOUSE_USER:-clickhouse}
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD:-clickhouse}
      CLICKHOUSE_CLUSTER_ENABLED: ${CLICKHOUSE_CLUSTER_ENABLED:-false}
      LANGFUSE_S3_EVENT_UPLOAD_BUCKET: ${LANGFUSE_S3_EVENT_UPLOAD_BUCKET:-langfuse}
      LANGFUSE_S3_EVENT_UPLOAD_REGION: ${LANGFUSE_S3_EVENT_UPLOAD_REGION:-us-east-1}
      LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID: ${LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID:-minio}
      LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY: ${LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY:-miniosecret}
      LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT: http://langfuse-minio-1:9000
      LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE: ${LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE:-true}
      LANGFUSE_S3_EVENT_UPLOAD_PREFIX: ${LANGFUSE_S3_EVENT_UPLOAD_PREFIX:-events/}
      REDIS_HOST: langfuse-redis-1
      REDIS_PORT: 6379
      REDIS_AUTH: ${REDIS_AUTH:-myredissecret}
      REDIS_TLS_ENABLED: ${REDIS_TLS_ENABLED:-false}
      REDIS_TLS_CA: ${REDIS_TLS_CA:-}
      REDIS_TLS_CERT: ${REDIS_TLS_CERT:-}
      REDIS_TLS_KEY: ${REDIS_TLS_KEY:-}

      # Timezone setting
      TZ: Asia/Shanghai

      # Disable ClickHouse migration as we use Doris
      LANGFUSE_AUTO_CLICKHOUSE_MIGRATION_DISABLED: true
      
      # Disable background migrations (PG to ClickHouse) as we use Doris
      LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS: false
      
      LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED: false
      
      # Doris configuration
      # Note: Doris is enabled automatically when LANGFUSE_ANALYTICS_BACKEND="doris"
      LANGFUSE_ANALYTICS_BACKEND: ${LANGFUSE_ANALYTICS_BACKEND:-doris}
      DORIS_URL: ${DORIS_FE_HTTP_URL:-}
      DORIS_FE_HTTP_URL: ${DORIS_FE_HTTP_URL:-http://10.16.10.6:8630}
      DORIS_FE_QUERY_PORT: ${DORIS_FE_QUERY_PORT:-9630}
      DORIS_DB: ${DORIS_DB:-langfuse}
      DORIS_USER: ${DORIS_USER:-root}
      DORIS_PASSWORD: ${DORIS_PASSWORD:-123456}
      DORIS_MAX_OPEN_CONNECTIONS: ${DORIS_MAX_OPEN_CONNECTIONS:-100}
      DORIS_REQUEST_TIMEOUT_MS: ${DORIS_REQUEST_TIMEOUT_MS:-30000}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/public/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  langfuse-worker:
    image: selectdb/langfuse-worker:2.1.10
    depends_on: *langfuse-depends-on
    ports:
      - "3030:3030"
    environment:
      <<: *langfuse-web-env
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3030/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  minio:
    image: minio/minio
    restart: always
    entrypoint: sh
    # Create the 'langfuse' bucket before starting the service
    command: -c 'mkdir -p /data/langfuse && minio server --address ":9000" --console-address ":9001" /data'
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: miniosecret  # CHANGEME
    ports:
      - 9090:9000
      - 127.0.0.1:9091:9001
    volumes:
      - langfuse_minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 1s
      timeout: 5s
      retries: 5
      start_period: 1s

  redis:
    image: redis:7
    restart: always
    # CHANGEME: row below to secure redis password
    command: >
      --requirepass ${REDIS_AUTH:-myredissecret}
    ports:
      - 127.0.0.1:16379:6379
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 10s
      retries: 10

  postgres:
    image: postgres:${POSTGRES_VERSION:-latest}
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 3s
      timeout: 3s
      retries: 10
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres  # CHANGEME
      POSTGRES_DB: postgres
    ports:
      - 127.0.0.1:5432:5432
    volumes:
      - langfuse_postgres_data:/var/lib/postgresql/data

volumes:
  langfuse_postgres_data:
    driver: local
  langfuse_clickhouse_data:
    driver: local
  langfuse_clickhouse_logs:
    driver: local
  langfuse_minio_data:
    driver: local

networks:
  default:
    external: true
    name: langfuse_default
```


### 部署步骤

按照以下步骤完成 Langfuse 服务的部署：

#### 1. 创建 Docker 网络

```bash
docker network create langfuse_default
```

#### 2. 启动服务栈

```bash
docker compose -f docker-compose.doris.yaml up -d
```

#### 3. 验证部署状态

检查所有服务是否正常启动：

```bash
docker compose -f docker-compose.doris.yaml ps
```

确认各服务的健康检查状态为 `healthy`。

#### 4. 服务初始化

部署完成后，通过以下方式访问和初始化服务：

**访问 Langfuse Web 界面**：
- 地址：http://localhost:3000
- 首次访问时需要注册管理员账户

**初始化步骤**：
1. 打开浏览器访问 http://localhost:3000
2. 创建管理员账户并登录
3. 创建新项目
4. 获取项目的 API Keys（Public Key 和 Secret Key）
5. 配置 SDK 集成所需的认证信息

**服务端口说明**：
- Langfuse Web：3000（映射到容器内的 3000）
- Langfuse Worker：3030
- MinIO Console：9091（仅本地访问）
- Redis：16379（仅本地访问）
- PostgreSQL：5432（仅本地访问）


## SDK 集成示例

### Python SDK 使用

以下示例展示了如何使用 Langfuse Python SDK 来追踪 LLM 应用的调用链路：

#### 安装依赖

```bash
pip install langfuse openai
```

#### 配置环境变量

```python
import os

# Langfuse service configuration
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-your-secret-key"  # Project secret key
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-your-public-key"  # Project public key
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"        # Langfuse service address

# LLM service configuration (DeepSeek example)
os.environ["DEEPSEEK_API_KEY"] = "your-deepseek-api-key"
```

#### 完整示例代码

```python
from langfuse.openai import OpenAI
from langfuse import observe, get_client
import os

# Initialize OpenAI client (using DeepSeek API)
client = OpenAI(
    base_url="https://api.deepseek.com",
    api_key=os.getenv('DEEPSEEK_API_KEY'),
)

# Initialize Langfuse client
langfuse = get_client()

@observe()
def llm_call(user_input):
    """Call LLM and automatically record trace information"""
    completion = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "user", "content": user_input}
        ]
    )
    response = completion.choices[0].message.content
    print(f"LLM Response: {response}")
    return response

@observe()
def my_instrumented_function(user_input):
    """Main business function with complete tracing and scoring logic"""
    # Call LLM
    output = llm_call(user_input)
    
    # Update current trace metadata
    langfuse.update_current_trace(
        input=user_input,
        output=output,
        user_id="user_123",                    # User identifier
        session_id="session_abc",              # Session identifier
        tags=["agent", "doris-qa"],           # Tag classification
        metadata={                             # Custom metadata
            "email": "user@example.com",
            "department": "engineering"
        },
        version="1.0.0"                       # Application version
    )
    
    # Create quality score
    langfuse.create_score(
        name="correctness",                    # Score dimension
        value=0.9,                            # Score value (0-1)
        trace_id=langfuse.get_current_trace_id(),
        observation_id=langfuse.get_current_observation_id(),
        data_type="NUMERIC",
        comment="Accurate and detailed answer"  # Score comment
    )
    
    return output

# Usage example
if __name__ == '__main__':
    question = "Doris 在半结构化数据处理上有什么优势？"
    result = my_instrumented_function(question)
```


