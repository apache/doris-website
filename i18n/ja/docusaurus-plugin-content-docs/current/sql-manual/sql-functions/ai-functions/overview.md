---
{
    "title": "概要 | AI 関数",
    "language": "ja",
    "description": "AI 関数は、人工知能（AI）の機能を利用する Doris の組み込み関数です。",
    "sidebar_label": "概要"
}
---

# 概要

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

## 説明

AI 関数は、人工知能（AI）の機能を利用する Doris の組み込み関数です。SQL クエリから直接 AI を呼び出し、さまざまなテキスト処理タスクを実行できます。Doris のリソース機構を通じて、OpenAI、Anthropic、DeepSeek、Gemini、Ollama、MoonShot などの AI プロバイダーに接続します。

使用する AI は Doris の外部で提供され、テキスト分析をサポートする必要があります。

---

## AI リソースの設定

AI 関数を使用する前に、AI API の接続情報を一元管理するため、AI 型のリソースを作成します。

### 例: AI リソースの作成

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

##### パラメータの説明

`type`: 必須。`ai` を指定し、AI リソースの型を示します。

`ai.provider_type`: 必須。外部 AI プロバイダーの種類。現在は OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan に対応します。ここにないプロバイダーでも API 形式が [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) と同じ場合は、対応するプロバイダーを指定できます。

`ai.endpoint`: 必須。AI API のエンドポイント。

`ai.model_name`: 必須。モデル名。

`ai_api_key`: `ai.provider_type = local` の場合を除いて必須。API キー。

`ai.temperature`: 任意。生成内容のランダム性を制御します。0 から 1 の浮動小数点値を指定します。 
デフォルト値は -1 で、このパラメータが未設定であることを意味します。

`ai.max_tokens`: 任意。生成内容のトークン数の上限を指定します。 
デフォルト値は -1 で、このパラメータが未設定であることを意味します。Anthropic のデフォルト値は 2048 です。

`ai.max_retries`: 任意。一回のリクエストで再試行する回数の上限。デフォルト値は 3 です。

`ai.retry_delay_second`: 任意。再試行するまでの待機時間（秒）。デフォルト値は 0 です。

`ai.dimensions`: 任意。[EMBED](./distance-functions/embed.md) の出力ベクトルの次元数を制御します。 
**設定前に、`ai.model_name` に指定したモデルが任意のベクトル次元数に対応していることを確認してください**。 
対応していない場合、モデルの呼び出しに失敗することがあります。

---

## リソースの選択とセッション変数

AI 関連の関数を呼び出す際、リソースは次の二通りで指定できます。

- 明示的に指定: 関数呼び出し時にリソース名を直接渡します。
- 暗黙的に指定: あらかじめセッション変数を設定すると、関数が対応するリソースを自動的に使用します。

セッション変数の設定形式:
```sql
SET default_ai_resource='resource_name';
```

関数の呼び出し形式:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### リソース選択の優先順位

AI 関数の呼び出し時には、次の順序で使用するリソースが決まります。

1. 呼び出し時にユーザーが明示的に指定したリソース
2. グローバルのデフォルトリソース（`default_ai_resource`）

Example:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI 関数

Doris では現在、次の AI 関数をサポートします。

- `AI_CLASSIFY`: 情報の分類

- `AI_EXTRACT`: 情報の抽出

- `AI_FILTER`：情報のフィルタリング

- `AI_FIXGRAMMAR`: 文法の修正

- `AI_GENERATE`: テキストの生成

- `AI_MASK`: 機密情報のマスキング

- `AI_SENTIMENT`: 感情分析

- `AI_SIMILARITY`: テキストの意味的類似度の比較

- `AI_SUMMARIZE`: テキストの要約

- `AI_TRANSLATE`: 翻訳

- `AI_AGG`: 複数のテキストを行をまたいで集約・分析

### 例

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

各関数の詳細と使い方は、それぞれのドキュメントを参照してください。

