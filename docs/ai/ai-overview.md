---
{
    "title": "AI Overview",
    "language": "en",
    "description": "Apache Doris AI capabilities overview: text search, vector search, AI functions, and MCP, covering RAG, semantic search, Agent analytics, and more.",
    "keywords": [
        "Apache Doris AI",
        "vector search",
        "text search",
        "AI functions",
        "MCP Server",
        "RAG",
        "semantic search",
        "Lakehouse for AI",
        "Agent Facing Analytics",
        "AI Observability"
    ]
}
---

<!-- Knowledge type: Capability definition / Architecture decision -->
<!-- Applicable scenarios: Technology selection / AI data stack planning -->

Apache Doris is a high-performance, real-time analytical database that deeply integrates text search, vector search, AI functions, and MCP-based intelligent interaction. It builds a complete AI data stack covering data storage, retrieval, and analytics, providing unified data infrastructure for AI applications.

The following table lists common AI scenarios and the corresponding capabilities that Doris provides, helping you quickly identify the right solution.

| What you want to do | Scenario | Core capabilities |
|------|------|------|
| Let AI Agents query business data in real time | [Agent Facing Analytics](#agent-facing-analytics) | MPP architecture, millisecond-level queries, MCP Server |
| Run keyword search, vector search, and aggregation on the same data | [Hybrid search and analytics](#hybrid-search-and-analytics-processing) | Inverted index + vector index + SQL |
| Accelerate AI training data preparation and feature engineering | [Lakehouse for AI](#lakehouse-for-ai) | Lakehouse architecture, open table formats, fast SQL |
| Build enterprise knowledge bases and intelligent customer service | [RAG applications](#ragretrieval-augmented-generation) | High-concurrency vector retrieval, hybrid search |
| Monitor model training and inference services | [AI Observability](#ai-observability) | High-throughput ingestion, inverted index, low storage cost |
| Make search understand user intent | [Semantic search](#semantic-search) | HNSW/IVF, quantization, multimodal extensions |

## Agent Facing Analytics

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenarios: AI Agent real-time decision-making -->

As AI Agent technology gains traction, more analytical decisions are made automatically by AI, which requires the data platform to deliver extreme real-time performance and high concurrency. Unlike traditional "human analytics," Agent Facing Analytics needs to complete data queries and decisions within milliseconds and support concurrent access from massive numbers of Agents. Typical scenarios include real-time fraud detection, intelligent ad delivery, and personalized recommendations.

Powered by a high-performance MPP architecture, Doris offers the following advantages for Agent-facing analytics scenarios:

| Capability | Metric | Value |
|------|------|------|
| Data latency | Sub-second | Real-time ingestion and updates ensure that Agent decisions are based on the freshest data |
| Query response | Average < 100 ms | Meets the real-time decision needs of Agents |
| Concurrency | 10,000+ QPS | Easily handles concurrent queries from massive numbers of Agents |
| Integration | Native MCP Server | Seamlessly integrates with AI Agents and simplifies development |

## Hybrid Search and Analytics Processing

<!-- Knowledge type: Capability definition / Architecture decision -->
<!-- Applicable scenarios: Hybrid search and multi-dimensional analytics -->

![Hybrid Search and Analytics Processing architecture diagram](/images/vector-search/image-5.png)

Semi-structured and unstructured data is becoming a first-class citizen in data analytics. Customer reviews, chat logs, production logs, and vehicle telemetry signals are now deeply integrated into business decision-making. Traditional structured analytics solutions need to combine full-text search with vector search capabilities, supporting both semantic search and multi-dimensional analytics with aggregation on a single platform. Typical scenarios include:

- **Customer insights**: Combine review text retrieval with user behavior analysis to precisely identify customer needs and satisfaction trends.
- **Smart manufacturing**: Combine full-text search of production logs, equipment image recognition, and IoT metric analysis to enable failure prediction and quality optimization.
- **Connected vehicles**: Combine vehicle telemetry analysis, user feedback text mining, and driving behavior vector retrieval to improve the smart cockpit experience.

Advantages of building hybrid search and analytics applications on Doris:

- **Unified architecture**: Handle structured analytics, full-text search, and vector search on a single platform without data migration or heterogeneous system integration.
- **Hybrid query performance**: Run vector similarity search, keyword filtering, and aggregation in a single SQL statement with excellent query performance.
- **Flexible schema support**: The VARIANT type natively supports dynamic JSON structures, and Light Schema Change enables field and index changes within seconds.
- **Full-stack optimization**: End-to-end optimization from inverted index and vector index to the MPP execution engine balances retrieval accuracy with analytical efficiency.

## Lakehouse for AI

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: AI training data preparation / Feature engineering -->

Developing AI models and applications requires preparing training sets, performing feature engineering, and evaluating data quality from massive datasets. Traditional architectures often require frequent data migration between data lakes and analytical engines. The Lakehouse architecture deeply integrates the open storage of data lakes with real-time analytical engines, supporting the full workflow of data preparation, feature engineering, and model evaluation on a unified platform. This eliminates data silos and accelerates AI development iteration.

**Architectural characteristics**:

- **Lakehouse integration**: Build an open lakehouse based on open lake table formats (such as Iceberg and Paimon) and Catalogs to uniformly manage analytical data and AI data.
- **Fast SQL engine**: Doris serves as a real-time analytical engine that supports interactive queries and lightweight ETL, providing efficient SQL computing for data preparation and feature engineering.
- **Seamless data flow**: Read from and write to data lakes directly without data movement. The storage layer is uniformly managed while the compute layer offers flexible acceleration.

**Acceleration across the AI workflow**:

- **Large-scale data preparation**: Efficiently filter, sample, and clean data from PB-scale data lakes to quickly build high-quality training datasets.
- **Real-time feature engineering**: Perform online feature extraction, transformation, and aggregation to provide real-time feature services for model training and inference.
- **Quality evaluation**: Conduct multi-dimensional rapid analysis on test sets and production data to continuously monitor model performance and data drift.

## RAG (Retrieval-Augmented Generation)

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenarios: Enterprise knowledge base / Intelligent Q&A -->

RAG retrieves relevant information from external knowledge bases to provide context for large language models, effectively addressing model hallucination and the timeliness of knowledge. The vector engine is the core component of a RAG system. It needs to quickly recall the most relevant document fragments from a massive knowledge base while supporting high-concurrency user query requests to ensure a responsive application experience.

**Typical applications**:

- **Enterprise knowledge base**: Build an intelligent Q&A system based on internal documents and manuals so employees can quickly obtain accurate answers in natural language.
- **Intelligent customer service assistant**: Combine product knowledge bases with historical cases to provide precise reply suggestions for customer service agents or chatbots.
- **Intelligent document assistant**: Quickly locate relevant content within large document collections to support research, writing, and decision-making.

**Advantages of building RAG on Doris**:

- **High-concurrency performance**: A distributed architecture supports high-concurrency vector retrieval and easily handles large-scale concurrent user access.
- **Hybrid search capability**: Run vector similarity search and keyword filtering in a single SQL statement, balancing semantic recall with exact matching.
- **Elastic scaling**: Retrieval performance scales linearly as the cluster grows, transitioning smoothly from millions to tens of billions of vectors.
- **Unified solution**: Manage vector data, raw documents, and business data uniformly to simplify the data architecture of RAG applications.

## AI Observability

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenarios: Model training monitoring / Inference service tracing / AI application log analysis -->

AI model training iterations and application runtime generate massive volumes of logs, metrics, and trace data. To precisely locate issues and continuously optimize performance, observability systems have become a critical part of AI infrastructure. As business scale expands, observability platforms face the combined challenges of high-throughput ingestion of PB-scale data, millisecond-level retrieval response, and cost control.

**Typical use cases**:

- **Model training monitoring**: Track training metrics and resource consumption in real time to quickly identify training anomalies and performance bottlenecks.
- **Inference service tracing**: Record the full call chain of every inference request to analyze latency sources and error patterns.
- **AI application log analysis**: Perform full-text search and aggregation on massive application logs to support troubleshooting and behavior insights.

**Advantages of building AI Observability on Doris**:

| Dimension | Capability metrics |
|------|------|
| Ingestion performance | Supports PB/day (10 GB/s) sustained ingestion, with inverted indexes accelerating log retrieval and second-level response |
| Storage cost | Compression ratio of 5:1 to 10:1, saving 50%-80% in storage costs, with low-cost storage for cold data |
| Schema flexibility | Light Schema Change enables field changes within seconds, and the VARIANT type natively supports dynamic JSON |
| Ecosystem compatibility | Compatible with OpenTelemetry and the ELK ecosystem, integrating with visualization tools such as Grafana and Kibana |

## Semantic Search

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenarios: Semantic search / Cross-language retrieval / Content recommendation -->

Semantic search uses vectorization to capture the deep meaning of text, recalling semantically related content even when the query terms differ from the wording used in the documents. This is critical for cross-language retrieval, synonym recognition, intent understanding, and similar scenarios, and significantly improves search recall and user experience.

**Typical use cases**:

- **Enterprise document retrieval**: Employees describe questions in natural language, and the system understands the intent and recalls semantically relevant policies, processes, and knowledge from massive document repositories.
- **E-commerce product search**: A user enters "breathable shoes suitable for summer," and the system understands the need and recalls relevant products instead of matching only on keywords.
- **Content recommendation platforms**: Make intelligent recommendations based on the semantic similarity of articles and videos, surfacing content that the user may be interested in but that uses different wording.

**Advantages of building semantic search on Doris**:

- **High-performance vector retrieval**: Supports HNSW and IVF algorithms with sub-second response on hundred-million-scale vectors, easily handling large-scale semantic search needs.
- **Hybrid search enhancement**: A single SQL statement combines semantic search with keyword filtering to recall semantically related content while ensuring required keywords are matched.
- **Multimodal extension**: Supports semantic search not only for text but also for multimodal content such as images and audio.
- **Flexible quantization optimization**: SQ/PQ quantization techniques significantly reduce storage and computing costs while preserving retrieval accuracy.

## Related documents

- [Text search overview](../table-design/index/inverted-index/overview.md)
- [Vector search overview](../table-design/index/vector-index/overview.md)
- [AI functions overview](ai-function-overview.md)
- [Doris MCP Server (GitHub)](https://github.com/apache/doris-mcp-server)

