<#
.SYNOPSIS
    SAP Cloud ALM API / mTLS helper for Windows.

.DESCRIPTION
    Takes the service key JSON that SAP BTP shows you after creating an "x509"
    service key and produces everything you need to call the SAP Cloud ALM APIs
    with mutual TLS:

        certificate.pem   client certificate (+ CA chain)  -> curl --cert
        key.pem           private key                      -> curl --key
        certificate.pfx   PKCS#12 bundle, password protected
                                                           -> Postman, Java, SoapUI, ...
        calm-api.env      the non-secret values (client id, token URL, API URL)

    Nothing has to be installed: the script only uses Windows PowerShell 5.1
    (part of Windows 10/11) and .NET. OpenSSL is NOT required.

.PARAMETER ServiceKey
    Path to the downloaded service key JSON file. If omitted, the script uses
    the clipboard (button "Copy JSON" in SAP BTP) or asks for the path.

.PARAMETER OutputFolder
    Where to write the files. Default: the current folder.

.PARAMETER Password
    Password for certificate.pfx. If omitted you are asked interactively.

.PARAMETER Force
    Overwrite existing files.

.EXAMPLE
    .\setup-calm-mtls.ps1

.EXAMPLE
    .\setup-calm-mtls.ps1 .\service-key.json -OutputFolder C:\calm
#>

#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Position = 0)] [string] $ServiceKey,
    [string] $OutputFolder = (Get-Location).Path,
    [string] $Password,
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------- output ----

function Write-Step   { param([string]$Text) Write-Host ""; Write-Host "==> $Text" -ForegroundColor Cyan }
function Write-Ok     { param([string]$Text) Write-Host "    [ok] $Text" -ForegroundColor Green }
function Write-Note   { param([string]$Text) Write-Host "         $Text" -ForegroundColor DarkGray }
function Write-Warn   { param([string]$Text) Write-Host "    [warning] $Text" -ForegroundColor Yellow }

function Stop-WithMessage {
    param([string]$Message, [string[]]$Hints = @())
    Write-Host ""
    Write-Host "[error] $Message" -ForegroundColor Red
    foreach ($h in $Hints) { Write-Host "        $h" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Press Enter to close this window..." -ForegroundColor DarkGray
    if ($Host.UI.RawUI) { try { Read-Host | Out-Null } catch { } }
    exit 1
}

function Get-CleanPath {
    param([string]$Path)
    if (-not $Path) { return $Path }
    $p = $Path.Trim().Trim('"').Trim("'")
    if ($p.StartsWith('~')) { $p = $env:USERPROFILE + $p.Substring(1) }
    return $p
}

# ----------------------------------------------------------- DER helpers ----
# Windows PowerShell 5.1 (.NET Framework) cannot import a PEM private key
# directly, so the PKCS#1/PKCS#8 structure is parsed here by hand.

function Read-DerHeader {
    param([byte[]]$Data, [int]$Position)
    if ($Position + 1 -ge $Data.Length) { throw 'The private key is truncated.' }
    $tag = $Data[$Position]; $Position++
    $len = [int]$Data[$Position]; $Position++
    if ($len -band 0x80) {
        $count = $len -band 0x7F
        if ($count -eq 0 -or $count -gt 4) { throw 'Unsupported private key encoding.' }
        $len = 0
        for ($i = 0; $i -lt $count; $i++) { $len = ($len -shl 8) -bor [int]$Data[$Position]; $Position++ }
    }
    [pscustomobject]@{ Tag = $tag; Length = $len; ContentStart = $Position }
}

function Convert-DerIntegerToFixedSize {
    param([byte[]]$Bytes, [int]$Size)
    $i = 0
    while ($i -lt $Bytes.Length - 1 -and $Bytes[$i] -eq 0) { $i++ }
    $trimmed = $Bytes[$i..($Bytes.Length - 1)]
    if ($Size -le 0) { return , ([byte[]]$trimmed) }
    if ($trimmed.Length -gt $Size) { throw 'Unexpected private key size.' }
    $out = New-Object byte[] $Size
    [Array]::Copy($trimmed, 0, $out, $Size - $trimmed.Length, $trimmed.Length)
    return , ([byte[]]$out)
}

function ConvertTo-RsaParameters {
    param([byte[]]$Der, [bool]$IsPkcs8)

    if ($IsPkcs8) {
        $outer = Read-DerHeader $Der 0
        $p = $outer.ContentStart
        $ver = Read-DerHeader $Der $p;  $p = $ver.ContentStart + $ver.Length
        $alg = Read-DerHeader $Der $p;  $p = $alg.ContentStart + $alg.Length
        $oct = Read-DerHeader $Der $p
        if ($oct.Tag -ne 0x04) { throw 'Unsupported private key format.' }
        $Der = $Der[$oct.ContentStart..($oct.ContentStart + $oct.Length - 1)]
    }

    $seq = Read-DerHeader $Der 0
    if ($seq.Tag -ne 0x30) { throw 'The private key is not a valid RSA key.' }
    $pos = $seq.ContentStart
    $ints = @()
    for ($i = 0; $i -lt 9; $i++) {
        $h = Read-DerHeader $Der $pos
        if ($h.Tag -ne 0x02) { throw 'The private key is not a valid RSA key.' }
        $ints += , ([byte[]]$Der[$h.ContentStart..($h.ContentStart + $h.Length - 1)])
        $pos = $h.ContentStart + $h.Length
    }

    $modulus = (Convert-DerIntegerToFixedSize $ints[1] 0)
    $k = $modulus.Length
    $half = [int][Math]::Ceiling($k / 2.0)

    $rsa = New-Object System.Security.Cryptography.RSAParameters
    $rsa.Modulus  = $modulus
    $rsa.Exponent = (Convert-DerIntegerToFixedSize $ints[2] 0)
    $rsa.D        = (Convert-DerIntegerToFixedSize $ints[3] $k)
    $rsa.P        = (Convert-DerIntegerToFixedSize $ints[4] $half)
    $rsa.Q        = (Convert-DerIntegerToFixedSize $ints[5] $half)
    $rsa.DP       = (Convert-DerIntegerToFixedSize $ints[6] $half)
    $rsa.DQ       = (Convert-DerIntegerToFixedSize $ints[7] $half)
    $rsa.InverseQ = (Convert-DerIntegerToFixedSize $ints[8] $half)
    return $rsa
}

function Get-PemBlocks {
    param([string]$Pem, [string]$Label)
    $pattern = "-----BEGIN $Label-----(.*?)-----END $Label-----"
    $found = [regex]::Matches($Pem, $pattern, 'Singleline')
    $result = @()
    foreach ($m in $found) {
        $b64 = ($m.Groups[1].Value -replace '\s', '')
        $result += , ([Convert]::FromBase64String($b64))
    }
    return , $result
}

# ------------------------------------------------------------ 0. banner -----

Write-Host "SAP Cloud ALM - mTLS setup helper" -ForegroundColor White
Write-Host "Creates certificate.pem, key.pem and certificate.pfx from a service key."

if ($PSVersionTable.Platform -and $PSVersionTable.Platform -ne 'Win32NT') {
    Write-Warn "This script is made for Windows. On macOS and Linux please use setup-calm-mtls.sh instead."
}

# ------------------------------------------------------- 1. get the JSON ----

Write-Step "Step 1/5  Reading the service key"

$jsonText = $null

if ($ServiceKey) {
    $ServiceKey = Get-CleanPath $ServiceKey
    if (-not (Test-Path -LiteralPath $ServiceKey)) {
        Stop-WithMessage "The file '$ServiceKey' does not exist." @(
            "Check the path, or run the script without parameters and paste the path when asked.",
            "Tip: in the Explorer right-click the file, choose 'Copy as path' and paste it here."
        )
    }
    $jsonText = Get-Content -LiteralPath $ServiceKey -Raw
    Write-Ok "Using file: $ServiceKey"
}
else {
    if (Get-Command Get-Clipboard -ErrorAction SilentlyContinue) {
        try { $clip = Get-Clipboard -Raw } catch { $clip = $null }
        if ($clip -and $clip -match '"clientid"') {
            $jsonText = $clip
            Write-Ok "Found a service key in your clipboard - using it."
        }
    }
    if (-not $jsonText) {
        Write-Host "    Paste the full path of the downloaded service key file and press Enter."
        Write-Host "    (In the Explorer: right-click the file -> 'Copy as path', then right-click here to paste.)"
        $answer = Get-CleanPath (Read-Host "    Path")
        if (-not $answer) {
            Stop-WithMessage "No file was given, nothing to do." @(
                "Download the service key from SAP BTP first (button 'Download' in the dialog)."
            )
        }
        if (-not (Test-Path -LiteralPath $answer)) {
            Stop-WithMessage "The file '$answer' does not exist." @(
                "Use 'Copy as path' in the Explorer to get the exact path."
            )
        }
        $jsonText = Get-Content -LiteralPath $answer -Raw
        Write-Ok "Using file: $answer"
    }
}

if (-not $jsonText -or $jsonText.Trim().Length -eq 0) {
    Stop-WithMessage "The service key is empty." @(
        "Use the 'Copy JSON' or 'Download' button of the service key dialog in SAP BTP."
    )
}

try { $obj = $jsonText | ConvertFrom-Json }
catch {
    Stop-WithMessage "The service key is not valid JSON." @(
        "Most likely only a part of the text was copied.",
        "Please use the 'Download' button in SAP BTP and pass that file to this script.",
        "Technical detail: $($_.Exception.Message)"
    )
}

# ------------------------------------------------------- 2. extract data ----

Write-Step "Step 2/5  Extracting client id, certificate, key and token URL"

function Get-Prop { param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { return $p.Value } else { return $null }
}

$uaa = Get-Prop $obj 'uaa'
if (-not $uaa) { $uaa = $obj }

$clientId   = Get-Prop $uaa 'clientid'
$certPem    = Get-Prop $uaa 'certificate'
$keyPem     = Get-Prop $uaa 'key'
$certUrl    = Get-Prop $uaa 'certurl'
$credType   = Get-Prop $uaa 'credential-type'
$endpoints  = Get-Prop $obj 'endpoints'
$apiUrl     = Get-Prop $endpoints 'Api'

if (-not $certPem -or -not $keyPem) {
    if (Get-Prop $uaa 'clientsecret') {
        Stop-WithMessage "This service key uses a client secret, not a certificate (mTLS)." @(
            "In SAP BTP create a NEW service key and choose the X.509 configuration, see",
            "https://help.sap.com/docs/cloud-alm/apis/creating-service-keys-mtls"
        )
    }
    Stop-WithMessage "Could not find 'certificate' and 'key' in the service key." @(
        "Most likely only a part of the JSON was copied.",
        "Please use the 'Download' button in SAP BTP and pass that file to this script."
    )
}
if (-not $clientId) {
    Stop-WithMessage "Could not find 'clientid' in the service key." @(
        "Please re-download the service key from SAP BTP and try again."
    )
}
if (-not $certUrl) {
    Stop-WithMessage "Could not find 'certurl' in the service key." @(
        "'certurl' is the mTLS token endpoint (it contains '.cert.').",
        "Re-create the service key with the X.509 configuration."
    )
}

$certUrl = $certUrl.TrimEnd('/')
if ($certUrl -notmatch '\.cert\.') { Write-Warn "'certurl' does not contain '.cert.' - this is unusual for mTLS keys." }

Write-Ok "client id : $clientId"
Write-Ok "token URL : $certUrl/oauth/token"
if ($apiUrl)   { Write-Ok "API URL   : $apiUrl" }
if ($credType) { Write-Ok "type      : $credType" }

# --------------------------------------------------------- 3. write PEMs ----

Write-Step "Step 3/5  Writing certificate.pem and key.pem"

$OutputFolder = Get-CleanPath $OutputFolder
try {
    if (-not (Test-Path -LiteralPath $OutputFolder)) { New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null }
    $OutputFolder = (Resolve-Path -LiteralPath $OutputFolder).Path
}
catch {
    Stop-WithMessage "Cannot create or open the output folder '$OutputFolder'." @(
        "Choose a different folder, for example:  -OutputFolder `"$env:USERPROFILE\Desktop\calm`""
    )
}

$certFile = Join-Path $OutputFolder 'certificate.pem'
$keyFile  = Join-Path $OutputFolder 'key.pem'
$pfxFile  = Join-Path $OutputFolder 'certificate.pfx'
$envFile  = Join-Path $OutputFolder 'calm-api.env'

if (-not $Force) {
    foreach ($f in @($certFile, $keyFile, $pfxFile)) {
        if (Test-Path -LiteralPath $f) {
            Stop-WithMessage "The file '$f' already exists." @(
                "Nothing was changed. Re-run with -Force to overwrite,",
                "or write to another folder with -OutputFolder <folder>."
            )
        }
    }
}

# ConvertFrom-Json already turned the \n escapes into real line breaks.
$certPem = $certPem -replace "`r`n", "`n"
$keyPem  = $keyPem  -replace "`r`n", "`n"
if (-not $certPem.EndsWith("`n")) { $certPem += "`n" }
if (-not $keyPem.EndsWith("`n"))  { $keyPem  += "`n" }

$utf8 = New-Object System.Text.UTF8Encoding($false)
try {
    [System.IO.File]::WriteAllText($certFile, $certPem, $utf8)
    [System.IO.File]::WriteAllText($keyFile,  $keyPem,  $utf8)
}
catch {
    Stop-WithMessage "Could not write the files to '$OutputFolder'." @(
        "Is the folder write protected or synchronised by OneDrive with a full quota?",
        "Technical detail: $($_.Exception.Message)"
    )
}

# Only the current user may read the private key.
try {
    & icacls.exe $keyFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
}
catch { Write-Warn "Could not restrict the file permissions of key.pem - please keep the file safe yourself." }

if ($certPem -notmatch '-----BEGIN CERTIFICATE-----') {
    Stop-WithMessage "The extracted certificate does not look like a PEM certificate." @(
        "The service key seems to be incomplete - please download it again."
    )
}
if ($keyPem -notmatch '-----BEGIN (RSA )?PRIVATE KEY-----') {
    Stop-WithMessage "The extracted private key does not look like a PEM key." @(
        "The service key seems to be incomplete - please download it again."
    )
}

$certBlocks = Get-PemBlocks -Pem $certPem -Label 'CERTIFICATE'
Write-Ok "$certFile   ($($certBlocks.Count) certificate(s): your client certificate + CA chain)"
Write-Ok "$keyFile   (private key, readable only by you)"

# --------------------------------------------------------- 4. validate ------

Write-Step "Step 4/5  Checking that certificate and key belong together"

try   { $leaf = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(, [byte[]]$certBlocks[0]) }
catch { Stop-WithMessage "The certificate could not be read." @("The service key JSON was probably truncated. Please download it again.", "Technical detail: $($_.Exception.Message)") }

$isPkcs8 = $keyPem -match '-----BEGIN PRIVATE KEY-----'
$keyLabel = if ($isPkcs8) { 'PRIVATE KEY' } else { 'RSA PRIVATE KEY' }
$keyBlocks = Get-PemBlocks -Pem $keyPem -Label $keyLabel
if ($keyBlocks.Count -eq 0) { Stop-WithMessage "The private key could not be read." @("Please download the service key again.") }

try   { $rsaParams = ConvertTo-RsaParameters -Der ([byte[]]$keyBlocks[0]) -IsPkcs8 $isPkcs8 }
catch { Stop-WithMessage "The private key could not be interpreted." @("Reason: $($_.Exception.Message)", "Please download the service key again.") }

$certModulus = $null
try {
    $pub = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($leaf)
    if ($pub) { $certModulus = $pub.ExportParameters($false).Modulus }
}
catch { $certModulus = $null }

if ($certModulus) {
    $same = ($certModulus.Length -eq $rsaParams.Modulus.Length)
    if ($same) { for ($i = 0; $i -lt $certModulus.Length; $i++) { if ($certModulus[$i] -ne $rsaParams.Modulus[$i]) { $same = $false; break } } }
    if (-not $same) {
        Stop-WithMessage "The certificate and the private key do not match." @(
            "This happens when parts of two different service keys are mixed.",
            "Please download one complete service key and run the script again."
        )
    }
    Write-Ok "Certificate and private key match."
}

Write-Note "subject: $($leaf.Subject)"
$daysLeft = [int]([datetime]$leaf.NotAfter - (Get-Date)).TotalDays
if ($daysLeft -lt 0)      { Write-Warn "This certificate EXPIRED on $($leaf.NotAfter) - create a new service key in SAP BTP." }
elseif ($daysLeft -lt 30) { Write-Warn "This certificate expires on $($leaf.NotAfter) (in $daysLeft days) - plan the renewal." }
else                      { Write-Ok "Certificate is valid until $($leaf.NotAfter) ($daysLeft days left)." }

# --------------------------------------------------------- 5. build pfx -----

Write-Step "Step 5/5  Creating certificate.pfx"

if (-not $Password) { $Password = $env:CALM_PFX_PASSWORD }
if (-not $Password) {
    while ($true) {
        $s1 = Read-Host "    Choose a password for certificate.pfx (typing is hidden)" -AsSecureString
        $s2 = Read-Host "    Repeat the password" -AsSecureString
        $p1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
        $p2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
        if ($p1.Length -lt 4) { Write-Warn "Please use at least 4 characters."; continue }
        if ($p1 -ne $p2)      { Write-Warn "The two entries did not match, please try again."; continue }
        $Password = $p1
        break
    }
}

$pfxBytes = $null
$rsaProvider = $null
try {
    $collection = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2Collection

    if ($PSVersionTable.PSEdition -eq 'Core') {
        # PowerShell 7 / .NET 5+: import the key directly.
        $rsaProvider = [System.Security.Cryptography.RSA]::Create()
        $rsaProvider.ImportParameters($rsaParams)
        $leafWithKey = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::CopyWithPrivateKey($leaf, $rsaProvider)
    }
    else {
        # Windows PowerShell 5.1 / .NET Framework: the key has to live in a CSP
        # key container. Not every Windows installation accepts the same set of
        # CSP options, so the working combination is determined at runtime.
        $lastError = $null
        foreach ($attempt in 1, 2, 3) {
            $candidate = $null
            try {
                if ($attempt -lt 3) {
                    $csp = New-Object System.Security.Cryptography.CspParameters
                    $csp.KeyContainerName = 'calm-mtls-' + [guid]::NewGuid().ToString()
                    if ($attempt -eq 1) { $csp.ProviderType = 24 }   # PROV_RSA_AES
                    $candidate = New-Object System.Security.Cryptography.RSACryptoServiceProvider($csp)
                }
                else {
                    $candidate = New-Object System.Security.Cryptography.RSACryptoServiceProvider
                }
                $candidate.ImportParameters($rsaParams)
                $rsaProvider = $candidate
                break
            }
            catch {
                $lastError = $_
                if ($candidate) { try { $candidate.Dispose() } catch { } }
            }
        }
        if (-not $rsaProvider) { throw $lastError }

        $leafWithKey = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(, [byte[]]$certBlocks[0])
        $leafWithKey.PrivateKey = $rsaProvider
    }

    $collection.Add($leafWithKey) | Out-Null
    for ($i = 1; $i -lt $certBlocks.Count; $i++) {
        $collection.Add((New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(, [byte[]]$certBlocks[$i]))) | Out-Null
    }

    $pfxBytes = $collection.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, $Password)
    [System.IO.File]::WriteAllBytes($pfxFile, $pfxBytes)
}
catch {
    Stop-WithMessage "certificate.pfx could not be created." @(
        "certificate.pem and key.pem were created and can already be used with curl.",
        "If you need the .pfx file, create it manually with OpenSSL:",
        "  openssl pkcs12 -export -out certificate.pfx -in certificate.pem -inkey key.pem",
        "OpenSSL is included in Git for Windows: C:\Program Files\Git\usr\bin\openssl.exe",
        "On macOS and Linux use setup-calm-mtls.sh - it does the same automatically.",
        "Technical detail: $($_.Exception.Message)"
    )
}
finally {
    if ($rsaProvider -and $rsaProvider.GetType().Name -eq 'RSACryptoServiceProvider') {
        # Do not leave a copy of the key in the Windows key store.
        try { $rsaProvider.PersistKeyInCsp = $false; $rsaProvider.Clear() } catch { }
    }
}

try { & icacls.exe $pfxFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null } catch { }
Write-Ok "$pfxFile   (protected with the password you entered)"

$envLines = @(
    "# SAP Cloud ALM API - non-secret connection data",
    "# Created by setup-calm-mtls.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    "CALM_CLIENT_ID=$clientId",
    "CALM_TOKEN_URL=$certUrl/oauth/token"
)
if ($apiUrl) { $envLines += "CALM_API_URL=$apiUrl" }
[System.IO.File]::WriteAllText($envFile, ($envLines -join "`r`n") + "`r`n", $utf8)
Write-Ok "$envFile   (client id and URLs, no secrets)"

# ------------------------------------------------------------- summary ------

Write-Host ""
Write-Host "All done. Files in $OutputFolder :" -ForegroundColor Green
Write-Host "  certificate.pem  certificate.pfx  key.pem  calm-api.env"
Write-Host ""
Write-Host "Check that it works - request an access token:" -ForegroundColor White
Write-Host "  The curl.exe of Windows uses Schannel and therefore needs the .pfx file,"
Write-Host "  not the .pem files:"
Write-Host "  curl.exe --cert `"certificate.pfx`" --cert-type P12 --pass <your-pfx-password> ``"
Write-Host "       -X POST `"$certUrl/oauth/token`" ``"
Write-Host "       -d `"grant_type=client_credentials`" --data-urlencode `"client_id=$clientId`""
if ($apiUrl) {
    Write-Host ""
    Write-Host "How to call an API with the token:" -ForegroundColor White
    Write-Host "  curl.exe -H `"Authorization: Bearer <access_token>`" `"$apiUrl/...`""
}
Write-Host ""
Write-Host "Keep key.pem and certificate.pfx secret - they are as powerful as a password." -ForegroundColor Yellow
Write-Host "Never commit them to Git and never send them by e-mail."
Write-Host ""
