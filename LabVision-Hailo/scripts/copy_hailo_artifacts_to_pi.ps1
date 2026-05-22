param(
    [Parameter(Mandatory = $true)]
    [string]$Target,

    [string]$RemoteDir = "~/labos_hailo_prepare"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Onnx = Join-Path $ProjectRoot "exports\hailo\backcam_yolov8s_improved_v1_960.onnx"
$Calibration = Join-Path $ProjectRoot "exports\hailo\calibration\backcam_v1\images"
$DeployDir = $PSScriptRoot

if (!(Test-Path $Onnx)) {
    throw "Missing ONNX file: $Onnx"
}

if (!(Test-Path $Calibration)) {
    throw "Missing calibration folder: $Calibration"
}

ssh $Target "mkdir -p $RemoteDir/models $RemoteDir/calibration/images $RemoteDir/deploy"
scp $Onnx "$Target`:$RemoteDir/models/"
scp "$Calibration\*" "$Target`:$RemoteDir/calibration/images/"
scp "$DeployDir\*" "$Target`:$RemoteDir/deploy/"

Write-Host "Copied Hailo preparation artifacts to $Target`:$RemoteDir"

