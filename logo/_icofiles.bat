@echo off

echo std: 16, 32, 48
CALL _svg2png.bat Logo.svg ico/logo016.png 16
CALL _svg2png.bat Logo.svg ico/logo032.png 32
CALL _svg2png.bat Logo.svg ico/logo048.png 48
echo xp: 64
CALL _svg2png.bat Logo.svg ico/logo064.png 64
rem echo vista: 256
rem CALL _svg2png.bat Logo.svg ico/logo256.png 256

echo Finished generting PNG.
echo.
echo Note! You need to manually create logo.ico file.
echo You can do this e.g. with GIMP by opening generated PNGs as layers and then saving/exporting to logo.ico.
echo Avoid using PNG compression as this might not work on Windows and maybe some browsers...
echo Also see MS guidance for sizes:
echo http://msdn.microsoft.com/en-us/library/aa511280.aspx#size
echo.
pause
