---
slug: lz4-compression
title: LZ4 Compression
summary: Fast lossless compression algorithm used in Doris storage and shuffle paths.
tags: [storage, algorithm]
---

# LZ4 Compression

<TagChips />

LZ4 is a lossless byte-level compression algorithm prioritized for speed over compression ratio. It is widely used in systems where compression must not become a CPU bottleneck — including Apache Doris's storage format and inter-node shuffle.

## Tradeoff

LZ4 compresses at ~500 MB/s and decompresses at ~2 GB/s on commodity hardware. Compression ratio is typically 1.5–3× — worse than zstd or gzip, but the raw throughput makes it the right choice for hot paths where the alternative is no compression at all.

## In Doris

Doris uses LZ4 as a default codec for column data and shuffle. For cold/archival data, zstd (higher ratio, slower) is selectable per column or per partition.

<RelatedConcepts />
