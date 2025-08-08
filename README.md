# sustainabite-website
SustainaBite - Food Rescue Platform | Rescuing Bites, Reviving Lives

## Food photos downloader (Pexels)

A PowerShell script to download food images with de-duplication across runs using a manifest of SHA256 hashes.

Prereqs:
- PowerShell 5+ (preinstalled on Windows)
- Free Pexels API key

Setup your API key securely (do not commit secrets):
- Open a new PowerShell session and set an environment variable for this session only:
  `$Env:PEXELS_API_KEY = "{{PEXELS_API_KEY}}"`
- Or persist it for the current user:
  `[Environment]::SetEnvironmentVariable("PEXELS_API_KEY", "{{PEXELS_API_KEY}}", "User")`

Run (downloads ~200 images by default into `assets/images/food`):
```
pwsh -File scripts/download_food_photos.ps1
```

Options:
```
pwsh -File scripts/download_food_photos.ps1 -Total 300 -Keywords pizza,salad,sushi -OutDir assets/images/food -MinWidth 1280
```
- Add `-DryRun` to preview without saving files.

Notes:
- The manifest is stored at `assets/images/food/.manifest.json` and prevents duplicates by image hash and Pexels photo id.
- Images are named `<keyword>_<short-hash>.jpg`.
- Respect Pexels licensing and attribution requirements. Photographer info is kept in the manifest.
