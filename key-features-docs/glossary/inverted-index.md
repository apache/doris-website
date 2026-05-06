---
slug: inverted-index
title: Inverted Index
summary: Maps terms to the set of documents containing them; the foundation of full-text search.
tags: [indexing, search, data-structure]
---

# Inverted Index

<TagChips />

An inverted index is a data structure that maps each unique term in a corpus to the list of document IDs (and often positions within documents) where that term appears. The "inversion" is relative to a forward index, which would map document IDs to their term contents.

## Why it matters

Full-text search at scale only works because of inverted indexes. To answer "which documents contain the word `apache`?" you don't scan every document — you look up `apache` in the index and read its posting list directly.

## In Doris

Inverted indexes in Doris support exact match, phrase match, and prefix match queries. They feed BM25 scoring for ranked retrieval and can be combined with bitmap operations for boolean queries (AND/OR/NOT across multiple terms).

<RelatedConcepts ids={['bm25']} />
