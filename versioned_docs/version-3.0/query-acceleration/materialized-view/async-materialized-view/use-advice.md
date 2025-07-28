---
{
    "title": "Use Advice",
    "language": "en"
}
---

## Overview
Asynchronous materialized views improve query performance by precomputing and storing query results, but each refresh may incur significant overhead. This document provides usage recommendations for asynchronous materialized views.  
For the refresh principles of materialized views, refer to: [Refresh Principles](../overview.md)

## Recommended Usage Scenarios
### Recommended Scenarios
#### Complex Aggregation Queries
- **Scenario**: Queries involving multi-table joins, complex aggregate functions (e.g., SUM, AVG, COUNT), or window functions
- **Advantage**: Avoids recomputing complex logic during each execution

#### Reporting
- **Scenario**: Reports requiring consistent snapshots at fixed time points (e.g., daily midnight)
- **Advantage**: Ensures all users see data from the same point in time

#### Computation-Intensive Analysis
- **Scenario**: Analytical queries involving complex mathematical calculations or data transformations, such as customer lifetime value calculations or predictive modeling
- **Advantage**: Precomputes results to reduce runtime resource consumption

#### Star/Snowflake Schemas in Data Warehouses
- **Scenario**: Fact tables joined with multiple dimension tables, e.g., sales fact tables joined with product, time, and region dimension tables
- **Advantage**: Pre-materializes join results to accelerate analytical queries

#### Data Lake Acceleration
- **Scenario**: Queries on data lakes may slow down due to network latency and object storage throughput limitations
- **Advantage**: Leverages Doris's local storage advantages to accelerate data lake analysis

#### Data Warehouse Layering
- **Scenario**: Base tables contain large amounts of raw data, and queries require complex ETL operations
- **Advantage**: Implements data warehouse layering by building multi-level asynchronous materialized views

### Not Recommended Scenarios

#### Frequently Updated Base Tables
- **Scenario**: Source table data changes very frequently (e.g., multiple updates per minute)
- **Issue**: Asynchronous materialized views struggle to stay synchronized, and refresh costs are too high. Consider periodic refreshes instead.

#### Simple Queries
- **Scenario**: Queries involving only single-table scans or simple filtering
- **Issue**: The benefits of asynchronous materialized views cannot offset the refresh costs

#### Scenarios Requiring Real-Time (1–5 Minute Freshness) Data
- **Scenario**: Business requirements demand the latest data
- **Issue**: Asynchronous materialized views introduce data latency

#### Small Source Tables
- **Scenario**: Base tables contain only a small number of records (e.g., a few hundred rows)
- **Issue**: The optimization effect of asynchronous materialized views is negligible

## Refresh Strategy Recommendations

Asynchronous materialized views offer three primary refresh strategies, each suited to different business scenarios and data characteristics. Choosing the right strategy is critical for balancing data freshness and system performance.

### Detailed Refresh Strategies

#### Manual Refresh

**How It Works**:
- Triggered explicitly by user commands or external system scheduling

**Applicable Scenarios**:
- Reporting systems with low real-time data requirements
- Historical data analysis in data warehouses
- Scenarios requiring synchronization with specific business processes
- Large-scale data refreshes requiring coordinated system resources

**Pros and Cons**:
- Pros: Full control over refresh timing, avoiding peak business hours
- Cons: Requires additional scheduling management and fault tolerance to prevent external loops from continuously triggering refreshes

#### Scheduled Refresh
**How It Works**:
- Automatically refreshes at fixed intervals
- Minimum time unit: minutes
- Can specify the start time for the first task run

**Applicable Scenarios**:
- Periodic business metric monitoring
- Tiered data pipelines
- Time-sensitive reporting systems
- Source data with regular fluctuations

**Pros and Cons**:
- Pros: Scheduled data processing with predictable data latency
- Cons: Limited data freshness; refresh sequences for related views require manual orchestration

**Configuration Constraints**:  
Avoid configuring all materialized views for high-frequency scheduled refreshes to achieve near-real-time results, as this may:
- Continuously occupy system resources
- Cause refresh jobs to compete for resources
- Frequent partition/tablet operations may impose heavy pressure on BEs

#### Trigger-Based Refresh
**How It Works**:
- Automatically triggers refreshes when base table data changes

**Applicable Scenarios**:
- Upper-layer views in a multi-level materialized view architecture
- Scenarios where base tables change infrequently

**Pros and Cons**:
- Pros: High data freshness and automation
- Cons: May cause refresh storms and unpredictable system load

**Configuration Constraints**:  
Avoid using trigger-based refreshes for foundational materialized views unless:
- Base table refresh frequency is known to be low (e.g., changes every few tens of minutes)

### Combined Refresh Strategy Recommendations
#### Layered Strategy
- **Foundation Layer**: Scheduled refresh (e.g., hourly)
- **Intermediate Layer**: Scheduled or trigger-based refresh
- **Presentation Layer**: Trigger-based or manual refresh

#### Business Criticality Tiering
- **Critical Real-Time Business Data**: Not recommended for asynchronous materialized views
- **Regular Analytical Data**: Scheduled refresh (daily/hourly)
- **Historical/Archived Data**: Manual refresh

#### Data Change Frequency Adaptation
- **High-Frequency Changes**: Scheduled refresh (longer intervals) or manual refresh
- **Low-Frequency Changes**: Trigger-based refresh or short-interval scheduled refresh
- **Bulk Changes**: Manual refresh after changes

### Refresh Frequency Recommendations
These are general guidelines; actual settings should consider system resources, the number of materialized views, and other business resource usage.

| Actual Refresh Time | Recommended Refresh Frequency |  
|---|---|  
| < 15s  | ≥ 5 minutes     |  
| < 10 minutes  | ≥ 1 hour     |  
| < 1 hour  | ≥ 1 day     |  

## Key Considerations for Asynchronous Materialized Views
1. **Monitoring**: After deploying materialized views, monitor system performance via [metrics](../../../admin-manual/maint-monitor/metrics.md). Additional metrics for asynchronous materialized views will be exposed in the future. Currently, use [tasks](../../../sql-manual/sql-functions/table-valued-functions/tasks.md) to check task count, execution status, and duration.
2. **Planning**: Plan the number of materialized views, refresh frequency, and the cluster's maximum computational capacity. Avoid "creating materialized views without maintaining them"—they are essentially enhanced ETL computations and require maintenance like traditional ETL.
3. **Resource Isolation**: Materialized views are data computation tasks. Implement resource isolation as needed.