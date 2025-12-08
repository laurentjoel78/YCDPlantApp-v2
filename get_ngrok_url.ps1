$json = Get-Content -Path "ngrok_tunnels.json" -Raw | ConvertFrom-Json
$httpsUrl = $json.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
Write-Output $httpsUrl
