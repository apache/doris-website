---
{
    "title": "概要 | AI 関数",
    "language": "ja",
    "description": "AI Function は、人工知能（AI）の機能を基盤として Doris が提供する組み込み関数です。",
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

AI Function は、人工知能（AI）の機能を基盤として Doris が提供する組み込み関数です。ユーザーは SQL クエリから AI を直接呼び出し、さまざまな高度なテキスト処理を実行できます。AI Function は Doris のリソース機構を通じて、OpenAI、Anthropic、DeepSeek、Gemini、Ollama、MoonShot など、主要な AI プロバイダーに接続します。

使用する AI は Doris の外部から提供され、テキスト分析に対応している必要があります。

---

## AI リソースの設定 {#configure-ai-resource}

AI Function を使用する前に、AI API へのアクセス情報を一元管理するため、タイプが AI の Resource を作成する必要があります。

### 例：AI リソースの作成 {#example-create-ai-resource}

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

`type`：必須。値は `ai` にする必要があり、AI のタイプ識別子として使用します。

`ai.provider_type`：汎用モデルグループでは必須。外部 AI プロバイダーを指定します。対応するプロバイダーには OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan、VoyageAI、Jina があります。別のプロバイダーが [OpenAI](https://platform.openai.com/docs/overview)、[Anthropic](https://docs.anthropic.com/en/api/messages-examples)、[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) のいずれかと互換性のある API を使用する場合は、対応する互換プロバイダーのタイプを指定します。

有効なプロバイダータイプであっても、すべての AI 関数に対応しているとは限りません。たとえば、VoyageAI と Jina は埋め込みに対応していますが、テキスト生成モデルとしては使用できません。

`ai.endpoint`：汎用モデルグループでは必須。AI API のエンドポイントを指定します。

`ai.model_name`：汎用モデルグループでは必須。モデル名を指定します。

`ai.api_key`：汎用モデルグループの API キー。`ai.provider_type = local` の場合を除き必須です。

`ai.temperature`：省略可能。生成される内容のランダム性を制御します。0 から 1 までの浮動小数点値を指定できます。
デフォルト値は -1 で、このパラメータが設定されていないことを意味します。

`ai.max_token`：省略可能。生成される内容のトークン数の上限を指定します。
デフォルト値は -1 で、このパラメータが設定されていないことを意味します。Anthropic のデフォルト値は 2048 です。

`ai.max_retries`：省略可能。単一リクエストの最大再試行回数です。デフォルト値は 3 です。

`ai.retry_delay_second`：省略可能。再試行までの待機時間を秒単位で指定します。開発ブランチでのデフォルト値は 1、Doris 4.1.5 では 0 です。

`ai.dimensions`：省略可能。[EMBED](./distance-functions/embed.md) の出力ベクトルの次元数を制御します。
**設定する前に、`ai.model_name` に指定したモデルがベクトルの次元数のカスタマイズに対応していることを必ず確認してください。**
対応していない場合、モデルの呼び出しに失敗することがあります。

### 埋め込み専用モデルの設定（4.1.5 以降） {#dedicated-embedding-model-configuration-since-415}

バージョン 4.1.5 以降、AI Resource では汎用モデル、テキスト埋め込みモデル、マルチモーダル埋め込みモデルを個別に設定できます。少なくともいずれかのグループを完全に設定する必要があります。あるグループに接続プロパティまたは API キーを指定した場合、そのグループには `endpoint`、`provider_type`、`model_name` が必要で、`LOCAL` 以外のプロバイダーではさらに `api_key` が必要です。不足している項目が他のグループから継承されることはありません。

| モデルグループ | 接続プロパティ | API キー | 用途 |
| --- | --- | --- | --- |
| 汎用 | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | テキスト生成とその他の AI 関数。埋め込み専用グループが設定されていない場合のフォールバック |
| テキスト埋め込み | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | `EMBED()` へのテキスト入力。マルチモーダル入力のフォールバック |
| マルチモーダル埋め込み | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()` への JSON 形式のマルチモーダル入力 |

テキスト入力の `EMBED()` は、まずテキスト埋め込みグループを選択し、次に汎用グループを選択します。マルチモーダル入力の `EMBED()` は、マルチモーダル埋め込みグループ、テキスト埋め込みグループ、汎用グループの順に選択します。選択されたプロバイダーとモデルは、実際のメディアタイプに対応している必要があります。埋め込みグループだけを持つリソースは、対応する `EMBED()` の呼び出しに使用できますが、汎用モデルを必要とするテキスト生成関数には使用できません。

たとえば、テキスト埋め込み専用のリソースには、汎用の生成モデルは必要ありません。

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

接続に関する値は、利用するサービスの設定に置き換えてください。作成に成功すると `Query OK` が返されます。`ai.dimensions` や再試行に関するパラメータなどの共通設定には、引き続きリソースの設定が使用されます。

### 推論の労力：`ai.effort`（4.1.5 以降） {#reasoning-effort-aieffort-since-415}

バージョン 4.1.5 以降、省略可能な文字列プロパティ `ai.effort` で推論の労力を指定できます。デフォルトでは未設定で、プロバイダーには送信されません。プロバイダーによる検証に従い、小文字の値を使用してください。

| プロバイダー | 受け付ける値 |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| その他のプロバイダーに対するプロパティの検証 | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

プロパティの検証に通っても、すべてのモデルがその労力レベルに対応しているとは限りません。利用するサービスとモデルが対応する値を選択してください。`ai.effort` は `ai.max_token` の代わりにはなりません。

### 作成、変更、削除の権限（4.1.5 以降） {#create-alter-and-drop-permissions-since-415}

AI Resource の作成には、グローバルな `ADMIN` 権限が必要です。バージョン 4.1.5 以降、FE の設定項目 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) により、作成者の ID をさらに制限できます。デフォルト値の `*` では ID による制限は追加されません。

バージョン 4.1.5 以降に `root` が新規作成した AI Resource は、`root` のみが変更または削除できます。他のアカウントは `ADMIN` 権限を持っていても拒否されます。アップグレード前から存在し、このマーカーを持たないリソースに、マーカーが遡って付けられることはありません。その他のリソースには、従来の権限チェックが適用されます。

---

## リソースの選択とセッション変数 {#resource-selection-and-session-variables}

ユーザーが AI 関連の関数を呼び出す際、リソースは次の方法で指定できます。

- 明示的に指定する：関数の呼び出し時にリソース名を直接渡します。
- 暗黙的に指定する：事前にセッション変数を設定すると、関数が対応するリソースを自動的に使用します。

セッション変数の設定形式：
```sql
SET default_ai_resource='resource_name';
```

関数の呼び出し形式：
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### リソースの選択優先順位 {#resource-selection-priority}

AI_Function を呼び出すと、次の順序で使用するリソースが決まります。

1. 呼び出し時にユーザーが明示的に指定したリソース
2. グローバルなデフォルトリソース（`default_ai_resource`）

例：

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI 関数 {#ai-functions}

現在、Doris では次の AI 関数がサポートされています。

- `AI_CLASSIFY`：情報の分類

- `AI_EXTRACT`：情報の抽出

- `AI_FILTER`：情報のフィルタリング

- `AI_FIXGRAMMAR`：文法の修正

- `AI_GENERATE`：テキストの生成

- `AI_MASK`：機密情報のマスキング

- `AI_SENTIMENT`：感情分析

- `AI_SIMILARITY`：テキストの意味的類似度の比較

- `AI_SUMMARIZE`：テキストの要約

- `AI_TRANSLATE`：翻訳

- `AI_AGG`：複数のテキストに対する行をまたいだ集約分析

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
