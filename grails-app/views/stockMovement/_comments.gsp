<div class="box">
    <h2><warehouse:message code="comments.label"/></h2>
    <g:if test="${requisition?.comments}">
        <table>
            <thead>
            <tr class="odd">
                <th><warehouse:message code="default.to.label" /></th>
                <th><warehouse:message code="default.from.label" /></th>
                <th><warehouse:message code="default.comment.label" /></th>
                <th><warehouse:message code="default.date.label" /></th>
                <th><warehouse:message code="default.actions.label" /></th>
            </tr>
            </thead>
            <tbody>
            <g:each var="comment" in="${requisition?.comments?.sort(){ a,b -> b?.lastUpdated <=> a?.lastUpdated }}">
                <tr>
                    <td>
                        ${comment?.recipient?.name}
                    </td>
                    <td>
                        ${comment?.sender?.name}
                    </td>
                    <td>
                        ${comment?.comment}
                    </td>
                    <td>
                        ${comment?.lastUpdated}
                    </td>
                    <td align="right">
                        <g:if test="${comment?.sender?.id == session?.user?.id}">
                            <g:link action="editComment" id="${comment.id}" params="['requisition':requisition?.id]">
                                <img tile="edit" src="${createLinkTo(dir:'images/icons/silk',file:'page_edit.png')}" alt="Edit" />
                            </g:link>

                            <g:link
                                    action="deleteComment"
                                    id="${comment.id}"
                                    params="['requisition':requisition?.id]"
                                    onclick="return confirm('${warehouse.message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');"
                            >
                                <img  title="delete" src="${createLinkTo(dir:'images/icons',file:'trash.png')}" alt="Delete" />
                            </g:link>
                        </g:if>
                    </td>
                </tr>
            </g:each>
            </tbody>
        </table>
    </g:if>
    <g:else>
        <div class="fade center empty"><warehouse:message code="default.noComments.label" /></div>
    </g:else>
</div>
