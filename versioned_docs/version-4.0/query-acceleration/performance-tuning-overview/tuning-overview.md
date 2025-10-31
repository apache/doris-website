---
{
    "title": "Tuning Overview",
    "language": "en"
}
---

Query performance tuning is a systematic process that requires multi-level and multi-dimensional adjustments to the database system. Below is an overview of the tuning process and methodology:

1. Firstly, business personnel and database administrators (DBAs) need to have a comprehensive understanding of the database system being used, including the hardware utilized by the business system, the scale of the cluster, the version of the database software being used, as well as the features provided by the specific software version.
2. Secondly, an effective performance diagnostic tool is a necessary prerequisite for identifying performance issues. Only by efficiently and quickly locating problematic SQL queries or slow SQL queries can subsequent specific performance tuning processes be carried out.
3. After entering the performance tuning phase, a range of commonly used performance analysis tools are indispensable. These include specialized tools provided by the currently running database system, as well as general tools at the operating system level.
4. With these tools in place, specialized tools can be used to obtain detailed information about SQL queries running on the current database system, aiding in the identification of performance bottlenecks. Meanwhile, general tools can serve as auxiliary analysis methods to assist in locating issues.

In summary, performance tuning requires evaluating the current system's performance status from a holistic perspective. Firstly, it is necessary to identify business SQL queries with performance issues, then utilize analysis tools to discover performance bottlenecks, and finally implement specific tuning operations.

Based on the aforementioned tuning process and methodology, Apache Doris provides corresponding tools at each of these levels. The following sections will introduce the performance [diagnostic tools](diagnostic-tools.md), [analysis tools](analysis-tools.md), and [tuning process](tuning-process.md) respectively.