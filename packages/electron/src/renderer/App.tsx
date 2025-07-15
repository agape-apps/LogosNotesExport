import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/button';

const App = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-xl p-8 max-w-md mx-4 border">
        <h1 className="text-3xl font-bold text-card-foreground mb-4">Logos Notes Exporter</h1>
        <p className="text-muted-foreground mb-6">
          ShadcnUI is now successfully installed and working! 🎉
        </p>
        <div className="space-y-2">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
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