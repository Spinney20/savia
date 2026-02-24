import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { RefreshCcw, AlertOctagon } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
          <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-6">
            <AlertOctagon size={32} className="text-danger" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ceva nu a mers bine</h2>
          <p className="text-sm text-gray-500 mb-2 text-center max-w-md">
            A apărut o eroare neașteptată. Încercați să reîncărcați pagina.
          </p>
          {this.state.error && (
            <pre className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 mb-6 max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button icon={RefreshCcw} onClick={() => window.location.reload()}>
            Reîncarcă pagina
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
