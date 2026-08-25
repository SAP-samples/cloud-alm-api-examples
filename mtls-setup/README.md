# SAP Cloud ALM APIs with mTLS – step-by-step guide

This guide takes you from "I have a service key" to "I can call the SAP Cloud ALM APIs".
You need **no additional software**: everything used here is already part of macOS, Windows and Linux.

Reference documentation: <https://help.sap.com/docs/cloud-alm/apis/creating-service-keys-mtls>

---

## What you will get

| File              | What it is                                       | Used by                                                               |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `certificate.pem` | Your client certificate + the SAP CA chain       | `curl --cert`, Python, Node.js, Java                                  |
| `key.pem`         | Your **private key** – keep it secret            | `curl --key`                                                          |
| `certificate.pfx` | Both of the above in one password-protected file | Postman, SoapUI, SAP tools, Java keystores, Windows certificate store |
| `calm-api.env`    | Client ID and URLs (no secrets)                  | Copy/paste reference                                                  |

---

## Step 1 – Create the service key in SAP BTP

1. In the SAP BTP cockpit open your **SAP Cloud ALM** service instance.
2. Create a **service key** and choose the **X.509 / mTLS** configuration
   (see the [SAP help page](https://help.sap.com/docs/cloud-alm/apis/creating-service-keys-mtls)).
3. A dialog appears with two buttons:
   * **Download** – saves a `.json` file (usually into your *Downloads* folder). **Recommended.**
   * **Copy JSON** – copies the content to the clipboard. The scripts can read the clipboard too.

> The service key contains a private key. Treat the downloaded file like a password:
> do not e-mail it, do not put it into a ticket, do not commit it to Git.

---

## Step 2 – Get the script

Download the script that matches your computer and put it in a folder you can find again,
for example on your Desktop:

* **Windows** → `setup-calm-mtls.ps1`
* **macOS / Linux** → `setup-calm-mtls.sh`

---

## Step 3 – Run the script

### Windows 10 / 11

1. Open the folder containing `setup-calm-mtls.ps1` in the **File Explorer**.
2. Click into the address bar, type `powershell` and press <kbd>Enter</kbd>.
   A blue PowerShell window opens, already in the right folder.
3. Paste the following line and press <kbd>Enter</kbd>:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup-calm-mtls.ps1
   ```

4. When asked for the service key, either
   * do nothing if you used **Copy JSON** – the script picks it up from the clipboard, or
   * paste the path of the downloaded file. To get the path: right-click the file in the
     Explorer → **Copy as path** → right-click into the PowerShell window to paste.
5. Choose a password for `certificate.pfx` when asked (you type it twice, nothing is shown).

You can also give the file directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-calm-mtls.ps1 "C:\Users\Me\Downloads\service-key.json"
```

**If Windows blocks the script** with *"... is not digitally signed"* or *"cannot be loaded"*:

```powershell
Unblock-File .\setup-calm-mtls.ps1
```

and use the `-ExecutionPolicy Bypass` form shown above. This affects only this one command,
it does not change any system setting.

### macOS

1. Open **Terminal** (<kbd>Cmd</kbd>+<kbd>Space</kbd>, type `Terminal`, <kbd>Enter</kbd>).
2. Type `cd ` (with a space), then drag the folder containing the script into the window
   and press <kbd>Enter</kbd>.
3. Make the script executable (only needed once):

   ```bash
   chmod +x setup-calm-mtls.sh
   ```

4. Start it:

   ```bash
   ./setup-calm-mtls.sh
   ```

5. When asked for the service key, drag the downloaded `.json` file from Finder into the
   Terminal window and press <kbd>Enter</kbd>. (If you used **Copy JSON**, the script finds it
   in the clipboard by itself.)
6. Choose a password for `certificate.pfx` (typed twice, nothing is shown while typing).

You can also give the file directly:

```bash
./setup-calm-mtls.sh ~/Downloads/service-key.json
```

**If macOS says "cannot be opened because it is from an unidentified developer"** –
that only happens when you double-click the file. Run it from the Terminal as shown above,
then it does not appear.

### Linux

Same as macOS:

```bash
chmod +x setup-calm-mtls.sh
./setup-calm-mtls.sh ~/Downloads/service-key.json
```

### Useful options (both scripts)

| Windows                 | macOS / Linux | Meaning                                        |
| ----------------------- | ------------- | ---------------------------------------------- |
| `-OutputFolder C:\calm` | `-o ~/calm`   | Write the files somewhere else                 |
| `-Password 'secret'`    | `-p 'secret'` | Set the `.pfx` password without being asked    |
| –                       | `--no-test`   | Do not request a test token (macOS/Linux only) |
| `-Force`                | `--force`     | Overwrite files that already exist             |
| `-?`                    | `--help`      | Show help                                      |

---

## Step 4 – What the script does

1. Reads the service key (file, clipboard or standard input).
2. Extracts `clientid`, `certificate`, `key`, `certurl` and the API endpoint.
3. Converts the `\n` sequences inside the JSON strings into real line breaks and writes
   `certificate.pem` and `key.pem` (the private key gets restrictive file permissions).
4. Checks that certificate and key belong together and warns if the certificate is
   expired or expires within 30 days.
5. Creates `certificate.pfx` with the password you choose.
6. On macOS and Linux it additionally requests a real access token from
   `<certurl>/oauth/token` so you immediately know whether everything works.
   On Windows this check is not done automatically – run the `curl.exe` command from
   step 5 once to verify it.

---

## Step 5 – Use it

### Get an access token

macOS / Linux:

```bash
curl --cert certificate.pem --key key.pem \
     -X POST 'https://<your-subaccount>.authentication.cert.<region>.hana.ondemand.com/oauth/token' \
     -d 'grant_type=client_credentials' \
     --data-urlencode 'client_id=sb-xxxx|sapcloudalm!xxxx'
```

Windows – the `curl.exe` shipped with Windows 10/11 uses **Schannel** and therefore cannot read
`key.pem`. Use the `.pfx` file instead (note the `.exe`, otherwise PowerShell uses its own alias):

```powershell
curl.exe --cert "certificate.pfx" --cert-type P12 --pass "YourPfxPassword" `
     -X POST "https://<your-subaccount>.authentication.cert.<region>.hana.ondemand.com/oauth/token" `
     -d "grant_type=client_credentials" --data-urlencode "client_id=sb-xxxx|sapcloudalm!xxxx"
```

Or fully in PowerShell, without curl:

```powershell
$cert  = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("certificate.pfx", "YourPfxPassword", "Exportable,PersistKeySet,UserKeySet")
$token = (Invoke-RestMethod -Method Post -Certificate $cert `
            -Uri "https://<your-subaccount>.authentication.cert.<region>.hana.ondemand.com/oauth/token" `
            -Body @{ grant_type = "client_credentials"; client_id = "sb-xxxx|sapcloudalm!xxxx" }).access_token
```

The PEM form (`--cert certificate.pem --key key.pem`) works in **Git Bash** and in WSL, because
that curl is built with OpenSSL.

The exact URL and client id are in `calm-api.env`.

### Call an API

```bash
curl -H 'Authorization: Bearer <access_token>' 'https://<region>.alm.cloud.sap/api/...'
```

The token is short-lived – request a new one when it expires.

### Postman

*Settings → Certificates → Add Certificate* → enter the host of the API,
select **PFX file** = `certificate.pfx` and enter your password.
Alternatively use CRT = `certificate.pem` and KEY = `key.pem`.

### Java (keytool / SSLContext)

`certificate.pfx` is a standard PKCS#12 keystore:

```bash
keytool -list -v -keystore certificate.pfx -storetype PKCS12
```

Use it as `javax.net.ssl.keyStore` with `javax.net.ssl.keyStoreType=PKCS12`.

### Windows certificate store

Double-click `certificate.pfx`, enter the password and follow the import wizard.

---

## Do I need OpenSSL?

**No.**

* **Windows**: the PowerShell script builds the `.pfx` file with built-in .NET functions.
* **macOS**: OpenSSL (LibreSSL) is pre-installed at `/usr/bin/openssl`.
* **Linux**: OpenSSL is part of every common distribution.

Only if you want to run the OpenSSL commands manually:

| System          | Install command                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows         | `winget install ShiningLight.OpenSSL.Light` – or use the `openssl.exe` that comes with [Git for Windows](https://git-scm.com/download/win) (`C:\Program Files\Git\usr\bin\openssl.exe`) |
| macOS           | already there; newest version: `brew install openssl@3`                                                                                                                                 |
| Debian / Ubuntu | `sudo apt-get install -y openssl`                                                                                                                                                       |
| RHEL / Fedora   | `sudo dnf install -y openssl`                                                                                                                                                           |
| SUSE            | `sudo zypper install -y openssl`                                                                                                                                                        |

The manual equivalent of what the script does:

```bash
openssl pkcs12 -export -out certificate.pfx -in certificate.pem -inkey key.pem
```

(You are prompted for the export password – safer than putting it into the command line
with `-passout pass:...`, because command lines are visible to other users of the machine.)

---

## Troubleshooting

| Message                                                              | Cause and solution                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `The file '...' does not exist`                                      | Wrong path. Drag the file into the window (macOS) or use *Copy as path* (Windows) instead of typing it.                                                                                                                                                                           |
| `The service key is not valid JSON` / `is not JSON`                  | Only part of the text was copied. Use the **Download** button and pass the file.                                                                                                                                                                                                  |
| `Could not find 'certificate' and 'key'`                             | The key is incomplete, or it is a secret-based key.                                                                                                                                                                                                                               |
| `This service key uses a client secret, not a certificate`           | Create a new service key with the **X.509** configuration.                                                                                                                                                                                                                        |
| `The certificate and the private key do not match`                   | Pieces of two different service keys were mixed. Use one complete key.                                                                                                                                                                                                            |
| `This certificate EXPIRED`                                           | Client certificates are valid for about one year. Create a new service key.                                                                                                                                                                                                       |
| `HTTP 401` / `HTTP 400` from the token endpoint                      | The `client_id` is wrong or incomplete – it must include everything after the `                                                                                                                                                                                                   | `, and it must be URL-encoded (the scripts do this for you). |
| `HTTP 403`                                                           | The certificate was not accepted – the service key was probably deleted in SAP BTP.                                                                                                                                                                                               |
| `HTTP 404`                                                           | Wrong URL – it must be the value of `certurl` plus `/oauth/token`, **not** the value of `url`.                                                                                                                                                                                    |
| curl error 35 / 58 / 60 / 77, `SecureChannelFailure`, `TrustFailure` | The TLS handshake failed. In almost all cases a company proxy is inspecting HTTPS traffic – mutual TLS cannot work through it. Ask your network team to exclude `*.authentication.cert.*.hana.ondemand.com`, or test from a network without such a proxy (e.g. a mobile hotspot). |
| `unable to set private key file` / `--key` ignored (Windows)         | The `curl.exe` of Windows uses Schannel and cannot read PEM keys. Use `--cert certificate.pfx --cert-type P12 --pass <password>` instead.                                                                                                                                         |
| `Could not resolve host` / `NameResolutionFailure`                   | No internet connection, VPN not active, or a proxy must be configured (`HTTPS_PROXY` / `HTTP_PROXY`).                                                                                                                                                                             |
| `[failed] The test call ... failed`                                  | Only the online check failed – `certificate.pem`, `key.pem` and `certificate.pfx` were written correctly and can be used.                                                                                                                                                         |
| `The file '...' already exists`                                      | Re-run with `--force` / `-Force`, or write to another folder with `-o` / `-OutputFolder`.                                                                                                                                                                                         |
| PowerShell: `cannot be loaded because running scripts is disabled`   | Start it as `powershell -ExecutionPolicy Bypass -File .\setup-calm-mtls.ps1`.                                                                                                                                                                                                     |

---

## Security notes

* `key.pem`, `certificate.pfx` and the service key JSON are **credentials**. Anyone who has them
  can access your SAP Cloud ALM data.
* Store them in a password manager or a secrets store, not in a shared folder or a Git repository.
* Delete the downloaded service key JSON once the PEM/PFX files are created.
* Client certificates expire (typically after one year). Plan the renewal: create a new service
  key in SAP BTP, run the script again, then delete the old service key.
* If a key was ever exposed, delete the service key in SAP BTP immediately – this revokes it.
