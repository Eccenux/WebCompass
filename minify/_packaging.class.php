<?php
/**
	Simple JS loader/packer
*/
class ecSimpleJSLoader
{
	// true => always generate scripts from scratch
	var $noCache = false;
	// base path for modules and generated scripts
	var $strBaseScriptDir;
	// prefix for modules loaded in createMiniModules
	var $strBaseModulesName = 'edit_calend_';
	// file name for a script generated in createMiniModules
	var $strMiniModulesName = 'edit_calend.modules.mini.js';
	// minification options
	var $isRemoveInlineComments = true;
	var $isRemoveMultiComments = true;
	/**
	 * If true then line number will not be added in places where multiline comments were removed.
	 * @var bool
	 */
	var $isIgnoreLineNumbers = false;
	var $isPreserveMultiCommentsWithCopyright = true;

	function __construct($strBaseScriptDir)
	{
		$this->strBaseScriptDir = $strBaseScriptDir;
	}
	
	function getInfoCommentString($text)
	{
		return "\n// " . $text;
	}

	/**
	 * Resolve paths of modules.
	 *
	 * @param array $modules should contain names of files without the prefix and an extension.
	 * @return array Paths of files.
	 */
	function resolveModulesPaths($modules)
	{
		$paths = array();
		foreach ($modules as $m)
		{
			$path = $this->getModulePath($m);
			if (strpos($m, '*')===false) {
				$paths[] = $path;
				continue;
			}
			foreach (glob($path) as $fullpath) {
				// only append files (skip dirs)
				if (is_file($fullpath)) {
					$paths[] = $fullpath;
				}
			}
		}
		return $paths;
	}

	/*
		Create minified file from an array of JS modules.
		
		$arrModules should contain names of files without the prefix and an extension
	*/
	function createMiniModules($arrModules)
	{
		$strOutputPath = "{$this->strBaseScriptDir}/{$this->strMiniModulesName}";

		$arrModules = $this->resolveModulesPaths($arrModules);
		
		// check if we need to change anything
		if (!$this->noCache)
		{
			$isChanged = $this->isChanged($arrModules, $strOutputPath);
		}
		else
		{
			$isChanged = true;
		}
		
		// generate & create file
		if ($isChanged)
		{
			$hFile = fopen ($strOutputPath, 'w');
			foreach ($arrModules as $m)
			{
				$strFileName = basename($m);
				fwrite ($hFile, $this->getInfoCommentString("$strFileName, line#0")."\n");	// file start marker
				fwrite ($hFile, $this->getMiniContents($m));
				fwrite ($hFile, $this->getInfoCommentString("$strFileName, EOF"));		// EOF marker
			}
			fclose ($hFile);
		}
		
		return $this->strMiniModulesName;
	}
	
	/*
		Checks if any of module files were changed after changing the output file
	*/
	function isChanged($arrModules, $strOutputPath)
	{
		if (!file_exists($strOutputPath))
		{
			return true;
		}
		
		$intMaxTime = 0;
		foreach ($arrModules as $m)
		{
			$intTmpTime = filemtime($m);
			if ($intTmpTime>$intMaxTime)
			{
				$intMaxTime = $intTmpTime;
			}
		}
		$intFileTime = filemtime($strOutputPath);
		
		return ($intFileTime < $intMaxTime);
	}

	/*
		Get module path
	*/
	function getModulePath($strModuleName)
	{
		return "{$this->strBaseScriptDir}/{$this->strBaseModulesName}$strModuleName.js";
	}

	/*
		Gets minified contents of the given file
	*/
	function getMiniContents($strFilePath)
	{
		// contents
		$strCode = file_get_contents($strFilePath);
		
		// BOM del
		$strCode = preg_replace('#^\xEF\xBB\xBF#', '', $strCode);
		
		// lines (simpli/uni)fication
		$strCode = preg_replace(array("#\r\n#", "#\r#"), "\n", $strCode);
		
		// remove in-line comments without removing any vertical whitespace
		// TODO: A different aproach? Preserve strings and then match comments...
		if ($this->isRemoveInlineComments)
		{
			$strCode = preg_replace("#[ \t]*//[^\"\'\n]*[^\\\\\"\'\n](?=\n)#", '', $strCode);

			// not working: $strCode = preg_replace("#\n//[^'\n]*(['\"])[^'\n]*\1(?=\n)#", "\n", $strCode);
			$strCode = preg_replace("#\n//[^\"\n]*\"[^\"\n]*\"[^\"\n]*(?=\n)#", "\n", $strCode);
			$strCode = preg_replace("#\n//[^'\n]*'[^'\n]*'[^'\n]*(?=\n)#", "\n", $strCode);

			$strCode = preg_replace("#\n//(?=\n)#", "\n", $strCode);
		}
		
		// remove horizontal whitespace from EOL
		$strCode = preg_replace("#[ \t]+\n#", "\n", $strCode);
		
		// remove multi-line comments, add in-line comment in format: "// EOC@line#X".
		if ($this->isRemoveMultiComments)
		{
			$strCode = $this->parseMultiCom($strCode);
		}
		
		// add semicolon if not present
		$strCode = preg_replace("#([^\s};])\s*$#", "$1;\n", $strCode);
		
		return $strCode;
	}

	/*
		Parse multiline comments
	*/
	function parseMultiCom($strCode)
	{
		// prepare for simplified search
		//$strCode = "\n".$strCode."\n";
		
		//
		// find comments (take note of start and len)
		$arrComments = array();
		$reMulti = "#(?:^|\n)\s*/\*[\s\S]*?\*/\s*(?=\n|$)#";
		if (preg_match_all($reMulti, $strCode, $arrMatches, PREG_OFFSET_CAPTURE))
		{
			// ignore empty comments (remove from list)
			foreach ($arrMatches[0] as $i=>$v)
			{
				if (preg_match('#^\s*/\*\*/\s*$#i', $arrMatches[0][$i][0]))
				{
					unset($arrMatches[0][$i]);
				}
			}

			// remove comments with copyright from the list
			if ($this->isPreserveMultiCommentsWithCopyright)
			{
				foreach ($arrMatches[0] as $i=>$v)
				{
					if (preg_match('#\s(Copyright|license)#i', $arrMatches[0][$i][0]))
					{
						unset($arrMatches[0][$i]);
					}
				}
			}
			
			// create a list of comments (start, len, previous)
			foreach ($arrMatches[0] as $m)
			{
				$intInd = count($arrComments);
				$arrComments[$intInd] = array('start'=>$m[1], 'len'=>strlen($m[0]));
				if ($intInd>0)
				{
					$arrComments[$intInd]['previous'] = $arrComments[$intInd-1]['start']+$arrComments[$intInd-1]['len'];
				}
				else
				{
					$arrComments[$intInd]['previous'] = 0;
				}
			}
		}
		
		//
		// replace comments
		$intCorrection = 0;
		$intLines = 0;
		foreach ($arrComments as $c)
		{
			$intLines += 1+preg_match_all("#\n#"
				, substr($strCode
					, $c['previous']-$intCorrection
					, ($c['start']-$c['previous'])+$c['len'])
				, $m);
			$intLenPre = strlen($strCode);
			if ($this->isIgnoreLineNumbers) {
				$strCode = substr_replace($strCode, $this->getInfoCommentString("EOC"), $c['start']-$intCorrection, $c['len']);
			}
			else {
				$strCode = substr_replace($strCode, $this->getInfoCommentString("EOC@line#{$intLines}"), $c['start']-$intCorrection, $c['len']);
			}
			$intLines--;	// correction as line at the end is not matched
			$intCorrection += $intLenPre-strlen($strCode);
		}
		
		return $strCode;
	}
}

/**
 * Simple CSS loader/packer
 */
class ecSimpleCSSLoader extends ecSimpleJSLoader
{
	function __construct($strBaseScriptDir)
	{
		$this->isRemoveInlineComments = false;

		parent::__construct($strBaseScriptDir);
	}
	
	function getInfoCommentString($text)
	{
		return "\n/*$text*/";
	}

	/*
		Get module path
	*/
	function getModulePath($strModuleName)
	{
		return "{$this->strBaseScriptDir}/{$this->strBaseModulesName}$strModuleName.css";
	}
}

/**
 * Simple HTML parser
 */
class ecSimpleHTMLParser
{
	// base path for modules and generated scripts
	var $strBaseScriptDir;

	function __construct($strBaseScriptDir)
	{
		$this->strBaseScriptDir = $strBaseScriptDir;
	}

	/**
	 * Get body tag postion from HTML.
	 *
	 * @param string $html Contents of HTML file.
	 * @return array|boolean Returns false when not found or an array with start, end, length.
	 */
	private static function getBodyPostion ($html)
	{
		$bodyStart = stripos ($html, '<body');
		$bodyStart = strpos ($html, '>', $bodyStart);
		$bodyEnd  = strripos ($html, '</body>');
		if ($bodyStart === false || $bodyEnd === false)
		{
			return false;
		}
		return array('start' => $bodyStart, 'end' => $bodyEnd, 'length' => $bodyEnd - $bodyStart);
	}

	/**
	 * Copies body from source and overwrites it in destination file.
	 * 
	 * @param string $source Source file path relative to $strBaseScriptDir.
	 * @param string $destination Destination file path relative to $strBaseScriptDir.
	 * @param bool $evalSource If true then source file will be evaluted (run as PHP).
	 */
	function overwriteBody($source, $destination, $evalSource = false)
	{
		if (!$evalSource) {
			$sourceContents = file_get_contents($source);
		} else {
			ob_start();
			include($source);
			$sourceContents = ob_get_clean();
		}
		// generate from scratch if destination does not exist
		if (!is_file($destination)) {
			file_put_contents($destination, $sourceContents);
		}
		$body = self::getBodyPostion ($sourceContents);
		if ($body !== false)
		{
			$sourceContents = substr($sourceContents, $body['start'], $body['length']);
			$destinationContents = file_get_contents($destination);
			$body = self::getBodyPostion ($destinationContents);
			$destinationContents = substr_replace ($destinationContents, $sourceContents, $body['start'], $body['length']);
			file_put_contents($destination, $destinationContents);
		}
	}

}

?>