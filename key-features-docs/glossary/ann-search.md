---
slug: ann-search
title: ANN Search
summary: Approximate nearest neighbor search — the practical algorithm class for vector retrieval at scale.
tags: [search, ai, algorithm]
---

# ANN Search

<TagChips />

Approximate nearest neighbor (ANN) search is the practical alternative to exact k-NN when corpora exceed a few thousand vectors. Exact k-NN requires comparing the query vector against every candidate (O(n) per query); ANN trades a small amount of recall for orders-of-magnitude faster query time.

## Common algorithms

- **HNSW** (Hierarchical Navigable Small World): graph-based, excellent recall/latency tradeoff at the cost of memory.
- **IVF** (Inverted File): partitions the vector space into Voronoi cells; queries probe a small number of cells.
- **PQ** (Product Quantization): compresses vectors into compact codes, enabling in-memory storage of very large corpora.

## In Doris

Doris uses HNSW as the primary index for vector columns, with tunable `ef_construction` and `M` parameters per index. Vector search integrates with SQL: filters, joins, and aggregations apply to the same query that performs ANN retrieval.

<RelatedConcepts ids={['bm25']} />
