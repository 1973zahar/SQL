Option Explicit

Dim shell
Set shell = CreateObject("WScript.Shell")

If HasNamedArg("help") Or HasNamedArg("?") Then
  PrintUsage
  WScript.Quit 0
End If

Dim fso, outputDir, catalogSet, connectionString
Set fso = CreateObject("Scripting.FileSystemObject")

outputDir = GetNamedArg("out", "D:\CRM\Exports")
catalogSet = LCase(GetNamedArg("set", "next"))
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
logPath = fso.BuildPath(outputDir, "export_1c_catalogs.log")
summaryPath = fso.BuildPath(outputDir, "export_1c_catalogs_summary.csv")

Set logFile = fso.CreateTextFile(logPath, True, True)
Set summaryFile = fso.CreateTextFile(summaryPath, True, True)
summaryFile.WriteLine "catalog_name;object_type;source_file;mode;status;rows;error"

LogMessage logFile, "Starting read-only 1C catalog export. Set=" & catalogSet & ", OutputDir=" & outputDir

Dim connector, connection
Set connector = CreateConnector()
Set connection = connector.Connect(connectionString)

Dim specs, i, spec, result
specs = CatalogSpecs(catalogSet)

For i = LBound(specs) To UBound(specs)
  spec = specs(i)
  LogMessage logFile, "Exporting " & spec(0) & " -> " & spec(2)
  result = ExportCatalog(connection, outputDir, spec(0), spec(1), spec(2), spec(3))

  summaryFile.WriteLine Csv(spec(0)) & ";" & Csv(spec(1)) & ";" & Csv(spec(2)) & ";" & Csv(spec(3)) & ";" & Csv(result(0)) & ";" & Csv(CStr(result(1))) & ";" & Csv(result(2))

  If result(0) = "processed" Then
    LogMessage logFile, "OK: " & spec(0) & ", rows=" & CStr(result(1))
  Else
    LogMessage logFile, "FAILED: " & spec(0) & ", error=" & result(2)
  End If
Next

summaryFile.Close
logFile.Close

WScript.Echo "Done. Summary: " & summaryPath
WScript.Quit 0

Function CatalogSpecs(setName)
  Dim baseSpecs, nextSpecs, futureSpecs

  baseSpecs = Array( _
    Array("ЕдиницыИзмерения", "units", "1c_units.csv", "code"), _
    Array("Контрагенты", "counterparties", "1c_counterparties.csv", "code"), _
    Array("ДоговорыКонтрагентов", "counterparty_contracts", "1c_counterparty_contracts.csv", "code"), _
    Array("НоменклатурныеГруппы", "product_groups", "1c_product_groups.csv", "code"), _
    Array("Организации", "organizations", "1c_organizations.csv", "code"), _
    Array("Валюты", "currencies", "1c_currencies.csv", "code"), _
    Array("ТипыЦенНоменклатуры", "price_types", "1c_price_types.csv", "code"), _
    Array("СерииНоменклатуры", "product_series", "1c_product_series.csv", "code") _
  )

  nextSpecs = Array( _
    Array("ХарактеристикиНоменклатуры", "product_characteristics", "1c_product_characteristics.csv", "no_code"), _
    Array("Склады", "warehouses", "1c_warehouses.csv", "code"), _
    Array("ВидыНоменклатуры", "product_kinds", "1c_product_kinds.csv", "code"), _
    Array("КлассификаторЕдиницИзмерения", "unit_classifier", "1c_unit_classifier.csv", "code"), _
    Array("ПодразделенияОрганизаций", "organization_units", "1c_organization_units.csv", "code"), _
    Array("ФизическиеЛица", "persons", "1c_persons.csv", "code"), _
    Array("ВидыКонтактнойИнформации", "contact_info_types", "1c_contact_info_types.csv", "code"), _
    Array("БанковскиеСчета", "bank_accounts", "1c_bank_accounts.csv", "code") _
  )

  futureSpecs = Array( _
    Array("Производители", "manufacturers", "1c_manufacturers.csv", "code"), _
    Array("КлассификаторСтранМира", "countries", "1c_countries.csv", "code") _
  )

  If setName = "base" Then
    CatalogSpecs = baseSpecs
  ElseIf setName = "next" Then
    CatalogSpecs = nextSpecs
  ElseIf setName = "future" Then
    CatalogSpecs = futureSpecs
  ElseIf setName = "all" Then
    CatalogSpecs = MergeArrays(baseSpecs, nextSpecs)
  Else
    Err.Raise vbObjectError + 100, "CatalogSpecs", "Unknown set: " & setName
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

Function ExportCatalog(connection, outputDir, catalogName, objectType, sourceFile, mode)
  On Error Resume Next

  Dim outputPath, tempPath, stream, query, queryText, queryResult, selection
  Dim rowNo, externalRef, codeValue, nameValue, deletionMark

  outputPath = fso.BuildPath(outputDir, sourceFile)
  tempPath = outputPath & ".tmp"

  DeleteTempFile tempPath

  Set stream = fso.CreateTextFile(tempPath, True, True)
  If Err.Number <> 0 Then
    ExportCatalog = Array("failed", 0, Err.Description)
    Err.Clear
    Exit Function
  End If

  stream.WriteLine "row_no;external_ref;code;name;deletion_mark"

  Set query = connection.NewObject("Запрос")
  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    ExportCatalog = Array("failed", 0, Err.Description)
    Err.Clear
    Exit Function
  End If

  queryText = BuildCatalogQuery(catalogName, mode)
  query.Text = queryText

  Set queryResult = query.Execute()
  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    ExportCatalog = Array("failed", 0, Err.Description)
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
    ExportCatalog = Array("failed", 0, "Cannot open query selection")
    Err.Clear
    Exit Function
  End If

  rowNo = 0
  Do While selection.Next()
    rowNo = rowNo + 1
    externalRef = SafeField(selection, "ExternalRef")
    codeValue = SafeField(selection, "Code")
    nameValue = SafeField(selection, "Name")
    deletionMark = SafeField(selection, "DeletionMark")

    stream.WriteLine Csv(CStr(rowNo)) & ";" & Csv(externalRef) & ";" & Csv(codeValue) & ";" & Csv(nameValue) & ";" & Csv(deletionMark)
  Loop

  If Err.Number <> 0 Then
    stream.Close
    DeleteTempFile tempPath
    ExportCatalog = Array("failed", rowNo, Err.Description)
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
    ExportCatalog = Array("failed", rowNo, Err.Description)
    Err.Clear
    Exit Function
  End If

  ExportCatalog = Array("processed", rowNo, "")
End Function

Sub DeleteTempFile(path)
  On Error Resume Next
  If fso.FileExists(path) Then
    fso.DeleteFile path, True
  End If
  Err.Clear
End Sub

Function BuildCatalogQuery(catalogName, mode)
  Dim refExpression, codeExpression
  refExpression = """"""

  If LCase(mode) = "no_code" Then
    codeExpression = """"""
  Else
    codeExpression = "Элемент.Код"
  End If

  BuildCatalogQuery = _
    "ВЫБРАТЬ" & vbCrLf & _
    "  " & refExpression & " КАК ExternalRef," & vbCrLf & _
    "  " & codeExpression & " КАК Code," & vbCrLf & _
    "  Элемент.Наименование КАК Name," & vbCrLf & _
    "  Элемент.ПометкаУдаления КАК DeletionMark" & vbCrLf & _
    "ИЗ" & vbCrLf & _
    "  Справочник." & catalogName & " КАК Элемент"
End Function

Function SafeField(selection, fieldName)
  On Error Resume Next

  Dim value
  Err.Clear
  value = selection.Get(fieldName)

  If Err.Number <> 0 Then
    Err.Clear
    Select Case fieldName
      Case "ExternalRef"
        value = selection.ExternalRef
      Case "Code"
        value = selection.Code
      Case "Name"
        value = selection.Name
      Case "DeletionMark"
        value = selection.DeletionMark
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
    Err.Raise vbObjectError + 101, "CreateConnector", "Cannot create V83.COMConnector or V82.COMConnector"
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
  WScript.Echo "  cscript //nologo export-1c-catalogs.vbs /out:D:\CRM\Exports /set:next"
  WScript.Echo ""
  WScript.Echo "Sets:"
  WScript.Echo "  base - already exported base catalogs"
  WScript.Echo "  next - next catalogs to continue after the previous stop point"
  WScript.Echo "  future - optional catalogs parked for later"
  WScript.Echo "  all  - base + next"
  WScript.Echo ""
  WScript.Echo "Connection string is read from CRM_1C_CONNECTION_STRING."
End Sub
