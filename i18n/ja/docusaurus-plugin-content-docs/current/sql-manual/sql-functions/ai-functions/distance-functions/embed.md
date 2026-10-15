---
{
    "title": "EMBED",
    "language": "ja",
    "description": "テキスト、画像、動画、音声の入力から埋め込みベクトルを生成します。"
}
---

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

テキストまたはマルチモーダル入力の埋め込みベクトルを生成します。ベクトルは類似度計算や検索などに使用できます。

:::note
マルチモーダル埋め込みは Apache Doris 4.1.4 以降でサポートします。
:::

マルチモーダル埋め込みでは、画像、動画、音声ファイルを記述する JSON オブジェクトを渡します。メディアの種類を使用する前に、設定した AI プロバイダーとモデルが対応していることを確認してください。

### マルチモーダル埋め込み対応プロバイダー

| プロバイダー | 対応するメディアの種類 |
| --- | --- |
| `voyageai` | 画像 (`image/`), 動画 (`video/`) |
| `qwen` | 画像 (`image/`), 動画 (`video/`) |
| `jina` | 画像 (`image/`), 動画 (`video/`) |
| `gemini` | 画像 (`image/`), 動画 (`video/`), 音声 (`audio/`) |

上記以外のプロバイダーでマルチモーダル埋め込みを呼び出すと、`<provider> does not support multimodal Embed feature.` が返されます。プロバイダーが対応しないメディアの種類を渡すと、`<provider> only supports <types> multimodal embed, got <type>` が返されます。

## 構文

```sql
EMBED([<resource_name>], <input>)
```

## 引数

| 引数         | 説明 |
| ----------------- | ----------- |
| `<resource_name>` | 省略可能。埋め込みの生成に使用する AI リソース。省略すると、Doris はセッション変数 `default_ai_resource` を使用します。 |
| `<input>`         | 埋め込む内容。テキスト埋め込みでは文字列、マルチモーダル埋め込みでは JSON オブジェクトを指定します。 |

マルチモーダル用 JSON オブジェクトには、次のフィールドがあります。

| フィールド | 必須 | 説明 |
| ----- | -------- | ----------- |
| `uri` | はい | `http://` または `https://` URL、または S3 互換 URI（`s3://<bucket>/<key>` 形式）。 |
| `content_type` | はい | メディアの MIME タイプ。`image/`、`video/`、`audio/` で始まる値を認識します。AI プロバイダーとモデルがその種類に対応している必要があります。 |
| `endpoint` | S3 互換 URI の場合 | S3 互換ストレージのエンドポイント。 |
| `region` | S3 互換 URI の場合 | ストレージのリージョン。 |
| `ak` | いいえ | AK/SK 認証用のアクセスキー。 |
| `sk` | いいえ | AK/SK 認証用のシークレットキー。 |
| `role_arn` | いいえ | ロールベース認証用の IAM ロール ARN。 |
| `external_id` | いいえ | IAM ロールを引き受ける際に使用する外部 ID。 |

HTTP または HTTPS URL の場合、必須なのは `uri` と `content_type` だけです。S3 互換 URI の場合、Doris はストレージの認証情報を使用して署名付き URL を生成します。AK/SK 認証と IAM ロール認証の両方に対応します。

署名付き URL の有効期間はセッション変数 `file_presigned_url_ttl_seconds` で秒単位に指定し、デフォルトは `3600`（1 時間）です。メディアファイルが大きく、プロバイダーによる取得に時間がかかる場合は、この値を増やしてください。

```sql
SET file_presigned_url_ttl_seconds = 7200;
```

## 戻り値

戻り値は、生成されたベクトルを表す `ARRAY<FLOAT>` 型です。

入力値が NULL の場合は NULL を返します。

ベクトルの次元と値は AI プロバイダーとモデルによって異なります。

## マルチモーダルの例

次の例では、HTTPS URL でアクセスできる画像の埋め込みを生成します。

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "https://example.com/images/product.png",
            "content_type": "image/png"
        }' AS JSON)
    )
) AS image_embedding_dimension;
```

```text
+---------------------------+
| image_embedding_dimension |
+---------------------------+
|                      2560 |
+---------------------------+
```

次の例では、AK/SK 認証を使用して S3 互換ストレージから動画を読み込みます。

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "s3://example-bucket/videos/demo.mp4",
            "content_type": "video/mp4",
            "endpoint": "s3.us-east-1.amazonaws.com",
            "region": "us-east-1",
            "ak": "<access_key>",
            "sk": "<secret_key>"
        }' AS JSON)
    )
) AS video_embedding_dimension;
```

```text
+---------------------------+
| video_embedding_dimension |
+---------------------------+
|                      2560 |
+---------------------------+
```

AK/SK の代わりに IAM ロール認証も使用できます。次の例では画像の埋め込みを生成します。

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "s3://example-bucket/images/product.png",
            "content_type": "image/png",
            "endpoint": "s3.us-east-1.amazonaws.com",
            "region": "us-east-1",
            "role_arn": "arn:aws:iam::<account_id>:role/<role_name>",
            "external_id": "<external_id>"
        }' AS JSON)
    )
) AS image_embedding_dimension;
```

```text
+---------------------------+
| image_embedding_dimension |
+---------------------------+
|                      3072 |
+---------------------------+
```

上記の結果は例です。実際の埋め込み次元数は設定したプロバイダーとモデルによって異なります。

## テキストの例

次のテーブルは企業の行動規範を模したものです。

```sql
CREATE TABLE knowledge_base (
    id BIGINT,
    title STRING,
    content STRING,
    embedding ARRAY<FLOAT> COMMENT 'Generated embedding vectors by the EMBED function'
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES (
    "replication_num" = "1"
);

SET default_ai_resource = 'embed_resource_name';

-- `embedding` is the embedding vector generated by the function EMBED according to the corresponding tag of the content.
INSERT INTO knowledge_base (id, title, content, embedding) VALUES
(1, "Travel Reimbursement Policy",
    "Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.",
    EMBED("travel reimbursement policy")),
(2, "Leave Policy",
    "Employees must apply for leave in the system in advance. If the leave is longer than three days, approval from the direct manager is required.",
    EMBED("leave request policy")),
(3, "VPN User Guide",
    "To access the internal network, employees must use VPN. For the first login, download and install the client and configure the certificate.",
    EMBED("VPN guide intranet access")),
(4, "Meeting Room Reservation",
    "Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.",
    EMBED("meeting room booking reservation")),
(5, "Procurement Request Process",
    "Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required.",
    EMBED("procurement request process finance"));
```

テキストをベクトル化すると、次のような操作ができます。

1. 質問応答のための検索（`COSINE_DISTANCE` を使用）
```sql
SELECT 
    id, title, content,
    COSINE_DISTANCE(embedding, EMBED("How to apply for travel reimbursement?")) AS score
FROM knowledge_base
ORDER BY score ASC
LIMIT 2;
```

```text
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                 | score              |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    1 | Travel Reimbursement Policy | Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.        | 0.4463210454563673 |
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required. | 0.5726841578491431 |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```

2. 問題分析のマッチング（`L2_DISTANCE` を使用）
```sql
SELECT 
    id, title, content,
    L2_DISTANCE(embedding, EMBED("How to access the company intranet")) AS distance
FROM knowledge_base
ORDER BY distance ASC
LIMIT 2;
```

```text
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                     | distance           |
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    3 | VPN User Guide              | To access the internal network, employees must use VPN. For the first login, download and install the client and configure the certificate. | 0.5838271122253775 |
|    1 | Travel Reimbursement Policy | Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.            |  1.272394695975331 |
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```

3. 記事の内容に基づくテキストの関連性マッチングと推薦（`INNER PRODUCT` を使用）
```sql
SELECT 
    id, title, content,
    INNER_PRODUCT(embedding, EMBED("Leave system request leader approval")) AS score
FROM knowledge_base
WHERE id != 2
ORDER BY score DESC
LIMIT 2;
```

```text
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
| id   | title                       | content                                                                                                                                 | score               |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required. |    0.33268885332504 |
|    4 | Meeting Room Reservation    | Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.                         | 0.29224032230852487 |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
```

4. 差異が最も小さいコンテンツの検索（`L1_DISTANCE` を使用）
```sql
SELECT 
    id, title, content,
    L1_DISTANCE(embedding, EMBED("Procurement application process")) AS distance
FROM knowledge_base
ORDER BY distance ASC
LIMIT 3;
```

```text
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                        | distance           |
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required.        |  18.66882028897362 |
|    4 | Meeting Room Reservation    | Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.                                |  30.90449328294426 |
|    2 | Leave Policy                | Employees must apply for leave in the system in advance. If the leave is longer than three days, approval from the direct manager is required. | 31.060405636536416 |
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```
