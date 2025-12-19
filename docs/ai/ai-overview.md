---
{
    "title": "AI Overview",
    "language": "en",
    "description": "<!-- Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
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


As AI technologies continue to advance at an unprecedented pace, data infrastructure has become the cornerstone of modern AI applications. Apache Doris, a high-performance real-time analytical database, provides native integration of full-text search, vector search, AI functions, and MCP-based intelligent interaction. Together, these capabilities form a comprehensive AI data stack that spans storage, retrieval, and analysis.

- [full-text search](text-search/overview.md)
- [vector search](vector-search/overview.md)
- [AI functions](ai-function-overview.md)
- [Doris MCP Server](https://github.com/apache/doris-mcp-server)

Doris delivers a unified, high-performance, and cost-efficient solution for a wide range of AI-driven workloads, including hybrid search and analytics, agent facing data analysis, semantic search, RAG application development, and observability for large-scale AI systems.

## Agent Facing Analytics

With the rise of AI Agent technology, an increasing number of analytical decisions will be completed automatically by AI, requiring data platforms to deliver ultimate real-time performance and high concurrency capabilities. Unlike traditional "manual analysis," Agent Facing Analytics demands data queries and decision-making to be completed at millisecond scale, supporting concurrent access from massive numbers of Agents. Typical scenarios include real-time fraud detection, intelligent advertising placement, and personalized recommendations.

Doris demonstrates outstanding advantages in these agent-facing analytical scenarios with its high-performance MPP architecture:

- **Real-Time Ingestion & Update**: ensuring Agent decisions are based on the latest data, ~ 1s minimum data latency

- **Blazing-Fast Analytics**: Average query latency < 100ms, meeting real-time decision requirements for Agents
- **High-Concurrent Queries**: Supports 10,000+ QPS, easily handling massive Agent concurrent queries
- **Native Agent integration**: Seamlessly integrates with AI Agents through MCP Server, simplifying development and integration workflows

## Hybrid Search and Analytics Processing

![img](/images/vector-search/image-5.png)

Semi-structured and unstructured data are becoming first-class citizens in data analytics. Customer reviews, chat logs, production logs, vehicle signals, and other data have been deeply integrated into business decision-making processes. Traditional structured analytics solutions need to incorporate full-text retrieval and vector search capabilities, supporting semantic search while enabling multidimensional analysis and aggregation statistics on the same platform. Examples include:

- **Customer insights**: Combining review text retrieval with user behavior analysis to precisely identify customer needs and satisfaction trends
- **Smart manufacturing**: Integrating production log full-text search, equipment image recognition, and IoT metric analysis to achieve fault prediction and quality optimization
- **Internet of Vehicles**: Synthesizing vehicle signal data analysis, user feedback text mining, and driving behavior vector retrieval to enhance smart cockpit experiences

Building AI applications for the above scenarios based on Doris's high-performance real-time analytics, text indexing, and vector indexing capabilities offers multiple advantages:

- **Unified architecture**: Processes structured analytics, full-text retrieval, and vector search on a single platform, eliminating data migration and heterogeneous system integration
- **Hybrid query performance**: Single SQL executes vector similarity search, keyword filtering, and aggregation analysis simultaneously with excellent query performance
- **Flexible schema support**: VARIANT type natively supports dynamic JSON structures, Light Schema Change enables second-level field and index modifications
- **Full-stack optimization**: End-to-end optimization from inverted indexes and vector indexes to MPP execution engine, balancing retrieval accuracy and analytical efficiency

## Lakehouse for AI

AI model and application development requires preparing training sets, performing feature engineering, and evaluating data quality from massive datasets. Traditional architectures often require frequent data migration between data lakes and analytical engines. The Lakehouse architecture deeply integrates the open storage of data lakes with real-time analytical engines, supporting the entire workflow of data preparation, feature engineering, and model evaluation on a unified platform, eliminating data silos and accelerating AI development iterations.

- **Lakehouse unified architecture**: Builds an open lakehouse based on open table formats (such as Iceberg/Paimon) and Catalogs, uniformly managing analytical data and AI data
- **Real-Time Analytics Engine**: Doris serves as a real-time analytical engine, supporting interactive queries and lightweight ETL, providing the fastest SQL computing capabilities for data preparation and feature engineering
- **Seamless data flow**: Directly reads and writes to data lakes without data movement, unified management at the storage layer and flexible acceleration at the compute layer

Lakehouse architecture based on Doris accelerates the entire AI workflow:

- **Large-scale data preparation**: Leveraging Doris's efficient data processing capabilities to filter, sample, and cleanse data from PB-scale data lakes, rapidly building high-quality training datasets
- **Real-time feature engineering**: Utilizing Doris's real-time analytics capabilities to perform online feature extraction, transformation, and aggregation computing, providing real-time feature services for model training and inference
- **Quality evaluation**: Conducting multidimensional rapid analysis on test sets and production data, continuously monitoring model performance and data drift

## RAG (Retrieval-Augmented Generation)

RAG retrieves relevant information from external knowledge bases to provide context for large models, effectively addressing model hallucination and knowledge currency issues. The vector engine is a core component of RAG systems, requiring rapid recall of the most relevant document fragments from massive knowledge bases while supporting high-concurrency user query requests to ensure application responsiveness.

- **Enterprise knowledge**: Building intelligent Q&A systems based on internal documents and manuals, enabling employees to quickly obtain accurate answers through natural language
- **Intelligent customer service assistant**: Combining product knowledge bases and historical cases to provide precise response suggestions for customer service personnel or chatbots
- **Intelligent document assistant**: Rapidly locating relevant content in large-scale document collections to assist research, writing, and decision-making processes

Building RAG applications based on Doris offers the following advantages in these scenarios:

- **High concurrency performance**: Distributed architecture supports high-concurrency vector retrieval, easily handling large-scale concurrent user access
- **Hybrid retrieval capability**: Single SQL executes vector similarity search and keyword filtering simultaneously, balancing semantic recall and exact matching
- **Elastic scaling**: Query performance scales linearly with cluster expansion, seamlessly transitioning from millions to tens of billions of vectors
- **Unified solution**: Uniformly manages vector data, original documents, and business data, simplifying the data architecture for RAG applications

## AI Observability

AI model training iterations and application operations generate massive amounts of logs, metrics, and tracing data. To precisely locate issues and continuously optimize performance, observability systems have become a critical component of AI infrastructure. As business scale expands, observability platforms face multiple challenges including high-throughput writes of PB-scale data, millisecond-level retrieval response, and cost control. Typical use cases include:

- **Model training monitoring**: Real-time tracking of training metrics and resource consumption, rapidly identifying training anomalies and performance bottlenecks
- **Inference service tracing**: Recording the complete trace of each inference request, analyzing latency sources and error patterns
- **AI** **application log analysis**: Full-text retrieval and aggregation analysis of massive application logs, supporting troubleshooting and behavioral insights

Building AI Observability with Doris offers the following advantages:

- **Ultimate performance**: Supports sustained writes of PB/day (10GB/s), inverted indexes accelerate log retrieval with second-level response
- **Cost optimization**: Compression ratios of 5:1 to 10:1, storage cost savings of 50%-80%, supports low-cost storage for cold data
- **Flexible schema**: Light Schema Change enables second-level field modifications, VARIANT type natively supports dynamic JSON structures
- **Ecosystem-friendly**: Compatible with OpenTelemetry and ELK ecosystems, supports integration with Grafana/Kibana visualization tools

## Semantic Search

Semantic search captures the deep meaning of text through vectorization techniques. Even when query terms differ from document wording, semantically relevant content can still be retrieved. This is crucial for scenarios such as cross-language retrieval, synonym recognition, and intent understanding, significantly improving search recall rates and user experience. Typical use cases include:

- **Enterprise document retrieval**: Employees describe issues in natural language, and the system understands intent to recall semantically relevant policies, procedures, and knowledge from massive documents
- **E-commerce product search**: Users input "breathable shoes suitable for summer," and the system understands the need to recall relevant products rather than merely matching keywords
- **Content recommendation**: Intelligent recommendations based on semantic similarity of articles and videos, discovering content of potential interest with different wording

Building semantic search applications based on Doris offers the following advantages:

- **High-performance vector retrieval**: Supports HNSW and IVF algorithms, sub-second response for hundred-million-scale vectors, easily handling large-scale semantic search requirements
- **Enhanced hybrid retrieval**: Single SQL integrates semantic search and keyword filtering, ensuring necessary vocabulary hits while recalling semantically relevant content
- **Multimodal extension**: Supports not only text semantic search but can also extend to semantic retrieval of multimodal content such as images and audio
- **Flexible quantization optimization**: Through SQ/PQ quantization techniques, significantly reduces storage and computing costs while maintaining retrieval accuracy
