@echo off

rem
rem Set path for inkscape
rem
rem SET PATH=%PATH%;C:\Programy\Grafika i Media\Inkscape\
SET PATH=%PATH%;c:\Program Files (x86)\Inkscape\

rem
rem Run
rem (.*).svg
rem aspect ratio check? or maybe create two images - fixed width and fixed height and use PHP to choose one...
rem inkscape.exe $1.svg -e quickpng\$1.png -w 100 --export-area-drawing --export-background-opacity=0.0

SET tmpset_WIDTH=-w %3
IF [%3]==[] SET tmpset_WIDTH=
IF [%3]==[-] SET tmpset_WIDTH=
SET tmpset_HEIGHT=-h %4
IF [%4]==[] SET tmpset_HEIGHT=
IF [%4]==[-] SET tmpset_HEIGHT=

inkscape.exe %1 -e %2 %tmpset_WIDTH% %tmpset_HEIGHT% --export-background-opacity=0.0