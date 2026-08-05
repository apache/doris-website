---
{
    "title": "EMBED",
    "language": "zh-CN",
    "description": "根据文本、图像、视频或音频输入生成嵌入向量。"
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

## 描述

根据文本或多模态输入生成嵌入向量，可用于相似度计算、检索等场景。

生成多模态嵌入向量时，需要传入描述图像、视频或音频文件的 JSON 对象。使用某种媒体类型前，请确认配置的 AI Provider 和模型支持该类型。

## 语法


```sql
EMBED([<resource_name>], <input>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<resource_name>` | 可选。用于生成嵌入向量的 AI Resource 名称。省略时，Doris 使用会话变量 `default_ai_resource` 指定的资源。 |
| `<input>` | 需要生成嵌入向量的内容。文本嵌入传入字符串，多模态嵌入传入 JSON 对象。 |

多模态 JSON 对象包含以下字段：

| 字段 | 是否必需 | 说明 |
| ---- | -------- | ---- |
| `uri` | 是 | `http://` 或 `https://` URL，或者格式为 `s3://<bucket>/<key>` 的 S3 兼容存储 URI。 |
| `content_type` | 是 | 媒体的 MIME 类型。以 `image/`、`video/` 或 `audio/` 开头的值会被识别，且 AI Provider 和模型必须支持对应的媒体类型。 |
| `endpoint` | 使用 S3 兼容存储 URI 时必需 | S3 兼容存储的 Endpoint。 |
| `region` | 使用 S3 兼容存储 URI 时必需 | 对象存储所在的 Region。 |
| `ak` | 否 | 使用 AK/SK 鉴权时的 Access Key。 |
| `sk` | 否 | 使用 AK/SK 鉴权时的 Secret Key。 |
| `role_arn` | 否 | 使用 IAM Role 鉴权时的 Role ARN。 |
| `external_id` | 否 | Assume Role 时使用的 External ID。 |

使用 HTTP 或 HTTPS URL 时，只需提供 `uri` 和 `content_type`。使用 S3 兼容存储 URI 时，Doris 会根据对象存储凭证生成预签名 URL，支持 AK/SK 和 IAM Role 两种鉴权方式。

## 返回值

返回类型为 `ARRAY<FLOAT>`，表示生成的嵌入向量。

当输入值为 NULL 时返回 NULL。

向量的维度和值由 AI Provider 和模型决定。

## 多模态示例

以下示例为可通过 HTTPS URL 访问的图像生成嵌入向量：

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

以下示例使用 AK/SK 鉴权，从 S3 兼容对象存储读取视频并生成嵌入向量：

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

也可以使用 IAM Role 代替 AK/SK 进行鉴权。以下示例生成图像嵌入向量：

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

以上结果仅供参考，实际的嵌入向量维度取决于配置的 Provider 和模型。

## 文本示例

下表模拟某公司的行为手册

```sql
CREATE TABLE knowledge_base (
    id BIGINT,
    title STRING,
    content STRING,
    embedding ARRAY<FLOAT> COMMENT '由 EMBED 函数生成的嵌入向量'
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES (
    "replication_num" = "1"
);

SET default_ai_resource = 'embed_resource_name';

-- `embedding` 是函数 EMBED 根据 content 对应的标签所生成的嵌入向量
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

通过对文本的向量化处理，可以进行类似下列操作：

1. 问答检索(结合 `COSINE_DISTANCE`)
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


2. 问题分析匹配(结合 `L2_DISTANCE`)
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

3. 根据文章内容进行文本相关度匹配并推荐(结合`INNER PRODUCT`) 
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

4. 寻找差异较小的内容(结合`L1_DISTANCE`)
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
