---
{
    "title": "概要 | AI 関数",
    "language": "ja",
    "description": "AI Function は、人工知能（AI）の機能に基づいて Doris が提供する組み込み関数です。",
    "sidebar_label": "概要"
}
---

# 概要 {#overview}

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 説明 {#description}

AI Function は、人工知能（AI）の機能に基づいて Doris が提供する組み込み関数です。ユーザーは SQL クエリ内で AI を直接呼び出し、さまざまなインテリジェントなテキストタスクを実行できます。AI Function は Doris の Resource メカニズムを介して、複数の主要な AI プロバイダー（OpenAI、Anthropic、DeepSeek、Gemini、Ollama、MoonShot など）に接続します。

使用する AI は Doris の外部から提供され、テキスト分析をサポートしている必要があります。

---

## AI Resource の構成 {#configure-ai-resource}

AI Function を使用する前に、AI API のアクセス情報を一元管理するため、AI タイプの Resource を作成する必要があります。

### 例: AI Resource の作成 {#example-create-ai-resource}

```sql
CREATE RESOURCE "ai_resource_name"
PROPERTIES (
    'type' = 'ai',
    'ai.provider_type' = 'openai',
    'ai.endpoint' = 'https://endpoint_example',
    'ai.model_name' = 'model_example',
    'ai.api_key' = 'sk-xxx',
    'ai.temperature' = '0.7',
    'ai.max_token' = '1024',
    'ai.max_retries' = '3',
    'ai.retry_delay_second' = '1',
    'ai.dimensions' = '1024'
);
 ```

##### パラメータの説明 {#parameter-description}

**4.1.5 以降**、AI Resource には少なくとも一つの完全な接続グループが必要です。一般の `ai.*`、テキスト Embedding の `ai.embed.*`、またはマルチモーダル Embedding の `ai.embed.mm.*` のいずれかです。構成する各グループには、`endpoint`、`provider_type`、`model_name`、およびプロバイダーが `LOCAL` でない限り `api_key` が必要です。以下の必須接続フィールドは、スカラー AI 関数および `AI_AGG` が使用する一般グループについて説明したものです。テキスト `EMBED` は一般グループより `ai.embed.*` を優先します。JSON マルチモーダル `EMBED` は `ai.embed.mm.*`、次に `ai.embed.*`、最後に一般グループを優先します。以前のバージョンでは一般グループが必要です。すべてのフィールドと例については、[専用 Embedding プロパティ](../../../ai/ai-function-overview.md#dedicated-embedding-properties)を参照してください。

`type`: 必須で、`ai` でなければならず、ai のタイプ識別子として使用されます。

`ai.provider_type`: 一般モデルグループでは必須です。外部 AI プロバイダーを指定します。サポートされているプロバイダーには、OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan、VoyageAI、Jina が含まれます。別のプロバイダーが [OpenAI](https://platform.openai.com/docs/overview)、[Anthropic](https://docs.anthropic.com/en/api/messages-examples)、または [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) と互換性のある API を使用している場合は、対応する互換プロバイダータイプを指定してください。

有効なプロバイダータイプであっても、すべての AI 関数をサポートするとは限りません。たとえば、VoyageAI と Jina は Embedding をサポートしますが、テキスト生成モデルとして使用することはできません。

`ai.endpoint`: 一般モデルグループでは必須です。AI API エンドポイントを指定します。

`ai.model_name`: 一般モデルグループでは必須です。モデル名を指定します。

`ai.api_key`: 一般モデルグループの API キーです。`ai.provider_type = local` でない限り必須です。

`ai.temperature`: オプションです。生成コンテンツのランダム性を制御します。0 から 1 までの浮動小数点値を受け付けます。
デフォルト値は -1 で、このパラメータが設定されていないことを意味します。

`ai.max_token`: オプションです。生成コンテンツの最大トークン数を制限します。
デフォルト値は -1 で、このパラメータが設定されていないことを意味します。Anthropic のデフォルト値は 2048 です。

`ai.max_retries`: オプションです。1 回のリクエストに対する最大再試行回数です。デフォルト値は 3 です。

`ai.retry_delay_second`: オプションです。再試行前の遅延時間（秒）です。デフォルト値は 0 です。

`ai.enable_structured_output` (**4.2 以降**): オプションの Boolean で、デフォルトは `true` です。Doris はスカラー AI 関数の入力行をまとめて送信します。このオプションを有効にすると、レスポンス形式の信頼性を高めるため、プロバイダー固有の形式フィールドが追加されます。Doris は構成されたモデルがこれらをサポートしているか確認しません。LOCAL と MiniMax ではこれらのフィールドは省略されます。モデルまたはエンドポイントがこれらを拒否する場合は `false` に設定してください。バッチ処理、システムプロンプトによる形式の指示、レスポンスの検証は引き続き有効です。このプロパティは `AI_AGG` または `EMBED` には適用されません。

`ai.dimensions`: オプションです。[EMBED](./distance-functions/embed.md) 出力のベクトル次元を制御します。
**設定前に、`ai.model_name` に指定したモデルがカスタムベクトル次元をサポートしていることを必ず確認してください。**
そうでない場合、モデル呼び出しが失敗する可能性があります。

### 専用 Embedding モデルの構成（4.1.5 以降） {#dedicated-embedding-model-configuration-since-415}

4.1.5 以降、AI Resource では一般モデル、テキスト Embedding モデル、マルチモーダル Embedding モデルを個別に構成できます。少なくとも一つの完全なグループが必要です。あるグループの接続プロパティまたは API キーを設定する場合、そのグループには `endpoint`、`provider_type`、`model_name` が必要であり、`LOCAL` 以外のプロバイダーでは `api_key` も必要です。不足しているフィールドは他のグループから継承されません。

| モデルグループ | 接続プロパティ | API キー | 用途 |
| --- | --- | --- | --- |
| 一般 | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | テキスト生成などの AI 関数。専用 Embedding グループが構成されていない場合のフォールバック |
| テキスト Embedding | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | `EMBED()` へのテキスト入力。マルチモーダル入力のフォールバックにも使用 |
| マルチモーダル Embedding | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()` への JSON マルチモーダル入力 |

テキスト `EMBED()` は最初にテキスト Embedding グループを選択し、次に一般グループを選択します。マルチモーダル `EMBED()` は、マルチモーダル Embedding グループ、テキスト Embedding グループ、一般グループの順に選択します。選択されたプロバイダーとモデルは、実際のメディアタイプをサポートしている必要があります。Embedding グループだけを持つ Resource は対応する `EMBED()` 呼び出しに使用できますが、一般モデルを必要とするテキスト生成関数には使用できません。

たとえば、テキスト Embedding のみに使用する Resource では、一般生成モデルを同時に構成する必要はありません。

```sql
CREATE RESOURCE "text_embed_resource"
PROPERTIES (
    "type" = "ai",
    "ai.embed.provider_type" = "openai",
    "ai.embed.endpoint" = "https://<embedding-service>/v1/embeddings",
    "ai.embed.model_name" = "<embedding-model>",
    "ai.embed.api_key" = "<api-key>"
);
```

接続値をサービスの構成に置き換えてください。作成に成功すると `Query OK` が返されます。`ai.dimensions` や再試行パラメータなどの共有設定は、引き続き Resource の構成から取得されます。

### 推論強度: `ai.effort`（4.1.5 以降） {#reasoning-effort-aieffort-since-415}

4.1.5 以降、オプションの文字列プロパティ `ai.effort` で推論強度を指定できます。デフォルトでは未設定で、プロバイダーには送信されません。値は小文字で指定し、プロバイダーの検証を受けます。

| プロバイダー | 使用できる値 |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| その他のプロバイダーのプロパティ検証 | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

プロパティ検証に合格しても、すべてのモデルがその推論強度をサポートするとは限りません。サービスとモデルがサポートする値を選択してください。`ai.effort` は `ai.max_token` の代わりにはなりません。

`ALTER RESOURCE` で空の文字列を指定すると、`ai.effort` の設定が削除されます。

### 作成、変更、削除の権限（4.1.5 以降） {#create-alter-and-drop-permissions-since-415}

AI Resource の作成にはグローバルな `ADMIN` 権限が必要です。4.1.5 以降、FE 構成 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) によって作成者の ID をさらに制限できます。デフォルト値 `*` では ID の制限は追加されません。

4.1.5 以降に `root` が新規作成した AI Resource は、`root` だけが変更または削除できます。他のアカウントは `ADMIN` 権限を持っていても拒否されます。アップグレード前から存在し、このマーカーがない Resource には、さかのぼってマーカーが付与されません。その他の Resource では既存の権限チェックが引き続き適用されます。

---

## Resource の選択と Session 変数 {#resource-selection-and-session-variables}

AI 関連関数を呼び出す際、Resource は次の 2 つの方法で指定できます。

- Resource を明示的に指定する: 関数呼び出し時に Resource 名を直接渡します。
- Resource を暗黙的に指定する: Session 変数を事前に設定すると、関数が対応する Resource を自動的に使用します。

Session 変数の設定形式:
```sql
SET default_ai_resource='resource_name';
```

関数呼び出し形式:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Resource 選択の優先順位 {#resource-selection-priority}

AI_Function を呼び出すと、使用する Resource が次の順序で決定されます。

1. 呼び出しでユーザーが明示的に指定した Resource
2. グローバルデフォルト Resource（`default_ai_resource`）

例:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI 関数 {#ai-functions}

現在 Doris がサポートしている AI Function には、次のものがあります。

- `AI_CLASSIFY`: 情報分類

- `AI_EXTRACT`: 情報抽出

- `AI_FILTER`：情報のフィルタリング

- `AI_FIXGRAMMAR`: 文法修正

- `AI_GENERATE`: テキスト生成

- `AI_MASK`: 機密情報のマスキング

- `AI_SENTIMENT`: 感情分析

- `AI_SIMILARITY`: テキストの意味的類似度の比較

- `AI_SUMMARIZE`: テキスト要約

- `AI_TRANSLATE`: 翻訳

- `AI_AGG`: 複数のテキストに対して行をまたぐ集約分析を実行

### 例 {#examples}

1. `AI_TRANSLATE`
```sql
SELECT AI_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `AI_SENTIMENT`
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DBMS.');
```

各関数の詳細と使用方法については、それぞれの関数のドキュメントを参照してください。
