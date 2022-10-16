@echo off
cls
title Command Prompt GLTF Converter
ver
echo (C) Copyright Arkhipov Andrei
echo.
:cmd
set /p "cmd=%cd%>"
%cmd%
echo.
goto cmd