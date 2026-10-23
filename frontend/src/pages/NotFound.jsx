import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import { buttonStyles } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page does not exist or has moved."
        action={<Link to="/" className={buttonStyles('primary', 'md')}>Back to home</Link>}
      />
    </div>
  );
}