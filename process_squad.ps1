$ErrorActionPreference = "Stop"

$url = "https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v1.1.json"
$outputJsonPath = ".\squad_dev_qa.json"
$outputCsvPath = ".\squad_dev_qa.csv"

Write-Host "Downloading SQuAD Dev dataset..."
Invoke-WebRequest -Uri $url -OutFile "dev-v1.1.json"

Write-Host "Parsing JSON..."
$raw = Get-Content -Raw "dev-v1.1.json" | ConvertFrom-Json

$qaPairs = @()

Write-Host "Extracting Q&A pairs..."
foreach ($article in $raw.data) {
    foreach ($paragraph in $article.paragraphs) {
        $context = $paragraph.context
        foreach ($qa in $paragraph.qas) {
            $question = $qa.question
            if ($qa.answers.Count -gt 0) {
                # Taking the first answer for simplicity
                $answer = $qa.answers[0].text
                
                $qaPairs += [PSCustomObject]@{
                    Context = $context
                    Question = $question
                    Answer = $answer
                }
            }
        }
    }
}

Write-Host "Saving to JSON..."
$qaPairs | ConvertTo-Json -Depth 5 | Set-Content $outputJsonPath

Write-Host "Saving to CSV..."
$qaPairs | Export-Csv -Path $outputCsvPath -NoTypeInformation

Write-Host "Done! Processed $($qaPairs.Count) Q&A pairs."
