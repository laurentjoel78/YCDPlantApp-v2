$response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
$httpsUrl = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
Write-Host "ngrok HTTPS URL: $httpsUrl"
