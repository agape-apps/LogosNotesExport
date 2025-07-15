import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/button';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg mx-4 border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Logos Notes Exporter</h1>
          <p className="text-gray-600 text-lg">
            Phase 1 Infrastructure Complete! 🎉
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              📤 Export Notes
            </Button>
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg font-medium">
              📁 Open Folder
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
              ✅ Test Success
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
              ⚙️ Settings
            </Button>
          </div>
          
          <Button 
            variant="secondary" 
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            🔧 Advanced Mode
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ShadcnUI + TailwindCSS v4 + Zustand + IPC Ready!
          </p>
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