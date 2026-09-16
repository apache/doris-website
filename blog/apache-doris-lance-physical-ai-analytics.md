---
title: 'Apache Doris x Lance for Autonomous Driving and Robotics Analytics'
summary: 'Doris and Lance combine episode search, structured filters, and OLAP analysis to help teams find hard cases and diagnose failures in Physical AI data.'
description: 'How Apache Doris and Lance support hard-case mining for autonomous driving and failure analysis for robotics with open multimodal datasets.'
picked: "true"
order: "2"
keywords:
  - 'Apache Doris'
  - 'Lance Catalog'
  - 'Physical AI'
  - 'episode analytics'
date: '2026-09-08'
author: 'Apache Doris · Wenqiang Li'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-lance-physical-ai-analytics/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

> **Abstract:**
>
> Apache Doris 5.0 Multimodal Lakehouse Preview (1) | Scenario solutions: Autonomous vehicles and embodied intelligence systems generate massive volumes of multimodal data every day. The practical problem is finding high-value episodes quickly and identifying the scenarios, versions, and tasks associated with failures. This article explains how Apache Doris and Lance combine semantic search, structured filtering, and OLAP analytics for hard-case mining, failure attribution, and closed-loop training and evaluation on an open data architecture.

Autonomous vehicles generate video, point clouds, vehicle states, and model outputs every day. Each robot task also produces multiple camera streams, joint states, action trajectories, language instructions, and execution results. Storing this data is only part of the problem. Teams must also answer the questions that determine how efficiently they can iterate on their models:

- Which segments contain scenarios similar to the current accident?
- Has the intervention rate of the new model increased at night, in construction zones, or around irregularly shaped obstacles?
- Which types of robot tasks are most likely to fail, and what similar visual or action patterns appear before failure?
- How can selected high-value episodes be passed to annotation, training, and regression evaluation?

Traditional data warehouses handle structured aggregation well. Vector databases specialize in image similarity search, while object storage holds large numbers of files at low cost. Physical AI needs these capabilities to work together, so semantic search, structured filtering, business metrics, and raw evidence can be used in the same analytical workflow.

Apache Doris support for Lance Catalog provides that connection. Lance stores open multimodal datasets and vector indexes designed for AI. Doris queries the data directly and performs predicate pushdown, parallel scans, vector retrieval, global Top-K selection, and OLAP aggregation within a single SQL execution framework. Teams do not need to copy the data into a dedicated analytical replica first, and their AI data assets remain available to more than one compute system.

## 1. Why physical AI needs semantic search and analytics, not vector search alone

Data for autonomous driving and embodied intelligence is naturally organized around episodes. An episode is a reconstructable physical process rather than a single image: sensors observe the environment, a model makes a decision, a control system executes an action, and the physical world produces an outcome.

In autonomous driving, finding images similar to the five seconds before an accident is only the first step. Engineering teams must further constrain the search by vehicle model, sensor version, road type, weather, model version, and time range. They then need to compare intervention rates, false-positive rates, or planning deviations among the candidate segments. The same applies to embodied intelligence. A failed grasp involves visual semantics, but it must also be examined in the context of the task type, robot arm model, policy version, joint states, action trajectory, and final outcome.

Finding high-value data therefore requires at least three layers of computation:

1. Use structured conditions to narrow the search space to the correct business context.
2. Use vector similarity to find related scenarios that the labeling system does not yet cover.
3. Use aggregation, joins, sorting, and window analysis to turn candidate segments into model evaluation findings and actionable datasets.

Lance and Doris handle different parts of this process. Lance manages AI datasets, random access, and vector indexes. Doris brings the retrieval results into an explainable, composable SQL analytics system.

## 2. Overall architecture: Lance manages AI data assets, and Doris provides unified queries and analytics

![Apache Doris and Lance in the Physical AI data architecture](/images/blogs/apache-doris-lance-physical-ai-analytics/physical-ai-data-architecture.jpg)

**Figure 1. Apache Doris and Lance in the Physical AI data architecture**

In this architecture, upstream systems continue to use tools such as the Lance SDK, Ray, and Spark to generate and maintain Lance datasets. These datasets include features, embeddings, labels, model outputs, and existing Lance vector indexes. The data can reside in a local file system, S3-compatible object storage, or OSS.

Apache Doris uses Lance Catalog to discover datasets and schemas. During a query, Doris fixes the snapshot, divides fragments or index segments, runs scans and searches in parallel, and performs global Top-K selection and OLAP computation.

Apache Doris covers a layer that can otherwise be fragmented across separate tools before and after training. Engineers, algorithm teams, business analysts, and agents can use the same system to find data, validate models, locate problems, and construct the next training dataset.

## 3. Autonomous driving: Find similar video and build a closed hard-case mining loop

### 3.1 Finding high-value scenarios is the bottleneck

In autonomous driving development, hard-case mining means finding high-value scenarios within massive volumes of driving data where models are prone to false positives, false negatives, abnormal braking, or human intervention. These segments make up only a small proportion of all fleet data, but they directly affect model safety and coverage of long-tail scenarios.

Collecting the data is usually easier than finding the right records within the full set of driving data. The main bottlenecks and corresponding solutions include:

- **Anomalous segments are rare, and their context is scattered.** Vehicles continuously generate data from multiple cameras, point clouds, localization systems, vehicle states, and model outputs. An anomaly may exist only in a segment lasting a few seconds and may occur across different vehicle models, roads, weather conditions, and sensor versions. Doris can first narrow the search by business conditions such as time, vehicle model, road, weather, and model version.
- **Existing labels cannot cover all semantics.** Queries based only on time, vehicle, or labels can easily miss semantically similar segments that have not yet been labeled. Lance stores episode metadata, embeddings, and vector indexes, and Doris reuses those indexes to retrieve similar scenarios.
- **Similarity results are not yet engineering conclusions.** Vector similarity search alone may return results from irrelevant business contexts and cannot directly determine issue frequency, model-version regressions, or sample value. Once the candidate results enter Doris, distributed statistics and version comparisons can identify the episodes that should be included in annotation, training, and evaluation.

### 3.2 A practical hard-case mining workflow

Suppose a team wants to find segments that are visually and semantically similar to an emergency-braking event involving an irregularly shaped obstacle. The event occurred on urban roads, and the team wants to determine whether the problem is concentrated in a particular perception model version:

1. The Lance dataset stores `episode_id`, time, road and weather labels, vehicle model, model version, intervention or emergency-braking results, image or segment embeddings, and raw media location information.
2. Doris pushes down conditions such as time range, urban roads, vehicle model, and model version to narrow the search space before generating vector candidates.
3. Doris reuses existing Lance vector indexes and searches them in parallel. Fragments not covered by an index are automatically supplemented with Flat Search.
4. Each parallel task returns local candidates, which Doris merges into a global Top-K result.
5. SQL aggregates intervention rates, emergency-braking rates, and sample counts by model version, weather, and road type to produce a hard-case distribution.
6. Candidate `episode_id` values are sent for human review, annotation, inclusion in a training dataset, or regression evaluation. The Lance SDK reads the raw media precisely.

![Closed-loop hard-case mining for autonomous driving](/images/blogs/apache-doris-lance-physical-ai-analytics/autonomous-driving-hard-cases.jpg)

**Figure 2. Autonomous-driving hard-case mining: from fleet data to model iteration**

This workflow does not require every capability to live in one storage format. Instead, it keeps similar scenarios connected to their business context. Algorithm engineers receive more than a page of similar images. They can determine which versions exhibit similar problems, whether a regression is occurring, how many vehicles and road conditions are affected, and which episodes are most useful for the next training cycle.

### 3.3 Find similar scenarios with a single SQL query

Suppose an upstream tool has already created a `scene_embedding` index in the Lance dataset. Doris can start a search through `vector_search()`:

```SQL
SELECT
    episode_id,
    event_time,
    road_type,
    weather,
    model_version,
    intervention,
    _distance
FROM vector_search(
    "table" = "lance_ai.autodrive.scene_episodes",
    "column" = "scene_embedding",
    "query_vector" = "[0.12, -0.08, 0.31, ...]",
    "top_k" = "200",
    "metric" = "cosine",
    "nprobes" = "20",
    "refine_factor" = "10",
    "filter" = "road_type = 'urban' AND event_time >= '2026-08-01'",
    "use_index" = "true"
)
ORDER BY _distance ASC, episode_id;


```

Here, `filter` performs pre-filtering. It first restricts the search to the correct scenario range, then generates vector candidates. This behavior usually fits the semantics of hard-case mining better than post-filtering with `WHERE` outside the TVF. A smaller `_distance` value indicates greater similarity. Adding a unique key explicitly as the second sort field produces a stable return order when distances are equal.

Vector candidates can also feed standard SQL aggregation. For example, the following query calculates the distribution of interventions in similar scenarios by model version:

```SQL
WITH similar_scenes AS (
    SELECT model_version, weather, intervention, _distance
    FROM vector_search(
        "table" = "lance_ai.autodrive.scene_episodes",
        "column" = "scene_embedding",
        "query_vector" = "[0.12, -0.08, 0.31, ...]",
        "top_k" = "1000",
        "metric" = "cosine",
        "filter" = "road_type = 'urban'",
        "use_index" = "true"
    )
)
SELECT
    model_version,
    weather,
    COUNT(*) AS scene_count,
    SUM(CASE WHEN intervention THEN 1 ELSE 0 END) AS intervention_count
FROM similar_scenes
GROUP BY model_version, weather
ORDER BY intervention_count DESC;


```

## 4. Embodied intelligence: Make every episode searchable, comparable, and reviewable

### 4.1 Robot data requires cross-frequency alignment, random access, and cross-episode analytics

An embodied intelligence task typically produces data in several forms and at different frequencies. Robot arm states and control signals may be collected at hundreds of hertz, while multiple cameras record environmental changes at tens of frames per second. Other data includes language instructions, frame-level labels, intermediate model results, and information about task success, failure, and retries.

If this data is stored separately in video files, columnar files, and JSON, teams must maintain timestamp alignment and version mappings across those files. They must also repeatedly implement data-assembly logic for training, playback, and problem analysis. A random read may require locating the video segment first, then finding the corresponding state and action records. When schemas or features change, separate copies of the data can become inconsistent.

Training frameworks focus on reading batches of samples at high throughput. Research and development analytics has a different job: locating similar failures among millions of episodes, comparing policy and hardware versions, and determining whether problems originate in perception, planning, control, or execution. Random access alone cannot provide this type of cross-episode aggregation and attribution. Traditional data warehouse full-table scans are also unsuitable for all multimodal sample access.

Lance organizes states, actions, features, embeddings, and media location information by episode and timeline while preserving random-access paths for training and review. Doris performs conditional filtering, vector retrieval, and cross-episode aggregation over the supported fields. With this division of responsibilities, the same robot data can support model training, unified analysis, and review.

### 4.2 From failed tasks to a closed training-data loop

For failures involving robot arms attempting to grasp transparent or reflective objects, teams can use the following workflow:

1. Data from multiple cameras, joint states, action trajectories, instructions, policy versions, and task results enters Lance by episode.
2. An upstream model generates visual or trajectory embeddings and creates vector indexes in Lance.
3. Doris first performs pre-filtering by robot model, task type, policy version, and `success = false`.
4. Vector search finds images or action segments similar to the target failure pattern.
5. Doris aggregates failure reasons, retry counts, task duration, hardware versions, and policy versions to determine whether the issue is related to perception, planning, control, or hardware.
6. High-value episodes are sent for review, relabeling, and training. The corrected model is then subjected to regression validation against the same dataset.

![Robot Episode analysis workflow](/images/blogs/apache-doris-lance-physical-ai-analytics/robot-episode-analysis.jpg)

**Figure 3. Embodied-intelligence episode analysis: from multi-frequency sensors to a closed training loop**

This workflow also works well for agentic data processing. An agent can use SQL to define the task scope, invoke vector search to locate similar failures, and generate distribution statistics and a list of candidate episodes. Each step retains its filter conditions, SQL, and data versions. Reviewers can inspect how the results were produced instead of relying on a model to search file directories or a vector database without a traceable procedure.

### 4.3 Example: Search for robot failure patterns

The upstream system generates `query_vector` with the same embedding model used for `frame_embedding`. For example, it can pass a reference image, a representative video frame, or an action trajectory to the model and then provide the resulting floating-point array to `vector_search()`. The query vector's dimensions, numeric type, and normalization method must match the vector column in the dataset and the settings used when the index was created. The `[-0.04, 0.27, 0.18, ...]` value in this example only demonstrates the parameter format.

```SQL
SELECT
    episode_id,
    robot_model,
    policy_version,
    task_type,
    failure_reason,
    retry_count,
    _distance
FROM vector_search(
    "table" = "lance_ai.robotics.task_episodes",
    "column" = "frame_embedding",
    "query_vector" = "[-0.04, 0.27, 0.18, ...]",
    "top_k" = "300",
    "metric" = "cosine",
    "filter" = "task_type = 'pick' AND success = false",
    "use_index" = "true"
)
ORDER BY _distance ASC, episode_id;


```

The results can then be aggregated by `policy_version`, `robot_model`, or `failure_reason`. The query can instead return `episode_id` and media location fields, allowing an application to use the Lance SDK to open the corresponding video frames, point clouds, or other Blob content for review.

> Availability: Lance Catalog support is in the Doris 4.2 release branch and is scheduled for public release at the end of September. The SQL below shows the planned public syntax.

## 5. How to use Lance Catalog in Apache Doris

### 5.1 Connect to a Lance dataset in object storage

The following example uses S3-compatible object storage. In production environments, supply access keys through secure credential management rather than writing them directly into shared scripts.

```SQL
CREATE CATALOG lance_ai PROPERTIES (
    "type" = "lance",
    "lance.catalog.type" = "filesystem",
    "warehouse" = "s3://<bucket>/physical-ai",
    "s3.endpoint" = "https://<object-storage-endpoint>",
    "s3.region" = "<region>",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>"
);


```

Doris also supports local file systems, OSS, and Lance REST Catalogs authenticated with Bearer Tokens, API Keys, or custom headers. Filesystem Catalog maps namespaces by directory: a first-level directory under the warehouse root corresponds to a Doris database, and a `.lance` directory corresponds to a table.

### 5.2 Discover datasets, schemas, and existing indexes

```SQL
SHOW DATABASES FROM lance_ai;
SHOW TABLES FROM lance_ai.autodrive;
DESC lance_ai.autodrive.scene_episodes;
SHOW INDEX FROM lance_ai.autodrive.scene_episodes;


```

`SHOW INDEX` displays indexes that tools in the Lance ecosystem have already created.

### 5.3 Run vector queries through the Catalog

```SQL
SELECT episode_id, event_time, model_version, _distance
FROM vector_search(
    "table" = "lance_ai.autodrive.scene_episodes",
    "column" = "scene_embedding",
    "query_vector" = "[0.12, -0.08, 0.31, ...]",
    "top_k" = "200",
    "metric" = "cosine",
    "filter" = "road_type = 'urban'",
    "use_index" = "true"
)
ORDER BY _distance ASC, episode_id;


```

Catalog creation, dataset discovery, and vector search all remain within the same Catalog namespace. `filter` restricts candidates to urban-road scenarios before candidate generation, while `_distance` returns the similarity distance. The query vector's dimensions and distance metric must match those used by the upstream system to generate embeddings and create the Lance index.

Pre-filtering and post-filtering differ in when their conditions take part in candidate generation.

- A condition in the `filter` parameter of `vector_search()` is a pre-filter. Lance first filters the data and then performs vector retrieval within that subset. Therefore, `top_k` represents the Top-K results among the filtered data. This is suitable for conditions such as road type, time range, vehicle model, tenant, or data permissions that must constrain the search space.
- A condition in `WHERE` outside the TVF is a post-filter. Vector search produces candidates first, and Doris then filters those candidates. This is suitable for expressions that Lance cannot currently push down or for scenarios that require semantic retrieval before business filtering. However, the final result may contain fewer than `top_k` entries, and the system will not automatically expand the retrieval range to fill the requested count.

A query can combine both approaches. Put strong constraints that define the search scope in `filter`, place complex calculations or remaining conditions in the outer `WHERE`, and use `EXPLAIN` to confirm which conditions have been pushed down.

### 5.4 Use EXPLAIN to confirm predicate pushdown and index use

Before running a query, use `EXPLAIN` with the same `vector_search()` query. In the execution plan, `lancePushdownPredicate` indicates that pre-search conditions have been pushed down, while `lanceSearchIndexSegments` indicates that Lance index segments have been planned. Doris supplements new fragments not covered by the index with Flat Search so that the query includes all data in the current snapshot.

```SQL
EXPLAIN
SELECT episode_id, _distance
FROM vector_search(
    "table" = "lance_ai.autodrive.scene_episodes",
    "column" = "scene_embedding",
    "query_vector" = "[0.12, -0.08, 0.31, ...]",
    "top_k" = "200",
    "metric" = "cosine",
    "filter" = "road_type = 'urban'",
    "use_index" = "true"
)
ORDER BY _distance ASC, episode_id;


```

### 5.5 Use a TVF for temporary reads without creating a Catalog

If you only need to analyze a specific Lance dataset temporarily and do not want to manage it through a Catalog, you can use the S3 TVF directly. The TVF is suitable for path-based reads and scalar analysis. If you need to reuse datasets, schemas, and vector indexes from a Catalog, use the Lance Catalog and `vector_search()` described above.

```SQL
SELECT episode_id, event_time, model_version
FROM s3(
    "uri" = "s3://<bucket>/physical-ai/autodrive/scene_episodes.lance",
    "s3.endpoint" = "https://<object-storage-endpoint>",
    "s3.region" = "<region>",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>",
    "format" = "lance"
)
WHERE event_time >= '2026-08-01';


```

## 6. Conclusion: Connect AI data to decisions

Autonomous driving and embodied intelligence systems will continue to produce large amounts of data. The scarce resource is the set of high-value episodes that can explain model problems, cover long-tail scenarios, and inform the next iteration.

Apache Doris and Lance provide a direct path from multimodal assets to business decisions while retaining open formats. Lance organizes and indexes AI data and supports random access. Doris makes the data filterable, searchable, aggregatable, and understandable by both people and agents through unified SQL.

With this workflow, finding similar scenarios leads directly to questions about which version is affected, how often the issue occurred, whether it is a regression, and which training dataset should include it. Multimodal data can then participate in the closed loop for model iteration and business decision-making.

### 6.1 Doris and Lance development roadmap

The multimodal lakehouse capabilities for Iceberg, Paimon, Lance, and other formats have currently been merged into the Doris 4.2 release branch and are planned for official release with version 4.2 at the end of September.

Future work will focus on the performance, stability, and usability of Doris and Lance in the following areas:

- Establishing reproducible benchmarks across different data volumes, vector dimensions, Top-K values, filter selectivity, index coverage, concurrency levels, and cold or warm caches.
- Measuring P50, P95, and P99 latency, throughput, recall, bytes scanned, object-storage requests, network traffic, peak CPU usage, and peak memory usage.
- Continuing to optimize split balancing, large Top-K merges, high-dimensional vectors, lookups of wide result columns, object-storage reads, and cache paths.
- Providing scenario-specific recommendations for parameters such as `nprobes`, `refine_factor`, `ef`, and `use_index`, and developing capacity-planning and troubleshooting guides.
- Improving Lance table-management capabilities.
- Supporting data export to Lance files.
