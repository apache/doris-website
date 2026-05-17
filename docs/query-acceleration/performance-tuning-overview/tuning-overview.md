---
{
    "title": "Performance Tuning Overview",
    "language": "en",
    "description": "What to do when Apache Doris queries are slow? This article introduces the overall workflow, methodology, and tooling system for performance tuning, helping you quickly locate slow SQL, analyze bottlenecks, and apply optimizations.",
    "keywords": ["Doris performance tuning", "slow queries", "slow SQL diagnosis", "performance bottleneck analysis", "tuning methodology"]
}
---

<!-- Knowledge type: Concept + Process -->
<!-- Applicable scenario: First exposure to Doris performance tuning, need to build an overall understanding -->

Query performance tuning is a systematic effort that requires evaluating and optimizing the database system across multiple layers and dimensions. From a practitioner's perspective, this article introduces the overall workflow, methodology, and tooling system for Apache Doris performance tuning.

## Opening Checklist: Confirm Before You Start Tuning

<!-- Knowledge type: Pre-check -->
<!-- Applicable scenario: Preparation before tuning work begins -->

Before getting into specific tuning work, complete the following preparation:

- You understand the hardware configuration of the business system (CPU, memory, disk, network).
- You have confirmed the size of the Doris cluster (number of FE/BE nodes).
- You have confirmed the Doris software version and the features it supports.
- You can distinguish between "slow business" and "slow SQL," and pinpoint the specific problematic SQL.
- You are familiar with the available diagnostic and analysis tools.

## 1. Performance Tuning Methodology

<!-- Knowledge type: Methodology -->
<!-- Applicable scenario: Build an overall understanding of tuning -->

Performance tuning in one sentence: **First understand the system, then locate slow SQL, then use tools to find bottlenecks, and finally apply optimizations.**

### 1.1 The Four-Step Tuning Method

The following table summarizes the core workflow of performance tuning:

| Step | Goal                          | Key Actions                                                                 |
| ---- | ----------------------------- | --------------------------------------------------------------------------- |
| 1    | Understand the system         | Know the hardware, cluster size, Doris version, and version-specific features |
| 2    | Locate the problematic SQL    | Use diagnostic tools to efficiently and quickly identify slow SQL           |
| 3    | Analyze performance bottlenecks | Use Doris built-in tools and general operating system tools to collect runtime information |
| 4    | Apply tuning                  | Based on the bottleneck analysis, adjust parameters, rewrite SQL, and apply optimizations such as indexes and materialized views |

### 1.2 Description of Each Step

-   **Step 1: Understand the system.** Business users and DBAs need to build a comprehensive understanding of the database system in use to avoid investigating problems in the wrong direction.
-   **Step 2: Locate slow SQL.** A useful performance diagnostic tool is a prerequisite for locating performance issues. Subsequent work is meaningful only after the problematic SQL is quickly identified.
-   **Step 3: Analyze bottlenecks.** Combine Doris-specific tools (such as Profile and Explain) with general operating system tools (such as top and iostat) to determine where the bottleneck lies.
-   **Step 4: Apply optimizations.** Based on detailed runtime information and supplementary analysis, adjust configuration or rewrite SQL in a targeted way.

## 2. The Tuning Toolset Provided by Doris

<!-- Knowledge type: Tool index -->
<!-- Applicable scenario: Choose the appropriate tool for tuning -->

Apache Doris provides corresponding tools at every layer of the tuning workflow. The following table maps tools to scenarios:

| Tool Category                           | Problem It Solves                          | Documentation Entry                     |
| --------------------------------------- | ------------------------------------------ | --------------------------------------- |
| Diagnostic Tools                        | Quickly locate slow SQL and problematic SQL | [Diagnostic Tools](./diagnostic-tools)  |
| Analysis Tools                          | Analyze SQL execution details and bottlenecks | [Analysis Tools](./analysis-tools)    |
| Tuning Process                          | Complete end-to-end tuning practice guide | [Tuning Process](./tuning-process)      |

## 3. FAQ and Common Misconceptions

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions during tuning -->

**Q1: Does performance tuning have to start with rewriting SQL?**

Not necessarily. Tuning should start with "understanding the system + locating slow SQL." Skipping these two steps and jumping straight to rewriting SQL often misses the real bottleneck.

**Q2: Are Doris built-in tools alone enough?**

No. General operating system tools (such as top, iostat, and vmstat) serve as supplementary aids that help identify resource bottlenecks in CPU, IO, and memory.

**Q3: Is tuning the DBA's job alone?**

No. Performance tuning requires collaboration among business users, DBAs, and even developers: business users understand the SQL semantics, while DBAs understand the cluster and database characteristics.

## 4. Next Steps

-   Locate slow SQL: see [Diagnostic Tools](./diagnostic-tools)
-   Analyze execution details: see [Analysis Tools](./analysis-tools)
-   End-to-end practice: see [Tuning Process](./tuning-process)
