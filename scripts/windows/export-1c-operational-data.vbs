Option Explicit

Dim shell
Set shell = CreateObject("WScript.Shell")

If HasNamedArg("help") Or HasNamedArg("?") Then
  PrintUsage
  WScript.Quit 0
End If

Dim fso, outputDir, dataSet, connectionString
Set fso = CreateObject("Scripting.FileSystemObject")

outputDir = GetNamedArg("out", "D:\CRM\Exports")
dataSet = LCase(GetNamedArg("set", "all"))
connectionString = GetNamedArg("connection", "")

If Trim(connectionString) = "" Then
  connectionString = shell.Environment("PROCESS")("CRM_1C_CONNECTION_STRING")
End If

If Trim(connectionString) = "" Then
  WScript.Echo "ERROR: CRM_1C_CONNECTION_STRING is empty."
  PrintUsage
  WScript.Quit 2
End If

EnsureFolder outputDir

Dim logPath, summaryPath, logFile, summaryFile
logPath = fso.BuildPath(outputDir, "export_1c_operational.log")
summaryPath = fso.BuildPath(outputDir, "export_1c_operational_summary.csv")

Set logFile = fso.CreateTextFile(logPath, True, True)
Set summaryFile = fso.CreateTextFile(summaryPath, True, True)
summaryFile.WriteLine "dataset_name;object_type;source_file;status;rows;variant;error"

LogMessage logFile, "Starting read-only 1C operational export. Set=" & dataSet & ", OutputDir=" & outputDir

Dim connector, connection
Set connector = CreateConnector()
Set connection = connector.Connect(connectionString)

Dim specs, i, spec, result
specs = OperationalSpecs(dataSet)

For i = LBound(specs) To UBound(specs)
  spec = specs(i)
  LogMessage logFile, "Exporting " & spec(0) & " -> " & spec(2)
  result = ExportOperationalDataset(connection, outputDir, spec(0), spec(1), spec(2))

  summaryFile.WriteLine Csv(spec(0)) & ";" & Csv(spec(1)) & ";" & Csv(spec(2)) & ";" & Csv(result(0)) & ";" & Csv(CStr(result(1))) & ";" & Csv(result(2)) & ";" & Csv(result(3))

  If result(0) = "processed" Then
    LogMessage logFile, "OK: " & spec(0) & ", rows=" & CStr(result(1)) & ", variant=" & result(2)
  Else
    LogMessage logFile, "FAILED: " & spec(0) & ", error=" & result(3)
  End If
Next

summaryFile.Close
logFile.Close

WScript.Echo "Done. Summary: " & summaryPath
WScript.Quit 0

Function OperationalSpecs(setName)
  Dim stockSpecs, settlementSpecs, priceSpecs

  stockSpecs = Array( _
    Array("stock_balances", "stock_balance", "1c_stock_balances.csv"), _
    Array("reserved_stock_balances", "reserved_stock_balance", "1c_reserved_stock_balances.csv") _
  )

  settlementSpecs = Array( _
    Array("counterparty_settlements", "counterparty_settlement", "1c_counterparty_settlements.csv") _
  )

  priceSpecs = Array( _
    Array("product_prices", "product_price", "1c_product_prices.csv") _
  )

  If setName = "stock" Then
    OperationalSpecs = stockSpecs
  ElseIf setName = "settlements" Then
    OperationalSpecs = settlementSpecs
  ElseIf setName = "prices" Then
    OperationalSpecs = priceSpecs
  ElseIf setName = "all" Then
    OperationalSpecs = MergeArrays(MergeArrays(stockSpecs, settlementSpecs), priceSpecs)
  Else
    Err.Raise vbObjectError + 200, "OperationalSpecs", "Unknown set: " & setName
  End If
End Function

Function MergeArrays(firstArray, secondArray)
  Dim result(), index, targetIndex
  ReDim result(UBound(firstArray) + UBound(secondArray) + 1)

  targetIndex = 0
  For index = LBound(firstArray) To UBound(firstArray)
    result(targetIndex) = firstArray(index)
    targetIndex = targetIndex + 1
  Next

  For index = LBound(secondArray) To UBound(secondArray)
    result(targetIndex) = secondArray(index)
    targetIndex = targetIndex + 1
  Next

  MergeArrays = result
End Function

Function ExportOperationalDataset(connection, outputDir, datasetName, objectType, sourceFile)
  Dim variants, variantIndex, queryVariant, result, errors
  variants = QueryVariants(datasetName)
  errors = ""

  For variantIndex = LBound(variants) To UBound(variants)
    queryVariant = variants(variantIndex)
    result = TryExportQuery(connection, outputDir, datasetName, objectType, sourceFile, queryVariant(0), queryVariant(1))

    If result(0) = "processed" Then
      ExportOperationalDataset = result
      Exit Function
    End If

    If errors <> "" Then
      errors = errors & " | "
    End If
    errors = errors & queryVariant(0) & ": " & result(3)
  Next

  ExportOperationalDataset = Array("failed", 0, "", errors)
End Function

Function TryExportQuery(connection, outputDir, datasetName, objectType, sourceFile, variantName, queryText)
  On Error Resume Next

  Dim outputPath, tempPath, stream, query, queryResult, selection
  Dim rowNo, periodValue, periodText

  outputPath = fso.BuildPath(outputDir, sourceFile)
  tempPath = outputPath & ".tmp"

  DeleteTempFile tempPath

  Set stream = fso.CreateTextFile(tempPath, True, True)
  If Err.Number <> 0 Then
    TryExportQuery = Array("failed", 0, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  stream.WriteLine "row_no;period_at;entity_code;entity_name;related_code;related_name;warehouse_code;warehouse_name;contract_code;contract_name;organization_code;organization_name;currency;quantity;reserved_quantity;amount"

  Set query = connection.NewObject("Запрос")
  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", 0, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  periodValue = Now
  periodText = IsoTimestamp(periodValue)
  query.Text = queryText
  query.SetParameter "Period", periodValue
  query.SetParameter "PeriodText", periodText
  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", 0, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  Set queryResult = query.Execute()
  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", 0, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  Set selection = Nothing
  Set selection = queryResult.Choose()
  If Err.Number <> 0 Then
    Err.Clear
    Set selection = queryResult.Select()
  End If

  If Err.Number <> 0 Or selection Is Nothing Then
    stream.Close
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", 0, variantName, "Cannot open query selection")
    Err.Clear
    Exit Function
  End If

  rowNo = 0
  Do While selection.Next()
    rowNo = rowNo + 1
    stream.WriteLine _
      Csv(CStr(rowNo)) & ";" & _
      Csv(SafeField(selection, "PeriodAt")) & ";" & _
      Csv(SafeField(selection, "EntityCode")) & ";" & _
      Csv(SafeField(selection, "EntityName")) & ";" & _
      Csv(SafeField(selection, "RelatedCode")) & ";" & _
      Csv(SafeField(selection, "RelatedName")) & ";" & _
      Csv(SafeField(selection, "WarehouseCode")) & ";" & _
      Csv(SafeField(selection, "WarehouseName")) & ";" & _
      Csv(SafeField(selection, "ContractCode")) & ";" & _
      Csv(SafeField(selection, "ContractName")) & ";" & _
      Csv(SafeField(selection, "OrganizationCode")) & ";" & _
      Csv(SafeField(selection, "OrganizationName")) & ";" & _
      Csv(SafeField(selection, "Currency")) & ";" & _
      Csv(SafeField(selection, "Quantity")) & ";" & _
      Csv(SafeField(selection, "ReservedQuantity")) & ";" & _
      Csv(SafeField(selection, "Amount"))
  Loop

  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", rowNo, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  stream.Close

  If fso.FileExists(outputPath) Then
    fso.DeleteFile outputPath, True
  End If

  fso.MoveFile tempPath, outputPath
  If Err.Number <> 0 Then
    DeleteTempFile tempPath
    TryExportQuery = Array("failed", rowNo, variantName, Err.Description)
    Err.Clear
    Exit Function
  End If

  TryExportQuery = Array("processed", rowNo, variantName, "")
End Function

Function QueryVariants(datasetName)
  If datasetName = "stock_balances" Then
    QueryVariants = Array( _
      Array("ТоварыНаСкладах.КоличествоОстаток", BuildStockQuery("ТоварыНаСкладах", "КоличествоОстаток", "quantity")), _
      Array("ТоварыНаСкладах.ВНаличииОстаток", BuildStockQuery("ТоварыНаСкладах", "ВНаличииОстаток", "quantity")) _
    )
  ElseIf datasetName = "reserved_stock_balances" Then
    QueryVariants = Array( _
      Array("ТоварыВРезервеНаСкладах.КоличествоОстаток", BuildStockQuery("ТоварыВРезервеНаСкладах", "КоличествоОстаток", "reserved")) _
    )
  ElseIf datasetName = "counterparty_settlements" Then
    QueryVariants = Array( _
      Array("ВзаиморасчетыСКонтрагентами.СуммаВзаиморасчетовОстаток.full", BuildSettlementsQuery("СуммаВзаиморасчетовОстаток", True, True)), _
      Array("ВзаиморасчетыСКонтрагентами.СуммаВзаиморасчетовОстаток.no_currency", BuildSettlementsQuery("СуммаВзаиморасчетовОстаток", False, True)), _
      Array("ВзаиморасчетыСКонтрагентами.СуммаОстаток.full", BuildSettlementsQuery("СуммаОстаток", True, True)), _
      Array("ВзаиморасчетыСКонтрагентами.СуммаОстаток.minimal", BuildSettlementsQuery("СуммаОстаток", False, False)) _
    )
  ElseIf datasetName = "product_prices" Then
    QueryVariants = Array( _
      Array("ЦеныНоменклатуры.Цена.ТипЦен.Валюта", BuildProductPricesQuery("ЦеныНоменклатуры", "Цена", True, True)), _
      Array("ЦеныНоменклатуры.Цена.ТипЦен", BuildProductPricesQuery("ЦеныНоменклатуры", "Цена", True, False)), _
      Array("ЦеныНоменклатурыКонтрагентов.Цена.ТипЦен.Валюта", BuildProductPricesQuery("ЦеныНоменклатурыКонтрагентов", "Цена", True, True)), _
      Array("ЦеныНоменклатурыКонтрагентов.Цена.ТипЦен", BuildProductPricesQuery("ЦеныНоменклатурыКонтрагентов", "Цена", True, False)), _
      Array("ЦеныНоменклатуры.Цена", BuildProductPricesQuery("ЦеныНоменклатуры", "Цена", False, False)) _
    )
  Else
    Err.Raise vbObjectError + 201, "QueryVariants", "Unknown dataset: " & datasetName
  End If
End Function

Function BuildStockQuery(registerName, quantityField, quantityTarget)
  Dim quantityExpression, reservedExpression

  If quantityTarget = "reserved" Then
    quantityExpression = "0"
    reservedExpression = "Остатки." & quantityField
  Else
    quantityExpression = "Остатки." & quantityField
    reservedExpression = "0"
  End If

  BuildStockQuery = _
    "ВЫБРАТЬ" & vbCrLf & _
    "  &PeriodText КАК PeriodAt," & vbCrLf & _
    "  Остатки.Номенклатура.Код КАК EntityCode," & vbCrLf & _
    "  Остатки.Номенклатура.Наименование КАК EntityName," & vbCrLf & _
    "  """" КАК RelatedCode," & vbCrLf & _
    "  """" КАК RelatedName," & vbCrLf & _
    "  Остатки.Склад.Код КАК WarehouseCode," & vbCrLf & _
    "  Остатки.Склад.Наименование КАК WarehouseName," & vbCrLf & _
    "  """" КАК ContractCode," & vbCrLf & _
    "  """" КАК ContractName," & vbCrLf & _
    "  """" КАК OrganizationCode," & vbCrLf & _
    "  """" КАК OrganizationName," & vbCrLf & _
    "  """" КАК Currency," & vbCrLf & _
    "  " & quantityExpression & " КАК Quantity," & vbCrLf & _
    "  " & reservedExpression & " КАК ReservedQuantity," & vbCrLf & _
    "  0 КАК Amount" & vbCrLf & _
    "ИЗ" & vbCrLf & _
    "  РегистрНакопления." & registerName & ".Остатки(&Period, ) КАК Остатки" & vbCrLf & _
    "ГДЕ" & vbCrLf & _
    "  " & quantityExpression & " <> 0 ИЛИ " & reservedExpression & " <> 0"
End Function

Function BuildSettlementsQuery(amountField, includeCurrency, includeDetails)
  Dim currencyExpression, contractCodeExpression, contractNameExpression
  Dim organizationCodeExpression, organizationNameExpression

  If includeCurrency Then
    currencyExpression = "Остатки.ВалютаВзаиморасчетов.Код"
  Else
    currencyExpression = """"""
  End If

  If includeDetails Then
    contractCodeExpression = "Остатки.ДоговорКонтрагента.Код"
    contractNameExpression = "Остатки.ДоговорКонтрагента.Наименование"
    organizationCodeExpression = "Остатки.Организация.Код"
    organizationNameExpression = "Остатки.Организация.Наименование"
  Else
    contractCodeExpression = """"""
    contractNameExpression = """"""
    organizationCodeExpression = """"""
    organizationNameExpression = """"""
  End If

  BuildSettlementsQuery = _
    "ВЫБРАТЬ" & vbCrLf & _
    "  &PeriodText КАК PeriodAt," & vbCrLf & _
    "  Остатки.Контрагент.Код КАК EntityCode," & vbCrLf & _
    "  Остатки.Контрагент.Наименование КАК EntityName," & vbCrLf & _
    "  """" КАК RelatedCode," & vbCrLf & _
    "  """" КАК RelatedName," & vbCrLf & _
    "  """" КАК WarehouseCode," & vbCrLf & _
    "  """" КАК WarehouseName," & vbCrLf & _
    "  " & contractCodeExpression & " КАК ContractCode," & vbCrLf & _
    "  " & contractNameExpression & " КАК ContractName," & vbCrLf & _
    "  " & organizationCodeExpression & " КАК OrganizationCode," & vbCrLf & _
    "  " & organizationNameExpression & " КАК OrganizationName," & vbCrLf & _
    "  " & currencyExpression & " КАК Currency," & vbCrLf & _
    "  0 КАК Quantity," & vbCrLf & _
    "  0 КАК ReservedQuantity," & vbCrLf & _
    "  Остатки." & amountField & " КАК Amount" & vbCrLf & _
    "ИЗ" & vbCrLf & _
    "  РегистрНакопления.ВзаиморасчетыСКонтрагентами.Остатки(&Period, ) КАК Остатки" & vbCrLf & _
    "ГДЕ" & vbCrLf & _
    "  Остатки." & amountField & " <> 0"
End Function

Function BuildProductPricesQuery(registerName, priceField, includePriceType, includeCurrency)
  Dim priceTypeCodeExpression, priceTypeNameExpression, currencyExpression

  If includePriceType Then
    priceTypeCodeExpression = "Цены.ТипЦен.Код"
    priceTypeNameExpression = "Цены.ТипЦен.Наименование"
  Else
    priceTypeCodeExpression = """"""
    priceTypeNameExpression = """"""
  End If

  If includeCurrency Then
    currencyExpression = "Цены.Валюта.Код"
  Else
    currencyExpression = """"""
  End If

  BuildProductPricesQuery = _
    "ВЫБРАТЬ" & vbCrLf & _
    "  &PeriodText КАК PeriodAt," & vbCrLf & _
    "  Цены.Номенклатура.Код КАК EntityCode," & vbCrLf & _
    "  Цены.Номенклатура.Наименование КАК EntityName," & vbCrLf & _
    "  " & priceTypeCodeExpression & " КАК RelatedCode," & vbCrLf & _
    "  " & priceTypeNameExpression & " КАК RelatedName," & vbCrLf & _
    "  """" КАК WarehouseCode," & vbCrLf & _
    "  """" КАК WarehouseName," & vbCrLf & _
    "  """" КАК ContractCode," & vbCrLf & _
    "  """" КАК ContractName," & vbCrLf & _
    "  """" КАК OrganizationCode," & vbCrLf & _
    "  """" КАК OrganizationName," & vbCrLf & _
    "  " & currencyExpression & " КАК Currency," & vbCrLf & _
    "  0 КАК Quantity," & vbCrLf & _
    "  0 КАК ReservedQuantity," & vbCrLf & _
    "  Цены." & priceField & " КАК Amount" & vbCrLf & _
    "ИЗ" & vbCrLf & _
    "  РегистрСведений." & registerName & ".СрезПоследних(&Period, ) КАК Цены" & vbCrLf & _
    "ГДЕ" & vbCrLf & _
    "  Цены." & priceField & " <> 0"
End Function

Sub DeleteTempFile(path)
  On Error Resume Next
  If fso.FileExists(path) Then
    fso.DeleteFile path, True
  End If
  Err.Clear
End Sub

Function SafeField(selection, fieldName)
  On Error Resume Next

  Dim value
  Err.Clear
  value = selection.Get(fieldName)

  If Err.Number <> 0 Then
    Err.Clear
    Select Case fieldName
      Case "PeriodAt"
        value = selection.PeriodAt
      Case "EntityCode"
        value = selection.EntityCode
      Case "EntityName"
        value = selection.EntityName
      Case "RelatedCode"
        value = selection.RelatedCode
      Case "RelatedName"
        value = selection.RelatedName
      Case "WarehouseCode"
        value = selection.WarehouseCode
      Case "WarehouseName"
        value = selection.WarehouseName
      Case "ContractCode"
        value = selection.ContractCode
      Case "ContractName"
        value = selection.ContractName
      Case "OrganizationCode"
        value = selection.OrganizationCode
      Case "OrganizationName"
        value = selection.OrganizationName
      Case "Currency"
        value = selection.Currency
      Case "Quantity"
        value = selection.Quantity
      Case "ReservedQuantity"
        value = selection.ReservedQuantity
      Case "Amount"
        value = selection.Amount
      Case Else
        value = ""
    End Select
  End If

  If Err.Number <> 0 Then
    Err.Clear
    SafeField = ""
  Else
    SafeField = SafeText(value)
  End If
End Function

Function SafeText(value)
  On Error Resume Next

  If IsNull(value) Or IsEmpty(value) Then
    SafeText = ""
    Exit Function
  End If

  If VarType(value) = vbBoolean Then
    If value Then
      SafeText = "true"
    Else
      SafeText = "false"
    End If
    Exit Function
  End If

  Dim textValue
  textValue = CStr(value)

  If Err.Number <> 0 Then
    Err.Clear
    SafeText = ""
  Else
    SafeText = textValue
  End If
End Function

Function Csv(value)
  Dim textValue
  textValue = SafeText(value)
  textValue = Replace(textValue, """", """""")
  Csv = """" & textValue & """"
End Function

Function IsoTimestamp(value)
  IsoTimestamp = _
    CStr(Year(value)) & "-" & _
    Right("0" & CStr(Month(value)), 2) & "-" & _
    Right("0" & CStr(Day(value)), 2) & "T" & _
    Right("0" & CStr(Hour(value)), 2) & ":" & _
    Right("0" & CStr(Minute(value)), 2) & ":" & _
    Right("0" & CStr(Second(value)), 2)
End Function

Function CreateConnector()
  On Error Resume Next

  Dim connector
  Err.Clear
  Set connector = CreateObject("V83.COMConnector")

  If Err.Number <> 0 Then
    Err.Clear
    Set connector = CreateObject("V82.COMConnector")
  End If

  If Err.Number <> 0 Or connector Is Nothing Then
    On Error GoTo 0
    Err.Raise vbObjectError + 202, "CreateConnector", "Cannot create V83.COMConnector or V82.COMConnector"
  End If

  Set CreateConnector = connector
End Function

Sub EnsureFolder(path)
  If fso.FolderExists(path) Then
    Exit Sub
  End If

  Dim parentPath
  parentPath = fso.GetParentFolderName(path)

  If parentPath <> "" And Not fso.FolderExists(parentPath) Then
    EnsureFolder parentPath
  End If

  fso.CreateFolder path
End Sub

Sub LogMessage(logFile, message)
  WScript.Echo message
  logFile.WriteLine Now & " " & message
End Sub

Function GetNamedArg(name, defaultValue)
  If WScript.Arguments.Named.Exists(name) Then
    GetNamedArg = WScript.Arguments.Named(name)
  Else
    GetNamedArg = defaultValue
  End If
End Function

Function HasNamedArg(name)
  HasNamedArg = WScript.Arguments.Named.Exists(name)
End Function

Sub PrintUsage()
  WScript.Echo "Usage:"
  WScript.Echo "  cscript //nologo export-1c-operational-data.vbs /out:D:\CRM\Exports /set:all"
  WScript.Echo ""
  WScript.Echo "Sets:"
  WScript.Echo "  stock       - product stock and reserved stock balances"
  WScript.Echo "  prices      - product prices by price type"
  WScript.Echo "  settlements - counterparty settlements balances"
  WScript.Echo "  all         - stock + settlements + prices"
  WScript.Echo ""
  WScript.Echo "Connection string is read from CRM_1C_CONNECTION_STRING."
End Sub
