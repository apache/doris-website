---
{
    "title": "概要 | Ai Functions",
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

AI Function は、人工知能（AI）の機能に基づいて Doris が提供する組み込み関数です。ユーザーは SQL クエリで AI を直接呼び出し、さまざまなインテリジェントテキストタスクを実行できます。AI Function は、Doris のリソース機構を通じて、複数の主要な AI プロバイダー（OpenAI、Anthropic、DeepSeek、Gemini、Ollama、MoonShot など）に接続します。

使用する AI は Doris の外部から提供され、テキスト分析をサポートしている必要があります。

---

## AI リソースの設定 {#configure-ai-resource}

AI Function を使用する前に、AI API へのアクセス情報を一元管理するため、AI タイプの Resource を作成する必要があります。

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

AI リソースには、少なくとも一つの完全な接続グループが必要です。一般 `ai.*`、テキスト embedding の `ai.embed.*`、またはマルチモーダル embedding の `ai.embed.mm.*` です。各設定グループには `endpoint`、`provider_type`、`model_name`、および `api_key` が必要ですが、そのプロバイダーが `LOCAL` の場合は `api_key` を省略できます。以下の必須接続フィールドは、スカラー AI 関数と `AI_AGG` が使用する一般グループについて説明します。テキスト `EMBED` は一般グループより `ai.embed.*` を優先します。JSON マルチモーダル `EMBED` は `ai.embed.mm.*`、次に `ai.embed.*`、次に一般グループを優先します。八つのフィールドすべてと例については、[専用 embedding プロパティ](../../../ai/ai-function-overview.md#dedicated-embedding-properties) を参照してください。

`type`: 必須で、`ai` でなければなりません。ai のタイプ識別子として使用します。

`ai.provider_type`: 一般モデルグループでは必須です。外部 AI プロバイダーを指定します。サポートされるプロバイダーには OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan、VoyageAI、Jina が含まれます。他のプロバイダーが [OpenAI](https://platform.openai.com/docs/overview)、[Anthropic](https://docs.anthropic.com/en/api/messages-examples)、または [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) と互換性のある API を使用している場合は、対応する互換プロバイダータイプを指定してください。

有効なプロバイダータイプであっても、すべての AI 関数をサポートするとは限りません。たとえば、VoyageAI と Jina は embedding をサポートしますが、テキスト生成モデルとして使用することはできません。

`ai.endpoint`: 一般モデルグループでは必須です。AI API エンドポイントを指定します。

`ai.model_name`: 一般モデルグループでは必須です。モデル名を指定します。

`ai.api_key`: 一般モデルグループの API キーです。`ai.provider_type = local` でない限り必須です。

`ai.temperature`: オプションです。生成コンテンツのランダム性を制御します。0 から 1 までの浮動小数点値を指定します。
デフォルト値は -1 で、このパラメータが設定されていないことを示します。

`ai.max_token`: オプションです。生成コンテンツの最大トークン数を制限します。
デフォルト値は -1 で、このパラメータが設定されていないことを示します。Anthropic のデフォルト値は 2048 です。

`ai.max_retries`: オプションです。単一リクエストの最大再試行回数です。デフォルト値は 3 です。

`ai.retry_delay_second`: オプションです。再試行前の遅延時間を秒単位で指定します。開発ブランチのデフォルト値は 1、Doris 4.1.5 では 0 です。

`ai.enable_structured_output`: オプションの Boolean で、デフォルトは `true` です。Doris はスカラー AI 関数の入力行をバッチ処理します。このオプションを有効にすると、応答形式の信頼性を高めるため、プロバイダー固有の形式フィールドが追加されます。Doris は設定されたモデルがこれらをサポートするか確認しません。LOCAL と MiniMax ではこれらのフィールドを省略します。モデルまたはエンドポイントがこれらを拒否する場合は `false` に設定してください。バッチ処理、システムプロンプトによる形式指定、応答検証は引き続き有効です。このプロパティは `AI_AGG` または `EMBED` には適用されません。

`ai.dimensions`: オプションです。[EMBED](./distance-functions/embed.md) 出力のベクトル次元を制御します。
**設定する前に、`ai.model_name` に指定したモデルがカスタムベクトル次元をサポートしていることを必ず確認してください。**
サポートしていない場合、モデル呼び出しが失敗する可能性があります。

### 専用 Embedding モデルの設定（4.1.5 以降） {#dedicated-embedding-model-configuration-since-415}

4.1.5 以降、AI Resource では一般モデル、テキスト embedding モデル、マルチモーダル embedding モデルを個別に設定できます。少なくとも一つの完全なグループが必要です。グループに接続プロパティまたは API キーのいずれかを設定する場合、そのグループには `endpoint`、`provider_type`、`model_name` が必要であり、`LOCAL` 以外のプロバイダーでは `api_key` も必要です。不足しているフィールドは他のグループから継承されません。

| モデルグループ | 接続プロパティ | API キー | 用途 |
| --- | --- | --- | --- |
| 一般 | `ai.endpoint`、`ai.provider_type`、`ai.model_name` | `ai.api_key` | テキスト生成などの AI 関数。専用 embedding グループが設定されていない場合のフォールバック |
| テキスト embedding | `ai.embed.endpoint`、`ai.embed.provider_type`、`ai.embed.model_name` | `ai.embed.api_key` | `EMBED()` へのテキスト入力。マルチモーダル入力のフォールバックにも使用 |
| マルチモーダル embedding | `ai.embed.mm.endpoint`、`ai.embed.mm.provider_type`、`ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()` への JSON マルチモーダル入力 |

テキスト `EMBED()` は、まずテキスト embedding グループを選択し、次に一般グループを選択します。マルチモーダル `EMBED()` は、マルチモーダル embedding グループ、テキスト embedding グループ、一般グループの順に選択します。選択されたプロバイダーとモデルは、実際のメディアタイプをサポートしている必要があります。embedding グループのみを持つ Resource は対応する `EMBED()` 呼び出しを処理できますが、一般モデルを必要とするテキスト生成関数には使用できません。

たとえば、テキスト embedding 専用の Resource では、一般生成モデルを同時に設定する必要はありません。

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

接続値をサービスの設定に置き換えてください。作成に成功すると `Query OK` が返されます。`ai.dimensions` や再試行パラメータなどの共有設定は、引き続きリソース設定から取得されます。

### 推論強度: `ai.effort`（4.1.5 以降） {#reasoning-effort-aieffort-since-415}

4.1.5 以降、オプションの文字列プロパティ `ai.effort` で推論強度を指定できます。デフォルトでは未設定で、プロバイダーには送信されません。値は小文字で指定し、プロバイダーによる検証を受けます。

| プロバイダー | 受け付ける値 |
| --- | --- |
| `ANTHROPIC` | `low`、`medium`、`high`、`xhigh`、`max` |
| `GEMINI` | `minimal`、`low`、`medium`、`high` |
| その他のプロバイダーのプロパティ検証 | `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` |

プロパティ検証に合格しても、すべてのモデルがその強度レベルをサポートするとは限りません。サービスとモデルがサポートする値を選択してください。`ai.effort` は `ai.max_token` の代わりにはなりません。

`ALTER RESOURCE` で空の文字列を指定すると、`ai.effort` の設定が削除されます。

### 作成・変更・削除の権限（4.1.5 以降） {#create-alter-and-drop-permissions-since-415}

AI Resource の作成にはグローバルな `ADMIN` 権限が必要です。4.1.5 以降、FE 設定 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) によって作成者の身元をさらに制限できます。デフォルト値 `*` では、身元に関する制限は追加されません。

4.1.5 以降に `root` が新しく作成した AI Resource は、`root` だけが変更または削除できます。`ADMIN` 権限を持つ他のアカウントも拒否されます。アップグレード前から存在し、このマーカーを持たない Resource には遡ってマークが付けられません。その他のリソースでは、従来の権限チェックが引き続き適用されます。

---

## リソースの選択と Session 変数 {#resource-selection-and-session-variables}

ユーザーが AI 関連関数を呼び出す場合、リソースは次の二つの方法で指定できます。

- 明示的なリソース指定: 関数呼び出し時にリソース名を直接渡します。
- 暗黙的なリソース指定: Session 変数をあらかじめ設定すると、関数が対応するリソースを自動的に使用します。

Session 変数の設定形式:
```sql
SET default_ai_resource='resource_name';
```

関数呼び出し形式:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### リソース選択の優先順位 {#resource-selection-priority}

`AI_Function` を呼び出すと、次の順序で使用するリソースが決定されます。

1. 呼び出しでユーザーが明示的に指定したリソース
2. グローバルデフォルトリソース（`default_ai_resource`）

例:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI Functions {#ai-functions}

Doris が現在サポートしている AI Functions は次のとおりです。

- `AI_CLASSIFY`: 情報分類

- `AI_EXTRACT`: 情報抽出

- `AI_FILTER`：情報のフィルタリング

- `AI_FIXGRAMMAR`: 文法修正

- `AI_GENERATE`: テキスト生成

- `AI_MASK`: 機密情報のマスキング

- `AI_SENTIMENT`: 感情分析

- `AI_SIMILARITY`: テキストの意味的類似性比較

- `AI_SUMMARIZE`: テキスト要約

- `AI_TRANSLATE`: 翻訳

- `AI_AGG`: 複数のテキストに対する行横断集計分析を実行

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

各関数の詳細と使用方法については、各関数のドキュメントを参照してください。
