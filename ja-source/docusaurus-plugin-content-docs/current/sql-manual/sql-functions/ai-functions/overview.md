---
{
  "title": "概要 | Ai Functions",
  "language": "ja",
  "description": "AI Functionは、人工知能（AI）機能に基づいてDorisが提供する組み込み関数です。",
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

AI Functionは、人工知能（AI）機能に基づいてDorisが提供する組み込み関数です。ユーザーはSQLクエリ内でAIを直接呼び出して、様々なインテリジェントなテキストタスクを実行できます。AI FunctionはDorisのリソースメカニズムを通じて、複数の主要なAIプロバイダー（OpenAI、Anthropic、DeepSeek、Gemini、Ollama、MoonShotなど）に接続します。

使用されるAIは、Dorisによって外部から提供され、テキスト分析をサポートする必要があります。

---

## AI Resourceの設定

AI Functionを使用する前に、AI API のアクセス情報を一元管理するためにAIタイプのResourceを作成する必要があります。

### 例：AI Resourceの作成

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
##### パラメータ説明

`type`: 必須、`ai`である必要があります。aiのタイプ識別子として使用されます。

`ai.provider_type`: 必須、外部AIプロバイダータイプ。現在サポートされているプロバイダーには以下が含まれます: OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan。上記にないプロバイダーでも、そのAPIフォーマットが[OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1)と同じであれば、対応するプロバイダーを直接入力できます。

`ai.endpoint`: 必須、AI APIエンドポイント。

`ai.model_name`: 必須、モデル名。

`ai_api_key`: `ai.provider_type = local`の場合を除いて必須、APIキー。

`ai.temperature`: オプション。生成されるコンテンツのランダム性を制御します。0から1の間のfloat値を受け入れます。
デフォルト値は-1で、このパラメータが設定されていないことを意味します。

`ai.max_tokens`: オプション。生成されるコンテンツの最大トークン数を制限します。
デフォルト値は-1で、このパラメータが設定されていないことを意味します。Anthropicのデフォルト値は2048です。

`ai.max_retries`: オプション。単一リクエストの最大再試行回数。デフォルト値は3です。

`ai.retry_delay_second`: オプション。再試行前の遅延時間（秒）。デフォルト値は0です。

`ai.dimensions`: オプション、[EMBED](./distance-functions/embed.md)出力のベクトル次元を制御します。
**設定する前に、`ai.model_name`に入力されたモデルがカスタムベクトル次元をサポートしていることを必ず確認してください**。
そうでなければ、モデル呼び出しの失敗を引き起こす可能性があります。

---

## リソース選択とSessionVariables

ユーザーがAI関連機能を呼び出す際、リソースは以下の2つの方法で指定できます:

- リソースを明示的に指定する: 関数呼び出し時にリソース名を直接渡します。
- リソースを暗黙的に指定する: Session変数を事前に設定し、関数が自動的に対応するリソースを使用します。

Session変数設定フォーマット:

```sql
SET default_ai_resource='resource_name';
```
関数呼び出し形式:

```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```
### リソース選択優先順位

AI_Functionを呼び出す際、以下の順序でどのリソースを使用するかを決定します：

1. 呼び出し時にユーザーが明示的に指定したリソース
2. グローバルデフォルトリソース（`default_ai_resource`）

例：

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```
---

## AI Functions

現在Dorisでサポートされているおあるいは Functions には以下があります：

- `AI_CLASSIFY`: 情報分類

- `AI_EXTRACT`: 情報抽出

- `AI_FILTER`：情報フィルタリング

- `AI_FIXGRAMMAR`: 文法修正

- `AI_GENERATE`: テキスト生成

- `AI_MASK`: 機密情報のマスキング

- `AI_SENTIMENT`: 感情分析

- `AI_SIMILARITY`: テキスト意味類似度比較

- `AI_SUMMARIZE`: テキスト要約

- `AI_TRANSLATE`: 翻訳

- `AI_AGG`: 複数のテキストに対するクロス行集約分析の実行

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
詳細な機能と使用方法については、各関数の具体的なドキュメントを参照してください。
