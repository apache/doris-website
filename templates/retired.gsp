<% include "header.gsp" %>

<% include "menu.gsp" %>

<div class="incubator-page-header">
    <h1>${content.title}</h1>
</div>

${content.body}

Our Past Podlings:
<%
    def source = new java.net.URL("http://svn.apache.org/repos/asf/incubator/public/trunk/content/podlings.xml")
    def rootNode = new groovy.util.XmlSlurper(false, false, true).parseText(source.text)
%>
<div class="container-fluid">
    <div class="row">
        <% rootNode.children().each { podling ->
            if (podling.@status != 'current') {
        %>
        <div class="col-md-3"><a href="/projects/${podling.@resource}.html">${podling.@name}</a></div>
        <%
                    }
            } %>
    </div>
</div>
<% include "footer.gsp" %>
