import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAppStore } from './hooks/useAppStore';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Progress } from './components/ui/progress';
import { Toaster } from './components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Switch } from './components/ui/switch';
import { Checkbox } from './components/ui/checkbox';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { toast } from 'sonner';
import { FolderIcon, FileIcon, SettingsIcon, InfoIcon, ArrowLeftIcon, HelpCircleIcon } from 'lucide-react';
import type { ExportSettings, AppMode } from './types';

/**
 * Main App component - Entry point for the Logos Notes Exporter Electron app
 * Provides Basic and Advanced modes for exporting Logos notes to Markdown
 */
const App: React.FC = () => {
  const {
    mode,
    setMode,
    settings,
    isExporting,
    exportProgress,
    exportMessage,
    outputPath,
    lastExportSuccess,
    logMessages,
    setExporting,
    setExportProgress,
    setExportResult,
    addLogMessage,
    clearLog,
    setSettings,
    setSelectedDatabasePath,
    selectedDatabasePath
  } = useAppStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load settings from main process
        const savedData = await window.electronAPI.loadSettings();
        if (savedData) {
          setSettings(savedData.settings);
          // Restore the saved app mode
          setMode(savedData.mode as AppMode);
        }

        // Auto-detect database
        const detectedDb = await window.electronAPI.detectDatabase();
        if (detectedDb) {
          setSelectedDatabasePath(detectedDb);
          addLogMessage(`🔍 Database auto-detected: ${detectedDb}`);
        } else {
          addLogMessage('⚠️ No database auto-detected. Please select manually.');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        addLogMessage('❌ Failed to initialize app');
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load
    
    // Debounce the save operation to avoid excessive writes
    const saveTimeout = setTimeout(async () => {
      try {
        await window.electronAPI.saveSettings(settings);
        console.log('Settings auto-saved');
      } catch (error) {
        console.error('Failed to auto-save settings:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(saveTimeout);
  }, [settings, isInitialized]);

  // Auto-save mode changes
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load
    
    // Save mode changes immediately
    const saveModeChange = async () => {
      try {
        // We need to create a special IPC call for saving mode
        await window.electronAPI.saveMode(mode);
        console.log('Mode auto-saved:', mode);
      } catch (error) {
        console.error('Failed to auto-save mode:', error);
      }
    };

    saveModeChange();
  }, [mode, isInitialized]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      // Prevent shortcuts if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case 'e':
          if (isCtrlOrCmd) {
            event.preventDefault();
            if (!isExporting && selectedDatabasePath) {
              handleExport();
              addLogMessage('⌨️ Export started via keyboard shortcut (Ctrl/Cmd+E)');
            }
          }
          break;
          
        case 'o':
          if (isCtrlOrCmd) {
            event.preventDefault();
            if (lastExportSuccess && outputPath) {
              handleOpenFolder();
              addLogMessage('⌨️ Opened output folder via keyboard shortcut (Ctrl/Cmd+O)');
            }
          }
          break;
          
        case ',':
          if (isCtrlOrCmd) {
            event.preventDefault();
            if (!isExporting) {
              handleModeToggle();
              addLogMessage('⌨️ Mode toggled via keyboard shortcut (Ctrl/Cmd+,)');
            }
          }
          break;
          
        case 'escape':
          if (isExporting) {
            event.preventDefault();
            // TODO: Implement export cancellation
            addLogMessage('⌨️ Export cancellation requested (Escape key)');
            toast.info('Export cancellation not yet implemented');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExporting, selectedDatabasePath, lastExportSuccess, outputPath, mode]);

  // Set up IPC event listeners
  useEffect(() => {
    const unsubscribers = [
      window.electronAPI.onExportProgress((progress) => {
        setExportProgress(progress);
      }),
      
      window.electronAPI.onExportComplete((result) => {
        setExportResult(result);
        if (result.success) {
          toast.success('Export completed successfully!');
        } else {
          toast.error(`Export failed: ${result.error}`);
        }
      }),
      
      window.electronAPI.onExportError((error) => {
        setExporting(false);
        addLogMessage(`❌ Export error: ${error}`);
        toast.error(`Export failed: ${error}`);
      }),
      
      window.electronAPI.onOutputLog((message) => {
        addLogMessage(message);
      }),
      
      window.electronAPI.onSettingsLoaded((loadedSettings) => {
        setSettings(loadedSettings);
      }),
      
      window.electronAPI.onDatabaseDetected((path) => {
        setSelectedDatabasePath(path);
        setSettings({ databasePath: path });
        addLogMessage(`📂 Database detected: ${path}`);
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setExporting(true);
      clearLog();
      addLogMessage('🚀 Starting export...');
      
      const exportSettings: ExportSettings = {
        ...settings,
        databasePath: selectedDatabasePath || settings.databasePath
      };

      await window.electronAPI.startExport(exportSettings);
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLogMessage(`❌ Export failed: ${errorMessage}`);
      toast.error(`Export failed: ${errorMessage}`);
      setExporting(false);
    }
  };

  const handleOpenFolder = async () => {
    if (outputPath) {
      try {
        await window.electronAPI.openOutputFolder(outputPath);
      } catch (error) {
        console.error('Failed to open folder:', error);
        toast.error('Failed to open output folder');
      }
    }
  };

  const handleSelectDatabase = async () => {
    try {
      const path = await window.electronAPI.selectDatabase();
      if (path) {
        setSelectedDatabasePath(path);
        setSettings({ databasePath: path });
        addLogMessage(`📂 Database selected: ${path}`);
        toast.success('Database selected successfully');
      }
    } catch (error) {
      console.error('Failed to select database:', error);
      toast.error('Failed to select database');
    }
  };

  const handleModeToggle = () => {
    const newMode = mode === "basic" ? "advanced" : "basic";
    setMode(newMode);
    addLogMessage(`🔄 Switched to ${newMode} mode`);
  };

  const handleSelectOutputDirectory = async () => {
    try {
      const path = await window.electronAPI.selectOutputDirectory();
      if (path) {
        setSettings({ outputDirectory: path });
        addLogMessage(`📁 Output directory selected: ${path}`);
        toast.success('Output directory selected successfully');
      }
    } catch (error) {
      console.error('Failed to select output directory:', error);
      toast.error('Failed to select output directory');
    }
  };

  const handleRestoreDefaults = () => {
    const defaultSettings = {
      autoDetectDatabase: true,
      outputDirectory: "~/Documents/Logos-Exported-Notes",
      organizeByNotebooks: true,
      includeDateFolders: false,
      createIndexFiles: true,
      skipHighlights: true,
      includeFrontmatter: true,
      includeMetadata: false,
      includeDates: true,
      includeNotebook: true,
      includeId: false,
      dateFormat: "iso" as const,
      dryRun: false,
    };
    setSettings(defaultSettings);
    addLogMessage('🔄 Settings restored to defaults');
    toast.success('Settings restored to defaults');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Logos Notes Exporter...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Toaster />
        
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Logos Notes Exporter</h1>
                <p className="text-sm text-muted-foreground">Convert your Logos notes to Markdown files</p>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleModeToggle}
                      disabled={isExporting}
                    >
                      {mode === "basic" ? (
                        <>
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Advanced
                        </>
                      ) : (
                        <>
                          <ArrowLeftIcon className="h-4 w-4 mr-2" />
                          Basic
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {mode === "basic" 
                      ? "Switch to Advanced mode for all configuration options" 
                      : "Switch to Basic mode for simplified operation"
                    }
                  </TooltipContent>
                </Tooltip>
                <div className="text-xs text-muted-foreground">v1.0.0</div>
              </div>
            </div>
          </div>
        </div>

              {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          {mode === "basic" ? (
            // Basic Mode Layout
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
              
              {/* Left Column - Controls (40%) */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Your Logos Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Convert your Logos notes to Markdown files for use in other applications.
                    </p>
                    
                    {/* Database Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedDatabasePath ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-medium">Database Status</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedDatabasePath ? 'Connected' : 'Not connected'}
                      </p>
                      {selectedDatabasePath && (
                        <p className="text-xs text-muted-foreground break-all">
                          {selectedDatabasePath.split('/').pop()}
                        </p>
                      )}
                    </div>

                    {/* Export Progress */}
                    {isExporting && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{exportProgress}%</span>
                        </div>
                        <Progress value={exportProgress} className="w-full" />
                        <p className="text-xs text-muted-foreground">{exportMessage}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="w-full"
                            onClick={handleExport}
                            disabled={isExporting || !selectedDatabasePath}
                          >
                            {isExporting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Exporting...
                              </>
                            ) : (
                              <>
                                <FileIcon className="h-4 w-4 mr-2" />
                                Export Notes
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convert your Logos notes to Markdown files</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleOpenFolder}
                            disabled={!lastExportSuccess || !outputPath}
                          >
                            <FolderIcon className="h-4 w-4 mr-2" />
                            Open Notes Folder
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open the folder containing exported notes</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleSelectDatabase}
                          >
                            <InfoIcon className="h-4 w-4 mr-2" />
                            Select Database
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Choose a different Logos database file</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Output Log (60%) */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Output Log</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <Textarea
                      value={logMessages.join('\n')}
                      readOnly
                      className="h-full resize-none font-mono text-sm"
                      placeholder="Ready to export..."
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            // Advanced Mode Layout
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
              
              {/* Left Column - Advanced Settings (40%) */}
              <div className="lg:col-span-2 space-y-4 overflow-y-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Advanced Mode Settings</CardTitle>
                      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
                        <DialogTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <HelpCircleIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Show help and documentation</TooltipContent>
                          </Tooltip>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Advanced Mode Help & Documentation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 text-sm">
                            <div>
                              <h3 className="font-semibold mb-2">Database Settings</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong>Auto-detect:</strong> Automatically finds your Logos database in standard locations</li>
                                <li>• <strong>Custom path:</strong> Choose a specific database file manually</li>
                                <li>• Standard locations: macOS ~/Library/Application Support/Logos4/Documents/*/NotesToolManager/notestool.db</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Output Settings</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong>Output Directory:</strong> Where your exported Markdown files will be saved</li>
                                <li>• <strong>Organize by notebooks:</strong> Creates folders matching your Logos notebook structure</li>
                                <li>• <strong>Include date folders:</strong> Groups notes by creation date within notebooks</li>
                                <li>• <strong>Skip highlights:</strong> Only exports text notes and annotations, not highlight-only notes</li>
                                <li>• <strong>Create index files:</strong> Generates README.md files for easy navigation</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Markdown Settings</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong>Include frontmatter:</strong> Adds YAML metadata at the top of each file</li>
                                <li>• <strong>Show metadata in content:</strong> Also displays metadata in the markdown body</li>
                                <li>• <strong>Include dates:</strong> Shows when notes were created and last modified</li>
                                <li>• <strong>Include notebook info:</strong> Shows which notebook and section each note belongs to</li>
                                <li>• <strong>Include note IDs:</strong> Adds unique identifiers for cross-referencing</li>
                                <li>• <strong>Date format:</strong> Choose how dates are displayed (ISO, locale-specific, or short format)</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Testing</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong>Dry run mode:</strong> Preview what would be exported without creating any files</li>
                                <li>• Useful for testing settings before doing a full export</li>
                                <li>• Shows the same output as a real export in the log</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• <strong>Ctrl/Cmd + E:</strong> Start export</li>
                                <li>• <strong>Ctrl/Cmd + O:</strong> Open output folder (after successful export)</li>
                                <li>• <strong>Ctrl/Cmd + ,:</strong> Toggle between Basic and Advanced modes</li>
                                <li>• <strong>Escape:</strong> Cancel export (if running)</li>
                              </ul>
                            </div>
                            
                            <div className="border-t pt-4">
                              <h3 className="font-semibold mb-2">Tips</h3>
                              <ul className="space-y-1 text-muted-foreground ml-4">
                                <li>• Start with a dry run to preview your export before creating files</li>
                                <li>• Use the default settings for most situations - they work well for most users</li>
                                <li>• The auto-detect database feature works for standard Logos installations</li>
                                <li>• All operations are read-only - your original Logos data is never modified</li>
                                <li>• Existing exported files will be overwritten if you export to the same location</li>
                              </ul>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Database Settings Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold border-b pb-1">Database Settings</h3>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Choose how to locate your Logos database
                        </p>
                        
                        {/* Auto-detect toggle */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Auto-detect database</label>
                            <p className="text-xs text-muted-foreground">Automatically find Logos database</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Switch
                                checked={settings.autoDetectDatabase}
                                onCheckedChange={(checked) => setSettings({ autoDetectDatabase: checked })}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Enable automatic database detection in standard Logos locations</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Custom database path */}
                        {!settings.autoDetectDatabase && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Custom Database Path</label>
                            <div className="flex gap-2">
                              <Input
                                value={selectedDatabasePath || ''}
                                placeholder="Select database file..."
                                readOnly
                                className="flex-1"
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleSelectDatabase}
                                  >
                                    Browse...
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Choose a different Logos database file</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )}

                        {/* Database Status */}
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <div className={`w-2 h-2 rounded-full ${selectedDatabasePath ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="text-xs font-medium">
                            {selectedDatabasePath ? 'Connected' : 'Not connected'}
                          </span>
                          {selectedDatabasePath && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {selectedDatabasePath.split('/').pop()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Output Settings Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold border-b pb-1">Output Settings</h3>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Configure where and how files are organized
                        </p>
                        
                        {/* Output Directory */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Output Directory</label>
                          <div className="flex gap-2">
                            <Input
                              value={settings.outputDirectory}
                              onChange={(e) => setSettings({ outputDirectory: e.target.value })}
                              placeholder="~/Documents/Logos-Exported-Notes"
                              className="flex-1"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleSelectOutputDirectory}
                                >
                                  Browse...
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Choose where to save the exported files</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Organization Options */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">File Organization</h4>
                          
                          {/* Organize by notebooks */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Organize by notebooks</label>
                              <p className="text-xs text-muted-foreground">Group notes by their notebook organization</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.organizeByNotebooks}
                                  onCheckedChange={(checked) => setSettings({ organizeByNotebooks: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Group notes by their notebook organization</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Include date folders */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Include date folders</label>
                              <p className="text-xs text-muted-foreground">Create subfolders organized by note creation dates</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeDateFolders}
                                  onCheckedChange={(checked) => setSettings({ includeDateFolders: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Create subfolders organized by note creation dates</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Skip highlights */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Skip highlights</label>
                              <p className="text-xs text-muted-foreground">Export only text notes, not highlights</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.skipHighlights}
                                  onCheckedChange={(checked) => setSettings({ skipHighlights: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Export only text notes, not highlights</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Create index files */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Create index files</label>
                              <p className="text-xs text-muted-foreground">Generate README.md files in each folder</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.createIndexFiles}
                                  onCheckedChange={(checked) => setSettings({ createIndexFiles: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Generate README.md files in each folder for navigation</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Markdown Settings Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold border-b pb-1">Markdown Settings</h3>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Control how notes are converted to Markdown
                        </p>
                        
                        {/* Frontmatter and content options */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content Options</h4>
                          
                          {/* Include frontmatter */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Include frontmatter</label>
                              <p className="text-xs text-muted-foreground">Add YAML metadata to the top of each file</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeFrontmatter}
                                  onCheckedChange={(checked) => setSettings({ includeFrontmatter: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Add YAML metadata to the top of each file</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Show metadata in content */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Show metadata in content</label>
                              <p className="text-xs text-muted-foreground">Include metadata in the markdown body</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeMetadata}
                                  onCheckedChange={(checked) => setSettings({ includeMetadata: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Include metadata in the markdown content instead of only in frontmatter</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Include dates */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Include dates</label>
                              <p className="text-xs text-muted-foreground">Include creation and modification dates</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeDates}
                                  onCheckedChange={(checked) => setSettings({ includeDates: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Include creation and modification dates in exported notes</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Include notebook info */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Include notebook info</label>
                              <p className="text-xs text-muted-foreground">Include notebook and section information</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeNotebook}
                                  onCheckedChange={(checked) => setSettings({ includeNotebook: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Include notebook and section information in exported notes</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Include note IDs */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Include note IDs</label>
                              <p className="text-xs text-muted-foreground">Include unique note identifiers</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox
                                  checked={settings.includeId}
                                  onCheckedChange={(checked) => setSettings({ includeId: !!checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Include unique note identifiers for reference</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Date format selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date format</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Select
                                value={settings.dateFormat}
                                onValueChange={(value: "iso" | "locale" | "short") => setSettings({ dateFormat: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="iso">ISO (2024-01-15T10:30:00Z)</SelectItem>
                                  <SelectItem value="locale">Locale (1/15/2024, 10:30 AM)</SelectItem>
                                  <SelectItem value="short">Short (Jan 15, 2024)</SelectItem>
                                </SelectContent>
                              </Select>
                            </TooltipTrigger>
                            <TooltipContent>Choose how dates are formatted in exported notes</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Dry run option */}
                        <div className="space-y-3 pt-3 border-t">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Testing</h4>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Dry run mode</label>
                              <p className="text-xs text-muted-foreground">Preview what would be exported without creating files</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch
                                  checked={settings.dryRun}
                                  onCheckedChange={(checked) => setSettings({ dryRun: checked })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Preview what would be exported without creating files</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1" onClick={handleRestoreDefaults}>
                              🔄 Restore Defaults
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reset all settings to their default values</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" className="flex-1" onClick={handleExport} disabled={isExporting || !selectedDatabasePath}>
                              {settings.dryRun ? '🔍 Preview Export' : '📤 Export'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {settings.dryRun 
                              ? 'Preview what would be exported without creating files' 
                              : 'Convert your Logos notes to Markdown files'
                            }
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1" onClick={handleOpenFolder} disabled={!lastExportSuccess || !outputPath}>
                              📁 Open Notes Folder
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open the folder containing exported notes</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Output Log (60%) */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Output Log</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <Textarea
                      value={logMessages.join('\n')}
                      readOnly
                      className="h-full resize-none font-mono text-sm"
                      placeholder="Ready to export..."
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
    </div>
  </TooltipProvider>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}