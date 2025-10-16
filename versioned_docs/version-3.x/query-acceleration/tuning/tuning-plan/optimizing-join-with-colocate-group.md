---
{
    "title": "Optimizing Join with Colocate Group",
    "language": "en"
}
---

Defining colocate group is an efficient way of Join. It allows the execution engine to effectively avoid the data transmission overhead typically associated with Join operations (for an introduction to Colocate Group, see [Colocation Join](../../colocation-join.md))

However, in some use cases, even if a Colocate Group has been successfully established, the execution plan may still show as Shuffle Join or Bucket Shuffle Join. This situation typically occurs when Doris is organizing data. For instance, it may be migrating tablets between BEs to ensure a more balanced data distribution across multiple BEs.

You can view the Colocate Group status using the command `SHOW PROC "/colocation_group";`. As shown in the figure below, if `IsStable` is `false`, it indicates that there are unavailable Colocate Group instances.

![Optimizing Join with Colocate Group](/images/use-colocate-group.jpg)