# Regenerates style.min.css from style.css after you edit the readable file.
# Run this from the repo folder after making CSS changes:
#   .\minify-css.ps1
$css = [System.IO.File]::ReadAllText("style.css")

# Protect strings
$strings = @()
$css = [regex]::Replace($css, '(["''])(?:(?=(\\?))\2.)*?\1', {
    param($m)
    $strings += $m.Value
    "___STR$($strings.Count-1)___"
})

# Remove comments (keep /* ! important */)
$css = [regex]::Replace($css, '/\*[^!][\s\S]*?\*/', '')
# Collapse whitespace
$css = [regex]::Replace($css, '\s+', ' ')
# Remove space around braces, colons, semicolons, commas
$css = [regex]::Replace($css, '\s*\{\s*', '{')
$css = [regex]::Replace($css, '\s*\}\s*', '}')
$css = [regex]::Replace($css, '\s*:\s*', ':')
$css = [regex]::Replace($css, '\s*;\s*', ';')
$css = [regex]::Replace($css, '\s*,\s*', ',')
# Remove trailing semicolon before }
$css = [regex]::Replace($css, ';}', '}')
# Remove space around combinators
$css = [regex]::Replace($css, '\s*>\s*', '>')
$css = [regex]::Replace($css, '\s*\+\s*', '+')
$css = [regex]::Replace($css, '\s*~\s*', '~')

# Restore strings
for ($i = 0; $i -lt $strings.Count; $i++) {
    $css = $css.Replace("___STR${i}___", $strings[$i])
}

$css = $css.Trim()
[System.IO.File]::WriteAllText("style.min.css", $css)
Write-Host "Done! style.min.css regenerated ($($css.Length) bytes)"
