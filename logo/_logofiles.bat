@echo off

SET tempset_OUTPATH=..\example\logo\

echo Android
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo036.png 36
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo048.png 48
echo iPhone                
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo057.png 57
echo iPhone + Android      
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo072.png 72
echo Nokia                 
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo080.png 80
echo Nokia + iPad          
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo114.png 114
echo Default               
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%logo128.png 128

echo Done.
pause
