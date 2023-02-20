<%@ page import="org.pih.warehouse.core.SynonymTypeCode" %>
<g:form name="editSynonym" action="editProductSynonym" >
    <g:hiddenField name="product.id" value="${product.id}" />
    <g:hiddenField name="synonym.id" value="${synonym.id}" />
    <table>
        <tbody>
        <tr class="prop">
            <td valign="top" class="name">
                <label><g:message code="synonym.locale.label" default="Locale"/></label>
            </td>
            <td valign="top" class="value ">
                <g:selectLocale
                    id="locale-dlg"
                    name="locale"
                    noSelection="['':'']"
                    value="${synonym.locale.language}"
                    class="chzn-select-deselect"
                    data-placeholder="${g.message(code: 'synonym.selectLocale.placeholder.label', default: 'Select a locale')}"
                />
            </td>
        </tr>
        <tr class="prop">
            <td valign="top" class="name">
                <label><g:message code="synonym.classification.label" default="Classification"/></label>
            </td>
            <td valign="top" class="value ">
                <g:select
                    id="synonymTypeCode-dlg"
                    name="synonymTypeCode"
                    from="${SynonymTypeCode.list()}"
                    optionValue="${{ g.message(code: "enum.SynonymTypeCode." + it ) }}"
                    noSelection="['':'']"
                    value="${synonym.synonymTypeCode}"
                    data-placeholder="${g.message(code: 'synonym.synonymTypeCode.placeholder.label', default: 'Select a classification')}"
                    class="chzn-select-deselect"
                />
            </td>
        </tr>
        <tr class="prop">
            <td class="name">
                <label><g:message code="synonym.name.label" default="Synonym"/></label>
            </td>
            <td class="value">
                <input
                    id="synonym-dlg"
                    type="text"
                    name="synonym"
                    value="${synonym.name}"
                    size="80"
                    class="medium text"
                    placeholder="${g.message(code: 'synonym.typeSynonym.placeholder.label', default: 'Type the synonym here')}"
                />
            </td>
        </tr>
        </tbody>
    </table>
    <hr/>
    <div class="buttons">
        <button type="submit" class="button icon approve save-item-button">
            <g:message code="default.button.save.label" default="Save" />
        </button>
        <button class="btn-close-dialog button">
            <g:message code="default.button.cancel.label" default="Cancel" />
        </button>
    </div>
</g:form>
<script type="text/javascript">
  function isValid() {
    const localeFieldValue = $("#locale-dlg").val()
    const synonymTypeCodeFieldValue = $("#synonymTypeCode-dlg").val()
    const synonymFieldValue = $("#synonym-dlg").val()

    if (!localeFieldValue) {
      $("#locale_dlg_chosen")
        .notify('${g.message(code: "default.field.required.label", default: "This field is required")}')
    }
    if (!synonymTypeCodeFieldValue) {
      $("#synonymTypeCode_dlg_chosen")
        .notify('${g.message(code: "default.field.required.label", default: "This field is required")}')
    }
    if (!synonymFieldValue) {$("#synonym-dlg")
      .notify('${g.message(code: "default.field.required.label", default: "This field is required")}')
    }

    return localeFieldValue && synonymTypeCodeFieldValue && synonymFieldValue
  }

  function saveEditSynonym() {
    var data = $("#editSynonym").serialize();
    $.ajax({
      url:'${g.createLink(controller:'product', action:'editProductSynonym')}',
      data: data,
      success: function() {
        window.location.href = "${request.contextPath}/product/edit/${product.id}";
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.responseText) {
          try {
            let data = JSON.parse(jqXHR.responseText);
            if (data.errorMessages.length > 0) {
              $.notify(data.errorMessages.join("\n"), "error");
            } else {
              $.notify(data.errorMessage, "error");
            }
          } catch (e) {
            $.notify(jqXHR.responseText, "error");
          }
        } else {
          $.notify("Error saving your item");
        }
      }
    });

    return false
  }

  $(document).ready(function() {
    $("#editSynonym .save-item-button").click(function(event){
      event.preventDefault()
      if (isValid()) {
        saveEditSynonym()
      }
    });
  })


</script>
