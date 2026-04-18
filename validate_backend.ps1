$ErrorActionPreference = "Stop"

# Step 1: Free port 5000 if occupied
$conns = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
  $owningPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $owningPids) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}
$portFreed = -not (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)

# Step 2: Start backend as background job
$job = Start-Job -Name "CueMathBackendValidation" -ScriptBlock {
  param($backendPath)
  Set-Location $backendPath
  node server.js
} -ArgumentList "D:\CueMath\backend"

# Wait for server ready (no sleep)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt 30) {
  if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { break }
}
$serverReady = [bool](Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)

function Invoke-Api {
  param([string]$Method,[string]$Url,[hashtable]$Headers,[object]$Body)
  try {
    $params = @{ Method=$Method; Uri=$Url; Headers=$Headers; UseBasicParsing=$true }
    if ($null -ne $Body) {
      $params.ContentType = "application/json"
      $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    $resp = Invoke-WebRequest @params
    $json = $null
    if ($resp.Content) { $json = $resp.Content | ConvertFrom-Json }
    return [pscustomobject]@{ status=[int]$resp.StatusCode; json=$json; raw=$resp.Content }
  } catch {
    $status = -1
    $raw = $_.Exception.Message
    $json = $null
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $reader.ReadToEnd()
      $reader.Close()
      if ($raw) { try { $json = $raw | ConvertFrom-Json } catch {} }
    }
    return [pscustomobject]@{ status=$status; json=$json; raw=$raw }
  }
}

$origin = "http://localhost:5174"
$base = "http://localhost:5000/api"
$uid = [guid]::NewGuid().ToString("N").Substring(0,10)
$email = "validation_$uid@example.com"

# Step 3: Register
$register = Invoke-Api -Method "POST" -Url "$base/auth/register" -Headers @{ Origin = $origin } -Body @{ name="Validation User"; email=$email; password="Passw0rd!123" }
$token = $register.json.token

# Step 4: Analytics
$authHeaders = @{ Origin = $origin; Authorization = "Bearer $token" }
$analytics = Invoke-Api -Method "GET" -Url "$base/analytics/mastery" -Headers $authHeaders -Body $null

# Step 5: Grade endpoint with q and grade
$gradeQ = Invoke-Api -Method "POST" -Url "$base/study/grade" -Headers $authHeaders -Body @{ cardId="000000000000000000000001"; q=3 }
$gradeGrade = Invoke-Api -Method "POST" -Url "$base/study/grade" -Headers $authHeaders -Body @{ cardId="000000000000000000000001"; grade=3 }

# Step 6: Stop/remove backend job
$jobLog = Receive-Job -Job $job -Keep -ErrorAction SilentlyContinue | Out-String
Stop-Job -Job $job -ErrorAction SilentlyContinue
Remove-Job -Job $job -Force -ErrorAction SilentlyContinue

[pscustomobject]@{
  port5000Freed = $portFreed
  backendJobId = $job.Id
  serverReady = $serverReady
  registerStatus = $register.status
  registerMessage = $register.json.message
  registerSuccess = $register.json.success
  registerEmail = $email
  tokenReceived = [bool]$token
  analyticsStatus = $analytics.status
  analyticsMessage = $analytics.json.message
  analyticsSuccess = $analytics.json.success
  gradeQStatus = $gradeQ.status
  gradeQMessage = $(if($gradeQ.json.message){$gradeQ.json.message}else{$gradeQ.raw})
  gradeGradeStatus = $gradeGrade.status
  gradeGradeMessage = $(if($gradeGrade.json.message){$gradeGrade.json.message}else{$gradeGrade.raw})
  backendJobLogTail = ($jobLog -split "`n" | Select-Object -Last 8) -join "`n"
} | ConvertTo-Json -Depth 6
