<?php
	header("Content-Type: text/plain");
	
	require_once "./_packaging.class.php";
	$strThisDir = rtrim(dirname(__FILE__), "/\ ");
	$oLoader = new ecSimpleJSLoader($strThisDir);
	$oCSSLoader = new ecSimpleCSSLoader($strThisDir);
	$oHTMLParser = new ecSimpleHTMLParser($strThisDir);

	// package app
	$oLoader->noCache = true;
	$oLoader->isPreserveMultiCommentsWithCopyright = false;
	$oLoader->isIgnoreLineNumbers = true;
	$oLoader->strBaseModulesName = '../lib/';
	$oLoader->strMiniModulesName = '../example/lib/compass.js';
	$oLoader->createMiniModules(array(
		'Logger',
		'CompassInBrowser',
		'CompassMock',
		'CompassHelper',
	));
?>