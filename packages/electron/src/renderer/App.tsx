import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAppStore } from './hooks/useAppStore';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Progress } from './components/ui/progress';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { FolderIcon, FileIcon, SettingsIcon, InfoIcon } from 'lucide-react';
import type { ExportSettings } from './types';

/**
 * Main App component - Entry point for the Logos Notes Exporter Electron app
 * Provides Basic and Advanced modes for exporting Logos notes to Markdown
 */
const App: React.FC = () => {
  const {
    mode,
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

  // Initialize app on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load settings from main process
        const savedData = await window.electronAPI.loadSettings();
        if (savedData) {
          setSettings(savedData.settings);
        }

        // Auto-detect database
        const detectedDb = await window.electronAPI.detectDatabase();
        if (detectedDb) {
          setSelectedDatabasePath(detectedDb);
          setSettings({ databasePath: detectedDb });
          addLogMessage(`🔍 Database detected: ${detectedDb}`);
        } else {
          addLogMessage('⚠️ No database auto-detected. Please select manually.');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        addLogMessage(`❌ Initialization failed: ${error.message}`);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

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
      addLogMessage(`❌ Export failed: ${error.message}`);
      toast.error(`Export failed: ${error.message}`);
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
              <Button variant="outline" size="sm" disabled>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Advanced
              </Button>
              <div className="text-xs text-muted-foreground">v1.0.0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
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
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenFolder}
                    disabled={!lastExportSuccess || !outputPath}
                  >
                    <FolderIcon className="h-4 w-4 mr-2" />
                    Open Notes Folder
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleSelectDatabase}
                  >
                    <InfoIcon className="h-4 w-4 mr-2" />
                    Select Database
                  </Button>
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
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}