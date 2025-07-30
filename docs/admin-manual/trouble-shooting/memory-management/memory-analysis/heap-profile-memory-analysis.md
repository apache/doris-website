---
{
    "title": "Heap Profile Memory Analysis",
    "language": "en"
}
---

Heap Profile supports real-time viewing of process memory usage and call stacks, so this usually requires some understanding of the code. It should be noted that Heap Profile records virtual memory. You need to modify the configuration and restart the Doris BE process, and the phenomenon can be reproduced.

Doris uses Jemalloc as the default Allocator. Refer to the following method to use Heap Profile.

1. Change `prof_active:false` of `JEMALLOC_CONF` in `be.conf` to `prof_active:true` and restart Doris BE.

2. After executing `curl http://be_host:8040/jeheap/dump`, you will see the generated `profile` file in the `${DORIS_HOME}/log` directory.

3. After executing `jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file`, paste the text output by the terminal to the [online dot drawing website](http://www.webgraphviz.com/) to generate a memory allocation graph.

The above process is based on Doris 2.1.8 and 3.0.4 and later versions, which are used for real-time memory analysis. If you need to observe memory for a long time or observe the cumulative value of memory application, please refer to [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1) for more information about the use of Jemalloc Heap Profile.

If you see the `Segment`, `TabletSchema`, and `ColumnReader` fields in the call stack with a large memory share of Heap Profile, it means that the metadata occupies a large amount of memory.

If the BE memory does not decrease when the cluster is idle after running for a period of time, then you can see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile. If the BE process memory monitoring in the corresponding time period shows a continuous upward trend, then there is reason to suspect that there is a memory leak. Continue to analyze the code based on the call stack.

If you see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile during task execution on the cluster, and the memory is released normally after the task is completed, it means that most of the memory is used by the running tasks and there is no leak. If the value of `Label=query, Type=overview` Memory Tracker accounts for a smaller proportion of the total memory than the memory call stack containing the above fields in the Heap Profile, it means that the statistics of `Label=query, Type=overview` Memory Tracker are inaccurate, and you can provide timely feedback in the community.
