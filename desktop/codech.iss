#ifndef AppVersion
  #define AppVersion "0.2.0"
#endif
#ifndef RuntimeDir
  #define RuntimeDir "..\release\Codech IDE"
#endif

[Setup]
AppId={{A9AB61D4-504D-4383-9BBE-279CE453BEA1}
AppName=Codech IDE
AppVersion={#AppVersion}
AppPublisher=Codech contributors
AppPublisherURL=https://github.com/AmirMohammadDehghan/codech-ide
AppSupportURL=https://github.com/AmirMohammadDehghan/codech-ide/issues
AppUpdatesURL=https://github.com/AmirMohammadDehghan/codech-ide/releases
DefaultDirName={localappdata}\Programs\Codech IDE
DefaultGroupName=Codech IDE
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=..\release
OutputBaseFilename=CodechIDE-Setup-{#AppVersion}-x64
SetupIconFile=..\branding\codech.ico
UninstallDisplayIcon={app}\Codech.exe
LicenseFile=..\LICENSE
Compression=lzma2/fast
SolidCompression=yes
LZMANumBlockThreads=2
WizardStyle=modern
DisableProgramGroupPage=yes
CloseApplications=yes
RestartApplications=no
UninstallDisplayName=Codech IDE
VersionInfoProductName=Codech IDE
VersionInfoVersion={#AppVersion}

[Tasks]
Name: desktopicon; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
Source: "{#RuntimeDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Codech IDE"; Filename: "{app}\Codech.exe"; AppUserModelID: Codech.IDE
Name: "{autodesktop}\Codech IDE"; Filename: "{app}\Codech.exe"; Tasks: desktopicon; AppUserModelID: Codech.IDE

[Run]
Filename: "{app}\Codech.exe"; Description: "Launch Codech IDE"; Flags: nowait postinstall skipifsilent
