---
slug: hybrid-search
title: Hybrid Search
summary: Unified vector + full-text + scalar search in one engine.
related_concepts:
  - bm25
  - inverted-index
  - ann-search
---

# Hybrid Search

## What it solves

Modern applications need to combine three signals at query time: semantic similarity (vector search), keyword relevance (full-text), and traditional filters (scalar predicates). Most engines force a tradeoff — a vector database that can't filter by SQL, a search engine that can't do JOINs, or a data warehouse that can't rank by similarity. Doris brings all three into a single SQL surface.

## How it works

Doris stores vectors as a native type, with HNSW indexes for approximate nearest-neighbor search. The same table can also carry an inverted index for full-text columns and standard column-store indexes for scalar fields. A single SQL query can combine all three predicates, with the planner choosing pushdown order based on selectivity.

The relevance scoring stack supports BM25 for full-text, cosine/L2 distance for vectors, and arbitrary SQL expressions for re-ranking. Hybrid scoring across modalities is expressed declaratively rather than via custom code.

## When to use it

Pick Doris over a specialized vector DB when your retrieval pipeline already needs SQL filters, joins, or aggregations. Pick it over a pure search engine when you need stronger consistency, transactional updates, or analytical queries on the same data.

<RelatedConcepts />
